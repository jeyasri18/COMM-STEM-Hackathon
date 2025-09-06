import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000';

export const useClothingRatings = (listingId) => {
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState({
    average_rating: 0,
    total_ratings: 0,
    quality: 0,
    style: 0,
    condition: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!listingId) return;

    const fetchRatings = async () => {
      try {
        setLoading(true);
        setError(null);

        // Convert UUID to integer for backend (if it's a UUID)
        const listingIdInt = typeof listingId === 'string' && listingId.includes('-') 
          ? uuidToInt(listingId) 
          : listingId;

        // Fetch individual ratings
        const ratingsResponse = await fetch(`${API_BASE}/ratings/clothing/${listingIdInt}`);
        if (ratingsResponse.ok) {
          const ratingsData = await ratingsResponse.json();
          setRatings(ratingsData);
        }

        // Fetch rating statistics
        const statsResponse = await fetch(`${API_BASE}/ratings/clothing/${listingIdInt}/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (err) {
        console.error('Error fetching clothing ratings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [listingId]);

  return { ratings, stats, loading, error };
};

// Helper function to convert UUID to integer
const uuidToInt = (uuidStr) => {
  // Simple hash function for browser compatibility
  let hash = 0;
  for (let i = 0; i < uuidStr.length; i++) {
    const char = uuidStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 1000000;
};

export const useUserRatings = (userId) => {
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState({
    average_rating: 0,
    total_ratings: 0,
    reliability: 0,
    communication: 0,
    care: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchRatings = async () => {
      try {
        setLoading(true);
        setError(null);

        // Convert UUID to integer for backend
        const userIdInt = uuidToInt(userId);

        // Fetch individual ratings
        const ratingsResponse = await fetch(`${API_BASE}/ratings/user/${userIdInt}`);
        if (ratingsResponse.ok) {
          const ratingsData = await ratingsResponse.json();
          setRatings(ratingsData);
        }

        // Fetch rating statistics
        const statsResponse = await fetch(`${API_BASE}/ratings/user/${userIdInt}/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (err) {
        console.error('Error fetching user ratings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [userId]);

  return { ratings, stats, loading, error };
};
