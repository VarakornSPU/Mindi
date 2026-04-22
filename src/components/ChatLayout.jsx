import { useEffect, useRef } from 'react'
import ChatInput from './ChatInput'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

function ChatLayout({ chat, isTyping, onSend, onOpenSidebar }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [chat?.messages, isTyping])

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FC]">
      <div className="px-4 py-4 border-b bg-white/70 backdrop-blur-md md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenSidebar}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#7C8FB0] shadow-md md:hidden"
              aria-label="Open sidebar"
            >
              <i className="bi bi-list text-lg" />
            </button>

            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D6C7F0]/50 text-[#6E7FA5] shadow-md">
              <i className="bi bi-person-circle text-lg" />
            </div>

            <div>
              <h1 className="text-xl font-semibold text-[#374151]">Mindi</h1>
              <p className="text-sm text-[#9CA3AF]">พร้อมรับฟังคุณเสมอ</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6 lg:px-12">
        <div className="mb-4 flex justify-center">
          <span className="rounded-2xl bg-white/80 px-4 py-1 text-xs text-[#93A2BC] shadow-md">วันนี้</span>
        </div>

        <div className="flex flex-col gap-4 w-full">
          {chat?.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="px-4 pb-4 md:px-6">
        <ChatInput onSend={onSend} disabled={isTyping} />
      </div>
    </div>
  )
}

export default ChatLayout
