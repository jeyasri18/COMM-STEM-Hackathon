from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
from sqlalchemy import and_, or_
import json

# -------------------------------
# APP SETUP
# -------------------------------
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///threadnetwork.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# -------------------------------
# DATABASE MODELS
# -------------------------------
class User(db.Model):
    """
    Represents a user in the fashion network.
    Trust_score grows as the user receives more ratings (nature-inspired "tree growth").
    """
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    trust_score = db.Column(db.Float, default=0.0)
    bio = db.Column(db.Text, default="")
    profile_image = db.Column(db.String(255), default="")
    is_online = db.Column(db.Boolean, default=False)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    preferences = db.Column(db.Text, default="{}")  # JSON string for user preferences
    location = db.Column(db.String(100), default="")
    interests = db.Column(db.Text, default="[]")  # JSON array of interests


class UserRating(db.Model):
    """
    Represents a 5-star rating from one user to another.
    """
    id = db.Column(db.Integer, primary_key = True)
    rater_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    rated_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    rating_value = db.Column(db.Integer, nullable= False)
    timestamp =db.Column(db.DateTime, default= datetime.utcnow)


class Message(db.Model):
    """
    Represents a direct message between two users.
    """
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)
    message_type = db.Column(db.String(20), default='text')  # text, image, file, etc.
    attachment_url = db.Column(db.String(500), default="")
    is_edited = db.Column(db.Boolean, default=False)
    edited_at = db.Column(db.DateTime)
    is_deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime)
    reactions = db.Column(db.Text, default="{}")  # JSON string for emoji reactions


class Notification(db.Model):
    """
    Represents notifications for users.
    """
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # message, rating, system, mention
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    related_user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    related_message_id = db.Column(db.Integer, db.ForeignKey('message.id'))
    action_url = db.Column(db.String(500), default="")


class UserActivity(db.Model):
    """
    Tracks user activity for analytics and online status.
    """
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    activity_type = db.Column(db.String(50), nullable=False)  # login, message_sent, rating_given, profile_viewed
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    details = db.Column(db.Text, default="{}")  # JSON string for additional details


class UserConnection(db.Model):
    """
    Represents connections between users (friends/followers).
    """
    id = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    following_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_blocked = db.Column(db.Boolean, default=False)


# -------------------------------
# BUSINESS LOGIC CLASS
# -------------------------------
class FashionNetwork:
    """
    Encapsulates DM and user rating logic.
    Inspired by nature: trust grows like a tree as users interact.
    """
    @staticmethod
    def submit_rating(rater_id, rated_id, rating_value):
        """
        Submit a rating and update the user's trust score.
        """
        if not (1 <= rating_value <= 5):
            return {"error": "Rating must be between 1 and 5"}, 400
        
        # Validate users exist
        rater = User.query.get(rater_id)
        rated = User.query.get(rated_id)
        
        if not rater:
            return {"error": "Rater not found"}, 404
        if not rated:
            return {"error": "Rated user not found"}, 404
        if rater_id == rated_id:
            return {"error": "Cannot rate yourself"}, 400
        
        # Check if rating already exists
        existing_rating = UserRating.query.filter_by(rater_id=rater_id, rated_id=rated_id).first()
        if existing_rating:
            return {"error": "You have already rated this user"}, 400
        
        # Save rating to database
        rating = UserRating(rater_id=rater_id, rated_id=rated_id, rating_value=rating_value)
        db.session.add(rating)
        db.session.commit()

        # Update trust score
        FashionNetwork.update_trust_score(rated_id)
        
        # Create notification for rated user
        rated_user = User.query.get(rated_id)
        rater_user = User.query.get(rater_id)
        FashionNetwork.create_notification(
            rated_id, 
            'rating', 
            f"New Rating from {rater_user.username}",
            f"You received a {rating_value}-star rating from {rater_user.username}!",
            rater_id
        )
        
        # Log activity
        FashionNetwork.log_activity(rater_id, 'rating_given', {'rated_user_id': rated_id, 'rating': rating_value})
        
        return {"message": "Rating submitted", "rating_id": rating.id}, 200
    
    @staticmethod
    def update_trust_score(user_id):
        """
        Calculate the user's trust score as the average of all ratings received.
        """
        ratings = UserRating.query.filter_by(rated_id=user_id).all()
        if ratings:
            avg = sum(r.rating_value for r in ratings) / len(ratings)
            user = User.query.get(user_id)
            user.trust_score = round(avg, 2)
            db.session.commit()

    
    @staticmethod
    def get_average_rating(user_id):
        """
        Return the average rating and trust score for a user.
        """
        ratings = UserRating.query.filter_by(rated_id=user_id).all()
        if not ratings:
            return {"average_rating": None, "trust_score": 0.0}
        avg = sum(r.rating_value for r in ratings) / len(ratings)
        trust = User.query.get(user_id).trust_score
        return {"average_rating": round(avg, 2), "trust_score": trust}

    @staticmethod
    def send_message(sender_id, receiver_id, text, message_type='text', attachment_url=""):
        """
        Send a direct message from one user to another.
        """
        # Validate users exist
        sender = User.query.get(sender_id)
        receiver = User.query.get(receiver_id)
        
        if not sender:
            return {"error": "Sender not found"}, 404
        if not receiver:
            return {"error": "Receiver not found"}, 404
        if sender_id == receiver_id:
            return {"error": "Cannot send message to yourself"}, 400
        
        msg = Message(
            sender_id=sender_id, 
            receiver_id=receiver_id, 
            text=text, 
            message_type=message_type,
            attachment_url=attachment_url
        )
        db.session.add(msg)
        db.session.commit()
        
        # Create notification for receiver
        sender_user = User.query.get(sender_id)
        FashionNetwork.create_notification(
            receiver_id,
            'message',
            f"New message from {sender_user.username}",
            text[:100] + "..." if len(text) > 100 else text,
            sender_id,
            msg.id
        )
        
        # Log activity
        FashionNetwork.log_activity(sender_id, 'message_sent', {'receiver_id': receiver_id, 'message_id': msg.id})
        
        return {"message": "Message sent", "message_id": msg.id}, 200

    @staticmethod
    def get_conversation(user_id, peer_id):
        """
        Retrieve all messages between two users, ordered chronologically.
        """
        msgs = Message.query.filter(
            or_(
                and_(Message.sender_id == user_id, Message.receiver_id == peer_id),
                and_(Message.sender_id == peer_id, Message.receiver_id == user_id)
            )
        ).order_by(Message.timestamp.asc()).all()

        return [
            {
                "id": m.id,
                "from": m.sender_id,
                "to": m.receiver_id,
                "text": m.text,
                "time": m.timestamp.isoformat(),
                "is_read": m.is_read,
                "message_type": m.message_type,
                "attachment_url": m.attachment_url,
                "is_edited": m.is_edited,
                "edited_at": m.edited_at.isoformat() if m.edited_at else None,
                "is_deleted": m.is_deleted,
                "deleted_at": m.deleted_at.isoformat() if m.deleted_at else None,
                "reactions": m.reactions
            }
            for m in msgs
        ]
    
    @staticmethod
    def get_conversation_list(user_id):
        """
        Get list of all conversations for a user with latest message preview.
        """
        # Get all unique conversation partners
        sent_messages = Message.query.filter_by(sender_id=user_id).all()
        received_messages = Message.query.filter_by(receiver_id=user_id).all()
        
        conversations = {}
        
        # Process sent messages
        for msg in sent_messages:
            partner_id = msg.receiver_id
            if partner_id not in conversations or msg.timestamp > conversations[partner_id]['last_message_time']:
                partner = User.query.get(partner_id)
                conversations[partner_id] = {
                    'partner_id': partner_id,
                    'partner_username': partner.username if partner else 'Unknown',
                    'last_message': msg.text,
                    'last_message_time': msg.timestamp,
                    'unread_count': 0
                }
        
        # Process received messages
        for msg in received_messages:
            partner_id = msg.sender_id
            if partner_id not in conversations or msg.timestamp > conversations[partner_id]['last_message_time']:
                partner = User.query.get(partner_id)
                conversations[partner_id] = {
                    'partner_id': partner_id,
                    'partner_username': partner.username if partner else 'Unknown',
                    'last_message': msg.text,
                    'last_message_time': msg.timestamp,
                    'unread_count': 0
                }
            
            # Count unread messages
            if not msg.is_read:
                conversations[partner_id]['unread_count'] += 1
        
        # Sort by last message time
        conversation_list = list(conversations.values())
        conversation_list.sort(key=lambda x: x['last_message_time'], reverse=True)
        
        return conversation_list
    
    @staticmethod
    def mark_messages_as_read(user_id, peer_id):
        """
        Mark all messages from a specific peer as read.
        """
        Message.query.filter_by(sender_id=peer_id, receiver_id=user_id, is_read=False).update({'is_read': True})
        db.session.commit()
        return {"message": "Messages marked as read"}, 200
    
    @staticmethod
    def add_message_reaction(message_id, user_id, emoji):
        """Add an emoji reaction to a message."""
        message = Message.query.get(message_id)
        if not message:
            return {"error": "Message not found"}, 404
        
        # Parse existing reactions
        import json
        reactions = json.loads(message.reactions) if message.reactions else {}
        
        # Add or update reaction
        if emoji in reactions:
            reactions[emoji] += 1
        else:
            reactions[emoji] = 1
        
        message.reactions = json.dumps(reactions)
        db.session.commit()
        
        return {"success": True, "reactions": reactions}
    
    @staticmethod
    def edit_message(message_id, user_id, new_text):
        """Edit a message."""
        message = Message.query.get(message_id)
        if not message or message.sender_id != user_id:
            return {"error": "Message not found or unauthorized"}, 404
        
        if message.is_deleted:
            return {"error": "Cannot edit deleted message"}, 400
        
        message.text = new_text
        message.is_edited = True
        message.edited_at = datetime.utcnow()
        db.session.commit()
        
        return {"success": True, "message": "Message edited"}
    
    @staticmethod
    def delete_message(message_id, user_id):
        """Delete a message (soft delete)."""
        message = Message.query.get(message_id)
        if not message or message.sender_id != user_id:
            return {"error": "Message not found or unauthorized"}, 404
        
        if message.is_deleted:
            return {"error": "Message already deleted"}, 400
        
        message.is_deleted = True
        message.deleted_at = datetime.utcnow()
        db.session.commit()
        
        return {"success": True, "message": "Message deleted"}
    
    @staticmethod
    def get_message_reactions(message_id):
        """Get all reactions for a message."""
        message = Message.query.get(message_id)
        if not message:
            return {"error": "Message not found"}, 404
        
        import json
        reactions = json.loads(message.reactions) if message.reactions else {}
        return {"reactions": reactions}
    
    @staticmethod
    def search_messages(user_id, query, limit=20):
        """Search messages for a user."""
        messages = Message.query.filter(
            or_(
                and_(Message.sender_id == user_id, Message.text.contains(query)),
                and_(Message.receiver_id == user_id, Message.text.contains(query))
            )
        ).filter(Message.is_deleted == False).order_by(Message.timestamp.desc()).limit(limit).all()
        
        return [
            {
                "id": m.id,
                "from": m.sender_id,
                "to": m.receiver_id,
                "text": m.text,
                "time": m.timestamp.isoformat(),
                "message_type": m.message_type,
                "is_edited": m.is_edited
            }
            for m in messages
        ]
    
    @staticmethod
    def create_notification(user_id, notification_type, title, message, related_user_id=None, related_message_id=None, action_url=""):
        """Create a notification for a user."""
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            related_user_id=related_user_id,
            related_message_id=related_message_id,
            action_url=action_url
        )
        db.session.add(notification)
        db.session.commit()
        return notification.id
    
    @staticmethod
    def get_notifications(user_id, limit=20):
        """Get notifications for a user."""
        notifications = Notification.query.filter_by(user_id=user_id)\
            .order_by(Notification.timestamp.desc())\
            .limit(limit).all()
        
        return [
            {
                "id": n.id,
                "type": n.type,
                "title": n.title,
                "message": n.message,
                "is_read": n.is_read,
                "timestamp": n.timestamp.isoformat(),
                "related_user_id": n.related_user_id,
                "related_message_id": n.related_message_id,
                "action_url": n.action_url
            }
            for n in notifications
        ]
    
    @staticmethod
    def mark_notification_read(notification_id, user_id):
        """Mark a notification as read."""
        notification = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
        if notification:
            notification.is_read = True
            db.session.commit()
            return {"success": True}
        return {"success": False, "error": "Notification not found"}
    
    @staticmethod
    def mark_all_notifications_read(user_id):
        """Mark all notifications as read for a user."""
        Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
        db.session.commit()
        return {"success": True, "message": "All notifications marked as read"}
    
    @staticmethod
    def log_activity(user_id, activity_type, details=None):
        """Log user activity."""
        activity = UserActivity(
            user_id=user_id,
            activity_type=activity_type,
            details=json.dumps(details) if details else "{}"
        )
        db.session.add(activity)
        db.session.commit()
    
    @staticmethod
    def update_user_online_status(user_id, is_online=True):
        """Update user's online status."""
        user = User.query.get(user_id)
        if user:
            user.is_online = is_online
            user.last_seen = datetime.utcnow()
            db.session.commit()
            return {"success": True}
        return {"success": False, "error": "User not found"}
    
    @staticmethod
    def get_online_users():
        """Get list of online users."""
        online_users = User.query.filter_by(is_online=True).all()
        return [
            {
                "id": user.id,
                "username": user.username,
                "last_seen": user.last_seen.isoformat(),
                "trust_score": user.trust_score,
                "profile_image": user.profile_image
            }
            for user in online_users
        ]
    
    @staticmethod
    def search_users_advanced(query, filters=None, limit=20):
        """Advanced user search with filters."""
        query_obj = User.query
        
        if query:
            query_obj = query_obj.filter(
                or_(
                    User.username.contains(query),
                    User.email.contains(query),
                    User.bio.contains(query),
                    User.location.contains(query)
                )
            )
        
        if filters:
            if filters.get('min_trust_score'):
                query_obj = query_obj.filter(User.trust_score >= filters['min_trust_score'])
            if filters.get('is_online'):
                query_obj = query_obj.filter(User.is_online == filters['is_online'])
            if filters.get('location'):
                query_obj = query_obj.filter(User.location.contains(filters['location']))
            if filters.get('interests'):
                for interest in filters['interests']:
                    query_obj = query_obj.filter(User.interests.contains(interest))
        
        users = query_obj.limit(limit).all()
        
        return [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "bio": user.bio,
                "trust_score": user.trust_score,
                "is_online": user.is_online,
                "last_seen": user.last_seen.isoformat(),
                "profile_image": user.profile_image,
                "location": user.location,
                "interests": json.loads(user.interests) if user.interests else []
            }
            for user in users
        ]
    
    @staticmethod
    def get_user_recommendations(user_id, limit=10):
        """Get user recommendations based on interests and connections."""
        user = User.query.get(user_id)
        if not user:
            return []
        
        user_interests = json.loads(user.interests) if user.interests else []
        
        # Find users with similar interests
        similar_users = []
        for interest in user_interests:
            users_with_interest = User.query.filter(
                and_(
                    User.interests.contains(interest),
                    User.id != user_id
                )
            ).limit(5).all()
            similar_users.extend(users_with_interest)
        
        # Remove duplicates and limit results
        unique_users = list({user.id: user for user in similar_users}.values())[:limit]
        
        return [
            {
                "id": u.id,
                "username": u.username,
                "bio": u.bio,
                "trust_score": u.trust_score,
                "is_online": u.is_online,
                "profile_image": u.profile_image,
                "common_interests": [i for i in json.loads(u.interests) if i in user_interests]
            }
            for u in unique_users
        ]
    
    @staticmethod
    def follow_user(follower_id, following_id):
        """Follow a user."""
        if follower_id == following_id:
            return {"error": "Cannot follow yourself"}, 400
        
        # Check if already following
        existing = UserConnection.query.filter_by(follower_id=follower_id, following_id=following_id).first()
        if existing:
            if existing.is_blocked:
                return {"error": "Cannot follow blocked user"}, 400
            return {"error": "Already following this user"}, 400
        
        connection = UserConnection(follower_id=follower_id, following_id=following_id)
        db.session.add(connection)
        db.session.commit()
        
        # Create notification
        follower = User.query.get(follower_id)
        FashionNetwork.create_notification(
            following_id,
            'follow',
            f"{follower.username} started following you",
            f"{follower.username} is now following your sustainable fashion journey!",
            follower_id
        )
        
        return {"success": True, "message": "User followed"}
    
    @staticmethod
    def unfollow_user(follower_id, following_id):
        """Unfollow a user."""
        connection = UserConnection.query.filter_by(follower_id=follower_id, following_id=following_id).first()
        if connection:
            db.session.delete(connection)
            db.session.commit()
            return {"success": True, "message": "User unfollowed"}
        return {"error": "Not following this user"}, 400
    
    @staticmethod
    def get_user_connections(user_id, connection_type="following"):
        """Get user's following or followers."""
        if connection_type == "following":
            connections = UserConnection.query.filter_by(follower_id=user_id).all()
            user_ids = [c.following_id for c in connections]
        else:  # followers
            connections = UserConnection.query.filter_by(following_id=user_id).all()
            user_ids = [c.follower_id for c in connections]
        
        users = User.query.filter(User.id.in_(user_ids)).all()
        return [
            {
                "id": user.id,
                "username": user.username,
                "bio": user.bio,
                "trust_score": user.trust_score,
                "is_online": user.is_online,
                "profile_image": user.profile_image
            }
            for user in users
        ]
    
    @staticmethod
    def get_rating_history(user_id):
        """
        Get all ratings given and received by a user.
        """
        given_ratings = UserRating.query.filter_by(rater_id=user_id).all()
        received_ratings = UserRating.query.filter_by(rated_id=user_id).all()
        
        return {
            "given_ratings": [
                {
                    "id": r.id,
                    "rated_user_id": r.rated_id,
                    "rating": r.rating_value,
                    "timestamp": r.timestamp.isoformat()
                }
                for r in given_ratings
            ],
            "received_ratings": [
                {
                    "id": r.id,
                    "rater_user_id": r.rater_id,
                    "rating": r.rating_value,
                    "timestamp": r.timestamp.isoformat()
                }
                for r in received_ratings
            ]
        }
    
    @staticmethod
    def search_users(query, limit=10):
        """
        Search for users by username or email.
        """
        users = User.query.filter(
            or_(
                User.username.contains(query),
                User.email.contains(query)
            )
        ).limit(limit).all()
        
        return [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "trust_score": user.trust_score
            }
            for user in users
        ]
    
    @staticmethod
    def get_user_profile(user_id):
        """
        Get detailed user profile with rating statistics.
        """
        user = User.query.get(user_id)
        if not user:
            return {"error": "User not found"}, 404
        
        ratings = UserRating.query.filter_by(rated_id=user_id).all()
        rating_stats = {
            "total_ratings": len(ratings),
            "average_rating": 0.0,
            "rating_breakdown": {str(i): 0 for i in range(1, 6)}
        }
        
        if ratings:
            rating_values = [r.rating_value for r in ratings]
            rating_stats["average_rating"] = round(sum(rating_values) / len(rating_values), 2)
            
            for rating in ratings:
                rating_stats["rating_breakdown"][str(rating.rating_value)] += 1
        
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "trust_score": user.trust_score,
            "rating_stats": rating_stats
        }

# -------------------------------
# API ENDPOINTS
# -------------------------------

# Create a new user
@app.route('/create_user', methods=['POST'])
def create_user():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    bio = data.get('bio', '')
    location = data.get('location', '')
    interests = data.get('interests', [])
    
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400
    
    user = User(
        username=username, 
        email=email, 
        bio=bio,
        location=location,
        interests=json.dumps(interests)
    )
    db.session.add(user)
    db.session.commit()
    
    # Log activity
    FashionNetwork.log_activity(user.id, 'account_created')
    
    return jsonify({"message": "User created", "user_id": user.id})

# Submit a rating
@app.route('/rate_user/<int:rated_id>', methods=['POST'])
def rate_user(rated_id):
    data = request.json
    rater_id = data.get('rater_id')
    rating_value = data.get('rating_value')
    result, code = FashionNetwork.submit_rating(rater_id, rated_id, rating_value)
    return jsonify(result), code

# Get average rating for a user
@app.route('/users/<int:user_id>/rating', methods=['GET'])
def get_avg_rating(user_id):
    return jsonify(FashionNetwork.get_average_rating(user_id))

# Send a DM
@app.route('/messages', methods=['POST'])
def send_message():
    data = request.json
    message_type = data.get('message_type', 'text')
    attachment_url = data.get('attachment_url', '')
    result, code = FashionNetwork.send_message(data['sender_id'], data['receiver_id'], data['text'], message_type, attachment_url)
    return jsonify(result), code

# Get conversation between two users
@app.route('/messages/<int:user_id>/<int:peer_id>', methods=['GET'])
def get_conversation(user_id, peer_id):
    return jsonify(FashionNetwork.get_conversation(user_id, peer_id))

# Get conversation list for a user
@app.route('/messages/<int:user_id>/conversations', methods=['GET'])
def get_conversation_list(user_id):
    return jsonify(FashionNetwork.get_conversation_list(user_id))

# Mark messages as read
@app.route('/messages/<int:user_id>/<int:peer_id>/read', methods=['POST'])
def mark_messages_read(user_id, peer_id):
    result, code = FashionNetwork.mark_messages_as_read(user_id, peer_id)
    return jsonify(result), code

# Add message reaction
@app.route('/messages/<int:message_id>/reaction', methods=['POST'])
def add_message_reaction(message_id):
    data = request.json
    user_id = data.get('user_id')
    emoji = data.get('emoji')
    result, code = FashionNetwork.add_message_reaction(message_id, user_id, emoji)
    return jsonify(result), code

# Edit message
@app.route('/messages/<int:message_id>/edit', methods=['PUT'])
def edit_message(message_id):
    data = request.json
    user_id = data.get('user_id')
    new_text = data.get('text')
    result, code = FashionNetwork.edit_message(message_id, user_id, new_text)
    return jsonify(result), code

# Delete message
@app.route('/messages/<int:message_id>/delete', methods=['DELETE'])
def delete_message(message_id):
    data = request.json
    user_id = data.get('user_id')
    result, code = FashionNetwork.delete_message(message_id, user_id)
    return jsonify(result), code

# Get message reactions
@app.route('/messages/<int:message_id>/reactions', methods=['GET'])
def get_message_reactions(message_id):
    result, code = FashionNetwork.get_message_reactions(message_id)
    return jsonify(result), code

# Search messages
@app.route('/messages/search', methods=['GET'])
def search_messages():
    user_id = request.args.get('user_id', type=int)
    query = request.args.get('q', '')
    limit = request.args.get('limit', 20, type=int)
    
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    return jsonify(FashionNetwork.search_messages(user_id, query, limit))

# Get user profile with detailed rating stats
@app.route('/users/<int:user_id>/profile', methods=['GET'])
def get_user_profile(user_id):
    result, code = FashionNetwork.get_user_profile(user_id)
    return jsonify(result), code

# Search users
@app.route('/users/search', methods=['GET'])
def search_users():
    query = request.args.get('q', '')
    limit = request.args.get('limit', 10, type=int)
    return jsonify(FashionNetwork.search_users(query, limit))

# Get rating history for a user
@app.route('/users/<int:user_id>/ratings', methods=['GET'])
def get_rating_history(user_id):
    return jsonify(FashionNetwork.get_rating_history(user_id))

# Get all users (for discovery)
@app.route('/users', methods=['GET'])
def get_all_users():
    users = User.query.all()
    return jsonify([
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "trust_score": user.trust_score,
            "bio": user.bio,
            "is_online": user.is_online,
            "last_seen": user.last_seen.isoformat(),
            "profile_image": user.profile_image,
            "location": user.location,
            "interests": json.loads(user.interests) if user.interests else []
        }
        for user in users
    ])

# Get notifications for a user
@app.route('/users/<int:user_id>/notifications', methods=['GET'])
def get_notifications(user_id):
    limit = request.args.get('limit', 20, type=int)
    return jsonify(FashionNetwork.get_notifications(user_id, limit))

# Mark notification as read
@app.route('/notifications/<int:notification_id>/read', methods=['POST'])
def mark_notification_read(notification_id):
    data = request.json
    user_id = data.get('user_id')
    result = FashionNetwork.mark_notification_read(notification_id, user_id)
    return jsonify(result)

# Mark all notifications as read
@app.route('/users/<int:user_id>/notifications/read_all', methods=['POST'])
def mark_all_notifications_read(user_id):
    result = FashionNetwork.mark_all_notifications_read(user_id)
    return jsonify(result)

# Get online users
@app.route('/users/online', methods=['GET'])
def get_online_users():
    return jsonify(FashionNetwork.get_online_users())

# Update user online status
@app.route('/users/<int:user_id>/online', methods=['POST'])
def update_online_status(user_id):
    data = request.json
    is_online = data.get('is_online', True)
    result = FashionNetwork.update_user_online_status(user_id, is_online)
    return jsonify(result)

# Advanced user search
@app.route('/users/search/advanced', methods=['POST'])
def search_users_advanced():
    data = request.json
    query = data.get('query', '')
    filters = data.get('filters', {})
    limit = data.get('limit', 20)
    return jsonify(FashionNetwork.search_users_advanced(query, filters, limit))

# Get user recommendations
@app.route('/users/<int:user_id>/recommendations', methods=['GET'])
def get_user_recommendations(user_id):
    limit = request.args.get('limit', 10, type=int)
    return jsonify(FashionNetwork.get_user_recommendations(user_id, limit))

# Follow a user
@app.route('/users/<int:following_id>/follow', methods=['POST'])
def follow_user(following_id):
    data = request.json
    follower_id = data.get('follower_id')
    result, code = FashionNetwork.follow_user(follower_id, following_id)
    return jsonify(result), code

# Unfollow a user
@app.route('/users/<int:following_id>/unfollow', methods=['POST'])
def unfollow_user(following_id):
    data = request.json
    follower_id = data.get('follower_id')
    result, code = FashionNetwork.unfollow_user(follower_id, following_id)
    return jsonify(result), code

# Get user connections (following/followers)
@app.route('/users/<int:user_id>/connections', methods=['GET'])
def get_user_connections(user_id):
    connection_type = request.args.get('type', 'following')  # following or followers
    return jsonify(FashionNetwork.get_user_connections(user_id, connection_type))

# Update user profile
@app.route('/users/<int:user_id>/profile', methods=['PUT'])
def update_user_profile(user_id):
    data = request.json
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if 'bio' in data:
        user.bio = data['bio']
    if 'profile_image' in data:
        user.profile_image = data['profile_image']
    if 'location' in data:
        user.location = data['location']
    if 'interests' in data:
        user.interests = json.dumps(data['interests'])
    
    db.session.commit()
    return jsonify({"success": True, "message": "Profile updated"})

# Get user activity
@app.route('/users/<int:user_id>/activity', methods=['GET'])
def get_user_activity(user_id):
    limit = request.args.get('limit', 50, type=int)
    activities = UserActivity.query.filter_by(user_id=user_id)\
        .order_by(UserActivity.timestamp.desc())\
        .limit(limit).all()
    
    return jsonify([
        {
            "id": a.id,
            "activity_type": a.activity_type,
            "timestamp": a.timestamp.isoformat(),
            "details": json.loads(a.details) if a.details else {}
        }
        for a in activities
    ])

# -------------------------------
# RUN APP
# -------------------------------
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5002)


    