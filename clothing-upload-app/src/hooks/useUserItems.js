import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000';

// Browser-compatible UUID to integer conversion
const uuidToInt = (uuidStr) => {
  let hash = 0;
  for (let i = 0; i < uuidStr.length; i++) {
    const char = uuidStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 1000000;
};

export const useUserRentals = (userId) => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchRentals = async () => {
      try {
        setLoading(true);
        const userIdInt = uuidToInt(userId);
        console.log('Fetching rentals for user ID:', userIdInt);
        
        const response = await fetch(`${API_BASE}/users/${userIdInt}/rentals`);
        console.log('Rentals response status:', response.status);
        
        if (!response.ok) {
          throw new Error('Failed to fetch rentals');
        }
        
        const data = await response.json();
        console.log('Rentals data:', data);
        setRentals(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching rentals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRentals();
  }, [userId]);

  return { rentals, loading, error };
};

export const useUserLentItems = (userId) => {
  const [lentItems, setLentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchLentItems = async () => {
      try {
        setLoading(true);
        const userIdInt = uuidToInt(userId);
        console.log('Fetching lent items for user ID:', userIdInt);
        
        const response = await fetch(`${API_BASE}/users/${userIdInt}/lent`);
        console.log('Lent items response status:', response.status);
        
        if (!response.ok) {
          throw new Error('Failed to fetch lent items');
        }
        
        const data = await response.json();
        console.log('Lent items data:', data);
        setLentItems(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching lent items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLentItems();
  }, [userId]);

  return { lentItems, loading, error };
};
