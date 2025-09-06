import React from 'react';
import { Button } from './ui/button';
import { VerticalCarousel } from './VerticalCarousel';

export function HeroSection({ onGetStarted, onSignIn }) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="mb-0">
                <div className="flex items-center gap-2 mb-0">
                  <img 
                    src="/logo.png" 
                    alt="Re:Fit Logo" 
                    className="w-96 h-96 object-contain"
                  />
                </div>
                <div className="text-xl text-muted-foreground font-medium -mt-16">
                  Sustainable Fashion Platform
                </div>
              </div>
              
              <div className="space-y-4 text-foreground/80">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full border-2 border-foreground flex items-center justify-center">
                    <span className="text-xs">↻</span>
                  </div>
                  <p className="text-lg">Support your closet</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full border-2 border-foreground flex items-center justify-center">
                    <span className="text-xs">↻</span>
                  </div>
                  <p className="text-lg">Support your community</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full border-2 border-foreground flex items-center justify-center">
                    <span className="text-xs">↻</span>
                  </div>
                  <p className="text-lg">Support the environment</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-foreground/70 text-lg max-w-md">
                Share, rent, and discover amazing pieces from wardrobes in your community. 
                Sustainable fashion starts with you.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={onGetStarted}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 text-lg"
                >
                  Start Exploring
                </Button>
                <Button 
                  variant="outline" 
                  className="border-foreground text-foreground hover:bg-foreground hover:text-background px-8 py-3 text-lg"
                  onClick={onSignIn || (() => console.log('Sign in clicked'))}
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
          
          <div className="relative">
            {/* Vertical Carousel */}
            <div className="rounded-3xl p-6">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-foreground mb-2">Something new for you</h2>
                <p className="text-muted-foreground">Discover amazing pieces from your community</p>
              </div>
              
              <VerticalCarousel />
            </div>
            
            {/* Floating stats */}
            <div className="absolute -top-4 -left-4 bg-card rounded-2xl p-4 shadow-lg">
              <div className="text-center">
                <div className="text-2xl text-foreground">2.4k+</div>
                <div className="text-sm text-muted-foreground">Items shared</div>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -right-4 bg-card rounded-2xl p-4 shadow-lg">
              <div className="text-center">
                <div className="text-2xl text-foreground">890+</div>
                <div className="text-sm text-muted-foreground">Community members</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
