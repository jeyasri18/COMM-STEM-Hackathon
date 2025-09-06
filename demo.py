# onboard_demo.py
from social_style import SocialApp

# 6 simple personas you asked for
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
        "colors": ["red","cream","green","gold" if "gold" in [] else "yellow"],
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
    if not picks: return []
    out = []
    for x in picks.split(","):
        x = x.strip()
        if x.isdigit() and 1 <= int(x) <= len(options):
            out.append(options[int(x)-1])
    return out

def build_quiz_from_personas(selected: list[str]):
    styles, colors, fits, seasons = [], [], [], []
    for p in selected:
        data = PERSONAS.get(p)
        if not data: continue
        styles  += data["styles"]
        colors  += data["colors"]
        fits    += data["fits"]
        seasons += data["seasons"]
    # de-dup while preserving order
    def dedup(xs): 
        seen=set(); out=[]
        for x in xs:
            if x not in seen:
                seen.add(x); out.append(x)
        return out
    return dedup(styles), dedup(colors), dedup(seasons), dedup(fits)

def main():
    app = SocialApp()

    # Create a few users (you'll be the first)
    me = app.add_user("You", circle="USYD")
    sarah = app.add_user("Sarah", circle="USYD")
    jeya  = app.add_user("Jeyasri", circle="UNSW")
    omar  = app.add_user("Omar", circle="USYD")

    # Seed some listings
    app.add_listing(sarah, "Black leather boots", "winter streetwear", privacy="circle")  # USYD-only
    app.add_listing(jeya,  "Red silk dress", "formal evening satin", privacy="public")
    app.add_listing(omar,  "Grey hoodie", "sport casual hoodie", privacy="circle")        # USYD-only

    # ---- Onboarding quiz (your account) ----
    persona_names = list(PERSONAS.keys())
    chosen = ask_multi("Pick 2–3 style personas you vibe with:", persona_names)
    if not chosen:
        print("No personas selected; you can run again later.")
        chosen = []

    # optional extras
    avoid_types = ask_multi("Anything you rarely wear (avoid)?", 
                            ["suit","dress","skirt","boots","sneakers","coat","hoodie","jeans","pants","shirt","top","jacket"])

    # Map personas -> quiz lists and save
    pref_styles, pref_colors, pref_seasons, pref_fits = build_quiz_from_personas(chosen)
    app.take_style_quiz(
        me,
        preferred_styles=pref_styles,
        preferred_colors=pref_colors,
        seasons=pref_seasons,
        preferred_fits=pref_fits,
        avoid_types=avoid_types
    )

    # ---- Suggestions ----
    print("\n--- People you may like (style-based) ---")
    people = app.suggest_people(me, k=5, min_sim=0.0, exclude_followed=False)
    if not people:
        print("No suggestions yet (try adding more listings or different personas).")
    else:
        for uid, name, sim in people:
            print(f"{name} (sim={sim})")

    print("\n--- Listings for you (privacy respected) ---")
    for lid, title, owner, score in app.suggest_listings(me, k=10):
        print(f"#{lid} {title} — by {owner}  (match={score})")

    # Example: you add your own listing (public vs circle)
    # app.add_listing(me, "Blue denim jacket", "casual streetwear cotton", privacy="public")

if __name__ == "__main__":
    main()
