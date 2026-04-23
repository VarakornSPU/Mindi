# Quick Start Guide: MongoDB Setup

## Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- MongoDB (local or Atlas account)

## Step 1: Setup Backend (rag_engine)

```bash
# Navigate to backend directory
cd rag_engine

# Install Python dependencies
pip install -r requirements.txt

# Create .env file with MongoDB settings
cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=mindi_db
JWT_SECRET=your-secret-key-change-in-production
EOF

# Make sure MongoDB is running (in another terminal)
mongod

# Start the backend server
uvicorn main:app --reload --port 8000
```

## Step 2: Setup Frontend

```bash
# In another terminal, go to project root
cd /path/to/Mindi

# Install Node dependencies
npm install

# Start the frontend development server
npm run dev
```

## Step 3: Test the System

1. **Open Browser**
   - Go to http://localhost:5173

2. **Register a New Account**
   - Enter email: `test@example.com`
   - Enter password: `password123`
   - Click Register

3. **Login**
   - Use the credentials from registration
   - Click Login

4. **Send a Message**
   - Type a message in the chat
   - Click Send
   - Wait for the AI response

5. **Verify Data in MongoDB**
   ```bash
   # In another terminal
   mongosh
   use mindi_db
   
   # Check users
   db.Users.find()
   
   # Check chat sessions
   db.Sessions.find()
   
   # Check messages
   db.History.find()
   ```

## Troubleshooting

### "Cannot connect to MongoDB"
```bash
# Check if MongoDB is running
mongod

# If using MongoDB Atlas, update .env:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

### "Port 8000 already in use"
```bash
# Kill process using port 8000
# On Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# On Mac/Linux:
lsof -ti :8000 | xargs kill -9
```

### "CORS error when calling backend"
- Make sure backend is running on http://localhost:8000
- Frontend should be on http://localhost:5173

### "Cannot register - Email already exists"
- Use a different email address
- Or clear MongoDB data:
  ```bash
  mongosh
  use mindi_db
  db.Users.deleteMany({})
  ```

## What's Different Now?

**Before:**
- ❌ Chat history stored only in browser localStorage
- ❌ No persistent user accounts
- ❌ No real authentication
- ❌ Lost all history on browser clear

**After:**
- ✅ Chat history stored in MongoDB
- ✅ User accounts with email/password
- ✅ JWT token authentication
- ✅ History persists forever
- ✅ Can login from any device
- ✅ Multiple chat sessions per user

## Common Commands

```bash
# Start backend
cd rag_engine && uvicorn main:app --reload --port 8000

# Start frontend
npm run dev

# Check MongoDB
mongosh
use mindi_db
db.Users.find().pretty()
db.Sessions.find().pretty()
db.History.find().pretty()

# Stop MongoDB
# Press Ctrl+C in MongoDB terminal
```

## Production Deployment

Before deploying to production:

1. **Change JWT_SECRET**
   ```bash
   # Generate a secure random string
   openssl rand -hex 32
   
   # Add to .env
   JWT_SECRET=your-generated-secret-here
   ```

2. **Use MongoDB Atlas**
   - Create account at https://www.mongodb.com/cloud/atlas
   - Create a cluster
   - Update MONGODB_URI in .env

3. **Secure CORS**
   - Update CORS origins in main.py
   - Only allow your domain

4. **Use HTTPS**
   - Get SSL certificate
   - Update frontend URLs to use HTTPS

## Need Help?

Check these files:
- `MONGODB_SETUP.md` - Detailed setup guide
- `CHANGES_SUMMARY.md` - What was changed
- Backend logs - Terminal where uvicorn is running
- Frontend console - Browser DevTools > Console
