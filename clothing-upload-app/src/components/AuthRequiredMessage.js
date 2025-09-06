import React from 'react';
import { Button } from './ui/button';

export function AuthRequiredMessage({ onSignIn }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md mx-auto text-center px-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <img 
            src="/logo.png" 
            alt="Re:Fit Logo" 
            className="w-10 h-10 object-contain"
          />
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Sign In Required
        </h1>
        
        <p className="text-muted-foreground mb-8 text-lg">
          Please sign in to access this feature and start exploring sustainable fashion with your community.
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={onSignIn}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 text-lg"
          >
            Sign In / Sign Up
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Join our community of eco-conscious fashion lovers
          </p>
        </div>
      </div>
    </div>
  );
}
