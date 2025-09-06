import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function CommunitiesSection({ onJoinCommunity }) {
  const communities = [
    {
      id: 1,
      name: "USYD Fashion Circle",
      description: "University of Sydney students sharing sustainable fashion",
      members: 245,
      items: 89,
      category: "University",
      image: "🎓"
    },
    {
      id: 2,
      name: "Sydney Sustainable Style",
      description: "Eco-conscious fashion enthusiasts in Sydney",
      members: 156,
      items: 67,
      category: "Local",
      image: "🌱"
    },
    {
      id: 3,
      name: "Vintage Lovers",
      description: "Sharing and discovering vintage fashion pieces",
      members: 89,
      items: 34,
      category: "Interest",
      image: "👗"
    },
    {
      id: 4,
      name: "Designer Exchange",
      description: "High-end fashion sharing community",
      members: 67,
      items: 23,
      category: "Luxury",
      image: "💎"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Communities</h1>
        <p className="text-muted-foreground">Join fashion communities and connect with like-minded people</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
        {communities.map((community) => (
          <Card key={community.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{community.image}</div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{community.name}</h3>
                    <Badge variant="outline" className="mt-1">{community.category}</Badge>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground mt-3">{community.description}</p>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{community.members}</div>
                  <div className="text-sm text-muted-foreground">Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{community.items}</div>
                  <div className="text-sm text-muted-foreground">Items</div>
                </div>
              </div>
              
              <Button 
                className="w-full"
                onClick={() => onJoinCommunity(community.id)}
              >
                Join Community
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-12 text-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-4xl mb-4">➕</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Create Your Own Community</h3>
            <p className="text-muted-foreground mb-4">
              Start a community for your school, workplace, or neighborhood
            </p>
            <Button variant="outline">
              Create Community
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
