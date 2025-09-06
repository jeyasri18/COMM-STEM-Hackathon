# social_style.py
from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Tuple, Set, Optional
import numpy as np
import re

TYPES = ["dress","jacket","coat","shirt","top","jeans","pants","skirt","sneakers","boots","hoodie","suit"]
STYLES = ["formal","casual","vintage","streetwear","sport","festival","y2k","minimal","preppy","boho"]
SEASONS = ["winter","summer","spring","autumn"]
FITS = ["oversized","slim","regular","relaxed"]
COLORS = ["black","white","red","blue","green","yellow","brown","beige","purple","pink","navy","cream","grey"]
MATERIALS = ["cotton","denim","leather","silk","linen","wool","satin","cashmere"]

VOCAB = TYPES + STYLES + SEASONS + FITS + COLORS + MATERIALS
IDX = {w: i for i, w in enumerate(VOCAB)}

WEIGHTS = np.ones(len(VOCAB), dtype=np.float32)
for w in STYLES:    WEIGHTS[IDX[w]] = 2.0
for w in TYPES:     WEIGHTS[IDX[w]] = 1.6
for w in SEASONS:   WEIGHTS[IDX[w]] = 1.3
for w in FITS:      WEIGHTS[IDX[w]] = 1.4

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

class Privacy(Enum):
    PUBLIC = "public"
    CIRCLE = "circle"

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
    circle: str
    owned_listing_ids: List[int] = field(default_factory=list)
    quiz_answers: Dict[str, object] = field(default_factory=dict)
    quiz_vec: np.ndarray = field(default_factory=lambda: np.zeros(len(VOCAB), dtype=np.float32))
    liked_item_vecs: List[np.ndarray] = field(default_factory=list)

    def style_vec(self, listings: Dict[int, Listing], w_quiz=0.7, w_owned=0.5, w_liked=0.3) -> np.ndarray:
        parts: List[np.ndarray] = []
        if np.linalg.norm(self.quiz_vec) > 0: parts.append(self.quiz_vec * w_quiz)
        owned_vecs = [listings[lid].vec for lid in self.owned_listing_ids if lid in listings]
        if owned_vecs: parts.append(avg_and_norm(owned_vecs) * w_owned)
        if self.liked_item_vecs: parts.append(avg_and_norm(self.liked_item_vecs) * w_liked)
        if not parts: return np.zeros(len(VOCAB), dtype=np.float32)
        v = np.sum(np.stack(parts), axis=0)
        n = np.linalg.norm(v)
        return v / n if n else v

class SocialApp:
    def __init__(self):
        self._next_user_id = 1
        self._next_listing_id = 1
        self.users: Dict[int, User] = {}
        self.listings: Dict[int, Listing] = {}
        self.following: Dict[int, Set[int]] = {}

    # users
    def add_user(self, name: str, circle: str) -> int:
        uid = self._next_user_id; self._next_user_id += 1
        self.users[uid] = User(user_id=uid, name=name, circle=circle)
        self.following[uid] = set()
        return uid

    # follow/connect
    def follow(self, follower_id: int, followee_id: int):
        if follower_id not in self.users or followee_id not in self.users:
            raise ValueError("user not found")
        if follower_id == followee_id: return
        self.following[follower_id].add(followee_id)

    def is_connected(self, a: int, b: int) -> bool:
        return (b in self.following.get(a, set())) and (a in self.following.get(b, set()))

    # quiz
    def take_style_quiz(
        self,
        user_id: int,
        preferred_styles: List[str],
        preferred_colors: List[str],
        seasons: List[str],
        preferred_fits: List[str],
        avoid_types: Optional[List[str]] = None
    ):
        if user_id not in self.users: raise ValueError("user not found")

        def filt(xs, allowed): return [x for x in xs if x in allowed]
        preferred_styles = filt([s.lower() for s in preferred_styles], STYLES)
        preferred_colors = filt([c.lower() for c in preferred_colors], COLORS)
        seasons         = filt([s.lower() for s in seasons], SEASONS)
        preferred_fits  = filt([f.lower() for f in preferred_fits], FITS)
        avoid_types     = filt([t.lower() for t in (avoid_types or [])], TYPES)

        v = np.zeros(len(VOCAB), dtype=np.float32)
        for s in preferred_styles: v[IDX[s]] += 4
        for c in preferred_colors: v[IDX[c]] += 2
        for s in seasons:          v[IDX[s]] += 3
        for f in preferred_fits:   v[IDX[f]] += 3
        for t in avoid_types:      v[IDX[t]] -= 0.8 if t in IDX else 0

        v = v * WEIGHTS
        n = np.linalg.norm(v)
        qvec = v / n if n else v

        u = self.users[user_id]
        u.quiz_answers = dict(
            preferred_styles=preferred_styles,
            preferred_colors=preferred_colors,
            seasons=seasons,
            preferred_fits=preferred_fits,
            avoid_types=avoid_types
        )
        u.quiz_vec = qvec

    # listings
    def add_listing(self, owner_id: int, title: str, description: str, privacy: str = "public") -> int:
        if owner_id not in self.users: raise ValueError("owner not found")
        p = Privacy(privacy.lower())
        lid = self._next_listing_id; self._next_listing_id += 1
        listing = Listing.from_text(lid, owner_id, title, description, p)
        self.listings[lid] = listing
        self.users[owner_id].owned_listing_ids.append(lid)
        return lid

    def can_view_listing(self, viewer_id: int, listing: Listing) -> bool:
        if listing.privacy == Privacy.PUBLIC: return True
        owner = self.users[listing.owner_id]; viewer = self.users[viewer_id]
        return (viewer.circle == owner.circle) or (viewer_id == listing.owner_id)

    def visible_listings_for(self, viewer_id: int) -> List[Listing]:
        return [lst for lst in self.listings.values() if self.can_view_listing(viewer_id, lst)]

    # suggestions
    def suggest_people(self, user_id: int, k: int = 5, min_sim: float = 0.0, exclude_followed: bool = True) -> List[Tuple[int, str, float]]:
        if user_id not in self.users: raise ValueError("user not found")
        base = self.users[user_id].style_vec(self.listings)
        results = []
        already = self.following.get(user_id, set())
        for other_id, other in self.users.items():
            if other_id == user_id: continue
            if exclude_followed and (other_id in already): continue
            sim = cosine(base, other.style_vec(self.listings))
            if sim >= min_sim:
                results.append((other_id, other.name, round(sim, 4)))
        results.sort(key=lambda x: x[2], reverse=True)
        return results[:k]

    def suggest_listings(self, user_id: int, k: int = 10) -> List[Tuple[int, str, str, float]]:
        if user_id not in self.users: raise ValueError("user not found")
        base = self.users[user_id].style_vec(self.listings)
        vis = self.visible_listings_for(user_id)
        scored = []
        for lst in vis:
            owner_name = self.users[lst.owner_id].name
            score = cosine(base, lst.vec)
            scored.append((lst.listing_id, lst.title, owner_name, round(score, 4)))
        scored.sort(key=lambda x: x[3], reverse=True)
        return scored[:k]
