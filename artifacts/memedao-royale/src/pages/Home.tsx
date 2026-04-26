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
    <div className="relative overflow-hidden bg-[#f8f7f4]">
      {/* Hex background accents */}
      <HexAccent className="absolute -top-16 -right-16 w-72 text-[#d66868] opacity-[0.06] rotate-12" />
      <HexAccent className="absolute top-40 -left-20 w-56 text-[#6dd6ce] opacity-[0.07] -rotate-6" />
      <HexAccent className="absolute bottom-10 right-20 w-40 text-[#af85db] opacity-[0.08] rotate-3" />

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#d66868]/30 bg-[#d66868]/10 px-4 py-1.5 text-sm font-medium text-[#d66868] mb-6">
          <Flame size={14} />
          Live on Shelbynet · Aptos-powered
        </div>

        <h1 className="text-6xl font-black leading-tight tracking-tight mb-4">
          <span className="shelby-text-gradient">MemeDAO</span>
          <br />
          <span className="text-foreground">Royale</span>
        </h1>

        <p className="mx-auto max-w-xl text-xl text-muted-foreground mb-8 leading-relaxed">
          The first fully on-chain AI meme provenance arena. Generate, mint, vote, and
          remix memes — all ownership lives in Move contracts on Shelbynet.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          <Link
            href="/mint"
            className="flex items-center gap-2 rounded-full bg-[#d66868] px-6 py-3 text-base font-bold text-white shadow-lg transition hover:bg-[#c45858] hover:shadow-xl active:scale-95"
          >
            Enter the Arena <ArrowRight size={18} />
          </Link>
          <Link
            href="/arena"
            className="flex items-center gap-2 rounded-full border-2 border-[#6dd6ce] px-6 py-3 text-base font-bold text-[#6dd6ce] transition hover:bg-[#6dd6ce]/10"
          >
            Live Gallery
          </Link>
        </div>

        {/* Stats bar */}
        <div className="mx-auto max-w-3xl grid grid-cols-3 gap-px rounded-2xl overflow-hidden border border-border shadow-sm bg-border">
          {[
            { label: "Memes Minted", value: memes.length, color: "#d66868" },
            { label: "Total Votes", value: memes.reduce((s, m) => s + m.voteCount, 0), color: "#6dd6ce" },
            { label: "Proof Lords", value: memes.filter((m) => m.isLegendary).length, color: "#c1d848" },
          ].map((s) => (
            <div key={s.label} className="bg-white py-6">
              <div className="text-3xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-2xl font-black text-center mb-8">How It Works</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-white p-5 shadow-sm hover:shadow-md transition">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: f.color }}>
                {f.icon}
              </div>
              <h3 className="font-bold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top meme spotlight */}
      {topMeme && (
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="rounded-3xl overflow-hidden border-2 border-[#c1d848] bg-white shadow-lg legendary-glow">
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
                <h3 className="text-2xl font-black mb-2">{topMeme.title}</h3>
                <p className="text-sm text-muted-foreground font-mono mb-4 break-all">
                  Proof: {topMeme.proofHash.slice(0, 40)}…
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-[#c1d848]">{topMeme.voteCount}</span>
                  <span className="text-muted-foreground">votes</span>
                  <Link
                    href="/arena"
                    className="ml-auto rounded-full bg-[#d66868] px-4 py-2 text-sm font-bold text-white hover:bg-[#c45858]"
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
      <section className="bg-white border-t border-border py-12">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-xl font-black mb-6">Earn On-Chain Badges</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {BADGES.map((b) => (
              <div
                key={b.name}
                className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
                style={{ borderColor: b.color, color: b.color, background: `${b.color}15` }}
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
    color: "#af85db",
    icon: <Zap size={20} />,
  },
  {
    title: "Shelby Upload",
    desc: "Content goes to Shelby decentralised storage. Get a tamper-proof hash.",
    color: "#6dd6ce",
    icon: <Shield size={20} />,
  },
  {
    title: "Mint On-Chain",
    desc: "Meme resource with proof hash, object ID, and creator lands on Shelbynet.",
    color: "#d66868",
    icon: <Flame size={20} />,
  },
  {
    title: "Remix & Vote",
    desc: "Fork any meme on-chain. Vote once per wallet. Top memes become Legendary.",
    color: "#c1d848",
    icon: <GitFork size={20} />,
  },
];

const BADGES = [
  { name: "Proof Lord", emoji: "👑", color: "#c1d848" },
  { name: "Meme Overlord", emoji: "🔥", color: "#d66868" },
  { name: "Fork Wizard", emoji: "🔱", color: "#af85db" },
  { name: "Shelby Sage", emoji: "🌊", color: "#6dd6ce" },
  { name: "Hash Prophet", emoji: "⚡", color: "#86d883" },
  { name: "Arena Champion", emoji: "🏆", color: "#d66868" },
  { name: "Remix Deity", emoji: "🎭", color: "#af85db" },
];
