import { useCallback, useRef } from "react";
import { audio } from "../game/audio";
import {
  SKINS, TRAILS, TITLES, BADGES, EFFECTS, POWERUPS,
  getActiveEvents, RARITY,
  type LootCrate, type Rarity,
} from "../game/data";
import { dayNumber, type SaveData } from "../game/storage";
import { showToast as toastNotify } from "../ui";

type UpdateFn = <T>(fn: (s: SaveData) => T) => T;

export function useShopHandlers(save: SaveData, update: UpdateFn) {
  const saveRef = useRef(save);
  saveRef.current = save;

  const showToast = useCallback((msg: string) => {
    audio.reward();
    toastNotify(msg);
  }, []);

  const buySkin = useCallback((id: string) => {
    const s = saveRef.current;
    const skin = SKINS.find((x) => x.id === id);
    if (!skin || s.coins < skin.cost || s.ownedSkins.includes(id)) return;
    audio.purchase();
    update((d) => {
      d.coins -= skin.cost;
      d.ownedSkins.push(id);
      d.equippedSkin = id;
    });
    showToast(`Unlocked ${skin.name}! 🎉`);
  }, [update, showToast]);

  const buyTrail = useCallback((id: string) => {
    const s = saveRef.current;
    const tr = TRAILS.find((t) => t.id === id);
    if (!tr || s.coins < tr.cost || s.ownedTrails.includes(id)) return;
    audio.purchase();
    update((d) => {
      d.coins -= tr.cost;
      d.ownedTrails.push(id);
      d.equippedTrail = id;
    });
    showToast(`Unlocked ${tr.name}! 🎉`);
  }, [update, showToast]);

  const buyCrate = useCallback((crate: LootCrate, setLootCrateOpen: (c: LootCrate | null) => void) => {
    if (saveRef.current.coins < crate.cost) return;
    audio.purchase();
    update((s) => {
      s.coins -= crate.cost;
      s.cratesOpened += 1;
      const events = getActiveEvents();
      for (const event of events) {
        const state = s.eventState[event.id] || (s.eventState[event.id] = {
          objectives: {}, claimedObjectives: [], rewardTrackPoints: 0,
          claimedRewardTiers: [], lastRefreshDay: dayNumber(),
        });
        for (const obj of event.objectives) {
          if (state.claimedObjectives.includes(obj.id)) continue;
          if (obj.metric === "cratesOpened") {
            const wasIncomplete = (state.objectives[obj.id] || 0) < obj.goal;
            state.objectives[obj.id] = s.cratesOpened;
            if (wasIncomplete && s.cratesOpened >= obj.goal) {
              state.rewardTrackPoints += obj.reward;
            }
          }
        }
      }
    });
    setLootCrateOpen(crate);
  }, [update]);

  const claimCrateDrops = useCallback((itemIds: string[], dust: number, setLootCrateOpen: (c: null) => void) => {
    update((s) => {
      for (const id of itemIds) {
        const skin = SKINS.find(x => x.id === id);
        if (skin) { if (!s.ownedSkins.includes(id)) { s.ownedSkins.push(id); } else { s.dust += RARITY[skin.rarity].dustValue; } continue; }
        const trail = TRAILS.find(x => x.id === id);
        if (trail) { if (!s.ownedTrails.includes(id)) { s.ownedTrails.push(id); } else { s.dust += RARITY[trail.rarity].dustValue; } continue; }
        const title = TITLES.find(x => x.id === id);
        if (title) { if (!s.ownedTitles.includes(id)) { s.ownedTitles.push(id); } else { s.dust += RARITY[title.rarity].dustValue; } continue; }
        const badge = BADGES.find(x => x.id === id);
        if (badge) { if (!s.ownedBadges.includes(id)) { s.ownedBadges.push(id); } else { s.dust += RARITY[badge.rarity].dustValue; } continue; }
        const effect = EFFECTS.find(x => x.id === id);
        if (effect) { if (!s.ownedEffects.includes(id)) { s.ownedEffects.push(id); } else { s.dust += RARITY[effect.rarity].dustValue; } continue; }
        s.dust += RARITY.common.dustValue;
      }
      s.dust += dust;
    });
    const names = itemIds.map(id => {
      return [...SKINS, ...TRAILS, ...TITLES, ...BADGES, ...EFFECTS].find(x => x.id === id)?.name || id;
    });
    showToast(`Got: ${names.join(", ")}${dust > 0 ? ` +${dust} dust` : ""}`);
    setLootCrateOpen(null);
  }, [update, showToast]);

  const buyPowerUp = useCallback((id: string) => {
    const s = saveRef.current;
    const p = POWERUPS.find(x => x.id === id);
    if (!p || s.coins < p.cost || s.ownedPowerUps.includes(id)) return;
    audio.purchase();
    update((d) => {
      d.coins -= p.cost;
      d.ownedPowerUps.push(id);
    });
    showToast(`Got ${p.name}! Use it in-game!`);
  }, [update, showToast]);

  const DUST_COST: Record<Rarity, number> = { common: 15, uncommon: 30, rare: 60, epic: 120, legendary: 300, mythic: 800 };

  const buyDustItem = useCallback((rarity: Rarity) => {
    const cost = DUST_COST[rarity];
    if (saveRef.current.dust < cost) return;
    update((s) => {
      const owned = new Set([...s.ownedSkins, ...s.ownedTrails, ...s.ownedTitles, ...s.ownedBadges, ...s.ownedEffects]);
      const pool = [...SKINS.filter(x => x.id !== "bud"), ...TRAILS.filter(x => x.id !== "none"), ...TITLES, ...BADGES, ...EFFECTS.filter(x => x.id !== "e_none")].filter(x => x.rarity === rarity && !owned.has(x.id));
      if (pool.length === 0) { showToast("All items of this rarity owned!"); return; }
      const pick = pool[Math.floor(Math.random() * pool.length)];
      s.dust -= cost;
      if (SKINS.find(x => x.id === pick.id)) s.ownedSkins.push(pick.id);
      else if (TRAILS.find(x => x.id === pick.id)) s.ownedTrails.push(pick.id);
      else if (TITLES.find(x => x.id === pick.id)) s.ownedTitles.push(pick.id);
      else if (BADGES.find(x => x.id === pick.id)) s.ownedBadges.push(pick.id);
      else if (EFFECTS.find(x => x.id === pick.id)) s.ownedEffects.push(pick.id);
      showToast(`Crafted ${pick.name}! (${RARITY[rarity].label})`);
      audio.purchase();
    });
  }, [update, showToast]);

  const equipSkin = useCallback((id: string | null) => { audio.equip(); update((s) => { s.equippedSkin = id ?? "bud"; }); }, [update]);
  const equipTrail = useCallback((id: string | null) => { audio.equip(); update((s) => { s.equippedTrail = id ?? "none"; }); }, [update]);
  const equipTitle = useCallback((id: string | null) => { audio.equip(); update((s) => { s.equippedTitle = id; }); }, [update]);
  const equipBadge = useCallback((id: string | null) => { audio.equip(); update((s) => { s.equippedBadge = id; }); }, [update]);
  const equipEffect = useCallback((id: string | null) => { audio.equip(); update((s) => { s.equippedEffect = id ?? "e_none"; }); }, [update]);

  return {
    buySkin, buyTrail, buyCrate, claimCrateDrops, buyPowerUp, buyDustItem,
    equipSkin, equipTrail, equipTitle, equipBadge, equipEffect,
  };
}
