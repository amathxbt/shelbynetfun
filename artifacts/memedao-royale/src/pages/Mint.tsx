import { useState, useRef } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useMemeStore } from "../store/memeStore";
import { uploadToShelby } from "../lib/shelby";
import { MODULE_ADDR } from "../lib/aptos";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Upload, Wand2, Loader2, CheckCircle2, Shield, Zap } from "lucide-react";
import type { Meme } from "../lib/types";

type Step = "generate" | "upload" | "mint" | "done";

export default function Mint() {
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const { addMeme, memes } = useMemeStore();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [step, setStep] = useState<Step>("generate");
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [shelbyResult, setShelbyResult] = useState<{ objectId: string; proofHash: string; url: string } | null>(null);
  const [mintedMeme, setMintedMeme] = useState<Meme | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const REPLICATE_KEY = import.meta.env.VITE_REPLICATE_API_KEY || "";

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      if (REPLICATE_KEY) {
        const resp = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            Authorization: `Token ${REPLICATE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            version: "black-forest-labs/flux-schnell",
            input: { prompt, num_outputs: 1, aspect_ratio: "1:1" },
          }),
        });
        const pred = await resp.json();
        let output = pred.output;
        while (!output) {
          await new Promise((r) => setTimeout(r, 1500));
          const poll = await fetch(`https://api.replicate.com/v1/predictions/${pred.id}`, {
            headers: { Authorization: `Token ${REPLICATE_KEY}` },
          });
          const p = await poll.json();
          output = p.output;
          if (p.status === "failed") throw new Error("Generation failed");
        }
        setPreviewUrl(Array.isArray(output) ? output[0] : output);
        setTitle(title || prompt.slice(0, 40));
        setStep("upload");
      } else {
        const seed = Math.floor(Math.random() * 9999);
        await new Promise((r) => setTimeout(r, 1000));
        setPreviewUrl(`https://picsum.photos/seed/${seed}/500/500`);
        setTitle(title || prompt.slice(0, 40));
        setStep("upload");
        toast({ title: "Demo mode: using placeholder image. Set VITE_REPLICATE_API_KEY for real AI." });
      }
    } catch {
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setStep("upload");
  }

  async function handleUpload() {
    if (!previewUrl && !file) return;
    setUploading(true);
    try {
      let uploadFile = file;
      if (!uploadFile && previewUrl) {
        const resp = await fetch(previewUrl);
        const blob = await resp.blob();
        uploadFile = new File([blob], "meme.jpg", { type: blob.type });
      }
      if (!uploadFile) throw new Error("No file");
      const result = await uploadToShelby(uploadFile);
      setShelbyResult(result);
      if (result.url.startsWith("blob:")) setPreviewUrl(result.url);
      setStep("mint");
      toast({ title: "Uploaded to Shelby ✓", description: `Object: ${result.objectId}` });
    } catch (err) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function handleMint() {
    if (!shelbyResult || !connected || !account) {
      toast({ title: "Connect your wallet first", variant: "destructive" });
      return;
    }
    setMinting(true);
    try {
      await signAndSubmitTransaction({
        data: {
          function: `${MODULE_ADDR}::meme_dao_royale::mint_meme`,
          typeArguments: [],
          functionArguments: [MODULE_ADDR, title || "Untitled Meme", shelbyResult.objectId, shelbyResult.proofHash],
        },
      });
      toast({ title: "Minted on-chain! 🎉" });
    } catch {
      toast({ title: "Tx failed — recording locally", description: "Likely demo mode" });
    }

    const newMeme: Meme = {
      id: (memes[0]?.id ?? 0) + Math.floor(Math.random() * 100) + 1,
      title: title || "Untitled Meme",
      shelbyObjectId: shelbyResult.objectId,
      proofHash: shelbyResult.proofHash,
      creator: account?.address ?? "0x0",
      parentId: 0,
      voteCount: 0,
      timestampUs: Date.now() * 1000,
      isLegendary: false,
      imageUrl: shelbyResult.url.startsWith("blob:") ? shelbyResult.url : previewUrl ?? undefined,
    };
    addMeme(newMeme);
    setMintedMeme(newMeme);
    setStep("done");
    setMinting(false);
  }

  const STEPS = [
    { key: "generate", label: "Generate" },
    { key: "upload", label: "Shelby Upload" },
    { key: "mint", label: "Mint On-Chain" },
    { key: "done", label: "Done!" },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-black shelby-text-gradient mb-2 text-center">Mint a Meme</h1>
      <p className="text-center text-muted-foreground mb-8">AI generate → Shelby upload → On-chain proof</p>

      {/* Stepper */}
      <div className="flex items-center mb-10">
        {STEPS.map((s, i) => {
          const idx = STEPS.findIndex((x) => x.key === step);
          const done = i < idx;
          const active = s.key === step;
          return (
            <div key={s.key} className="flex items-center flex-1 last:flex-none">
              <div className={`flex flex-col items-center gap-1 ${active ? "opacity-100" : done ? "opacity-100" : "opacity-40"}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition ${
                  done ? "bg-[#86d883] border-[#86d883] text-white" : active ? "bg-[#d66868] border-[#d66868] text-white" : "border-border bg-background text-muted-foreground"
                }`}>
                  {done ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <span className="text-[10px] font-medium whitespace-nowrap">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mb-4 ${done ? "bg-[#86d883]" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-5">
        {step === "generate" && (
          <>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Meme Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a catchy title..."
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#d66868]/40"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">AI Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A degen ape holding ShelbyUSD bags on the moon, pixel art style..."
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#d66868]/40 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#af85db] py-3 text-sm font-bold text-white transition hover:bg-[#9a70c6] disabled:opacity-50"
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                {generating ? "Generating…" : "Generate with AI"}
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border-2 border-dashed border-[#6dd6ce] px-4 py-3 text-sm font-semibold text-[#6dd6ce] transition hover:bg-[#6dd6ce]/10"
              >
                <Upload size={16} /> Upload
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            </div>
          </>
        )}

        {(step === "upload" || step === "mint") && previewUrl && (
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-xl border border-border">
              <img src={previewUrl} alt="Meme preview" className="h-full w-full object-cover" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Meme Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your masterpiece a name..."
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#d66868]/40"
              />
            </div>
          </div>
        )}

        {step === "upload" && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#6dd6ce] py-3 text-sm font-bold text-[#0d3c3a] transition hover:bg-[#5ac5bd] disabled:opacity-50"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
            {uploading ? "Uploading to Shelby…" : "Upload & Get Proof Hash"}
          </button>
        )}

        {step === "mint" && shelbyResult && (
          <div className="space-y-4">
            <div className="rounded-xl bg-[#86d883]/10 border border-[#86d883] p-3 text-xs font-mono space-y-1">
              <div className="flex items-center gap-1 font-semibold text-[#2d6b2a]">
                <CheckCircle2 size={13} /> Shelby upload confirmed
              </div>
              <div className="text-muted-foreground break-all">Object ID: {shelbyResult.objectId}</div>
              <div className="text-muted-foreground break-all">Proof: {shelbyResult.proofHash.slice(0, 48)}…</div>
            </div>
            <button
              onClick={handleMint}
              disabled={minting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#d66868] py-3 text-sm font-bold text-white transition hover:bg-[#c45858] disabled:opacity-50"
            >
              {minting ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              {minting ? "Minting on Shelbynet…" : "Mint On-Chain"}
            </button>
          </div>
        )}

        {step === "done" && mintedMeme && (
          <div className="text-center space-y-4">
            <div className="text-5xl">🎉</div>
            <h3 className="text-xl font-black">Your meme is on-chain!</h3>
            <p className="text-sm text-muted-foreground">
              Meme #{mintedMeme.id} is now immortalised on Shelbynet with a cryptographic proof of existence.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setStep("generate"); setPreviewUrl(null); setFile(null); setShelbyResult(null); setTitle(""); setPrompt(""); }}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted"
              >
                Mint Another
              </button>
              <button
                onClick={() => navigate("/arena")}
                className="flex-1 rounded-xl bg-[#d66868] py-2.5 text-sm font-bold text-white hover:bg-[#c45858]"
              >
                Go to Arena →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
