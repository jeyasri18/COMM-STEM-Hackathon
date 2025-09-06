import React, { useState } from 'react';
import { Button } from './ui/button';
import { AuthModal } from './AuthModal';
import { Home, Search, Globe, Users, User, Plus, Heart, MessageCircle, Calendar } from 'lucide-react';

export function Navigation({ activeSection, onSectionChange, user, onSignOut, onAuth }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'public', label: 'Public', icon: Globe },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'rentals', label: 'Rentals', icon: Calendar },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'add', label: 'Add Item', icon: Plus },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Re:Fit Logo" 
                className="w-8 h-8 object-contain"
              />
              <div className="text-xl font-bold text-primary">Re:Fit</div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              {navItems.map(({ id, icon: Icon, label }) => (
                <Button
                  key={id}
                  variant={activeSection === id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onSectionChange(id)}
                  className={`flex items-center space-x-2 ${
                    activeSection === id 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{label}</span>
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Welcome, {user.user_metadata?.full_name || user.email}
                </span>
                <Button variant="outline" size="sm" onClick={onSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowAuthModal(true)}>
                  Sign In
                </Button>
                <Button size="sm" onClick={() => setShowAuthModal(true)}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {showAuthModal && (
        <AuthModal 
          onAuth={onAuth || (() => console.log('Auth successful'))}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </nav>
  );
}
