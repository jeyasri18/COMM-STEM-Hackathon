import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { supabase, getCurrentUser } from '../lib/supabase';

export function ProfilePage({ onSignOut }) {
  const [user, setUser] = useState(null);
  const [clothing, setClothing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [editName, setEditName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameStatus, setNameStatus] = useState('');
  const [incomingRequests, setIncomingRequests] = useState([]);

  useEffect(() => {
    async function fetchUserAndClothing() {
      const userObj = await getCurrentUser();
      setUser(userObj);
      if (userObj) {
        // Fetch display name from user_profiles
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('display_name')
          .eq('user_id', userObj.id)
          .single();
        setDisplayName(profile?.display_name || '');
        setNameInput(profile?.display_name || '');
        
        // Fetch clothing
        const { data, error } = await supabase
          .from('clothing')
          .select('*')
          .eq('user_id', userObj.id)
          .order('created_at', { ascending: false });
        setClothing(data || []);
        
        // Fetch incoming connection requests
        const { data: requests } = await supabase
          .from('connections')
          .select('user_id, status')
          .eq('connected_user_id', userObj.id)
          .eq('status', 'pending');
        setIncomingRequests(requests || []);
      }
      setLoading(false);
    }
    fetchUserAndClothing();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onSignOut && onSignOut();
  };

  const handleNameSave = async () => {
    setNameStatus('');
    if (!nameInput.trim()) {
      setNameStatus('Name cannot be empty.');
      return;
    }
    // Upsert into user_profiles
    const { error } = await supabase
      .from('user_profiles')
      .upsert({ user_id: user.id, display_name: nameInput.trim() });
    if (error) {
      setNameStatus('Error: ' + error.message);
    } else {
      setDisplayName(nameInput.trim());
      setEditName(false);
      setNameStatus('Name updated!');
    }
  };

  const handleAcceptRequest = async (requestUserId) => {
    await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('user_id', requestUserId)
      .eq('connected_user_id', user.id);
    setIncomingRequests(prev => prev.filter(r => r.user_id !== requestUserId));
  };

  const handleRejectRequest = async (requestUserId) => {
    await supabase
      .from('connections')
      .delete()
      .eq('user_id', requestUserId)
      .eq('connected_user_id', user.id);
    setIncomingRequests(prev => prev.filter(r => r.user_id !== requestUserId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
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
            <h2 className="text-2xl font-semibold text-foreground mb-2">Not signed in</h2>
            <p className="text-muted-foreground">Please sign in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary font-semibold">
                  {displayName.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-2xl font-bold text-foreground">Your Profile</h1>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <p className="text-foreground font-medium">{user.email}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Display Name</Label>
                {editName ? (
                  <div className="space-y-2">
                    <Input
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      placeholder="Enter display name"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleNameSave}>Save</Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => { setEditName(false); setNameInput(displayName); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-foreground font-medium">
                      {displayName || <span className="text-muted-foreground italic">(not set)</span>}
                    </p>
                    <Button size="sm" variant="outline" onClick={() => setEditName(true)}>
                      Edit
                    </Button>
                  </div>
                )}
                {nameStatus && (
                  <p className={`text-sm mt-1 ${
                    nameStatus.startsWith('Error') ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {nameStatus}
                  </p>
                )}
              </div>
              
              <div className="pt-4 border-t">
                <Button 
                  onClick={handleSignOut} 
                  variant="destructive" 
                  className="w-full"
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Connection Requests */}
          {incomingRequests.length > 0 && (
            <Card>
              <CardHeader>
              <h2 className="text-xl font-semibold text-foreground">
                Connection Requests
              </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {incomingRequests.map(req => (
                    <div key={req.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {req.user_id.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">User ID: {req.user_id}</p>
                          <p className="text-sm text-muted-foreground">Wants to connect with you</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleAcceptRequest(req.user_id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRejectRequest(req.user_id)}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Your Items */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                Your Uploaded Items
                <Badge variant="secondary">{clothing.length}</Badge>
              </h2>
            </CardHeader>
            <CardContent>
              {clothing.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 bg-primary rounded-full"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No items uploaded yet</h3>
                  <p className="text-muted-foreground">Start sharing your wardrobe with the community!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {clothing.map(item => (
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
                        <h3 className="font-semibold text-lg text-foreground mb-2">{item.title}</h3>
                        <p className="text-muted-foreground text-sm mb-3">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-primary">
                            ${item.price_per_day}/day
                          </span>
                          <Badge variant={item.visibility === 'public' ? 'default' : 'secondary'}>
                            {item.visibility}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
