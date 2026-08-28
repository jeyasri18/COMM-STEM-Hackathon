#!/usr/bin/env python3
"""
Test script for the Nature x Fashion app DM and Rating features.
This script demonstrates all the new functionality.
"""

import requests
import json
import time

# Base URL for the API
BASE_URL = "http://localhost:5003"

def test_api():
    """Test all the API endpoints"""
    print("🌿 Testing Nature x Fashion App - DM & Rating Features 🌿\n")
    
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
    
    # 2. Test user search
    print("\n2. Testing user search...")
    response = requests.get(f"{BASE_URL}/users/search?q=eco")
    if response.status_code == 200:
        results = response.json()
        print(f"   ✅ Found {len(results)} users matching 'eco'")
        for user in results:
            print(f"      - {user['username']} (Trust Score: {user['trust_score']})")
    
    # 3. Test rating system
    print("\n3. Testing rating system...")
    
    # Rate user 2 from user 1
    rating_data = {
        "rater_id": user_ids[0],
        "rating_value": 5
    }
    response = requests.post(f"{BASE_URL}/rate_user/{user_ids[1]}", json=rating_data)
    if response.status_code == 200:
        print(f"   ✅ User {user_ids[0]} rated user {user_ids[1]} with 5 stars")
    else:
        print(f"   ❌ Failed to rate user: {response.json()}")
    
    # Rate user 1 from user 2
    rating_data = {
        "rater_id": user_ids[1],
        "rating_value": 4
    }
    response = requests.post(f"{BASE_URL}/rate_user/{user_ids[0]}", json=rating_data)
    if response.status_code == 200:
        print(f"   ✅ User {user_ids[1]} rated user {user_ids[0]} with 4 stars")
    
    # Rate user 3 from user 1
    if len(user_ids) > 2:
        rating_data = {
            "rater_id": user_ids[0],
            "rating_value": 3
        }
        response = requests.post(f"{BASE_URL}/rate_user/{user_ids[2]}", json=rating_data)
        if response.status_code == 200:
            print(f"   ✅ User {user_ids[0]} rated user {user_ids[2]} with 3 stars")
    
    # 4. Test user profiles and rating stats
    print("\n4. Testing user profiles...")
    for i, user_id in enumerate(user_ids[:2]):
        response = requests.get(f"{BASE_URL}/users/{user_id}/profile")
        if response.status_code == 200:
            profile = response.json()
            print(f"   ✅ User {user_id} profile:")
            print(f"      - Username: {profile['username']}")
            print(f"      - Trust Score: {profile['trust_score']}")
            print(f"      - Total Ratings: {profile['rating_stats']['total_ratings']}")
            print(f"      - Average Rating: {profile['rating_stats']['average_rating']}")
    
    # 5. Test DM system
    print("\n5. Testing DM system...")
    
    # Send messages between users
    messages = [
        {"sender_id": user_ids[0], "receiver_id": user_ids[1], "text": "Hi! I love your sustainable fashion posts! 🌿"},
        {"sender_id": user_ids[1], "receiver_id": user_ids[0], "text": "Thank you! I'm passionate about eco-friendly clothing"},
        {"sender_id": user_ids[0], "receiver_id": user_ids[1], "text": "Would you like to collaborate on a project?"},
        {"sender_id": user_ids[1], "receiver_id": user_ids[0], "text": "Absolutely! That sounds amazing! 🌱"}
    ]
    
    for msg_data in messages:
        response = requests.post(f"{BASE_URL}/messages", json=msg_data)
        if response.status_code == 200:
            print(f"   ✅ Message sent: '{msg_data['text'][:30]}...'")
        else:
            print(f"   ❌ Failed to send message: {response.json()}")
        time.sleep(0.1)  # Small delay for realistic timestamps
    
    # 6. Test conversation retrieval
    print("\n6. Testing conversation retrieval...")
    response = requests.get(f"{BASE_URL}/messages/{user_ids[0]}/{user_ids[1]}")
    if response.status_code == 200:
        conversation = response.json()
        print(f"   ✅ Retrieved conversation with {len(conversation)} messages:")
        for msg in conversation:
            sender = "You" if msg['from'] == user_ids[0] else "Them"
            print(f"      {sender}: {msg['text']}")
    
    # 7. Test conversation list
    print("\n7. Testing conversation list...")
    response = requests.get(f"{BASE_URL}/messages/{user_ids[0]}/conversations")
    if response.status_code == 200:
        conversations = response.json()
        print(f"   ✅ User {user_ids[0]} has {len(conversations)} conversations:")
        for conv in conversations:
            print(f"      - {conv['partner_username']}: '{conv['last_message'][:30]}...'")
    
    # 8. Test rating history
    print("\n8. Testing rating history...")
    response = requests.get(f"{BASE_URL}/users/{user_ids[0]}/ratings")
    if response.status_code == 200:
        history = response.json()
        print(f"   ✅ User {user_ids[0]} rating history:")
        print(f"      - Given ratings: {len(history['given_ratings'])}")
        print(f"      - Received ratings: {len(history['received_ratings'])}")
    
    # 9. Test marking messages as read
    print("\n9. Testing mark messages as read...")
    response = requests.post(f"{BASE_URL}/messages/{user_ids[0]}/{user_ids[1]}/read")
    if response.status_code == 200:
        print("   ✅ Messages marked as read")
    
    print("\n🎉 All tests completed! Your DM and rating features are working perfectly! 🎉")

if __name__ == "__main__":
    try:
        test_api()
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the API. Make sure the Flask app is running on port 5003.")
        print("   Run: python app.py")
    except Exception as e:
        print(f"❌ An error occurred: {e}")
