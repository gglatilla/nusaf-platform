'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X, RefreshCw, Plus, Shield, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseButton,
} from '@/components/ui/dialog';
import {
  api,
  type StaffUserListItem,
  type StaffRole,
  ApiError,
} from '@/lib/api';
import { formatDateTime } from '@/lib/formatting';

const STAFF_ROLES: { value: StaffRole; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'SALES', label: 'Sales' },
  { value: 'PURCHASER', label: 'Purchaser' },
  { value: 'WAREHOUSE', label: 'Warehouse' },
];

const ROLE_LABELS: Record<StaffRole, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  SALES: 'Sales',
  PURCHASER: 'Purchaser',
  WAREHOUSE: 'Warehouse',
};

function RoleBadge({ role }: { role: StaffRole }): JSX.Element {
  const colors: Record<StaffRole, string> = {
    ADMIN: 'bg-purple-100 text-purple-800',
    MANAGER: 'bg-blue-100 text-blue-800',
    SALES: 'bg-emerald-100 text-emerald-800',
    PURCHASER: 'bg-amber-100 text-amber-800',
    WAREHOUSE: 'bg-slate-100 text-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[role] || 'bg-slate-100 text-slate-700'}`}
    >
      {ROLE_LABELS[role] || role}
    </span>
  );
}

export default function StaffUsersPage(): JSX.Element {
  const [users, setUsers] = useState<StaffUserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRole | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUserListItem | null>(null);

  const fetchUsers = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getStaffUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        page,
        pageSize: 20,
      });
      if (response.success && response.data) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.totalPages);
        setTotal(response.data.pagination.total);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load users';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleClearSearch = (): void => {
    setSearch('');
    setPage(1);
  };

  const handleEdit = (user: StaffUserListItem): void => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleCreate = (): void => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleModalClose = (): void => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleSaved = (message: string): void => {
    handleModalClose();
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-slate-400" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Staff Users</h1>
            <p className="text-sm text-slate-600">
              Manage staff accounts, roles, and access
            </p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10 py-2 w-72 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </form>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as StaffRole | '');
            setPage(1);
          }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Roles</option>
          {STAFF_ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <span className="text-sm text-slate-500">
          {total} {total === 1 ? 'user' : 'users'}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center gap-3 text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading users...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleEdit(user)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {user.firstName} {user.lastName}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                      {user.employeeCode || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {user.primaryWarehouse || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {user.company.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          user.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50">
            <span className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <UserFormModal
        open={showModal}
        onOpenChange={(open) => {
          if (!open) handleModalClose();
        }}
        user={editingUser}
        onSaved={handleSaved}
      />
    </div>
  );
}

// ---------- Create / Edit User Modal ----------

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: StaffUserListItem | null; // null = create mode
  onSaved: (message: string) => void;
}

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: StaffRole;
  employeeCode: string;
  primaryWarehouse: '' | 'JHB' | 'CT';
  isActive: boolean;
}

function UserFormModal({ open, onOpenChange, user, onSaved }: UserFormModalProps): JSX.Element {
  const isEdit = user !== null;

  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'SALES',
    employeeCode: '',
    primaryWarehouse: '',
    isActive: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: '',
        role: user.role,
        employeeCode: user.employeeCode || '',
        primaryWarehouse: (user.primaryWarehouse as '' | 'JHB' | 'CT') || '',
        isActive: user.isActive,
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'SALES',
        employeeCode: '',
        primaryWarehouse: '',
        isActive: true,
      });
    }
    setFormError(null);
    setShowPassword(false);
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      if (isEdit) {
        const updateData: Record<string, unknown> = {};
        if (formData.firstName !== user.firstName) updateData.firstName = formData.firstName;
        if (formData.lastName !== user.lastName) updateData.lastName = formData.lastName;
        if (formData.role !== user.role) updateData.role = formData.role;
        if (formData.employeeCode !== (user.employeeCode || '')) {
          updateData.employeeCode = formData.employeeCode || null;
        }
        if (formData.primaryWarehouse !== (user.primaryWarehouse || '')) {
          updateData.primaryWarehouse = formData.primaryWarehouse || null;
        }
        if (formData.isActive !== user.isActive) updateData.isActive = formData.isActive;
        if (formData.password) updateData.password = formData.password;

        await api.updateStaffUser(user.id, updateData as Parameters<typeof api.updateStaffUser>[1]);
        onSaved('User updated');
      } else {
        if (!formData.email.trim()) {
          setFormError('Email is required');
          setSaving(false);
          return;
        }
        if (!formData.password) {
          setFormError('Password is required for new users');
          setSaving(false);
          return;
        }

        await api.createStaffUser({
          email: formData.email.trim(),
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          role: formData.role,
          employeeCode: formData.employeeCode || undefined,
          primaryWarehouse: formData.primaryWarehouse as 'JHB' | 'CT' | undefined || undefined,
        });
        onSaved('User created');
      }
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof UserFormData>(field: K, value: UserFormData[K]): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit User' : 'Add Staff User'}</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <div className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              {/* Email (read-only in edit mode) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  disabled={isEdit}
                  className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    isEdit ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''
                  }`}
                  required={!isEdit}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password {!isEdit && <span className="text-red-500">*</span>}
                  {isEdit && <span className="text-slate-400 font-normal"> (leave blank to keep current)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder={isEdit ? 'Leave blank to keep current' : 'Min 8 characters'}
                    minLength={formData.password ? 8 : undefined}
                    className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required={!isEdit}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Role + Employee Code */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => updateField('role', e.target.value as StaffRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {STAFF_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Employee Code
                  </label>
                  <input
                    type="text"
                    value={formData.employeeCode}
                    onChange={(e) => updateField('employeeCode', e.target.value)}
                    placeholder="e.g. NDT-001"
                    maxLength={20}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Warehouse */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Primary Warehouse
                </label>
                <select
                  value={formData.primaryWarehouse}
                  onChange={(e) => updateField('primaryWarehouse', e.target.value as '' | 'JHB' | 'CT')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Not assigned</option>
                  <option value="JHB">Johannesburg</option>
                  <option value="CT">Cape Town</option>
                </select>
              </div>

              {/* Active toggle (only for edit) */}
              {isEdit && (
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Account Active</p>
                    <p className="text-xs text-slate-500">Inactive users cannot log in</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.isActive}
                    onClick={() => updateField('isActive', !formData.isActive)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                      formData.isActive ? 'bg-primary-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formData.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
