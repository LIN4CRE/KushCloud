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
}

export default function Shop({ save, onBack, onBuySkin, onBuyTrail, onEquipSkin, onEquipTrail, onBuyPowerUp }: Props) {
  const [tab, setTab] = useState("skins");

  const tabs = [
    { id: "skins", label: "Skins" },
    { id: "trails", label: "Trails" },
    { id: "powerups", label: "Power-Ups" },
  ];

  return (
    <ScreenShell title="Shop" onBack={onBack}>
      <div className="mb-4 flex items-center justify-between">
        <CoinPill amount={save.coins} />
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

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
        {tab === "powerups" && POWERUPS.map((pu) => (
          <PowerUpItem
            key={pu.id}
            pu={pu}
            owned={save.ownedPowerUps.includes(pu.id)}
            coins={save.coins}
            onBuy={() => onBuyPowerUp(pu.id)}
          />
        ))}
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
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white truncate">{name}</span>
          <span className={`text-[10px] font-bold uppercase ${r.color}`}>{r.label}</span>
        </div>
      </div>
      {owned ? (
        <Button
          variant={equipped ? "secondary" : "ghost"}
          onClick={onEquip}
          className="text-xs px-3 py-1.5"
        >
          {equipped ? "Equipped" : "Equip"}
        </Button>
      ) : (
        <Button
          variant="primary"
          onClick={onBuy}
          disabled={coins < cost}
          className="text-xs px-3 py-1.5"
        >
          {cost}🪙
        </Button>
      )}
    </Panel>
  );
}

function PowerUpItem({ pu, owned, coins, onBuy }: {
  pu: PowerUp; owned: boolean; coins: number; onBuy: () => void;
}) {
  return (
    <Panel className="flex items-center gap-3">
      <div className={`size-10 rounded-lg bg-gradient-to-br ${pu.gradient}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-white">{pu.name}</div>
        <div className="text-xs text-slate-400">{pu.description}</div>
      </div>
      {owned ? (
        <span className="text-xs text-emerald-400 font-bold">Owned</span>
      ) : (
        <Button
          variant="primary"
          onClick={onBuy}
          disabled={coins < pu.cost}
          className="text-xs px-3 py-1.5"
        >
          {pu.cost}🪙
        </Button>
      )}
    </Panel>
  );
}
