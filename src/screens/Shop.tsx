import { useState } from "react";
import { type SaveData } from "../game/storage";
import { Button, CoinPill, Panel, ScreenShell, Tabs } from "../ui";
import { SKINS, TRAILS, POWERUPS, RARITY, type PowerUp } from "../game/data";

interface Props {
  save: SaveData;
  onBack: () => void;
  onBuySkin: (id: string) => void;
  onBuyTrail: (id: string) => void;
  onEquipSkin: (id: string) => void;
  onEquipTrail: (id: string) => void;
  onBuyPowerUp: (id: string) => void;
  onEquipPowerUp: (id: string) => void;
  onUnequipPowerUp: (id: string) => void;
}

const POWERUP_SLOTS = 2;

export default function Shop({
  save,
  onBack,
  onBuySkin,
  onBuyTrail,
  onEquipSkin,
  onEquipTrail,
  onBuyPowerUp,
  onEquipPowerUp,
  onUnequipPowerUp,
}: Props) {
  const [tab, setTab] = useState("skins");
  const equippedPowerUps = save.equippedPowerUps || [];

  const tabs = [
    { id: "skins", label: "Skins" },
    { id: "trails", label: "Trails" },
    { id: "powerups", label: "Power-Ups" },
  ];

  return (
    <ScreenShell title="Shop" onBack={onBack}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <CoinPill amount={save.coins} />
        {tab === "powerups" && (
          <div className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200">
            Loadout {equippedPowerUps.length}/{POWERUP_SLOTS}
          </div>
        )}
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "powerups" && (
        <Panel className="mt-4 border-emerald-400/20 bg-emerald-900/20 text-sm text-emerald-100">
          Equip up to two owned power-ups. They trigger automatically at the start of every run, while pickups still spawn mid-flight.
        </Panel>
      )}

      <div className="mt-4 space-y-2">
        {tab === "skins" && SKINS.map((skin) => (
          <ShopItem
            key={skin.id}
            name={skin.name}
            rarity={skin.rarity}
            image={skin.image}
            cost={skin.cost}
            owned={save.ownedSkins.includes(skin.id)}
            equipped={save.equippedSkin === skin.id}
            coins={save.coins}
            onBuy={() => onBuySkin(skin.id)}
            onEquip={() => onEquipSkin(skin.id)}
          />
        ))}
        {tab === "trails" && TRAILS.filter((t) => t.id !== "none").map((trail) => (
          <ShopItem
            key={trail.id}
            name={trail.name}
            rarity={trail.rarity}
            image={trail.color ? "✦" : "○"}
            cost={trail.cost}
            owned={save.ownedTrails.includes(trail.id)}
            equipped={save.equippedTrail === trail.id}
            coins={save.coins}
            onBuy={() => onBuyTrail(trail.id)}
            onEquip={() => onEquipTrail(trail.id)}
          />
        ))}
        {tab === "powerups" && POWERUPS.map((pu) => {
          const owned = save.ownedPowerUps.includes(pu.id);
          const equipped = equippedPowerUps.includes(pu.id);
          return (
            <PowerUpItem
              key={pu.id}
              pu={pu}
              owned={owned}
              equipped={equipped}
              canEquip={equippedPowerUps.length < POWERUP_SLOTS}
              coins={save.coins}
              onBuy={() => onBuyPowerUp(pu.id)}
              onEquip={() => onEquipPowerUp(pu.id)}
              onUnequip={() => onUnequipPowerUp(pu.id)}
            />
          );
        })}
      </div>
    </ScreenShell>
  );
}

function ShopItem({ name, rarity, image, cost, owned, equipped, coins, onBuy, onEquip }: {
  name: string; rarity: string; image: string; cost: number;
  owned: boolean; equipped: boolean; coins: number; onBuy: () => void; onEquip: () => void;
}) {
  const r = RARITY[rarity as keyof typeof RARITY] || RARITY.common;
  return (
    <Panel className="flex items-center gap-3">
      <span className="text-2xl">{image}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="block truncate text-sm font-bold text-white">{name}</span>
          <span className={`text-[10px] font-bold uppercase ${r.color}`}>{r.label}</span>
        </div>
      </div>
      {owned ? (
        <Button
          variant={equipped ? "secondary" : "ghost"}
          onClick={onEquip}
          className="px-3 py-1.5 text-xs"
        >
          {equipped ? "Equipped" : "Equip"}
        </Button>
      ) : (
        <Button
          variant="primary"
          onClick={onBuy}
          disabled={coins < cost}
          className="px-3 py-1.5 text-xs"
        >
          {cost}🪙
        </Button>
      )}
    </Panel>
  );
}

function PowerUpItem({ pu, owned, equipped, canEquip, coins, onBuy, onEquip, onUnequip }: {
  pu: PowerUp; owned: boolean; equipped: boolean; canEquip: boolean; coins: number;
  onBuy: () => void; onEquip: () => void; onUnequip: () => void;
}) {
  return (
    <Panel className={`flex items-center gap-3 ${equipped ? "border-emerald-400/40 bg-emerald-900/20" : ""}`}>
      <div className={`flex size-11 items-center justify-center rounded-xl bg-gradient-to-br text-xl shadow-lg ${pu.gradient}`}>
        {pu.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-white">{pu.name}</div>
        <div className="text-xs text-slate-400">{pu.description}</div>
        <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
          {pu.duration > 0 ? `${pu.duration}s duration` : "Instant charge"}
        </div>
      </div>
      {owned ? (
        <Button
          variant={equipped ? "secondary" : "ghost"}
          onClick={equipped ? onUnequip : onEquip}
          disabled={!equipped && !canEquip}
          className="px-3 py-1.5 text-xs"
        >
          {equipped ? "Equipped" : canEquip ? "Equip" : "Full"}
        </Button>
      ) : (
        <Button
          variant="primary"
          onClick={onBuy}
          disabled={coins < pu.cost}
          className="px-3 py-1.5 text-xs"
        >
          {pu.cost}🪙
        </Button>
      )}
    </Panel>
  );
}
