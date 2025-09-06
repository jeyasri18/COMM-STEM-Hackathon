import React, { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { getCurrentUser, supabase } from './lib/supabase';

// Import beautiful UI components
import { HeroSection } from './components/HeroSection';
import { ItemGrid } from './components/ItemGrid';
import { AddItemSection } from './components/AddItemSection';
import { ProfileSection } from './components/ProfileSection';
import { Navigation } from './components/Navigation';
import { PublicDashboard } from './components/PublicDashboard';
import { CommunityDashboard } from './components/CommunityDashboard';
import { ProfilePage } from './components/ProfilePage';


function App() {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('home');
  
  useEffect(() => {
    async function fetchUser() {
      const supabaseUser = await getCurrentUser();
      setUser(supabaseUser);
    }
    fetchUser();
  }, []);

  const handleAuthChange = async () => {
    const supabaseUser = await getCurrentUser();
    setUser(supabaseUser);
    console.log('Auth changed:', supabaseUser);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const handleGetStarted = () => {
    setActiveSection('public');
  };

  const handleItemMessage = (itemId) => {
    // This would integrate with your messaging system
    console.log('Message sent for item:', itemId);
  };

  const handleProfileView = (profileId) => {
    // This would navigate to the user's profile
    console.log('View profile:', profileId);
  };

  const handleItemAdded = () => {
    // This would refresh the listings
    console.log('Item added successfully');
    setActiveSection('browse');
  };


  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return <HeroSection onGetStarted={handleGetStarted} onSignIn={handleAuthChange} />;
      case 'public':
        return <PublicDashboard />;
      case 'community':
        return <CommunityDashboard />;
      case 'profile':
        return <ProfilePage onSignOut={handleSignOut} />;
      case 'add':
        return <AddItemSection onItemAdded={handleItemAdded} />;
      case 'favorites':
        return (
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <img 
                  src="/logo.png" 
                  alt="Re:Fit Logo" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <h1 className="text-2xl text-foreground mb-2">Your Favorites</h1>
              <p className="text-muted-foreground mb-8">Items you've loved will appear here</p>
              <button 
                onClick={() => setActiveSection('public')}
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

  // If user is not authenticated, show the beautiful landing page
  if (!user) {
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

  // If user is authenticated, show the beautiful UI with enhanced navigation
  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        activeSection={activeSection} 
        onSectionChange={handleSectionChange}
        user={user}
        onSignOut={handleSignOut}
        onAuth={handleAuthChange}
      />
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

export default App;