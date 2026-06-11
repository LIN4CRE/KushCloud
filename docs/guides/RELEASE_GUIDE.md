# KushCloud Release Guide

This document provides comprehensive information about the KushCloud project, including release processes, version management, and deployment procedures.

## Overview

KushCloud is a cannabis-themed flappy bird-style mobile game built with React, TypeScript, and Capacitor. The game features daily missions, achievements, a shop, and social leaderboards.

## Key Features

### Core Gameplay
- **Classic Flappy Bird Mechanics**: Navigate through scrolling cannabis-themed obstacles
- **Progressive Difficulty**: Score-based world progression with unique visual themes
- **Power-ups & Obstacles**: Collect coins, avoid near-misses, unlock special items

### Daily Features
- **Daily Missions**: 3 challenges per day that reset at midnight
- **Login Rewards**: Streak-based daily bonuses up to 250 coins
- **Weekly Events**: Special themed events with bonus multipliers

### Collection & Progression
- **Skins**: 7 unique cannabis strains with unlock requirements
- **Trails**: 5 visual effects for the bird's movement
- **Achievements**: 12 achievement milestones for significant milestones
- **Level System**: XP-based leveling with rewards at each level

### Social & Competition
- **Real-time Leaderboards**: Global, daily, and weekly rankings with Firebase backend
- **Friend System**: Limited social connections for friendly competition
- **Statistics Dashboard**: Detailed player analytics and progress tracking

## Technical Architecture

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite with Tailwind CSS
- **State Management**: React hooks and localStorage
- **Mobile**: Capacitor for Android app wrapping

### Backend
- **Database**: Firebase Realtime Database for leaderboards and user profiles
- **Real-time Sync**: WebSocket-like updates via Firebase listeners
- **User Management**: UID-based persistent identification

### Security
- **Input Validation**: All user inputs are sanitized
- **Anti-cheat System**: Score and time-based validation
- **Rate Limiting**: Server-side protection against abuse
- **Offline Support**: Graceful degradation when offline

## Release Process

### Pre-Release Steps

1. **Code Quality**
   - Run `npm run lint` to check code style
   - Run `npm run typecheck` for TypeScript validation
   - Run tests if available

2. **Feature Verification**
   - Test all new leaderboard features
   - Verify Firebase integration
   - Test offline/online sync
   - Validate power user features

3. **Performance Optimization**
   - Bundle analysis
   - Code splitting verification
   - Asset optimization
   - Memory leak detection

### Building Releases

#### Using Build Scripts
```bash
# Build with default version
./build-release.sh

# Build with custom version
./build-release.sh v1.1.0
```

#### Build Steps
1. Install dependencies (`npm ci`)
2. Build web bundle (`npm run build`)
3. Sync Capacitor (`npx cap sync android`)
4. Build Android APKs (debug and release)

### Release Notes Template

```markdown
## Version [VERSION] - [DATE]

### New Features
- ✅ Real-time Firebase leaderboard integration
- ✅ Statistics dashboard with player analytics
- ✅ Advanced power user features
- ✅ Improved UX with haptic feedback

### Bug Fixes
- Fixed offline sync issues
- Resolved score validation edge cases
- Improved error handling

### Performance
- Reduced bundle size by XX%
- Improved loading times
- Optimized mobile performance

### Known Issues
- Minor UI glitch on older devices
- Limited to Android 8+ for new features

### Migration Guide
- Upgrade from v1.0 to v1.1:
  1. Clear app cache
  2. Restart the app
  3. Login with existing credentials

### Download
- [APK - Debug](release-v1.1.0/kushcloud-debug-v1.1.0.apk)
- [APK - Release Unsigned](release-v1.1.0/kushcloud-release-unsigned-v1.1.0.apk)
```

## Deployment

### GitHub Actions
The project includes GitHub Actions for automated testing and deployment:

1. **Continuous Integration**: Auto-test on every push
2. **Release Automation**: Create releases from tags
3. **APK Distribution**: Upload APKs to releases

### App Store Distribution
- Android: Google Play Console
- Alternative: Direct APK distribution via releases

## Firebase Configuration

### Environment Variables
Create a `.env` file with the following:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Permissions
- Database: Read/Write access for leaderboards and user profiles
- Storage: Not required for current implementation

## Development

### Running Locally
```bash
# Install dependencies
npm ci

# Start development server
npm run dev
```

### Building for Production
```bash
# Build for production
npm run build
```

### Testing
```bash
# Run tests (if available)
npm test
```

## Troubleshooting

### Firebase Issues
1. **API Key Not Working**: Verify all environment variables are set
2. **Rate Limiting**: Wait a few minutes and retry
3. **Permission Denied**: Check Firebase Realtime Database security rules

### Android Build Issues
1. **Missing Gradle Dependencies**: Run `npm run build` first
2. **Java Version**: Ensure Java 17 or higher is installed
3. **Android Studio**: Not required for command-line builds

### Browser Compatibility
- Chrome, Firefox, Safari, Edge (modern versions)
- Mobile browsers with WebSocket support
- iOS Safari with Capacitor

## Future Enhancements

### Phase 2
- **In-app purchases**: Premium skins and trails
- **Multiplayer modes**: Local and online co-op
- **Cloud save**: Cross-device synchronization
- **Social features**: Friend requests, messaging

### Phase 3
- **Leaderboard challenges**: Time-limited competitions
- **Tournaments**: Structured multi-player events
- **Analytics dashboard**: Admin tools for game statistics
- **AI opponents**: Machine learning-based difficulty adjustment

## Contributing

### Code Standards
- TypeScript strict mode
- ESLint for code quality
- Prettier for formatting
- Commit message conventions

### Pull Request Process
1. Create feature branch
2. Submit pull request
3. Code review
4. Automated testing
5. Merge to main

### License
MIT License - See LICENSE file for details

## Contact
For issues, questions, or feature requests:
- GitHub Issues: [repository]/issues
- Development Team: [contact information]

---
*Last updated: [DATE]*
*KushCloud Team*