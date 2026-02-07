'use client';

import { useState } from 'react';
import { User, Building, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { api, ApiError } from '@/lib/api';

const TIER_LABELS: Record<string, string> = {
  END_USER: 'End User',
  OEM: 'OEM / Reseller',
  DISTRIBUTOR: 'Distributor',
};

export default function CustomerAccountPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!user) {
    return null;
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setSuccessMessage('Password changed successfully. You will be logged out.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Log out after short delay so user sees the success message
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Account</h1>
        <p className="mt-1 text-sm text-slate-500">
          View your profile and manage your password
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100">
              <User className="h-5 w-5 text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              Profile Information
            </h2>
          </div>

          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Name
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {user.firstName} {user.lastName}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Email
              </dt>
              <dd className="mt-1 text-sm text-slate-900">{user.email}</dd>
            </div>
          </dl>
        </div>

        {/* Company Information */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100">
              <Building className="h-5 w-5 text-slate-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              Company Information
            </h2>
          </div>

          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Company Name
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {user.company.name}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Account Type
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {TIER_LABELS[user.company.tier] || user.company.tier}
              </dd>
            </div>
          </dl>
        </div>

        {/* Change Password */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
              <Lock className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              Change Password
            </h2>
          </div>

          {successMessage && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Must be at least 8 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="h-4 w-4" />
              {isSubmitting ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
