import React, { useEffect, useState } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';

const ProfilePage = ({ onSignOut }) => {
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

  if (loading) return <div style={{ textAlign: 'center', marginTop: 40 }}>Loading...</div>;
  if (!user) return <div style={{ textAlign: 'center', marginTop: 40 }}>Not signed in.</div>;

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, background: 'white', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      <h2 style={{ textAlign: 'center' }}>Profile</h2>
      <div style={{ marginBottom: 16 }}><b>Email:</b> {user.email}</div>
      <div style={{ marginBottom: 16 }}>
        <b>Display Name:</b>{' '}
        {editName ? (
          <>
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              style={{ marginRight: 8 }}
            />
            <button onClick={handleNameSave} style={{ marginRight: 8 }}>Save</button>
            <button onClick={() => { setEditName(false); setNameInput(displayName); }}>Cancel</button>
          </>
        ) : (
          <>
            {displayName || <span style={{ color: '#aaa' }}>(not set)</span>}
            <button onClick={() => setEditName(true)} style={{ marginLeft: 12 }}>Edit</button>
          </>
        )}
        {nameStatus && <div style={{ color: nameStatus.startsWith('Error') ? 'red' : 'green', marginTop: 4 }}>{nameStatus}</div>}
      </div>
      <button onClick={handleSignOut} style={{ marginBottom: 24, background: '#dc3545', color: 'white', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer' }}>Sign Out</button>
      <div style={{ marginBottom: 24 }}>
        <h3>Incoming Connection Requests</h3>
        {incomingRequests.length === 0 ? (
          <div style={{ color: '#888' }}>No pending requests.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {incomingRequests.map(req => (
              <li key={req.user_id} style={{ marginBottom: 8 }}>
                <span>User ID: {req.user_id}</span>
                <button onClick={() => handleAcceptRequest(req.user_id)} style={{ marginLeft: 12, background: '#28a745', color: 'white', border: 'none', borderRadius: 6, padding: '2px 10px', cursor: 'pointer' }}>Accept</button>
                <button onClick={() => handleRejectRequest(req.user_id)} style={{ marginLeft: 8, background: '#dc3545', color: 'white', border: 'none', borderRadius: 6, padding: '2px 10px', cursor: 'pointer' }}>Reject</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <h3>Your Uploaded Clothing Items</h3>
      {clothing.length === 0 ? (
        <div>No items uploaded yet.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {clothing.map(item => (
            <li key={item.id} style={{ marginBottom: 16, border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
              <div><b>{item.title}</b></div>
              <div>{item.description}</div>
              <div>Price per day: ${item.price_per_day}</div>
              {item.image_url && <img src={item.image_url} alt={item.title} style={{ maxWidth: 120, marginTop: 8, borderRadius: 6 }} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProfilePage;
