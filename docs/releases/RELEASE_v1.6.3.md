# 🛡 KushCloud v1.6.3 — Codebase Hardening & Standards Update

**Release Date:** 11 June 2026  
**Version:** 1.6.3  
**Version Code:** 3  

---

## Overview

v1.6.3 is a maintenance and security-focused release. It addresses critical dependency vulnerabilities, hardens the CI/CD pipeline by removing hardcoded credentials, and establishes new project governance and release standards for open-source transparency.

---

## ✅ Security Improvements

- **Firebase Upgrade**: Upgraded to `v12.14.0` to eliminate high-severity vulnerabilities in `undici`.
- **Workflow Hardening**: Removed all hardcoded Firebase API keys and IDs from GitHub Action files. These are now securely managed via GitHub Secrets.
- **Automated Scanning**: Enhanced CI workflows to perform security audits on every push.

---

## 🛠 Technical Fixes

- **Test Environment Restored**: Fixed a broken unit test environment by installing `jsdom` and `@testing-library` peer dependencies. 
- **CI Build Validation**: Added dummy environment variable generation to ensure the CI can build the project for validation without exposing real secrets.
- **Node.js Compatibility**: Verified builds are successful with Vite 7 and React 19.

---

## 📄 Documentation & Standards

- **New: GOVERNANCE.md**: Defines project leadership, maintainer roles, and decision-making processes.
- **New: RELEASE.md**: Outlines the standard operating procedure for versioning and publishing.
- **Updated: SECURITY.md**: Now includes details on automated security checks and disclosure procedures.
- **Updated: README.md**: Cross-referenced all new documentation and refreshed the project overview.

---

## 📦 Installation

### Android APK
1. Download `KushCloud-v1.6.3-debug.apk` from the [GitHub Releases page](https://github.com/LIN4CRE/KushCloud/releases/latest)
2. Open the APK on your Android device
3. Tap "Install anyway" if prompted about unknown sources

---

## 🧪 Testing Summary

| Test Area | Status |
|---|---|
| Unit tests (6 total) | ✅ All passed |
| Production Build (Vite) | ✅ Success |
| Dependency Audit | ✅ 0 vulnerabilities |
| Security Policy | ✅ Up to date |

---

Built with ❤️ by Linacre. 🌿
