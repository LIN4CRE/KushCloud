# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

**DO NOT open a public issue for security vulnerabilities.**

Instead, please report vulnerabilities via one of the following:

1. **GitHub Private Vulnerability Reporting:**
   [Report a vulnerability](../../security/advisories/new)

2. **Email:** security@kushcloud.app
   - Use the subject line: `[SECURITY] KushCloud - Brief Description`

### What to Include
- Description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested fix (if any)

### Response Timeline
- **Acknowledgment:** Within 48 hours
- **Initial Assessment:** Within 5 business days
- **Resolution Target:** Within 30 days for critical, 90 days for others

### Disclosure Policy
- We follow [Coordinated Vulnerability Disclosure](https://vuls.cert.org/confluence/display/Wiki/Coordinated+Vulnerability+Disclosure+Guidance)
- Public disclosure after fix is released and users have had time to update
- Credit will be given to reporters (unless anonymity is requested)

## Security Best Practices for Contributors
- Never commit secrets, API keys, or credentials
- Use environment variables for sensitive configuration
- Keep dependencies updated
- Follow the principle of least privilege
>>>>>>> aadf37b (wd)
