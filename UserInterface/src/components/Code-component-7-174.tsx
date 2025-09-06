import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import image1 from 'figma:asset/be00ac865822652c747a80c6323ce65e5db39e42.png';
import image2 from 'figma:asset/923aa1a325a40aca42b8379291b1146ee87930fd.png';
import image3 from 'figma:asset/92e7f69dc89dd76075b9e22ada1c87b5bd42e127.png';
import image4 from 'figma:asset/082af81f54b4390a2e8dd9ebb75cef3d6d28dc4b.png';
import image5 from 'figma:asset/e9205f6f42a3cc5b826952509409f20e86c19c9c.png';

export function VerticalCarousel() {
  const images = [image1, image2, image3, image4, image5];
  
  // Create three columns with different starting positions
  const column1 = [images[0], images[3], images[1], images[4], images[2]];
  const column2 = [images[2], images[0], images[4], images[1], images[3]];
  const column3 = [images[4], images[2], images[0], images[3], images[1]];
  
  const CarouselColumn = ({ images, delay = 0 }: { images: string[], delay?: number }) => {
    return (
      <div className="relative h-[600px] overflow-hidden">
        <motion.div
          className="flex flex-col space-y-4"
          animate={{
            y: [0, -1200], // Move from 0 to -1200px
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
            delay,
          }}
        >
          {/* Duplicate images to create seamless loop */}
          {[...images, ...images, ...images].map((image, index) => (
            <div
              key={index}
              className="w-full h-[140px] rounded-xl overflow-hidden shadow-lg bg-card"
            >
              <ImageWithFallback
                src={image}
                alt={`Fashion item ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </motion.div>
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