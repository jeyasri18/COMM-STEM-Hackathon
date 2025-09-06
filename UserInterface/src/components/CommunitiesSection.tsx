import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Search, Users, Plus, MapPin, Star, Sparkles } from 'lucide-react';

interface CommunitiesSectionProps {
  onJoinCommunity: (id: string) => void;
}

export function CommunitiesSection({ onJoinCommunity }: CommunitiesSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [joinedCommunities, setJoinedCommunities] = useState<Set<string>>(new Set(['1', '3']));

  const communities = [
    {
      id: '1',
      name: 'SF Style Swap',
      description: 'San Francisco fashion lovers sharing and swapping trendy pieces',
      members: 1247,
      location: 'San Francisco, CA',
      image: 'https://images.unsplash.com/photo-1614765254651-431998232486?w=150',
      tags: ['Local', 'Trendy', 'Swapping'],
      featured: true,
      recentActivity: '15 new items today'
    },
    {
      id: '2',
      name: 'Vintage Vibes',
      description: 'Curated vintage clothing from all eras. Authenticity verified.',
      members: 892,
      location: 'Online',
      image: 'https://images.unsplash.com/photo-1652796374179-224cba07d78e?w=150',
      tags: ['Vintage', 'Authentic', 'Retro'],
      featured: false,
      recentActivity: '8 new items today'
    },
    {
      id: '3',
      name: 'Size Small Squad',
      description: 'Perfect fits for petite fashion lovers. XS-S sizes only.',
      members: 456,
      location: 'Online',
      image: 'https://images.unsplash.com/photo-1608739872077-21ddc15dc152?w=150',
      tags: ['Size S', 'Petite', 'Inclusive'],
      featured: false,
      recentActivity: '12 new items today'
    },
    {
      id: '4',
      name: 'Sustainable Fashion Hub',
      description: 'Eco-conscious fashion sharing. Only sustainable and ethical brands.',
      members: 2156,
      location: 'Global',
      image: 'https://images.unsplash.com/photo-1660486044177-45cd45bb5e99?w=150',
      tags: ['Sustainable', 'Eco-friendly', 'Ethical'],
      featured: true,
      recentActivity: '23 new items today'
    },
    {
      id: '5',
      name: 'College Campus Closet',
      description: 'Students sharing affordable fashion. Budget-friendly options.',
      members: 678,
      location: 'UC Berkeley',
      image: 'https://images.unsplash.com/photo-1614765254651-431998232486?w=150',
      tags: ['Student', 'Budget', 'Campus'],
      featured: false,
      recentActivity: '6 new items today'
    },
    {
      id: '6',
      name: 'Designer Deals',
      description: 'High-end designer pieces at accessible rental prices.',
      members: 334,
      location: 'Online',
      image: 'https://images.unsplash.com/photo-1652796374179-224cba07d78e?w=150',
      tags: ['Designer', 'Luxury', 'Special Occasions'],
      featured: true,
      recentActivity: '4 new items today'
    }
  ];

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const featuredCommunities = filteredCommunities.filter(c => c.featured);
  const otherCommunities = filteredCommunities.filter(c => !c.featured);

  const handleJoinToggle = (id: string) => {
    setJoinedCommunities(prev => {
      const newJoined = new Set(prev);
      if (newJoined.has(id)) {
        newJoined.delete(id);
      } else {
        newJoined.add(id);
      }
      return newJoined;
    });
    onJoinCommunity(id);
  };

  const CommunityCard = ({ community }: { community: typeof communities[0] }) => {
    const isJoined = joinedCommunities.has(community.id);
    
    return (
      <Card className="hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={community.image} />
              <AvatarFallback className="bg-lime-100 text-black">
                {community.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg text-black mb-1 flex items-center gap-2">
                    {community.name}
                    {community.featured && (
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                    )}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {community.members.toLocaleString()} members
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {community.location}
                    </div>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => handleJoinToggle(community.id)}
                  className={
                    isJoined
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-lime-400 text-black hover:bg-lime-500'
                  }
                >
                  {isJoined ? 'Joined' : 'Join'}
                </Button>
              </div>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {community.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {community.tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="text-xs bg-gray-50 text-gray-600 border-gray-200"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <span className="text-xs text-lime-600">
                  {community.recentActivity}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-black mb-2">Communities</h1>
        <p className="text-gray-600">Find your fashion tribe and connect with like-minded style enthusiasts</p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50 border-0"
          />
        </div>
      </div>

      {/* My Communities */}
      {joinedCommunities.size > 0 && (
        <div className="mb-8">
          <h2 className="text-xl text-black mb-4">My Communities</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {communities
              .filter(c => joinedCommunities.has(c.id))
              .map(community => (
                <CommunityCard key={community.id} community={community} />
              ))}
          </div>
        </div>
      )}

      {/* Featured Communities */}
      {featuredCommunities.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl text-black mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Featured Communities
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featuredCommunities.map(community => (
              <CommunityCard key={community.id} community={community} />
            ))}
          </div>
        </div>
      )}

      {/* All Communities */}
      {otherCommunities.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl text-black mb-4">Discover More</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {otherCommunities.map(community => (
              <CommunityCard key={community.id} community={community} />
            ))}
          </div>
        </div>
      )}

      {/* Create Community CTA */}
      <Card className="bg-gradient-to-r from-lime-50 to-yellow-50 border-lime-200">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl text-black mb-2">Can't find the perfect community?</h3>
          <p className="text-gray-600 mb-4">Create your own and bring together people who share your style!</p>
          <Button className="bg-lime-400 text-black hover:bg-lime-500">
            <Plus className="w-4 h-4 mr-2" />
            Create Community
          </Button>
        </CardContent>
      </Card>

      {filteredCommunities.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg text-gray-600 mb-2">No communities found</h3>
          <p className="text-gray-500">Try a different search term or create a new community</p>
        </div>
      )}
    </div>
  );
}