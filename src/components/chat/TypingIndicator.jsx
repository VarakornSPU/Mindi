function TypingIndicator() {
  return (
    <div className="message-row message-row--bot">
      <div className="typing-shell" aria-label="Mindi กำลังพิมพ์">
        <div className="typing-indicator" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className="typing-indicator__text">Mindi กำลังพิมพ์</span>
      </div>
    </div>
  )
}

export default TypingIndicator
