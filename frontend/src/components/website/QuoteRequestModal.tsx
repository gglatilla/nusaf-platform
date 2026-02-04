'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseButton,
} from '@/components/ui/dialog';
import { useGuestQuoteStore } from '@/stores/guest-quote-store';
import {
  FileUploadZone,
  UploadedFile,
  getAttachmentsFromFiles,
} from './FileUploadZone';

const quoteRequestSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  notes: z.string().max(2000, 'Message must be less than 2000 characters').optional(),
  website: z.string().optional(), // Honeypot field - must remain empty
});

type QuoteRequestFormData = z.infer<typeof quoteRequestSchema>;

interface QuoteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuoteRequestModal({ isOpen, onClose }: QuoteRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const { items, sessionId, clearBasket } = useGuestQuoteStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<QuoteRequestFormData>({
    resolver: zodResolver(quoteRequestSchema),
  });

  const onSubmit = async (data: QuoteRequestFormData) => {
    // Check if any files are still uploading
    const stillUploading = uploadedFiles.some((f) => f.status === 'uploading');
    if (stillUploading) {
      setSubmitError('Please wait for file uploads to complete');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Get attachment data from successfully uploaded files
      const attachments = getAttachmentsFromFiles(uploadedFiles);

      const response = await fetch('/api/v1/public/quote-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          companyName: data.companyName,
          email: data.email,
          phone: data.phone || null,
          notes: data.notes || null,
          website: data.website || '', // Honeypot
          cartData: {
            sessionId,
            items: items.map((item) => ({
              productId: item.productId,
              nusafSku: item.nusafSku,
              description: item.description,
              quantity: item.quantity,
            })),
          },
          // Include attachments if any were uploaded
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to submit quote request');
      }

      setIsSuccess(true);
      clearBasket();
      setUploadedFiles([]);
      reset();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setIsSuccess(false);
      setSubmitError(null);
      setUploadedFiles([]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isSuccess ? 'Quote Request Submitted' : 'Request a Quote'}</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>

        {isSuccess ? (
          <>
            <DialogBody>
              <div className="text-center py-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Thank you!</h3>
                <p className="text-slate-600">
                  Your quote request has been submitted successfully. Our team will review your
                  requirements and get back to you with pricing within 24 hours.
                </p>
              </div>
            </DialogBody>
            <DialogFooter>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Continue Browsing
              </button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogBody>
              {/* Cart Summary */}
              {items.length > 0 && (
                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Items in your quote ({items.length}):
                  </p>
                  <ul className="space-y-1 text-sm text-slate-600">
                    {items.slice(0, 3).map((item) => (
                      <li key={item.productId} className="flex justify-between">
                        <span className="truncate mr-2">{item.nusafSku}</span>
                        <span className="text-slate-500">×{item.quantity}</span>
                      </li>
                    ))}
                    {items.length > 3 && (
                      <li className="text-slate-500">+{items.length - 3} more items</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register('name')}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Your full name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                {/* Company */}
                <div>
                  <label
                    htmlFor="companyName"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Company <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    {...register('companyName')}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Your company name"
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-500">{errors.companyName.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="your.email@company.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone (optional) */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                    Phone <span className="text-slate-400">(optional)</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    {...register('phone')}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="+27 00 000 0000"
                  />
                </div>

                {/* Notes (optional) */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
                    Message <span className="text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    {...register('notes')}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    placeholder="Any additional requirements or questions..."
                  />
                  {errors.notes && (
                    <p className="mt-1 text-sm text-red-500">{errors.notes.message}</p>
                  )}
                </div>

                {/* File Attachments (optional) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Attachments <span className="text-slate-400">(optional)</span>
                  </label>
                  <FileUploadZone
                    files={uploadedFiles}
                    onFilesChange={setUploadedFiles}
                    sessionId={sessionId}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Honeypot field - hidden from users, visible to bots */}
                <div className="absolute -left-[9999px] opacity-0 pointer-events-none" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    type="text"
                    {...register('website')}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {/* Submit Error */}
                {submitError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{submitError}</p>
                  </div>
                )}
              </div>
            </DialogBody>

            <DialogFooter>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
