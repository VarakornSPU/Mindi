#!/usr/bin/env python
"""Clean up legacy/empty collections"""
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME")

try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client[MONGODB_DB_NAME]
    
    # Collections to drop (empty legacy collections)
    legacy_collections = ["users", "chat_history"]
    
    print(f"🗑️  Cleaning up legacy collections in {MONGODB_DB_NAME}...\n")
    
    for col_name in legacy_collections:
        if col_name in db.list_collection_names():
            db[col_name].drop()
            print(f"✅ Dropped '{col_name}' collection")
        else:
            print(f"ℹ️  '{col_name}' doesn't exist")
    
    print(f"\n📊 Remaining collections:")
    for col in db.list_collection_names():
        count = db[col].count_documents({})
        print(f"  • {col}: {count} documents")
    
    print("\n✅ Cleanup complete!")
    
except Exception as e:
    print(f"❌ Error: {e}")
