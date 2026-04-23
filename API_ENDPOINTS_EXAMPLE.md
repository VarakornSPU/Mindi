# API Endpoints with MongoDB Integration

This file shows example API endpoints for user management and chat history.

## 📝 Implementation Examples

You can add these endpoints to `main.py` to integrate MongoDB into your API:

### 1. User Registration Endpoint

```python
from pydantic import BaseModel, EmailStr
import hashlib
from database import create_user_document, insert_user, get_user_by_email

class UserRegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str = ""

@app.post("/auth/register")
async def register_user(request: UserRegisterRequest):
    """Register a new user with MongoDB"""
    try:
        # Check if user already exists
        existing_user = get_user_by_email(request.email)
        if existing_user:
            return JSONResponse(
                content={"error": "Email already registered"},
                status_code=400
            )
        
        # Hash password (use bcrypt in production)
        password_hash = hashlib.sha256(request.password.encode()).hexdigest()
        
        # Create user document
        user_data = create_user_document(
            username=request.username,
            email=request.email,
            password_hash=password_hash,
            full_name=request.full_name
        )
        
        # Save to MongoDB
        user_id = insert_user(user_data)
        
        return {
            "message": "User registered successfully",
            "user_id": user_id,
            "username": request.username
        }
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return JSONResponse(
            content={"error": "Registration failed", "details": str(e)},
            status_code=500
        )
```

### 2. User Login Endpoint

```python
from database import get_user_by_email

class UserLoginRequest(BaseModel):
    email: str
    password: str

@app.post("/auth/login")
async def login_user(request: UserLoginRequest):
    """Login user - verify credentials from MongoDB"""
    try:
        # Find user by email
        user = get_user_by_email(request.email)
        if not user:
            return JSONResponse(
                content={"error": "User not found"},
                status_code=401
            )
        
        # Verify password
        password_hash = hashlib.sha256(request.password.encode()).hexdigest()
        if user['password_hash'] != password_hash:
            return JSONResponse(
                content={"error": "Invalid password"},
                status_code=401
            )
        
        return {
            "message": "Login successful",
            "user_id": str(user['_id']),
            "username": user['username'],
            "email": user['email']
        }
    except Exception as e:
        logger.error(f"Login error: {e}")
        return JSONResponse(
            content={"error": "Login failed"},
            status_code=500
        )
```

### 3. Save Chat Message Endpoint

```python
from database import create_chat_message_document, save_chat_message

class ChatMessageRequest(BaseModel):
    user_id: str
    session_id: str
    role: str  # "user" or "bot"
    content: str
    message_type: str = "text"

@app.post("/chat/save-message")
async def save_message(request: ChatMessageRequest):
    """Save chat message to MongoDB"""
    try:
        # Create message document
        message_data = create_chat_message_document(
            user_id=request.user_id,
            session_id=request.session_id,
            role=request.role,
            content=request.content,
            message_type=request.message_type
        )
        
        # Save to MongoDB
        message_id = save_chat_message(message_data)
        
        return {
            "message_id": message_id,
            "status": "saved"
        }
    except Exception as e:
        logger.error(f"Error saving message: {e}")
        return JSONResponse(
            content={"error": "Failed to save message"},
            status_code=500
        )
```

### 4. Retrieve Chat History Endpoint

```python
from database import get_chat_history

@app.get("/chat/history/{user_id}/{session_id}")
async def get_history(user_id: str, session_id: str, limit: int = 50):
    """Retrieve chat history for user and session"""
    try:
        messages = get_chat_history(
            user_id=user_id,
            session_id=session_id,
            limit=limit
        )
        
        return {
            "user_id": user_id,
            "session_id": session_id,
            "messages": messages,
            "total": len(messages)
        }
    except Exception as e:
        logger.error(f"Error retrieving history: {e}")
        return JSONResponse(
            content={"error": "Failed to retrieve history"},
            status_code=500
        )
```

### 5. Enhanced Ask Question with Chat Saving

```python
from database import save_chat_message, get_chat_history, create_chat_message_document

class EnhancedQuestion(BaseModel):
    user_id: str
    session_id: str
    query: str
    history: Optional[List[ChatMessage]] = []

@app.post("/ask-with-history")
async def ask_question_with_history(item: EnhancedQuestion):
    """Ask question with automatic chat history saving"""
    try:
        # Save user's question to MongoDB
        user_message = create_chat_message_document(
            user_id=item.user_id,
            session_id=item.session_id,
            role="user",
            content=item.query,
            message_type="text"
        )
        save_chat_message(user_message)
        
        # 1. ค้นหาข้อมูลภาษาอังกฤษที่เกี่ยวข้อง (Retrieval)
        results = vectorstore.similarity_search(item.query, k=3)
        context = "\n".join([res.page_content for res in results])
        
        # 2. เตรียมประวัติการคุยเพื่อส่งให้โมเดล
        history_text = ""
        if item.history:
            for msg in item.history[-5:]:
                role_name = "ผู้ใช้" if msg.role == "user" else "ที่ปรึกษา"
                history_text += f"{role_name}: {msg.content}\n"

        # 3. สร้าง Prompt
        prompt = f"""คุณคือที่ปรึกษาด้านความสัมพันธ์ที่อบอุ่น ชื่อว่า 'Mindi' 
    หน้าที่ของคุณคืออ่านข้อมูลอ้างอิงที่เป็นภาษาอังกฤษ แล้วนำมาตอบเป็นภาษาไทยให้นุ่มนวล

    ข้อมูลอ้างอิง (Context):
    {context}

    ประวัติการสนทนา:
    {history_text}

    คำถามปัจจุบัน: {item.query}
    
    คำแนะนำจาก Mindi (ตอบเป็นภาษาไทย):"""
        
        # 4. เรียกใช้ Ollama
        response = ollama.generate(model='qwen2.5:7b-instruct', prompt=prompt)
        bot_response = response['response']
        
        # 5. Save bot's response to MongoDB
        bot_message = create_chat_message_document(
            user_id=item.user_id,
            session_id=item.session_id,
            role="bot",
            content=bot_response,
            message_type="text",
            metadata={
                "sources": [res.metadata.get("source", "Unknown") for res in results],
                "confidence": 0.95,
                "model_version": "qwen2.5:7b"
            }
        )
        save_chat_message(bot_message)
        
        return {
            "reply": bot_response,
            "user_id": item.user_id,
            "session_id": item.session_id,
            "saved": True
        }
    except Exception as exc:
        logger.error(f"ask_question_with_history error: {exc}")
        traceback.print_exc()
        return JSONResponse(
            content={"error": "Internal server error", "details": str(exc)},
            status_code=500,
        )
```

## 🔌 Integration Steps

1. **Add imports** at the top of `main.py`
2. **Add Pydantic models** (request/response schemas)
3. **Add endpoint functions** to `main.py`
4. **Test with Swagger UI**: http://localhost:8000/docs
5. **Verify data in MongoDB Atlas**: Collections > mindi_db

## 🧪 Testing with cURL

### Register User
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "secure_password",
    "full_name": "John Doe"
  }'
```

### Login User
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "secure_password"
  }'
```

### Save Chat Message
```bash
curl -X POST http://localhost:8000/chat/save-message \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID_HERE",
    "session_id": "session_123",
    "role": "user",
    "content": "Hello Mindi!"
  }'
```

### Get Chat History
```bash
curl -X GET "http://localhost:8000/chat/history/USER_ID_HERE/session_123?limit=50"
```

## 🛡️ Security Improvements Needed

For production, add:

1. **Password Hashing**: Use `bcrypt` instead of SHA256
```python
import bcrypt

def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt())

def verify_password(password, hash):
    return bcrypt.checkpw(password.encode(), hash)
```

2. **JWT Authentication**: Create tokens on login
```python
from jose import JWTError, jwt
from datetime import datetime, timedelta

def create_access_token(user_id: str):
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode = {"sub": user_id, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, "SECRET_KEY", algorithm="HS256")
    return encoded_jwt
```

3. **Input Validation**: Use Pydantic validators
```python
from pydantic import validator

class UserRegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    
    @validator('email')
    def email_valid(cls, v):
        if '@' not in v:
            raise ValueError('Invalid email')
        return v
```

---

Ready to implement? Start with the setup guide in `MONGODB_SETUP.md`!
