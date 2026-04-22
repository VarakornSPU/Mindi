import { useEffect, useMemo, useRef, useState } from 'react'

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

const loadChats = () => parseJson(localStorage.getItem(CHATS_STORAGE_KEY), [])
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

const getRagReply = async (userMessage) => {
  const ragUrl = String(import.meta.env.VITE_RAG_API_URL || '').trim()
  if (!ragUrl) return null

  try {
    const response = await fetch(ragUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: userMessage }),
    })

    if (!response.ok) return null

    const payload = await response.json().catch(() => ({}))
    return String(payload.reply || payload.message || '').trim() || null
  } catch {
    return null
  }
}

export const useChat = ({ token }) => {
  const [chats, setChats] = useState(() => loadChats())
  const [currentChatId, setCurrentChatId] = useState(() => loadChats()[0]?.id || null)
  const [messagesByChat, setMessagesByChat] = useState(() => loadMessagesByChat())
  const [isTyping, setIsTyping] = useState(false)
  const hasCreatedInitialChat = useRef(false)

  useEffect(() => {
    saveChats(chats)
  }, [chats])

  useEffect(() => {
    saveMessagesByChat(messagesByChat)
  }, [messagesByChat])

  useEffect(() => {
    if (!token) {
      hasCreatedInitialChat.current = false
      return
    }

    if (chats.length === 0 && !hasCreatedInitialChat.current) {
      hasCreatedInitialChat.current = true
      const firstChat = createChatRecord('แชทใหม่')
      setChats([firstChat])
      setCurrentChatId(firstChat.id)
      return
    }

    if (!currentChatId || !chats.some((chat) => chat.id === currentChatId)) {
      setCurrentChatId(chats[0]?.id || null)
    }
  }, [token, chats, currentChatId])

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
    if (!token || !currentChatId || !messageText) return

    const userMessage = createMessageRecord('user', messageText)

    setMessagesByChat((prev) => ({
      ...prev,
      [currentChatId]: [...(prev[currentChatId] || []), userMessage],
    }))

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== currentChatId) return chat
        const nextTitle = chat.title === 'แชทใหม่' ? messageText.slice(0, 28) || 'แชทใหม่' : chat.title
        return { ...chat, title: nextTitle, updatedAt: userMessage.createdAt }
      }),
    )

    setIsTyping(true)
    const ragReply = await getRagReply(messageText)

    window.setTimeout(() => {
      const botMessage = createMessageRecord('bot', ragReply || TH_FALLBACK_REPLY)

      setMessagesByChat((prev) => ({
        ...prev,
        [currentChatId]: [...(prev[currentChatId] || []), botMessage],
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
