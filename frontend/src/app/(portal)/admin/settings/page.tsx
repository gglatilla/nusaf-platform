'use client';

import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { api, type GlobalSettings, ApiError } from '@/lib/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [eurZarRate, setEurZarRate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch current settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await api.getSettings();
        if (response.success && response.data) {
          setSettings(response.data);
          setEurZarRate(response.data.eurZarRate.toString());
        }
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to load settings';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, []);

  // Handle save
  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    const rate = parseFloat(eurZarRate);
    if (isNaN(rate) || rate <= 0) {
      setError('Please enter a valid positive number');
      return;
    }

    if (rate > 1000) {
      setError('Rate seems unreasonably high. Maximum is 1000.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.updateSettings({ eurZarRate: rate });
      if (response.success && response.data) {
        setSettings(response.data);
        setEurZarRate(response.data.eurZarRate.toString());
        setSuccess('Settings saved successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save settings';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if rate has changed
  const hasChanges = settings && parseFloat(eurZarRate) !== settings.eurZarRate;

  return (
    <>
      <PageHeader
        title="Global Settings"
        description="Configure system-wide settings for pricing and operations"
      />

      <div className="p-6 lg:p-8 max-w-2xl">
        {/* Loading state */}
        {isLoading && (
          <div className="bg-white border border-slate-200 rounded-lg p-8">
            <div className="flex items-center justify-center gap-3 text-slate-500">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Loading settings...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-700">{success}</p>
            </div>
          </div>
        )}

        {/* Settings form */}
        {!isLoading && (
          <div className="bg-white border border-slate-200 rounded-lg">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Exchange Rate</h2>
              <p className="text-sm text-slate-500 mt-1">
                Configure the EUR to ZAR exchange rate used for imported product pricing
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* EUR/ZAR Rate input */}
              <div>
                <label htmlFor="eurZarRate" className="block text-sm font-medium text-slate-700 mb-2">
                  EUR/ZAR Rate
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <input
                      type="number"
                      id="eurZarRate"
                      value={eurZarRate}
                      onChange={(e) => {
                        setEurZarRate(e.target.value);
                        setError(null);
                      }}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-md text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="20.50"
                    />
                  </div>
                  <span className="text-sm text-slate-500">ZAR per EUR</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  This rate is multiplied by the EUR price to get the base ZAR amount before margins
                </p>
              </div>

              {/* Last updated info */}
              {settings && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Last updated:</span>{' '}
                    {formatDate(settings.rateUpdatedAt)}
                    {settings.rateUpdatedBy && (
                      <span className="text-slate-500"> by Admin</span>
                    )}
                  </p>
                </div>
              )}

              {/* Pricing formula info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Pricing Formula</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>Supplier Price (EUR) × EUR/ZAR Rate × (1 + Freight%) ÷ Margin Divisor × 1.40 = List Price</p>
                  <p className="text-xs text-blue-600 mt-2">
                    Note: Pricing rules for supplier/category combinations must also be configured.
                  </p>
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
