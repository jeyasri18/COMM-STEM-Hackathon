import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';

const RatingForm = ({ 
  type, // 'clothing' or 'user'
  itemId, 
  userId, 
  onClose, 
  onSuccess,
  itemTitle = "Item",
  userName = "User"
}) => {
  const [overallRating, setOverallRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Clothing-specific ratings
  const [qualityRating, setQualityRating] = useState(0);
  const [styleRating, setStyleRating] = useState(0);
  const [conditionRating, setConditionRating] = useState(0);
  
  // User-specific ratings
  const [reliabilityRating, setReliabilityRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [careRating, setCareRating] = useState(0);

  const renderStarInput = (rating, setRating, label) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="focus:outline-none"
          >
            <Star
              className={`w-5 h-5 ${
                star <= (hoveredRating || rating)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
      </div>
    </div>
  );

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const API_BASE = 'http://localhost:8000';
      
      // Convert UUIDs to integers for backend
      const userIdInt = uuidToInt(userId);
      // Keep itemId as string for Supabase UUID storage
      
      if (type === 'clothing') {
        const requestData = {
          user_id: userIdInt,
          listing_id: itemId, // Send original UUID string
          rating: overallRating,
          comment: comment,
          quality_rating: qualityRating,
          style_rating: styleRating,
          condition_rating: conditionRating
        };
        console.log('Submitting clothing rating:', requestData);
        
        const response = await fetch(`${API_BASE}/ratings/clothing`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });

        console.log('Clothing rating response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Clothing rating failed:', errorData);
          throw new Error('Failed to submit clothing rating: ' + (errorData.detail || 'Unknown error'));
        }
      } else {
        const requestData = {
          rater_id: userIdInt,
          rated_user_id: itemId, // Use original UUID string
          rating: overallRating,
          comment: comment,
          reliability_rating: reliabilityRating,
          communication_rating: communicationRating,
          care_rating: careRating
        };
        console.log('Submitting user rating:', requestData);
        
        const response = await fetch(`${API_BASE}/ratings/user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });

        console.log('User rating response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('User rating failed:', errorData);
          throw new Error('Failed to submit user rating: ' + (errorData.detail || 'Unknown error'));
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = () => {
    if (type === 'clothing') {
      return overallRating > 0 && qualityRating > 0 && styleRating > 0 && conditionRating > 0;
    } else {
      return overallRating > 0 && reliabilityRating > 0 && communicationRating > 0 && careRating > 0;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">
            Rate {type === 'clothing' ? itemTitle : userName}
          </CardTitle>
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Overall Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Overall Rating *</label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setOverallRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= (hoveredRating || overallRating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">{overallRating}/5</span>
              </div>
            </div>

            {/* Specific Ratings */}
            <div className="space-y-4">
              {type === 'clothing' ? (
                <>
                  {renderStarInput(qualityRating, setQualityRating, "Quality *")}
                  {renderStarInput(styleRating, setStyleRating, "Style *")}
                  {renderStarInput(conditionRating, setConditionRating, "Condition *")}
                </>
              ) : (
                <>
                  {renderStarInput(reliabilityRating, setReliabilityRating, "Reliability *")}
                  {renderStarInput(communicationRating, setCommunicationRating, "Communication *")}
                  {renderStarInput(careRating, setCareRating, "Care *")}
                </>
              )}
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Comment (Optional)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={`Share your experience with this ${type === 'clothing' ? 'item' : 'user'}...`}
                className="min-h-[80px]"
                maxLength={500}
              />
              <div className="text-xs text-gray-500 text-right">
                {comment.length}/500
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid() || submitting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RatingForm;
