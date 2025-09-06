import React from 'react';
import { Star, StarHalf } from 'lucide-react';

const RatingDisplay = ({ 
  averageRating = 0, 
  totalRatings = 0, 
  quality, 
  style, 
  condition, 
  reliability, 
  communication, 
  care,
  showDetails = false,
  size = "sm" 
}) => {
  const renderStars = (rating) => {
    const safeRating = Number(rating) || 0;
    const stars = [];
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star 
            key={i} 
            className={`text-yellow-400 fill-current ${
              size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"
            }`} 
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <StarHalf 
            key={i} 
            className={`text-yellow-400 fill-current ${
              size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"
            }`} 
          />
        );
      } else {
        stars.push(
          <Star 
            key={i} 
            className={`text-gray-300 ${
              size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"
            }`} 
          />
        );
      }
    }
    return stars;
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 3.5) return "text-yellow-600";
    if (rating >= 2.5) return "text-orange-600";
    return "text-red-600";
  };

  if (totalRatings === 0) {
    return (
      <div className="flex items-center space-x-1">
        <span className="text-gray-400 text-xs">No ratings yet</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-1">
      {/* Overall Rating */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          {renderStars(averageRating)}
        </div>
        <span className={`font-medium ${getRatingColor(averageRating)} ${
          size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"
        }`}>
          {Number(averageRating || 0).toFixed(1)}
        </span>
        <span className="text-gray-500 text-xs">
          ({totalRatings} rating{totalRatings !== 1 ? 's' : ''})
        </span>
      </div>

      {/* Detailed Ratings */}
      {showDetails && (
        <div className="space-y-1 text-xs text-gray-600">
          {quality !== undefined && (
            <div className="flex items-center justify-between">
              <span>Quality:</span>
              <div className="flex items-center space-x-1">
                {renderStars(quality)}
                <span className="ml-1">{Number(quality || 0).toFixed(1)}</span>
              </div>
            </div>
          )}
          {style !== undefined && (
            <div className="flex items-center justify-between">
              <span>Style:</span>
              <div className="flex items-center space-x-1">
                {renderStars(style)}
                <span className="ml-1">{Number(style || 0).toFixed(1)}</span>
              </div>
            </div>
          )}
          {condition !== undefined && (
            <div className="flex items-center justify-between">
              <span>Condition:</span>
              <div className="flex items-center space-x-1">
                {renderStars(condition)}
                <span className="ml-1">{Number(condition || 0).toFixed(1)}</span>
              </div>
            </div>
          )}
          {reliability !== undefined && (
            <div className="flex items-center justify-between">
              <span>Reliability:</span>
              <div className="flex items-center space-x-1">
                {renderStars(reliability)}
                <span className="ml-1">{Number(reliability || 0).toFixed(1)}</span>
              </div>
            </div>
          )}
          {communication !== undefined && (
            <div className="flex items-center justify-between">
              <span>Communication:</span>
              <div className="flex items-center space-x-1">
                {renderStars(communication)}
                <span className="ml-1">{Number(communication || 0).toFixed(1)}</span>
              </div>
            </div>
          )}
          {care !== undefined && (
            <div className="flex items-center justify-between">
              <span>Care:</span>
              <div className="flex items-center space-x-1">
                {renderStars(care)}
                <span className="ml-1">{Number(care || 0).toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RatingDisplay;
