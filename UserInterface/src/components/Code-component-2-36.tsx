import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Settings, MapPin, Star, Users, Heart, Plus, Share, MessageCircle } from 'lucide-react';
import { ItemCard } from './ItemCard';

interface ProfileSectionProps {
  onItemMessage: (id: string) => void;
}

export function ProfileSection({ onItemMessage }: ProfileSectionProps) {
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set(['1', '3']));
  
  // Mock user data
  const user = {
    name: 'Maya Chen',
    username: '@mayastyle',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150',
    location: 'San Francisco, CA',
    rating: 4.8,
    totalRatings: 127,
    joinedDate: 'March 2023',
    bio: 'Sustainable fashion lover 🌱 | Size S-M | Always up for clothing swaps! | DM me for styling tips ✨',
    followers: 456,
    following: 234,
    itemsShared: 28,
    communities: ['SF Style Swap', 'Vintage Lovers', 'Size Small Squad']
  };

  // Mock user's items
  const userItems = [
    {
      id: 'u1',
      image: 'https://images.unsplash.com/photo-1614765254651-431998232486?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmVuZHklMjBjbG90aGluZyUyMGZhc2hpb24lMjB5b3VuZ3xlbnwxfHx8fDE3NTcxNDMzOTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
      title: 'Cozy Oversized Cardigan',
      description: 'Perfect for chilly evenings and coffee dates!',
      isFree: true,
      likes: 12,
      owner: user,
      size: 'M',
      condition: 'Like New'
    },
    {
      id: 'u2',
      image: 'https://images.unsplash.com/photo-1652796374179-224cba07d78e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJsZSUyMGZhc2hpb24lMjB2aW50YWdlJTIwY2xvdGhlc3xlbnwxfHx8fDE3NTcxMzI3ODR8MA&ixlib=rb-4.1.0&q=80&w=1080',
      title: 'Vintage Silk Blouse',
      description: 'Elegant piece perfect for work or dinner dates.',
      price: 18,
      isFree: false,
      likes: 24,
      owner: user,
      size: 'S',
      condition: 'Excellent'
    }
  ];

  const handleLike = (id: string) => {
    setLikedItems(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(id)) {
        newLiked.delete(id);
      } else {
        newLiked.add(id);
      }
      return newLiked;
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar className="w-24 h-24">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-lime-100 text-black text-2xl">
              {user.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-2xl text-black mb-1">{user.name}</h1>
              <p className="text-gray-600">{user.username}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {user.location}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  {user.rating} ({user.totalRatings} reviews)
                </div>
              </div>
            </div>
            
            <p className="text-gray-700">{user.bio}</p>
            
            <div className="flex flex-wrap gap-3">
              <div className="text-center">
                <div className="text-lg text-black">{user.followers}</div>
                <div className="text-sm text-gray-500">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-lg text-black">{user.following}</div>
                <div className="text-sm text-gray-500">Following</div>
              </div>
              <div className="text-center">
                <div className="text-lg text-black">{user.itemsShared}</div>
                <div className="text-sm text-gray-500">Items Shared</div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Communities */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Communities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {user.communities.map((community, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="bg-lime-50 text-lime-700 border-lime-200 hover:bg-lime-100 cursor-pointer"
              >
                {community}
              </Badge>
            ))}
            <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Join More
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="items" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            My Items ({userItems.length})
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Favorites ({likedItems.size})
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Reviews ({user.totalRatings})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl text-black">My Wardrobe</h2>
            <Button className="bg-lime-400 text-black hover:bg-lime-500">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userItems.map((item) => (
              <ItemCard
                key={item.id}
                id={item.id}
                image={item.image}
                title={item.title}
                description={item.description}
                price={item.price}
                isFree={item.isFree}
                isLiked={likedItems.has(item.id)}
                likes={item.likes}
                owner={item.owner}
                size={item.size}
                condition={item.condition}
                onLike={handleLike}
                onMessage={onItemMessage}
                onViewProfile={() => {}}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-6">
          <h2 className="text-xl text-black">Favorites</h2>
          <div className="text-center py-12 text-gray-500">
            <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Your favorite items will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <h2 className="text-xl text-black">Reviews & Ratings</h2>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-lime-100 text-black text-sm">E</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-black">Emma</span>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-3 h-3 text-yellow-500 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    "Maya's jacket was in perfect condition and she was so easy to communicate with! Definitely renting from her again."
                  </p>
                  <span className="text-xs text-gray-400">2 days ago</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}