'use client';

import { useAuthStore } from '@/stores/auth-store';
import { AuthGuard } from '@/components/auth/AuthGuard';

function DashboardContent() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-slate-900">
            Nusaf Portal
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {user?.firstName} {user?.lastName}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-slate-900 mb-4">
            Welcome, {user?.firstName}!
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-500">Company</h3>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {user?.company.name}
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-500">Tier</h3>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {user?.company.tier.replace('_', ' ')}
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-500">Role</h3>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {user?.role}
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm text-slate-500">
            This is a placeholder dashboard. More features coming soon.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
