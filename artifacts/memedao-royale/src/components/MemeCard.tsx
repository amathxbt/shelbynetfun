import { Trophy, GitFork, ThumbsUp, Clock, Shield } from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useMemeStore } from "../store/memeStore";
import type { Meme } from "../lib/types";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { MODULE_ADDR } from "../lib/aptos";
import { useState, useEffect, useRef } from "react";

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

const MAX_RETRIES = 3;
const RETRY_DELAYS = [3000, 6000, 12000];

function RetryImage({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [failed, setFailed] = useState(false);
  const retryCount = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setImgSrc(src);
    setFailed(false);
    retryCount.current = 0;
  }, [src]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function handleError() {
    if (retryCount.current >= MAX_RETRIES) {
      setFailed(true);
      return;
    }
    const delay = RETRY_DELAYS[retryCount.current] ?? 12000;
    retryCount.current += 1;
    timerRef.current = setTimeout(() => {
      setImgSrc(`${src}${src.includes("?") ? "&" : "?"}_r=${retryCount.current}`);
    }, delay);
  }

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#F472B615]">
        <span className="text-4xl">🎭</span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      onError={handleError}
    />
  );
}

export function MemeCard({ meme }: MemeCardProps) {
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const { vote, hasVoted } = useMemeStore();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const alreadyVoted = hasVoted(meme.id);

  async function handleVote() {
    if (!connected || !account) {
      toast({ title: "Connect Petra wallet to vote", variant: "destructive" });
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
          // caller (signer) is implicit — only pass registry address + meme_id
          functionArguments: [MODULE_ADDR, meme.id.toString()],
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
      className={`group relative overflow-hidden rounded-2xl border bg-[#372818] transition-all duration-200 card-glow ${
        meme.isLegendary ? "legendary-glow border-[#F472B6]" : "border-[#4D3826]"
      }`}
    >
      {meme.isLegendary && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full badge-proof-lord px-2.5 py-1 text-xs shadow">
          <Trophy size={11} />
          Proof Lord
        </div>
      )}
      {isRemix && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-[#F472B620] border border-[#F472B6] px-2 py-0.5 text-[10px] font-semibold text-[#F472B6]">
          <GitFork size={10} />
          Remix of #{meme.parentId}
        </div>
      )}

      <div className="aspect-square overflow-hidden bg-[#2B1E0E]">
        {meme.imageUrl ? (
          <RetryImage src={meme.imageUrl} alt={meme.title} />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#F472B615]">
            <span className="text-4xl">🎭</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-[#FDF0E4] line-clamp-2 leading-snug mb-1">
          {meme.title}
        </h3>

        <div className="mb-3 flex items-center gap-2 text-xs text-[#c8a48e]">
          <span title={meme.creator} className="font-mono">
            {shortAddr(meme.creator)}
          </span>
          <span>·</span>
          <Clock size={10} />
          {timeAgo(meme.timestampUs)}
        </div>

        <div className="mb-3 rounded-lg bg-[#2B1E0E] p-2 font-mono text-[10px] text-[#c8a48e] break-all border border-[#4D3826]">
          <Shield size={10} className="inline mr-1 text-[#F472B6]" />
          {meme.proofHash.slice(0, 32)}…
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleVote}
            disabled={alreadyVoted}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold transition active:scale-95 ${
              alreadyVoted
                ? "bg-[#4D3826] text-[#c8a48e] cursor-not-allowed"
                : "bg-[#F472B6] text-[#2B1E0E] hover:bg-[#EC4899]"
            }`}
          >
            <ThumbsUp size={13} />
            {alreadyVoted ? "Voted" : "Vote"} · {meme.voteCount}
          </button>

          <button
            onClick={() => navigate(`/remix/${meme.id}`)}
            className="flex items-center gap-1 rounded-full border border-[#F472B6]/50 px-3 py-1.5 text-xs font-medium text-[#F472B6] transition hover:bg-[#F472B615]"
          >
            <GitFork size={12} />
            Remix
          </button>
        </div>
      </div>
    </div>
  );
}
