# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :x:                |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of k6 Enterprise Framework seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please do NOT:
- Open a public GitHub issue
- Discuss the vulnerability in public forums or social media

### Please DO:
1. **Email us directly** at: jwcastillo+security@gmail.com
2. **Include the following information:**
   - Type of vulnerability
   - Full paths of source file(s) related to the vulnerability
   - Location of the affected source code (tag/branch/commit or direct URL)
   - Step-by-step instructions to reproduce the issue
   - Proof-of-concept or exploit code (if possible)
   - Impact of the vulnerability

### What to expect:
- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Assessment**: We will assess the vulnerability and determine its impact and severity
- **Fix**: We will work on a fix and coordinate the release with you
- **Disclosure**: We will publicly disclose the vulnerability after a fix is released
- **Credit**: We will credit you in the security advisory (unless you prefer to remain anonymous)

## Security Best Practices

When using this framework:

### 1. Environment Variables
- Never commit `.env` files to version control
- Use secrets management for sensitive data (API keys, tokens, passwords)
- Rotate credentials regularly

### 2. Dependencies
- Keep dependencies up to date
- Run `npm audit` regularly
- Review security advisories for dependencies

### 3. Redis Security
- Use authentication for Redis connections
- Use TLS/SSL for Redis connections in production
- Limit Redis network exposure
- Set appropriate TTLs for cached data

### 4. CI/CD Security
- Use encrypted secrets in GitHub Actions/GitLab CI
- Limit access to CI/CD pipelines
- Review pipeline logs for exposed secrets
- Use least-privilege principles for service accounts

### 5. Test Data
- Never use real user data in tests
- Use data generators for test data
- Sanitize any production data used for testing

## Automated Security Checks

This project includes:
- **npm audit**: Automated dependency vulnerability scanning
- **Dependabot**: Automated dependency updates
- **Secret scanning**: Pre-commit hooks to prevent secret commits
- **License compliance**: Automated license checking

## Security Updates

Security updates are released as patch versions (e.g., 1.2.1) and are documented in the CHANGELOG.md with a `[SECURITY]` tag.

Subscribe to releases to be notified of security updates:
- GitHub: Watch → Custom → Releases
- GitLab: Notifications → Custom → New release

## Contact

For security-related questions or concerns, contact:
- Email: security@yourcompany.com
- Security Team: @security-team (replace with actual team handle)

## Acknowledgments

We thank the following individuals for responsibly disclosing security vulnerabilities:
- (List will be updated as vulnerabilities are reported and fixed)
