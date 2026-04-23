const API_BASE_URL = 'http://localhost:8000'

// List all chat sessions for a user
export const listChatsApi = (token, userId) =>
  fetch(`${API_BASE_URL}/chat/sessions?user_id=${userId}&token=${token}`).then(res => res.json())

// Create a new chat session
export const createChatApi = (token, userId, title = 'New Chat') =>
  fetch(`${API_BASE_URL}/chat/sessions?user_id=${userId}&token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  }).then(res => res.json())

// Delete a chat session
export const deleteChatApi = (token, userId, sessionId) =>
  fetch(`${API_BASE_URL}/chat/sessions/${sessionId}?user_id=${userId}&token=${token}`, {
    method: 'DELETE',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }).then(res => res.json())

// List all messages in a chat session
export const listMessagesApi = (token, userId, sessionId) =>
  fetch(`${API_BASE_URL}/chat/messages/${sessionId}?user_id=${userId}&token=${token}`).then(res => res.json())

// Save a message to a chat session
export const createMessageApi = (token, userId, sessionId, role, content) =>
  fetch(`${API_BASE_URL}/chat/messages?user_id=${userId}&token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      session_id: sessionId,
      role,
      content,
      message_type: 'text'
    })
  }).then(res => res.json())

// Update chat session title
export const updateChatApi = (token, userId, sessionId, title) =>
  fetch(`${API_BASE_URL}/chat/sessions/${sessionId}?user_id=${userId}&token=${token}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  }).then(res => res.json())
