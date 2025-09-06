import React from 'react';
import { Heart, MessageCircle, User, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

function ItemCard({ 
  id, 
  title, 
  description, 
  owner, 
  isLiked, 
  likes = 0, 
  onLike, 
  onMessage, 
  onViewProfile,
  image = null 
}) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {image ? (
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">👕</div>
              <div className="text-sm">No Image</div>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 w-8 h-8 p-0 bg-white/80 hover:bg-white"
          onClick={onLike}
        >
          <Heart 
            className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
          />
        </Button>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-foreground line-clamp-1">{title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {description}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto text-muted-foreground hover:text-foreground"
                onClick={onViewProfile}
              >
                <User className="w-3 h-3 mr-1" />
                <span className="text-xs">{owner}</span>
              </Button>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-muted-foreground">4.8</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-muted-foreground">{likes}</span>
            </div>
          </div>
          
          <Button 
            className="w-full" 
            size="sm"
            onClick={onMessage}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Message Owner
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ItemCard;
