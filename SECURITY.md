# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in KushCloud, please **do not** open a public issue. Instead, please report it responsibly by:

1. **Emailing the maintainers**: Include a detailed description of the vulnerability, steps to reproduce, and potential impact.
2. **GitHub Security Advisory**: Use GitHub's private reporting feature at https://github.com/LIN4CRE/KushCloud/security/advisories

We will:
- Acknowledge receipt within 48 hours
- Investigate and assess the severity
- Work on a fix and coordinate a release
- Credit the reporter (unless you prefer anonymity)

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅ Yes    |
| < 1.0   | ❌ No     |

## Security Best Practices for Users

- **Keep your browser updated** to the latest version
- **Play on trusted devices** only
- **Do not share your save data** with others
- **Report suspicious leaderboard activity** to maintainers

## Known Security Considerations

- **Client-side validation**: The game runs entirely in the browser; store leaderboard data server-side in production
- **Web Audio API**: No external audio files; all synthesis is procedural
- **localStorage**: Save data is stored locally; clear browser data to reset progress

## Future Security Improvements

- Server-side score validation (when backend is added)
- HTTPS enforcement for all resources
- Content Security Policy headers
- Regular dependency updates and vulnerability scans
