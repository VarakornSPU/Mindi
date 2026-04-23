#!/usr/bin/env python
"""Check if users are saved in MongoDB"""
from database import connect_mongodb, get_users_collection

try:
    connect_mongodb()
    users_col = get_users_collection()
    users = list(users_col.find())
    
    print(f"\n📊 Total users in database: {len(users)}")
    print("\n" + "="*60)
    
    if users:
        for i, user in enumerate(users, 1):
            print(f"\nUser #{i}:")
            print(f"  Email: {user.get('email')}")
            print(f"  ID: {user.get('_id')}")
            print(f"  Created: {user.get('createdAt')}")
            print(f"  Active: {user.get('is_active')}")
    else:
        print("❌ No users found in database!")
    
    print("\n" + "="*60)
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
