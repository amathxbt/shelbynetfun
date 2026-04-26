import { Link } from "wouter";
import { Zap, Shield, GitFork, Trophy, ArrowRight, Flame } from "lucide-react";
import { useMemeStore } from "../store/memeStore";

function HexAccent({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 115" className={className} fill="currentColor">
      <polygon points="50,5 95,30 95,80 50,105 5,80 5,30" />
    </svg>
  );
}

export default function Home() {
  const { memes } = useMemeStore();
  const topMeme = [...memes].sort((a, b) => b.voteCount - a.voteCount)[0];

  return (
    <div className="relative overflow-hidden bg-[#2B1E0E]">
      {/* Hex background accents */}
      <HexAccent className="absolute -top-16 -right-16 w-72 text-[#F472B6] opacity-[0.06] rotate-12" />
      <HexAccent className="absolute top-40 -left-20 w-56 text-[#F472B6] opacity-[0.04] -rotate-6" />
      <HexAccent className="absolute bottom-10 right-20 w-40 text-[#F472B6] opacity-[0.05] rotate-3" />

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#F472B6]/40 bg-[#F472B6]/10 px-4 py-1.5 text-sm font-medium text-[#F472B6] mb-6">
          <Flame size={14} />
          Live on Shelbynet · Aptos-powered
        </div>

        <h1 className="text-6xl font-black leading-tight tracking-tight mb-4">
          <span className="shelby-text-gradient">MemeDAO</span>
          <br />
          <span className="text-[#FDF0E4]">Royale</span>
        </h1>

        <p className="mx-auto max-w-xl text-xl text-[#c8a48e] mb-8 leading-relaxed">
          The first fully on-chain AI meme provenance arena. Generate, mint, vote, and
          remix memes — all ownership lives in Move contracts on Shelbynet.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          <Link
            href="/mint"
            className="flex items-center gap-2 rounded-full bg-[#F472B6] px-6 py-3 text-base font-bold text-[#2B1E0E] shadow-lg shadow-[#F472B640] transition hover:bg-[#EC4899] active:scale-95"
          >
            Enter the Arena <ArrowRight size={18} />
          </Link>
          <Link
            href="/arena"
            className="flex items-center gap-2 rounded-full border-2 border-[#F472B6] px-6 py-3 text-base font-bold text-[#F472B6] transition hover:bg-[#F472B615]"
          >
            Live Gallery
          </Link>
        </div>

        {/* Stats bar */}
        <div className="mx-auto max-w-3xl grid grid-cols-3 gap-px rounded-2xl overflow-hidden border border-[#4D3826] shadow-sm bg-[#4D3826]">
          {[
            { label: "Memes Minted", value: memes.length },
            { label: "Total Votes", value: memes.reduce((s, m) => s + m.voteCount, 0) },
            { label: "Proof Lords", value: memes.filter((m) => m.isLegendary).length },
          ].map((s) => (
            <div key={s.label} className="bg-[#372818] py-6">
              <div className="text-3xl font-black text-[#F472B6]">{s.value}</div>
              <div className="text-sm text-[#c8a48e] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-2xl font-black text-center mb-8 text-[#FDF0E4]">How It Works</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-[#4D3826] bg-[#372818] p-5 hover:border-[#F472B6]/40 transition card-glow">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F472B6] text-[#2B1E0E]">
                {f.icon}
              </div>
              <h3 className="font-bold mb-1 text-[#FDF0E4]">{f.title}</h3>
              <p className="text-sm text-[#c8a48e] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top meme spotlight */}
      {topMeme && (
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="rounded-3xl overflow-hidden border-2 border-[#F472B6] bg-[#372818] shadow-lg legendary-glow">
            <div className="grid md:grid-cols-2">
              <div className="aspect-square md:aspect-auto">
                {topMeme.imageUrl && (
                  <img src={topMeme.imageUrl} alt={topMeme.title} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex flex-col justify-center p-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge-proof-lord rounded-full px-3 py-1 text-xs flex items-center gap-1">
                    <Trophy size={12} /> Current Proof Lord
                  </span>
                </div>
                <h3 className="text-2xl font-black mb-2 text-[#FDF0E4]">{topMeme.title}</h3>
                <p className="text-sm text-[#c8a48e] font-mono mb-4 break-all">
                  Proof: {topMeme.proofHash.slice(0, 40)}…
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-[#F472B6]">{topMeme.voteCount}</span>
                  <span className="text-[#c8a48e]">votes</span>
                  <Link
                    href="/arena"
                    className="ml-auto rounded-full bg-[#F472B6] px-4 py-2 text-sm font-bold text-[#2B1E0E] hover:bg-[#EC4899]"
                  >
                    Vote Now →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Badge showcase */}
      <section className="border-t border-[#4D3826] bg-[#231608] py-12">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-xl font-black mb-6 text-[#FDF0E4]">Earn On-Chain Badges</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {BADGES.map((b) => (
              <div
                key={b.name}
                className="flex items-center gap-2 rounded-full border border-[#F472B6]/40 px-4 py-2 text-sm font-semibold text-[#F472B6] bg-[#F472B615]"
              >
                <span>{b.emoji}</span> {b.name}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const FEATURES = [
  {
    title: "AI Generate",
    desc: "Use Replicate/Flux to generate dank memes from a prompt in seconds.",
    icon: <Zap size={20} />,
  },
  {
    title: "Shelby Upload",
    desc: "Content goes to Shelby decentralised storage. Get a tamper-proof hash.",
    icon: <Shield size={20} />,
  },
  {
    title: "Mint On-Chain",
    desc: "Meme resource with proof hash, object ID, and creator lands on Shelbynet.",
    icon: <Flame size={20} />,
  },
  {
    title: "Remix & Vote",
    desc: "Fork any meme on-chain. Vote once per wallet. Top memes become Legendary.",
    icon: <GitFork size={20} />,
  },
];

const BADGES = [
  { name: "Proof Lord", emoji: "👑" },
  { name: "Meme Overlord", emoji: "🔥" },
  { name: "Fork Wizard", emoji: "🔱" },
  { name: "Shelby Sage", emoji: "🌊" },
  { name: "Hash Prophet", emoji: "⚡" },
  { name: "Arena Champion", emoji: "🏆" },
  { name: "Remix Deity", emoji: "🎭" },
];
