# Re:Fit

Re:Fit is a full-stack platform that makes sustainable fashion more accessible through clothing sharing, personalised style recommendations, and community-driven discovery.

## Features

* **Clothing Sharing** — Upload and browse clothing available for sharing or rental
* **Style Recommendations** — Personalised clothing recommendations using vector similarity and cosine similarity
* **Style Quiz** — Capture user preferences to improve recommendations
* **Ratings & Reviews** — Evaluate items across material, durability, aesthetics, and comfort
* **Social Features** — Follow users, join communities, and discover similar fashion interests
* **Responsive UI** — Mobile-first interface built with React and Tailwind CSS

## Tech Stack

* **Frontend:** React 18, TypeScript, Tailwind CSS
* **Backend:** Python, FastAPI, Uvicorn
* **Algorithms:** NumPy, vector representations, cosine similarity
* **Architecture:** RESTful API

## Architecture

```text
React + TypeScript
       │
       │ REST API
       ▼
FastAPI Backend
       │
       ├── User & Listing Services
       ├── Ratings & Reviews
       └── Style Recommendation Engine
              │
              └── NumPy + Cosine Similarity
```

## Style Matching

The recommendation system:

1. Collects user preferences through the style quiz and interactions
2. Converts user preferences and clothing attributes into numerical vectors
3. Applies feature weighting
4. Calculates cosine similarity
5. Ranks and returns the most relevant clothing items

## Project Structure

```text
├── backend/
│   ├── main.py
│   ├── customer_reviews.py
│   └── social_style.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   └── public/
└── requirements.txt
```

## Getting Started

### Backend

```bash
pip install -r requirements.txt
python start_backend.py
```

API: `http://localhost:8000`
Documentation: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm start
```

Application: `http://localhost:3000`

## Engineering Highlights

* Built a full-stack **React + FastAPI** application
* Designed RESTful APIs for users, listings, ratings, and recommendations
* Implemented a **vector-based recommendation engine** using cosine similarity
* Developed reusable TypeScript/React components
* Implemented rating, review, validation, and error-handling logic
* Collaborated as part of a **5-person hackathon team**

## Future Improvements

* PostgreSQL integration
* Production authentication and authorisation
* Image processing for clothing listings
* Real-time messaging with WebSockets
* Payment integration for rentals
* Advanced recommendation models
* Sustainability impact tracking

## Contributors

* Jeyasri Sundar
* Meghna Anand
* Mishmishel
* Sera Tonin
* Dyuti

Built for the **COMM-STEM Hackathon**.
