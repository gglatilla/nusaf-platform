'use client';

import { useState, useRef } from 'react';
import { Upload, Star, Trash2, ImageIcon, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Image type matching backend ProductImage model
export interface ProductImage {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  caption: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

interface ProductImageGalleryProps {
  productId: string;
  images: ProductImage[];
  canEdit: boolean;
  onUpload?: (file: File) => Promise<void>;
  onSetPrimary?: (imageId: string) => Promise<void>;
  onDelete?: (imageId: string) => Promise<void>;
  onReorder?: (imageIds: string[]) => Promise<void>;
  isUploading?: boolean;
}

export function ProductImageGallery({
  productId,
  images,
  canEdit,
  onUpload,
  onSetPrimary,
  onDelete,
  onReorder,
  isUploading,
}: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sort images by sortOrder, primary first
  const sortedImages = [...images].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return a.sortOrder - b.sortOrder;
  });

  const primaryImage = sortedImages.find((img) => img.isPrimary) || sortedImages[0];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      await onUpload(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    if (!onSetPrimary) return;
    setSettingPrimaryId(imageId);
    try {
      await onSetPrimary(imageId);
    } finally {
      setSettingPrimaryId(null);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!onDelete) return;
    setDeletingId(imageId);
    try {
      await onDelete(imageId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Image Display */}
      <div className="aspect-square bg-slate-50 rounded-lg border border-slate-200 overflow-hidden relative">
        {primaryImage ? (
          <>
            <img
              src={primaryImage.url}
              alt={primaryImage.altText || 'Product image'}
              className="w-full h-full object-contain"
            />
            {primaryImage.isPrimary && (
              <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                Primary
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
            <ImageIcon className="h-16 w-16 mb-2" />
            <p className="text-sm">No images</p>
          </div>
        )}
      </div>

      {/* Thumbnail Grid */}
      {sortedImages.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {sortedImages.map((image) => (
            <button
              key={image.id}
              onClick={() => setSelectedImage(image)}
              className={cn(
                'aspect-square rounded-lg border-2 overflow-hidden relative group',
                image.isPrimary ? 'border-amber-500' : 'border-transparent hover:border-slate-300'
              )}
            >
              <img
                src={image.thumbnailUrl || image.url}
                alt={image.altText || 'Product thumbnail'}
                className="w-full h-full object-cover"
              />
              {image.isPrimary && (
                <div className="absolute top-1 left-1">
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                </div>
              )}
              {canEdit && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  {!image.isPrimary && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetPrimary(image.id);
                      }}
                      disabled={settingPrimaryId === image.id}
                      className="p-1.5 bg-white rounded-full hover:bg-amber-100 disabled:opacity-50"
                      title="Set as primary"
                    >
                      {settingPrimaryId === image.id ? (
                        <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
                      ) : (
                        <Star className="h-3 w-3 text-amber-600" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(image.id);
                    }}
                    disabled={deletingId === image.id}
                    className="p-1.5 bg-white rounded-full hover:bg-red-100 disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === image.id ? (
                      <Loader2 className="h-3 w-3 animate-spin text-red-600" />
                    ) : (
                      <Trash2 className="h-3 w-3 text-red-600" />
                    )}
                  </button>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {canEdit && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-600 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Image
              </>
            )}
          </button>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={selectedImage.url}
              alt={selectedImage.altText || 'Product image'}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {selectedImage.caption && (
              <p className="text-white text-center mt-4">{selectedImage.caption}</p>
            )}
            {canEdit && (
              <div className="flex justify-center gap-3 mt-4">
                {!selectedImage.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(selectedImage.id)}
                    disabled={settingPrimaryId === selectedImage.id}
                    className="px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-100 flex items-center gap-2 disabled:opacity-50"
                  >
                    {settingPrimaryId === selectedImage.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Star className="h-4 w-4" />
                    )}
                    Set as Primary
                  </button>
                )}
                <button
                  onClick={() => {
                    handleDelete(selectedImage.id);
                    setSelectedImage(null);
                  }}
                  disabled={deletingId === selectedImage.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
                >
                  {deletingId === selectedImage.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
