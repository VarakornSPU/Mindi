import MindiLogo from '../assets/MindiLogo.png'
import ChatBox from '../components/chat/ChatBox'
import ChatInput from '../components/chat/ChatInput'
import { useChat } from '../hooks/useChat'

function ChatPage({ onBack }) {
  const { messages, isTyping, isSending, sendUserMessage } = useChat()

  return (
    <section className="screen screen--chat">
      <div className="mindi-device mindi-device--chat">
        <header className="chat-header">
          <button
            className="icon-button"
            type="button"
            onClick={onBack}
            aria-label="กลับไปหน้าแรก"
          >
            <i className="bi bi-arrow-left" aria-hidden="true" />
          </button>

          <div className="chat-header__brand">
            <img
              className="chat-header__logo"
              src={MindiLogo}
              alt="Mindi logo"
            />
            <div>
              <h2 className="chat-header__title">Mindi</h2>
              <p className="chat-header__subtitle">พร้อมรับฟังคุณเสมอ</p>
            </div>
          </div>

          <div className="chat-header__spacer" aria-hidden="true" />
        </header>

        <div className="chat-body">
          <div className="chat-intro">
            <span className="chat-intro__pill">
              ค่อย ๆ เล่าตามจังหวะของคุณได้เลย
            </span>
          </div>

          <ChatBox isTyping={isTyping} messages={messages} />
        </div>

        <footer className="chat-footer">
          <ChatInput disabled={isSending} onSend={sendUserMessage} />
        </footer>
      </div>
    </section>
  )
}

export default ChatPage
