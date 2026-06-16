<p align="center">
  <img src="public/icon.svg" width="96" height="96" alt="KushCloud logo" />
</p>

<h1 align="center">KushCloud 🌿</h1>

<p align="center">
  <i>A chill one-tap arcade flyer — tap to fly, dodge the jars, grab the leaves.</i>
</p>

<p align="center">
  <strong><big>🎉 v3.0.0 — Leaderboard Overhaul & Gameplay Tune-Up</big></strong>
</p>

<p align="center">
  <a href="https://lin4cre.github.io/KushCloud/" target="_blank"><strong>🌐 Play in Browser</strong></a>
  ·
  <a href="https://github.com/LIN4CRE/KushCloud/releases/latest" target="_blank"><strong>📦 Download APK</strong></a>
  ·
  <a href="https://github.com/LIN4CRE/KushCloud/issues" target="_blank"><strong>🐛 Report Bug</strong></a>
</p>

<p align="center">
  <a href="https://github.com/LIN4CRE/KushCloud/releases/latest"><img src="https://img.shields.io/github/v/release/LIN4CRE/KushCloud?style=flat-square&logo=github&label=v3.0.0" alt="Release"></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://vitejs.dev"><img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"></a>
  <a href="https://capacitorjs.com"><img src="https://img.shields.io/badge/Capacitor-8-119EFF?style=flat-square&logo=capacitor&logoColor=white" alt="Capacitor"></a>
  <a href="https://firebase.google.com"><img src="https://img.shields.io/badge/Firebase-FFA320?style=flat-square&logo=firebase&logoColor=white" alt="Firebase"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-22c55e?style=flat-square" alt="License"></a>
  <a href="https://github.com/LIN4CRE/KushCloud/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/LIN4CRE/KushCloud/ci.yml?style=flat-square&logo=githubactions&label=CI" alt="CI"></a>
  <a href="https://github.com/LIN4CRE/KushCloud/actions/workflows/build-apk.yml"><img src="https://img.shields.io/github/actions/workflow/status/LIN4CRE/KushCloud/build-apk.yml?style=flat-square&logo=android&label=APK" alt="Build APK"></a>
  <img src="https://img.shields.io/badge/Health-89/100-22c55e?style=flat-square" alt="Health Score">
</p>

---

A **Flappy Bird-style arcade game** with a chill aesthetic — featuring a custom canvas game engine, fully synthesised audio (zero audio files), real-time Firebase leaderboards (live in v3.0.0), unlockable cosmetics, and daily missions.

---

## 🎮 Quick Start

| Action | Link |
|--------|------|
| **Play in Browser** | **[lin4cre.github.io/KushCloud/](https://lin4cre.github.io/KushCloud/)** — opens instantly, no install |
| **Download Android APK** | **[Latest Release](https://github.com/LIN4CRE/KushCloud/releases/latest)** — free, no Play Store |
| **Report a Bug** | **[Open an Issue](https://github.com/LIN4CRE/KushCloud/issues/new)** |

---

## ✨ Features

| Feature | Details |
|---------|---------|
| **Custom game engine** | Canvas-based physics, procedural generation, near-miss detection, particle systems |
| **Synthesised audio** | Music + SFX via Web Audio API — zero audio files |
| **Leaderboards** | Global, daily, weekly scoreboards with anti-cheat validation |
| **Progression** | XP, levels, coins, login streaks, loot crates, seasonal events |
| **Shop** | Unlockable skins, trails, titles, badges — cosmetic only |
| **Daily missions** | Rotating challenges with rewards |
| **Statistics** | Player analytics, progress tracking, sync status |
| **Accessibility** | Reduced motion, high contrast modes |
| **APK builds** | Auto-built via CI on every release tag |

---

## 📥 Install

### 📱 Android APK (free, no Play Store)

1. Go to **[Releases](https://github.com/LIN4CRE/KushCloud/releases/latest)**
2. Download `app-debug.apk`
3. Open it on your phone → tap **"Install anyway"** if prompted about unknown sources
4. Play offline or online — leaderboard works with internet

_No ads, no tracking, no permissions beyond storage._

### 🍏 iOS (Apple devices)

1. Open **https://lin4cre.github.io/KushCloud/** in Safari
2. Tap the **Share** button (box with upward arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. The game appears on your home screen with a full-screen experience.

_Native IPA builds available on [GitHub Releases](https://github.com/LIN4CRE/KushCloud/releases) for sideloading with AltStore or similar._

### 🌐 Web (any device)

Open **https://lin4cre.github.io/KushCloud/** in Chrome, Safari, or Firefox. Full game, same features.

---

## 🎮 Controls

| Action | Input |
|--------|-------|
| Flap | Tap · Click · Space · ↑ |
| Pause | Top-left pause button (in-game) |

**Scoring:** Fly through jar gaps for points, collect leaves for coins, skim jar edges for near-miss combo multipliers.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| UI | React 19 + TypeScript 6 |
| Build | Vite 8 + vite-plugin-singlefile |
| Styling | Tailwind CSS v4 |
| Game | Custom HTML5 Canvas engine |
| Audio | Web Audio API (fully synthesised) |
| Backend | Firebase Realtime Database |
| Native | Capacitor 8 (Android + iOS) |
| CI/CD | GitHub Actions |

---

## 💻 Development

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
|---------|--------|
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

## 📁 Project Structure

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

## 🔒 Security & Privacy

- Firebase Realtime Database uses security rules to validate scores server-side
- Impossible or tampered scores are rejected before submission
- No user accounts required — anonymous player IDs generated locally
- No analytics, no tracking, no data collection beyond scores you choose to submit
- The debug APK is self-signed; treat it like any sideloaded app

---

## 📚 Documentation

- [Architecture](ARCHITECTURE.md) — System architecture overview
- [CHANGELOG](docs/CHANGELOG.md) — Release history
- [CONTRIBUTING](docs/CONTRIBUTING.md) — Guidelines for contributors
- [SECURITY](docs/SECURITY.md) — Security policy and reporting
- [CODE_OF_CONDUCT](docs/CODE_OF_CONDUCT.md) — Community standards
- [DEPLOYMENT_GUIDE](docs/DEPLOYMENT_GUIDE.md) — Build and deploy instructions
- [RELEASE_GUIDE](docs/RELEASE_GUIDE.md) — Release process and versioning
- [ROADMAP](docs/ROADMAP.md) — Future plans

---

## 📄 License

MIT © [Linacre](https://github.com/LIN4CRE)