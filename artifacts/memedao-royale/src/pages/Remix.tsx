import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useMemeStore } from "../store/memeStore";
import { uploadToShelby } from "../lib/shelby";
import { MODULE_ADDR } from "../lib/aptos";
import { useToast } from "@/hooks/use-toast";
import { GitFork, Upload, Loader2, CheckCircle2, Zap, Shield } from "lucide-react";
import type { Meme } from "../lib/types";

export default function Remix() {
  const params = useParams<{ id: string }>();
  const parentId = Number(params.id);
  const { memes, addMeme } = useMemeStore();
  const parent = memes.find((m) => m.id === parentId);
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [title, setTitle] = useState(parent ? `Remix of: ${parent.title}` : "");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(parent?.imageUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [shelbyResult, setShelbyResult] = useState<{ objectId: string; proofHash: string; url: string } | null>(null);
  const [done, setDone] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setShelbyResult(null);
  }

  async function handleUpload() {
    setUploading(true);
    try {
      let uploadFile = file;
      if (!uploadFile && previewUrl && previewUrl.startsWith("http")) {
        const resp = await fetch(previewUrl);
        const blob = await resp.blob();
        uploadFile = new File([blob], "remix.jpg", { type: blob.type });
      }
      if (!uploadFile) throw new Error("No file");
      const result = await uploadToShelby(uploadFile);
      setShelbyResult(result);
      toast({ title: "Uploaded to Shelby ✓" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function handleMint() {
    if (!shelbyResult) { toast({ title: "Upload to Shelby first" }); return; }
    if (!connected || !account) { toast({ title: "Connect wallet", variant: "destructive" }); return; }
    setMinting(true);
    try {
      await signAndSubmitTransaction({
        data: {
          function: `${MODULE_ADDR}::meme_dao_royale::remix_meme`,
          typeArguments: [],
          functionArguments: [MODULE_ADDR, parentId.toString(), title, shelbyResult.objectId, shelbyResult.proofHash],
        },
      });
      toast({ title: "Remix minted on-chain! 🎭" });
    } catch {
      toast({ title: "Tx failed — recording locally" });
    }

    const newMeme: Meme = {
      id: (memes[0]?.id ?? 0) + Math.floor(Math.random() * 100) + 1,
      title,
      shelbyObjectId: shelbyResult.objectId,
      proofHash: shelbyResult.proofHash,
      creator: account?.address?.toString() ?? "0x0",
      parentId,
      voteCount: 0,
      timestampUs: Date.now() * 1000,
      isLegendary: false,
      imageUrl: shelbyResult.url.startsWith("blob:") ? shelbyResult.url : previewUrl ?? undefined,
    };
    addMeme(newMeme);
    setDone(true);
    setMinting(false);
  }

  if (!parent) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="text-5xl mb-4">🤔</div>
        <h2 className="text-xl font-bold mb-2">Meme not found</h2>
        <button onClick={() => navigate("/arena")} className="rounded-full bg-[#d66868] px-4 py-2 text-sm font-bold text-white">
          Back to Arena
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center space-y-4">
        <div className="text-5xl">🎭</div>
        <h2 className="text-2xl font-black">Remix minted!</h2>
        <p className="text-muted-foreground text-sm">Your fork of "<b>{parent.title}</b>" is now on-chain.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate("/arena")} className="rounded-full bg-[#d66868] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#c45858]">
            Go to Arena →
          </button>
          <button onClick={() => navigate("/my-memes")} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">
            My Memes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center gap-2 mb-6">
        <GitFork size={22} className="text-[#af85db]" />
        <h1 className="text-2xl font-black">Remix a Meme</h1>
      </div>

      <div className="rounded-2xl border border-[#af85db] bg-[#af85db10] p-4 mb-6 flex items-center gap-3">
        {parent.imageUrl && (
          <img src={parent.imageUrl} alt="" className="h-14 w-14 rounded-xl object-cover flex-shrink-0" />
        )}
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground font-semibold mb-0.5 flex items-center gap-1">
            <GitFork size={10} /> Forking
          </div>
          <div className="font-bold truncate">{parent.title}</div>
          <div className="text-xs text-muted-foreground font-mono">{parent.creator.slice(0, 20)}…</div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-1.5">Remix Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#af85db]/40"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5">Upload Your Twist</label>
          <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#af85db] py-8 cursor-pointer hover:bg-[#af85db]/5 transition">
            {previewUrl && previewUrl !== parent.imageUrl ? (
              <img src={previewUrl} alt="" className="max-h-48 rounded-lg object-contain" />
            ) : (
              <>
                <Upload size={28} className="text-[#af85db] mb-2" />
                <span className="text-sm text-muted-foreground">Upload your remixed image</span>
                <span className="text-xs text-muted-foreground mt-1">Or keep the original</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        {shelbyResult ? (
          <div className="rounded-xl bg-[#86d883]/10 border border-[#86d883] p-3 text-xs font-mono">
            <div className="flex items-center gap-1 font-semibold text-[#2d6b2a] mb-1">
              <CheckCircle2 size={12} /> Shelby upload confirmed
            </div>
            <div className="text-muted-foreground break-all">Proof: {shelbyResult.proofHash.slice(0, 48)}…</div>
          </div>
        ) : (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#6dd6ce] py-3 text-sm font-bold text-[#0d3c3a] transition hover:bg-[#5ac5bd] disabled:opacity-50"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
            {uploading ? "Uploading…" : "Upload to Shelby & Get Proof"}
          </button>
        )}

        <button
          onClick={handleMint}
          disabled={minting || !shelbyResult}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#af85db] py-3 text-sm font-bold text-white transition hover:bg-[#9a70c6] disabled:opacity-50"
        >
          {minting ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
          {minting ? "Minting Remix On-Chain…" : "Mint Remix On-Chain"}
        </button>
      </div>
    </div>
  );
}
