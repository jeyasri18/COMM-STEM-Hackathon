"""
customer_reviews.py
-------------------
Standalone, in-memory ratings engine with 3 sub-categories (all 1..5):
  - Material & Construction
  - Performance & Durability
  - Aesthetics & Comfort

Features
- Add users and listings (minimal scaffolding so reviews make sense)
- Add or update a review (1 per (user, listing))
- Prevent owners from reviewing their own listing
- Get per-listing summary with averages and overall score (ALL on a 1..5 scale)
- Optional: fetch all reviews; delete a review

No external dependencies. Pure Python.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional
from enum import Enum
from datetime import datetime, UTC   # timezone-aware UTC

# ---------------------------
# Minimal user/listing model
# ---------------------------
class Privacy(Enum):
    PUBLIC = "public"
    CIRCLE = "circle"

@dataclass
class User:
    user_id: int
    name: str
    circle: str  # e.g., "USYD"

@dataclass
class Listing:
    listing_id: int
    owner_id: int
    title: str
    description: str = ""
    privacy: Privacy = Privacy.PUBLIC

# ---------------------------
# Reviews (all 1..5)
# ---------------------------
@dataclass
class Review:
    listing_id: int
    rater_id: int
    material_construction: int      # 1..5
    performance_durability: int     # 1..5
    aesthetics_comfort: int         # 1..5
    comment: str = ""
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))

def _ensure_1_to_5(*vals: int):
    for v in vals:
        if not isinstance(v, int) or not (1 <= v <= 5):
            raise ValueError("All ratings must be integers in the range 1..5")

# ---------------------------
# Ratings Engine (in-memory)
# ---------------------------
class RatingsEngine:
    """
    Manages users, listings, and customer reviews.
    Focused purely on ratings; no matching/suggestions here.
    """
    def __init__(self):
        self._next_user_id = 1
        self._next_listing_id = 1
        self.users: Dict[int, User] = {}
        self.listings: Dict[int, Listing] = {}
        # key = (listing_id, rater_id) -> Review
        self._reviews: Dict[Tuple[int, int], Review] = {}

    # ----- Users / Listings (minimal scaffolding) -----
    def add_user(self, name: str, circle: str) -> int:
        uid = self._next_user_id; self._next_user_id += 1
        self.users[uid] = User(user_id=uid, name=name, circle=circle)
        return uid

    def add_listing(self, owner_id: int, title: str, description: str = "", privacy: str = "public") -> int:
        if owner_id not in self.users:
            raise ValueError("owner not found")
        try:
            p = Privacy(privacy.lower())
        except Exception:
            raise ValueError("privacy must be 'public' or 'circle'")
        lid = self._next_listing_id; self._next_listing_id += 1
        self.listings[lid] = Listing(listing_id=lid, owner_id=owner_id, title=title, description=description, privacy=p)
        return lid

    # ----- Reviews API (ALL 1..5) -----
    def add_or_update_review(
        self,
        rater_id: int,
        listing_id: int,
        material_construction: int,
        performance_durability: int,
        aesthetics_comfort: int,
        comment: str = ""
    ) -> None:
        if rater_id not in self.users:
            raise ValueError("rater not found")
        if listing_id not in self.listings:
            raise ValueError("listing not found")
        if self.listings[listing_id].owner_id == rater_id:
            raise ValueError("owners cannot review their own listing")

        _ensure_1_to_5(material_construction, performance_durability, aesthetics_comfort)

        key = (listing_id, rater_id)
        now = datetime.now(UTC)
        if key in self._reviews:
            r = self._reviews[key]
            r.material_construction = material_construction
            r.performance_durability = performance_durability
            r.aesthetics_comfort = aesthetics_comfort
            r.comment = comment
            r.updated_at = now
        else:
            self._reviews[key] = Review(
                listing_id=listing_id,
                rater_id=rater_id,
                material_construction=material_construction,
                performance_durability=performance_durability,
                aesthetics_comfort=aesthetics_comfort,
                comment=comment,
                created_at=now,
                updated_at=now
            )

    def delete_review(self, rater_id: int, listing_id: int) -> bool:
        """Returns True if a review existed and was deleted."""
        return self._reviews.pop((listing_id, rater_id), None) is not None

    def get_reviews_for_listing(self, listing_id: int) -> List[Review]:
        if listing_id not in self.listings:
            raise ValueError("listing not found")
        return [rv for (lid, _), rv in self._reviews.items() if lid == listing_id]

    def get_listing_summary(self, listing_id: int) -> dict:
        """
        Returns numeric summary only (all 1..5):
        {
          "count": int,
          "avg_material": float|None,
          "avg_performance": float|None,
          "avg_aesthetics": float|None,
          "overall_score": float|None
        }
        """
        reviews = self.get_reviews_for_listing(listing_id)
        if not reviews:
            return {
                "count": 0,
                "avg_material": None,
                "avg_performance": None,
                "avg_aesthetics": None,
                "overall_score": None
            }

        mc_vals = [r.material_construction for r in reviews]
        pd_vals = [r.performance_durability for r in reviews]
        ac_vals = [r.aesthetics_comfort for r in reviews]

        avg_material = sum(mc_vals) / len(mc_vals)
        avg_performance = sum(pd_vals) / len(pd_vals)
        avg_aesthetics = sum(ac_vals) / len(ac_vals)
        overall = (avg_material + avg_performance + avg_aesthetics) / 3.0

        return {
            "count": len(reviews),
            "avg_material": round(avg_material, 2),
            "avg_performance": round(avg_performance, 2),
            "avg_aesthetics": round(avg_aesthetics, 2),
            "overall_score": round(overall, 2)
        }

# ---------------------------
# Quick demo (run this file)
# ---------------------------
if __name__ == "__main__":
    eng = RatingsEngine()

    # Create users
    owner = eng.add_user("Owner", circle="USYD")
    alice = eng.add_user("Alice", circle="USYD")
    bob   = eng.add_user("Bob",   circle="UNSW")

    # Create a listing by owner
    lid = eng.add_listing(owner, "Blue denim jacket", "casual streetwear cotton", privacy="public")

    # Add reviews (all 1..5)
    eng.add_or_update_review(alice, lid, material_construction=5, performance_durability=4, aesthetics_comfort=5, comment="Loved it!")
    eng.add_or_update_review(bob,   lid, material_construction=4, performance_durability=4, aesthetics_comfort=3, comment="Good overall.")

    print("\nInitial summary (all numbers are 1..5):")
    print(eng.get_listing_summary(lid))

    # Alice updates her review
    eng.add_or_update_review(alice, lid, material_construction=5, performance_durability=5, aesthetics_comfort=5, comment="Even better after second wear.")
    print("\nAfter Alice update:")
    print(eng.get_listing_summary(lid))
