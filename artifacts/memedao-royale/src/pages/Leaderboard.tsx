import { useMemeStore } from "../store/memeStore";
import { Trophy, Medal, Star, Crown, Flame, GitFork } from "lucide-react";

const BADGE_TIERS = [
  { min: 10, label: "Proof Lord", emoji: "👑", color: "#F472B6", bg: "#F472B620" },
  { min: 7, label: "Meme Overlord", emoji: "🔥", color: "#EC4899", bg: "#EC489920" },
  { min: 4, label: "Fork Wizard", emoji: "🔱", color: "#F9A8D4", bg: "#F9A8D420" },
  { min: 1, label: "Shelby Sage", emoji: "🌊", color: "#FBCFE8", bg: "#FBCFE820" },
  { min: 0, label: "Ngmi", emoji: "😬", color: "#c8a48e", bg: "#c8a48e20" },
];

function getBadge(votes: number) {
  return BADGE_TIERS.find((t) => votes >= t.min) ?? BADGE_TIERS[BADGE_TIERS.length - 1];
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Leaderboard() {
  const { memes } = useMemeStore();

  const sorted = [...memes].sort((a, b) => b.voteCount - a.voteCount);
  const legendary = sorted.filter((m) => m.isLegendary);

  const creatorMap: Record<string, { votes: number; memes: number; isLegendary: boolean }> = {};
  for (const m of memes) {
    if (!creatorMap[m.creator]) creatorMap[m.creator] = { votes: 0, memes: 0, isLegendary: false };
    creatorMap[m.creator].votes += m.voteCount;
    creatorMap[m.creator].memes += 1;
    if (m.isLegendary) creatorMap[m.creator].isLegendary = true;
  }
  const creators = Object.entries(creatorMap)
    .map(([addr, s]) => ({ addr, ...s }))
    .sort((a, b) => b.votes - a.votes);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black shelby-text-gradient mb-2">Hall of Fame</h1>
        <p className="text-[#c8a48e]">The dankest memes on Shelbynet</p>
      </div>

      {/* Legendary podium */}
      {legendary.length > 0 && (
        <section className="mb-10">
          <h2 className="flex items-center gap-2 text-lg font-bold mb-4 text-[#FDF0E4]">
            <Crown size={20} className="text-[#F472B6]" /> Proof Lords
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {legendary.map((m) => (
              <div key={m.id} className="legendary-glow rounded-2xl border border-[#F472B6] bg-[#372818] overflow-hidden">
                {m.imageUrl && (
                  <div className="aspect-video overflow-hidden">
                    <img src={m.imageUrl} alt={m.title} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <span className="badge-proof-lord rounded-full px-2.5 py-0.5 text-xs flex items-center gap-1 w-fit mb-2">
                    <Crown size={10} /> Proof Lord
                  </span>
                  <h3 className="font-bold line-clamp-1 text-[#FDF0E4]">{m.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-sm text-[#c8a48e]">
                    <Trophy size={13} className="text-[#F472B6]" />
                    <span className="font-bold text-[#F472B6]">{m.voteCount}</span> votes
                    <span className="ml-auto font-mono text-xs">{shortAddr(m.creator)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Top Memes */}
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold mb-4 text-[#FDF0E4]">
            <Flame size={18} className="text-[#F472B6]" /> Top Memes
          </h2>
          <div className="space-y-3">
            {sorted.slice(0, 10).map((m, i) => {
              const badge = getBadge(m.voteCount);
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-[#4D3826] bg-[#372818] p-3 hover:border-[#F472B6]/40 transition">
                  <div className="w-7 text-center">
                    {i === 0 ? <Trophy size={18} className="text-[#F472B6] mx-auto" /> :
                     i === 1 ? <Medal size={18} className="text-[#EC4899] mx-auto" /> :
                     i === 2 ? <Star size={18} className="text-[#F9A8D4] mx-auto" /> :
                     <span className="text-sm font-bold text-[#c8a48e]">#{i + 1}</span>}
                  </div>
                  {m.imageUrl && (
                    <img src={m.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm line-clamp-1 text-[#FDF0E4]">{m.title}</div>
                    <div className="flex items-center gap-1.5 text-xs text-[#c8a48e] mt-0.5">
                      <span style={{ color: badge.color }}>{badge.emoji} {badge.label}</span>
                      {m.parentId > 0 && <><GitFork size={9} /> Remix</>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-lg" style={{ color: badge.color }}>{m.voteCount}</div>
                    <div className="text-[10px] text-[#c8a48e]">votes</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Creator rankings */}
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold mb-4 text-[#FDF0E4]">
            <Crown size={18} className="text-[#F472B6]" /> Top Creators
          </h2>
          <div className="space-y-3">
            {creators.slice(0, 10).map((c, i) => {
              const badge = getBadge(c.votes);
              return (
                <div key={c.addr} className="flex items-center gap-3 rounded-xl border border-[#4D3826] bg-[#372818] p-3 hover:border-[#F472B6]/40 transition">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-[#2B1E0E] text-sm flex-shrink-0 bg-[#F472B6]">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-[#FDF0E4]">{shortAddr(c.addr)}</div>
                    <div className="text-xs text-[#c8a48e]">{c.memes} meme{c.memes !== 1 ? "s" : ""}</div>
                  </div>
                  <div className="text-right">
                    <div
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold mb-1"
                      style={{ background: badge.bg, color: badge.color }}
                    >
                      {badge.emoji} {badge.label}
                    </div>
                    <div className="text-sm font-black" style={{ color: badge.color }}>{c.votes} votes</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
