<p align="center">
  <img src="public/icon.svg" width="96" height="96" alt="KushCloud logo" />
</p>

<h1 align="center">KushCloud 🌿</h1>

<p align="center">
  <i>A chill one-tap arcade flyer — tap to fly, dodge the jars, grab the leaves.</i>
</p>

<p align="center">
  <a href="https://lin4cre.github.io/KushCloud/" target="_blank"><strong>🌐 Play in Browser</strong></a>
  ·
  <a href="https://github.com/LIN4CRE/KushCloud/issues" target="_blank"><strong>🐛 Report Bug</strong></a>
</p>

<p align="center">
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://vitejs.dev"><img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-22c55e?style=flat-square" alt="License"></a>
  <a href="https://github.com/LIN4CRE/KushCloud/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/LIN4CRE/KushCloud/ci.yml?style=flat-square&logo=githubactions&label=CI" alt="CI"></a>
</p>

---

A **Flappy Bird-style arcade game** with a chill aesthetic — featuring a custom canvas game engine, fully synthesised audio (zero audio files), unlockable cosmetics, power-ups, and a local leaderboard.

---

## 🎮 Quick Start

| Action | Link |
|--------|------|
| **Play in Browser** | **[lin4cre.github.io/KushCloud/](https://lin4cre.github.io/KushCloud/)** — opens instantly, no install |
| **Report a Bug** | **[Open an Issue](https://github.com/LIN4CRE/KushCloud/issues/new)** |

---

## ✨ Features

| Feature | Details |
|---------|---------|
| **Custom game engine** | Canvas-based physics, procedural generation, near-miss detection, particle systems |
| **Synthesised audio** | Music + SFX via Web Audio API — zero audio files |
| **Leaderboard** | Local high scores, persistent across sessions |
| **Shop** | Unlockable skins, trails, and power-ups |
| **8 unique worlds** | Visual themes that unlock as your score increases |
| **Accessibility** | Reduced motion, high contrast modes |

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
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Game | Custom HTML5 Canvas engine |
| Audio | Web Audio API (fully synthesised) |
| CI/CD | GitHub Actions |

---

## 💻 Development

```bash
git clone https://github.com/LIN4CRE/KushCloud.git
cd KushCloud
npm install
npm run dev        # → http://localhost:5000
```

### Quick Commands

```bash
npm run dev           # Dev server on :5000
npm run build         # Production build
npm test              # Run unit tests
npm run test:coverage # Coverage report
```

---

## 📁 Project Structure

```
src/
├── game/              # Engine, audio, physics, storage, data, leaderboard
├── components/        # React components (GameCanvas, KushLogo)
├── screens/           # Menu, Play, Shop, Settings, Leaderboard
├── config/            # App config
├── App.tsx            # Root navigation and state
├── store.ts           # Persistent save-data hook
├── ui.tsx             # Shared design system components
├── index.css          # Tailwind imports and animations
└── main.tsx           # Entry point
```

---

## 📄 License

MIT © [Linacre](https://github.com/LIN4CRE)
