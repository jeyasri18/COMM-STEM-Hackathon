import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { X, Calendar, Clock } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

// Helper function to convert UUID to integer for backend
function uuidToInt(uuid) {
  if (!uuid) return 1;
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    const char = uuid.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 1000000 + 1;
}

export function RentalModal({ item, user, onClose, onRentalRequested }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      alert('End date must be after start date');
      return;
    }

    setIsSubmitting(true);

    try {
      const rentalData = {
        borrower_id: user.id,  // Send UUID string directly
        listing_id: item.id,  // Send UUID string directly
        start_date: startDate,
        end_date: endDate,
        message: message
      };

      console.log('Submitting rental request:', rentalData);

      const response = await fetch(`${API_BASE}/rentals/request`, {
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

      // Call the callback to notify parent component
      if (onRentalRequested) {
        onRentalRequested(result);
      }

      // Close the modal
      onClose();
      
      // Show success message
      alert('Rental request sent successfully! The owner will be notified.');

    } catch (error) {
      console.error('Error submitting rental request:', error);
      alert('Failed to submit rental request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set default dates (today and tomorrow)
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Request to Rent</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="font-medium text-lg">{item.title}</h3>
            <p className="text-gray-600">{item.description}</p>
            <p className="text-green-600 font-semibold">${item.price}/day</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={today}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || today}
                  required
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Message to Owner (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message for the owner..."
                className="w-full p-2 border border-gray-300 rounded-md resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
