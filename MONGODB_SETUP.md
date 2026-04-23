# MongoDB Integration Guide

## Overview

This guide explains the complete MongoDB integration for the Mindi AI Chat system, including user authentication, chat history persistence, and session management.

## Architecture Changes

### Database Schema

#### Users Collection
```json
{
  "_id": ObjectId,
  "email": string (unique, indexed),
  "password_hash": string,
  "createdAt": datetime,
  "updatedAt": datetime,
  "is_active": boolean
}
```

#### Sessions Collection
```json
{
  "_id": ObjectId,
  "userId": string,
  "title": string,
  "createdAt": datetime,
  "updatedAt": datetime,
  "messageCount": number,
  "isArchived": boolean
}
```

#### History Collection (Chat Messages)
```json
{
  "_id": ObjectId,
  "userId": string,
  "sessionId": string,
  "role": string ("user" or "bot"),
  "content": string,
  "message_type": string,
  "timestamp": datetime,
  "createdAt": datetime,
  "metadata": {
    "sources": array,
    "confidence": number,
    "model_version": string
  }
}
```

## Backend Setup

### 1. Install Dependencies

```bash
cd rag_engine
pip install -r requirements.txt
```

**Note:** The requirements.txt now includes `pyjwt` for JWT token support.

### 2. Configure Environment Variables

Create a `.env` file in the `rag_engine` directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=mindi_db

# JWT Configuration (change in production!)
JWT_SECRET=your-secret-key-change-in-production

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
```

For MongoDB Atlas, use:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

### 3. Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**MongoDB Atlas:** Already running in the cloud

### 4. Run Backend Server

```bash
uvicorn main:app --reload --port 8000
```

The backend will:
- Connect to MongoDB automatically on startup
- Create collections and indexes
- Initialize all required schemas

## API Endpoints

### Authentication

#### Register User
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}

Response:
{
  "message": "User registered successfully",
  "user_id": "objectid",
  "email": "user@example.com"
}
```

#### Login User
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}

Response:
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user_id": "objectid",
  "email": "user@example.com"
}
```

#### Get Current User Profile
```
GET /auth/me?token=jwt_token_here

Response:
{
  "user_id": "objectid",
  "email": "user@example.com",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Chat Sessions

#### Create Session
```
POST /chat/sessions
Content-Type: application/json

{
  "title": "My Chat Session"
}

Response:
{
  "session_id": "objectid",
  "title": "My Chat Session",
  "created": true
}
```

#### List User Sessions
```
GET /chat/sessions?user_id=userid&token=jwt_token

Response:
{
  "user_id": "userid",
  "sessions": [
    {
      "_id": "objectid",
      "userId": "userid",
      "title": "Session Title",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "messageCount": 5
    }
  ],
  "total": 1
}
```

#### Get Session Details
```
GET /chat/sessions/{session_id}

Response:
{
  "_id": "objectid",
  "userId": "userid",
  "title": "Session Title",
  ...
}
```

#### Update Session Title
```
PUT /chat/sessions/{session_id}
Content-Type: application/json

{
  "title": "New Title"
}

Response:
{
  "message": "Session updated successfully",
  "session_id": "objectid",
  "title": "New Title"
}
```

#### Delete Session
```
DELETE /chat/sessions/{session_id}

Response:
{
  "message": "Session deleted successfully",
  "session_id": "objectid"
}
```

### Chat Messages

#### Save Message
```
POST /chat/messages
Content-Type: application/json

{
  "user_id": "userid",
  "session_id": "session_id",
  "role": "user",
  "content": "Hello, how are you?",
  "message_type": "text"
}

Response:
{
  "message_id": "objectid",
  "status": "saved"
}
```

#### Get Messages
```
GET /chat/messages/{session_id}?limit=50

Response:
{
  "session_id": "session_id",
  "messages": [
    {
      "_id": "objectid",
      "userId": "userid",
      "sessionId": "session_id",
      "role": "user",
      "content": "Hello",
      "message_type": "text",
      "createdAt": "2024-01-01T00:00:00Z",
      ...
    }
  ],
  "total": 1
}
```

## Frontend Updates

### 1. useAuth Hook

Now properly handles JWT tokens:
```javascript
const { token, currentUser, isAuthenticated, login, register, logout } = useAuth()
```

- `token`: JWT token from backend
- `currentUser`: User object with id, email, createdAt
- `isAuthenticated`: Boolean indicating if user is logged in

### 2. useChat Hook

Now integrates with MongoDB backend:
```javascript
const { 
  chats, 
  currentChatId, 
  currentChat, 
  messages, 
  isTyping, 
  createNewChat, 
  selectChat, 
  deleteChat, 
  sendMessage 
} = useChat({ token, userId })
```

Features:
- Automatic synchronization with backend
- Loads chat history from MongoDB
- Saves all messages to MongoDB
- Falls back to localStorage if backend is unavailable

### 3. Service Functions

Updated in `src/services/`:
- `authApi.js`: Register, login, get profile
- `chatApi.js`: CRUD operations for chats and messages

## Testing the System

### 1. Start Servers

Terminal 1 (Backend):
```bash
cd rag_engine
uvicorn main:app --reload --port 8000
```

Terminal 2 (Frontend):
```bash
npm run dev
```

### 2. Test Registration & Login

1. Open http://localhost:5173
2. Register a new account (test@example.com)
3. Verify it's stored in MongoDB

Check MongoDB:
```bash
mongosh
use mindi_db
db.Users.find()
```

### 3. Test Chat System

1. Send a message in the chat
2. Open MongoDB to verify message is saved:
```bash
db.Sessions.find()
db.History.find()
```

## Troubleshooting

### MongoDB Connection Issues

**Error: "Cannot connect to MongoDB"**
```bash
# Make sure MongoDB is running
mongod

# Check connection string in .env
# Local: mongodb://localhost:27017
# Atlas: mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
```

### JWT Token Issues

**Error: "Invalid or expired token"**
- Token expires after 24 hours by default
- Change `JWT_EXPIRATION_HOURS` in main.py to adjust
- Change `JWT_SECRET` in production!

### Message Not Saving

**Check backend logs for errors**
```bash
# Look for error messages in terminal where uvicorn is running
```

## Production Checklist

- [ ] Change `JWT_SECRET` in .env
- [ ] Use MongoDB Atlas instead of local MongoDB
- [ ] Enable HTTPS
- [ ] Set secure CORS origins
- [ ] Use environment-specific config
- [ ] Add rate limiting
- [ ] Add input validation
- [ ] Add logging/monitoring
- [ ] Hash passwords with bcrypt instead of SHA256
- [ ] Add database backups

## Next Steps

1. **Authentication**: Add token refresh mechanism
2. **Security**: Replace SHA256 hashing with bcrypt
3. **Features**: Add user profiles, chat sharing, export
4. **Performance**: Add caching, pagination
5. **Monitoring**: Add logging, error tracking

## Support

For issues or questions, check the logs:
- Backend: terminal output from uvicorn
- Frontend: browser console
- Database: MongoDB logs
