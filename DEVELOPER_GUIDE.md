# KushCloud — Developer Guide

## Project Overview

KushCloud is a production-ready Flappy Bird-style arcade game built with React, TypeScript, and Capacitor. It features a fully custom game engine, procedural audio synthesis, and a complete progression system.

**Live Demo**: https://lin4cre.github.io/KUSHCLOUD/

---

## Quick Reference

| Aspect | Technology |
|--------|-----------|
| UI Framework | React 19 + TypeScript 5 |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS v4 |
| Game Engine | Custom HTML5 Canvas |
| Audio | Web Audio API (synthesised) |
| Mobile Wrapper | Capacitor 8 (Android) |
| State Management | React hooks + localStorage |
| CI/CD | GitHub Actions |
| Deployment | GitHub Pages (web) |

---

## Architecture

### High-Level Flow

```
index.html
   ↓
App.tsx (routing, state orchestration)
   ↓
   ├─ Menu.tsx
   ├─ Play.tsx (↔ GameCanvas.tsx)
   ├─ Shop.tsx
   ├─ Missions.tsx
   ├─ Profile.tsx
   ├─ Leaderboard.tsx
   ├─ Achievements.tsx
   ├─ Settings.tsx
   └─ Tutorial.tsx
```

### Core Modules

#### `game/engine.ts`
- **Purpose**: Main game loop, physics, collision detection, procedural world generation
- **Key Functions**:
  - `gameLoop()`: Runs at ~60 FPS, updates bird position, pipes, scoring
  - `checkCollision()`: Detects bird-pipe and bird-coin collisions
  - `generateWorld()`: Creates procedural obstacle layouts
  - `validateScore()`: Anti-cheat validation

#### `game/audio.ts`
- **Purpose**: Synthesises all music and SFX using Web Audio API
- **Key Functions**:
  - `playFlapSound()`: Creates flap effect
  - `playScoreSound()`: Plays when collecting coins/points
  - `playGameOverSound()`: End-game audio
  - `generateMenuMusic()`: Background music synthesis
- **Note**: Zero external audio files; everything is procedural

#### `game/data.ts`
- **Purpose**: Game configuration (immutable)
- **Contents**:
  - Skins: visual variants with prices
  - Trails: particle effects with prices
  - Achievements: unlock conditions & rewards
  - Worlds: different difficulty layouts
  - World seeds: procedural generation parameters

#### `game/storage.ts`
- **Purpose**: Save data persistence & leaderboard helpers
- **Key Functions**:
  - `loadSaveData()`: Deserialise from localStorage
  - `saveSaveData()`: Validate and serialise to localStorage
  - `validateScore()`: Checksum-based score integrity verification
  - `submitToLeaderboard()`: Format score for server (future)

#### `store.ts`
- **Purpose**: React state hook for game progress
- **Provides**:
  - `saveData`: Current player progress (XP, coins, skins, etc.)
  - `dispatchGameEvent()`: Updates save state based on game events
  - `resetSaveData()`: Wipe all progress

#### `GameCanvas.tsx`
- **Purpose**: React wrapper for the Canvas element
- **Receives Props**:
  - `gameState`: Current game/player state
  - `onScore()`: Callback when player scores
  - `onGameOver()`: Callback when bird dies
  - `onCoinCollect()`: Callback when leaf collected

### Game Loop

```
requestAnimationFrame
   ↓
Update bird physics (gravity, flap input)
   ↓
Update pipe positions (scroll)
   ↓
Detect collisions
   ↓
   ├─ Bird ↔ Pipe → trigger game over
   ├─ Bird ↔ Coin → increment score, play sound
   └─ Bird ↔ Pipe edge → add combo multiplier
   ↓
Render scene to canvas
   ↓
(repeat at 60 FPS)
```

---

## Development Workflow

### Setup

```bash
git clone https://github.com/LIN4CRE/KushCloud.git
cd KushCloud
npm install
npm run dev
```

Open http://localhost:5000 in your browser.

### Making Changes

**Game Logic**: Edit `src/game/engine.ts`

```typescript
// Example: Adjust gravity
const GRAVITY = 0.6; // Change this value

// Example: Modify pipe speed
const PIPE_SPEED = 3; // Pixels per frame
```

**UI/Screens**: Edit `src/screens/*.tsx`

```typescript
// Example: Update menu text
export default function Menu() {
  return <h1>My Custom Title</h1>;
}
```

**Audio**: Edit `src/game/audio.ts`

```typescript
// Example: Make sounds louder
oscillator.frequency.value *= 1.2;
```

**Styling**: Use Tailwind CSS in component `className`

```tsx
<button className="bg-green-600 hover:bg-green-700 px-4 py-2">
  Play Now
</button>
```

### Testing Changes

1. **Web (dev)**: Changes reflect instantly in the browser (HMR)
2. **Web (prod)**: Run `npm run build` and `npm run preview`
3. **Android**: Run `npm run build && npx cap sync android && cd android && ./gradlew assembleDebug`

---

## Building for Production

### Web Bundle

```bash
npm run build
# Outputs to dist/
# Single-file bundle via vite-plugin-singlefile
```

### Android APK

**Local Build** (requires Android Studio, SDK 34, JDK 17+):

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk

# For release (unsigned):
cd android && ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release-unsigned.apk
```

**CI/CD** (automatic on GitHub):

```bash
# Push to main → builds debug APK
git push origin main

# Tag with version → builds debug + release APK + creates GitHub Release
git tag v1.0.1
git push origin v1.0.1
```

---

## Folder Structure

```
KushCloud/
├── src/
│   ├── game/
│   │   ├── engine.ts          # Game loop, physics, collision
│   │   ├── audio.ts           # Web Audio synthesis
│   │   ├── data.ts            # Config: skins, achievements, worlds
│   │   ├── storage.ts         # Save data persistence
│   │   └── GameCanvas.tsx     # Canvas renderer (React wrapper)
│   ├── screens/               # UI screens
│   │   ├── Menu.tsx
│   │   ├── Play.tsx           # In-game HUD & pause
│   │   ├── Shop.tsx           # Cosmetic shop
│   │   ├── Missions.tsx       # Daily/weekly challenges
│   │   ├── Profile.tsx        # Player stats
│   │   ├── Leaderboard.tsx    # Score rankings
│   │   ├── Achievements.tsx   # Badge collection
│   │   ├── Settings.tsx       # Preferences
│   │   └── Tutorial.tsx       # Onboarding
│   ├── ui.tsx                 # Design system (buttons, cards, etc.)
│   ├── store.ts               # React state hook
│   ├── App.tsx                # Root component, routing
│   └── main.tsx               # Entry point
├── android/                   # Capacitor Android project
│   └── app/build/...          # Build outputs
├── index.html                 # HTML shell
├── vite.config.ts             # Build configuration
├── capacitor.config.ts        # Capacitor configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies & scripts
├── .github/workflows/
│   ├── build-apk.yml          # Android APK CI/CD
│   └── deploy-web.yml         # GitHub Pages deployment
├── CHANGELOG.md               # Release notes
├── CONTRIBUTING.md            # Contributor guide
├── CODE_OF_CONDUCT.md         # Community standards
├── SECURITY.md                # Vulnerability reporting
└── README.md                  # User-facing overview
```

---

## Common Tasks

### Add a New Achievement

1. Edit `src/game/data.ts`:
   ```typescript
   achievements: [
     {
       id: "speed_runner",
       name: "Speed Runner",
       description: "Survive 30 seconds",
       condition: (saveData) => saveData.personalBest.time > 30,
       reward: 100, // XP
     },
     // ... add your achievement
   ]
   ```

2. Award it in `src/store.ts` when the condition is met:
   ```typescript
   if (checkAchievementUnlocked("speed_runner")) {
     awardAchievement("speed_runner");
   }
   ```

3. Display in `src/screens/Achievements.tsx`

### Add a New Skin

1. Edit `src/game/data.ts`:
   ```typescript
   skins: [
     {
       id: "tropical",
       name: "Tropical Vibes",
       color: "#ff6b6b",
       price: 250,
       description: "Ride the wave",
     },
   ]
   ```

2. Update `GameCanvas.tsx` to render different skins:
   ```typescript
   const drawBird = (skin: string) => {
     if (skin === "tropical") {
       // Draw tropical bird
     }
   };
   ```

### Adjust Game Difficulty

Edit `src/game/engine.ts`:

```typescript
// Pipe speed (pixels/frame)
const PIPE_SPEED = 3;

// Gravity acceleration
const GRAVITY = 0.6;

// Flap strength (negative = upward)
const FLAP_POWER = -12;

// Pipe gap size (pixels)
const PIPE_GAP = 100;

// Spawn interval (frames between pipes)
const PIPE_SPAWN_RATE = 90;
```

### Enable Debug Mode

Add to `src/App.tsx`:

```typescript
const DEBUG = true; // Set to true for debug overlay
```

This enables:
- Frame counter (FPS)
- Hitbox visualization
- Score validation logs
- Physics debug info

---

## Performance Tips

1. **Canvas rendering**: Minimize redraws; use double-buffering (already done)
2. **Audio**: Synthesise sounds on-demand, not in real-time loop
3. **React**: Use `useMemo` for expensive calculations
4. **Tailwind**: Tree-shake unused styles in production builds
5. **Mobile**: Test on low-end devices; profile with DevTools

---

## Troubleshooting

### Canvas not rendering?
- Check browser console for errors
- Verify canvas element is mounted in DOM
- Ensure `requestAnimationFrame` is supported

### Audio not playing?
- Check browser audio context state (must be "running")
- Verify Web Audio API is supported
- Check volume levels and mute state

### APK build fails?
- Ensure Android SDK 34 and JDK 17+ are installed
- Run `npx cap sync android` before building
- Check `capacitor.config.ts` for typos

### Scores not saving?
- Open DevTools → Application → Storage → localStorage
- Verify `KushCloud_saveData` key exists
- Check for quota exceeded errors (localStorage limit ~5-10MB)

---

## Resources

- **React Docs**: https://react.dev
- **TypeScript Handbook**: https://www.typescriptlang.org/docs
- **Vite Guide**: https://vitejs.dev/guide
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Capacitor**: https://capacitorjs.com/docs
- **Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **Canvas API**: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API

---

**Questions?** Open an issue or start a discussion!
