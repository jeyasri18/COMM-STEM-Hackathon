import React from 'react';

export function VerticalCarousel() {
  // List of images from your images folder
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
  
  // Create three columns with different starting positions
  const column1 = [images[0], images[3], images[6], images[9], images[2], images[5], images[8]];
  const column2 = [images[2], images[5], images[8], images[1], images[4], images[7], images[10]];
  const column3 = [images[4], images[7], images[10], images[0], images[3], images[6], images[9]];
  
  const CarouselColumn = ({ images, delay = 0 }) => {
    return (
      <div className="relative h-[600px] overflow-hidden">
        <div
          className="flex flex-col space-y-4 animate-scroll"
          style={{
            animation: `scroll 20s linear infinite`,
            animationDelay: `${delay}s`
          }}
        >
          {/* Duplicate images to create seamless loop */}
          {[...images, ...images, ...images].map((image, index) => (
            <div
              key={index}
              className="w-full h-[140px] rounded-xl overflow-hidden shadow-lg"
            >
              <img
                src={image}
                alt={`Fashion item ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex space-x-4 h-[600px]">
      <div className="flex-1">
        <CarouselColumn images={column1} delay={0} />
      </div>
      <div className="flex-1">
        <CarouselColumn images={column2} delay={-6.67} />
      </div>
      <div className="flex-1">
        <CarouselColumn images={column3} delay={-13.33} />
      </div>
    </div>
  );
}
