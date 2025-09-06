from dataclasses import Field
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict

from customer_reviews import RatingsEngine
from social_style import SocialApp   # your suggestions engine

# ---- Create app + engines FIRST ----
app = FastAPI(title="Ratings API", version="1.0.0")
eng = RatingsEngine()        # for reviews
app_suggest = SocialApp()    # for suggestions

# ---- Now define endpoints ----
@app.get("/suggestions/people")
def suggest_people(user_id: int, k: int = 5) -> List[Dict]:
    res = app_suggest.suggest_people(user_id, k=k, min_sim=0.0, exclude_followed=False)
    return [{"user_id": uid, "name": name, "score": score} for uid, name, score in res]

@app.get("/suggestions/listings")
def suggest_listings(user_id: int, k: int = 10) -> List[Dict]:
    res = app_suggest.suggest_listings(user_id, k=k)
    return [{"listing_id": lid, "title": title, "owner": owner, "score": score}
            for lid, title, owner, score in res]

# ---- Your other endpoints for users, listings, reviews go here ----


# ----------- Schemas -----------
class UserIn(BaseModel):
    name: str = Field(..., min_length=1)
    circle: str = Field(..., min_length=1)

class ListingIn(BaseModel):
    owner_id: int
    title: str = Field(..., min_length=1)
    description: str = ""
    privacy: str = Field("public", pattern="^(public|circle)$")

class ReviewIn(BaseModel):
    rater_id: int
    listing_id: int
    material_construction: int = Field(..., ge=1, le=5)
    performance_durability: int = Field(..., ge=1, le=5)
    aesthetics_comfort: int = Field(..., ge=1, le=5)
    comment: str = ""

# ----------- Health / root -----------
@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}

@app.get("/")
def root() -> Dict[str, str]:
    return {"message": "Ratings API. See /docs"}

# ----------- Users -----------
@app.post("/users")
def add_user(payload: UserIn) -> Dict[str, int]:
    uid = eng.add_user(payload.name, payload.circle)
    return {"user_id": uid}

# ----------- Listings -----------
@app.post("/listings")
def add_listing(payload: ListingIn) -> Dict[str, int]:
    try:
        lid = eng.add_listing(
            owner_id=payload.owner_id,
            title=payload.title,
            description=payload.description,
            privacy=payload.privacy,
        )
        return {"listing_id": lid}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ----------- Reviews (all 1..5) -----------
@app.post("/reviews")
def create_or_update_review(payload: ReviewIn) -> Dict[str, bool]:
    try:
        eng.add_or_update_review(
            rater_id=payload.rater_id,
            listing_id=payload.listing_id,
            material_construction=payload.material_construction,
            performance_durability=payload.performance_durability,
            aesthetics_comfort=payload.aesthetics_comfort,
            comment=payload.comment,
        )
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/reviews")
def delete_review(listing_id: int, rater_id: int) -> Dict[str, bool]:
    deleted = eng.delete_review(rater_id=rater_id, listing_id=listing_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"ok": True}

# ----------- Summaries / reads -----------
@app.get("/listings/{listing_id}/summary")
def listing_summary(listing_id: int) -> Dict[str, Any]:
    try:
        return eng.get_listing_summary(listing_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/listings/{listing_id}/reviews")
def listing_reviews(listing_id: int) -> List[Dict[str, Any]]:
    try:
        reviews = eng.get_reviews_for_listing(listing_id)
        # make dataclasses JSONable
        return [
            {
                "listing_id": r.listing_id,
                "rater_id": r.rater_id,
                "material_construction": r.material_construction,
                "performance_durability": r.performance_durability,
                "aesthetics_comfort": r.aesthetics_comfort,
                "comment": r.comment,
                "created_at": r.created_at.isoformat(),
                "updated_at": r.updated_at.isoformat(),
            }
            for r in reviews
        ]
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
