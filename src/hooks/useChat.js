import { useEffect, useMemo, useState } from 'react'

const CHATS_STORAGE_KEY = 'mindi_chats'
const MESSAGES_STORAGE_KEY = 'mindi_messages'

const getChatsKey = (userId) => (userId ? `${CHATS_STORAGE_KEY}_${userId}` : CHATS_STORAGE_KEY)
const getMessagesKey = (userId) => (userId ? `${MESSAGES_STORAGE_KEY}_${userId}` : MESSAGES_STORAGE_KEY)

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

const createChatRecord = (title = 'แชทใหม่', id = null) => {
  const now = new Date().toISOString()
  return {
    id: id || createId(),
    title,
    createdAt: now,
    updatedAt: now,
  }
}

const createMessageRecord = (role, content, id = null) => ({
  id: id || createId(),
  role,
  content,
  createdAt: new Date().toISOString(),
})

const loadInitialChats = (userId) => {
  const key = getChatsKey(userId)
  const chats = parseJson(localStorage.getItem(key), [])
  if (chats.length === 0) {
    return [createChatRecord('แชทใหม่')]
  }
  return chats
}

const saveChats = (chats, userId) => localStorage.setItem(getChatsKey(userId), JSON.stringify(chats))

const loadMessagesByChat = (userId) => {
  const raw = parseJson(localStorage.getItem(getMessagesKey(userId)), {})
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

const saveMessagesByChat = (value, userId) =>
  localStorage.setItem(getMessagesKey(userId), JSON.stringify(value))

const API_BASE_URL = 'http://localhost:8000'

const getRagReply = async (userMessage, chatHistory) => {
  const ragUrl = String(import.meta.env.VITE_RAG_API_URL || '').trim()
  if (!ragUrl) return null

  try {
    const response = await fetch(ragUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: userMessage,
        history: chatHistory 
      }),
    })
    if (!response.ok) return null
    const payload = await response.json().catch(() => ({}))
    return String(payload.reply || payload.message || '').trim() || null
  } catch (error) {
    console.error('RAG Error:', error)
    return null
  }
}

export const useChat = ({ token, userId }) => {
  const [chats, setChats] = useState(() => loadInitialChats(userId))
  const [currentChatId, setCurrentChatId] = useState(() => loadInitialChats(userId)[0]?.id || null)
  const [messagesByChat, setMessagesByChat] = useState(() => loadMessagesByChat(userId))
  const [isTyping, setIsTyping] = useState(false)
  const [isLoadingChats, setIsLoadingChats] = useState(false)

  useEffect(() => {
    saveChats(chats, userId)
  }, [chats, userId])

  useEffect(() => {
    saveMessagesByChat(messagesByChat, userId)
  }, [messagesByChat, userId])

  // ✅ จุดแก้ที่ 1: การจัดการสถานะตอน Login และ Logout
  useEffect(() => {
    if (token && userId) {
      loadChatsFromBackend()
    } else {
      // เวลา Logout: ล้างค่าทุกอย่างทิ้งให้เป็นหน้าจอเปล่าๆ ป้องกันแชทรั่วไหลไปคนถัดไป
      const freshChat = createChatRecord('แชทใหม่')
      setChats([freshChat])
      setCurrentChatId(freshChat.id)
      setMessagesByChat({})
      
      // ลบ LocalStorage ของ Guest ทิ้ง เพื่อเคลียร์ขยะ
      localStorage.removeItem(CHATS_STORAGE_KEY)
      localStorage.removeItem(MESSAGES_STORAGE_KEY)
    }
  }, [token, userId])

  useEffect(() => {
    if (currentChatId && token && userId) {
      loadMessagesFromBackend(currentChatId)
    }
  }, [currentChatId, token, userId])

  const loadChatsFromBackend = async () => {
    if (!token || !userId) return
    try {
      setIsLoadingChats(true)
      const response = await fetch(`${API_BASE_URL}/chat/sessions?user_id=${userId}&token=${token}`)
      if (response.ok) {
        const data = await response.json()
        if (data.sessions && data.sessions.length > 0) {
          const backendChats = data.sessions.map(session => ({
            id: session._id,
            title: session.title,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
          }))
          setChats(backendChats)
          setCurrentChatId(backendChats[0].id)
        } else {
          // ✅ จุดแก้ที่ 2: ถ้า User ล็อกอินมาแต่ยังไม่เคยมีแชทใน Database
          // บังคับเคลียร์ State และยิง API สร้างแชทแรกลง Database เลย
          setChats([])
          setCurrentChatId(null)
          
          const title = 'แชทใหม่'
          const createRes = await fetch(`${API_BASE_URL}/chat/sessions?user_id=${userId}&token=${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
          })
          
          if (createRes.ok) {
            const createData = await createRes.json()
            const nextChat = createChatRecord(title, createData.session_id)
            setChats([nextChat])
            setCurrentChatId(nextChat.id)
            setMessagesByChat(prev => ({ ...prev, [nextChat.id]: [] }))
          }
        }
      }
    } catch (error) {
      console.error('Error loading chats:', error)
    } finally {
      setIsLoadingChats(false)
    }
  }

  const loadMessagesFromBackend = async (sessionId) => {
    if (!token || !userId || !sessionId) return
    try {
      const response = await fetch(`${API_BASE_URL}/chat/messages/${sessionId}?user_id=${userId}&token=${token}`)
      if (response.ok) {
        const data = await response.json()
        if (data.messages) {
          const messages = data.messages.map(msg => ({
            id: msg._id,
            role: msg.role,
            content: msg.content,
            createdAt: msg.createdAt
          }))
          setMessagesByChat(prev => ({ ...prev, [sessionId]: messages }))
        }
      } else if (response.status === 403 || response.status === 404) {
        setMessagesByChat(prev => ({ ...prev, [sessionId]: [] }))
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const messages = useMemo(() => messagesByChat[currentChatId] || [], [messagesByChat, currentChatId])

  const currentChat = useMemo(() => {
    const chat = chats.find((item) => item.id === currentChatId) || null
    return chat ? { ...chat, messages } : null
  }, [chats, currentChatId, messages])

  // ✅ จุดแก้ที่ 3: ปรับปรุงฟังก์ชันสร้างแชท
  const createNewChat = async () => {
    const title = 'แชทใหม่'
    
    // ถ้ายังไม่ล็อกอิน ให้สร้างแบบ Local ธรรมดา
    if (!token || !userId) {
      const nextChat = createChatRecord(title)
      setChats((prev) => [nextChat, ...prev])
      setCurrentChatId(nextChat.id)
      return
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/chat/sessions?user_id=${userId}&token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      })

      if (!response.ok) throw new Error('Failed to create session')

      const data = await response.json()
      const nextChat = createChatRecord(title, data.session_id) // ใช้ ID จริงจาก Database

      setChats((prev) => [nextChat, ...prev])
      setCurrentChatId(nextChat.id)
      setMessagesByChat(prev => ({ ...prev, [nextChat.id]: [] }))
    } catch (error) {
      console.error('Error creating chat:', error)
    }
  }

  const selectChat = (chatId) => setCurrentChatId(chatId)

  const deleteChat = async (chatId) => {
    if (token && userId) {
      try {
        await fetch(`${API_BASE_URL}/chat/sessions/${chatId}?user_id=${userId}&token=${token}`, {
          method: 'DELETE'
        })
      } catch (error) {
        console.error('Error deleting chat:', error)
      }
    }
    
    setChats((prev) => {
      const next = prev.filter((chat) => chat.id !== chatId)
      if (currentChatId === chatId) setCurrentChatId(next[0]?.id || null)
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

    if (token && userId) {
      fetch(`${API_BASE_URL}/chat/messages?user_id=${userId}&token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          session_id: currentChatId,
          role: 'user',
          content: messageText,
          message_type: 'text'
        })
      }).catch(console.error)
    }

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
      
      if (token && userId) {
        fetch(`${API_BASE_URL}/chat/messages?user_id=${userId}&token=${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            session_id: currentChatId,
            role: 'bot',
            content: botMessage.content,
            message_type: 'text'
          })
        }).catch(console.error)
      }
      
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
    isLoadingChats,
    createNewChat,
    selectChat,
    deleteChat,
    sendMessage,
  }
}