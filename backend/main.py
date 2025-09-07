"""
Main FastAPI application combining all backend functionality
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import uvicorn
import hashlib
from dotenv import load_dotenv
from supabase import create_client, Client

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL", "https://lcmdkuzvixgevkcdmbyg.supabase.co")
supabase_key = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjbWRrdXp2aXhnZXZrY2RtYnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDIyMzgsImV4cCI6MjA3MjcxODIzOH0.r6-ZiUSkqXnLgt_BmSMSjqgyoc91TU3IpUr5kKmVZS8")
supabase: Client = create_client(supabase_url, supabase_key)

# from customer_reviews import RatingsEngine  # Remove this import
# from social_style import SocialApp  # Remove this import

# Simple in-memory ratings engine
class RatingsEngine:
    def __init__(self):
        self.users = {}
        self.listings = {}
        self.rentals = {}  # Track who borrowed what
        self.user_id_counter = 1
        self.listing_id_counter = 1
        self.rental_id_counter = 1
    
    def add_user(self, name, circle):
        """Add a user and return their ID"""
        user_id = self.user_id_counter
        user = type('User', (), {
            'user_id': user_id,
            'name': name,
            'circle': circle
        })()
        self.users[user_id] = user
        self.user_id_counter += 1
        return user_id
    
    def add_listing(self, owner_id, title, description, privacy="public"):
        """Add a listing and return its ID"""
        listing_id = self.listing_id_counter
        listing = type('Listing', (), {
            'listing_id': listing_id,
            'owner_id': owner_id,
            'title': title,
            'description': description,
            'privacy': privacy
        })()
        self.listings[listing_id] = listing
        self.listing_id_counter += 1
        return listing_id
    
    def add_or_update_review(self, rater_id, listing_id, material_construction, performance_durability, aesthetics_comfort, comment):
        """Add or update a review (convert to rating format)"""
        # Convert review format to rating format
        overall_rating = (material_construction + performance_durability + aesthetics_comfort) / 3
        return rating_system.add_clothing_rating(
            user_id=rater_id,
            listing_id=listing_id,
            rating=overall_rating,
            comment=comment,
            quality_rating=material_construction,
            style_rating=aesthetics_comfort,
            condition_rating=performance_durability
        )
    
    def create_rental(self, borrower_id, listing_id):
        """Create a rental record when someone borrows an item"""
        # This method is now handled by the main rental system
        # We'll use the rental_system to create the rental
        try:
            rental = rental_system.create_rental_request(
                borrower_id=borrower_id,
                listing_id=listing_id,
                start_date=datetime.now().date().isoformat(),
                end_date=(datetime.now().date() + timedelta(days=7)).isoformat(),  # Default 7 days
                message="Auto-created rental for rating purposes"
            )
            return rental["rental_id"]
        except Exception as e:
            # Fallback to in-memory if Supabase fails
            rental_id = self.rental_id_counter
            rental = {
                'rental_id': rental_id,
                'borrower_id': borrower_id,
                'listing_id': listing_id,
                'owner_id': self.listings[listing_id].owner_id,
                'created_at': datetime.now(),
                'item_rated': False,
                'user_rated': False
            }
            self.rentals[rental_id] = rental
            self.rental_id_counter += 1
            return rental_id
    
    def can_rate_item(self, user_id, listing_id):
        """Check if user can rate an item (must have borrowed it)"""
        # Check in-memory rentals first (fallback)
        for rental in self.rentals.values():
            if rental['borrower_id'] == user_id and rental['listing_id'] == listing_id:
                return True
        
        # Check Supabase rentals
        try:
            user_id_str = str(user_id)
            response = supabase.table('rentals').select('id').eq('borrower_id', user_id_str).eq('listing_id', listing_id).execute()
            return len(response.data) > 0
        except Exception:
            return False
    
    def can_rate_user(self, rater_id, rated_user_id, listing_id):
        """Check if user can rate another user (must be owner of item that was borrowed)"""
        # Check in-memory rentals first (fallback)
        for rental in self.rentals.values():
            if (rental['owner_id'] == rater_id and 
                rental['borrower_id'] == rated_user_id and 
                rental['listing_id'] == listing_id and
                rental['item_rated']):  # Item must be rated first
                return True
        
        # Check Supabase rentals (simplified - assume item is rated if rental exists)
        try:
            rater_id_str = str(rater_id)
            rated_user_id_str = str(rated_user_id)
            response = supabase.table('rentals').select('id').eq('owner_id', rater_id_str).eq('borrower_id', rated_user_id_str).eq('listing_id', listing_id).execute()
            return len(response.data) > 0
        except Exception:
            return False
    
    def mark_item_rated(self, user_id, listing_id):
        """Mark that the item has been rated by the borrower"""
        # Check in-memory rentals first (fallback)
        for rental in self.rentals.values():
            if rental['borrower_id'] == user_id and rental['listing_id'] == listing_id:
                rental['item_rated'] = True
                return True
        
        # For Supabase rentals, we'll just return True since we can't easily track this
        # In a real implementation, you might want to add a column to track this
        try:
            user_id_str = str(user_id)
            response = supabase.table('rentals').select('id').eq('borrower_id', user_id_str).eq('listing_id', listing_id).execute()
            return len(response.data) > 0
        except Exception:
            return False
    
    def mark_user_rated(self, owner_id, borrower_id, listing_id):
        """Mark that the user has been rated by the owner"""
        # Check in-memory rentals first (fallback)
        for rental in self.rentals.values():
            if (rental['owner_id'] == owner_id and 
                rental['borrower_id'] == borrower_id and 
                rental['listing_id'] == listing_id):
                rental['user_rated'] = True
                return True
        
        # For Supabase rentals, we'll just return True since we can't easily track this
        # In a real implementation, you might want to add a column to track this
        try:
            owner_id_str = str(owner_id)
            borrower_id_str = str(borrower_id)
            response = supabase.table('rentals').select('id').eq('owner_id', owner_id_str).eq('borrower_id', borrower_id_str).eq('listing_id', listing_id).execute()
            return len(response.data) > 0
        except Exception:
            return False

# Simple social app class
class SocialApp:
    def __init__(self):
        self.following = {}
        self.users = {}
        self.listings = {}
        self.user_id_counter = 1
        self.listing_id_counter = 1
    
    def add_user(self, name, circle):
        """Add a user and return their ID"""
        user_id = self.user_id_counter
        user = type('User', (), {
            'user_id': user_id,
            'name': name,
            'circle': circle
        })()
        self.users[user_id] = user
        self.user_id_counter += 1
        return user_id
    
    def add_listing(self, owner_id, title, description, privacy="public"):
        """Add a listing and return its ID"""
        listing_id = self.listing_id_counter
        listing = type('Listing', (), {
            'listing_id': listing_id,
            'owner_id': owner_id,
            'title': title,
            'description': description,
            'privacy': privacy
        })()
        self.listings[listing_id] = listing
        self.listing_id_counter += 1
        return listing_id

# Create FastAPI app
app = FastAPI(
    title="Hand Me Up API",
    description="Backend for clothing sharing and style matching platform",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
ratings_engine = RatingsEngine()
social_app = SocialApp()

# Create some sample data
def create_sample_data():
    # Create sample users
    for i in range(1, 4):
        ratings_engine.add_user(f'User {i}', 'community')
    
    # Create sample listings
    sample_listings = [
        {"title": "Eco-Friendly Dress", "description": "Beautiful sustainable dress", "owner_id": 1},
        {"title": "Blue Jeans", "description": "Like new", "owner_id": 2},
        {"title": "Vintage Jacket", "description": "Retro style jacket", "owner_id": 3}
    ]
    
    for listing_data in sample_listings:
        ratings_engine.add_listing(
            owner_id=listing_data['owner_id'],
            title=listing_data['title'],
            description=listing_data['description'],
            privacy='public'
        )
    
    # Create sample rentals so users can rate items
    # User 2 borrowed item 1 (owned by User 1)
    ratings_engine.create_rental(2, 1)
    # User 3 borrowed item 2 (owned by User 2)  
    ratings_engine.create_rental(3, 2)
    # User 1 borrowed item 3 (owned by User 3)
    ratings_engine.create_rental(1, 3)
    
    # Create user for the current logged-in user (680865)
    user_680865 = type('User', (), {
        'user_id': 680865,
        'name': 'Meghna',
        'circle': 'community'
    })()
    ratings_engine.users[680865] = user_680865
    
    # Create some sample rentals for the current user
    ratings_engine.create_rental(680865, 1)  # Meghna borrowed item 1
    ratings_engine.create_rental(680865, 2)  # Meghna borrowed item 2
    # Create a rental where Meghna lent an item (she would need to own an item first)
    # For now, let's create a rental where someone borrowed from her
    # We'll need to create an item for Meghna first
    meghna_item_id = ratings_engine.add_listing(
        owner_id=680865,
        title="Meghna's Designer Dress",
        description="Beautiful designer dress",
        privacy='public'
    )
    ratings_engine.create_rental(1, meghna_item_id)  # User 1 borrowed Meghna's item

# Initialize sample data
create_sample_data()

# Sync the counters between engines after sample data creation
social_app.user_id_counter = ratings_engine.user_id_counter
social_app.listing_id_counter = ratings_engine.listing_id_counter

# Simple in-memory messaging system
class MessagingSystem:
    def __init__(self):
        self.messages = []
        self.message_id_counter = 1
    
    def send_message(self, sender_id: int, receiver_id: int, content: str, message_type: str = "text"):
        """Send a message between users"""
        message = {
            "message_id": self.message_id_counter,
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "content": content,
            "message_type": message_type,
            "timestamp": datetime.now(),
            "is_read": False
        }
        self.messages.append(message)
        self.message_id_counter += 1
        return message
    
    def get_conversation(self, user1_id: int, user2_id: int):
        """Get conversation between two users"""
        conversation = []
        for msg in self.messages:
            if ((msg["sender_id"] == user1_id and msg["receiver_id"] == user2_id) or
                (msg["sender_id"] == user2_id and msg["receiver_id"] == user1_id)):
                conversation.append(msg)
        
        # Sort by timestamp
        conversation.sort(key=lambda x: x["timestamp"])
        return conversation
    
    def get_user_conversations(self, user_id: int):
        """Get all conversations for a user"""
        conversations = {}
        for msg in self.messages:
            if msg["sender_id"] == user_id or msg["receiver_id"] == user_id:
                other_id = msg["receiver_id"] if msg["sender_id"] == user_id else msg["sender_id"]
                if other_id not in conversations:
                    conversations[other_id] = []
                conversations[other_id].append(msg)
        
        # Convert to conversation summaries
        result = []
        for other_id, msgs in conversations.items():
            msgs.sort(key=lambda x: x["timestamp"], reverse=True)
            last_msg = msgs[0]
            unread_count = sum(1 for m in msgs if m["receiver_id"] == user_id and not m["is_read"])
            
            result.append({
                "other_user_id": other_id,
                "last_message": last_msg,
                "unread_count": unread_count
            })
        
        # Sort by last message timestamp
        result.sort(key=lambda x: x["last_message"]["timestamp"], reverse=True)
        return result
    
    def mark_as_read(self, message_id: int, user_id: int):
        """Mark a message as read"""
        for msg in self.messages:
            if msg["message_id"] == message_id and msg["receiver_id"] == user_id:
                msg["is_read"] = True
                return True
        return False
    
    def mark_conversation_read(self, user1_id: int, user2_id: int, reader_id: int):
        """Mark all messages in a conversation as read"""
        for msg in self.messages:
            if (((msg["sender_id"] == user1_id and msg["receiver_id"] == user2_id) or
                 (msg["sender_id"] == user2_id and msg["receiver_id"] == user1_id)) and
                msg["receiver_id"] == reader_id):
                msg["is_read"] = True

# Initialize messaging system
messaging = MessagingSystem()

# Rating system
class RatingSystem:
    def __init__(self):
        self.clothing_ratings = []
        self.user_ratings = []
        self.rating_id_counter = 1
    
    def add_clothing_rating(self, user_id, listing_id, rating, comment, quality_rating, style_rating, condition_rating):
        """Add a rating for a clothing item"""
        rating_data = {
            "rating_id": self.rating_id_counter,
            "user_id": user_id,
            "listing_id": listing_id,
            "rating": rating,
            "comment": comment,
            "quality_rating": quality_rating,
            "style_rating": style_rating,
            "condition_rating": condition_rating,
            "created_at": datetime.now()
        }
        self.clothing_ratings.append(rating_data)
        self.rating_id_counter += 1
        return rating_data
    
    def add_user_rating(self, rater_id, rated_user_id, rating, comment, reliability_rating, communication_rating, care_rating):
        """Add a rating for a user"""
        rating_data = {
            "rating_id": self.rating_id_counter,
            "rater_id": rater_id,
            "rated_user_id": rated_user_id,
            "rating": rating,
            "comment": comment,
            "reliability_rating": reliability_rating,
            "communication_rating": communication_rating,
            "care_rating": care_rating,
            "created_at": datetime.now()
        }
        self.user_ratings.append(rating_data)
        self.rating_id_counter += 1
        return rating_data
    
    def get_clothing_ratings(self, listing_id):
        """Get all ratings for a specific clothing item"""
        return [r for r in self.clothing_ratings if r["listing_id"] == listing_id]
    
    def get_user_ratings(self, user_id):
        """Get all ratings for a specific user"""
        return [r for r in self.user_ratings if r["rated_user_id"] == user_id]
    
    def get_user_rating_stats(self, user_id):
        """Get rating statistics for a user"""
        ratings = self.get_user_ratings(user_id)
        if not ratings:
            return {"average_rating": 0, "total_ratings": 0, "reliability": 0, "communication": 0, "care": 0}
        
        avg_rating = sum(r["rating"] for r in ratings) / len(ratings)
        avg_reliability = sum(r["reliability_rating"] for r in ratings) / len(ratings)
        avg_communication = sum(r["communication_rating"] for r in ratings) / len(ratings)
        avg_care = sum(r["care_rating"] for r in ratings) / len(ratings)
        
        return {
            "average_rating": round(avg_rating, 1),
            "total_ratings": len(ratings),
            "reliability": round(avg_reliability, 1),
            "communication": round(avg_communication, 1),
            "care": round(avg_care, 1)
        }
    
    def get_clothing_rating_stats(self, listing_id):
        """Get rating statistics for a clothing item"""
        ratings = self.get_clothing_ratings(listing_id)
        if not ratings:
            return {"average_rating": 0, "total_ratings": 0, "quality": 0, "style": 0, "condition": 0}
        
        avg_rating = sum(r["rating"] for r in ratings) / len(ratings)
        avg_quality = sum(r["quality_rating"] for r in ratings) / len(ratings)
        avg_style = sum(r["style_rating"] for r in ratings) / len(ratings)
        avg_condition = sum(r["condition_rating"] for r in ratings) / len(ratings)
        
        return {
            "average_rating": round(avg_rating, 1),
            "total_ratings": len(ratings),
            "quality": round(avg_quality, 1),
            "style": round(avg_style, 1),
            "condition": round(avg_condition, 1)
        }

# Initialize rating system
rating_system = RatingSystem()

# Rental system
class RentalSystem:
    def __init__(self):
        pass  # No longer using in-memory storage
    
    def create_rental_request(self, borrower_id: str, listing_id: str, start_date: str, end_date: str, message: str = ""):
        """Create a new rental request"""
        # Convert listing_id to int for backend lookup
        try:
            listing_id_int = int(listing_id)
        except ValueError:
            raise ValueError("Invalid listing ID format")
        
        # Get owner_id from the backend listing data
        if listing_id_int not in ratings_engine.listings:
            raise ValueError("Clothing item not found")
        
        listing = ratings_engine.listings[listing_id_int]
        owner_id = str(listing.owner_id)  # Convert to string for comparison
        print(f"Creating rental for clothing item {listing_id} owned by {owner_id}")
        
        # Check if user is trying to rent their own item
        if borrower_id == owner_id:
            raise ValueError("You cannot rent your own items")
        
        # Convert IDs to UUID strings for Supabase
        borrower_id_str = str(borrower_id)  # Already a string
        owner_id_str = str(owner_id)
        
        # Insert rental into Supabase
        response = supabase.table('rentals').insert({
            'borrower_id': borrower_id_str,
            'listing_id': str(listing_id_int),  # Use the integer ID as string
            'owner_id': owner_id_str,
            'start_date': start_date,
            'end_date': end_date,
            'status': 'pending',
            'message': message
        }).execute()
        
        if not response.data:
            raise ValueError("Failed to create rental request")
        
        rental = response.data[0]
        
        # Convert back to the expected format
        return {
            "rental_id": rental["id"],
            "borrower_id": rental["borrower_id"],  # Keep as UUID string
            "listing_id": rental["listing_id"],
            "owner_id": rental["owner_id"],  # Keep as UUID string
            "start_date": rental["start_date"],
            "end_date": rental["end_date"],
            "status": rental["status"],
            "message": rental["message"],
            "created_at": rental["created_at"],
            "updated_at": rental["updated_at"]
        }
    
    def confirm_rental(self, rental_id: int, status: str, message: str = ""):
        """Confirm or reject a rental request"""
        # Update rental in Supabase
        response = supabase.table('rentals').update({
            'status': status,
            'message': message,
            'updated_at': datetime.now().isoformat()
        }).eq('id', rental_id).execute()
        
        if not response.data:
            raise ValueError("Rental not found")
        
        rental = response.data[0]
        
        # Convert back to the expected format
        return {
            "rental_id": rental["id"],
            "borrower_id": rental["borrower_id"],  # Keep as UUID string
            "listing_id": rental["listing_id"],
            "owner_id": rental["owner_id"],  # Keep as UUID string
            "start_date": rental["start_date"],
            "end_date": rental["end_date"],
            "status": rental["status"],
            "message": rental["message"],
            "created_at": rental["created_at"],
            "updated_at": rental["updated_at"]
        }
    
    def get_user_rentals(self, user_id: int):
        """Get all rentals for a user (as borrower or owner)"""
        user_id_str = str(user_id)
        
        # Query rentals from Supabase
        response = supabase.table('rentals').select('*').or_(
            f'borrower_id.eq.{user_id_str},owner_id.eq.{user_id_str}'
        ).execute()
        
        if not response.data:
            return []
        
        # Convert to expected format
        user_rentals = []
        for rental in response.data:
            user_rentals.append({
                "rental_id": rental["id"],
                "borrower_id": rental["borrower_id"],  # Keep as UUID string
                "listing_id": rental["listing_id"],
                "owner_id": rental["owner_id"],  # Keep as UUID string
                "start_date": rental["start_date"],
                "end_date": rental["end_date"],
                "status": rental["status"],
                "message": rental["message"],
                "created_at": rental["created_at"],
                "updated_at": rental["updated_at"]
            })
        
        return user_rentals
    
    def get_pending_rentals_for_owner(self, owner_id: str):
        """Get pending rental requests for an owner"""
        owner_id_str = str(owner_id)  # Already a string
        
        # Query pending rentals from Supabase
        response = supabase.table('rentals').select('*').eq('owner_id', owner_id_str).eq('status', 'pending').execute()
        
        if not response.data:
            return []
        
        # Convert to expected format and fetch user names
        pending_rentals = []
        for rental in response.data:
            # Get borrower name from user_profiles
            borrower_name = "Unknown User"
            try:
                borrower_response = supabase.table('user_profiles').select('display_name').eq('user_id', rental["borrower_id"]).execute()
                if borrower_response.data:
                    borrower_name = borrower_response.data[0].get('display_name', 'Unknown User')
            except Exception as e:
                print(f"Error fetching borrower name: {e}")
            
            # Get clothing item title
            item_title = "Unknown Item"
            try:
                item_response = supabase.table('clothing').select('title').eq('id', rental["listing_id"]).execute()
                if item_response.data:
                    item_title = item_response.data[0].get('title', 'Unknown Item')
            except Exception as e:
                print(f"Error fetching item title: {e}")
            
            pending_rentals.append({
                "rental_id": rental["id"],
                "borrower_id": rental["borrower_id"],  # Keep as UUID string
                "borrower_name": borrower_name,  # Add borrower name
                "listing_id": rental["listing_id"],
                "item_title": item_title,  # Add item title
                "owner_id": rental["owner_id"],  # Keep as UUID string
                "start_date": rental["start_date"],
                "end_date": rental["end_date"],
                "status": rental["status"],
                "message": rental["message"],
                "created_at": rental["created_at"],
                "updated_at": rental["updated_at"]
            })
        
        return pending_rentals

rental_system = RentalSystem()

# Pydantic models
class UserCreate(BaseModel):
    name: str = Field(..., min_length=1)
    circle: str = Field(..., min_length=1)

class UserResponse(BaseModel):
    user_id: int
    name: str
    circle: str

class ListingCreate(BaseModel):
    owner_id: int
    title: str = Field(..., min_length=1)
    description: str = ""
    privacy: str = Field("public", pattern="^(public|circle)$")

class ListingResponse(BaseModel):
    listing_id: int
    owner_id: int
    title: str
    description: str
    privacy: str
    owner_name: str

class ReviewCreate(BaseModel):
    rater_id: int
    listing_id: int
    material_construction: int = Field(..., ge=1, le=5)
    performance_durability: int = Field(..., ge=1, le=5)
    aesthetics_comfort: int = Field(..., ge=1, le=5)
    comment: str = ""

class ReviewResponse(BaseModel):
    listing_id: int
    rater_id: int
    material_construction: int
    performance_durability: int
    aesthetics_comfort: int
    comment: str
    created_at: str
    updated_at: str

class StyleQuizRequest(BaseModel):
    user_id: int
    preferred_styles: List[str]
    preferred_colors: List[str]
    seasons: List[str]
    preferred_fits: List[str]
    avoid_types: Optional[List[str]] = None

# Rental models
class RentalRequest(BaseModel):
    borrower_id: str  # UUID string
    listing_id: str   # UUID string
    start_date: str  # ISO date string
    end_date: str    # ISO date string
    message: str = ""

class RentalResponse(BaseModel):
    rental_id: int
    borrower_id: str  # UUID string
    listing_id: str   # UUID string
    owner_id: str  # UUID string
    start_date: str
    end_date: str
    status: str  # "pending", "confirmed", "rejected", "completed"
    message: str
    created_at: str
    updated_at: str

class RentalConfirmation(BaseModel):
    rental_id: int
    status: str  # "confirmed" or "rejected"
    message: str = ""

# Rating models
class ClothingRatingCreate(BaseModel):
    user_id: int
    listing_id: str  # Changed to string to accept UUIDs
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field("", max_length=500)
    quality_rating: int = Field(..., ge=1, le=5)
    style_rating: int = Field(..., ge=1, le=5)
    condition_rating: int = Field(..., ge=1, le=5)

class UserRatingCreate(BaseModel):
    rater_id: int
    rated_user_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field("", max_length=500)
    reliability_rating: int = Field(..., ge=1, le=5)
    communication_rating: int = Field(..., ge=1, le=5)
    care_rating: int = Field(..., ge=1, le=5)

class RatingResponse(BaseModel):
    rating_id: int
    user_id: int
    item_id: Optional[int] = None
    rated_user_id: Optional[int] = None
    rating: int
    comment: str
    quality_rating: Optional[int] = None
    style_rating: Optional[int] = None
    condition_rating: Optional[int] = None
    reliability_rating: Optional[int] = None
    communication_rating: Optional[int] = None
    care_rating: Optional[int] = None
    created_at: datetime
    rater_name: str
    item_title: Optional[str] = None
    rated_user_name: Optional[str] = None

# Messaging models
class MessageCreate(BaseModel):
    sender_id: int
    receiver_id: int
    content: str = Field(..., min_length=1, max_length=1000)
    message_type: str = Field("text", pattern="^(text|image|file)$")

class MessageResponse(BaseModel):
    message_id: int
    sender_id: int
    receiver_id: int
    content: str
    message_type: str
    timestamp: datetime
    is_read: bool
    sender_name: str
    receiver_name: str

class ConversationResponse(BaseModel):
    other_user_id: int
    other_user_name: str
    last_message: Optional[MessageResponse]
    unread_count: int

# Health check
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Hand Me Up API is running"}

@app.get("/debug/messages")
def debug_messages():
    """Debug endpoint to see all messages"""
    return {"messages": messaging.messages, "count": len(messaging.messages)}

@app.get("/debug/user_profiles")
def debug_user_profiles():
    """Debug endpoint to check user_profiles table structure"""
    try:
        # Try to get one record to see the structure
        response = supabase.table('user_profiles').select('*').limit(1).execute()
        return {"success": True, "data": response.data, "columns": list(response.data[0].keys()) if response.data else []}
    except Exception as e:
        return {"success": False, "error": str(e)}

# User endpoints
@app.post("/users", response_model=UserResponse)
def create_user(user_data: UserCreate):
    """Create a new user in both engines"""
    try:
        # Add to ratings engine
        ratings_user_id = ratings_engine.add_user(user_data.name, user_data.circle)
        
        # Add to social app
        social_user_id = social_app.add_user(user_data.name, user_data.circle)
        
        # Ensure both engines have the same user ID
        if ratings_user_id != social_user_id:
            raise HTTPException(status_code=500, detail="User ID mismatch between engines")
        
        return UserResponse(
            user_id=ratings_user_id,
            name=user_data.name,
            circle=user_data.circle
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/profiles")
def create_or_update_profile(profile_data: dict):
    """Create or update user profile in Supabase"""
    try:
        user_id = profile_data.get('id')
        display_name = profile_data.get('display_name', profile_data.get('email', 'Unknown User'))
        
        # Upsert the profile using your table structure
        response = supabase.table('user_profiles').upsert({
            'user_id': user_id,
            'display_name': display_name
        }).execute()
        
        return {"success": True, "profile": response.data[0] if response.data else None}
    except Exception as e:
        print(f"Error creating/updating profile in Supabase: {e}")
        return {"success": False, "error": str(e)}

@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int):
    """Get user information"""
    if user_id not in ratings_engine.users:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = ratings_engine.users[user_id]
    return UserResponse(
        user_id=user.user_id,
        name=user.name,
        circle=user.circle
    )

# Listing endpoints
@app.post("/listings", response_model=ListingResponse)
def create_listing(listing_data: ListingCreate):
    """Create a new listing in both engines"""
    try:
        # Add to ratings engine
        ratings_listing_id = ratings_engine.add_listing(
            owner_id=listing_data.owner_id,
            title=listing_data.title,
            description=listing_data.description,
            privacy=listing_data.privacy
        )
        
        # Add to social app
        social_listing_id = social_app.add_listing(
            owner_id=listing_data.owner_id,
            title=listing_data.title,
            description=listing_data.description,
            privacy=listing_data.privacy
        )
        
        # Ensure both engines have the same listing ID
        if ratings_listing_id != social_listing_id:
            raise HTTPException(status_code=500, detail="Listing ID mismatch between engines")
        
        # Get owner name
        owner = ratings_engine.users[listing_data.owner_id]
        
        return ListingResponse(
            listing_id=ratings_listing_id,
            owner_id=listing_data.owner_id,
            title=listing_data.title,
            description=listing_data.description,
            privacy=listing_data.privacy,
            owner_name=owner.name
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/listings", response_model=List[ListingResponse])
def get_listings(user_id: Optional[int] = None):
    """Get all listings, optionally filtered by user"""
    listings = []
    
    for listing in ratings_engine.listings.values():
        # Check if user can view this listing (simplified for now)
        if user_id is not None and listing.privacy == "private":
            # Skip private listings for now
            continue
        
        owner = ratings_engine.users[listing.owner_id]
        listings.append(ListingResponse(
            listing_id=listing.listing_id,
            owner_id=listing.owner_id,
            title=listing.title,
            description=listing.description,
            privacy=listing.privacy,
            owner_name=owner.name
        ))
    
    return listings

@app.get("/listings/{listing_id}", response_model=ListingResponse)
def get_listing(listing_id: int):
    """Get a specific listing"""
    if listing_id not in ratings_engine.listings:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    listing = ratings_engine.listings[listing_id]
    owner = ratings_engine.users[listing.owner_id]
    
    return ListingResponse(
        listing_id=listing.listing_id,
        owner_id=listing.owner_id,
        title=listing.title,
        description=listing.description,
        privacy=listing.privacy,
        owner_name=owner.name
    )

# Review endpoints
@app.post("/reviews")
def create_review(review_data: ReviewCreate):
    """Create or update a review"""
    try:
        ratings_engine.add_or_update_review(
            rater_id=review_data.rater_id,
            listing_id=review_data.listing_id,
            material_construction=review_data.material_construction,
            performance_durability=review_data.performance_durability,
            aesthetics_comfort=review_data.aesthetics_comfort,
            comment=review_data.comment
        )
        return {"success": True, "message": "Review created/updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/listings/{listing_id}/reviews", response_model=List[ReviewResponse])
def get_listing_reviews(listing_id: int):
    """Get all reviews for a listing"""
    try:
        # Get ratings for this listing and convert to reviews format
        ratings = rating_system.get_clothing_ratings(listing_id)
        return [
            ReviewResponse(
                listing_id=rating["listing_id"],
                rater_id=rating["user_id"],
                material_construction=rating["quality_rating"],
                performance_durability=rating["condition_rating"],
                aesthetics_comfort=rating["style_rating"],
                comment=rating["comment"],
                created_at=rating["created_at"].isoformat(),
                updated_at=rating["created_at"].isoformat()
            )
            for rating in ratings
        ]
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/listings/{listing_id}/summary")
def get_listing_summary(listing_id: int):
    """Get rating summary for a listing"""
    try:
        return rating_system.get_clothing_rating_stats(listing_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# Style matching endpoints
@app.post("/users/{user_id}/style-quiz")
def take_style_quiz(user_id: int, quiz_data: StyleQuizRequest):
    """Take a style quiz to improve recommendations"""
    try:
        social_app.take_style_quiz(
            user_id=user_id,
            preferred_styles=quiz_data.preferred_styles,
            preferred_colors=quiz_data.preferred_colors,
            seasons=quiz_data.seasons,
            preferred_fits=quiz_data.preferred_fits,
            avoid_types=quiz_data.avoid_types
        )
        return {"success": True, "message": "Style quiz completed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/users/{user_id}/suggestions/people")
def suggest_people(user_id: int, k: int = 5, min_sim: float = 0.0):
    """Get style-based people suggestions"""
    try:
        suggestions = social_app.suggest_people(user_id, k=k, min_sim=min_sim)
        return [
            {
                "user_id": uid,
                "name": name,
                "similarity_score": score
            }
            for uid, name, score in suggestions
        ]
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/users/{user_id}/suggestions/listings")
def suggest_listings(user_id: int, k: int = 10):
    """Get style-based listing suggestions"""
    try:
        suggestions = social_app.suggest_listings(user_id, k=k)
        return [
            {
                "listing_id": lid,
                "title": title,
                "owner_name": owner,
                "similarity_score": score
            }
            for lid, title, owner, score in suggestions
        ]
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# Follow/connection endpoints
@app.post("/users/{follower_id}/follow/{followee_id}")
def follow_user(follower_id: int, followee_id: int):
    """Follow another user"""
    try:
        social_app.follow(follower_id, followee_id)
        return {"success": True, "message": "User followed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/users/{user_id}/following")
def get_following(user_id: int):
    """Get list of users that the user is following"""
    if not hasattr(social_app, 'following') or user_id not in social_app.following:
        raise HTTPException(status_code=404, detail="User not found")
    
    following_ids = list(social_app.following[user_id])
    following_users = []
    
    for fid in following_ids:
        if fid in social_app.users:
            user = social_app.users[fid]
            following_users.append({
                "user_id": user.user_id,
                "name": user.name,
                "circle": user.circle
            })
    
    return following_users

# Messaging endpoints
@app.post("/messages", response_model=MessageResponse)
def send_message(message_data: MessageCreate):
    """Send a message between users"""
    try:
        # Convert UUID strings to integers for internal use
        # For now, we'll use a simple hash of the UUID to get a consistent integer
        import hashlib
        
        def uuid_to_int(uuid_str):
            return int(hashlib.md5(uuid_str.encode()).hexdigest()[:8], 16) % 1000000
        
        sender_id_int = message_data.sender_id
        receiver_id_int = message_data.receiver_id
        
        # Validate users exist (check if they have been created in our system)
        # For now, we'll create them if they don't exist
        if sender_id_int not in ratings_engine.users:
            # Create sender user
            sender_name = f"User_{sender_id_int}"
            ratings_engine.users[sender_id_int] = type('User', (), {
                'user_id': sender_id_int,
                'name': sender_name,
                'circle': 'community'
            })()
        
        if receiver_id_int not in ratings_engine.users:
            # Create receiver user
            receiver_name = f"User_{receiver_id_int}"
            ratings_engine.users[receiver_id_int] = type('User', (), {
                'user_id': receiver_id_int,
                'name': receiver_name,
                'circle': 'community'
            })()
        
        # Send message
        message = messaging.send_message(
            sender_id=sender_id_int,
            receiver_id=receiver_id_int,
            content=message_data.content,
            message_type=message_data.message_type
        )
        
        # Get user names
        sender = ratings_engine.users[sender_id_int]
        receiver = ratings_engine.users[receiver_id_int]
        
        return MessageResponse(
            message_id=message["message_id"],
            sender_id=message_data.sender_id,  # Return original UUID
            receiver_id=message_data.receiver_id,  # Return original UUID
            content=message["content"],
            message_type=message["message_type"],
            timestamp=message["timestamp"],
            is_read=message["is_read"],
            sender_name=sender.name,
            receiver_name=receiver.name
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/messages/{user_id}/conversations", response_model=List[ConversationResponse])
def get_user_conversations(user_id: int):
    """Get all conversations for a user"""
    user_id_int = user_id
    
    # Create user if they don't exist
    if user_id_int not in ratings_engine.users:
        user_name = f"User_{str(user_id)[:8]}"
        ratings_engine.users[user_id_int] = type('User', (), {
            'user_id': user_id_int,
            'name': user_name,
            'circle': 'community'
        })()
    
    conversations = messaging.get_user_conversations(user_id_int)
    result = []
    
    for conv in conversations:
        other_user = ratings_engine.users[conv["other_user_id"]]
        last_msg = conv["last_message"]
        
        # Get user names for last message
        sender = ratings_engine.users[last_msg["sender_id"]]
        receiver = ratings_engine.users[last_msg["receiver_id"]]
        
        last_message_response = MessageResponse(
            message_id=last_msg["message_id"],
            sender_id=last_msg["sender_id"],
            receiver_id=last_msg["receiver_id"],
            content=last_msg["content"],
            message_type=last_msg["message_type"],
            timestamp=last_msg["timestamp"],
            is_read=last_msg["is_read"],
            sender_name=sender.name,
            receiver_name=receiver.name
        )
        
        result.append(ConversationResponse(
            other_user_id=conv["other_user_id"],
            other_user_name=other_user.name,
            last_message=last_message_response,
            unread_count=conv["unread_count"]
        ))
    
    return result

@app.get("/messages/{user1_id}/{user2_id}", response_model=List[MessageResponse])
def get_conversation(user1_id: int, user2_id: int):
    """Get conversation between two users"""
    user1_id_int = user1_id
    user2_id_int = user2_id
    
    # Create users if they don't exist
    for user_id, user_id_int in [(user1_id, user1_id_int), (user2_id, user2_id_int)]:
        if user_id_int not in ratings_engine.users:
            user_name = f"User_{str(user_id)[:8]}"
            ratings_engine.users[user_id_int] = type('User', (), {
                'user_id': user_id_int,
                'name': user_name,
                'circle': 'community'
            })()
    
    conversation = messaging.get_conversation(user1_id_int, user2_id_int)
    result = []
    
    for msg in conversation:
        sender = ratings_engine.users[msg["sender_id"]]
        receiver = ratings_engine.users[msg["receiver_id"]]
        
        # Convert back to UUIDs for response
        sender_uuid = user1_id if msg["sender_id"] == user1_id_int else user2_id
        receiver_uuid = user1_id if msg["receiver_id"] == user1_id_int else user2_id
        
        result.append(MessageResponse(
            message_id=msg["message_id"],
            sender_id=sender_uuid,
            receiver_id=receiver_uuid,
            content=msg["content"],
            message_type=msg["message_type"],
            timestamp=msg["timestamp"],
            is_read=msg["is_read"],
            sender_name=sender.name,
            receiver_name=receiver.name
        ))
    
    return result

@app.post("/messages/{user1_id}/{user2_id}/read")
def mark_conversation_read(user1_id: int, user2_id: int, reader_id: int):
    """Mark all messages in a conversation as read"""
    user1_id_int = user1_id
    user2_id_int = user2_id
    reader_id_int = reader_id
    
    # Create users if they don't exist
    for user_id, user_id_int in [(user1_id, user1_id_int), (user2_id, user2_id_int), (reader_id, reader_id_int)]:
        if user_id_int not in ratings_engine.users:
            user_name = f"User_{str(user_id)[:8]}"
            ratings_engine.users[user_id_int] = type('User', (), {
                'user_id': user_id_int,
                'name': user_name,
                'circle': 'community'
            })()
    
    messaging.mark_conversation_read(user1_id_int, user2_id_int, reader_id_int)
    return {"success": True, "message": "Conversation marked as read"}


@app.get("/users/{user_id}/search")
def search_users(user_id: str, query: str = ""):
    """Search for users by name from Supabase user_profiles table"""
    try:
        # Search for users in the user_profiles table using your column structure
        response = supabase.table('user_profiles').select('user_id, display_name').ilike('display_name', f'%{query}%').execute()
        
        results = []
        for user in response.data:
            if user['user_id'] != user_id:  # Don't include the current user
                results.append({
                    'user_id': user['user_id'],
                    'name': user['display_name'],
                    'email': user['user_id'],  # Use user_id as email fallback
                    'circle': 'community'  # Default circle
                })
        
        return results
    except Exception as e:
        print(f"Error searching users in Supabase: {e}")
        # Fallback to empty results
        return []

# Rating endpoints
@app.post("/rentals")
def create_rental(rental_data: dict):
    """Create a rental when someone borrows an item"""
    try:
        borrower_id = rental_data.get('borrower_id')
        listing_id = rental_data.get('listing_id')
        
        if borrower_id not in ratings_engine.users:
            raise HTTPException(status_code=404, detail="Borrower not found")
        if listing_id not in ratings_engine.listings:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        rental_id = ratings_engine.create_rental(borrower_id, listing_id)
        return {"rental_id": rental_id, "message": "Rental created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/ratings/can-rate-item/{user_id}/{listing_id}")
def can_rate_item(user_id: int, listing_id: int):
    """Check if user can rate an item"""
    try:
        can_rate = ratings_engine.can_rate_item(user_id, listing_id)
        return {"can_rate": can_rate}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/ratings/can-rate-user/{rater_id}/{rated_user_id}/{listing_id}")
def can_rate_user(rater_id: int, rated_user_id: int, listing_id: int):
    """Check if user can rate another user"""
    try:
        can_rate = ratings_engine.can_rate_user(rater_id, rated_user_id, listing_id)
        return {"can_rate": can_rate}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/ratings/clothing", response_model=RatingResponse)
def rate_clothing(rating_data: ClothingRatingCreate):
    """Rate a clothing item"""
    try:
        print(f"Received clothing rating data: {rating_data}")
        
        # Convert user_id and listing_id to UUID strings for Supabase
        user_id_str = str(rating_data.user_id)
        clothing_id_str = str(rating_data.listing_id)
        
        # Insert rating into Supabase
        response = supabase.table('clothing_ratings').insert({
            'user_id': user_id_str,
            'clothing_id': clothing_id_str,
            'overall_rating': rating_data.rating,
            'quality_rating': rating_data.quality_rating,
            'style_rating': rating_data.style_rating,
            'condition_rating': rating_data.condition_rating,
            'comment': rating_data.comment
        }).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create rating")
        
        rating = response.data[0]
        
        # Get user display name from user_profiles
        user_response = supabase.table('user_profiles').select('display_name').eq('user_id', user_id_str).execute()
        user_name = user_response.data[0]['display_name'] if user_response.data else 'Unknown User'
        
        return RatingResponse(
            rating_id=rating["id"],
            user_id=rating["user_id"],
            item_id=rating["clothing_id"],
            rating=rating["overall_rating"],
            comment=rating["comment"],
            quality_rating=rating["quality_rating"],
            style_rating=rating["style_rating"],
            condition_rating=rating["condition_rating"],
            created_at=rating["created_at"],
            rater_name=user_name,
            item_title=f"Item {rating['clothing_id'][:8]}"  # Fallback title
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/ratings/user", response_model=RatingResponse)
def rate_user(rating_data: UserRatingCreate):
    """Rate a user"""
    try:
        print(f"Received user rating data: {rating_data}")
        
        # Convert user IDs to UUID strings for Supabase
        rater_id_str = str(rating_data.rater_id)
        rated_user_id_str = str(rating_data.rated_user_id)
        
        # Insert user rating into Supabase
        response = supabase.table('user_ratings').insert({
            'rater_id': rater_id_str,
            'rated_user_id': rated_user_id_str,
            'overall_rating': rating_data.rating,
            'reliability_rating': rating_data.reliability_rating,
            'communication_rating': rating_data.communication_rating,
            'care_rating': rating_data.care_rating,
            'comment': rating_data.comment
        }).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create user rating")
        
        rating = response.data[0]
        
        # Get user display names from user_profiles
        rater_response = supabase.table('user_profiles').select('display_name').eq('user_id', rater_id_str).execute()
        rated_user_response = supabase.table('user_profiles').select('display_name').eq('user_id', rated_user_id_str).execute()
        
        rater_name = rater_response.data[0]['display_name'] if rater_response.data else 'Unknown User'
        rated_user_name = rated_user_response.data[0]['display_name'] if rated_user_response.data else 'Unknown User'
        
        return RatingResponse(
            rating_id=rating["id"],
            user_id=rating["rater_id"],
            rated_user_id=rating["rated_user_id"],
            rating=rating["overall_rating"],
            comment=rating["comment"],
            reliability_rating=rating["reliability_rating"],
            communication_rating=rating["communication_rating"],
            care_rating=rating["care_rating"],
            created_at=rating["created_at"],
            rater_name=rater_name,
            rated_user_name=rated_user_name
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/ratings/clothing/{listing_id}")
def get_clothing_ratings(listing_id: int):
    """Get all ratings for a clothing item"""
    ratings = rating_system.get_clothing_ratings(listing_id)
    result = []
    
    for rating in ratings:
        user = ratings_engine.users[rating["user_id"]]
        listing = ratings_engine.listings[rating["listing_id"]]
        result.append(RatingResponse(
            rating_id=rating["rating_id"],
            user_id=rating["user_id"],
            item_id=rating["listing_id"],
            rating=rating["rating"],
            comment=rating["comment"],
            quality_rating=rating["quality_rating"],
            style_rating=rating["style_rating"],
            condition_rating=rating["condition_rating"],
            created_at=rating["created_at"],
            rater_name=user.name,
            item_title=listing.title
        ))
    
    return result

@app.get("/ratings/user/{user_id}")
def get_user_ratings(user_id: int):
    """Get all ratings for a user"""
    if user_id not in ratings_engine.users:
        raise HTTPException(status_code=404, detail="User not found")
    
    ratings = rating_system.get_user_ratings(user_id)
    result = []
    
    for rating in ratings:
        rater = ratings_engine.users[rating["rater_id"]]
        result.append(RatingResponse(
            rating_id=rating["rating_id"],
            user_id=rating["rater_id"],
            rated_user_id=rating["rated_user_id"],
            rating=rating["rating"],
            comment=rating["comment"],
            reliability_rating=rating["reliability_rating"],
            communication_rating=rating["communication_rating"],
            care_rating=rating["care_rating"],
            created_at=rating["created_at"],
            rater_name=rater.name,
            rated_user_name=ratings_engine.users[user_id].name
        ))
    
    return result

@app.get("/ratings/user/{user_id}/stats")
def get_user_rating_stats(user_id: int):
    """Get rating statistics for a user"""
    if user_id not in ratings_engine.users:
        raise HTTPException(status_code=404, detail="User not found")
    
    return rating_system.get_user_rating_stats(user_id)

@app.get("/ratings/clothing/{listing_id}/stats")
def get_clothing_rating_stats(listing_id: int):
    """Get rating statistics for a clothing item"""
    return rating_system.get_clothing_rating_stats(listing_id)

@app.get("/users/{user_id}/rentals")
def get_user_rentals(user_id: int):
    """Get items rented by a user"""
    try:
        if user_id not in ratings_engine.users:
            # Create user if they don't exist
            user = type('User', (), {
                'user_id': user_id,
                'name': f'User {user_id}',
                'circle': 'community'
            })()
            ratings_engine.users[user_id] = user
        
        # Use the new Supabase rental system
        rentals = rental_system.get_user_rentals(user_id)
        
        rented_items = []
        for rental in rentals:
            if rental['borrower_id'] == user_id:
                # Get listing info if available
                if rental['listing_id'] in ratings_engine.listings:
                    listing = ratings_engine.listings[rental['listing_id']]
                    title = listing.title
                    description = listing.description
                else:
                    title = f"Item {rental['listing_id']}"
                    description = "Clothing item"
                
                # Get owner info if available
                if rental['owner_id'] in ratings_engine.users:
                    owner = ratings_engine.users[rental['owner_id']]
                    owner_name = owner.name
                else:
                    owner_name = f"User {rental['owner_id']}"
                
                rented_items.append({
                    'rental_id': rental['rental_id'],
                    'listing_id': rental['listing_id'],
                    'title': title,
                    'description': description,
                    'owner_name': owner_name,
                    'rented_at': rental['created_at'],
                    'item_rated': True,  # Simplified for now
                    'user_rated': True   # Simplified for now
                })
        
        return rented_items
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/users/{user_id}/lent")
def get_user_lent_items(user_id: int):
    """Get items lent by a user"""
    try:
        if user_id not in ratings_engine.users:
            # Create user if they don't exist
            user = type('User', (), {
                'user_id': user_id,
                'name': f'User {user_id}',
                'circle': 'community'
            })()
            ratings_engine.users[user_id] = user
        
        # Use the new Supabase rental system
        rentals = rental_system.get_user_rentals(user_id)
        
        lent_items = []
        for rental in rentals:
            if rental['owner_id'] == user_id:
                # Get listing info if available
                if rental['listing_id'] in ratings_engine.listings:
                    listing = ratings_engine.listings[rental['listing_id']]
                    title = listing.title
                    description = listing.description
                else:
                    title = f"Item {rental['listing_id']}"
                    description = "Clothing item"
                
                # Get borrower info if available
                if rental['borrower_id'] in ratings_engine.users:
                    borrower = ratings_engine.users[rental['borrower_id']]
                    borrower_name = borrower.name
                else:
                    borrower_name = f"User {rental['borrower_id']}"
                
                lent_items.append({
                    'rental_id': rental['rental_id'],
                    'listing_id': rental['listing_id'],
                    'title': title,
                    'description': description,
                    'borrower_name': borrower_name,
                    'lent_at': rental['created_at'],
                    'item_rated': True,  # Simplified for now
                    'user_rated': True   # Simplified for now
                })
        
        return lent_items
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# New rental endpoints
@app.post("/rentals/request", response_model=RentalResponse)
def create_rental_request(rental_data: RentalRequest):
    """Create a new rental request"""
    try:
        rental = rental_system.create_rental_request(
            borrower_id=rental_data.borrower_id,
            listing_id=rental_data.listing_id,
            start_date=rental_data.start_date,
            end_date=rental_data.end_date,
            message=rental_data.message
        )
        
        return RentalResponse(
            rental_id=rental["rental_id"],
            borrower_id=rental["borrower_id"],
            listing_id=rental["listing_id"],
            owner_id=rental["owner_id"],
            start_date=rental["start_date"],
            end_date=rental["end_date"],
            status=rental["status"],
            message=rental["message"],
            created_at=rental["created_at"],
            updated_at=rental["updated_at"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/rentals/{rental_id}/confirm", response_model=RentalResponse)
def confirm_rental(rental_id: int, confirmation: RentalConfirmation):
    """Confirm or reject a rental request"""
    try:
        rental = rental_system.confirm_rental(
            rental_id=rental_id,
            status=confirmation.status,
            message=confirmation.message
        )
        
        return RentalResponse(
            rental_id=rental["rental_id"],
            borrower_id=rental["borrower_id"],
            listing_id=rental["listing_id"],
            owner_id=rental["owner_id"],
            start_date=rental["start_date"],
            end_date=rental["end_date"],
            status=rental["status"],
            message=rental["message"],
            created_at=rental["created_at"],
            updated_at=rental["updated_at"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/rentals/user/{user_id}")
def get_user_rentals_new(user_id: int):
    """Get all rentals for a user"""
    try:
        rentals = rental_system.get_user_rentals(user_id)
        return rentals
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/rentals/owner/{owner_id}/pending")
def get_pending_rentals(owner_id: str):
    """Get pending rental requests for an owner"""
    try:
        rentals = rental_system.get_pending_rentals_for_owner(owner_id)
        return rentals
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
