import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { HeroSection } from './components/HeroSection';
import { ItemGrid } from './components/ItemGrid';
import { ProfileSection } from './components/ProfileSection';
import { AddItemSection } from './components/AddItemSection';
import { CommunitiesSection } from './components/CommunitiesSection';
import { toast } from 'sonner@2.0.3';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [activeSection, setActiveSection] = useState('home');

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const handleGetStarted = () => {
    setActiveSection('browse');
  };

  const handleItemMessage = (itemId: string) => {
    toast.success('Message sent! The owner will get back to you soon.');
  };

  const handleProfileView = (profileId: string) => {
    toast.info('Profile view - this would navigate to the user\'s profile in a full app');
  };

  const handleItemAdded = () => {
    toast.success('Item listed successfully! Your piece is now available for others to discover.');
    setActiveSection('browse');
  };

  const handleJoinCommunity = (communityId: string) => {
    toast.success('Welcome to the community! You can now see exclusive posts and connect with members.');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return <HeroSection onGetStarted={handleGetStarted} />;
      case 'browse':
        return <ItemGrid onItemMessage={handleItemMessage} onProfileView={handleProfileView} />;
      case 'profile':
        return <ProfileSection onItemMessage={handleItemMessage} />;
      case 'add':
        return <AddItemSection onItemAdded={handleItemAdded} />;
      case 'communities':
        return <CommunitiesSection onJoinCommunity={handleJoinCommunity} />;
      case 'favorites':
        return (
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-foreground text-2xl">💚</span>
              </div>
              <h1 className="text-2xl text-foreground mb-2">Your Favorites</h1>
              <p className="text-muted-foreground mb-8">Items you've loved will appear here</p>
              <button 
                onClick={() => setActiveSection('browse')}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Discover Items
              </button>
            </div>
          </div>
        );
      default:
        return <HeroSection onGetStarted={handleGetStarted} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeSection={activeSection} onSectionChange={handleSectionChange} />
      
      <main className={activeSection !== 'home' ? 'pt-20 md:pt-24 pb-20 md:pb-8' : ''}>
        {renderContent()}
      </main>
      
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#000000',
            border: '1px solid #e5e7eb',
          },
        }}
      />
    </div>
  );
}