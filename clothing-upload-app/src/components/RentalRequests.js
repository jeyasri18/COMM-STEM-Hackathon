import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const API_BASE = 'http://localhost:8000';

export default function RentalRequests({ user }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchPendingRequests();
    }
  }, [user]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/rentals/owner/${user.id}/pending`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch rental requests');
      }
      
      const requests = await response.json();
      setPendingRequests(requests);
    } catch (err) {
      console.error('Error fetching rental requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRental = async (rentalId, action) => {
    try {
      const response = await fetch(`${API_BASE}/rentals/${rentalId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action, // 'confirm' or 'reject'
          message: action === 'confirm' ? 'Rental confirmed!' : 'Rental rejected'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} rental`);
      }

      // Refresh the list
      await fetchPendingRequests();
    } catch (err) {
      console.error(`Error ${action}ing rental:`, err);
      alert(`Failed to ${action} rental. Please try again.`);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Rental Requests</h2>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Rental Requests</h2>
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Rental Requests</h2>
      
      {pendingRequests.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No pending rental requests
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <div key={request.rental_id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    Rental Request #{request.rental_id}
                  </h3>
                  <div className="text-sm text-gray-600 mt-2">
                    <p><strong>Requested by:</strong> {request.borrower_name || 'Unknown User'}</p>
                    <p><strong>Item:</strong> {request.item_title || 'Unknown Item'}</p>
                    <p><strong>Start Date:</strong> {request.start_date}</p>
                    <p><strong>End Date:</strong> {request.end_date}</p>
                    <p><strong>Status:</strong> <span className="text-yellow-600">{request.status}</span></p>
                    {request.message && (
                      <p><strong>Message:</strong> {request.message}</p>
                    )}
                    <p><strong>Requested:</strong> {new Date(request.created_at).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleConfirmRental(request.rental_id, 'confirm')}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleConfirmRental(request.rental_id, 'reject')}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
