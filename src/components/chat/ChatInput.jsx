import { useEffect, useRef, useState } from 'react'

function ChatInput({ onSend, disabled = false }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    const textareaElement = textareaRef.current

    if (!textareaElement) {
      return
    }

    textareaElement.style.height = '0px'
    textareaElement.style.height = `${Math.min(textareaElement.scrollHeight, 112)}px`
  }, [value])

  const submitMessage = async () => {
    const didSend = await onSend(value)

    if (didSend) {
      setValue('')
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    void submitMessage()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submitMessage()
    }
  }

  return (
    <form className="chat-input-shell" onSubmit={handleSubmit}>
      <div className="chat-input">
        <textarea
          ref={textareaRef}
          className="chat-input__field"
          rows="1"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="เล่าให้ Mindi ฟังได้เลย"
          aria-label="พิมพ์ข้อความ"
        />

        <button
          className="chat-input__send"
          type="submit"
          disabled={disabled || !value.trim()}
          aria-label="ส่งข้อความ"
        >
          <i className="bi bi-send-fill" aria-hidden="true" />
        </button>
      </div>

      <p className="chat-input__hint">เริ่มจากสิ่งที่อยู่ในใจตอนนี้ก็พอ</p>
    </form>
  )
}

export default ChatInput
