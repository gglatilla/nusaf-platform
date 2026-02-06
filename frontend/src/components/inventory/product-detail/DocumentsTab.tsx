'use client';

import { ProductImageGallery } from '@/components/products/ProductImageGallery';
import { ProductDocumentsList, type ProductDocumentType } from '@/components/products/ProductDocumentsList';
import {
  useProductImages,
  useProductDocuments,
  useUploadProductImage,
  useSetPrimaryImage,
  useDeleteProductImage,
  useUploadProductDocument,
  useDeleteProductDocument,
} from '@/hooks/useProductMedia';

interface DocumentsTabProps {
  productId: string;
  canEdit: boolean;
}

export function DocumentsTab({ productId, canEdit }: DocumentsTabProps) {
  const { data: images = [] } = useProductImages(productId);
  const { data: documents = [] } = useProductDocuments(productId);
  const uploadImage = useUploadProductImage(productId);
  const setPrimary = useSetPrimaryImage(productId);
  const deleteImage = useDeleteProductImage(productId);
  const uploadDocument = useUploadProductDocument(productId);
  const deleteDocument = useDeleteProductDocument(productId);

  const handleUploadImage = async (file: File) => {
    await uploadImage.mutateAsync({ file });
  };

  const handleSetPrimary = async (imageId: string) => {
    await setPrimary.mutateAsync(imageId);
  };

  const handleDeleteImage = async (imageId: string) => {
    await deleteImage.mutateAsync(imageId);
  };

  const handleUploadDocument = async (file: File, type: ProductDocumentType, name: string) => {
    await uploadDocument.mutateAsync({ file, type, name });
  };

  const handleDeleteDocument = async (documentId: string) => {
    await deleteDocument.mutateAsync(documentId);
  };

  return (
    <div className="space-y-6">
      {/* Product Images */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Product Images</h2>
        <ProductImageGallery
          productId={productId}
          images={images}
          canEdit={canEdit}
          onUpload={handleUploadImage}
          onSetPrimary={handleSetPrimary}
          onDelete={handleDeleteImage}
        />
      </section>

      {/* Product Documents */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Documents</h2>
        <ProductDocumentsList
          productId={productId}
          documents={documents}
          canEdit={canEdit}
          onUpload={handleUploadDocument}
          onDelete={handleDeleteDocument}
        />
      </section>
    </div>
  );
}
