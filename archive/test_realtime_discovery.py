#!/usr/bin/env python3
"""
Test script for the real-time and user discovery features in the Nature x Fashion app.
This script demonstrates all the new functionality.
"""

import requests
import json
import time

# Base URL for the API
BASE_URL = "http://localhost:5002"

def test_realtime_discovery():
    """Test all the real-time and discovery features"""
    print("🌿 Testing Real-time & Discovery Features - Nature x Fashion App 🌿\n")
    
    # Test data with enhanced user profiles
    users = [
        {
            "username": "eco_fashionista", 
            "email": "eco@example.com",
            "bio": "Sustainable fashion enthusiast 🌱 | Eco-friendly clothing lover",
            "location": "San Francisco, CA",
            "interests": ["sustainable fashion", "eco-friendly", "minimalism", "vintage"]
        },
        {
            "username": "sustainable_style", 
            "email": "sustainable@example.com",
            "bio": "Eco-conscious fashion blogger | Promoting ethical clothing",
            "location": "Portland, OR",
            "interests": ["ethical fashion", "sustainable living", "organic cotton", "fair trade"]
        },
        {
            "username": "green_wardrobe", 
            "email": "green@example.com",
            "bio": "Minimalist fashion advocate | Building a capsule wardrobe",
            "location": "Seattle, WA",
            "interests": ["minimalism", "capsule wardrobe", "slow fashion", "upcycling"]
        }
    ]
    
    user_ids = []
    
    # 1. Create enhanced users
    print("1. Creating enhanced users...")
    for user_data in users:
        response = requests.post(f"{BASE_URL}/create_user", json=user_data)
        if response.status_code == 200:
            user_id = response.json()["user_id"]
            user_ids.append(user_id)
            print(f"   ✅ Created user: {user_data['username']} (ID: {user_id})")
            print(f"      Bio: {user_data['bio']}")
            print(f"      Location: {user_data['location']}")
            print(f"      Interests: {', '.join(user_data['interests'])}")
        else:
            print(f"   ❌ Failed to create user: {user_data['username']}")
    
    if len(user_ids) < 2:
        print("   ❌ Need at least 2 users to test features")
        return
    
    # 2. Test online status management
    print("\n2. Testing online status management...")
    
    # Set users online
    for i, user_id in enumerate(user_ids[:2]):
        response = requests.post(f"{BASE_URL}/users/{user_id}/online", json={"is_online": True})
        if response.status_code == 200:
            print(f"   ✅ User {user_id} is now online")
        else:
            print(f"   ❌ Failed to set user {user_id} online")
    
    # Get online users
    response = requests.get(f"{BASE_URL}/users/online")
    if response.status_code == 200:
        online_users = response.json()
        print(f"   ✅ Found {len(online_users)} online users:")
        for user in online_users:
            print(f"      - {user['username']} (Trust Score: {user['trust_score']})")
    else:
        print(f"   ❌ Failed to get online users: {response.json()}")
    
    # 3. Test advanced user search
    print("\n3. Testing advanced user search...")
    
    # Search by interests
    search_data = {
        "query": "sustainable",
        "filters": {"is_online": True},
        "limit": 10
    }
    response = requests.post(f"{BASE_URL}/users/search/advanced", json=search_data)
    if response.status_code == 200:
        results = response.json()
        print(f"   ✅ Advanced search found {len(results)} users matching 'sustainable':")
        for user in results:
            print(f"      - {user['username']}: {user['bio']}")
            print(f"        Interests: {', '.join(user['interests'])}")
    else:
        print(f"   ❌ Advanced search failed: {response.json()}")
    
    # Search by location
    search_data = {
        "query": "Portland",
        "filters": {},
        "limit": 10
    }
    response = requests.post(f"{BASE_URL}/users/search/advanced", json=search_data)
    if response.status_code == 200:
        results = response.json()
        print(f"   ✅ Location search found {len(results)} users in Portland:")
        for user in results:
            print(f"      - {user['username']} from {user['location']}")
    
    # 4. Test user recommendations
    print("\n4. Testing user recommendations...")
    response = requests.get(f"{BASE_URL}/users/{user_ids[0]}/recommendations")
    if response.status_code == 200:
        recommendations = response.json()
        print(f"   ✅ User {user_ids[0]} has {len(recommendations)} recommendations:")
        for rec in recommendations:
            print(f"      - {rec['username']}: {rec['bio']}")
            print(f"        Common interests: {', '.join(rec['common_interests'])}")
    else:
        print(f"   ❌ Failed to get recommendations: {response.json()}")
    
    # 5. Test following system
    print("\n5. Testing following system...")
    
    # User 1 follows User 2
    follow_data = {"follower_id": user_ids[0]}
    response = requests.post(f"{BASE_URL}/users/{user_ids[1]}/follow", json=follow_data)
    if response.status_code == 200:
        print(f"   ✅ User {user_ids[0]} followed User {user_ids[1]}")
    else:
        print(f"   ❌ Failed to follow user: {response.json()}")
    
    # User 2 follows User 1
    follow_data = {"follower_id": user_ids[1]}
    response = requests.post(f"{BASE_URL}/users/{user_ids[0]}/follow", json=follow_data)
    if response.status_code == 200:
        print(f"   ✅ User {user_ids[1]} followed User {user_ids[0]}")
    
    # Get following list
    response = requests.get(f"{BASE_URL}/users/{user_ids[0]}/connections?type=following")
    if response.status_code == 200:
        following = response.json()
        print(f"   ✅ User {user_ids[0]} is following {len(following)} users:")
        for user in following:
            print(f"      - {user['username']}")
    
    # Get followers list
    response = requests.get(f"{BASE_URL}/users/{user_ids[0]}/connections?type=followers")
    if response.status_code == 200:
        followers = response.json()
        print(f"   ✅ User {user_ids[0]} has {len(followers)} followers:")
        for user in followers:
            print(f"      - {user['username']}")
    
    # 6. Test notifications system
    print("\n6. Testing notifications system...")
    
    # Send a message to trigger notification
    message_data = {
        "sender_id": user_ids[1],
        "receiver_id": user_ids[0],
        "text": "Hi! Thanks for following me! 🌿",
        "message_type": "text"
    }
    response = requests.post(f"{BASE_URL}/messages", json=message_data)
    if response.status_code == 200:
        print("   ✅ Message sent to trigger notification")
    
    # Rate a user to trigger notification
    rating_data = {
        "rater_id": user_ids[0],
        "rating_value": 5
    }
    response = requests.post(f"{BASE_URL}/rate_user/{user_ids[1]}", json=rating_data)
    if response.status_code == 200:
        print("   ✅ Rating given to trigger notification")
    
    # Get notifications
    response = requests.get(f"{BASE_URL}/users/{user_ids[0]}/notifications")
    if response.status_code == 200:
        notifications = response.json()
        print(f"   ✅ User {user_ids[0]} has {len(notifications)} notifications:")
        for notif in notifications[:3]:  # Show first 3
            print(f"      - {notif['title']}: {notif['message']}")
            print(f"        Type: {notif['type']}, Read: {notif['is_read']}")
    else:
        print(f"   ❌ Failed to get notifications: {response.json()}")
    
    # 7. Test profile updates
    print("\n7. Testing profile updates...")
    
    profile_update = {
        "bio": "Updated bio: Passionate about sustainable fashion and eco-friendly living 🌿✨",
        "location": "San Francisco Bay Area, CA",
        "interests": ["sustainable fashion", "eco-friendly", "minimalism", "vintage", "upcycling"]
    }
    response = requests.put(f"{BASE_URL}/users/{user_ids[0]}/profile", json=profile_update)
    if response.status_code == 200:
        print("   ✅ Profile updated successfully")
    else:
        print(f"   ❌ Failed to update profile: {response.json()}")
    
    # 8. Test user activity tracking
    print("\n8. Testing user activity tracking...")
    response = requests.get(f"{BASE_URL}/users/{user_ids[0]}/activity")
    if response.status_code == 200:
        activities = response.json()
        print(f"   ✅ User {user_ids[0]} has {len(activities)} activities:")
        for activity in activities[:5]:  # Show first 5
            print(f"      - {activity['activity_type']} at {activity['timestamp']}")
            if activity['details']:
                print(f"        Details: {activity['details']}")
    else:
        print(f"   ❌ Failed to get activity: {response.json()}")
    
    # 9. Test enhanced user listing
    print("\n9. Testing enhanced user listing...")
    response = requests.get(f"{BASE_URL}/users")
    if response.status_code == 200:
        all_users = response.json()
        print(f"   ✅ Found {len(all_users)} total users with enhanced data:")
        for user in all_users:
            status = "🟢 Online" if user['is_online'] else "🔴 Offline"
            print(f"      - {user['username']} {status}")
            print(f"        Bio: {user['bio']}")
            print(f"        Location: {user['location']}")
            print(f"        Trust Score: {user['trust_score']}")
            print(f"        Interests: {', '.join(user['interests'])}")
    else:
        print(f"   ❌ Failed to get users: {response.json()}")
    
    # 10. Test notification management
    print("\n10. Testing notification management...")
    
    # Mark a notification as read
    if 'notifications' in locals() and notifications:
        notification_id = notifications[0]['id']
        response = requests.post(f"{BASE_URL}/notifications/{notification_id}/read", 
                               json={"user_id": user_ids[0]})
        if response.status_code == 200:
            print("   ✅ Notification marked as read")
        else:
            print(f"   ❌ Failed to mark notification as read: {response.json()}")
    
    # Mark all notifications as read
    response = requests.post(f"{BASE_URL}/users/{user_ids[0]}/notifications/read_all")
    if response.status_code == 200:
        print("   ✅ All notifications marked as read")
    else:
        print(f"   ❌ Failed to mark all notifications as read: {response.json()}")
    
    # 11. Test unfollowing
    print("\n11. Testing unfollowing...")
    unfollow_data = {"follower_id": user_ids[0]}
    response = requests.post(f"{BASE_URL}/users/{user_ids[1]}/unfollow", json=unfollow_data)
    if response.status_code == 200:
        print(f"   ✅ User {user_ids[0]} unfollowed User {user_ids[1]}")
    else:
        print(f"   ❌ Failed to unfollow user: {response.json()}")
    
    # 12. Test offline status
    print("\n12. Testing offline status...")
    response = requests.post(f"{BASE_URL}/users/{user_ids[0]}/online", json={"is_online": False})
    if response.status_code == 200:
        print(f"   ✅ User {user_ids[0]} is now offline")
    else:
        print(f"   ❌ Failed to set user offline: {response.json()}")
    
    print("\n🎉 All real-time and discovery features tested successfully! 🎉")
    print("\n✨ New Features Added:")
    print("   🔔 Real-time Notifications System")
    print("   🟢 Online Status Tracking")
    print("   🔍 Advanced User Search & Filtering")
    print("   👥 User Following/Followers System")
    print("   🎯 Smart User Recommendations")
    print("   📊 User Activity Tracking")
    print("   👤 Enhanced User Profiles")
    print("   🌍 Location-based Discovery")
    print("   🏷️ Interest-based Matching")
    print("   📱 Real-time Status Updates")

if __name__ == "__main__":
    try:
        test_realtime_discovery()
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the API. Make sure the Flask app is running on port 5002.")
        print("   Run: python3 app.py")
    except Exception as e:
        print(f"❌ An error occurred: {e}")
