# onboard_demo.py
from social_style import SocialApp

# 6 simple personas you can expand later
PERSONAS = {
    "basic": {
        "styles": ["minimal","casual"],
        "colors": ["black","white","blue","grey","beige"],
        "fits":   ["regular","relaxed"], "seasons": []
    },
    "uni going": {
        "styles": ["casual","streetwear"],
        "colors": ["blue","black","white","navy"],
        "fits":   ["oversized","regular"], "seasons": ["autumn","spring"]
    },
    "classy": {
        "styles": ["formal","minimal","preppy"],
        "colors": ["black","cream","navy","white","red"],
        "fits":   ["slim","regular"], "seasons": []
    },
    "sporty": {
        "styles": ["sport","casual"],
        "colors": ["black","grey","blue","white"],
        "fits":   ["relaxed","regular"], "seasons": ["summer","autumn"]
    },
    "traditional": {
        "styles": ["formal","boho"],
        "colors": ["red","cream","green","yellow"],
        "fits":   ["regular","slim"], "seasons": []
    },
    "street": {
        "styles": ["streetwear","y2k"],
        "colors": ["black","white","blue","red"],
        "fits":   ["oversized","relaxed"], "seasons": ["winter","autumn"]
    }
}

def ask_multi(prompt: str, options: list[str]) -> list[str]:
    print(f"\n{prompt}")
    for i, o in enumerate(options, 1):
        print(f"  {i}. {o}")
    picks = input("Choose numbers (comma-separated), or press Enter to skip: ").strip()
    if not picks:
        return []
    out = []
    for x in picks.split(","):
        x = x.strip()
        if x.isdigit() and 1 <= int(x) <= len(options):
            out.append(options[int(x)-1])
    return out

def dedup(xs):
    seen=set(); out=[]
    for x in xs:
        if x not in seen:
            seen.add(x); out.append(x)
    return out

def build_quiz_from_personas(selected: list[str]):
    styles, colors, fits, seasons = [], [], [], []
    for p in selected:
        cfg = PERSONAS.get(p)
        if not cfg: 
            continue
        styles  += cfg["styles"]
        colors  += cfg["colors"]
        fits    += cfg["fits"]
        seasons += cfg["seasons"]
    return dedup(styles), dedup(colors), dedup(fits), dedup(seasons)

def main():
    app = SocialApp()

    # Create a few users in circles
    me    = app.add_user("You",    circle="USYD")
    sarah = app.add_user("Sarah",  circle="USYD")
    jeya  = app.add_user("Jeyasri",circle="UNSW")
    omar  = app.add_user("Omar",   circle="USYD")

    # Seed other users' quiz so matching works immediately
    app.take_style_quiz(sarah, ["streetwear"], ["black"], ["winter"], ["oversized"])
    app.take_style_quiz(jeya,  ["formal","preppy"], ["red","cream"], ["summer"], ["slim"])
    app.take_style_quiz(omar,  ["sport","casual"], ["grey","navy"], ["autumn"], ["regular"])

    # Seed a few listings (with privacy variations)
    app.add_listing(sarah, "Black leather boots", "winter streetwear", privacy="circle")  # USYD only
    app.add_listing(jeya,  "Red silk dress", "formal evening satin", privacy="public")
    app.add_listing(omar,  "Grey hoodie", "sport casual hoodie", privacy="circle")        # USYD only

    # ---- Onboarding: pick 2–3 personas ----
    persona_names = list(PERSONAS.keys())
    chosen = ask_multi("Pick 2–3 style personas you vibe with:", persona_names)
    if not chosen:
        print("No personas selected; continuing with defaults (you can rerun).")
        chosen = ["basic"]

    avoid_types = ask_multi("Anything you rarely wear (avoid)?",
        ["suit","dress","skirt","boots","sneakers","coat","hoodie","jeans","pants","shirt","top","jacket"])

    styles, colors, fits, seasons = build_quiz_from_personas(chosen)
    app.take_style_quiz(me, preferred_styles=styles, preferred_colors=colors, seasons=seasons, preferred_fits=fits, avoid_types=avoid_types)

    # ---- Suggestions ----
    print("\n--- People you may like (style-based) ---")
    people = app.suggest_people(me, k=5, min_sim=0.0, exclude_followed=False)
    if not people:
        print("No suggestions yet (try different personas or add more seed users).")
    else:
        for uid, name, sim in people:
            print(f"{name} (sim={sim})")

    print("\n--- Listings visible to you (privacy respected) ---")
    for lst in app.visible_listings_for(me):
        owner = app.users[lst.owner_id].name
        print(f"#{lst.listing_id} {lst.title} — {owner} [{lst.privacy.value}]")

    print("\n--- Listing suggestions for you ---")
    for lid, title, owner, score in app.suggest_listings(me, k=10):
        print(f"#{lid} {title} — by {owner}  (match={score})")

if __name__ == "__main__":
    main()