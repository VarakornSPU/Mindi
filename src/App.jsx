import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatLayout from './components/ChatLayout'
import ArticleModal from './components/ArticleModal'
import AuthPage from './components/AuthPage'
import { useAppContext } from './context/AppContext'
import { articlesMock } from './mock/articlesMock'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isArticleOpen, setArticleOpen] = useState(false)

  const { auth, chat } = useAppContext()
  const {
    chats,
    currentChatId,
    currentChat,
    isTyping,
    createNewChat,
    selectChat,
    deleteChat,
    sendMessage,
  } = chat

  if (!auth.isAuthenticated) {
    return <AuthPage onLogin={auth.login} onRegister={auth.register} />
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8F9FC] text-[#4B5563]">
      <Sidebar
        user={auth.currentUser}
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={(chatId) => {
          selectChat(chatId)
          setSidebarOpen(false)
        }}
        onDeleteChat={deleteChat}
        onNewChat={() => {
          createNewChat()
          setSidebarOpen(false)
        }}
        onOpenArticles={() => {
          setArticleOpen(true)
          setSidebarOpen(false)
        }}
        onLogout={auth.logout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <ChatLayout
        chat={currentChat}
        isTyping={isTyping}
        onSend={sendMessage}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      <ArticleModal isOpen={isArticleOpen} articles={articlesMock} onClose={() => setArticleOpen(false)} />
    </div>
  )
}

export default App
