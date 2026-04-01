import { useEffect, useState } from 'react'
import ChatPage from './pages/ChatPage'
import Home from './pages/Home'

const resolvePageFromHash = () =>
  typeof window !== 'undefined' && window.location.hash === '#chat'
    ? 'chat'
    : 'home'

function App() {
  const [currentPage, setCurrentPage] = useState(resolvePageFromHash)

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(resolvePageFromHash())
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  const navigateTo = (page) => {
    window.location.hash = page === 'chat' ? 'chat' : 'home'
    setCurrentPage(page)
  }

  return (
    <main className="app-shell">
      <div className="app-aurora app-aurora--blue" aria-hidden="true" />
      <div className="app-aurora app-aurora--pink" aria-hidden="true" />
      <div className="app-grain" aria-hidden="true" />

      {currentPage === 'chat' ? (
        <ChatPage onBack={() => navigateTo('home')} />
      ) : (
        <Home onStartChat={() => navigateTo('chat')} />
      )}
    </main>
  )
}

export default App
