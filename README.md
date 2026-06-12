# KushCloud

[![Release](https://img.shields.io/github/v/release/LIN4CRE/KushCloud?style=flat-square&logo=github&label=Download%20APK)](https://github.com/LIN4CRE/KushCloud/releases/latest)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?style=flat-square&logo=capacitor&logoColor=white)](https://capacitorjs.com)
[![iOS Support](https://img.shields.io/badge/iOS-Ready-lightgrey?style=flat-square&logo=apple&logoColor=white)](https://github.com/LIN4CRE/KushCloud)
[![Firebase](https://img.shields.io/badge/Firebase-FFA320?style=flat-square&logo=firebase&logoColor=white)](https://firebase.google.com)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/LIN4CRE/KushCloud/ci.yml?style=flat-square&logo=githubactions&label=CI)](https://github.com/LIN4CRE/KushCloud/actions/workflows/ci.yml)
[![Build APK](https://img.shields.io/github/actions/workflow/status/LIN4CRE/KushCloud/build-apk.yml?style=flat-square&logo=android&label=APK)](https://github.com/LIN4CRE/KushCloud/actions/workflows/build-apk.yml)

A **Flappy Bird-style arcade game** with a chill aesthetic — tap to fly, dodge the jars, grab the leaves. Featuring a custom canvas game engine, synthesised audio, real-time Firebase leaderboards, unlockable cosmetics, and daily missions.

## Play Now

| | Link |
|---|---|
| **Play in Browser** | **[lin4cre.github.io/KushCloud/](https://lin4cre.github.io/KushCloud/)** — opens instantly, no install |
| **Download Android APK** | **[github.com/LIN4CRE/KushCloud/releases/latest](https://github.com/LIN4CRE/KushCloud/releases/latest)** — free, no Play Store |

---

## Install

### Android APK (free, no Play Store)

1. Go to **[releases](https://github.com/LIN4CRE/KushCloud/releases/latest)**
2. Download `app-debug.apk`
3. Open it on your phone → tap "Install anyway" if prompted about unknown sources
4. Play offline or online — leaderboard works with internet

No ads, no tracking, no permissions beyond storage.

### iOS (Apple devices)

1. Open **https://lin4cre.github.io/KushCloud/** in Safari
2. Tap the **Share** button (box with upward arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. The game will now appear as an app on your home screen with a full-screen experience.

*Native IPA builds available on [GitHub Releases](https://github.com/LIN4CRE/KushCloud/releases) for sideloading with AltStore or similar.*

### Web (any device)

Open **https://lin4cre.github.io/KushCloud/** in Chrome, Safari, or Firefox. Full game, same features.

---

## Features

| Feature | Details |
|---|---|---|
| **Custom game engine** | Canvas physics, procedural generation, near-miss detection, particle systems |
| **Synthesised audio** | Music + SFX via Web Audio API — zero audio files |
| **Leaderboards** | Global, daily, weekly scoreboards with anti-cheat validation |
| **Progression** | XP, levels, coins, login streaks, loot crates, seasonal events |
| **Shop** | Unlockable skins, trails, titles, badges — cosmetic only |
| **Daily missions** | Rotating challenges with rewards |
| **Statistics** | Player analytics, progress tracking, sync status |
| **Accessibility** | Reduced motion, high contrast modes |
| **APK builds** | Auto-built via CI on every release tag |

---

## Controls

| Action | Input |
|---|---|
| Flap | Tap · Click · Space · ↑ |
| Pause | Top-left pause button (in-game) |

**Scoring:** Fly through jar gaps for points, collect leaves for coins, skim jar edges for near-miss combo multipliers.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19 + TypeScript 5 |
| Build | Vite 8 + vite-plugin-singlefile |
| Styling | Tailwind CSS v4 |
| Game | Custom HTML5 Canvas engine |
| Audio | Web Audio API (fully synthesised) |
| Backend | Firebase Realtime Database |
| Native | Capacitor 8 (Android) |
| CI/CD | GitHub Actions |

---

## Development

```bash
git clone https://github.com/LIN4CRE/KushCloud.git
cd KushCloud
npm install
npm run dev        # → http://localhost:5000
```

### Android build (local)

Requires Android Studio, Android SDK 34, and JDK 21+.

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
# APK → android/app/build/outputs/apk/debug/app-debug.apk
```

### CI / CD

| Trigger | Action |
|---|---|
| Push to `main` | Builds debug APK (artifact) + iOS IPA (artifact) + deploys web to GitHub Pages |
| Tag push `v*` | Builds debug APK + iOS IPA, creates GitHub Release with assets |
| `workflow_dispatch` | Manual trigger |

### Quick Commands

```bash
npm run dev           # Dev server on :5000
npm run typecheck     # TypeScript check
npm run lint          # ESLint
npm run build         # Production build (single-file)
npm test              # Run unit tests
npm run test:coverage # Coverage report
```

---

## Project Structure

```
src/
├── game/              # Engine, audio, physics, storage, data
├── components/        # React components (GameCanvas, KushLogo)
├── screens/           # Menu, Play, Shop, Settings, Leaderboard, etc.
├── hooks/             # Custom React hooks
├── config/            # Firebase init, env validation
├── utils/             # Error handling, sanitization, update checker
├── App.tsx            # Root navigation and state
├── store.ts           # Persistent save-data hook
├── ui.tsx             # Shared design system components
├── index.css          # Tailwind imports and animations
└── main.tsx           # Entry point
```

`tests/` mirrors `src/` with Vitest unit tests.

---

## Security & Privacy

- Firebase Realtime Database uses security rules to validate scores server-side
- Impossible or tampered scores are rejected before submission
- No user accounts required — anonymous player IDs generated locally
- No analytics, no tracking, no data collection beyond scores you choose to submit
- The debug APK is self-signed; treat it like any sideloaded app

---

## Documentation

- [CHANGELOG](docs/CHANGELOG.md) — Release history
- [CONTRIBUTING](docs/CONTRIBUTING.md) — Guidelines for contributors
- [SECURITY](docs/SECURITY.md) — Security policy and reporting
- [CODE_OF_CONDUCT](docs/CODE_OF_CONDUCT.md) — Community standards
- [DEPLOYMENT_GUIDE](docs/DEPLOYMENT_GUIDE.md) — Build and deploy instructions
- [RELEASE_GUIDE](docs/RELEASE_GUIDE.md) — Release process and versioning
- [ROADMAP](docs/ROADMAP.md) — Future plans

---

## License

MIT © [Linacre](https://github.com/LIN4CRE)
