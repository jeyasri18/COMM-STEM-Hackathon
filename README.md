# Hand Me Up - Sustainable Fashion Sharing Platform

A comprehensive web application that combines clothing sharing, style matching, and community features to promote sustainable fashion.

## 🌟 Features

### Core Functionality
- **Clothing Sharing**: Upload and browse clothing items for rent or free sharing
- **Style Matching**: AI-powered recommendations based on style preferences
- **Rating System**: 3-category rating system (Material & Construction, Performance & Durability, Aesthetics & Comfort)
- **Community Features**: Follow users, join communities, and discover like-minded fashion enthusiasts
- **Style Quiz**: Personalized style assessment for better recommendations

### Technical Features
- **Modern React Frontend**: Built with React 18, TypeScript, and Tailwind CSS
- **FastAPI Backend**: High-performance Python API with automatic documentation
- **Vector Similarity**: Advanced style matching using numpy and cosine similarity
- **Real-time Updates**: Live data synchronization between frontend and backend
- **Responsive Design**: Mobile-first design that works on all devices

## 🏗️ Architecture

```
├── backend/                 # Python FastAPI backend
│   ├── main.py             # Main API server
│   ├── customer_reviews.py # Rating system
│   └── social_style.py     # Style matching algorithm
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   └── lib/            # API client and utilities
│   └── public/             # Static assets
└── clothing-upload-app/    # Original React app (legacy)
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the backend server:**
   ```bash
   python start_backend.py
   ```
   
   Or manually:
   ```bash
   cd backend
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **Access API documentation:**
   - Open http://localhost:8000/docs for interactive API docs
   - Open http://localhost:8000/redoc for alternative documentation

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```
   
   Or use the batch file on Windows:
   ```bash
   start_frontend.bat
   ```

3. **Access the application:**
   - Open http://localhost:3000 in your browser

## 📱 Usage

### For Users
1. **Sign Up/Login**: Create an account or sign in
2. **Take Style Quiz**: Complete the style assessment for personalized recommendations
3. **Browse Items**: Discover clothing items from the community
4. **Upload Items**: Share your own clothing items
5. **Rate & Review**: Provide feedback on items you've used
6. **Connect**: Follow users with similar style preferences

### For Developers
- **API Endpoints**: All endpoints are documented at `/docs`
- **Style Matching**: Vector-based similarity using clothing attributes
- **Rating System**: 3-category rating with weighted averages
- **Real-time Updates**: Frontend automatically syncs with backend changes

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_key
```

### Backend Configuration
The backend uses in-memory storage by default. For production, you would typically:
- Add a database (PostgreSQL, MongoDB, etc.)
- Implement proper authentication
- Add rate limiting and security measures
- Use environment variables for configuration

## 🧪 API Examples

### Create a User
```bash
curl -X POST "http://localhost:8000/users" \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "circle": "USYD"}'
```

### Create a Listing
```bash
curl -X POST "http://localhost:8000/listings" \
  -H "Content-Type: application/json" \
  -d '{
    "owner_id": 1,
    "title": "Vintage Denim Jacket",
    "description": "Perfect for casual outings",
    "privacy": "public"
  }'
```

### Get Style Recommendations
```bash
curl "http://localhost:8000/users/1/suggestions/listings?k=5"
```

## 🎨 Style Matching Algorithm

The style matching system uses:
- **Vector Representation**: Each item and user preference is converted to a numerical vector
- **Weighted Features**: Different clothing attributes have different importance weights
- **Cosine Similarity**: Measures similarity between user preferences and available items
- **Multi-factor Scoring**: Combines quiz answers, owned items, and liked items

## 🔮 Future Enhancements

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Image upload and processing
- [ ] Real-time chat between users
- [ ] Payment integration for rentals
- [ ] Mobile app (React Native)
- [ ] Advanced recommendation algorithms
- [ ] Social media integration
- [ ] Sustainability impact tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built for the COMM-STEM Hackathon
- Inspired by sustainable fashion movements
- Uses modern web technologies for optimal performance
