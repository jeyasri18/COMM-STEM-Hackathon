import React, { useState, useEffect } from 'react';

export function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // List of images from the images folder
  const images = [
    '/images/IMG_4889.jpg',
    '/images/IMG_4890.jpg',
    '/images/IMG_4891.jpg',
    '/images/IMG_4892.jpg',
    '/images/IMG_4895.jpg',
    '/images/IMG_4896.jpg',
    '/images/IMG_4897.jpg',
    '/images/IMG_4899.jpg',
    '/images/IMG_4900.jpg',
    '/images/IMG_4901.jpg',
    '/images/IMG_4903.jpg',
  ];

  // Auto-rotate images every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-3xl">
      {/* Main image display */}
      <div className="relative w-full h-96">
        <img
          src={images[currentIndex]}
          alt={`Fashion item ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        {/* Image counter */}
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                index === currentIndex 
                  ? 'border-primary shadow-lg scale-110' 
                  : 'border-transparent hover:border-primary/50'
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={() => setCurrentIndex((prevIndex) => 
          prevIndex === 0 ? images.length - 1 : prevIndex - 1
        )}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <button
        onClick={() => setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
