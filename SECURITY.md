# Security Policy

The Varity team takes security seriously. We appreciate your efforts to responsibly disclose vulnerabilities and will make every effort to acknowledge your contributions.

## Reporting a Vulnerability

**Please do NOT open public GitHub issues for security vulnerabilities.**

Instead, report vulnerabilities by emailing **[security@varity.so](mailto:security@varity.so)**.

Your report should include:

- A clear description of the vulnerability
- Steps to reproduce the issue
- Affected package(s) and version(s)
- Impact assessment (what an attacker could achieve)
- Any suggested fixes, if applicable

Providing a detailed report helps us triage and address the issue faster.

## Response Timeline

| Stage | Timeframe |
|-------|-----------|
| Acknowledgment | Within 48 hours |
| Initial assessment | Within 5 business days |
| Fix: Critical severity | 7 days |
| Fix: High severity | 14 days |
| Fix: Medium severity | 30 days |

We will keep you informed of our progress throughout the process. If you do not receive an acknowledgment within 48 hours, please follow up to confirm we received your report.

## Scope

### In Scope

- `@varity-labs/sdk`
- `@varity-labs/ui-kit`
- `@varity-labs/types`
- `varitykit` CLI
- Credential Proxy
- DB Proxy
- Varity Gateway

### Out of Scope

- **Third-party dependencies** -- please report these to the respective maintainers directly
- **Varity L3 chain infrastructure** -- network-level issues should be reported through separate channels
- Social engineering attacks against Varity team members
- Denial-of-service attacks

## Safe Harbor

Varity supports safe harbor for security researchers who:

- Make a good-faith effort to avoid privacy violations, destruction of data, and disruption of services
- Only interact with accounts you own or with explicit permission of the account holder
- Do not exploit a vulnerability beyond what is necessary to confirm its existence
- Report vulnerabilities in accordance with this policy

Good-faith security research following this policy will not be subject to legal action from Varity.

## Recognition

Security researchers who report valid vulnerabilities will be credited in release notes, with their permission. If you would like to be credited, please include your preferred name and optional link (e.g., GitHub profile) in your report.

## Preferred Languages

We accept vulnerability reports in English.
