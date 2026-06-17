import { useState } from "react";
import { type SaveData } from "../game/storage";
import { randomName } from "../game/storage";
import { Button, Panel, ScreenShell } from "../ui";

interface Props {
  save: SaveData;
  onBack: () => void;
  onChange: (patch: Partial<SaveData>) => void;
  onReset: () => void;
}

export default function Settings({ save, onBack, onChange, onReset }: Props) {
  const [nameInput, setNameInput] = useState(save.playerName);

  const handleNameSubmit = () => {
    const trimmed = nameInput.trim().slice(0, 16);
    if (trimmed && trimmed !== save.playerName) {
      onChange({ playerName: trimmed });
    }
  };

  return (
    <ScreenShell title="Settings" onBack={onBack}>
      <div className="space-y-4">
        <Panel>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-300">Player Name</h3>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={16}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              placeholder="Enter name..."
            />
            <Button onClick={handleNameSubmit} className="text-xs px-3 py-2">
              Save
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                const newName = randomName();
                setNameInput(newName);
                onChange({ playerName: newName });
              }}
              className="text-xs px-3 py-2"
            >
              Random
            </Button>
          </div>
        </Panel>

        <Panel>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-300">Audio</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Music Volume</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={save.musicVol}
                onChange={(e) => onChange({ musicVol: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">SFX Volume</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={save.sfxVol}
                onChange={(e) => onChange({ sfxVol: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        </Panel>

        <Panel>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-300">Accessibility</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={save.reducedMotion}
                onChange={(e) => onChange({ reducedMotion: e.target.checked })}
                className="accent-emerald-500"
              />
              <span className="text-sm text-slate-200">Reduced Motion</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={save.highContrast}
                onChange={(e) => onChange({ highContrast: e.target.checked })}
                className="accent-emerald-500"
              />
              <span className="text-sm text-slate-200">High Contrast Mode</span>
            </label>
          </div>
        </Panel>

        <Panel>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-300">Data</h3>
          <Button variant="danger" onClick={onReset} className="w-full">
            Reset All Progress
          </Button>
        </Panel>
      </div>
    </ScreenShell>
  );
}
