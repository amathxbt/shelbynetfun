import { Trophy, GitFork, ThumbsUp, Clock, Shield } from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useMemeStore } from "../store/memeStore";
import type { Meme } from "../lib/types";
import { useNavigate } from "wouter";
import { useToast } from "@/components/ui/use-toast";
import { MODULE_ADDR, aptos } from "../lib/aptos";

interface MemeCardProps {
  meme: Meme;
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function timeAgo(tsUs: number) {
  const diffMs = Date.now() - tsUs / 1000;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function MemeCard({ meme }: MemeCardProps) {
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const { vote, hasVoted } = useMemeStore();
  const [, navigate] = useNavigate();
  const { toast } = useToast();
  const alreadyVoted = hasVoted(meme.id);

  async function handleVote() {
    if (!connected || !account) {
      toast({ title: "Connect wallet to vote", variant: "destructive" });
      return;
    }
    if (alreadyVoted) {
      toast({ title: "Already voted on this meme" });
      return;
    }
    try {
      await signAndSubmitTransaction({
        data: {
          function: `${MODULE_ADDR}::meme_dao_royale::vote`,
          typeArguments: [],
          functionArguments: [
            account.address,
            MODULE_ADDR,
            meme.id.toString(),
          ],
        },
      });
      vote(meme.id);
      toast({ title: "Vote cast on-chain! 🗳️" });
    } catch {
      vote(meme.id);
      toast({ title: "Vote recorded (demo mode)" });
    }
  }

  const isRemix = meme.parentId > 0;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-card transition-all duration-200 card-glow ${
        meme.isLegendary ? "legendary-glow border-[#c1d848]" : "border-border"
      }`}
    >
      {meme.isLegendary && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full badge-proof-lord px-2.5 py-1 text-xs shadow">
          <Trophy size={11} />
          Proof Lord
        </div>
      )}
      {isRemix && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-[#af85db22] border border-[#af85db] px-2 py-0.5 text-[10px] font-semibold text-[#af85db]">
          <GitFork size={10} />
          Remix of #{meme.parentId}
        </div>
      )}

      <div className="aspect-square overflow-hidden bg-muted">
        {meme.imageUrl ? (
          <img
            src={meme.imageUrl}
            alt={meme.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center shelby-gradient opacity-60">
            <span className="text-4xl">🎭</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-2 leading-snug mb-1">
          {meme.title}
        </h3>

        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span title={meme.creator} className="font-mono">
            {shortAddr(meme.creator)}
          </span>
          <span>·</span>
          <Clock size={10} />
          {timeAgo(meme.timestampUs)}
        </div>

        <div className="mb-3 rounded-lg bg-muted p-2 font-mono text-[10px] text-muted-foreground break-all">
          <Shield size={10} className="inline mr-1" />
          {meme.proofHash.slice(0, 32)}…
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleVote}
            disabled={alreadyVoted}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition active:scale-95 ${
              alreadyVoted
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-[#d66868] text-white hover:bg-[#c45858]"
            }`}
          >
            <ThumbsUp size={13} />
            {alreadyVoted ? "Voted" : "Vote"} · {meme.voteCount}
          </button>

          <button
            onClick={() => navigate(`/remix/${meme.id}`)}
            className="flex items-center gap-1 rounded-full border border-[#af85db] px-3 py-1.5 text-xs font-medium text-[#af85db] transition hover:bg-[#af85db15]"
          >
            <GitFork size={12} />
            Remix
          </button>
        </div>
      </div>
    </div>
  );
}
