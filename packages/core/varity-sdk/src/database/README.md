# Varity Database Module

Zero-configuration database API for Varity applications. Build real-world apps with persistent data storage - no database setup required.

## Quick Start

```typescript
import { db } from '@varity/sdk';

// That's it! No configuration needed.
// Credentials are automatically injected by Varity CLI during deployment.
```

## Basic Usage

### Insert Documents

```typescript
import { db } from '@varity/sdk';

// Add a product
const product = await db.collection('products').add({
  name: 'T-Shirt',
  price: 29.99,
  stock: 100,
  category: 'apparel'
});

console.log(product.id); // Auto-generated UUID
console.log(product.created_at); // Auto-generated timestamp
```

### Query Documents

```typescript
// Get all products
const allProducts = await db.collection('products').get();

// Get with pagination
const page1 = await db.collection('products').get({
  limit: 10,
  offset: 0
});

// Get with ordering (coming in v1.1)
const sortedProducts = await db.collection('products').get({
  orderBy: '-price' // Descending by price
});
```

### Update Documents

```typescript
await db.collection('products').update(productId, {
  price: 24.99,
  stock: 95
});
```

### Delete Documents

```typescript
await db.collection('products').delete(productId);
```

## Type-Safe Collections

```typescript
interface Product {
  name: string;
  price: number;
  stock: number;
  category: string;
}

const products = db.collection<Product>('products');

// TypeScript knows the shape of your data
const product = await products.add({
  name: 'Widget',
  price: 29.99,
  stock: 100,
  category: 'gadgets'
});

// product.id is string
// product.name is string
// product.price is number
```

## Real-World Example: E-Commerce

```typescript
import { db } from '@varity/sdk';

interface Product {
  name: string;
  price: number;
  stock: number;
  description: string;
  imageUrl: string;
}

interface Order {
  userId: string;
  productIds: string[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
}

// In your React component
function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Load products on mount
    db.collection<Product>('products')
      .get()
      .then(setProducts);
  }, []);

  const purchaseProduct = async (productId: string, userId: string) => {
    const product = products.find(p => p.id === productId);

    // Create order
    await db.collection<Order>('orders').add({
      userId,
      productIds: [productId],
      total: product.price,
      status: 'pending'
    });

    // Update stock
    await db.collection('products').update(productId, {
      stock: product.stock - 1
    });
  };

  return (
    <div>
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onPurchase={() => purchaseProduct(product.id, currentUserId)}
        />
      ))}
    </div>
  );
}
```

## How It Works

1. **Deploy with Varity CLI:**
   ```bash
   varietykit app deploy
   ```

2. **CLI auto-injects credentials:**
   - `VITE_VARITY_DB_PROXY_URL` - Proxy service URL
   - `VITE_VARITY_APP_TOKEN` - JWT token for your app

3. **SDK reads credentials automatically:**
   - No manual configuration
   - No connection strings
   - No API keys in code

4. **Data is isolated per app:**
   - Each app gets its own database schema
   - Row-Level Security prevents cross-app access
   - Your data is private and secure

## Data Isolation & Security

- **Schema Isolation:** Each app gets `app_{appId}` schema in PostgreSQL
- **JWT Authentication:** Every request authenticated with app-specific JWT
- **Row-Level Security:** PostgreSQL RLS policies prevent data leaks
- **Automatic Tables:** Tables created on first collection access
- **JSONB Storage:** Flexible, schema-less document storage

## Configuration (Advanced)

For most developers, zero configuration is perfect. But if you need custom settings:

```typescript
import { Database } from '@varity/sdk';

const customDb = new Database({
  proxyUrl: 'https://custom-proxy.example.com',
  appToken: 'your-custom-jwt-token'
});

const products = customDb.collection('products');
```

## Coming in v1.1 (Post-MVP)

- **Realtime subscriptions:** Live updates when data changes
- **Advanced queries:** `.where()`, `.orderBy()`, `.limit()`
- **Batch operations:** Insert/update/delete multiple documents
- **Transactions:** Atomic operations across collections
- **Full-text search:** Search across document fields

## Architecture

```
Your App (IPFS)
    ↓
Varity DB Proxy (validates JWT)
    ↓
Supabase on Akash (PostgreSQL)
    ↓
Schema: app_{your_app_id}
```

## What Developers DON'T Need

- ❌ Database account/dashboard
- ❌ Connection strings
- ❌ Environment variables
- ❌ Schema migrations
- ❌ Docker/PostgreSQL installation
- ❌ Any database knowledge

## What Developers DO Get

- ✅ Persistent data storage
- ✅ Type-safe API
- ✅ Automatic backups
- ✅ Secure data isolation
- ✅ Scalable infrastructure
- ✅ Zero configuration

---

**This is the seamless developer experience Varity promised!**
