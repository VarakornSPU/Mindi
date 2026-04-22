const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })

function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="animate-message-in flex justify-end">
        <div className="bg-pink-200 px-4 py-2 rounded-2xl shadow-md max-w-[65%]">
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#374151]">{message.content}</p>
          <p className="mt-1 text-right text-xs text-[#8B9AB3]">{formatTime(message.createdAt)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-message-in flex justify-start">
      <div className="bg-white shadow-md px-4 py-2 rounded-2xl max-w-[65%]">
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#374151]">{message.content}</p>
        <p className="mt-1 text-xs text-[#9CA3AF]">{formatTime(message.createdAt)}</p>
      </div>
    </div>
  )
}

export default MessageBubble
