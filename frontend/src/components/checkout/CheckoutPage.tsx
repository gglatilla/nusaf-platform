'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingCart,
  MapPin,
  FileText,
  Truck,
  AlertCircle,
  CheckCircle,
  Upload,
  X,
} from 'lucide-react';
import { QuoteItemsTable } from '@/components/quotes/QuoteItemsTable';
import { AddressSelector } from './AddressSelector';
import { OrderSummary } from './OrderSummary';
import { useCheckout, useQuoteForCheckout, useCompanyShippingAddresses } from '@/hooks/useCheckout';
import { useUploadDocument } from '@/hooks/useDocuments';
import { formatCurrency } from '@/lib/formatting';

interface CheckoutPageProps {
  quoteId: string;
  portalType: 'staff' | 'customer';
}

const ACCEPTED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png,.webp';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function CheckoutPage({ quoteId, portalType }: CheckoutPageProps): JSX.Element {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data fetching
  const { data: quote, isLoading: quoteLoading, error: quoteError } = useQuoteForCheckout(quoteId);
  const { data: shippingAddresses, isLoading: addressesLoading } = useCompanyShippingAddresses(
    quote?.company?.id ?? null
  );

  // Form state
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [customerPoNumber, setCustomerPoNumber] = useState('');
  const [customerPoDate, setCustomerPoDate] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [poFile, setPoFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Submission state
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<{
    orderId: string;
    orderNumber: string;
    paymentRequired: boolean;
  } | null>(null);

  const checkout = useCheckout();
  const uploadDocument = useUploadDocument();

  // Auto-select default shipping address
  useEffect(() => {
    if (shippingAddresses && shippingAddresses.length > 0 && !selectedAddressId) {
      const defaultAddr = shippingAddresses.find((a) => a.isDefault);
      setSelectedAddressId(defaultAddr?.id ?? shippingAddresses[0].id);
    }
  }, [shippingAddresses, selectedAddressId]);

  // Pre-fill notes from quote
  useEffect(() => {
    if (quote?.customerNotes && !customerNotes) {
      setCustomerNotes(quote.customerNotes);
    }
  }, [quote, customerNotes]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setFileError('File must be under 10MB');
      return;
    }
    setPoFile(file);
  };

  const handleRemoveFile = (): void => {
    setPoFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitError(null);

    if (!customerPoNumber.trim()) {
      setSubmitError('PO number is required');
      return;
    }

    try {
      const result = await checkout.mutateAsync({
        quoteId,
        data: {
          shippingAddressId: selectedAddressId ?? undefined,
          customerPoNumber: customerPoNumber.trim(),
          customerPoDate: customerPoDate ? new Date(customerPoDate).toISOString() : null,
          requiredDate: requiredDate ? new Date(requiredDate).toISOString() : null,
          customerNotes: customerNotes.trim() || null,
        },
      });

      // Upload PO document if provided
      if (poFile && result.orderId) {
        try {
          await uploadDocument.mutateAsync({
            orderId: result.orderId,
            type: 'CUSTOMER_PO',
            file: poFile,
          });
        } catch {
          // Non-blocking — order was created successfully, PO upload failed
          console.error('PO document upload failed');
        }
      }

      setOrderResult({
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        paymentRequired: result.paymentRequired,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to place order');
    }
  };

  const backLink = portalType === 'staff' ? `/quotes/${quoteId}` : `/my/quotes/${quoteId}`;
  const orderLink = orderResult
    ? portalType === 'staff'
      ? `/orders/${orderResult.orderId}`
      : `/my/orders/${orderResult.orderId}`
    : '#';

  // Loading state
  if (quoteLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Error state
  if (quoteError || !quote) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Quote not found</h2>
        <p className="text-slate-500 mb-4">The quote could not be loaded or does not exist.</p>
        <Link href={backLink} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          Back to quote
        </Link>
      </div>
    );
  }

  // Quote must be CREATED to checkout
  if (quote.status !== 'CREATED') {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-400" />
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Cannot checkout this quote</h2>
        <p className="text-slate-500 mb-4">
          Only submitted quotes can be checked out. This quote is currently{' '}
          <span className="font-medium">{quote.status}</span>.
        </p>
        <Link href={backLink} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          Back to quote
        </Link>
      </div>
    );
  }

  // Success state — order created
  if (orderResult) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Order Created</h2>
        <p className="text-slate-600 mb-1">
          Order <span className="font-mono font-semibold">{orderResult.orderNumber}</span> has been created.
        </p>
        {orderResult.paymentRequired && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left max-w-md mx-auto">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">Payment Required</h3>
            <p className="text-sm text-amber-700 mb-2">
              A proforma invoice has been generated. Please arrange payment to proceed with fulfillment.
            </p>
            <p className="text-sm text-amber-700">
              <strong>Banking Details:</strong><br />
              Nusaf Dynamic Technologies (Pty) Ltd<br />
              FNB Business Account<br />
              Reference: {orderResult.orderNumber}
            </p>
          </div>
        )}
        <div className="mt-6">
          <Link
            href={orderLink}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors"
          >
            View Order
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href={backLink} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3">
          <ArrowLeft className="h-4 w-4" />
          Back to quote
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">Checkout</h1>
        <p className="text-sm text-slate-500 mt-1">
          Quote {quote.quoteNumber} &middot; {quote.items.length} {quote.items.length === 1 ? 'item' : 'items'} &middot; {formatCurrency(quote.total)}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content — 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Order Items */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50">
                <ShoppingCart className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-700">Order Items</h2>
              </div>
              <div className="p-4">
                <QuoteItemsTable
                  quoteId={quoteId}
                  items={quote.items}
                  isEditable={false}
                  isCustomer={portalType === 'customer'}
                />
              </div>
            </section>

            {/* Section 2: Shipping Address */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50">
                <MapPin className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-700">Shipping Address</h2>
              </div>
              <div className="p-4">
                <AddressSelector
                  addresses={shippingAddresses ?? []}
                  selectedId={selectedAddressId}
                  onSelect={setSelectedAddressId}
                  isLoading={addressesLoading}
                />
              </div>
            </section>

            {/* Section 3: Purchase Order */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50">
                <FileText className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-700">Purchase Order</h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="poNumber" className="block text-sm font-medium text-slate-700 mb-1">
                      PO Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="poNumber"
                      type="text"
                      value={customerPoNumber}
                      onChange={(e) => setCustomerPoNumber(e.target.value)}
                      placeholder="e.g. PO-2026-001"
                      maxLength={50}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="poDate" className="block text-sm font-medium text-slate-700 mb-1">
                      PO Date
                    </label>
                    <input
                      id="poDate"
                      type="date"
                      value={customerPoDate}
                      onChange={(e) => setCustomerPoDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* PO Document Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    PO Document
                  </label>
                  {poFile ? (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-md border border-slate-200">
                      <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 truncate">{poFile.name}</p>
                        <p className="text-xs text-slate-500">{(poFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 w-full p-3 border-2 border-dashed border-slate-200 rounded-md text-sm text-slate-500 hover:border-slate-300 hover:text-slate-600 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      Upload PO document (PDF, JPG, PNG — max 10MB)
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_FILE_TYPES}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {fileError && (
                    <p className="text-xs text-red-500 mt-1">{fileError}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Section 4: Delivery */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50">
                <Truck className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-700">Delivery</h2>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label htmlFor="requiredDate" className="block text-sm font-medium text-slate-700 mb-1">
                    Required Delivery Date
                  </label>
                  <input
                    id="requiredDate"
                    type="date"
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full sm:w-64 px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="customerNotes" className="block text-sm font-medium text-slate-700 mb-1">
                    Delivery Notes / Special Instructions
                  </label>
                  <textarea
                    id="customerNotes"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="e.g. Gate code: 1234, deliver Mon-Fri 8-5 only, call before delivery..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar — sticky summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <OrderSummary
                subtotal={quote.subtotal}
                vatRate={quote.vatRate}
                vatAmount={quote.vatAmount}
                total={quote.total}
                itemCount={quote.items.length}
              />

              {/* Submit error */}
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              )}

              {/* Place Order button */}
              <button
                type="submit"
                disabled={checkout.isPending || !customerPoNumber.trim()}
                className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {checkout.isPending ? 'Placing Order...' : 'Place Order'}
              </button>

              <p className="text-xs text-slate-400 text-center">
                By placing this order you accept the quoted prices and terms.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
