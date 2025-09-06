import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API functions
export const api = {
  // Users
  createUser: (userData) => apiClient.post('/users', userData),
  getUser: (userId) => apiClient.get(`/users/${userId}`),
  
  // Listings
  createListing: (listingData) => apiClient.post('/listings', listingData),
  getListings: (userId = null) => {
    const params = userId ? { user_id: userId } : {};
    return apiClient.get('/listings', { params });
  },
  getListing: (listingId) => apiClient.get(`/listings/${listingId}`),
  
  // Reviews
  createReview: (reviewData) => apiClient.post('/reviews', reviewData),
  getListingReviews: (listingId) => apiClient.get(`/listings/${listingId}/reviews`),
  getListingSummary: (listingId) => apiClient.get(`/listings/${listingId}/summary`),
  
  // Style matching
  takeStyleQuiz: (userId, quizData) => apiClient.post(`/users/${userId}/style-quiz`, quizData),
  getPeopleSuggestions: (userId, k = 5, minSim = 0.0) => 
    apiClient.get(`/users/${userId}/suggestions/people`, { 
      params: { k, min_sim: minSim } 
    }),
  getListingSuggestions: (userId, k = 10) => 
    apiClient.get(`/users/${userId}/suggestions/listings`, { 
      params: { k } 
    }),
  
  // Social features
  followUser: (followerId, followeeId) => 
    apiClient.post(`/users/${followerId}/follow/${followeeId}`),
  getFollowing: (userId) => apiClient.get(`/users/${userId}/following`),
  
  // Health check
  healthCheck: () => apiClient.get('/health'),
};
