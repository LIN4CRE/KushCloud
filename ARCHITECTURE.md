# Architecture Overview

## System Architecture

KushCloud is a single-page application (SPA) packaged as a web app, Android APK, and iOS PWA. It follows a client-only architecture with Firebase Realtime Database as the sole backend.

```
┌──────────────────────────────────────────────┐
│                  Browser / WebView            │
│  ┌────────────┐  ┌────────────┐  ┌────────┐ │
│  │ React 19   │  │ Canvas 2D  │  │ Web    │ │
│  │ UI Layer   │──│ Game Engine│  │ Audio  │ │
│  │ (Screens)  │  │ (Physics)  │  │ API    │ │
│  └─────┬──────┘  └─────┬──────┘  └────────┘ │
│        │               │                     │
│  ┌─────▼───────────────▼──────────────────┐  │
│  │         Game Logic (Pure TS)           │  │
│  │  runProcessing · data · storage        │  │
│  │  leaderboardModel · powerups           │  │
│  └──────────────┬─────────────────────────┘  │
│                 │                             │
│  ┌──────────────▼─────────────────────────┐  │
│  │   Firebase SDK (client-side only)      │  │
│  │   Auth · Realtime DB · Leaderboards    │  │
│  └──────────────┬─────────────────────────┘  │
│                 │                             │
└─────────────────┼─────────────────────────────┘
                  │ HTTPS / WSS
        ┌─────────▼──────────┐
        │  Firebase Realtime  │
        │  Database (BaaS)    │
        │  ┌───────────────┐  │
        │  │ Security Rules │  │
        │  │ (server-side   │  │
        │  │  validation)   │  │
        │  └───────────────┘  │
        └─────────────────────┘
```

## Data Flow

### Game Loop
1. **GameCanvas** creates a `GameEngine` instance with current skin/trail/world
2. `requestAnimationFrame` drives `update(dt)` → `render(ctx)` at ~60fps
3. User input (tap/click/keyboard) calls `engine.flap()`
4. On death, engine produces a `RunResult` via callback
5. `Play` screen calls `processRun()` → `applyCompletedRun(save, run)`
6. Run validation, dedup, XP/coins, achievements, missions applied
7. If new best, score submitted to Firebase leaderboard

### Save Data
- **Primary:** `localStorage` (`kushcloud_save_v1`) with JSON serialization
- **Schema version:** 4 (with migration from versions 1–3)
- **Roll daily:** Missions reset per day; login streaks tracked
- **Anti-cheat:** `validateRun()` rejects impossible scores/timing; `processedRunIds` prevents duplicates

### Firebase Integration
- **Optional:** App works fully offline (local leaderboard)
- **Authentication:** Anonymous UID (`kushcloud_uid` in localStorage) + optional Google Sign-In
- **Security:** Server-side rules validate score ranges, prevent writes to other users' entries
- **Rate-limiting:** Scores capped at 100,000; names at 32 chars

## Module Responsibilities

| Module | Responsibility |
|--------|---------------|
| `src/game/engine.ts` | Canvas physics, collision detection, procedural generation, particle systems |
| `src/game/data.ts` | Game data definitions (skins, trails, worlds, achievements, loot crates, events) |
| `src/game/runProcessing.ts` | Post-run logic: XP, coins, achievements, missions, leaderboard submissions |
| `src/game/storage.ts` | Save data schema, migration, persistence, validation, daily roll |
| `src/game/audio.ts` | Procedural audio synthesis (music + SFX) via Web Audio API |
| `src/game/leaderboardModel.ts` | Leaderboard entry validation, dedup, ranking, normalization |
| `src/game/leaderboard.ts` | Firebase leaderboard subscription, score submission, friend integration |
| `src/game/powerups.ts` | Power-up effects (coin multiplier, slow motion, shield, etc.) |
| `src/config/env.ts` | Environment variable validation and type-safe access |
| `src/config/firebase.ts` | Firebase init, auth, database operations, chat, friends |
| `src/hooks/` | React hooks: `useGameHandlers`, `useShopHandlers`, `useAudio`, `useUpdateChecker` |
| `src/screens/` | UI screens: Menu, Play, Shop, Leaderboard, Settings, etc. |
| `src/components/GameCanvas.tsx` | Canvas wrapper, resize handling, input routing |
| `src/store.ts` | Zustand-like save state hook (`useSave`) |
| `src/ui.tsx` | Shared design system components (Button, Toast, etc.) |

## Build Pipeline

```
TypeScript → Vite (build) → vite-plugin-singlefile → single index.html
                                              ↓
                                    Capacitor sync → Android/iOS native wrappers
```

- **Target:** ES2018 (IIFE) for maximum Android WebView compatibility  
  (TypeScript 6 source compiled down via Vite)
- **CSS:** Tailwind CSS v4 (JIT-compiled, no config file)
- **Bundle:** Single-file HTML (~718KB / 195KB gzip) with inline CSS+JS

## Security Model

1. **Client-side validation** (`validateRun`) rejects impossible scores before processing
2. **Server-side validation** (Firebase rules) enforces score bounds, UID matching, schema constraints
3. **No secrets in client** — Firebase config is public; protection comes from security rules
4. **No user accounts required** — anonymous UIDs generated with `crypto.randomUUID()`
5. **Content Security Policy** — restricts script sources, connections to Firebase domains only
6. **Run dedup** — `processedRunIds` + fingerprint-based duplicate detection
