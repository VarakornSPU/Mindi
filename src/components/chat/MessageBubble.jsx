function MessageBubble({ role, message, rhythm, time }) {
  const isUserMessage = role === 'user'

  return (
    <div
      className={`message-row ${isUserMessage ? 'message-row--user' : 'message-row--bot'} ${rhythm || ''}`.trim()}
    >
      <article
        className={`message-bubble ${isUserMessage ? 'message-bubble--user user-bubble' : 'message-bubble--bot bot-bubble'}`}
        data-role={role}
      >
        <span className="message-bubble__author">
          {isUserMessage ? 'คุณ' : 'Mindi'}
        </span>
        <p className="message-bubble__text">{message}</p>
        <span className="message-bubble__time">{time}</span>
      </article>
    </div>
  )
}

export default MessageBubble
