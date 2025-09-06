import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthPage = ({ onAuth }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({ email, password });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }
      if (result.error) throw result.error;
      onAuth && onAuth();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, background: 'white', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      <h2 style={{ textAlign: 'center' }}>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <div style={{ color: 'red', fontSize: 14 }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ padding: 12, borderRadius: 8, background: '#667eea', color: 'white', fontWeight: 600, border: 'none' }}>
          {loading ? (isSignUp ? 'Signing Up...' : 'Signing In...') : (isSignUp ? 'Sign Up' : 'Sign In')}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
        <button onClick={() => setIsSignUp(!isSignUp)} style={{ marginLeft: 8, color: '#764ba2', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;
