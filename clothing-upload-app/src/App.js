import React, { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { getCurrentUser, supabase } from './lib/supabase';

// Import beautiful UI components
import { HeroSection } from './components/HeroSection';
import { ItemGrid } from './components/ItemGrid';
import { AddItemSection } from './components/AddItemSection';
import { ProfileSection } from './components/ProfileSection';
import { Navigation } from './components/Navigation.js';
import { PublicDashboard } from './components/PublicDashboard';
import { CommunityDashboard } from './components/CommunityDashboard';
import { ProfilePage } from './components/ProfilePage';
import { AuthModal } from './components/AuthModal';
import { AuthRequiredMessage } from './components/AuthRequiredMessage';
import { WelcomeMessage } from './components/WelcomeMessage';
import { Messages } from './components/Messages.js';
import RentalRequests from './components/RentalRequests.js';


function App() {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  
  useEffect(() => {
    async function fetchUser() {
      try {
        const supabaseUser = await getCurrentUser();
        setUser(supabaseUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handleAuthChange = async () => {
    const supabaseUser = await getCurrentUser();
    setUser(supabaseUser);
    setShowAuthModal(false);
    
    if (supabaseUser) {
      // Show welcome message
      setShowWelcomeMessage(true);
      
      // Auto-hide welcome message after 3 seconds
      setTimeout(() => {
        setShowWelcomeMessage(false);
      }, 3000);
      
      // Reload the page to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
    
    console.log('Auth changed:', supabaseUser);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveSection('home');
  };

  const handleSectionChange = (section) => {
    // If user tries to access protected sections without being logged in
    if (!user && section !== 'home') {
      setShowAuthModal(true);
      return;
    }
    setActiveSection(section);
  };

  const handleGetStarted = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setActiveSection('public');
    }
  };

  const handleSignInClick = () => {
    setShowAuthModal(true);
  };

  const handleItemMessage = (itemId, ownerId, ownerName) => {
    // Navigate to messages and start conversation with the owner
    setActiveSection('messages');
    // The Messages component will handle starting the conversation
    console.log('Starting conversation for item:', itemId, 'with owner:', ownerName);
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
    // Show loading state
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <img 
                src="/logo.png" 
                alt="Re:Fit Logo" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case 'home':
        return <HeroSection onGetStarted={handleGetStarted} onSignIn={handleSignInClick} />;
      case 'public':
        return user ? <PublicDashboard onMessageClick={handleItemMessage} /> : <AuthRequiredMessage onSignIn={handleSignInClick} />;
      case 'community':
        return user ? <CommunityDashboard /> : <AuthRequiredMessage onSignIn={handleSignInClick} />;
      case 'profile':
        return user ? <ProfilePage onSignOut={handleSignOut} /> : <AuthRequiredMessage onSignIn={handleSignInClick} />;
      case 'add':
        return user ? <AddItemSection onItemAdded={handleItemAdded} /> : <AuthRequiredMessage onSignIn={handleSignInClick} />;
      case 'favorites':
        return user ? (
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
        ) : <AuthRequiredMessage onSignIn={handleSignInClick} />;
      case 'messages':
        return user ? <Messages currentUserId={user.id} user={user} onBack={() => setActiveSection('home')} /> : <AuthRequiredMessage onSignIn={handleSignInClick} />;
      case 'rentals':
        return user ? <RentalRequests user={user} /> : <AuthRequiredMessage onSignIn={handleSignInClick} />;
      default:
        return <HeroSection onGetStarted={handleGetStarted} onSignIn={handleSignInClick} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        activeSection={activeSection} 
        onSectionChange={handleSectionChange}
        user={user}
        onSignOut={handleSignOut}
        onAuth={handleAuthChange}
        onSignIn={handleSignInClick}
      />
      <main className={activeSection !== 'home' ? 'pt-20 md:pt-24 pb-20 md:pb-8' : ''}>
        {renderContent()}
      </main>
      
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          onAuth={handleAuthChange} 
          onClose={() => setShowAuthModal(false)} 
        />
      )}
      
      {/* Welcome Message */}
      {showWelcomeMessage && (
        <WelcomeMessage onClose={() => setShowWelcomeMessage(false)} />
      )}
      
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