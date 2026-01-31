# Varity API Server - Database Setup Guide

This guide provides complete instructions for setting up PostgreSQL database with Prisma ORM for the Varity API Server.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Database Schema Overview](#database-schema-overview)
- [Environment Configuration](#environment-configuration)
- [Prisma Commands](#prisma-commands)
- [Database Services](#database-services)
- [Testing](#testing)
- [Production Deployment](#production-deployment)

## Prerequisites

- PostgreSQL 15+ installed (locally or on Akash Network)
- Node.js 16+
- npm or yarn

### Local PostgreSQL Installation

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Docker:**
```bash
docker run --name varity-postgres \
  -e POSTGRES_USER=varity \
  -e POSTGRES_PASSWORD=varity123 \
  -e POSTGRES_DB=varity_api \
  -p 5432:5432 \
  -d postgres:15
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `@prisma/client` - Prisma Client for database queries
- `prisma` - Prisma CLI for migrations and schema management

### 2. Setup Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and set your `DATABASE_URL`:

```env
# Local PostgreSQL
DATABASE_URL=postgresql://varity:varity123@localhost:5432/varity_api

# Akash PostgreSQL (production)
DATABASE_URL=postgresql://user:password@akash-postgres-url:5432/varity_api
```

### 3. Create Database

```bash
# If using local PostgreSQL
createdb varity_api

# Or using psql
psql -U postgres -c "CREATE DATABASE varity_api;"
psql -U postgres -c "CREATE USER varity WITH PASSWORD 'varity123';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE varity_api TO varity;"
```

### 4. Run Initial Migration

```bash
npm run prisma:migrate
```

This will:
- Create all database tables based on the Prisma schema
- Generate Prisma Client
- Create a migration history in `prisma/migrations/`

### 5. Seed Database with Sample Data

```bash
npm run prisma:seed
```

This will populate your database with:
- 3 users (1 admin, 2 regular users)
- 4 templates (ISO, Finance, Healthcare, Retail)
- 2 dashboards
- 2 subscriptions
- Sample files, analytics events, and revenue records

### 6. Verify Setup

```bash
# Open Prisma Studio to browse your database
npm run prisma:studio
```

Navigate to http://localhost:5555 to explore your data.

## Database Schema Overview

### Core Tables

#### Users & Authentication
- **users**: User accounts with wallet addresses
- **sessions**: JWT session management
- **notifications**: User notifications

#### Templates & Dashboards
- **templates**: Industry-specific dashboard templates
- **template_customizations**: User customizations for templates
- **dashboards**: Deployed customer dashboards
- **dashboard_metrics**: Dashboard performance metrics
- **dashboard_logs**: Dashboard application logs

#### Storage (3-Layer Architecture)
- **files**: File metadata for Filecoin/IPFS storage
  - Layer 1: Varity Internal (`varity-internal`)
  - Layer 2: Industry RAG (`industry-rag`)
  - Layer 3: Customer Data (`customer-data`)

#### Analytics & Business Metrics
- **analytics_events**: Event tracking
- **revenue_records**: Revenue tracking
- **customer_metrics**: Customer analytics (active, new, churn, retention)
- **transaction_records**: Transaction history

#### Deployments & Subscriptions
- **deployments**: Template deployment status and logs
- **subscriptions**: User subscription management

#### System
- **cache_entries**: Application cache
- **webhook_logs**: Webhook event logs

### Entity Relationships

```
User
├── Dashboards (1:many)
├── Templates (1:many) [creator]
├── Files (1:many)
├── Sessions (1:many)
├── Subscriptions (1:many)
├── Deployments (1:many)
└── Notifications (1:many)

Template
├── Dashboards (1:many)
├── Subscriptions (1:many)
├── Deployments (1:many)
└── Customizations (1:many)

Dashboard
├── Metrics (1:many)
├── Logs (1:many)
├── Files (1:many)
└── Deployments (1:many)
```

## Environment Configuration

### Database URL Format

```
postgresql://[user]:[password]@[host]:[port]/[database]?[options]
```

### Connection Pool Options

Add to `DATABASE_URL`:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/varity_api?connection_limit=10&connect_timeout=30&pool_timeout=30
```

Options:
- `connection_limit`: Maximum concurrent connections (default: 10)
- `connect_timeout`: Connection timeout in seconds (default: 30)
- `pool_timeout`: Pool timeout in seconds (default: 30)

### Production Configuration

```env
NODE_ENV=production
DATABASE_URL=postgresql://varity:SecurePassword123@production-db:5432/varity_api?connection_limit=50&sslmode=require
DATABASE_CONNECTION_LIMIT=50
```

## Prisma Commands

### Development

```bash
# Generate Prisma Client after schema changes
npm run prisma:generate

# Create and apply new migration
npm run prisma:migrate

# Push schema changes without creating migration (dev only)
npm run db:push

# Open Prisma Studio (database browser)
npm run prisma:studio

# Seed database with sample data
npm run prisma:seed

# Reset database (WARNING: Deletes all data)
npm run db:reset
```

### Production

```bash
# Apply migrations in production
npm run prisma:migrate:prod

# Generate Prisma Client for production build
npm run prisma:generate
```

### Manual Prisma Commands

```bash
# Create migration without applying
npx prisma migrate dev --create-only --name migration_name

# Apply pending migrations
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

## Database Services

The API uses dedicated database service classes for each entity type. All services are located in `src/database/services/`.

### Usage Example

```typescript
import { userDatabaseService, templateDatabaseService } from './database/services';

// Create user
const user = await userDatabaseService.create({
  walletAddress: '0x123...',
  chainId: 1,
  email: 'user@example.com',
});

// Find user by wallet
const foundUser = await userDatabaseService.findByWalletAddress('0x123...');

// List templates with pagination
const templates = await templateDatabaseService.listActive({
  page: 1,
  limit: 20,
});

// Get template details
const template = await templateDatabaseService.getTemplateDetails(templateId);
```

### Available Services

- **UserDatabaseService**: User CRUD, authentication, admin checks
- **SessionDatabaseService**: JWT session management
- **TemplateDatabaseService**: Template management, search, cloning
- **DashboardDatabaseService**: Dashboard CRUD, metrics, logs
- **StorageDatabaseService**: File tracking, 3-layer storage
- **AnalyticsDatabaseService**: Event tracking, KPIs, revenue

### Utility Functions

```typescript
import { prisma, paginate, softDelete, executeTransaction } from './database';

// Pagination
const result = await paginate(prisma.user, { page: 1, limit: 20 }, { isActive: true });

// Soft delete
await softDelete(prisma.user, { id: userId });

// Transactions
await executeTransaction(async (tx) => {
  await tx.user.update({ where: { id }, data: { ... } });
  await tx.dashboard.create({ data: { ... } });
});
```

## Testing

### Integration Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Manual Testing with Prisma Studio

```bash
npm run prisma:studio
```

Access at http://localhost:5555

### Database Health Check

```typescript
import { checkDatabaseHealth } from './database';

const isHealthy = await checkDatabaseHealth();
console.log('Database healthy:', isHealthy);
```

## Production Deployment

### 1. Prepare Database

```bash
# On production server
createdb varity_api

# Or using managed PostgreSQL (GCP, AWS RDS, Akash)
# Ensure database is created and accessible
```

### 2. Set Environment Variables

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@prod-host:5432/varity_api?sslmode=require
DATABASE_CONNECTION_LIMIT=50
```

### 3. Run Migrations

```bash
npm run prisma:migrate:prod
```

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

### 5. Optionally Seed Production Data

```bash
# Customize seed script for production data
npm run prisma:seed
```

### Connection Pooling (Production)

For production, use PgBouncer or built-in Prisma connection pooling:

```env
# Prisma connection pooling
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=100

# With PgBouncer
DATABASE_URL=postgresql://user:pass@pgbouncer-host:6432/db?pgbouncer=true
```

### Monitoring

Monitor database performance:

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Long-running queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 minutes';

-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Backup Strategy

```bash
# Backup database
pg_dump -U varity -h localhost -d varity_api -F c -f backup_$(date +%Y%m%d).dump

# Restore database
pg_restore -U varity -h localhost -d varity_api backup_20250101.dump
```

### Performance Optimization

1. **Indexes**: Already defined in Prisma schema
2. **Connection Pooling**: Configure `connection_limit`
3. **Query Optimization**: Use Prisma's query logging in development
4. **Caching**: Implement Redis caching for frequently accessed data

## Troubleshooting

### Migration Issues

```bash
# Reset migration state
npx prisma migrate reset

# Mark migration as applied without running
npx prisma migrate resolve --applied migration_name
```

### Connection Issues

```bash
# Test database connection
psql -U varity -h localhost -d varity_api -c "SELECT version();"

# Check if database exists
psql -U postgres -c "SELECT datname FROM pg_database WHERE datname='varity_api';"
```

### Performance Issues

```bash
# Enable query logging in development
# Edit prisma/schema.prisma:
# log = ["query", "info", "warn", "error"]

# Analyze slow queries
# Check logs in application output
```

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/15/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
