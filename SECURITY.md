# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it
privately. Do **not** open a public issue.

To report a vulnerability, use the GitHub Security Advisories feature:

1. Go to https://github.com/Abhay557/indian-fakedata/security/advisories
2. Click **Report a vulnerability**.

We will acknowledge your report within 48 hours and will keep you informed of
the progress toward a fix and release. Please do not disclose the issue
publicly until we have had a chance to address it.

## Supported Versions

Security fixes are applied to the latest release of each major version.

| Version | Supported |
| ------- | --------- |
| 2.0.4   | Yes       |
| 2.0.3   | Yes       |
| 2.0.2   | Yes       |
| 1.0.0   | No        |

Note that the TypeScript package (`@abhay557/indian-fakedata` on npm) and the
Python package (`indian-fakedata` on PyPI) are versioned and released in lockstep.

## Scope

This project generates synthetic demographic data for testing and mock
purposes. It is intentionally deterministic per seed and contains no network or
storage access. Security issues relevant to this project are limited to
package-level concerns (dependency vulnerabilities, malicious inputs to the
CLI, and supply-chain issues in the published artifacts).

What is **not** in scope:

- Misuse of the generated data (the data is fictional; no real persons are
  represented)
- Issues in third-party dependencies — please report those to the respective
  upstream projects

## Security Considerations for Maintainers

- Never publish secrets or tokens in source, commits, or package artifacts.
- Verify that `dist/` (npm) and the built wheel/sdist (PyPI) match the source
  before publishing.
- Prefer raised dependabot/depfu security patches; review them promptly.
