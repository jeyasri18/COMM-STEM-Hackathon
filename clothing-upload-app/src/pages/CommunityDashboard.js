import React, { useEffect, useState } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';

const CommunityDashboard = () => {
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

  if (loading) return <div style={{ textAlign: 'center', marginTop: 40 }}>Loading...</div>;
  if (!user) return <div style={{ textAlign: 'center', marginTop: 40 }}>Sign in to see your community dashboard.</div>;

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h2 style={{ textAlign: 'center' }}>Community Clothing (Your Connections)</h2>
      {userIds.length === 0 && <div>No community clothing items from your connections.</div>}
      {userIds.map(userId => {
        const displayName = profiles[userId] || (clothingByUser[userId][0].uploader_name) || 'Unknown User';
        return (
          <div key={userId} style={{ marginBottom: 32, borderBottom: '1px solid #eee', paddingBottom: 16 }}>
            <h3>Uploader: {displayName}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              {clothingByUser[userId].map(item => (
                <div key={item.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, width: 220 }}>
                  <div><b>{item.title}</b></div>
                  <div>{item.description}</div>
                  <div>Price per day: ${item.price_per_day}</div>
                  {item.image_url && <img src={item.image_url} alt={item.title} style={{ maxWidth: 120, marginTop: 8, borderRadius: 6 }} />}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CommunityDashboard;
