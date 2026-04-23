import { createContext, useContext, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useChat } from '../hooks/useChat'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const auth = useAuth()
  const chat = useChat({ 
    token: auth.token, 
    userId: auth.currentUser?.id 
  })

  const value = useMemo(() => ({ auth, chat }), [auth, chat])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useAppContext = () => {
  const value = useContext(AppContext)
  if (!value) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return value
}
