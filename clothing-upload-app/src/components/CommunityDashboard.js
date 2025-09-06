import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { supabase, getCurrentUser } from '../lib/supabase';

export function CommunityDashboard() {
  const [clothing, setClothing] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      // Fetch connections
      const { data: connData } = await supabase
        .from('connections')
        .select('connected_user_id')
        .eq('user_id', currentUser.id);
      const connectedIds = (connData || []).map(c => c.connected_user_id);
      setConnections(connectedIds);
      
      if (connectedIds.length === 0) {
        setClothing([]);
        setProfiles({});
        setLoading(false);
        return;
      }
      
      // Fetch community clothing from connected users
      const { data: clothingData } = await supabase
        .from('clothing')
        .select('*')
        .eq('visibility', 'community')
        .in('user_id', connectedIds);
      setClothing(clothingData || []);
      
      // Fetch user_profiles for those user_ids
      const userIds = [...new Set((clothingData || []).map(item => item.user_id).filter(Boolean))];
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your community...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <img 
                src="/logo.png" 
                alt="Re:Fit Logo" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Sign in required</h2>
            <p className="text-muted-foreground">Please sign in to see your community dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Your Re:Fit Community</h1>
        <p className="text-muted-foreground text-lg">Items shared by your connections</p>
      </div>
      
      {connections.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <img 
                src="/logo.png" 
                alt="Re:Fit Logo" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">No connections yet</h2>
            <p className="text-muted-foreground mb-4">
              Connect with other users to see their community-only items.
            </p>
            <Badge variant="outline" className="text-sm">
              {connections.length} connections
            </Badge>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6">
            <Badge variant="secondary" className="text-sm">
              {connections.length} connections • {clothing.length} community items
            </Badge>
          </div>
          
          {userIds.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <img 
                    src="/logo.png" 
                    alt="Re:Fit Logo" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">No community items</h2>
                <p className="text-muted-foreground">
                  Your connections haven't shared any community-only items yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {userIds.map(userId => {
                const displayName = profiles[userId] || (clothingByUser[userId][0].uploader_name) || 'Unknown User';
                
                return (
                  <div key={userId} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">{displayName}</h3>
                        <p className="text-muted-foreground text-sm">Connected Friend</p>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Connected
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {clothingByUser[userId].map(item => (
                        <Card key={item.id} className="group hover:shadow-lg transition-all duration-300 border-2 border-green-200 hover:border-green-300">
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
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Community Only
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Shared with your community
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
