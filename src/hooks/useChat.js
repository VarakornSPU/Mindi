import { useState } from 'react'
import { sendMessage } from '../services/chatService'
import { createMessage, formatMessageText } from '../utils/formatMessage'

const fallbackReply =
  'ตอนนี้ Mindi ยังอยู่ตรงนี้นะ ลองส่งข้อความอีกครั้งได้เสมอ'

export const useChat = () => {
  // เปลี่ยนค่าเริ่มต้นเป็น Array ว่าง (หรือถ้าอยากให้บอททักก่อน ให้ใส่ object ข้อความลงไปแทน)
  const [messages, setMessages] = useState([
    createMessage({
      role: 'bot',
      message: 'สวัสดีค่ะ Mindi พร้อมรับฟังคุณเสมอนะคะ วันนี้มีเรื่องอะไรอยากเล่าให้ฟังไหม?',
    })
  ])
  
  const [isTyping, setIsTyping] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const sendUserMessage = async (rawMessage) => {
    const content = formatMessageText(rawMessage)

    if (!content || isSending) {
      return false
    }

    const userMessage = createMessage({
      role: 'user',
      message: content,
    })

    setMessages((currentMessages) => [...currentMessages, userMessage])
    setIsSending(true)
    setIsTyping(true)

    try {
      const botResponse = await sendMessage(content)

      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage(botResponse),
      ])
    } catch {
      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage({
          role: 'bot',
          message: fallbackReply,
        }),
      ])
    } finally {
      setIsTyping(false)
      setIsSending(false)
    }

    return true
  }

  return {
    messages,
    isTyping,
    isSending,
    sendUserMessage,
  }
}