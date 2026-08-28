"""
social_style.py
----------------
Pure-Python, in-memory prototype for:
- Onboarding style quiz -> user style vector
- Follow/connect (Instagram-like)
- Listings with privacy (public or circle-only)
- Suggestions: people & listings based on style & privacy

You can import this module and use the SocialApp class.
No database or web framework required.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Tuple, Set, Optional
import numpy as np
import re


# -----------------------------
# Vocab & lightweight embeddings
# -----------------------------
TYPES = ["dress","jacket","coat","shirt","top","jeans","pants","skirt","sneakers","boots","hoodie","suit"]
STYLES = ["formal","casual","vintage","streetwear","sport","festival","y2k","minimal","preppy","boho"]
SEASONS = ["winter","summer","spring","autumn"]
FITS = ["oversized","slim","regular","relaxed"]
COLORS = ["black","white","red","blue","green","yellow","brown","beige","purple","pink","navy","cream","grey"]
MATERIALS = ["cotton","denim","leather","silk","linen","wool","satin","cashmere"]

VOCAB = TYPES + STYLES + SEASONS + FITS + COLORS + MATERIALS
IDX = {w: i for i, w in enumerate(VOCAB)}

# Weight style-ish words higher than colors/materials
WEIGHTS = np.ones(len(VOCAB), dtype=np.float32)
for w in STYLES:    WEIGHTS[IDX[w]] = 2.0
for w in TYPES:     WEIGHTS[IDX[w]] = 1.6
for w in SEASONS:   WEIGHTS[IDX[w]] = 1.3
for w in FITS:      WEIGHTS[IDX[w]] = 1.4
# colors/materials stay at 1.0

def _tokens(text: str) -> List[str]:
    return re.findall(r"[a-z]+", text.lower())

def text_to_vec(text: str) -> np.ndarray:
    v = np.zeros(len(VOCAB), dtype=np.float32)
    for t in _tokens(text):
        if t in IDX:
            v[IDX[t]] += 1.0
    v = v * WEIGHTS
    n = np.linalg.norm(v)
    return v / n if n else v

def avg_and_norm(vecs: List[np.ndarray]) -> np.ndarray:
    if not vecs:
        return np.zeros(len(VOCAB), dtype=np.float32)
    M = np.stack(vecs)
    v = M.mean(axis=0)
    n = np.linalg.norm(v)
    return v / n if n else v

def cosine(a: np.ndarray, b: np.ndarray) -> float:
    d = (np.linalg.norm(a) * np.linalg.norm(b))
    return float(a @ b / d) if d else 0.0


# -----------------------------
# Data model
# -----------------------------
class Privacy(Enum):
    PUBLIC = "public"
    CIRCLE = "circle"      # only visible within same circle/community

@dataclass
class Listing:
    listing_id: int
    owner_id: int
    title: str
    description: str = ""
    privacy: Privacy = Privacy.PUBLIC
    vec: np.ndarray = field(default_factory=lambda: np.zeros(len(VOCAB), dtype=np.float32))

    @classmethod
    def from_text(cls, listing_id: int, owner_id: int, title: str, description: str, privacy: Privacy):
        vec = text_to_vec(f"{title} {description}")
        return cls(listing_id=listing_id, owner_id=owner_id, title=title, description=description, privacy=privacy, vec=vec)

@dataclass
class User:
    user_id: int
    name: str
    circle: str                           # e.g., "USYD", "Workplace A"
    owned_listing_ids: List[int] = field(default_factory=list)
    # quiz answers kept for transparency; computed into quiz_vec
    quiz_answers: Dict[str, object] = field(default_factory=dict)
    quiz_vec: np.ndarray = field(default_factory=lambda: np.zeros(len(VOCAB), dtype=np.float32))
    # history vectors (optional future signals)
    liked_item_vecs: List[np.ndarray] = field(default_factory=list)

    def style_vec(self, listings: Dict[int, Listing], w_quiz=0.7, w_owned=0.5, w_liked=0.3) -> np.ndarray:
        """Combine quiz signal + owned items + liked items (weights are tunable)."""
        parts: List[np.ndarray] = []
        if np.linalg.norm(self.quiz_vec) > 0: parts.append(self.quiz_vec * w_quiz)

        owned_vecs = [listings[lid].vec for lid in self.owned_listing_ids if lid in listings]
        if owned_vecs:
            parts.append(avg_and_norm(owned_vecs) * w_owned)

        if self.liked_item_vecs:
            parts.append(avg_and_norm(self.liked_item_vecs) * w_liked)

        if not parts:
            return np.zeros(len(VOCAB), dtype=np.float32)
        v = np.sum(np.stack(parts), axis=0)
        n = np.linalg.norm(v)
        return v / n if n else v


# -----------------------------
# App logic
# -----------------------------
class SocialApp:
    """
    In-memory app:
    - add_user(circle)
    - take_style_quiz(...)
    - follow/unfollow
    - add_listing(..., privacy)
    - suggestions: people & listings (respect privacy)
    """

    def __init__(self):
        self._next_user_id = 1
        self._next_listing_id = 1

        self.users: Dict[int, User] = {}
        self.listings: Dict[int, Listing] = {}
        self.following: Dict[int, Set[int]] = {}  # follower_id -> set(followee_ids)

    # ---------- Users ----------
    def add_user(self, name: str, circle: str) -> int:
        uid = self._next_user_id; self._next_user_id += 1
        self.users[uid] = User(user_id=uid, name=name, circle=circle)
        self.following[uid] = set()
        return uid

    # ---------- Follow / Connect ----------
    def follow(self, follower_id: int, followee_id: int):
        if follower_id not in self.users or followee_id not in self.users:
            raise ValueError("user not found")
        if follower_id == followee_id:
            return
        self.following[follower_id].add(followee_id)

    def unfollow(self, follower_id: int, followee_id: int):
        self.following.get(follower_id, set()).discard(followee_id)

    def is_connected(self, a: int, b: int) -> bool:
        """Mutual follow = connection."""
        return (b in self.following.get(a, set())) and (a in self.following.get(b, set()))

    # ---------- Style Quiz ----------
    def take_style_quiz(
        self,
        user_id: int,
        preferred_styles: List[str],         # e.g., ["streetwear","minimal"]
        preferred_colors: List[str],         # e.g., ["blue","black"]
        seasons: List[str],                  # e.g., ["winter","autumn"]
        preferred_fits: List[str],           # e.g., ["oversized","regular"]
        avoid_types: Optional[List[str]] = None   # types the user rarely wears
    ):
        if user_id not in self.users:
            raise ValueError("user not found")

        # clamp inputs to vocab words
        def filt(xs, allowed): return [x for x in xs if x in allowed]

        preferred_styles = filt([s.lower() for s in preferred_styles], STYLES)
        preferred_colors = filt([c.lower() for c in preferred_colors], COLORS)
        seasons         = filt([s.lower() for s in seasons], SEASONS)
        preferred_fits  = filt([f.lower() for f in preferred_fits], FITS)
        avoid_types     = filt([t.lower() for t in (avoid_types or [])], TYPES)

        # Build a weighted quiz vector
        quiz_terms = []
        # Strong positive signals
        for s in preferred_styles: quiz_terms += [s] * 4
        for c in preferred_colors: quiz_terms += [c] * 2
        for s in seasons:          quiz_terms += [s] * 3
        for f in preferred_fits:   quiz_terms += [f] * 3
        # Negative signals: subtract (softly)
        v = np.zeros(len(VOCAB), dtype=np.float32)
        for t in quiz_terms:
            if t in IDX: v[IDX[t]] += 1.0
        for t in avoid_types:
            if t in IDX: v[IDX[t]] -= 0.8   # gentle push away

        # scale with WEIGHTS and normalize
        v = v * WEIGHTS
        n = np.linalg.norm(v)
        qvec = v / n if n else v

        # record
        u = self.users[user_id]
        u.quiz_answers = dict(
            preferred_styles=preferred_styles,
            preferred_colors=preferred_colors,
            seasons=seasons,
            preferred_fits=preferred_fits,
            avoid_types=avoid_types
        )
        u.quiz_vec = qvec

    # ---------- Listings ----------
    def add_listing(self, owner_id: int, title: str, description: str, privacy: str = "public") -> int:
        if owner_id not in self.users:
            raise ValueError("owner not found")
        try:
            p = Privacy(privacy.lower())
        except Exception:
            raise ValueError("privacy must be 'public' or 'circle'")

        lid = self._next_listing_id; self._next_listing_id += 1
        listing = Listing.from_text(lid, owner_id, title, description, p)
        self.listings[lid] = listing
        self.users[owner_id].owned_listing_ids.append(lid)
        return lid

    def set_listing_privacy(self, listing_id: int, privacy: str):
        if listing_id not in self.listings:
            raise ValueError("listing not found")
        self.listings[listing_id].privacy = Privacy(privacy.lower())

    # ---------- Visibility ----------
    def can_view_listing(self, viewer_id: int, listing: Listing) -> bool:
        if listing.privacy == Privacy.PUBLIC:
            return True
        # circle-only: same circle OR owner themselves
        owner = self.users[listing.owner_id]
        viewer = self.users[viewer_id]
        return (viewer.circle == owner.circle) or (viewer_id == listing.owner_id)

    def visible_listings_for(self, viewer_id: int) -> List[Listing]:
        return [lst for lst in self.listings.values() if self.can_view_listing(viewer_id, lst)]

    # ---------- Suggestions ----------
    def suggest_people(self, user_id: int, k: int = 5, min_sim: float = 0.1) -> List[Tuple[int, str, float]]:
        """Style-based people suggestions (exclude already followed)."""
        if user_id not in self.users:
            raise ValueError("user not found")

        base = self.users[user_id].style_vec(self.listings)
        results = []
        already = self.following.get(user_id, set())
        for other_id, other in self.users.items():
            if other_id == user_id or other_id in already:
                continue
            sim = cosine(base, other.style_vec(self.listings))
            if sim >= min_sim:
                results.append((other_id, other.name, round(sim, 4)))
        results.sort(key=lambda x: x[2], reverse=True)
        return results[:k]

    def suggest_listings(self, user_id: int, k: int = 10) -> List[Tuple[int, str, str, float]]:
        """
        Suggest listings visible to the user, ranked by style similarity.
        Returns: (listing_id, title, owner_name, score)
        """
        if user_id not in self.users:
            raise ValueError("user not found")
        base = self.users[user_id].style_vec(self.listings)
        vis = self.visible_listings_for(user_id)
        scored = []
        for lst in vis:
            owner_name = self.users[lst.owner_id].name
            score = cosine(base, lst.vec)
            scored.append((lst.listing_id, lst.title, owner_name, round(score, 4)))
        scored.sort(key=lambda x: x[3], reverse=True)
        return scored[:k]


# -----------------------------
# Demo
# -----------------------------
if __name__ == "__main__":
    app = SocialApp()

    # Users in circles (communities)
    u_meghna = app.add_user("Meghna", circle="USYD")
    u_sarah   = app.add_user("Sarah",   circle="USYD")
    u_jeya    = app.add_user("Jeyasri", circle="UNSW")
    u_omar    = app.add_user("Omar",    circle="USYD")

    # Onboarding quiz answers (free to tweak)
    app.take_style_quiz(
        u_meghna,
        preferred_styles=["streetwear","minimal"],
        preferred_colors=["blue","black"],
        seasons=["winter","autumn"],
        preferred_fits=["oversized","regular"],
        avoid_types=["suit"]
    )
    app.take_style_quiz(
        u_sarah,
        preferred_styles=["streetwear","y2k"],
        preferred_colors=["black"],
        seasons=["winter"],
        preferred_fits=["oversized"]
    )
    app.take_style_quiz(
        u_jeya,
        preferred_styles=["formal","preppy"],
        preferred_colors=["red","cream"],
        seasons=["summer"],
        preferred_fits=["slim"]
    )
    app.take_style_quiz(
        u_omar,
        preferred_styles=["sport","casual"],
        preferred_colors=["grey","navy"],
        seasons=["autumn"],
        preferred_fits=["regular"]
    )

    # Listings (with privacy)
    app.add_listing(u_meghna, "Blue denim jacket", "casual streetwear cotton", privacy="public")
    app.add_listing(u_sarah,  "Black leather boots", "winter streetwear", privacy="circle")  # USYD-only
    app.add_listing(u_jeya,   "Red silk dress", "formal evening satin", privacy="public")
    app.add_listing(u_omar,   "Grey hoodie", "sport casual hoodie", privacy="circle")        # USYD-only

    # Follow (like Instagram)
    app.follow(u_meghna, u_sarah)  # Meghna follows Sarah
    app.follow(u_sarah, u_meghna)  # mutual => connected
    app.follow(u_meghna, u_omar)   # one-way

    print("\n--- People suggestions for Meghna ---")
    print(app.suggest_people(u_meghna, k=3))

    print("\n--- Listings visible to Meghna (respecting privacy) ---")
    for row in app.visible_listings_for(u_meghna):
        print(row.listing_id, row.title, row.privacy.value)

    print("\n--- Listing suggestions for Meghna ---")
    print(app.suggest_listings(u_meghna, k=5))
