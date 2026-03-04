# @varity/ui-kit - Installation & Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd /home/macoding/blokko-internal-os/varity/chains/arbitrum/packages/varity-ui-kit
npm install
```

This will install:
- `thirdweb@^5.112.0` - Web3 SDK
- `viem@^2.7.0` - Ethereum library
- `ethers@^6.10.0` - Ethereum library
- `tailwindcss@^3.4.0` - CSS framework
- All development dependencies

### 2. Build Package

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### 3. Development Mode

```bash
npm run watch
```

Watches for file changes and rebuilds automatically.

### 4. Run Storybook

```bash
npm run storybook
```

Opens Storybook on http://localhost:6006 for component documentation.

### 5. Run Tests

```bash
npm test              # Run all tests with coverage
npm run test:unit     # Run unit tests only
npm run test:watch    # Watch mode
```

## Using in Your Application

### Installation (When Published)

```bash
npm install @varity/ui-kit
# or
yarn add @varity/ui-kit
# or
pnpm add @varity/ui-kit
```

### Local Development (Workspace)

Since this is a monorepo workspace package, reference it as:

```json
{
  "dependencies": {
    "@varity/ui-kit": "workspace:*"
  }
}
```

## Basic Setup

### 1. Import Styles

Add to your root component or `_app.tsx`:

```tsx
import '@varity/ui-kit/dist/styles/globals.css';
```

### 2. Wrap with Providers

```tsx
import {
  VarityProvider,
  WalletProvider,
  ChainProvider
} from '@varity/ui-kit';

function App() {
  return (
    <VarityProvider theme="system">
      <WalletProvider>
        <ChainProvider>
          <YourApp />
        </ChainProvider>
      </WalletProvider>
    </VarityProvider>
  );
}
```

### 3. Use Components

```tsx
import { ConnectWallet, WalletDropdown, useVarityWallet } from '@varity/ui-kit';

function Header() {
  const { isConnected } = useVarityWallet();

  return (
    <header>
      {isConnected ? (
        <WalletDropdown />
      ) : (
        <ConnectWallet variant="primary" size="lg" />
      )}
    </header>
  );
}
```

## Configuration

### Tailwind CSS Setup

If your project uses Tailwind CSS, add to `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/@varity/ui-kit/dist/**/*.{js,jsx}', // Add this line
  ],
  // ... rest of config
};
```

### Custom Theme

Override default colors:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        varity: {
          primary: '#YOUR_COLOR',
          secondary: '#YOUR_COLOR',
          // ... more colors
        },
      },
    },
  },
};
```

### Custom Client ID

Use your own Thirdweb client ID:

```tsx
<VarityProvider clientId="your-thirdweb-client-id">
  <App />
</VarityProvider>
```

Get your client ID at: https://thirdweb.com/dashboard

### Custom Chain

Use a different chain:

```tsx
import { defineChain } from 'thirdweb';

const myChain = defineChain({
  id: 33529,
  name: 'My Custom Chain',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpc: 'https://rpc.mychain.network',
});

<ChainProvider
  supportedChains={[myChain]}
  defaultChain={myChain}
>
  <App />
</ChainProvider>
```

## Environment Variables

Create a `.env.local` file in your application:

```bash
# Thirdweb Client ID (optional - defaults to Varity's)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-client-id

# Chain ID (optional - defaults to Arbitrum Sepolia testnet)
NEXT_PUBLIC_CHAIN_ID=421614

# RPC URL (optional - uses default)
NEXT_PUBLIC_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
```

## TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## Troubleshooting

### Module Not Found

If you see "Module not found: Can't resolve '@varity/ui-kit'":

1. Ensure the package is built: `npm run build`
2. Check package.json has the dependency
3. Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Thirdweb Client Error

If you see "Invalid client ID":

1. Get a free client ID from https://thirdweb.com/dashboard
2. Pass it to VarityProvider: `<VarityProvider clientId="your-id">`

### Tailwind Styles Not Applied

1. Import global styles: `import '@varity/ui-kit/dist/styles/globals.css'`
2. Check Tailwind config includes the package
3. Ensure PostCSS is configured

### Wallet Connection Fails

1. Check you're on a supported chain (Arbitrum Sepolia)
2. Ensure MetaMask or another wallet is installed
3. Check console for errors
4. Try switching to testnet in wallet

### USDC Balance Shows 0

1. Ensure you're connected to the correct network
2. Check you have test USDC (get from faucet)
3. Verify wallet address is correct
4. Check block explorer for balance

## Testing Your Setup

### Quick Test

```tsx
import { useVarityWallet } from '@varity/ui-kit';

function TestComponent() {
  const { address, balance, isConnected } = useVarityWallet();

  return (
    <div>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      <p>Address: {address || 'Not connected'}</p>
      <p>Balance: {balance ? balance.toString() : '0'} USDC</p>
    </div>
  );
}
```

### Run Example App

```bash
# Copy example to your src/
cp examples/basic-app.tsx src/App.tsx

# Start your dev server
npm run dev
```

## Next Steps

1. Check out the examples in `examples/` directory
2. Read the API reference in `API_REFERENCE.md`
3. View component catalog in `WEB3_COMPONENTS_REPORT.md`
4. Run Storybook to see all components: `npm run storybook`

## Support

For issues or questions:
- Check the documentation in `README.md`
- View component stories in Storybook
- Review examples in `examples/` directory
- Check Thirdweb docs: https://portal.thirdweb.com

## Development Commands

```bash
# Install dependencies
npm install

# Build package
npm run build

# Watch for changes
npm run watch

# Run tests
npm test
npm run test:unit
npm run test:integration
npm run test:watch

# Storybook
npm run storybook
npm run build-storybook

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Clean build
npm run clean
```

## Production Build

For production deployment:

```bash
# Clean previous build
npm run clean

# Build with production optimizations
NODE_ENV=production npm run build

# Verify build
ls -lah dist/
```

## Package Publishing

When ready to publish to NPM:

```bash
# Ensure you're logged in
npm login

# Update version
npm version patch  # or minor, or major

# Publish
npm publish --access public
```

## License

MIT - See LICENSE file for details
