import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

const getRhythmClass = (messages, index) => {
  if (index === 0) return 'message-row--opening'
  const previousMessage = messages[index - 1]
  if (previousMessage?.role === messages[index].role) return 'message-row--clustered'
  return index % 3 === 0 ? 'message-row--pause' : 'message-row--breathing'
}

function ChatBox({ messages, isTyping }) {
  const endOfMessagesRef = useRef(null)

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }, [messages, isTyping])

  return (
    <div className="chat-box" aria-live="polite">
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message.content} 
          role={message.role}
          rhythm={getRhythmClass(messages, index)}
          time={message.createdAt} 
        />
      ))}
      {isTyping ? <TypingIndicator /> : null}
      <div ref={endOfMessagesRef} />
    </div>
  )
}

export default ChatBox