# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in the Varity SDK, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, email us at: **security@varity.so**

Include:
- Description of the vulnerability
- Steps to reproduce
- Affected package(s) and version(s)
- Potential impact

We will acknowledge your report within 48 hours and provide a timeline for a fix.

## Supported Versions

| Package | Supported Versions |
|---------|-------------------|
| `@varity-labs/sdk` | 2.x (latest beta) |
| `@varity-labs/ui-kit` | 2.x (latest beta) |
| `@varity-labs/types` | 2.x (latest beta) |
| `@varity-labs/mcp` | 1.x (latest) |
| `create-varity-app` | 2.x (latest beta) |
| `varitykit` | 1.x (latest) |

## Security Practices

- All credentials are managed through Varity's credential proxy — developers never handle raw secrets
- API keys use timing-safe comparison to prevent timing attacks
- HTTPS is enforced in production
- Rate limiting is applied to all authenticated endpoints
- No credentials or secrets are ever logged

## Disclosure Policy

- We will work with you to understand and resolve the issue
- We will credit you (unless you prefer anonymity) when the fix is released
- We aim to release a fix within 7 days for critical vulnerabilities
