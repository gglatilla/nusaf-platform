---
name: ui-component-system
description: UI component architecture and design system patterns for B2B applications. Use when creating reusable components, establishing design tokens, building forms, tables, or complex UI interactions.
---

# UI Component System for B2B Applications

## Overview

B2B applications need robust, accessible, data-dense UIs:
- Complex forms and data entry
- Large data tables with sorting/filtering
- Multi-step workflows
- Configuration interfaces
- Dashboard views

---

## Technology Stack

### Recommended Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js (App Router) | React framework |
| Styling | Tailwind CSS | Utility-first CSS |
| Components | shadcn/ui | Accessible primitives |
| Forms | React Hook Form + Zod | Form state & validation |
| Tables | TanStack Table | Headless table logic |
| State | Zustand | Global state |
| Data | TanStack Query | Server state |
| Icons | Lucide React | Consistent icons |

---

## Design Tokens

### Colors

```typescript
// tailwind.config.ts
const colors = {
  // Brand
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a8a',
  },
  
  // Semantic
  success: {
    light: '#dcfce7',
    DEFAULT: '#22c55e',
    dark: '#15803d',
  },
  warning: {
    light: '#fef9c3',
    DEFAULT: '#eab308',
    dark: '#a16207',
  },
  error: {
    light: '#fee2e2',
    DEFAULT: '#ef4444',
    dark: '#b91c1c',
  },
  
  // Neutral (for data-dense UIs)
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};
```

### Typography

```typescript
const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
  },
};
```

### Spacing

```typescript
// Use Tailwind defaults: 4px base unit
// p-1 = 4px, p-2 = 8px, p-4 = 16px, etc.

const spacing = {
  page: 'px-6 py-4',        // Page padding
  card: 'p-4',              // Card padding
  section: 'space-y-4',     // Section spacing
  form: 'space-y-6',        // Form field spacing
  inline: 'space-x-2',      // Inline element spacing
};
```

---

## Component Architecture

### Folder Structure

```
/components
├── ui/                     # Base primitives (shadcn/ui)
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── table.tsx
│   ├── dialog.tsx
│   ├── toast.tsx
│   └── index.ts
│
├── forms/                  # Form components
│   ├── FormField.tsx
│   ├── FormSelect.tsx
│   ├── FormCombobox.tsx
│   ├── FormDatePicker.tsx
│   └── index.ts
│
├── data/                   # Data display
│   ├── DataTable/
│   │   ├── DataTable.tsx
│   │   ├── DataTablePagination.tsx
│   │   ├── DataTableFilters.tsx
│   │   └── columns/
│   ├── StatCard.tsx
│   ├── KeyValue.tsx
│   └── Badge.tsx
│
├── layout/                 # Layout components
│   ├── PageHeader.tsx
│   ├── PageContent.tsx
│   ├── Sidebar.tsx
│   └── Breadcrumbs.tsx
│
├── features/               # Feature-specific
│   ├── configurator/
│   ├── pricing/
│   └── quotes/
│
└── index.ts
```

### Component File Pattern

```typescript
// components/ui/Button.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-700',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
        outline: 'border border-gray-300 bg-white hover:bg-gray-50',
        ghost: 'hover:bg-gray-100',
        danger: 'bg-error text-white hover:bg-error-dark',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="mr-2 h-4 w-4 animate-spin" /* spinner */ />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
```

---

## Form Components

### Form Field Pattern

```typescript
// components/forms/FormField.tsx
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'number' | 'password';
  required?: boolean;
  description?: string;
}

export function FormField({
  name,
  label,
  placeholder,
  type = 'text',
  required,
  description,
}: FormFieldProps) {
  const { control, formState: { errors } } = useFormContext();
  const error = errors[name];

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="flex items-center gap-1">
        {label}
        {required && <span className="text-error">*</span>}
      </Label>
      
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            id={name}
            type={type}
            placeholder={placeholder}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : undefined}
            className={cn(error && 'border-error focus:ring-error')}
          />
        )}
      />
      
      {description && !error && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      
      {error && (
        <p id={`${name}-error`} className="text-sm text-error">
          {error.message as string}
        </p>
      )}
    </div>
  );
}
```

### Form Container Pattern

```typescript
// Usage pattern for forms
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be positive'),
});

type FormData = z.infer<typeof schema>;

export function ProductForm({ onSubmit }: Props) {
  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      sku: '',
      name: '',
      price: 0,
    },
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <FormField name="sku" label="SKU" required />
        <FormField name="name" label="Product Name" required />
        <FormField name="price" label="Price" type="number" required />
        
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline">Cancel</Button>
          <Button type="submit" isLoading={methods.formState.isSubmitting}>
            Save Product
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
```

---

## Data Tables

### TanStack Table Setup

```typescript
// components/data/DataTable/DataTable.tsx
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T>({ 
  data, 
  columns, 
  isLoading,
  pagination,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: !!pagination,
    pageCount: pagination 
      ? Math.ceil(pagination.totalItems / pagination.pageSize) 
      : undefined,
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead 
                  key={header.id}
                  className={cn(
                    header.column.getCanSort() && 'cursor-pointer select-none'
                  )}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {header.column.getIsSorted() && (
                    <span className="ml-2">
                      {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results found
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {pagination && (
        <DataTablePagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}
```

### Column Definitions

```typescript
// Example columns for products table
const productColumns: ColumnDef<Product>[] = [
  {
    accessorKey: 'sku',
    header: 'SKU',
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.getValue('sku')}</span>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Product Name',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue('name')}</div>
        <div className="text-sm text-gray-500">{row.original.category}</div>
      </div>
    ),
  },
  {
    accessorKey: 'price',
    header: () => <div className="text-right">Price</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono">
        {formatCurrency(row.getValue('price'))}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.getValue('status') === 'active' ? 'success' : 'secondary'}>
        {row.getValue('status')}
      </Badge>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-error">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
```

---

## Layout Components

### Page Layout

```typescript
// components/layout/PageHeader.tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function PageHeader({ 
  title, 
  description, 
  actions,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <div className="border-b bg-white px-6 py-4">
      {breadcrumbs && (
        <Breadcrumbs items={breadcrumbs} className="mb-2" />
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// Usage
<PageHeader
  title="Products"
  description="Manage your product catalog"
  breadcrumbs={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Products' },
  ]}
  actions={
    <>
      <Button variant="outline">Export</Button>
      <Button>Add Product</Button>
    </>
  }
/>
```

### Card Component

```typescript
// components/ui/Card.tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-white shadow-sm',
        {
          'p-0': padding === 'none',
          'p-3': padding === 'sm',
          'p-4': padding === 'md',
          'p-6': padding === 'lg',
        },
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4 flex items-center justify-between', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold">{children}</h3>;
}
```

---

## Loading States

### Skeleton Components

```typescript
// components/ui/Skeleton.tsx
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded bg-gray-200', className)} />
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Card skeleton
export function CardSkeleton() {
  return (
    <Card>
      <Skeleton className="mb-4 h-6 w-1/3" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </Card>
  );
}
```

---

## Accessibility Checklist

### Every Component Should Have

- [ ] Proper semantic HTML
- [ ] Keyboard navigation
- [ ] Focus indicators
- [ ] ARIA labels where needed
- [ ] Color contrast compliance
- [ ] Screen reader support

### Forms

- [ ] Labels linked to inputs
- [ ] Error messages associated with fields
- [ ] Required field indicators
- [ ] Clear focus order

### Tables

- [ ] Proper table markup
- [ ] Sortable column indicators
- [ ] Row selection announcements
- [ ] Pagination announcements

### Modals/Dialogs

- [ ] Focus trap
- [ ] Escape to close
- [ ] Focus return on close
- [ ] Descriptive title

---

## Component Checklist

When creating new components:

- [ ] TypeScript props interface
- [ ] Default values for optional props
- [ ] Proper forwarding of className
- [ ] Proper forwarding of ref (when needed)
- [ ] Loading state handling
- [ ] Error state handling
- [ ] Empty state handling
- [ ] Accessibility attributes
- [ ] Keyboard support
- [ ] Mobile responsiveness
