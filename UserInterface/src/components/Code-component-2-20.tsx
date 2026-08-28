import { Heart, Search, User, Home, Users, Plus } from 'lucide-react';
import { Button } from './ui/button';

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Navigation({ activeSection, onSectionChange }: NavigationProps) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'browse', icon: Search, label: 'Browse' },
    { id: 'add', icon: Plus, label: 'Add Item' },
    { id: 'communities', icon: Users, label: 'Communities' },
    { id: 'favorites', icon: Heart, label: 'Favorites' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-lime-400 rounded-full flex items-center justify-center">
              <span className="text-black text-sm">↻</span>
            </div>
            <h1 className="text-xl text-black">Hand Me Up!</h1>
          </div>
          
          <div className="flex items-center space-x-6">
            {navItems.map(({ id, icon: Icon, label }) => (
              <Button
                key={id}
                variant={activeSection === id ? "default" : "ghost"}
                size="sm"
                onClick={() => onSectionChange(id)}
                className={`flex items-center space-x-2 ${
                  activeSection === id 
                    ? 'bg-lime-400 text-black hover:bg-lime-500' 
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden lg:inline">{label}</span>
              </Button>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ id, icon: Icon }) => (
            <Button
              key={id}
              variant="ghost"
              size="sm"
              onClick={() => onSectionChange(id)}
              className={`flex flex-col items-center space-y-1 p-3 ${
                activeSection === id 
                  ? 'text-lime-600' 
                  : 'text-gray-500'
              }`}
            >
              <Icon className="w-5 h-5" />
            </Button>
          ))}
        </div>
      </nav>
    </>
  );
}