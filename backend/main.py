"""
Main FastAPI application combining all backend functionality
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import uvicorn

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from customer_reviews import RatingsEngine
from social_style import SocialApp

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

# Health check
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Hand Me Up API is running"}

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
        # Check if user can view this listing
        if user_id is not None:
            social_listing = social_app.listings.get(listing.listing_id)
            if social_listing and not social_app.can_view_listing(user_id, social_listing):
                continue
        
        owner = ratings_engine.users[listing.owner_id]
        listings.append(ListingResponse(
            listing_id=listing.listing_id,
            owner_id=listing.owner_id,
            title=listing.title,
            description=listing.description,
            privacy=listing.privacy.value,
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
        privacy=listing.privacy.value,
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
        reviews = ratings_engine.get_reviews_for_listing(listing_id)
        return [
            ReviewResponse(
                listing_id=r.listing_id,
                rater_id=r.rater_id,
                material_construction=r.material_construction,
                performance_durability=r.performance_durability,
                aesthetics_comfort=r.aesthetics_comfort,
                comment=r.comment,
                created_at=r.created_at.isoformat(),
                updated_at=r.updated_at.isoformat()
            )
            for r in reviews
        ]
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/listings/{listing_id}/summary")
def get_listing_summary(listing_id: int):
    """Get rating summary for a listing"""
    try:
        return ratings_engine.get_listing_summary(listing_id)
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
    if user_id not in social_app.following:
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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
