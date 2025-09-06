import { Heart, MessageCircle, Star, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ItemCardProps {
  id: string;
  image: string;
  title: string;
  description: string;
  price?: number;
  isFree?: boolean;
  isLiked: boolean;
  likes: number;
  owner: {
    name: string;
    avatar?: string;
    rating: number;
  };
  size: string;
  condition: string;
  onLike: (id: string) => void;
  onMessage: (id: string) => void;
  onViewProfile: (id: string) => void;
}

export function ItemCard({
  id,
  image,
  title,
  description,
  price,
  isFree,
  isLiked,
  likes,
  owner,
  size,
  condition,
  onLike,
  onMessage,
  onViewProfile
}: ItemCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group">
      <div className="relative aspect-square overflow-hidden">
        <ImageWithFallback 
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        <div className="absolute top-3 left-3">
          {isFree ? (
            <Badge className="bg-accent text-accent-foreground hover:bg-accent/90">
              Free
            </Badge>
          ) : (
            <Badge className="bg-primary text-primary-foreground">
              ${price}/day
            </Badge>
          )}
        </div>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onLike(id)}
          className={`absolute top-3 right-3 w-8 h-8 p-0 rounded-full ${
            isLiked 
              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
              : 'bg-white/90 text-gray-600 hover:bg-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
        </Button>
        
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <Badge variant="secondary" className="bg-white/90 text-black">
            {condition}
          </Badge>
          <Badge variant="secondary" className="bg-white/90 text-black">
            Size {size}
          </Badge>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-black mb-1">{title}</h3>
          <p className="text-gray-600 text-sm line-clamp-2">{description}</p>
        </div>
        
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
            onClick={() => onViewProfile(id)}
          >
            <Avatar className="w-6 h-6">
              <AvatarImage src={owner.avatar} />
              <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                {owner.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600">{owner.name}</span>
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
              <span className="text-xs text-gray-500">{owner.rating}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 text-gray-500">
            <Heart className="w-4 h-4" />
            <span className="text-sm">{likes}</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onMessage(id)}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Request
          </Button>
          {!isFree && (
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50"
              onClick={() => onMessage(id)}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Rent
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}