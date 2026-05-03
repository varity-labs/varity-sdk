# Contributing to Varity SDK

Thanks for your interest in contributing to Varity! Whether it's a bug fix, new feature, documentation improvement, or feedback — we appreciate it.

## Getting Started

### Prerequisites

- **Node.js** 18+
- **pnpm** (package manager)
- **Python** 3.8+ (for the CLI)
- **Git**

### Setup

```bash
# Clone the repo
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
│   ├── core/
│   │   ├── varity-sdk/          # @varity-labs/sdk — database, credentials
│   │   └── varity-types/        # @varity-labs/types — TypeScript definitions
│   ├── ui/
│   │   └── varity-ui-kit/       # @varity-labs/ui-kit — React components
│   └── cli/
│       ├── create-varity-app/   # create-varity-app — project scaffolding
│       └── varity-mcp/          # @varity-labs/mcp — MCP server for AI tools
├── cli/                         # varitykit CLI (Python)
├── services/
│   ├── varity-gateway/          # Custom domain gateway
│   ├── varity-db-proxy/         # Database proxy
│   └── varity-credential-proxy/ # Credential management
└── templates/
    └── saas-starter/            # SaaS starter template
```

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/varity-labs/varity-sdk/issues) to avoid duplicates
2. Use the [bug report template](https://github.com/varity-labs/varity-sdk/issues/new?template=bug_report.md)
3. Include: steps to reproduce, expected behavior, actual behavior, environment details

### Suggesting Features

1. Open a [feature request](https://github.com/varity-labs/varity-sdk/issues/new?template=feature_request.md)
2. Describe the problem you're solving and your proposed solution
3. We'll discuss it before implementation starts

### Submitting Code

1. **Fork** the repository
2. **Create a branch** from `main`: `git checkout -b fix/my-bug-fix`
3. **Make your changes** and test them
4. **Build** to verify: `pnpm build`
5. **Commit** with a clear message (see conventions below)
6. **Push** your branch and open a **Pull Request**

### Commit Message Convention

```
type(scope): description

# Examples:
fix(sdk): correct database collection return type
feat(ui-kit): add date picker component
docs(cli): update deploy command examples
chore: update dependencies
```

**Types:** `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`

**Scopes:** `sdk`, `ui-kit`, `types`, `cli`, `mcp`, `gateway`, `template`

## Development

### Building Packages

```bash
# Build everything
pnpm build

# Build a specific package
cd packages/core/varity-sdk && npm run build
cd packages/ui/varity-ui-kit && npm run build
```

### Running the CLI Locally

```bash
cd cli
pip install -e .
varitykit doctor
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for a specific package
cd packages/core/varity-sdk && npm test
```

## Code Style

- **TypeScript** for all packages (strict mode)
- **ESM** — all packages use ES modules (`import`/`export`)
- Use existing patterns in the codebase as reference
- Keep it simple — avoid over-engineering

## What We're Looking For

We especially welcome contributions in these areas:

- **Bug fixes** — anything that doesn't work as documented
- **Documentation** — improvements to READMEs, code comments, examples
- **UI components** — new components for `@varity-labs/ui-kit`
- **Templates** — new starter templates or improvements to existing ones
- **Developer experience** — CLI improvements, better error messages

## Community

- **Discord** — [Join our server](https://discord.gg/7vWsdwa2Bg) for questions and discussion
- **GitHub Issues** — Bug reports and feature requests
- **X/Twitter** — [@VarityHQ](https://x.com/VarityHQ) for updates

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
