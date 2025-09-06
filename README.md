# 🌿 Nature x Fashion App - Enhanced UX Platform 🌿

A Flask-based social platform for sustainable fashion enthusiasts with advanced direct messaging, reliability rating, and optimal user experience features.

## ✨ Enhanced Features

### 🔐 **Authentication & Security**
- **User Registration & Login**: Secure account creation with password hashing
- **Session Management**: Secure session tokens for user authentication
- **Password Protection**: SHA-256 password hashing for security
- **Session Verification**: Real-time session validation

### 💬 **Advanced Direct Messaging**
- **Send Messages**: Send text messages with attachments between users
- **Message Reactions**: Add emoji reactions to messages
- **Message Editing**: Edit sent messages with edit history
- **Message Deletion**: Soft delete messages with timestamps
- **Conversation History**: View complete conversation threads with enhanced data
- **Conversation List**: See all conversations with latest message previews
- **Message Status**: Track read/unread status and timestamps
- **Message Types**: Support for text, image, file, and custom message types

### ⭐ **Enhanced Rating System**
- **5-Star Ratings**: Rate other users based on your experience
- **Trust Score**: Automatic calculation of user trustworthiness
- **Rating History**: View all ratings given and received with timestamps
- **User Profiles**: Detailed profiles with bio, images, and rating statistics
- **Rating Validation**: Prevent self-rating and duplicate ratings
- **Rating Notifications**: Real-time notifications for new ratings

### 🔔 **Notification System**
- **Real-time Notifications**: Get notified of new messages and ratings
- **Notification Types**: Message, rating, and system notifications
- **Read Status**: Track read/unread notification status
- **Notification History**: View all notifications with timestamps

### 👤 **Enhanced User Management**
- **User Profiles**: Bio, profile images, and detailed statistics
- **Online Status**: See who's currently online
- **Last Seen**: Track when users were last active
- **User Preferences**: Customizable settings and preferences
- **Activity Tracking**: Monitor user activity and engagement
- **Advanced Search**: Search users by username, email, bio, and filters

### 🌱 **Nature-Inspired Features**
- **Trust Score Growth**: Trust scores grow like trees as users get more ratings
- **Sustainable Community**: Encourages eco-friendly fashion discussions
- **Organic Connections**: User relationships develop naturally through conversations
- **Eco-Friendly Design**: Nature-themed UI elements and messaging

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   pip install flask flask-sqlalchemy
   ```

2. **Run the App**
   ```bash
   python app.py
   ```
   The API will be available at `http://localhost:5001`

3. **Test the Enhanced Features**
   ```bash
   python3 test_enhanced_features.py
   ```

## 📚 Enhanced API Endpoints

### 🔐 Authentication
- `POST /register` - Register a new user with password
- `POST /login` - Login user and get session token
- `POST /logout` - Logout user and clear session
- `POST /verify_session` - Verify session token validity

### 👤 User Management
- `GET /users` - Get all users with enhanced data
- `GET /users/online` - Get online users
- `GET /users/search?q=query` - Basic user search
- `POST /users/search/advanced` - Advanced search with filters
- `GET /users/<user_id>/profile` - Get detailed user profile
- `PUT /users/<user_id>/profile` - Update user profile
- `GET /users/<user_id>/rating` - Get user's average rating
- `GET /users/<user_id>/ratings` - Get user's rating history
- `GET /users/<user_id>/activity` - Get user activity history
- `PUT /users/<user_id>/preferences` - Update user preferences

### 💬 Advanced Messaging
- `POST /messages` - Send a direct message
- `GET /messages/<user_id>/<peer_id>` - Get conversation between two users
- `GET /messages/<user_id>/<peer_id>/enhanced` - Get enhanced conversation data
- `GET /messages/<user_id>/conversations` - Get user's conversation list
- `POST /messages/<user_id>/<peer_id>/read` - Mark messages as read
- `POST /messages/<message_id>/reaction` - Add emoji reaction to message
- `PUT /messages/<message_id>/edit` - Edit a message
- `DELETE /messages/<message_id>/delete` - Delete a message

### ⭐ Rating System
- `POST /rate_user/<rated_id>` - Rate a user (1-5 stars)

### 🔔 Notifications
- `GET /users/<user_id>/notifications` - Get user notifications
- `POST /notifications/<notification_id>/read` - Mark notification as read

## 🔧 Example Usage

### Create Users
```bash
curl -X POST http://localhost:5001/create_user \
  -H "Content-Type: application/json" \
  -d '{"username": "eco_fashionista", "email": "eco@example.com"}'
```

### Send a Message
```bash
curl -X POST http://localhost:5001/messages \
  -H "Content-Type: application/json" \
  -d '{"sender_id": 1, "receiver_id": 2, "text": "Hi! Love your sustainable style! 🌿"}'
```

### Rate a User
```bash
curl -X POST http://localhost:5001/rate_user/2 \
  -H "Content-Type: application/json" \
  -d '{"rater_id": 1, "rating_value": 5}'
```

### Get User Profile
```bash
curl http://localhost:5001/users/1/profile
```

## 🌱 Nature-Inspired Design

The app incorporates nature-inspired concepts:
- **Trust Score**: Grows like a tree as users receive more positive ratings
- **Sustainable Community**: Encourages eco-friendly fashion discussions
- **Organic Growth**: User connections develop naturally through conversations

## 🛠️ Technical Details

- **Framework**: Flask with SQLAlchemy ORM
- **Database**: SQLite (easily configurable for production)
- **Architecture**: RESTful API design
- **Validation**: Comprehensive input validation and error handling
- **Scalability**: Designed to handle growing user base

## 📊 Database Schema

- **Users**: Store user information and trust scores
- **Messages**: Store direct messages with read status
- **UserRatings**: Store user-to-user ratings

## 🔒 Security Features

- Input validation for all endpoints
- Prevention of self-rating and self-messaging
- Duplicate rating prevention
- User existence validation

## 🧪 Testing

Run the included test script to verify all features:
```bash
python test_features.py
```

This will test all endpoints and demonstrate the complete functionality.

## 🚀 Future Enhancements

- Real-time messaging with WebSockets
- Image and file sharing in messages
- Push notifications
- Advanced search and filtering
- User blocking and reporting
- Message encryption
- Mobile app integration

---

Built with ❤️ for the sustainable fashion community 🌿