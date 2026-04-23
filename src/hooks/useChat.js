import { useEffect, useMemo, useState } from 'react'

const CHATS_STORAGE_KEY = 'mindi_chats'
const MESSAGES_STORAGE_KEY = 'mindi_messages'

const LEGACY_EN_FALLBACK =
  'Thanks for sharing. I am here with you. Take your time and continue when you feel ready.'
const TH_FALLBACK_REPLY =
  'ขอบคุณที่เล่าให้ฟังนะ เราอยู่ตรงนี้เป็นเพื่อนคุณเสมอ ค่อยๆ เล่าต่อได้ตามจังหวะที่สบายใจ'

const createId = () =>
  globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`

const parseJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const createChatRecord = (title = 'แชทใหม่') => {
  const now = new Date().toISOString()
  return {
    id: createId(),
    title,
    createdAt: now,
    updatedAt: now,
  }
}

const createMessageRecord = (role, content) => ({
  id: createId(),
  role,
  content,
  createdAt: new Date().toISOString(),
})

// ฟังก์ชันโหลดแชทเริ่มต้น เพื่อเลี่ยงการใช้ setState ใน useEffect
const loadInitialChats = () => {
  const chats = parseJson(localStorage.getItem(CHATS_STORAGE_KEY), [])
  if (chats.length === 0) {
    return [createChatRecord('แชทใหม่')]
  }
  return chats
}

const saveChats = (chats) => localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats))

const loadMessagesByChat = () => {
  const raw = parseJson(localStorage.getItem(MESSAGES_STORAGE_KEY), {})
  return Object.fromEntries(
    Object.entries(raw).map(([chatId, messages]) => [
      chatId,
      Array.isArray(messages)
        ? messages.map((message) =>
            message?.content === LEGACY_EN_FALLBACK
              ? { ...message, content: TH_FALLBACK_REPLY }
              : message,
          )
        : [],
    ]),
  )
}

const saveMessagesByChat = (value) =>
  localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(value))

const getRagReply = async (userMessage, chatHistory) => {
  console.log('[RAG] All env vars:', import.meta.env)
  const ragUrl = String(import.meta.env.VITE_RAG_API_URL || '').trim()
  console.log('[RAG] VITE_RAG_API_URL value:', ragUrl)
  if (!ragUrl) {
    console.warn('[RAG] No RAG_API_URL configured in .env')
    return null
  }

  try {
    console.log('[RAG] Sending request to:', ragUrl)
    const response = await fetch(ragUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: userMessage,
        history: chatHistory 
      }),
    })
    
    if (!response.ok) {
      console.error('[RAG] Response error:', response.status, response.statusText)
      return null
    }
    
    const payload = await response.json().catch((e) => {
      console.error('[RAG] JSON parse error:', e)
      return {}
    })
    
    console.log('[RAG] Received reply:', payload.reply?.substring(0, 100))
    return String(payload.reply || payload.message || '').trim() || null
  } catch (error) {
    console.error('[RAG] Fetch error:', error.message)
    return null
  }
}

export const useChat = ({ token }) => {
  const [chats, setChats] = useState(() => loadInitialChats())
  // กำหนด ID เริ่มต้นทันทีตั้งแต่อยู่ใน State เพื่อเลี่ยง Error บรรทัด 115 เดิม
  const [currentChatId, setCurrentChatId] = useState(() => loadInitialChats()[0]?.id || null)
  const [messagesByChat, setMessagesByChat] = useState(() => loadMessagesByChat())
  const [isTyping, setIsTyping] = useState(false)

  // จัดเก็บข้อมูลลง LocalStorage เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    saveChats(chats)
  }, [chats])

  useEffect(() => {
    saveMessagesByChat(messagesByChat)
  }, [messagesByChat])

  // คำนวณแชทปัจจุบันและข้อความโดยใช้ useMemo
  const messages = useMemo(() => messagesByChat[currentChatId] || [], [messagesByChat, currentChatId])

  const currentChat = useMemo(() => {
    const chat = chats.find((item) => item.id === currentChatId) || null
    return chat ? { ...chat, messages } : null
  }, [chats, currentChatId, messages])

  const createNewChat = async () => {
    if (!token) return
    const nextChat = createChatRecord('แชทใหม่')
    setChats((prev) => [nextChat, ...prev])
    setCurrentChatId(nextChat.id)
  }

  const selectChat = (chatId) => setCurrentChatId(chatId)

  const deleteChat = async (chatId) => {
    if (!token) return
    setChats((prev) => {
      const next = prev.filter((chat) => chat.id !== chatId)
      // เปลี่ยนแชทปัจจุบันทันทีเมื่อมีการลบ โดยไม่ต้องผ่าน useEffect
      if (currentChatId === chatId) {
        setCurrentChatId(next[0]?.id || null)
      }
      return next
    })
    setMessagesByChat((prev) => {
      const next = { ...prev }
      delete next[chatId]
      return next
    })
  }

  const sendMessage = async (content) => {
    const messageText = String(content || '').trim()
    if (!currentChatId || !messageText) return

    const userMessage = createMessageRecord('user', messageText)
    const updatedMessages = [...messages, userMessage]

    setMessagesByChat((prev) => ({
      ...prev,
      [currentChatId]: updatedMessages,
    }))

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== currentChatId) return chat
        const nextTitle = chat.title === 'แชทใหม่' ? messageText.slice(0, 28) : chat.title
        return { ...chat, title: nextTitle, updatedAt: userMessage.createdAt }
      }),
    )

    setIsTyping(true)
    const ragReply = await getRagReply(messageText, updatedMessages)

    setTimeout(() => {
      const botMessage = createMessageRecord('bot', ragReply || TH_FALLBACK_REPLY)
      setMessagesByChat((prev) => ({
        ...prev,
        [currentChatId]: [...updatedMessages, botMessage],
      }))
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId ? { ...chat, updatedAt: botMessage.createdAt } : chat,
        ),
      )
      setIsTyping(false)
    }, 500)
  }

  return {
    chats,
    currentChatId,
    currentChat,
    messages,
    isTyping,
    createNewChat,
    selectChat,
    deleteChat,
    sendMessage,
  }
}