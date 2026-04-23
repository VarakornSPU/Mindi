from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import ollama
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from typing import List, Optional
import traceback

app = FastAPI()

# --- สำคัญมาก: ต้องเปิด CORS เพื่อให้หน้าบ้าน Vite (พอร์ต 5173) เรียกใช้ได้ ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

embeddings = HuggingFaceEmbeddings(model_name="intfloat/multilingual-e5-base")
vectorstore = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)

class ChatMessage(BaseModel):
    role: str # 'user' หรือ 'bot'
    content: str

class Question(BaseModel):
    query: str
    history: Optional[List[ChatMessage]] = [] # รับประวัติแชทจากหน้าบ้าน

@app.post("/ask")
async def ask_question(item: Question):
    try:
        # 1. ค้นหาข้อมูลภาษาอังกฤษที่เกี่ยวข้อง (Retrieval)
        # ใช้ similarity_search เพื่อดึง Context ภาษาอังกฤษมา
        results = vectorstore.similarity_search(item.query, k=3)
        context = "\\n".join([res.page_content for res in results])
        
        # 2. เตรียมประวัติการคุยเพื่อส่งให้โมเดล
        history_text = ""
        if item.history:
            for msg in item.history[-5:]: # เอา 5 ข้อความล่าสุด
                role_name = "ผู้ใช้" if msg.role == "user" else "ที่ปรึกษา"
                history_text += f"{role_name}: {msg.content}\\n"

        # 3. สร้าง Prompt ที่เน้นความเป็นที่ปรึกษาและภาษาไทย
        prompt = f"""คุณคือที่ปรึกษาด้านความสัมพันธ์ที่อบอุ่น ชื่อว่า 'Mindi' 
    หน้าที่ของคุณคืออ่านข้อมูลอ้างอิงที่เป็นภาษาอังกฤษ แล้วนำมาตอบเป็นภาษาไทยให้นุ่มนวล

    ข้อมูลอ้างอิง (Context):
    {context}

    ประวัติการสนทนา:
    {history_text}

    คำถามปัจจุบัน: {item.query}
    
    คำแนะนำจาก Mindi (ตอบเป็นภาษาไทย):"""
        
        # 4. เรียกใช้ Ollama (Qwen2.5)
        # ระบุโมเดลให้ตรงกับที่คุณ pull มา
        response = ollama.generate(model='qwen2.5:7b-instruct', prompt=prompt)
        
        return {"reply": response['response']}
    except Exception as exc:
        print("[main.py] ask_question error:", repr(exc))
        traceback.print_exc()
        return JSONResponse(
            content={"error": "Internal server error", "details": str(exc)},
            status_code=500,
        )
