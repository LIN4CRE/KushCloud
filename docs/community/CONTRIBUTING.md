# Contributing to KushCloud

Thank you for your interest in contributing! We welcome all forms of contribution including bug reports, feature requests, and code improvements.

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites
- **Node.js** 20 or higher
- **npm** 9 or higher
- **Git**

### Local Development Setup

```bash
# 1. Fork and clone your fork
git clone https://github.com/YOUR_USERNAME/KushCloud.git
cd KushCloud

# 2. Add upstream remote to sync with main repo
git remote add upstream https://github.com/LIN4CRE/KushCloud.git

# 3. Install dependencies
npm install

# 4. Start development server
npm run dev
# Open http://localhost:5000 in your browser
```

### Build & Test

```bash
# Production build
npm run build

# Preview production build locally
npm run preview

# Build Android APK (requires Android Studio SDK 34 + JDK 17+)
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

## How to Contribute

### Reporting Bugs

Open an [issue](https://github.com/LIN4CRE/KushCloud/issues/new) with:
- **Title**: Clear, descriptive summary
- **Description**: Steps to reproduce, expected vs actual behavior
- **Screenshots**: Helpful for visual bugs
- **Environment**: Browser / Android version, device type

### Suggesting Features

Open an [issue](https://github.com/LIN4CRE/KushCloud/issues/new) labeled `enhancement`:
- Describe the feature and use case
- Explain why it would benefit players
- Suggest implementation approach (optional)

### Code Contributions

1. **Create a branch** from `main` for your work:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**:
   - Follow the existing code style (TypeScript, React conventions)
   - Keep commits atomic and well-documented
   - Test your changes locally

3. **Push and open a Pull Request**:
   ```bash
   git push origin feature/your-feature-name
   ```
   - Provide a clear PR description
   - Reference any related issues
   - Ensure CI/CD checks pass

4. **Code Review**:
   - Be open to feedback
   - Discuss any concerns
   - Push updates to address review comments

## 🤝 Merge Strategy

To maintain a clean and traceable commit history, we use the following strategies:

- **Feature Branches**: Use **Squash and Merge**. This keeps the `main` branch history clean by condensing all feature-related commits into a single, high-quality commit.
- **Bug Fixes**: Use **Rebase and Merge** or **Squash and Merge**. Rebasing is preferred if the fix consists of a single meaningful commit that should be placed on top of `main`.
- **Maintenance / Dependencies**: Use **Merge Commit** if the changes are broad and benefit from a distinct merge point in the history.

**General Rule**: Never merge `main` back into your feature branch. Instead, **rebase** your branch onto `main` to resolve conflicts:
```bash
git checkout feature/your-feature
git fetch upstream
git rebase upstream/main
# Resolve conflicts if any
git push origin feature/your-feature --force-with-lease
```

## Development Guidelines

### Code Style
- **TypeScript**: Strict mode, proper typing
- **React**: Functional components, hooks preferred
- **Formatting**: Follows Vite/Tailwind conventions
- Use `clsx` and `tailwind-merge` for conditional styles

### File Structure
```
src/
├── game/
│   ├── engine.ts        # Core game loop & physics
│   ├── audio.ts         # Web Audio API synthesis
│   ├── data.ts          # Game config: skins, achievements, worlds
│   ├── storage.ts       # Save data & leaderboard helpers
│   └── GameCanvas.tsx   # React wrapper
├── screens/             # Game UI screens
├── ui.tsx               # Design system components
├── store.ts             # State management
└── App.tsx              # Main app & navigation
```

### Commit Messages
- Use clear, imperative mood: "Add feature X" not "Added feature X"
- Reference issues: "Fix #123"
- Keep first line under 50 characters
- Add detailed explanation if needed

### Performance Considerations
- Canvas rendering is performance-critical; minimize redraws
- Audio synthesis should not block the game loop
- Test on lower-end devices (mobile)

## Testing

While automated tests are welcome, manual testing is currently the primary approach:
- Test on desktop (Chrome, Firefox, Safari)
- Test on Android devices
- Verify leaderboard and save data persistence

## Deployment & Releases

Releases are handled automatically:
- **Web**: Pushes to `main` trigger GitHub Pages deployment
- **Android**: Version tags (`v*`) trigger APK builds and GitHub Release creation
- **CI/CD**: See `.github/workflows/` for details

To create a release:
```bash
git tag -a v1.0.1 -m "Version 1.0.1: bug fixes"
git push origin v1.0.1
```

## Questions?

- Open a [discussion](https://github.com/LIN4CRE/KushCloud/discussions)
- Reach out to [@Linacre](https://github.com/LIN4CRE)

---

**Happy coding! 🌿**
