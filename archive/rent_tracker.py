from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Dict, Optional
from datetime import datetime

# --- Domain models ---

class RentalStatus(Enum):
    PENDING = auto()
    ACCEPTED = auto()
    RENTED = auto()
    RETURNED = auto()
    CANCELLED = auto()

@dataclass
class Item:
    id: int
    owner_id: int
    title: str
    times_rented: int = 0                 # <-- the tracker you asked for
    avg_item_rating: float = 0.0
    rating_count: int = 0

    def add_rating(self, stars: int) -> None:
        # clamp stars to [1,5]
        s = max(1, min(5, stars))
        self.avg_item_rating = ((self.avg_item_rating * self.rating_count) + s) / (self.rating_count + 1)
        self.rating_count += 1

@dataclass
class Rental:
    id: int
    item_id: int
    renter_id: int
    start_date: datetime
    end_date: datetime
    status: RentalStatus = RentalStatus.PENDING

# --- In-memory “repository” ---

class Repo:
    def __init__(self):
        self.items: Dict[int, Item] = {}
        self.rentals: Dict[int, Rental] = {}
        self._next_item_id = 1
        self._next_rental_id = 1

    def create_item(self, owner_id: int, title: str) -> Item:
        item = Item(id=self._next_item_id, owner_id=owner_id, title=title)
        self.items[item.id] = item
        self._next_item_id += 1
        return item

    def get_item(self, item_id: int) -> Optional[Item]:
        return self.items.get(item_id)

    def create_rental(self, item_id: int, renter_id: int, start: datetime, end: datetime) -> Rental:
        rental = Rental(id=self._next_rental_id, item_id=item_id, renter_id=renter_id,
                        start_date=start, end_date=end, status=RentalStatus.PENDING)
        self.rentals[rental.id] = rental
        self._next_rental_id += 1
        return rental

    def get_rental(self, rental_id: int) -> Optional[Rental]:
        return self.rentals.get(rental_id)

# --- Rental service with the tracker logic ---

class RentalService:
    """
    Handles rental state transitions. The 'times_rented' tracker increments
    exactly once when a rental completes (status moves to RETURNED).
    """
    def __init__(self, repo: Repo):
        self.repo = repo

    def accept(self, rental_id: int) -> None:
        r = self._require_rental(rental_id)
        if r.status != RentalStatus.PENDING:
            raise ValueError("Rental must be PENDING to accept.")
        r.status = RentalStatus.ACCEPTED

    def handover(self, rental_id: int) -> None:
        r = self._require_rental(rental_id)
        if r.status not in (RentalStatus.ACCEPTED,):
            raise ValueError("Rental must be ACCEPTED to hand over.")
        r.status = RentalStatus.RENTED

    def mark_returned(self, rental_id: int) -> None:
        r = self._require_rental(rental_id)
        if r.status != RentalStatus.RENTED:
            raise ValueError("Rental must be RENTED to return.")
        r.status = RentalStatus.RETURNED

        # --- TRACKER: increment item's times_rented here ---
        item = self.repo.get_item(r.item_id)
        if not item:
            raise ValueError("Item not found for rental.")
        item.times_rented += 1

    def cancel(self, rental_id: int) -> None:
        r = self._require_rental(rental_id)
        if r.status in (RentalStatus.RETURNED,):
            raise ValueError("Cannot cancel a completed rental.")
        r.status = RentalStatus.CANCELLED

    def _require_rental(self, rental_id: int) -> Rental:
        r = self.repo.get_rental(rental_id)
        if not r:
            raise ValueError("Rental not found.")
        return r

# --- Example usage / demo ---

if __name__ == "__main__":
    repo = Repo()
    service = RentalService(repo)

    # Create an item
    jacket = repo.create_item(owner_id=101, title="Vintage Denim Jacket")
    print(f"Item created: {jacket.title} (id={jacket.id}), times_rented={jacket.times_rented}")

    # Create a rental and complete it
    rent1 = repo.create_rental(item_id=jacket.id, renter_id=202,
                               start=datetime(2025, 9, 7, 10, 0),
                               end=datetime(2025, 9, 10, 18, 0))
    service.accept(rent1.id)
    service.handover(rent1.id)
    service.mark_returned(rent1.id)  # <-- increments times_rented

    print(f"After rental 1 return: times_rented={repo.get_item(jacket.id).times_rented}")

    # Another rental cycle
    rent2 = repo.create_rental(item_id=jacket.id, renter_id=203,
                               start=datetime(2025, 9, 12, 9, 0),
                               end=datetime(2025, 9, 14, 20, 0))
    service.accept(rent2.id)
    service.handover(rent2.id)
    service.mark_returned(rent2.id)  # <-- increments times_rented again

    print(f"After rental 2 return: times_rented={repo.get_item(jacket.id).times_rented}")

    # Optional: capture an item rating after a completed rental
    item = repo.get_item(jacket.id)
    item.add_rating(5)
    item.add_rating(4)
    print(f"Item rating: {item.avg_item_rating:.2f} from {item.rating_count} ratings")
