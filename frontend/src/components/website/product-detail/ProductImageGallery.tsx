'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { PublicProductImage } from '@/lib/api';

interface ProductImageGalleryProps {
  images: PublicProductImage[];
  productTitle: string;
}

export function ProductImageGallery({ images, productTitle }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // No images - show placeholder
  if (images.length === 0) {
    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 aspect-square flex items-center justify-center">
        <div className="text-center">
          <Package className="h-24 w-24 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No images available</p>
        </div>
      </div>
    );
  }

  const selectedImage = images[selectedIndex];

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="relative aspect-square">
          <Image
            src={selectedImage.url}
            alt={selectedImage.altText || productTitle}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-4"
            priority
          />
        </div>

        {/* Navigation arrows for multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 text-slate-700" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 text-slate-700" />
            </button>
          </>
        )}

        {/* Image caption */}
        {selectedImage.caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
            <p className="text-white text-sm">{selectedImage.caption}</p>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                index === selectedIndex
                  ? 'border-primary-600'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              aria-label={`View image ${index + 1}`}
              aria-current={index === selectedIndex ? 'true' : undefined}
            >
              <Image
                src={image.thumbnailUrl || image.url}
                alt={image.altText || `${productTitle} - Image ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
