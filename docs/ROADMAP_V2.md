# 🗺️ KushCloud Roadmap: Journey to v2.0

This document outlines the strategic development path for KushCloud as we evolve from the v1.x "Core Foundation" into the v2.0 "Cross-Platform Live-Service Ecosystem".

---

## 🟢 v1.5.0 — THE SOCIAL UPDATE (Current Sprint)
**Objective**: Turn a solo experience into a connected community.

- [x] **Firebase Auth Integration**: Google Login for cross-device syncing.
- [x] **Cloud Save Sync**: Automated backups and conflict resolution.
- [x] **Friend System**: Add friends via UID, view their profiles, and compare stats.
- [ ] **Global Chat**: A chill lounge to talk strains, scores, and strategies.
- [ ] **Sharing System**: Export "Run Summaries" for social media.

---

## 🏆 v1.6.0 — THE COMPETITIVE UPDATE
**Objective**: Transform KushCloud from a casual progression experience into a competitive live-service game with long-term retention systems.

### Core Features
- **Seasonal Progression System**: 8–12 week seasons with exclusive reward tracks.
- **Global Ranked Leaderboards**: Region-specific and global rankings with anti-cheat.
- **Tournament Framework**: Scheduled bracket-based match generation.
- **Competitive Ranking System**: Bronze → Silver → Gold → Platinum → Diamond → Master → Grandmaster.

### Technical Scope
- Backend leaderboard service and match history database.
- Tournament scheduling APIs and anti-exploit validation.
- Seasonal data migration architecture.

---

## 💰 v1.7.0 — THE ECONOMY UPDATE
**Objective**: Establish a sustainable and engaging progression economy that rewards both free and premium players.

### Core Features
- **The Kush Pass**: Free and Premium tracks with 100+ unlockable tiers.
- **Dynamic Shop System**: Daily rotating inventory and featured bundles.
- **Enhanced Currency Framework**: Soft (Coins), Premium (Kush Gems), and Tournament Tokens.
- **Loot & Reward Systems**: Seasonal treasure chests with 6 rarity tiers.

### Technical Scope
- Secure transaction validation and inventory persistence.
- LiveOps infrastructure for remote-config driven offers and A/B testing.

---

## 🚀 v1.8.0 — THE ENGINE OVERHAUL
**Objective**: Deliver next-generation visuals and performance through a complete rendering architecture upgrade.

### Major Milestone: HTML5 Canvas → WebGL
- **Graphics Enhancements**: Bloom rendering, dynamic lighting, smoke distortion shaders, and GPU particles.
- **Environmental Systems**: Dynamic weather (rain/fog) and Day/Night cycles.
- **Physics Biomes**: Zero-G, Low Gravity, and High Density regions.
- **Performance**: GPU-instanced rendering and asset streaming (Target: 120 FPS).

---

## 🌎 v2.0.0 — THE EXPANSION UPDATE
**Objective**: Transition into a fully-fledged cross-platform live-service ecosystem.

### Major Platform Launch
- **Official iOS Release**: Native deployment via Capacitor with Game Center integration.
- **Steam/Desktop Release**: Windows/Linux support with Achievements and Controller support.

### Real-Time Multiplayer (Flagship Feature)
- **Co-Op Mode**: Shared progression, team objectives, and cross-platform parties.
- **Versus Mode**: Real-time PvP, ranked matchmaking, and spectator mode.

### Infrastructure & Security
- **Networking Stack**: Authoritative WebSocket servers with lag compensation and rollback.
- **Backend Services**: Presence system, party management, and chat infrastructure.
- **Fair Play**: Server-authoritative gameplay and moderation dashboard.

---

## 🚀 Priority Checklist (Next Tasks)
1. [x] Implement Friend List UI Component (v1.5.1).
2. [x] UID Search and "Add Friend" logic.
3. [ ] Global Chat implementation (v1.5.2).
4. [ ] Activity Feed implementation.

---

*“Stay chill, fly high.”*  
**Linacre Development Team**
