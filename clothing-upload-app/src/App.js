import React, { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { getCurrentUser, supabase } from './lib/supabase';

// Import beautiful UI components
import { HeroSection } from './components/HeroSection';
import { AddItemSection } from './components/AddItemSection';
import { Navigation } from './components/Navigation.js';
import { PublicDashboard } from './components/PublicDashboard';
import { CommunityDashboard } from './components/CommunityDashboard';
import { ProfilePage } from './components/ProfilePage';
import { AuthModal } from './components/AuthModal';
import { AuthRequiredMessage } from './components/AuthRequiredMessage';
import { WelcomeMessage } from './components/WelcomeMessage';
import { Messages } from './components/Messages.js';
import RentalRequests from './components/RentalRequests.js';
import { Favorites } from './components/Favorites.js';


function App() {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [favoriteMessage, setFavoriteMessage] = useState('');
  
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

  const handleItemAdded = () => {
    // This would refresh the listings
    console.log('Item added successfully');
    setActiveSection('browse');
  };

  const toggleFavorite = (itemId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(itemId)) {
        newFavorites.delete(itemId);
        setFavoriteMessage('Removed from favorites');
        console.log('Removed from favorites:', itemId);
      } else {
        newFavorites.add(itemId);
        setFavoriteMessage('Added to favorites!');
        console.log('Added to favorites:', itemId);
      }
      
      // Clear message after 2 seconds
      setTimeout(() => setFavoriteMessage(''), 2000);
      
      return newFavorites;
    });
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
        return <HeroSection onGetStarted={handleGetStarted} onSignIn={user ? null : handleSignInClick} />;
      case 'public':
        return user ? (
          <PublicDashboard 
            onMessageClick={handleItemMessage} 
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        ) : <AuthRequiredMessage onSignIn={handleSignInClick} />;
      case 'community':
        return user ? <CommunityDashboard /> : <AuthRequiredMessage onSignIn={handleSignInClick} />;
      case 'profile':
        return user ? <ProfilePage onSignOut={handleSignOut} /> : <AuthRequiredMessage onSignIn={handleSignInClick} />;
      case 'add':
        return user ? <AddItemSection onItemAdded={handleItemAdded} /> : <AuthRequiredMessage onSignIn={handleSignInClick} />;
      case 'favorites':
        return user ? (
          <Favorites 
            favorites={favorites} 
            onToggleFavorite={toggleFavorite}
          />
        ) : <AuthRequiredMessage onSignIn={handleSignInClick} />;
      case 'messages':
        return user ? <Messages currentUserId={user.id} user={user} onBack={() => setActiveSection('home')} /> : <AuthRequiredMessage onSignIn={handleSignInClick} />;
      case 'rentals':
        return user ? <RentalRequests user={user} /> : <AuthRequiredMessage onSignIn={handleSignInClick} />;
      default:
        return <HeroSection onGetStarted={handleGetStarted} onSignIn={user ? null : handleSignInClick} />;
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

      {/* Favorite Success Message */}
      {favoriteMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300">
          {favoriteMessage}
        </div>
      )}
    </div>
  );
}

export default App;