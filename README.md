# 🌿 KushCloud

> A Flappy Bird-style arcade game with a chill aesthetic — tap to fly, dodge the jars, grab the leaves.

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?style=flat-square&logo=capacitor&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Realtime-FFA320?style=flat-square&logo=firebase&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)

---

## ✨ Features

- **Custom game engine** — canvas-based physics, procedural worlds, near-miss detection
- **Synthesised audio** — music and SFX generated entirely via Web Audio API (zero audio files)
- **Full progression system** — XP, levelling, coins, daily login streaks, weekly events
- **Shop** — unlockable skins and particle trails (cosmetic only, never pay-to-win)
- **Daily missions & achievements** — server-validated scores, combo system
- **✅ NEW: Real-Time Leaderboards** — Firebase-powered global, daily, weekly leaderboards with anti-cheat validation
- **✅ NEW: Statistics Dashboard** — Player analytics, progress tracking, and server sync status
- **✅ NEW: Power User Tools** — Replay system, practice mode, advanced customization
- **✅ NEW: Enhanced UX** — Haptic feedback, improved animations, better loading states
- **Accessibility** — reduced motion mode, high contrast mode
- **Android APK** — packaged via Capacitor, auto-built in CI on every push to `main`

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20 or higher
- **npm** 9 or higher

### Web — development

```bash
git clone https://github.com/LIN4CRE/KushCloud.git
cd KushCloud
npm install
npm run dev        # → http://localhost:5000
```

### Web — production build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production bundle locally
```

### Android APK — local

> Requires Android Studio with SDK 34 and JDK 17+.

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
# APK → android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 19 + TypeScript 5 |
| Build tool | Vite 7 + `vite-plugin-singlefile` |
| Styling | Tailwind CSS v4 |
| Game engine | Custom HTML5 Canvas |
| Audio | Web Audio API (fully synthesised) |
| Native wrapper | Capacitor 8 (Android) |
| State / storage | React state + `localStorage` |

---

## 📁 Project Structure

```
KushCloud/
├── src/
│   ├── game/
│   │   ├── engine.ts        # Core game loop, physics, collision
│   │   ├── audio.ts         # Procedural music & SFX synthesis
│   │   ├── data.ts          # Skins, trails, achievements, worlds
│   │   ├── storage.ts       # Save data, validation, leaderboard helpers
│   │   └── GameCanvas.tsx   # React wrapper for the canvas
│   ├── screens/
│   │   ├── Menu.tsx
│   │   ├── Play.tsx         # HUD, pause, game-over summary
│   │   ├── Shop.tsx
│   │   ├── Missions.tsx     # Daily hub, login streak, weekly event
│   │   ├── Profile.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── Achievements.tsx
│   │   ├── Settings.tsx
│   │   └── Tutorial.tsx
│   ├── ui.tsx               # Shared design-system components
│   ├── store.ts             # Persistent save-data hook
│   └── App.tsx              # Navigation, run processing, reward logic
├── android/                 # Capacitor Android project
├── .github/workflows/
│   ├── build-apk.yml        # CI: build & publish Android APK
│   └── deploy-web.yml       # CI: build & deploy to GitHub Pages
├── capacitor.config.ts
├── vite.config.ts
└── package.json
```

---

## ⚙️ CI / CD

### Android APK (`build-apk.yml`)

| Trigger | What happens |
|---|---|
| Push to `main` | Builds debug APK, uploads as workflow artifact |
| Version tag `v*` | Builds debug + unsigned release APK, creates a GitHub Release |
| `workflow_dispatch` | Manual run |

### Web Deploy (`deploy-web.yml`)

| Trigger | What happens |
|---|---|
| Push to `main` | Builds Vite bundle, deploys to GitHub Pages |
| `workflow_dispatch` | Manual run |

Live demo: **https://lin4cre.github.io/KushCloud/**

---

## 🎮 Controls

| Action | Input |
|---|---|
| Flap up | Tap · Click · Space · ↑ |
| Pause | Pause button (top-left, in-game) |

**How to score big:**

1. Fly through jar gaps for points
2. Collect floating 🍁 leaves for coins
3. Skim jar edges for near-miss combo multipliers
4. Spend coins in the Shop on skins and trails

---

## 🔒 Score Validation

All runs pass through a client-side validator that checks score consistency against elapsed time, flap count, and coin pickups. Impossible or hacked values are rejected before saving or submitting to the leaderboard.

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

---

## 📄 License

MIT © [Linacre](https://github.com/LIN4CRE)
