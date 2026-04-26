import { useState } from "react";
import { useMemeStore } from "../store/memeStore";
import { MemeCard } from "../components/MemeCard";
import { Trophy, Flame, Clock, Zap } from "lucide-react";

type SortKey = "votes" | "newest" | "legendary";

export default function Arena() {
  const { memes } = useMemeStore();
  const [sort, setSort] = useState<SortKey>("votes");

  const sorted = [...memes].sort((a, b) => {
    if (sort === "votes") return b.voteCount - a.voteCount;
    if (sort === "newest") return b.timestampUs - a.timestampUs;
    if (sort === "legendary") {
      if (a.isLegendary === b.isLegendary) return b.voteCount - a.voteCount;
      return a.isLegendary ? -1 : 1;
    }
    return 0;
  });

  const totalVotes = memes.reduce((s, m) => s + m.voteCount, 0);
  const legendaryCount = memes.filter((m) => m.isLegendary).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black shelby-text-gradient mb-2">
          Meme Arena
        </h1>
        <p className="text-[#c8a48e] text-lg">
          Vote, remix, and earn legendary status on Shelbynet
        </p>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <Stat icon={<Flame size={20} className="text-[#F472B6]" />} label="Total Memes" value={memes.length} />
        <Stat icon={<Zap size={20} className="text-[#F472B6]" />} label="Total Votes" value={totalVotes} />
        <Stat icon={<Trophy size={20} className="text-[#F472B6]" />} label="Legendary" value={legendaryCount} />
      </div>

      <div className="mb-6 flex items-center gap-2">
        <span className="text-sm text-[#c8a48e] mr-1">Sort by:</span>
        {(["votes", "newest", "legendary"] as SortKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setSort(k)}
            className={`rounded-full px-3 py-1 text-sm font-medium capitalize transition ${
              sort === k
                ? "bg-[#F472B6] text-[#2B1E0E] font-bold"
                : "bg-[#372818] text-[#c8a48e] hover:bg-[#4D3826]"
            }`}
          >
            {k}
          </button>
        ))}
        <div className="ml-auto text-sm text-[#c8a48e] flex items-center gap-1">
          <Clock size={13} /> Live
          <span className="h-2 w-2 rounded-full bg-[#F472B6] animate-pulse ml-1" />
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-6xl mb-4">🎭</div>
          <h3 className="text-xl font-semibold mb-2 text-[#FDF0E4]">No memes yet</h3>
          <p className="text-[#c8a48e]">Be the first to mint a meme!</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map((m) => (
            <MemeCard key={m.id} meme={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-[#4D3826] bg-[#372818] p-4">
      {icon}
      <span className="text-2xl font-black text-[#F472B6]">{value}</span>
      <span className="text-xs text-[#c8a48e]">{label}</span>
    </div>
  );
}
