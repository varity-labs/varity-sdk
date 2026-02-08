# TaskFlow - SaaS Starter Template

A full-featured project management app built with [Varity](https://varity.so). Clone, customize, and deploy in minutes.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Deploy to production
npm run deploy
```

## What's Included

- **Authentication** - Email and social login (Google, etc.)
- **Database** - Zero-config, auto-provisioned data storage
- **Payments** - Built-in subscription and one-time payment support
- **Dashboard** - KPI cards, data tables, status badges
- **Protected Routes** - Automatic redirect for unauthenticated users
- **CRUD Operations** - Create, read, update, delete projects, tasks, and team members
- **TypeScript** - Full type safety throughout
- **Tailwind CSS** - Utility-first styling

## Project Structure

```
src/
  app/                    # Pages (Next.js App Router)
    dashboard/            # Protected dashboard pages
      projects/           # Project management
      tasks/              # Task management
      team/               # Team management
      settings/           # User settings
    login/                # Login page
  components/             # Reusable components
    dashboard/            # Dashboard-specific components
    landing/              # Landing page sections
    shared/               # Shared components (Navbar, Footer)
    ui/                   # Base UI components
  lib/                    # Core utilities
    varity.ts             # SDK initialization
    database.ts           # Typed database collections
    hooks.ts              # Custom React hooks
  types/                  # TypeScript type definitions
```

## Customization

### Change Data Models

Edit `src/types/index.ts` to modify the data structures for your app.

### Add New Collections

Edit `src/lib/database.ts` to add new typed database collections:

```typescript
import { db } from './varity';
import type { YourType } from '../types';

export const yourCollection = () => db.collection<YourType>('your_collection');
```

### Add New Pages

1. Create a new folder under `src/app/dashboard/`
2. Add a `page.tsx` file
3. Add the navigation item in `src/lib/constants.ts`

### Change Branding

- Replace `public/logo.svg` with your logo
- Update `APP_NAME` in `src/lib/constants.ts`
- Modify colors in `tailwind.config.js`

## Environment Variables

For development, no configuration is needed — shared development credentials are used automatically.

For production, set these in your environment:

```bash
NEXT_PUBLIC_PRIVY_APP_ID=your-app-id
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-client-id
NEXT_PUBLIC_VARITY_APP_ID=your-varity-app-id
```

## Deployment

```bash
# Deploy to Varity
npm run deploy
```

This builds your app and deploys it with a live URL.

## Learn More

- [Varity Documentation](https://docs.varity.so)
- [UI Kit Components](https://docs.varity.so/ui-kit)
- [SDK Reference](https://docs.varity.so/sdk)
