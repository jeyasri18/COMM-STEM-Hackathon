import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader } from './ui/card';
import { MessageCircle, Send, Search, ArrowLeft } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

// Helper function to convert UUID to integer for backend
function uuidToInt(uuid) {
  if (!uuid) return 1; // Default user ID
  // Simple hash function to convert UUID to consistent integer
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    const char = uuid.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 1000000 + 1; // Ensure positive integer
}

export function Messages({ currentUserId, user, onBack }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    if (currentUserId) {
      loadConversations();
    }
  }, [currentUserId]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation && currentUserId) {
      loadMessages(selectedConversation.other_user_id);
    }
  }, [selectedConversation, currentUserId]);

  const loadConversations = async () => {
    try {
      const userId = uuidToInt(currentUserId);
      const response = await fetch(`${API_BASE}/messages/${userId}/conversations`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (otherUserId) => {
    try {
      setLoading(true);
      const userId = uuidToInt(currentUserId);
      const response = await fetch(`${API_BASE}/messages/${userId}/${otherUserId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        
        // Mark conversation as read
        await fetch(`${API_BASE}/messages/${userId}/${otherUserId}/read?reader_id=${userId}`, {
          method: 'POST'
        });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const userId = uuidToInt(currentUserId);
      console.log('Sending message:', {
        sender_id: userId,
        receiver_id: selectedConversation.other_user_id,
        content: newMessage.trim()
      });
      
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender_id: userId,
          receiver_id: selectedConversation.other_user_id,
          content: newMessage.trim(),
          message_type: 'text'
        })
      });

      console.log('Message response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Message sent successfully:', data);
        setNewMessage('');
        loadMessages(selectedConversation.other_user_id);
        loadConversations(); // Refresh conversations list
      } else {
        const errorData = await response.json();
        console.error('Message send failed:', errorData);
        const errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
        alert('Failed to send message: ' + errorMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + error.message);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // First, ensure current user has a profile in Supabase
      await createUserProfile();
      
      const userId = currentUserId; // Use the actual UUID, not converted
      const response = await fetch(`${API_BASE}/users/${userId}/search?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const createUserProfile = async () => {
    try {
      if (!user) return;
      
      const profileData = {
        id: user.id,
        display_name: user.user_metadata?.full_name || user.email
      };
      
      await fetch(`${API_BASE}/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  };

  const startConversation = async (user) => {
    // Convert user ID to integer for backend compatibility
    const userIdInt = uuidToInt(user.user_id);
    
    // Check if conversation already exists
    const existingConv = conversations.find(conv => conv.other_user_id === userIdInt);
    if (existingConv) {
      setSelectedConversation(existingConv);
    } else {
      // Create new conversation by sending a message
      setNewMessage(`Hi ${user.name}! 👋`);
      setSelectedConversation({
        other_user_id: userIdInt,
        other_user_name: user.name,
        last_message: null,
        unread_count: 0
      });
    }
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  if (showSearch) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setShowSearch(false)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Messages
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Start a Conversation</h1>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search for users..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              className="pl-10"
            />
          </div>

          <div className="space-y-2">
            {searchResults.map((user) => (
              <Card key={user.user_id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.circle}</p>
                    </div>
                    <Button
                      onClick={() => startConversation(user)}
                      size="sm"
                    >
                      Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (selectedConversation) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setSelectedConversation(null)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Conversations
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            {selectedConversation.other_user_name}
          </h1>
        </div>

        <Card className="h-96 flex flex-col">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">Loading messages...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.message_id}
                  className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === currentUserId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_id === currentUserId
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
          
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <Button onClick={() => setShowSearch(true)}>
          <MessageCircle className="w-4 h-4 mr-2" />
          New Message
        </Button>
      </div>

      <div className="space-y-4">
        {conversations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
              <p className="text-muted-foreground mb-4">
                Start a conversation with someone from your community!
              </p>
              <Button onClick={() => setShowSearch(true)}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Start Messaging
              </Button>
            </CardContent>
          </Card>
        ) : (
          conversations.map((conversation) => (
            <Card
              key={conversation.other_user_id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedConversation(conversation)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium">{conversation.other_user_name}</h3>
                      {conversation.unread_count > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    {conversation.last_message && (
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message.content}
                      </p>
                    )}
                  </div>
                  {conversation.last_message && (
                    <div className="text-xs text-muted-foreground">
                      {formatTime(conversation.last_message.timestamp)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
