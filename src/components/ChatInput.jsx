import { useState } from 'react'

function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const value = text.trim()
    if (!value || disabled) return
    onSend(value)
    setText('')
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="w-full flex items-center gap-2 bg-white shadow-lg rounded-full px-4 py-3">
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="พิมพ์ข้อความของคุณ..."
          className="flex-1 bg-transparent text-sm text-[#374151] outline-none placeholder:text-[#9CA3AF]"
        />

        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#FFB6C1] text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          <i className="bi bi-send" />
        </button>
      </div>
    </form>
  )
}

export default ChatInput
