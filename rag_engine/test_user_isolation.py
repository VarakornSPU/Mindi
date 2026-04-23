#!/usr/bin/env python
"""
Test script to verify user chat isolation
This tests that different users can't see each other's chat sessions and messages
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

# Test users
USER1 = {"email": "user1@test.com", "password": "pass123"}
USER2 = {"email": "user2@test.com", "password": "pass456"}

def test_user_chat_isolation():
    print("\n" + "="*70)
    print("🔐 Testing User Chat Isolation (Security Fix)")
    print("="*70)
    
    # 1. Register/Login User 1
    print("\n1️⃣  Registering User 1...")
    reg1 = requests.post(f"{BASE_URL}/auth/register", 
        json=USER1).json()
    if 'error' in reg1:
        print(f"   (User 1 already exists)")
    else:
        print(f"   ✅ User 1 registered: {reg1.get('user_id')}")
    
    login1 = requests.post(f"{BASE_URL}/auth/login", json=USER1).json()
    token1 = login1['token']
    user1_id = login1['user_id']
    print(f"   ✅ User 1 logged in: {user1_id}")
    
    # 2. Register/Login User 2
    print("\n2️⃣  Registering User 2...")
    reg2 = requests.post(f"{BASE_URL}/auth/register",
        json=USER2).json()
    if 'error' in reg2:
        print(f"   (User 2 already exists)")
    else:
        print(f"   ✅ User 2 registered: {reg2.get('user_id')}")
    
    login2 = requests.post(f"{BASE_URL}/auth/login", json=USER2).json()
    token2 = login2['token']
    user2_id = login2['user_id']
    print(f"   ✅ User 2 logged in: {user2_id}")
    
    # 3. Create chat session for User 1
    print("\n3️⃣  Creating chat session for User 1...")
    session1_resp = requests.post(f"{BASE_URL}/chat/sessions",
        params={"token": token1, "user_id": user1_id},
        json={"title": "User 1 Private Chat"})
    
    print(f"   Response: {session1_resp.text}")
    session1 = session1_resp.json()
    
    if 'error' in session1:
        print(f"   ❌ Error creating session: {session1.get('error')}")
        return
    
    session1_id = session1['session_id']
    print(f"   ✅ Session created: {session1_id}")
    
    # 4. Save message to User 1's session
    print("\n4️⃣  Saving message to User 1's session...")
    msg1 = requests.post(f"{BASE_URL}/chat/messages",
        json={
            "user_id": user1_id,
            "session_id": session1_id,
            "role": "user",
            "content": "This is User 1's secret message",
            "message_type": "text"
        }).json()
    print(f"   ✅ Message saved: {msg1.get('message_id')}")
    
    # 5. Test: User 1 can access their own session ✅
    print("\n5️⃣  User 1 accessing their own session...")
    user1_access = requests.get(
        f"{BASE_URL}/chat/messages/{session1_id}",
        params={"user_id": user1_id, "token": token1}).json()
    if "messages" in user1_access:
        print(f"   ✅ User 1 can access their session: {len(user1_access['messages'])} messages")
    else:
        print(f"   ❌ FAILED: {user1_access.get('error')}")
    
    # 6. Test SECURITY: User 2 tries to access User 1's session (should FAIL) ❌
    print("\n6️⃣  User 2 attempting to access User 1's session (SHOULD FAIL)...")
    user2_attack = requests.get(
        f"{BASE_URL}/chat/messages/{session1_id}",
        params={"user_id": user2_id, "token": token2}).json()
    
    if user2_attack.get('error'):
        print(f"   ✅ BLOCKED! Error: {user2_attack.get('error')}")
        print(f"   ✅ SECURITY TEST PASSED - Users are properly isolated!")
    else:
        print(f"   ❌ SECURITY BREACH! User 2 accessed User 1's messages: {user2_attack}")
    
    # 7. Test SECURITY: User 2 tries to delete User 1's session (should FAIL) ❌
    print("\n7️⃣  User 2 attempting to delete User 1's session (SHOULD FAIL)...")
    delete_attack = requests.delete(
        f"{BASE_URL}/chat/sessions/{session1_id}",
        params={"user_id": user2_id, "token": token2}).json()
    
    if delete_attack.get('error'):
        print(f"   ✅ BLOCKED! Error: {delete_attack.get('error')}")
    else:
        print(f"   ❌ SECURITY BREACH! User 2 deleted User 1's session: {delete_attack}")
    
    print("\n" + "="*70)
    print("✅ All security tests completed!")
    print("="*70)

if __name__ == "__main__":
    try:
        test_user_chat_isolation()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
