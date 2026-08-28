import { ImageWithFallback } from './figma/ImageWithFallback';
import { Button } from './ui/button';
import heroImage from 'figma:asset/8991c83627455e39591135326232e14033eebd0e.png';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-400 via-lime-300 to-yellow-200 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/5"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl text-black leading-tight">
                Hand Me Up!
              </h1>
              
              <div className="space-y-4 text-black/80">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full border-2 border-black flex items-center justify-center">
                    <span className="text-xs">↻</span>
                  </div>
                  <p className="text-lg">Support your closet</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full border-2 border-black flex items-center justify-center">
                    <span className="text-xs">↻</span>
                  </div>
                  <p className="text-lg">Support your community</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full border-2 border-black flex items-center justify-center">
                    <span className="text-xs">↻</span>
                  </div>
                  <p className="text-lg">Support the environment</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-black/70 text-lg max-w-md">
                Share, rent, and discover amazing pieces from wardrobes in your community. 
                Sustainable fashion starts with you.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={onGetStarted}
                  className="bg-black text-white hover:bg-gray-800 px-8 py-3 text-lg"
                >
                  Start Exploring
                </Button>
                <Button 
                  variant="outline" 
                  className="border-black text-black hover:bg-black hover:text-white px-8 py-3 text-lg"
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <ImageWithFallback 
                src={heroImage}
                alt="Two people in colorful sustainable fashion"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            
            {/* Floating stats */}
            <div className="absolute -top-4 -left-4 bg-white rounded-2xl p-4 shadow-lg">
              <div className="text-center">
                <div className="text-2xl text-black">2.4k+</div>
                <div className="text-sm text-gray-600">Items shared</div>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl p-4 shadow-lg">
              <div className="text-center">
                <div className="text-2xl text-black">890+</div>
                <div className="text-sm text-gray-600">Community members</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}