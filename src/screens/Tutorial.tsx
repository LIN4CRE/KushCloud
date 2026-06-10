import { useState } from "react";
import { Button } from "../ui";

interface Props {
  onDone: () => void;
  firstTime: boolean;
}

const STEPS = [
  {
    icon: "👆",
    title: "One Tap to Fly",
    text: "Tap the screen, click, or press Space / ↑ to flap upward. Let go and you'll drift down. That's the whole control scheme!",
  },
  {
    icon: "🫙",
    title: "Mind the Jars",
    text: "Fly through the gaps between the kush jars. Touch a jar or the ground and your run ends. Easy to learn... tough to master.",
  },
  {
    icon: "🍁",
    title: "Grab the Goods",
    text: "Snag floating leaves for Kush Coins. Spend coins in the Shop on skins & trails — all cosmetic, never pay-to-win.",
  },
  {
    icon: "🔥",
    title: "Build Combos",
    text: "Pass jars, grab coins, and pull off NEAR-MISSES (skim a gap edge) to build your combo multiplier for huge scores.",
  },
  {
    icon: "🏆",
    title: "Climb & Return",
    text: "Earn XP, level up, complete daily challenges, claim login streaks, and rise up the leaderboards. See you tomorrow!",
  },
];

export default function Tutorial({ onDone, firstTime }: Props) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-3xl bg-white/[0.08] backdrop-blur-md border border-white/[0.12] p-7 text-center shadow-[0_24px_64px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.07)]">
        {/* Icon */}
        <div className="mb-5 text-6xl animate-[float_2.5s_ease-in-out_infinite] drop-shadow-lg">
          {step.icon}
        </div>

        {/* Step counter */}
        <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-white/25">
          Step {i + 1} of {STEPS.length}
        </div>

        <h2 className="text-xl font-black text-white">{step.title}</h2>
        <p className="mt-3 min-h-[80px] text-sm font-medium leading-relaxed text-white/60">{step.text}</p>

        {/* Dot indicators */}
        <div className="my-6 flex justify-center gap-1.5">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`rounded-full transition-all duration-300 ${
                idx === i
                  ? "w-5 h-2 bg-lime-400 shadow-[0_0_6px_rgba(163,230,53,0.6)]"
                  : idx < i
                  ? "w-2 h-2 bg-white/30"
                  : "w-2 h-2 bg-white/15"
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-2.5">
          {i > 0 && (
            <Button variant="dark" className="flex-1" onClick={() => setI(i - 1)}>
              ‹ Back
            </Button>
          )}
          {last ? (
            <Button className="flex-1" onClick={onDone}>
              {firstTime ? "Let's Go! 🌿" : "Done"}
            </Button>
          ) : (
            <Button className="flex-1" onClick={() => setI(i + 1)}>
              Next ›
            </Button>
          )}
        </div>

        {!last && firstTime && (
          <button
            onClick={onDone}
            className="mt-4 text-[11px] font-semibold text-white/25 hover:text-white/45 transition-colors"
          >
            Skip tutorial
          </button>
        )}
      </div>
    </div>
  );
}
