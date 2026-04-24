from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import ollama
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from typing import List, Optional
import traceback
import logging
import os
import hashlib
import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Import database module
from database import (
    connect_mongodb, close_mongodb, initialize_collections,
    create_user_document, insert_user, get_user_by_email, get_user_by_id,
    create_chat_message_document, save_chat_message, get_chat_history,
    create_chat_session, list_user_sessions, get_session_by_id, 
    delete_session, update_session_title, get_session_messages
)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))

def create_token(user_id: str, email: str) -> str:
    """Create a JWT token for a user"""
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        return None
    except jwt.InvalidTokenError:
        logger.warning("Invalid token")
        return None

app = FastAPI(title="Mindi AI Chat Backend")

# --- สำคัญมาก: ต้องเปิด CORS เพื่อให้หน้าบ้าน Vite (พอร์ต 5173) เรียกใช้ได้ ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# Startup and Shutdown Events
# ============================================
@app.on_event("startup")
async def startup_event():
    """Initialize MongoDB connection and collections on application startup"""
    try:
        logger.info("🚀 Starting up Mindi AI Chat Backend...")
        
        # Connect to MongoDB
        connect_mongodb()
        
        # Initialize collections with schemas
        initialize_collections()
        
        logger.info("✅ Mindi AI Backend ready!")
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Close MongoDB connection on application shutdown"""
    logger.info("📴 Shutting down Mindi AI Chat Backend...")
    close_mongodb()
    logger.info("✅ Shutdown complete")


# ============================================
# Initialize RAG Components
# ============================================

embeddings = HuggingFaceEmbeddings(model_name="intfloat/multilingual-e5-base")
vectorstore = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)


# ============================================
# Pydantic Models
# ============================================

class ChatMessage(BaseModel):
    role: str # 'user' หรือ 'bot'
    content: str

class Question(BaseModel):
    query: str
    history: Optional[List[ChatMessage]] = [] # รับประวัติแชทจากหน้าบ้าน

class UserRegisterRequest(BaseModel):
    email: str
    password: str

class UserLoginRequest(BaseModel):
    email: str
    password: str

class ChatMessageRequest(BaseModel):
    user_id: str
    session_id: str
    role: str
    content: str
    message_type: str = "text"

class CreateSessionRequest(BaseModel):
    title: str = "New Chat"

class UpdateSessionRequest(BaseModel):
    title: str


# ============================================
# Authentication Endpoints
# ============================================

@app.post("/auth/register")
async def register_user(request: UserRegisterRequest):
    """Register a new user and save to Users collection"""
    try:
        # Normalize and validate email
        email = request.email.strip().lower()
        password = request.password.strip()
        
        if not email or not password:
            return JSONResponse(
                content={"error": "Email and password are required"},
                status_code=400
            )
        
        # Check if user already exists
        existing_user = get_user_by_email(email)
        if existing_user:
            return JSONResponse(
                content={"error": "Email already registered"},
                status_code=400
            )
        
        # Hash password (SHA256 - for demo, use bcrypt in production)
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        # Create user document with only email and password
        user_data = create_user_document(
            email=email,
            password_hash=password_hash
        )
        
        # Save to MongoDB Users collection
        user_id = insert_user(user_data)
        logger.info(f"✅ User registered: {email}")
        
        return {
            "message": "User registered successfully",
            "user_id": user_id,
            "email": email
        }
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return JSONResponse(
            content={"error": "Registration failed", "details": str(e)},
            status_code=500
        )


@app.post("/auth/login")
async def login_user(request: UserLoginRequest):
    """Login user - verify credentials from Users collection"""
    try:
        # Normalize email
        email = request.email.strip().lower()
        password = request.password.strip()
        
        if not email or not password:
            return JSONResponse(
                content={"error": "Email and password are required"},
                status_code=400
            )
        
        # Find user by email
        user = get_user_by_email(email)
        if not user:
            return JSONResponse(
                content={"error": "User not found"},
                status_code=401
            )
        
        # Verify password
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        if user['password_hash'] != password_hash:
            return JSONResponse(
                content={"error": "Invalid password"},
                status_code=401
            )
        
        # Create JWT token
        user_id = str(user['_id'])
        token = create_token(user_id, email)
        
        logger.info(f"✅ User logged in: {email}")
        
        return {
            "message": "Login successful",
            "token": token,
            "user_id": user_id,
            "email": user['email']
        }
    except Exception as e:
        logger.error(f"Login error: {e}")
        return JSONResponse(
            content={"error": "Login failed", "details": str(e)},
            status_code=500
        )


@app.get("/auth/me")
async def get_current_user(token: str = None):
    """Get current user profile"""
    try:
        # Get token from header or query parameter
        if not token:
            return JSONResponse(
                content={"error": "Token required"},
                status_code=401
            )
        
        # Verify token
        payload = verify_token(token)
        if not payload:
            return JSONResponse(
                content={"error": "Invalid or expired token"},
                status_code=401
            )
        
        # Get user by ID
        user = get_user_by_id(payload['user_id'])
        if not user:
            return JSONResponse(
                content={"error": "User not found"},
                status_code=404
            )
        
        return {
            "user_id": str(user['_id']),
            "email": user['email'],
            "createdAt": user['createdAt'].isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        return JSONResponse(
            content={"error": "Failed to get user profile", "details": str(e)},
            status_code=500
        )


# ============================================
# Chat Endpoints
# ============================================

@app.post("/chat/sessions")
async def create_session(request: CreateSessionRequest, user_id: str = None, token: str = None):
    """Create a new chat session"""
    try:
        # Verify user_id is provided
        if not user_id and not token:
            return JSONResponse(
                content={"error": "User ID or token required"},
                status_code=401
            )
        
        # If token is provided, extract user_id from it
        if token and not user_id:
            payload = verify_token(token)
            if not payload:
                return JSONResponse(
                    content={"error": "Invalid token"},
                    status_code=401
                )
            user_id = payload['user_id']
        
        # Create session
        session_id = create_chat_session(user_id, request.title)
        
        logger.info(f"✅ Chat session created: {session_id}")
        
        return {
            "session_id": session_id,
            "title": request.title,
            "created": True
        }
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        return JSONResponse(
            content={"error": "Failed to create session", "details": str(e)},
            status_code=500
        )


@app.get("/chat/sessions")
async def list_sessions(user_id: str = None, token: str = None):
    """List all chat sessions for a user"""
    try:
        # Verify user_id or token is provided
        if not user_id and not token:
            return JSONResponse(
                content={"error": "User ID or token required"},
                status_code=401
            )
        
        # If token is provided, extract user_id from it
        if token and not user_id:
            payload = verify_token(token)
            if not payload:
                return JSONResponse(
                    content={"error": "Invalid token"},
                    status_code=401
                )
            user_id = payload['user_id']
        
        sessions = list_user_sessions(user_id)
        
        logger.info(f"✅ Retrieved {len(sessions)} sessions for user {user_id}")
        
        return {
            "user_id": user_id,
            "sessions": sessions,
            "total": len(sessions)
        }
    except Exception as e:
        logger.error(f"Error listing sessions: {e}")
        return JSONResponse(
            content={"error": "Failed to list sessions", "details": str(e)},
            status_code=500
        )


@app.get("/chat/sessions/{session_id}")
async def get_session(session_id: str, user_id: str = None, token: str = None):
    """Get a specific chat session (with user verification)"""
    try:
        # Verify user_id or token is provided
        if not user_id and not token:
            return JSONResponse(
                content={"error": "User ID or token required"},
                status_code=401
            )
        
        # If token is provided, extract user_id from it
        if token and not user_id:
            payload = verify_token(token)
            if not payload:
                return JSONResponse(
                    content={"error": "Invalid or expired token"},
                    status_code=401
                )
            user_id = payload['user_id']
        
        session = get_session_by_id(session_id)
        
        if not session:
            return JSONResponse(
                content={"error": "Session not found"},
                status_code=404
            )
        
        # Verify the session belongs to the requesting user
        if session.get('userId') != user_id:
            return JSONResponse(
                content={"error": "Unauthorized access to this session"},
                status_code=403
            )
        
        return session
    except Exception as e:
        logger.error(f"Error getting session: {e}")
        return JSONResponse(
            content={"error": "Failed to get session", "details": str(e)},
            status_code=500
        )


@app.delete("/chat/sessions/{session_id}")
async def delete_chat_session(session_id: str, user_id: str = None, token: str = None):
    """Delete a chat session and all its messages (with user verification)"""
    try:
        # Verify user_id or token is provided
        if not user_id and not token:
            return JSONResponse(
                content={"error": "User ID or token required"},
                status_code=401
            )
        
        # If token is provided, extract user_id from it
        if token and not user_id:
            payload = verify_token(token)
            if not payload:
                return JSONResponse(
                    content={"error": "Invalid or expired token"},
                    status_code=401
                )
            user_id = payload['user_id']
        
        # Get session to verify it belongs to the user
        session = get_session_by_id(session_id)
        if not session:
            return JSONResponse(
                content={"error": "Session not found"},
                status_code=404
            )
        
        # Verify the session belongs to the requesting user
        if session.get('userId') != user_id:
            return JSONResponse(
                content={"error": "Unauthorized to delete this session"},
                status_code=403
            )
        
        success = delete_session(session_id)
        
        if not success:
            return JSONResponse(
                content={"error": "Session not found"},
                status_code=404
            )
        
        logger.info(f"✅ Chat session deleted: {session_id} (user: {user_id})")
        
        return {
            "message": "Session deleted successfully",
            "session_id": session_id
        }
    except Exception as e:
        logger.error(f"Error deleting session: {e}")
        return JSONResponse(
            content={"error": "Failed to delete session", "details": str(e)},
            status_code=500
        )


@app.put("/chat/sessions/{session_id}")
async def update_session(session_id: str, request: UpdateSessionRequest, user_id: str = None, token: str = None):
    """Update chat session title (with user verification)"""
    try:
        # Verify user_id or token is provided
        if not user_id and not token:
            return JSONResponse(
                content={"error": "User ID or token required"},
                status_code=401
            )
        
        # If token is provided, extract user_id from it
        if token and not user_id:
            payload = verify_token(token)
            if not payload:
                return JSONResponse(
                    content={"error": "Invalid or expired token"},
                    status_code=401
                )
            user_id = payload['user_id']
        
        # Get session to verify it belongs to the user
        session = get_session_by_id(session_id)
        if not session:
            return JSONResponse(
                content={"error": "Session not found"},
                status_code=404
            )
        
        # Verify the session belongs to the requesting user
        if session.get('userId') != user_id:
            return JSONResponse(
                content={"error": "Unauthorized to update this session"},
                status_code=403
            )
        
        success = update_session_title(session_id, request.title)
        
        if not success:
            return JSONResponse(
                content={"error": "Session not found"},
                status_code=404
            )
        
        logger.info(f"✅ Session title updated: {session_id} (user: {user_id})")
        
        return {
            "message": "Session updated successfully",
            "session_id": session_id,
            "title": request.title
        }
    except Exception as e:
        logger.error(f"Error updating session: {e}")
        return JSONResponse(
            content={"error": "Failed to update session", "details": str(e)},
            status_code=500
        )


@app.post("/chat/messages")
async def save_message(request: ChatMessageRequest, user_id: str = None, token: str = None):
    """Save chat message to History collection (verify session ownership)"""
    try:
        # Require user_id or token for verification
        if not user_id and not token:
            return JSONResponse(
                content={"error": "User ID or token required"},
                status_code=401
            )

        # If token is provided, extract user_id
        if token and not user_id:
            payload = verify_token(token)
            if not payload:
                return JSONResponse(
                    content={"error": "Invalid or expired token"},
                    status_code=401
                )
            user_id = payload['user_id']

        # Verify session exists and belongs to user
        session = get_session_by_id(request.session_id)
        if not session:
            return JSONResponse(
                content={"error": "Session not found"},
                status_code=404
            )

        if session.get('userId') != user_id:
            return JSONResponse(
                content={"error": "Unauthorized to post to this session"},
                status_code=403
            )

        # Create message document
        message_data = create_chat_message_document(
            user_id=user_id,
            session_id=request.session_id,
            role=request.role,
            content=request.content,
            message_type=request.message_type
        )

        # Save to MongoDB History collection
        message_id = save_chat_message(message_data)
        logger.info(f"✅ Message saved: {message_id} (user: {user_id})")

        return {
            "message_id": message_id,
            "status": "saved"
        }
    except Exception as e:
        logger.error(f"Error saving message: {e}")
        return JSONResponse(
            content={"error": "Failed to save message", "details": str(e)},
            status_code=500
        )


@app.get("/chat/messages/{session_id}")
async def get_messages(session_id: str, user_id: str = None, token: str = None, limit: int = 50):
    """Retrieve messages for a specific session (with user verification)"""
    try:
        # Verify user_id or token is provided
        if not user_id and not token:
            return JSONResponse(
                content={"error": "User ID or token required"},
                status_code=401
            )
        
        # If token is provided, extract user_id from it
        if token and not user_id:
            payload = verify_token(token)
            if not payload:
                return JSONResponse(
                    content={"error": "Invalid or expired token"},
                    status_code=401
                )
            user_id = payload['user_id']
        
        # Get session to verify it belongs to the user
        session = get_session_by_id(session_id)
        if not session:
            return JSONResponse(
                content={"error": "Session not found"},
                status_code=404
            )
        
        # Verify the session belongs to the requesting user
        if session.get('userId') != user_id:
            return JSONResponse(
                content={"error": "Unauthorized access to this session"},
                status_code=403
            )
        
        # Now retrieve messages
        messages = get_session_messages(session_id, limit)
        
        logger.info(f"✅ Retrieved {len(messages)} messages for session {session_id} (user: {user_id})")
        
        return {
            "session_id": session_id,
            "messages": messages,
            "total": len(messages)
        }
    except Exception as e:
        logger.error(f"Error retrieving messages: {e}")
        return JSONResponse(
            content={"error": "Failed to retrieve messages", "details": str(e)},
            status_code=500
        )


@app.get("/chat/history/{user_id}/{session_id}")
async def get_history(user_id: str, session_id: str, limit: int = 50):
    """Retrieve chat history from History collection (legacy endpoint)"""
    try:
        messages = get_chat_history(
            user_id=user_id,
            session_id=session_id,
            limit=limit
        )
        
        logger.info(f"✅ Retrieved {len(messages)} messages for user {user_id}")
        
        return {
            "user_id": user_id,
            "session_id": session_id,
            "messages": messages,
            "total": len(messages)
        }
    except Exception as e:
        logger.error(f"Error retrieving history: {e}")
        return JSONResponse(
            content={"error": "Failed to retrieve history", "details": str(e)},
            status_code=500
        )


# ============================================
# Health Check
# ============================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "Mindi AI Backend is running"}

@app.post("/ask")
async def ask_question(item: Question):
    try:
        # 1. ค้นหาข้อมูลภาษาอังกฤษที่เกี่ยวข้อง (Retrieval)
        results = vectorstore.similarity_search(item.query, k=3)
        
        # ✅ สร้าง Context แบบมีชื่อไฟล์กำกับไว้ด้วย
        context_parts = []
        for i, res in enumerate(results):
            # ดึงชื่อไฟล์จาก metadata (ถ้าไม่มีให้ใส่ว่า ไม่ระบุที่มา)
            source_path = res.metadata.get('source', 'ไม่ระบุที่มา')
            # ตัดให้เหลือแค่ชื่อไฟล์ (ตัด path ยาวๆ ทิ้งไป)
            source_name = os.path.basename(source_path) if '\\' in source_path or '/' in source_path else source_path
            
            # รวมเนื้อหาและที่มาเข้าด้วยกัน
            context_parts.append(f"[ข้อมูลจากไฟล์: {source_name}]\n{res.page_content}")
            
        context = "\n\n".join(context_parts)
        
        # 2. เตรียมประวัติการคุยเพื่อส่งให้โมเดล
        history_text = ""
        if item.history:
            for msg in item.history[-5:]: # เอา 5 ข้อความล่าสุด
                role_name = "ผู้ใช้" if msg.role == "user" else "ที่ปรึกษา"
                history_text += f"{role_name}: {msg.content}\n"

        # 3. สร้าง Prompt เพิ่มกฎให้บอกแหล่งที่มา
        prompt = f"""[SYSTEM INSTRUCTIONS - CRITICAL RULES]
You are "Mindi", a warm, empathetic relationship counselor who speaks like a highly supportive best friend. 
You must strictly follow these rules:
1. ABSOLUTELY NO CHINESE: You MUST write your entire response in the THAI language ONLY. Do NOT output any Chinese characters, pinyin, or foreign alphabets.
2. CITE SOURCES: At the end of your response, you MUST include a short note telling the user which file(s) you got the information from, based on the tags in the [CONTEXT]. Example format: "(อ้างอิงจากไฟล์: ...)"
3. OUT OF CONTEXT RULE (CRITICAL): If the user's query is unrelated to relationships, OR if the [CONTEXT] does not contain relevant information to answer it (e.g., questions about animals, games, work colleagues, or random facts), you MUST NOT invent answers. You must output EXACTLY and ONLY this single Thai sentence: "เรื่องนี้น้องมายด์ยังไม่แน่ใจ แต่เราอยู่คุยกันได้นะ". Do NOT add any other text, and do NOT cite ALL sources.
4. BEST FRIEND TONE: Speak naturally like a caring Thai friend. Use pronouns like "เรา" (I) and "ตัวเอง/เธอ" (you). Use warm ending particles like "นะ", "สู้ๆนะ", "เป็นกำลังใจให้นะ".

[CONTEXT (Reference Data)]
{context}

[CHAT HISTORY]
{history_text}

[USER QUESTION]
{item.query}

[MINDI'S RESPONSE (THAI LANGUAGE ONLY)]:"""
        
        # 4. เรียกใช้ Ollama (Qwen2.5)
        response = ollama.generate(model='qwen2.5:7b-instruct', prompt=prompt)
        
        return {"reply": response['response']}
    except Exception as exc:
        print("[main.py] ask_question error:", repr(exc))
        traceback.print_exc()
        return JSONResponse(
            content={"error": "Internal server error", "details": str(exc)},
            status_code=500,
        )