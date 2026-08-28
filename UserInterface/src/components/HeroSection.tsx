import { ImageWithFallback } from './figma/ImageWithFallback';
import { Button } from './ui/button';
import { VerticalCarousel } from './VerticalCarousel';
import logoImage from 'figma:asset/c3a652e8377a14e2c93b7834b9038a8110c17318.png';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="mb-8">
                <ImageWithFallback 
                  src={logoImage}
                  alt="Re:Fit Logo"
                  className="h-12 md:h-16 object-contain"
                />
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
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden">
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