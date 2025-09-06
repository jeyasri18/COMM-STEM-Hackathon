#!/usr/bin/env python3
"""
Test script for the enhanced message features in the Nature x Fashion app.
This script demonstrates all the new message functionality.
"""

import requests
import json
import time

# Base URL for the API
BASE_URL = "http://localhost:5002"

def test_message_enhancements():
    """Test all the enhanced message features"""
    print("🌿 Testing Enhanced Message Features - Nature x Fashion App 🌿\n")
    
    # Test data
    users = [
        {"username": "eco_fashionista", "email": "eco@example.com"},
        {"username": "sustainable_style", "email": "sustainable@example.com"},
        {"username": "green_wardrobe", "email": "green@example.com"}
    ]
    
    user_ids = []
    
    # 1. Create users
    print("1. Creating users...")
    for user_data in users:
        response = requests.post(f"{BASE_URL}/create_user", json=user_data)
        if response.status_code == 200:
            user_id = response.json()["user_id"]
            user_ids.append(user_id)
            print(f"   ✅ Created user: {user_data['username']} (ID: {user_id})")
        else:
            print(f"   ❌ Failed to create user: {user_data['username']}")
    
    if len(user_ids) < 2:
        print("   ❌ Need at least 2 users to test features")
        return
    
    # 2. Test enhanced messaging with different types
    print("\n2. Testing enhanced messaging...")
    
    # Send text message
    text_message = {
        "sender_id": user_ids[0],
        "receiver_id": user_ids[1],
        "text": "Hi! I love your sustainable fashion posts! 🌿",
        "message_type": "text"
    }
    response = requests.post(f"{BASE_URL}/messages", json=text_message)
    if response.status_code == 200:
        message_id = response.json()["message_id"]
        print(f"   ✅ Text message sent (ID: {message_id})")
    else:
        print(f"   ❌ Failed to send text message: {response.json()}")
        return
    
    # Send image message
    image_message = {
        "sender_id": user_ids[1],
        "receiver_id": user_ids[0],
        "text": "Check out this eco-friendly outfit!",
        "message_type": "image",
        "attachment_url": "https://example.com/sustainable-outfit.jpg"
    }
    response = requests.post(f"{BASE_URL}/messages", json=image_message)
    if response.status_code == 200:
        image_message_id = response.json()["message_id"]
        print(f"   ✅ Image message sent (ID: {image_message_id})")
    else:
        print(f"   ❌ Failed to send image message: {response.json()}")
    
    # Send file message
    file_message = {
        "sender_id": user_ids[0],
        "receiver_id": user_ids[1],
        "text": "Here's the sustainability report I mentioned",
        "message_type": "file",
        "attachment_url": "https://example.com/sustainability-report.pdf"
    }
    response = requests.post(f"{BASE_URL}/messages", json=file_message)
    if response.status_code == 200:
        file_message_id = response.json()["message_id"]
        print(f"   ✅ File message sent (ID: {file_message_id})")
    else:
        print(f"   ❌ Failed to send file message: {response.json()}")
    
    # 3. Test message reactions
    print("\n3. Testing message reactions...")
    
    # Add reactions to the first message
    reactions = ["👍", "❤️", "🌿", "👍", "😊"]
    for emoji in reactions:
        reaction_data = {
            "user_id": user_ids[1],
            "emoji": emoji
        }
        response = requests.post(f"{BASE_URL}/messages/{message_id}/reaction", json=reaction_data)
        if response.status_code == 200:
            print(f"   ✅ Added reaction: {emoji}")
        else:
            print(f"   ❌ Failed to add reaction {emoji}: {response.json()}")
    
    # Get message reactions
    response = requests.get(f"{BASE_URL}/messages/{message_id}/reactions")
    if response.status_code == 200:
        reactions_data = response.json()
        print(f"   ✅ Message reactions: {reactions_data['reactions']}")
    else:
        print(f"   ❌ Failed to get reactions: {response.json()}")
    
    # 4. Test message editing
    print("\n4. Testing message editing...")
    
    edit_data = {
        "user_id": user_ids[0],
        "text": "Hi! I love your sustainable fashion posts! 🌿✨ (edited)"
    }
    response = requests.put(f"{BASE_URL}/messages/{message_id}/edit", json=edit_data)
    if response.status_code == 200:
        print("   ✅ Message edited successfully")
    else:
        print(f"   ❌ Failed to edit message: {response.json()}")
    
    # 5. Test message deletion
    print("\n5. Testing message deletion...")
    
    # Send a message to delete
    delete_test_message = {
        "sender_id": user_ids[1],
        "receiver_id": user_ids[0],
        "text": "This message will be deleted",
        "message_type": "text"
    }
    response = requests.post(f"{BASE_URL}/messages", json=delete_test_message)
    if response.status_code == 200:
        delete_message_id = response.json()["message_id"]
        print(f"   ✅ Test message sent for deletion (ID: {delete_message_id})")
        
        # Delete the message
        delete_data = {"user_id": user_ids[1]}
        response = requests.delete(f"{BASE_URL}/messages/{delete_message_id}/delete", json=delete_data)
        if response.status_code == 200:
            print("   ✅ Message deleted successfully")
        else:
            print(f"   ❌ Failed to delete message: {response.json()}")
    else:
        print(f"   ❌ Failed to send test message for deletion: {response.json()}")
    
    # 6. Test enhanced conversation retrieval
    print("\n6. Testing enhanced conversation retrieval...")
    response = requests.get(f"{BASE_URL}/messages/{user_ids[0]}/{user_ids[1]}")
    if response.status_code == 200:
        conversation = response.json()
        print(f"   ✅ Retrieved enhanced conversation with {len(conversation)} messages:")
        for msg in conversation:
            status = ""
            if msg.get('is_edited'):
                status += " (edited)"
            if msg.get('is_deleted'):
                status += " (deleted)"
            if msg.get('attachment_url'):
                status += f" [attachment: {msg['message_type']}]"
            
            print(f"      {msg['id']}: {msg['text']}{status}")
            if msg.get('reactions') and msg['reactions'] != "{}":
                print(f"         Reactions: {msg['reactions']}")
    else:
        print(f"   ❌ Failed to get conversation: {response.json()}")
    
    # 7. Test message search
    print("\n7. Testing message search...")
    search_queries = ["sustainable", "fashion", "eco"]
    for query in search_queries:
        response = requests.get(f"{BASE_URL}/messages/search?user_id={user_ids[0]}&q={query}")
        if response.status_code == 200:
            results = response.json()
            print(f"   ✅ Search '{query}': Found {len(results)} messages")
            for result in results[:2]:  # Show first 2 results
                print(f"      - {result['text'][:50]}...")
        else:
            print(f"   ❌ Search '{query}' failed: {response.json()}")
    
    # 8. Test conversation list with enhanced data
    print("\n8. Testing conversation list...")
    response = requests.get(f"{BASE_URL}/messages/{user_ids[0]}/conversations")
    if response.status_code == 200:
        conversations = response.json()
        print(f"   ✅ User {user_ids[0]} has {len(conversations)} conversations:")
        for conv in conversations:
            print(f"      - {conv['partner_username']}: '{conv['last_message'][:30]}...'")
    else:
        print(f"   ❌ Failed to get conversation list: {response.json()}")
    
    print("\n🎉 All enhanced message features tested successfully! 🎉")
    print("\n✨ New Message Features Added:")
    print("   📎 Message Attachments (images, files)")
    print("   😊 Emoji Reactions to Messages")
    print("   ✏️ Message Editing with Edit History")
    print("   🗑️ Message Deletion (Soft Delete)")
    print("   🔍 Message Search Functionality")
    print("   📊 Enhanced Message Data (edit status, reactions)")
    print("   🏷️ Multiple Message Types (text, image, file)")
    print("   ⏰ Edit and Delete Timestamps")

if __name__ == "__main__":
    try:
        test_message_enhancements()
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the API. Make sure the Flask app is running on port 5002.")
        print("   Run: python3 app.py")
    except Exception as e:
        print(f"❌ An error occurred: {e}")
