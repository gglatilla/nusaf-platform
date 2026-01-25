---
name: performance-optimization
description: Performance optimization patterns for B2B applications with large product catalogs and complex calculations. Use when optimizing database queries, API responses, frontend rendering, or caching strategies.
---

# Performance Optimization for B2B Applications

## Performance Requirements

B2B applications need to handle:
- **Thousands of SKUs** → Product listing must be fast
- **Complex pricing calculations** → Quote calculations must be instant
- **Large data tables** → Pagination and filtering must be responsive
- **PDF generation** → Quotes and invoices generated quickly

### Target Metrics

| Metric | Target | Critical |
|--------|--------|----------|
| API Response (simple) | < 100ms | < 500ms |
| API Response (complex) | < 500ms | < 2s |
| Page Load (initial) | < 2s | < 5s |
| Page Load (navigation) | < 500ms | < 1s |
| Search Results | < 300ms | < 1s |
| Pricing Calculation | < 100ms | < 500ms |
| PDF Generation | < 3s | < 10s |

---

## Database Optimization

### Indexing Strategy

```sql
-- Products table
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_search ON products USING gin(
  to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

-- Price list items (frequently queried)
CREATE INDEX idx_price_list_items_sku ON price_list_items(supplier_sku);
CREATE INDEX idx_price_list_items_list ON price_list_items(price_list_id);
CREATE INDEX idx_price_list_items_lookup ON price_list_items(price_list_id, supplier_sku);

-- Quotes
CREATE INDEX idx_quotes_company ON quotes(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_quotes_status ON quotes(status, created_at DESC);
CREATE INDEX idx_quotes_number ON quotes(quote_number);

-- Audit queries
CREATE INDEX idx_quotes_created ON quotes(created_at DESC);
```

### Query Optimization

```typescript
// ❌ N+1 query problem
const quotes = await prisma.quote.findMany();
for (const quote of quotes) {
  const items = await prisma.quoteItem.findMany({
    where: { quoteId: quote.id }
  });
  // ...
}

// ✅ Use includes
const quotes = await prisma.quote.findMany({
  include: {
    items: true,
    company: {
      select: { id: true, name: true }
    }
  }
});
```

```typescript
// ❌ Loading all fields
const products = await prisma.product.findMany();

// ✅ Select only needed fields
const products = await prisma.product.findMany({
  select: {
    id: true,
    sku: true,
    name: true,
    listPrice: true,
    status: true,
  }
});
```

### Pagination

```typescript
// ❌ Offset pagination for large datasets (slow)
const products = await prisma.product.findMany({
  skip: page * pageSize,  // Gets slower as page increases
  take: pageSize,
});

// ✅ Cursor pagination for large datasets
const products = await prisma.product.findMany({
  take: pageSize,
  cursor: lastProductId ? { id: lastProductId } : undefined,
  skip: lastProductId ? 1 : 0,  // Skip cursor item
  orderBy: { id: 'asc' },
});
```

### Batch Operations

```typescript
// ❌ Individual inserts (slow)
for (const item of items) {
  await prisma.priceListItem.create({ data: item });
}

// ✅ Batch insert
await prisma.priceListItem.createMany({
  data: items,
  skipDuplicates: true,
});

// For updates, use transactions
await prisma.$transaction(
  items.map(item =>
    prisma.priceListItem.update({
      where: { id: item.id },
      data: item,
    })
  )
);
```

---

## Caching Strategy

### Cache Layers

```
┌─────────────────────────────────────┐
│          Browser Cache              │
│    (Static assets, API responses)   │
├─────────────────────────────────────┤
│           CDN Cache                 │
│     (Cloudflare - static files)     │
├─────────────────────────────────────┤
│        Application Cache            │
│     (Redis - computed data)         │
├─────────────────────────────────────┤
│         Database Cache              │
│    (Query result caching)           │
└─────────────────────────────────────┘
```

### Redis Caching

```typescript
// utils/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

interface CacheOptions {
  ttl?: number;  // seconds
  tags?: string[];
}

export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 300 } = options;  // Default 5 minutes
  
  // Try cache first
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Execute function
  const result = await fn();
  
  // Store in cache
  await redis.setex(key, ttl, JSON.stringify(result));
  
  return result;
}

export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

### What to Cache

```typescript
// ✅ Good candidates for caching
const exchangeRates = await cached(
  'exchange-rates:EUR:ZAR',
  () => fetchExchangeRates('EUR', 'ZAR'),
  { ttl: 3600 }  // 1 hour
);

const productCategories = await cached(
  'categories:tree',
  () => buildCategoryTree(),
  { ttl: 86400 }  // 24 hours - rarely changes
);

const supplierPriceList = await cached(
  `price-list:${supplierId}:current`,
  () => getCurrentPriceList(supplierId),
  { ttl: 300 }  // 5 minutes
);

// ❌ Don't cache
// - User-specific data (session, cart)
// - Rapidly changing data (inventory counts)
// - Large datasets that vary by query
```

### Cache Invalidation

```typescript
// Invalidate when data changes
class PriceListService {
  async publishPriceList(priceListId: string): Promise<void> {
    const priceList = await this.repo.findById(priceListId);
    
    // Update database
    await this.repo.update(priceListId, { status: 'PUBLISHED' });
    
    // Invalidate related caches
    await invalidateCache(`price-list:${priceList.supplierId}:*`);
    await invalidateCache(`products:${priceList.supplierId}:*`);
    await invalidateCache('pricing:*');
  }
}
```

---

## API Optimization

### Response Compression

```typescript
import compression from 'compression';

app.use(compression({
  threshold: 1024,  // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
}));
```

### Efficient Serialization

```typescript
// ❌ Over-fetching data
app.get('/api/products', async (req, res) => {
  const products = await prisma.product.findMany({
    include: {
      supplier: true,
      category: true,
      priceHistory: true,  // Unnecessary for list view
      images: true,        // May have large URLs
    },
  });
  res.json(products);
});

// ✅ Lean responses
app.get('/api/products', async (req, res) => {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      listPrice: true,
      status: true,
      category: {
        select: { id: true, name: true }
      },
    },
  });
  res.json(products);
});
```

### Pagination Metadata

```typescript
// Return pagination info efficiently
async function getPaginatedProducts(page: number, pageSize: number) {
  // Run count and data queries in parallel
  const [total, data] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.product.findMany({
      where: { deletedAt: null },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  
  return {
    data,
    pagination: {
      page,
      pageSize,
      totalItems: total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
```

---

## Frontend Optimization

### Code Splitting

```typescript
// Next.js dynamic imports
import dynamic from 'next/dynamic';

// ✅ Lazy load heavy components
const ProductConfigurator = dynamic(
  () => import('@/components/features/Configurator'),
  {
    loading: () => <ConfiguratorSkeleton />,
    ssr: false,  // Client-only component
  }
);

const PriceListImporter = dynamic(
  () => import('@/components/features/PriceListImporter'),
  { loading: () => <ImporterSkeleton /> }
);
```

### Data Fetching

```typescript
// hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
    
    // Caching options
    staleTime: 5 * 60 * 1000,      // Consider fresh for 5 minutes
    cacheTime: 30 * 60 * 1000,     // Keep in cache for 30 minutes
    
    // Don't refetch on window focus for list data
    refetchOnWindowFocus: false,
  });
}

// Prefetch next page
export function useProductsWithPrefetch(filters: ProductFilters) {
  const queryClient = useQueryClient();
  const query = useProducts(filters);
  
  // Prefetch next page
  useEffect(() => {
    if (query.data?.pagination.page < query.data?.pagination.totalPages) {
      queryClient.prefetchQuery({
        queryKey: ['products', { ...filters, page: filters.page + 1 }],
        queryFn: () => fetchProducts({ ...filters, page: filters.page + 1 }),
      });
    }
  }, [query.data?.pagination.page]);
  
  return query;
}
```

### Virtual Lists for Large Tables

```typescript
// For tables with 1000+ rows
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualProductTable({ products }: { products: Product[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,  // Row height
    overscan: 10,  // Render 10 extra rows
  });
  
  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ProductRow product={products[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Debounced Search

```typescript
// hooks/useDebouncedSearch.ts
import { useState, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export function useDebouncedSearch(initialValue: string = '') {
  const [inputValue, setInputValue] = useState(initialValue);
  const [searchValue, setSearchValue] = useState(initialValue);
  
  const debouncedSetSearch = useDebouncedCallback(
    (value: string) => setSearchValue(value),
    300  // 300ms debounce
  );
  
  const handleChange = (value: string) => {
    setInputValue(value);
    debouncedSetSearch(value);
  };
  
  return {
    inputValue,
    searchValue,
    handleChange,
  };
}

// Usage
function ProductSearch() {
  const { inputValue, searchValue, handleChange } = useDebouncedSearch();
  const { data, isLoading } = useProducts({ search: searchValue });
  
  return (
    <div>
      <Input
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search products..."
      />
      {isLoading && <Spinner />}
      <ProductList products={data?.products} />
    </div>
  );
}
```

---

## Background Processing

### Async Operations

```typescript
// Don't block API responses with slow operations
class PriceListService {
  async importPriceList(file: Buffer, supplierId: string): Promise<ImportJob> {
    // Create job record
    const job = await prisma.importJob.create({
      data: {
        type: 'PRICE_LIST',
        status: 'PENDING',
        supplierId,
      },
    });
    
    // Queue for background processing
    await queue.add('import-price-list', {
      jobId: job.id,
      supplierId,
      filePath: await this.saveFile(file, job.id),
    });
    
    // Return immediately
    return job;
  }
}

// Background worker
queue.process('import-price-list', async (job) => {
  const { jobId, supplierId, filePath } = job.data;
  
  await prisma.importJob.update({
    where: { id: jobId },
    data: { status: 'PROCESSING' },
  });
  
  try {
    const result = await processImport(supplierId, filePath);
    
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        result: result,
      },
    });
  } catch (error) {
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error: error.message,
      },
    });
  }
});
```

### PDF Generation Optimization

```typescript
// Generate PDFs in background for large batches
class PdfGenerationService {
  async generateBatchInvoices(invoiceIds: string[]): Promise<void> {
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < invoiceIds.length; i += BATCH_SIZE) {
      const batch = invoiceIds.slice(i, i + BATCH_SIZE);
      
      // Process batch in parallel
      await Promise.all(
        batch.map(id => this.generateAndStore(id))
      );
      
      // Small delay between batches
      await this.delay(100);
    }
  }
}
```

---

## Pricing Calculation Optimization

### Memoization

```typescript
// Cache calculated prices during a request
class PriceCalculator {
  private cache = new Map<string, CalculatedPrice>();
  
  async calculatePrice(
    sku: string,
    quantity: number,
    customerId?: string
  ): Promise<CalculatedPrice> {
    const cacheKey = `${sku}:${quantity}:${customerId || 'default'}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    const price = await this.doCalculation(sku, quantity, customerId);
    this.cache.set(cacheKey, price);
    
    return price;
  }
  
  // Clear cache after request
  clearCache() {
    this.cache.clear();
  }
}
```

### Pre-calculated Prices

```typescript
// For frequently accessed products, pre-calculate list prices
model Product {
  // ... other fields
  
  // Pre-calculated prices (updated when rules change)
  calculatedListPrice  Decimal? @map("calculated_list_price")
  priceCalculatedAt    DateTime? @map("price_calculated_at")
}

// Background job to recalculate prices
async function recalculatePrices(): Promise<void> {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { priceCalculatedAt: null },
        { priceCalculatedAt: { lt: lastRuleChange } },
      ],
    },
    take: 100,
  });
  
  for (const product of products) {
    const price = await calculator.calculateListPrice(product.sku);
    
    await prisma.product.update({
      where: { id: product.id },
      data: {
        calculatedListPrice: price,
        priceCalculatedAt: new Date(),
      },
    });
  }
}
```

---

## Monitoring Performance

### API Timing

```typescript
// middleware/timing.ts
export function timingMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1_000_000;  // ms
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request', {
        method: req.method,
        path: req.path,
        duration,
        statusCode: res.statusCode,
      });
    }
    
    // Send to metrics
    metrics.histogram('api_request_duration_ms', duration, {
      method: req.method,
      path: req.route?.path || req.path,
      status: String(res.statusCode),
    });
  });
  
  next();
}
```

### Database Query Timing

```typescript
// Enable Prisma query logging in development
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});

prisma.$on('query', (e) => {
  if (e.duration > 100) {  // Log queries > 100ms
    logger.warn('Slow query', {
      query: e.query,
      params: e.params,
      duration: e.duration,
    });
  }
});
```

---

## Checklist

### Database
- [ ] Indexes on all foreign keys
- [ ] Indexes on frequently filtered columns
- [ ] Full-text search index for product search
- [ ] N+1 queries eliminated
- [ ] Pagination implemented
- [ ] Batch operations for bulk updates

### API
- [ ] Response compression enabled
- [ ] Lean responses (no over-fetching)
- [ ] Caching for expensive operations
- [ ] Background jobs for slow operations

### Frontend
- [ ] Code splitting implemented
- [ ] React Query for data fetching
- [ ] Virtual lists for large tables
- [ ] Debounced search
- [ ] Prefetching for pagination

### Monitoring
- [ ] Request timing logged
- [ ] Slow queries identified
- [ ] Performance metrics collected
