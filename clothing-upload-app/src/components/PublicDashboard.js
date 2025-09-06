import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { supabase, getCurrentUser } from '../lib/supabase';
import { api } from '../lib/api';

export function PublicDashboard() {
  const [clothing, setClothing] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [rentingId, setRentingId] = useState(null);
  const [renterEmail, setRenterEmail] = useState('');
  const [rentStatus, setRentStatus] = useState('');
  const [user, setUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [backendListings, setBackendListings] = useState([]);
  const [backendUser, setBackendUser] = useState(null);

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
          try {
            const userResponse = await api.getUser(currentUser.id);
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

  const handleRent = async (clothingId) => {
    setRentStatus('');
    if (!renterEmail) {
      setRentStatus('Please enter your email.');
      return;
    }
    // Insert rental record
    const { error } = await supabase
      .from('rentals')
      .insert({ clothing_id: clothingId, renter_email: renterEmail });
    if (error) {
      setRentStatus('Error: ' + error.message);
    } else {
      setRentStatus('Rental request sent!');
      setRentingId(null);
      setRenterEmail('');
    }
  };

  const handleConnect = async (otherUserId) => {
    if (!user) return;
    await supabase
      .from('connections')
      .upsert({ user_id: user.id, connected_user_id: otherUserId, status: 'pending' });
    setPendingRequests(prev => [...prev, otherUserId]);
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
      
      {/* Backend Listings Section */}
      {backendListings.length > 0 && (
        <div className="mb-12">
        <h2 className="text-2xl font-semibold text-foreground mb-6">
          AI-Powered Recommendations
        </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {backendListings.map((listing) => (
              <Card key={listing.listing_id} className="group hover:shadow-lg transition-all duration-300 border-2 border-primary/20 hover:border-primary/40">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                      {listing.title}
                    </h3>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {listing.privacy}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {listing.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {listing.owner_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground">Owner: {listing.owner_name}</span>
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    onClick={() => alert('This would integrate with the style matching system!')}
                  >
                    Get Style Match Score
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Original Supabase Listings */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-6">
          Community Listings
        </h2>
        
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
            <div key={userId} className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground">{displayName}</h3>
                  <p className="text-muted-foreground text-sm">Community Member</p>
                </div>
                {user && !isSelf && !isConnected && !isPending && (
                  <Button 
                    size="sm" 
                    onClick={() => handleConnect(userId)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Connect
                  </Button>
                )}
                {user && !isSelf && isPending && (
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    Request Sent
                  </Badge>
                )}
                {user && !isSelf && isConnected && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Connected
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clothingByUser[userId].map(item => (
                  <Card key={item.id} className="group hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      {item.image_url && (
                        <div className="mb-4">
                          <img 
                            src={item.image_url} 
                            alt={item.title} 
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        </div>
                      )}
                      <h4 className="font-semibold text-lg text-foreground mb-2">{item.title}</h4>
                      <p className="text-muted-foreground text-sm mb-3">{item.description}</p>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-semibold text-primary">
                          ${item.price_per_day}/day
                        </span>
                        <Badge variant="secondary">Available</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {rentingId === item.id ? (
                          <div className="space-y-2">
                            <input
                              type="email"
                              placeholder="Your email"
                              value={renterEmail}
                              onChange={e => setRenterEmail(e.target.value)}
                              className="w-full px-3 py-2 border border-input rounded-md text-sm"
                            />
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleRent(item.id)}
                                className="flex-1 bg-primary hover:bg-primary/90"
                              >
                                Confirm Rent
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => { setRentingId(null); setRenterEmail(''); }}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => setRentingId(item.id)}
                            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                          >
                            Rent Item
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      {rentStatus && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
          rentStatus.startsWith('Error') 
            ? 'bg-red-100 border border-red-400 text-red-700' 
            : 'bg-green-100 border border-green-400 text-green-700'
        }`}>
          {rentStatus}
        </div>
      )}
    </div>
  );
}
