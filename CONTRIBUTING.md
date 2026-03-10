# Contributing to Varity

Thanks for your interest in contributing to Varity! This guide will help you get started.

## Getting Started

### Prerequisites

- **Node.js** 18+
- **pnpm** 8+ (`npm install -g pnpm`)
- **Python** 3.8+ (for CLI)

### Setup

```bash
# Clone the repository
git clone https://github.com/varity-labs/varity-sdk.git
cd varity-sdk

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Project Structure

```
varity-sdk/
├── packages/
│   ├── core/varity-sdk/       # Backend SDK (database, credentials)
│   ├── core/varity-types/     # Shared TypeScript types
│   └── ui/varity-ui-kit/      # React components (19 components, providers, hooks)
├── cli/
│   └── varietykit/            # Python CLI (init, deploy, doctor)
├── templates/
│   └── saas-starter/          # SaaS template (Next.js)
├── services/
│   ├── varity-db-proxy/       # Database proxy service
│   └── varity-credential-proxy/ # Credential proxy service
└── docs/                      # Internal docs
```

## Development Workflow

### Building

```bash
# Build all packages
pnpm build

# Build a specific package
cd packages/core/varity-sdk && npm run build
cd packages/ui/varity-ui-kit && npm run build
cd packages/core/varity-types && npm run build
```

### Testing

```bash
# Run tests for a service
cd services/varity-db-proxy && npm test
cd services/varity-credential-proxy && pytest
```

### Working with the SaaS Template

```bash
cd templates/saas-starter
pnpm install
pnpm dev     # Start dev server
pnpm build   # Build for production (static export)
```

## Making Changes

1. **Fork** the repository
2. **Create a branch** from `main`: `git checkout -b fix/my-fix`
3. **Make your changes** and ensure the build passes
4. **Submit a pull request** with a clear description

### Branch Naming

- `fix/description` — Bug fixes
- `feat/description` — New features
- `docs/description` — Documentation
- `refactor/description` — Code refactoring

### Commit Messages

Write clear, concise commit messages that explain **why** a change was made:

```
Fix database query timeout on large collections

The default timeout was too short for collections with 10k+ documents.
Increased to 30s and added configurable timeout option.
```

## Code Style

- **TypeScript**: Follow existing patterns in the codebase
- **React Components**: Use functional components with hooks
- **Python CLI**: Follow PEP 8, use type hints
- **No blockchain jargon** in user-facing code, docs, or messages

## Reporting Bugs

Use [GitHub Issues](https://github.com/varity-labs/varity-sdk/issues) with the bug report template.

## Requesting Features

Use [GitHub Issues](https://github.com/varity-labs/varity-sdk/issues) with the feature request template.

## Community

- **Discord**: [Join our Discord](https://discord.gg/7vWsdwa2Bg) for real-time help
- **GitHub Discussions**: For longer-form conversations

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
