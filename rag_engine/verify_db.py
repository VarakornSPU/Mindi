#!/usr/bin/env python
"""Verify complete MongoDB structure and collections"""
from database import connect_mongodb, get_chat_history_collection
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME")

try:
    # Connect directly
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client[MONGODB_DB_NAME]
    
    print(f"\n🔍 Database: {MONGODB_DB_NAME}")
    print("="*60)
    
    # List all collections
    collections = db.list_collection_names()
    print(f"\n📁 Collections in database ({len(collections)} total):")
    for col in collections:
        count = db[col].count_documents({})
        print(f"  • {col}: {count} documents")
    
    # Detailed Users collection
    print("\n" + "="*60)
    print("📋 Users Collection Schema (Sample):")
    users_col = db["Users"]
    sample = users_col.find_one()
    if sample:
        print(f"  Keys: {list(sample.keys())}")
        print(f"  Total docs: {users_col.count_documents({})}")
    
    # Detailed History collection
    print("\n📋 History Collection Schema (Sample):")
    history_col = db["History"]
    sample_history = history_col.find_one()
    if sample_history:
        print(f"  Keys: {list(sample_history.keys())}")
        print(f"  Total docs: {history_col.count_documents({})}")
    
    print("\n" + "="*60)
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
