import { apiRequest } from './apiClient'

export const listChatsApi = (token, userId) =>
  apiRequest('/api/chats', { token, query: { userId } })

export const createChatApi = (token, title) =>
  apiRequest('/api/chats', { method: 'POST', token, body: { title } })

export const deleteChatApi = (token, chatId) =>
  apiRequest(`/api/chats/${chatId}`, { method: 'DELETE', token })

export const listMessagesApi = (token, chatId) =>
  apiRequest('/api/messages', { token, query: { chatId } })

export const createMessageApi = (token, input) =>
  apiRequest('/api/messages', { method: 'POST', token, body: input })
