# Quick Start: Varity Credentials

## 🚀 Zero-Config Development (Recommended)

```tsx
import { PrivyStack } from '@varity/ui-kit';

function App() {
  return (
    <PrivyStack>
      <YourApp />
    </PrivyStack>
  );
}
```

**That's it!** No credentials needed. Just install and start building.

---

## 📦 Installation

```bash
npm install @varity/ui-kit @varity/sdk
```

---

## 🎯 Three Ways to Use Credentials

### 1️⃣ Zero-Config (Development)

**Best for**: Learning, prototypes, local development

```tsx
<PrivyStack>
  <YourApp />
</PrivyStack>
```

- ✅ Works immediately
- ✅ No setup required
- ✅ Shared dev credentials

### 2️⃣ Environment Variables (Testing)

**Best for**: Staging, team development

```bash
# .env.local
VARITY_PRIVY_APP_ID=your-privy-app-id
VARITY_THIRDWEB_CLIENT_ID=your-thirdweb-client-id
```

```tsx
<PrivyStack>
  <YourApp />
</PrivyStack>
```

- ✅ Your own credentials
- ✅ Clean code
- ✅ Easy to update

### 3️⃣ Explicit Props (Production)

**Best for**: Production deployments

```tsx
<PrivyStack
  appId={process.env.PRIVY_APP_ID}
  thirdwebClientId={process.env.THIRDWEB_CLIENT_ID}
>
  <YourApp />
</PrivyStack>
```

- ✅ Explicit and clear
- ✅ Production-ready
- ✅ No shared limits

---

## 🔑 Get Your Own Credentials (Optional)

### Privy (Authentication)

1. Visit https://dashboard.privy.io
2. Create an account
3. Create a new app
4. Copy your App ID

**Free**: Up to 1,000 monthly active users

### thirdweb (Blockchain)

1. Visit https://thirdweb.com/dashboard
2. Create an account
3. Create a new project
4. Copy your Client ID

**Free**: Generous free tier

---

## 🎨 Full Example

```tsx
import React from 'react';
import { PrivyStack } from '@varity/ui-kit';
import { usePrivy } from '@privy-io/react-auth';

function App() {
  return (
    <PrivyStack>
      <Dashboard />
    </PrivyStack>
  );
}

function Dashboard() {
  const { login, logout, authenticated, user } = usePrivy();

  if (!authenticated) {
    return (
      <div>
        <h1>Welcome to Varity</h1>
        <button onClick={login}>Login</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default App;
```

---

## 📚 Learn More

- **Full Guide**: [CREDENTIALS_GUIDE.md](./docs/CREDENTIALS_GUIDE.md)
- **API Reference**: [../../core/varity-sdk/docs/CREDENTIALS.md](../../core/varity-sdk/docs/CREDENTIALS.md)
- **Examples**: [examples/CREDENTIALS_EXAMPLE.tsx](./examples/CREDENTIALS_EXAMPLE.tsx)

---

## ❓ FAQ

**Q: Do I need credentials to start?**
A: No! Zero-config works out of the box.

**Q: When should I get my own credentials?**
A: For production deployments or if you need custom branding.

**Q: Are shared credentials safe?**
A: Yes, for development. Use your own for production.

**Q: How much does it cost?**
A: Both Privy and thirdweb have free tiers. $0 to start.

**Q: Can I switch credentials later?**
A: Yes! Just update environment variables.

---

**Need help?** Join our [Discord](https://discord.gg/varity) or check the [docs](https://docs.varity.io).
