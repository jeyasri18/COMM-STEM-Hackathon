import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function ProfileSection({ onItemMessage }) {
  // Sample user data
  const user = {
    name: "Sarah Johnson",
    email: "sarah@example.com",
    joinDate: "January 2024",
    itemsShared: 12,
    itemsRented: 8,
    rating: 4.8,
    bio: "Fashion enthusiast and sustainability advocate. Love sharing quality pieces with my community!",
    location: "Sydney, Australia"
  };

  const userItems = [
    {
      id: 1,
      title: "Vintage Denim Jacket",
      price: "$25",
      image: "👕",
      status: "Available"
    },
    {
      id: 2,
      title: "Summer Dress",
      price: "$18",
      image: "👗",
      status: "Rented"
    },
    {
      id: 3,
      title: "Leather Boots",
      price: "$35",
      image: "👢",
      status: "Available"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback className="text-2xl">SJ</AvatarFallback>
              </Avatar>
              <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
              <p className="text-muted-foreground">{user.location}</p>
              <div className="flex items-center justify-center space-x-1 mt-2">
                <span className="text-yellow-500">⭐</span>
                <span className="font-semibold">{user.rating}</span>
                <span className="text-muted-foreground">(24 reviews)</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{user.bio}</p>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{user.itemsShared}</div>
                  <div className="text-sm text-muted-foreground">Items Shared</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{user.itemsRented}</div>
                  <div className="text-sm text-muted-foreground">Items Rented</div>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground text-center">
                Member since {user.joinDate}
              </div>
              
              <Button className="w-full">
                Message {user.name}
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* User's Items */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Items by {user.name}</h2>
            <p className="text-muted-foreground">Browse items shared by this user</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {userItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="text-3xl text-center mb-2">{item.image}</div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">{item.price}</span>
                    <Badge 
                      variant={item.status === 'Available' ? 'default' : 'secondary'}
                    >
                      {item.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <Button 
                    className="w-full"
                    onClick={() => onItemMessage(item.id)}
                    disabled={item.status !== 'Available'}
                  >
                    {item.status === 'Available' ? 'Message Owner' : 'Currently Rented'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
