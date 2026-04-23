"""
MongoDB Database Module for Mindi
Handles connection and schema definitions for User and ChatHistory collections
"""

from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ServerSelectionTimeoutError
from datetime import datetime
from typing import Dict, List, Optional
import os
from dotenv import load_dotenv
import logging
import certifi  # เพิ่ม certifi เพื่อป้องกันปัญหา SSL บน MongoDB Atlas

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# MongoDB Configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "mindi_db")

# MongoDB Client and Database
client = None
db = None


def connect_mongodb():
    """
    Connect to MongoDB Atlas
    Raises exception if connection fails
    """
    global client, db
    try:
        # ใช้ certifi.where() เพื่อแก้ไขปัญหา SSL handshake บน Mac
        client = MongoClient(
            MONGODB_URI, 
            serverSelectionTimeoutMS=5000,
            tlsCAFile=certifi.where() 
        )
        # Verify connection
        client.admin.command('ping')
        db = client[MONGODB_DB_NAME]
        logger.info(f"✅ Successfully connected to MongoDB: {MONGODB_DB_NAME}")
        return db
    except ServerSelectionTimeoutError as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        raise


def close_mongodb():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed")


def initialize_collections():
    """
    Initialize and create collections with proper schema and indexes
    This should be called once when the application starts
    """
    if db is None:
        raise RuntimeError("Database not connected. Call connect_mongodb() first.")

    try:
        # Create Users Collection
        create_users_collection()
        
        # Create ChatHistory Collection
        create_chat_history_collection()
        
        # Create Sessions Collection
        create_sessions_collection()
        
        logger.info("✅ All collections initialized successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Error initializing collections: {e}")
        raise


def create_users_collection():
    """
    Create Users collection with schema and indexes
    Stores user account information
    """
    collection_name = "Users"
    
    # Check if collection exists
    if collection_name not in db.list_collection_names():
        logger.info(f"Creating '{collection_name}' collection...")
        db.create_collection(collection_name)
    else:
        logger.info(f"'{collection_name}' collection already exists")
    
    users_collection = db[collection_name]
    
    # Create indexes
    try:
        # Unique index on email
        users_collection.create_index([("email", ASCENDING)], unique=True, sparse=True)
        logger.info("✅ Created unique index on 'email'")
        
        # Index on createdAt for sorting
        users_collection.create_index([("createdAt", DESCENDING)])
        logger.info("✅ Created index on 'createdAt'")
        
    except Exception as e:
        logger.warning(f"Index creation note: {e}")
    
    return users_collection


def create_chat_history_collection():
    """
    Create History collection with schema and indexes
    Stores user chat messages and bot responses
    """
    collection_name = "History"
    
    # Check if collection exists
    if collection_name not in db.list_collection_names():
        logger.info(f"Creating '{collection_name}' collection...")
        db.create_collection(collection_name)
    else:
        logger.info(f"'{collection_name}' collection already exists")
    
    chat_collection = db[collection_name]
    
    # Create indexes
    try:
        # Index on userId for quick lookup
        chat_collection.create_index([("userId", ASCENDING)])
        logger.info("✅ Created index on 'userId'")
        
        # Compound index on userId and createdAt for efficient querying
        chat_collection.create_index([("userId", ASCENDING), ("createdAt", DESCENDING)])
        logger.info("✅ Created compound index on 'userId' and 'createdAt'")
        
        # Index on sessionId for grouping conversations
        chat_collection.create_index([("sessionId", ASCENDING)])
        logger.info("✅ Created index on 'sessionId'")
        
    except Exception as e:
        logger.warning(f"Index creation note: {e}")
    
    return chat_collection


def get_users_collection():
    """Get Users collection"""
    if db is None:
        raise RuntimeError("Database not connected")
    return db["Users"]


def get_chat_history_collection():
    """Get History collection"""
    if db is None:
        raise RuntimeError("Database not connected")
    return db["History"]


# ============================================
# User Document Schema
# ============================================
def create_user_document(
    email: str,
    password_hash: str,
) -> Dict:
    return {
        "email": email,
        "password_hash": password_hash,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "is_active": True
    }


# ============================================
# Chat History Document Schema
# ============================================
def create_chat_message_document(
    user_id: str,
    session_id: str,
    role: str,  # "user" or "bot"
    content: str,
    message_type: str = "text",
    metadata: Optional[Dict] = None,
) -> Dict:
    now = datetime.utcnow()
    return {
        "userId": user_id,
        "sessionId": session_id,
        "role": role,
        "content": content,
        "message_type": message_type,
        "timestamp": now,
        "createdAt": now,
        "metadata": metadata or {
            "sources": [],
            "confidence": 0.0,
            "model_version": "1.0"
        }
    }


def create_chat_session_document(
    user_id: str,
    session_title: str = "New Chat",
) -> Dict:
    now = datetime.utcnow()
    return {
        "userId": user_id,
        "session_title": session_title,
        "createdAt": now,
        "updatedAt": now,
        "message_count": 0,
        "is_archived": False
    }


# ============================================
# Database Helper Functions
# ============================================
def insert_user(user_data: Dict) -> str:
    """Insert a new user and return the inserted ID"""
    try:
        result = get_users_collection().insert_one(user_data)
        logger.info(f"User created: {result.inserted_id}")
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"Error inserting user: {e}")
        raise


def get_user_by_email(email: str) -> Optional[Dict]:
    """Retrieve user by email"""
    try:
        return get_users_collection().find_one({"email": email})
    except Exception as e:
        logger.error(f"Error fetching user by email: {e}")
        return None


def get_user_by_id(user_id: str) -> Optional[Dict]:
    """Retrieve user by ID"""
    try:
        from bson import ObjectId
        return get_users_collection().find_one({"_id": ObjectId(user_id)})
    except Exception as e:
        logger.error(f"Error fetching user by ID: {e}")
        return None


def save_chat_message(message_data: Dict) -> str:
    """Save a chat message and return the inserted ID"""
    try:
        result = get_chat_history_collection().insert_one(message_data)
        logger.info(f"Chat message saved: {result.inserted_id}")
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"Error saving chat message: {e}")
        raise


def get_chat_history(user_id: str, session_id: str, limit: int = 50) -> List[Dict]:
    """Retrieve chat history for a specific user and session"""
    try:
        messages = list(
            get_chat_history_collection()
            .find({
                "userId": user_id,
                "sessionId": session_id
            })
            .sort("createdAt", ASCENDING)
            .limit(limit)
        )
        for msg in messages:
            msg["_id"] = str(msg["_id"])
        return messages
    except Exception as e:
        logger.error(f"Error retrieving chat history: {e}")
        return []


# ============================================
# Chat Session Management Functions
# ============================================

def create_chat_session(user_id: str, session_title: str = "New Chat") -> str:
    """Create a new chat session and return the session ID"""
    try:
        # ✅ แก้ไขเรื่องการเช็ค db (PyMongo quirk)
        if db is None:
            raise RuntimeError("Database not connected")
        
        collection = db["Sessions"]
        
        session_data = {
            "userId": user_id,
            "title": session_title,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
            "messageCount": 0,
            "isArchived": False
        }
        
        result = collection.insert_one(session_data)
        logger.info(f"Chat session created: {result.inserted_id}")
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"Error creating chat session: {e}")
        raise


def list_user_sessions(user_id: str) -> List[Dict]:
    """List all chat sessions for a user"""
    try:
        # ✅ แก้ไขเรื่องการเช็ค db (PyMongo quirk)
        if db is None:
            raise RuntimeError("Database not connected")
            
        collection = db["Sessions"]
        
        sessions = list(
            collection
            .find({"userId": user_id})
            .sort("updatedAt", DESCENDING)
        )
        
        for session in sessions:
            session["_id"] = str(session["_id"])
        
        return sessions
    except Exception as e:
        logger.error(f"Error listing user sessions: {e}")
        return []


def get_session_by_id(session_id: str) -> Optional[Dict]:
    """Get a specific chat session by ID"""
    try:
        from bson import ObjectId
        # ✅ แก้ไขเรื่องการเช็ค db (PyMongo quirk)
        if db is None:
            raise RuntimeError("Database not connected")
            
        collection = db["Sessions"]
        
        session = collection.find_one({"_id": ObjectId(session_id)})
        if session:
            session["_id"] = str(session["_id"])
        return session
    except Exception as e:
        logger.error(f"Error fetching session: {e}")
        return None


def delete_session(session_id: str) -> bool:
    """Delete a chat session and all its messages"""
    try:
        from bson import ObjectId
        if db is None:
            raise RuntimeError("Database not connected")
            
        sessions_collection = db["Sessions"]
        messages_collection = db["History"]
        
        # Delete all messages in the session
        messages_collection.delete_many({"sessionId": session_id})
        
        # Delete the session
        result = sessions_collection.delete_one({"_id": ObjectId(session_id)})
        
        if result.deleted_count > 0:
            logger.info(f"Chat session deleted: {session_id}")
            return True
        return False
    except Exception as e:
        logger.error(f"Error deleting session: {e}")
        return False


def update_session_title(session_id: str, new_title: str) -> bool:
    """Update the title of a chat session"""
    try:
        from bson import ObjectId
        if db is None:
            raise RuntimeError("Database not connected")
            
        collection = db["Sessions"]
        
        result = collection.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "title": new_title,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Error updating session title: {e}")
        return False


def get_session_messages(session_id: str, limit: int = 50) -> List[Dict]:
    """Get all messages for a specific session"""
    try:
        if db is None:
            raise RuntimeError("Database not connected")
            
        collection = db["History"]
        
        messages = list(
            collection
            .find({"sessionId": session_id})
            .sort("createdAt", ASCENDING)
            .limit(limit)
        )
        
        for msg in messages:
            msg["_id"] = str(msg["_id"])
        
        return messages
    except Exception as e:
        logger.error(f"Error fetching session messages: {e}")
        return []


# ============================================
# Ensure Sessions collection exists
# ============================================

def create_sessions_collection():
    """Create Sessions collection with schema and indexes"""
    collection_name = "Sessions"
    
    if collection_name not in db.list_collection_names():
        logger.info(f"Creating '{collection_name}' collection...")
        db.create_collection(collection_name)
    else:
        logger.info(f"'{collection_name}' collection already exists")
    
    sessions_collection = db[collection_name]
    
    try:
        # Index on userId for quick lookup
        sessions_collection.create_index([("userId", ASCENDING)])
        logger.info("✅ Created index on 'userId' in Sessions")
        
        # Compound index on userId and updatedAt for efficient sorting
        sessions_collection.create_index([("userId", ASCENDING), ("updatedAt", DESCENDING)])
        logger.info("✅ Created compound index on 'userId' and 'updatedAt' in Sessions")
        
    except Exception as e:
        logger.warning(f"Index creation note: {e}")
    
    return sessions_collection


if __name__ == "__main__":
    # Test connection and initialization
    logging.basicConfig(level=logging.INFO)
    try:
        connect_mongodb()
        initialize_collections()
        print("✅ Database setup completed successfully!")
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
    finally:
        close_mongodb()