import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import UploadClothing from './pages/UploadClothing';
import PublicDashboard from './pages/PublicDashboard';
import CommunityDashboard from './pages/CommunityDashboard';
import StyleQuiz from './pages/StyleQuiz';
import { getCurrentUser, supabase } from './lib/supabase';
import { apiClient } from './lib/api';

function Navbar({ user, onSignOut }) {
  const location = useLocation();
  const navStyle = {
    display: 'flex',
    gap: 20,
    padding: '16px 32px',
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    alignItems: 'center',
    color: 'white',
    marginBottom: 0,
  };
  const linkStyle = isActive => ({
    color: isActive ? '#ffd700' : 'white',
    textDecoration: 'none',
    fontWeight: isActive ? 700 : 500,
    fontSize: 17,
    padding: '4px 10px',
    borderRadius: 6,
    background: isActive ? 'rgba(255,255,255,0.08)' : 'none',
    transition: 'all 0.2s',
  });
  
  return (
    <nav style={navStyle}>
      <Link to="/dashboard" style={linkStyle(location.pathname === '/dashboard')}>
        Discover
      </Link>
      {user && (
        <Link to="/community" style={linkStyle(location.pathname === '/community')}>
          Community
        </Link>
      )}
      {user && (
        <Link to="/profile" style={linkStyle(location.pathname === '/profile')}>
          Profile
        </Link>
      )}
      {user && (
        <Link to="/upload" style={linkStyle(location.pathname === '/upload')}>
          Upload
        </Link>
      )}
      {user && (
        <Link to="/style-quiz" style={linkStyle(location.pathname === '/style-quiz')}>
          Style Quiz
        </Link>
      )}
      <div style={{ flex: 1 }} />
      {user ? (
        <button 
          onClick={onSignOut} 
          style={{ 
            background: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: 8, 
            padding: '6px 16px', 
            cursor: 'pointer', 
            fontWeight: 600 
          }}
        >
          Sign Out
        </button>
      ) : (
        <Link to="/auth" style={linkStyle(location.pathname === '/auth')}>
          Sign In
        </Link>
      )}
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [backendUser, setBackendUser] = useState(null);
  
  useEffect(() => {
    async function fetchUser() {
      const supabaseUser = await getCurrentUser();
      setUser(supabaseUser);
      
      // If user exists, try to get/create backend user
      if (supabaseUser) {
        try {
          // Try to get existing backend user first
          const response = await apiClient.get(`/users/${supabaseUser.id}`);
          setBackendUser(response.data);
        } catch (error) {
          // If user doesn't exist in backend, create them
          try {
            const createResponse = await apiClient.post('/users', {
              name: supabaseUser.user_metadata?.full_name || supabaseUser.email,
              circle: 'USYD' // Default circle, could be made configurable
            });
            setBackendUser(createResponse.data);
          } catch (createError) {
            console.error('Failed to create backend user:', createError);
          }
        }
      }
    }
    fetchUser();
  }, []);

  const handleAuthChange = async () => {
    const supabaseUser = await getCurrentUser();
    setUser(supabaseUser);
    
    if (supabaseUser) {
      try {
        const response = await apiClient.get(`/users/${supabaseUser.id}`);
        setBackendUser(response.data);
      } catch (error) {
        try {
          const createResponse = await apiClient.post('/users', {
            name: supabaseUser.user_metadata?.full_name || supabaseUser.email,
            circle: 'USYD'
          });
          setBackendUser(createResponse.data);
        } catch (createError) {
          console.error('Failed to create backend user:', createError);
        }
      }
    } else {
      setBackendUser(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setBackendUser(null);
  };

  return (
    <Router>
      <Navbar user={user} onSignOut={handleSignOut} />
      <Routes>
        <Route 
          path="/dashboard" 
          element={<PublicDashboard user={user} backendUser={backendUser} />} 
        />
        {user && (
          <Route 
            path="/community" 
            element={<CommunityDashboard user={user} backendUser={backendUser} />} 
          />
        )}
        {user && (
          <Route 
            path="/profile" 
            element={<ProfilePage user={user} backendUser={backendUser} onSignOut={handleAuthChange} />} 
          />
        )}
        {user && (
          <Route 
            path="/upload" 
            element={<UploadClothing user={user} backendUser={backendUser} />} 
          />
        )}
        {user && (
          <Route 
            path="/style-quiz" 
            element={<StyleQuiz user={user} backendUser={backendUser} />} 
          />
        )}
        {!user && (
          <Route 
            path="/auth" 
            element={<AuthPage onAuth={handleAuthChange} />} 
          />
        )}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
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
    </Router>
  );
}

export default App;
