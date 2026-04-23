import os
import glob
from langchain_community.document_loaders import (
    PyPDFLoader, 
    JSONLoader, 
    CSVLoader, 
    UnstructuredExcelLoader
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

def load_documents(data_dir):
    documents = []
    # กวาดไฟล์ทุกประเภทในโฟลเดอร์ data
    for file in glob.glob(os.path.join(data_dir, "*")):
        ext = os.path.splitext(file)[-1].lower()
        print(f"กำลังอ่านไฟล์: {file}")
        
        try:
            if ext == ".pdf":
                loader = PyPDFLoader(file)
                documents.extend(loader.load())
            elif ext == ".json":
                # ปรับ jq_schema ตามโครงสร้างไฟล์ JSON ของคุณ
                loader = JSONLoader(file_path=file, jq_schema='.', text_content=False)
                documents.extend(loader.load())
            elif ext == ".csv":
                loader = CSVLoader(file_path=file)
                documents.extend(loader.load())
            elif ext in [".xlsx", ".xls"]:
                loader = UnstructuredExcelLoader(file)
                documents.extend(loader.load())
            else:
                print(f"ข้ามไฟล์ {file}: ไม่รองรับนามสกุลนี้")
        except Exception as e:
            print(f"เกิดข้อผิดพลาดในการอ่านไฟล์ {file}: {e}")
            
    return documents

# --- เริ่มขั้นตอนการทำงาน ---
DATA_DIR = "data"
CHROMA_DIR = "./chroma_db"

# 1. โหลดไฟล์ทั้งหมด
all_docs = load_documents(DATA_DIR)

# 2. หั่นข้อมูล (Chunking)
text_splitter = RecursiveCharacterTextSplitter(chunk_size=700, chunk_overlap=100)
splits = text_splitter.split_documents(all_docs)

# 3. Embedding ด้วย multilingual-e5-base
print(f"กำลังเริ่มทำ Embedding จำนวน {len(splits)} chunks...")
embeddings = HuggingFaceEmbeddings(model_name="intfloat/multilingual-e5-base")

# 4. บันทึกลง ChromaDB (ถ้ามีข้อมูลเก่าจะเพิ่มเข้าไป)
vectorstore = Chroma.from_documents(
    documents=splits, 
    embedding=embeddings, 
    persist_directory=CHROMA_DIR
)

print("นำเข้าข้อมูลทั้งหมดเข้าสู่ Knowledge Base เรียบร้อยแล้ว!")