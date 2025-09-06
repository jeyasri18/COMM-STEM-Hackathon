import React, { useEffect, useState } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';

const PublicDashboard = () => {
  const [clothing, setClothing] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [rentingId, setRentingId] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [rentStatus, setRentStatus] = useState('');
  const [user, setUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      // Get all public clothing items
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

  // Helper function to convert UUID to integer (matching backend logic)
  const uuidToInt = (uuid) => {
    const uuidStr = uuid.replace(/-/g, '');
    let hash = 0;
    for (let i = 0; i < uuidStr.length; i++) {
      const char = uuidStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 1000000 + 1;
  };

  const handleRent = async (clothingId) => {
    setRentStatus('');
    if (!startDate || !endDate) {
      setRentStatus('Please select both start and end dates.');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setRentStatus('End date must be after start date.');
      return;
    }

    if (!user) {
      setRentStatus('Please log in to rent items.');
      return;
    }

    try {
      const rentalData = {
        borrower_id: user.id,  // Send UUID string directly
        listing_id: clothingId,  // Send UUID string directly
        start_date: startDate,
        end_date: endDate,
        message: message
      };

      console.log('Submitting rental request:', rentalData);

      const response = await fetch('http://localhost:8000/rentals/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rentalData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Rental request failed:', errorData);
        throw new Error('Failed to submit rental request: ' + (errorData.detail || 'Unknown error'));
      }

      const result = await response.json();
      console.log('Rental request successful:', result);

      setRentStatus('Rental request sent successfully! The owner will be notified.');
      setRentingId(null);
      setStartDate('');
      setEndDate('');
      setMessage('');

    } catch (error) {
      console.error('Error submitting rental request:', error);
      setRentStatus('Failed to submit rental request. Please try again.');
    }
  };

  const handleConnect = async (otherUserId) => {
    if (!user) return;
    await supabase
      .from('connections')
      .upsert({ user_id: user.id, connected_user_id: otherUserId, status: 'pending' });
    setPendingRequests(prev => [...prev, otherUserId]);
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 40 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h2 style={{ textAlign: 'center' }}>Clothing Available for Rent</h2>
      {userIds.length === 0 && <div>No clothing items available.</div>}
      {userIds.map(userId => {
        const displayName = profiles[userId] || (clothingByUser[userId][0].uploader_name) || 'Unknown User';
        const isSelf = user && user.id === userId;
        const isConnected = user && connections.includes(userId);
        const isPending = user && pendingRequests.includes(userId);
        return (
          <div key={userId} style={{ marginBottom: 32, borderBottom: '1px solid #eee', paddingBottom: 16 }}>
            <h3>
              Uploader: {displayName}
              {user && !isSelf && !isConnected && !isPending && (
                <button onClick={() => handleConnect(userId)} style={{ marginLeft: 16, background: '#28a745', color: 'white', border: 'none', borderRadius: 6, padding: '2px 10px', cursor: 'pointer' }}>Connect</button>
              )}
              {user && !isSelf && isPending && (
                <span style={{ marginLeft: 16, color: '#ff9800', fontWeight: 600 }}>(Request Sent)</span>
              )}
              {user && !isSelf && isConnected && (
                <span style={{ marginLeft: 16, color: '#28a745', fontWeight: 600 }}>(Connected)</span>
              )}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              {clothingByUser[userId].map(item => (
                <div key={item.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, width: 220 }}>
                  <div><b>{item.title}</b></div>
                  <div>{item.description}</div>
                  <div>Price per day: ${item.price_per_day}</div>
                  {item.image_url && <img src={item.image_url} alt={item.title} style={{ maxWidth: 120, marginTop: 8, borderRadius: 6 }} />}
                  <div style={{ marginTop: 8 }}>
                    {rentingId === item.id ? (
                      <div>
                        <input
                          type="date"
                          placeholder="Start date"
                          value={startDate}
                          onChange={e => setStartDate(e.target.value)}
                          style={{ marginBottom: 8, width: '100%', padding: 4, border: '1px solid #ddd', borderRadius: 4 }}
                        />
                        <input
                          type="date"
                          placeholder="End date"
                          value={endDate}
                          onChange={e => setEndDate(e.target.value)}
                          style={{ marginBottom: 8, width: '100%', padding: 4, border: '1px solid #ddd', borderRadius: 4 }}
                        />
                        <textarea
                          placeholder="Message (optional)"
                          value={message}
                          onChange={e => setMessage(e.target.value)}
                          style={{ marginBottom: 8, width: '100%', padding: 4, border: '1px solid #ddd', borderRadius: 4, minHeight: 60 }}
                        />
                        <button onClick={() => handleRent(item.id)} style={{ background: '#667eea', color: 'white', border: 'none', borderRadius: 6, padding: 6, width: '100%' }}>Confirm Rent</button>
                        <button onClick={() => { setRentingId(null); setStartDate(''); setEndDate(''); setMessage(''); }} style={{ background: 'none', color: '#dc3545', border: 'none', marginTop: 4, cursor: 'pointer' }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setRentingId(item.id)} style={{ background: '#764ba2', color: 'white', border: 'none', borderRadius: 6, padding: 6, width: '100%' }}>Rent</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {rentStatus && <div style={{ color: rentStatus.startsWith('Error') ? 'red' : 'green', marginTop: 16 }}>{rentStatus}</div>}
    </div>
  );
};

export default PublicDashboard;
