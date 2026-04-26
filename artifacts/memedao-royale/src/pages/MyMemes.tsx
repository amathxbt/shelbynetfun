import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useMemeStore } from "../store/memeStore";
import { MemeCard } from "../components/MemeCard";
import { Link } from "wouter";
import { Wallet, PlusCircle, Trophy, Flame } from "lucide-react";

export default function MyMemes() {
  const { account, connected } = useWallet();
  const { memes } = useMemeStore();

  const myMemes = memes.filter((m) => m.creator === account?.address?.toString());
  const totalVotes = myMemes.reduce((s, m) => s + m.voteCount, 0);
  const legendaryCount = myMemes.filter((m) => m.isLegendary).length;

  if (!connected || !account) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <Wallet size={48} className="mx-auto mb-4 text-[#d66868]" />
        <h2 className="text-2xl font-black mb-2">Connect Your Wallet</h2>
        <p className="text-muted-foreground mb-6">Connect your Aptos wallet to see your on-chain memes.</p>
        <p className="text-sm text-muted-foreground">Use the Connect Wallet button in the top right.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black shelby-text-gradient mb-1">My Memes</h1>
        <p className="font-mono text-sm text-muted-foreground">{account.address.toString()}</p>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-white p-4 text-center">
          <div className="text-3xl font-black text-[#d66868]">{myMemes.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Memes Minted</div>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 text-center">
          <div className="text-3xl font-black text-[#6dd6ce]">{totalVotes}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Votes</div>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 text-center">
          <div className="text-3xl font-black text-[#c1d848]">{legendaryCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Legendary</div>
        </div>
      </div>

      {myMemes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed border-border">
          <div className="text-5xl mb-4">🎭</div>
          <h3 className="text-xl font-bold mb-2">No memes yet</h3>
          <p className="text-muted-foreground mb-6 text-sm">Mint your first meme and join the arena!</p>
          <Link
            href="/mint"
            className="flex items-center gap-2 rounded-full bg-[#d66868] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#c45858]"
          >
            <PlusCircle size={16} /> Mint My First Meme
          </Link>
        </div>
      ) : (
        <>
          {legendaryCount > 0 && (
            <div className="mb-4 flex items-center gap-2 rounded-full badge-proof-lord px-4 py-2 w-fit">
              <Trophy size={14} /> You are a Proof Lord — {legendaryCount} legendary meme{legendaryCount !== 1 ? "s" : ""}!
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {myMemes.map((m) => <MemeCard key={m.id} meme={m} />)}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/mint"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#d66868] px-5 py-2 text-sm font-bold text-[#d66868] hover:bg-[#d66868]/10"
            >
              <PlusCircle size={15} /> Mint Another
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
