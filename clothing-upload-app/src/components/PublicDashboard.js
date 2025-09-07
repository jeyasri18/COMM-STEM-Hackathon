import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { MessageButton } from './MessageButton';
import RatingDisplay from './RatingDisplay';
import RatingForm from './RatingForm';
import { RentalModal } from './RentalModal';
import { PaymentModal } from './PaymentModal';
import { useClothingRatings, useUserRatings } from '../hooks/useRatings';
import { supabase, getCurrentUser } from '../lib/supabase';
import { api } from '../lib/api';
import { Heart, MessageCircle } from 'lucide-react';

export function PublicDashboard({ onMessageClick, favorites, onToggleFavorite }) {
  const [clothing, setClothing] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [rentStatus, setRentStatus] = useState('');
  const [user, setUser] = useState(null);
  const [rentalModalOpen, setRentalModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [backendListings, setBackendListings] = useState([]);
  const [backendUser, setBackendUser] = useState(null);
  const [showRatingForm, setShowRatingForm] = useState(null);
  const [ratingFormType, setRatingFormType] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      // Fetch backend data
      try {
        // Get backend listings
        const listingsResponse = await api.getListings();
        setBackendListings(listingsResponse.data || []);
        
        // Create or get backend user
        if (currentUser) {
          // Convert UUID to a consistent integer for backend
          const uuidToInt = (uuid) => {
            let hash = 0;
            for (let i = 0; i < uuid.length; i++) {
              const char = uuid.charCodeAt(i);
              hash = ((hash << 5) - hash) + char;
              hash = hash & hash; // Convert to 32-bit integer
            }
            return Math.abs(hash) % 1000000; // Keep it reasonable
          };
          
          const userIdInt = uuidToInt(currentUser.id);
          
          try {
            const userResponse = await api.getUser(userIdInt);
            setBackendUser(userResponse.data);
          } catch (error) {
            // User doesn't exist in backend, create them
            try {
              const createResponse = await api.createUser({
                name: currentUser.user_metadata?.full_name || currentUser.email,
                circle: 'USYD'
              });
              setBackendUser(createResponse.data);
            } catch (createError) {
              console.error('Failed to create backend user:', createError);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch backend data:', error);
      }
      
      // Get all public clothing items from Supabase
      const { data: clothingData } = await supabase
        .from('clothing')
        .select('*')
        .eq('visibility', 'public');
      setClothing(clothingData || []);
      
      // Get all unique user_ids
      const userIds = [...new Set((clothingData || []).map(item => item.user_id).filter(Boolean))];
      // Fetch user_profiles for those user_ids
      let profilesMap = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('user_profiles')
          .select('user_id, display_name')
          .in('user_id', userIds);
        profilesMap = (profilesData || []).reduce((acc, p) => {
          acc[p.user_id] = p.display_name;
          return acc;
        }, {});
      }
      setProfiles(profilesMap);
      
      // Fetch connections for current user
      if (currentUser) {
        const { data: connData } = await supabase
          .from('connections')
          .select('connected_user_id, status')
          .eq('user_id', currentUser.id);
        setConnections((connData || []).filter(c => c.status === 'accepted').map(c => c.connected_user_id));
        setPendingRequests((connData || []).filter(c => c.status === 'pending').map(c => c.connected_user_id));
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Group clothing by user_id
  const clothingByUser = clothing.reduce((acc, item) => {
    if (!acc[item.user_id]) acc[item.user_id] = [];
    acc[item.user_id].push(item);
    return acc;
  }, {});

  // Get unique user_ids
  const userIds = Object.keys(clothingByUser);

  const handleRent = async (item) => {
    if (!user) {
      alert('Please sign in to rent items');
      return;
    }

    setSelectedItem(item);
    setRentalModalOpen(true);
  };

  const handleRentalRequested = (rentalData) => {
    console.log('Rental request created:', rentalData);
    // You can add additional logic here, like updating the UI
    setRentalModalOpen(false);
    setSelectedItem(null);
  };

  const handlePayment = (item) => {
    setSelectedItem(item);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    console.log('Payment successful:', paymentData);
    setPaymentModalOpen(false);
    setSelectedItem(null);
    setRentStatus('Payment successful! Rental request sent.');
    setTimeout(() => setRentStatus(null), 5000);
  };

  const handleConnect = async (otherUserId) => {
    if (!user) return;
    await supabase
      .from('connections')
      .upsert({ user_id: user.id, connected_user_id: otherUserId, status: 'pending' });
    setPendingRequests(prev => [...prev, otherUserId]);
  };

  const handleRateItem = (itemId, itemTitle) => {
    if (!user) {
      alert('Please sign in to rate items');
      return;
    }
    setShowRatingForm(itemId);
    setRatingFormType('clothing');
  };

  const handleRateUser = (userId, userName) => {
    if (!user) {
      alert('Please sign in to rate users');
      return;
    }
    setShowRatingForm(userId);
    setRatingFormType('user');
  };

  const handleRatingSuccess = () => {
    // Refresh the page to show updated ratings
    window.location.reload();
  };

  // Component for user profile section with ratings
  const UserProfileSection = ({ 
    userId, 
    displayName, 
    isSelf, 
    isConnected, 
    isPending, 
    clothingItems, 
    onConnect, 
    onRateUser, 
    onRateItem,
    handleRent,
    onMessageClick,
    currentUserId,
    onPayment
  }) => {
    const { stats: userStats } = useUserRatings(userId);
    
    return (
      <div className="mb-8">
        {/* User Header Section */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-foreground" style={{ marginLeft: '0px' }}>{displayName}</h3>
            <p className="text-muted-foreground text-sm" style={{ marginLeft: '0px' }}>Listings</p>
            
            {/* User Rating Display */}
            <div className="mt-2 p-3 bg-gray-50 rounded-lg max-w-md">
              <RatingDisplay
                averageRating={userStats.average_rating}
                totalRatings={userStats.total_ratings}
                reliability={userStats.reliability}
                communication={userStats.communication}
                care={userStats.care}
                showDetails={true}
                size="sm"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            {!isSelf && !isConnected && !isPending && (
              <Button 
                size="sm" 
                onClick={() => onConnect(userId)}
                className="bg-green-600 hover:bg-green-700"
              >
                Connect
              </Button>
            )}
            {!isSelf && isPending && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Request Sent
              </Badge>
            )}
            {!isSelf && isConnected && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Connected
              </Badge>
            )}
            {!isSelf && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onRateUser(userId, displayName)}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                Rate User
              </Button>
            )}
          </div>
        </div>
        
        {/* Items Grid - Aligned with user name */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clothingItems.map((item, index) => (
            <div key={item.id} style={{ marginLeft: index === 0 ? '52px' : '0px' }}>
              <ClothingItemCard 
                item={item}
                displayName={displayName}
                userId={userId}
                isSelf={isSelf}
                isConnected={isConnected}
                isPending={isPending}
                handleRent={handleRent}
                onMessageClick={onMessageClick}
                currentUserId={currentUserId}
                onRateItem={onRateItem}
                onPayment={onPayment}
                onToggleFavorite={onToggleFavorite}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Component for individual clothing item with ratings
  const ClothingItemCard = ({ item, displayName, userId, isSelf, isConnected, isPending, handleRent, onMessageClick, currentUserId, onRateItem, onPayment, onToggleFavorite }) => {
    const { stats: itemStats } = useClothingRatings(item?.id);
    const isFavorited = favorites.has(item.id);
    
    return (
      <Card key={item.id} className="group hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          {item.image_url && (
            <div className="mb-4 relative">
              <img 
                src={item.image_url} 
                alt={item.title} 
                className="w-full h-48 object-cover rounded-lg"
              />
              {/* Heart/Favorite Button */}
              <button
                onClick={() => onToggleFavorite(item.id)}
                className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all duration-200 hover:scale-110"
              >
                <Heart 
                  className={`w-5 h-5 ${
                    isFavorited 
                      ? 'text-red-500 fill-current' 
                      : 'text-gray-400 hover:text-red-500'
                  }`} 
                />
              </button>
            </div>
          )}
          <h4 className="font-semibold text-lg text-foreground mb-2">{item.title || 'Untitled Item'}</h4>
          <p className="text-muted-foreground text-sm mb-3">{item.description || 'No description available'}</p>
          
          {/* Rating Display */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <RatingDisplay
              averageRating={itemStats?.average_rating || 0}
              totalRatings={itemStats?.total_ratings || 0}
              quality={itemStats?.quality}
              style={itemStats?.style}
              condition={itemStats?.condition}
              showDetails={true}
              size="sm"
            />
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold text-primary">
              ${item.price_per_day || 0}/day
            </span>
            <Badge variant="secondary" className="flex items-center">Available</Badge>
          </div>
          
          <div className="space-y-2">
            <div className="space-y-2">
              <div className="flex gap-2">
                {!isSelf && (
                  <Button 
                    size="sm" 
                    onClick={() => handleRent(item)}
                    className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 h-9"
                  >
                    Request Owner
                  </Button>
                )}
                {!isSelf && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onMessageClick && onMessageClick(item.id, userId, displayName)}
                    className="flex items-center space-x-1 transition-all duration-200 hover:bg-primary hover:text-primary-foreground text-green-600 border-green-600 hover:bg-green-50 h-9"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat</span>
                  </Button>
                )}
              </div>
              {!isSelf && (
                <div className="space-y-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onRateItem(item.id, item.title)}
                    className="w-full text-green-600 border-green-600 hover:bg-green-50"
                  >
                    Rate This Item
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => onPayment(item)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Payment
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading community items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Public Marketplace</h1>
        <p className="text-muted-foreground text-lg">Discover and connect with sustainable fashion enthusiasts</p>
      </div>
      
      {/* Original Supabase Listings */}
      <div className="mb-8">
        
        {userIds.length === 0 && backendListings.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <img 
                src="/logo.png" 
                alt="Re:Fit Logo" 
                className="w-8 h-8 object-contain"
              />
            </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No items available yet</h3>
              <p className="text-muted-foreground">Be the first to share an item with the community!</p>
            </CardContent>
          </Card>
        )}
        
        {userIds.map(userId => {
          const displayName = profiles[userId] || (clothingByUser[userId][0].uploader_name) || 'Unknown User';
          const isSelf = user && user.id === userId;
          const isConnected = user && connections.includes(userId);
          const isPending = user && pendingRequests.includes(userId);
          
          return (
            <UserProfileSection 
              key={userId}
              userId={userId}
              displayName={displayName}
              isSelf={isSelf}
              isConnected={isConnected}
              isPending={isPending}
              clothingItems={clothingByUser[userId]}
              onConnect={handleConnect}
              onRateUser={handleRateUser}
              onRateItem={handleRateItem}
              handleRent={handleRent}
              onMessageClick={onMessageClick}
              currentUserId={user?.id}
              onPayment={handlePayment}
            />
          );
        })}
      </div>
      
      {/* AI-Powered Recommendations Section */}
      {backendListings.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            AI-Powered Recommendations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {backendListings.map((listing) => {
              const BackendListingCard = () => {
                const { stats: listingStats } = useClothingRatings(listing.listing_id);
                
                return (
                  <Card key={listing.listing_id} className="group hover:shadow-lg transition-all duration-300 border-2 border-primary/20 hover:border-primary/40">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                          {listing.title}
                        </h3>
                        <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold" style={{ color: '#000000 !important', WebkitTextFillColor: '#000000' }}>
                          {listing.privacy}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {listing.description}
                      </p>
                      
                      {/* Rating Display */}
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <RatingDisplay
                          averageRating={listingStats.average_rating}
                          totalRatings={listingStats.total_ratings}
                          quality={listingStats.quality}
                          style={listingStats.style}
                          condition={listingStats.condition}
                          showDetails={true}
                          size="sm"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {listing.owner_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground">Owner: {listing.owner_name}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <Button 
                          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                          onClick={() => alert('This would integrate with the style matching system!')}
                        >
                          Get Style Match Score
                        </Button>
                        {backendUser && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRateItem(listing.listing_id, listing.title)}
                            className="w-full text-green-600 border-green-600 hover:bg-green-50"
                          >
                            Rate This Item
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              };
              
              return <BackendListingCard key={listing.listing_id} />;
            })}
          </div>
        </div>
      )}
      
      {rentStatus && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
          rentStatus.startsWith('Error') 
            ? 'bg-red-100 border border-red-400 text-red-700' 
            : 'bg-green-100 border border-green-400 text-green-700'
        }`}>
          {rentStatus}
        </div>
      )}
      
      {/* Rating Form Modal */}
      {showRatingForm && (
        <RatingForm
          type={ratingFormType}
          itemId={showRatingForm}
          userId={user?.id}
          onClose={() => {
            setShowRatingForm(null);
            setRatingFormType(null);
          }}
          onSuccess={handleRatingSuccess}
          itemTitle={ratingFormType === 'clothing' ? 'Item' : 'User'}
          userName={ratingFormType === 'user' ? 'User' : undefined}
        />
      )}

      {/* Rental Modal */}
      {rentalModalOpen && selectedItem && (
        <RentalModal
          item={selectedItem}
          user={user}
          onClose={() => {
            setRentalModalOpen(false);
            setSelectedItem(null);
          }}
          onRentalRequested={handleRentalRequested}
        />
      )}

      {/* Payment Modal */}
      {paymentModalOpen && selectedItem && (
        <PaymentModal
          item={selectedItem}
          user={user}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedItem(null);
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
