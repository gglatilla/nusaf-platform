// User types

export type UserRole = 'admin' | 'manager' | 'sales' | 'customer';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  companyId: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
}
