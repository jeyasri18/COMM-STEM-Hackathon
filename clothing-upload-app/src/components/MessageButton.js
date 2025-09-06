import React, { useState } from 'react';
import { Button } from './ui/button';
import { MessageCircle } from 'lucide-react';

export function MessageButton({ 
  itemId, 
  ownerId, 
  ownerName, 
  currentUserId, 
  onMessageClick 
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (onMessageClick) {
      onMessageClick(itemId, ownerId, ownerName);
    }
  };

  if (!currentUserId || currentUserId === ownerId) {
    return null; // Don't show message button for own items or when not logged in
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex items-center space-x-1 transition-all duration-200 hover:bg-primary hover:text-primary-foreground"
    >
      <MessageCircle className={`w-4 h-4 transition-transform ${isHovered ? 'scale-110' : ''}`} />
      <span className="hidden sm:inline">Message</span>
    </Button>
  );
}
