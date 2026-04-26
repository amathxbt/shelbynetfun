import { useState, useRef } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { AccountAuthenticator, Deserializer, SimpleTransaction } from "@aptos-labs/ts-sdk";
import { useMemeStore } from "../store/memeStore";
import { uploadToShelby } from "../lib/shelby";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Upload, Wand2, Loader2, CheckCircle2, Shield, Zap, AlertTriangle, ExternalLink } from "lucide-react";
import { useIsCorrectNetwork } from "../components/NetworkWarning";
import type { Meme } from "../lib/types";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type Step = "generate" | "upload" | "mint" | "done";

export default function Mint() {
  const { connected, account, signTransaction } = useWallet();
  const { addMeme, memes, fetchFromChain } = useMemeStore();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const isCorrectNetwork = useIsCorrectNetwork();

  const [step, setStep] = useState<Step>("generate");
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [shelbyResult, setShelbyResult] = useState<{ objectId: string; proofHash: string; url: string } | null>(null);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      // Call our API server which uses gpt-image-1 — no key needed on the frontend
      const resp = await fetch(`${API_BASE}/api/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Generation failed");
      }
      const { b64_json } = await resp.json() as { b64_json: string };
      // Convert base64 → blob URL for preview
      const bytes = Uint8Array.from(atob(b64_json), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      // Store as File so it can be uploaded to Shelby
      setFile(new File([blob], "ai-meme.png", { type: "image/png" }));
      setPreviewUrl(url);
      setTitle(title || prompt.slice(0, 40));
      setStep("upload");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      toast({ title: "AI generation failed", description: msg, variant: "destructive" });
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
    let uploadFile: File | null = file;
    try {
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
      toast({ title: "Uploaded to Shelby ✓", description: `Object: ${result.objectId.slice(0, 20)}...` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Upload error:", msg);
      // If blob already exists, it's still a valid upload — proceed with the existing proof hash
      if (msg.includes("409") || msg.includes("already exists")) {
        toast({ title: "Upload note", description: "Blob already exists on Shelby — using existing proof.", variant: "default" });
        if (uploadFile) {
          const { computeProofHash } = await import("../lib/shelby");
          const ph = await computeProofHash(uploadFile);
          const blobName = `meme_${Date.now()}_${uploadFile.name.replace(/[^a-z0-9._-]/gi, "_")}`;
          setShelbyResult({ objectId: blobName, proofHash: ph, url: `shelby://${blobName}` });
          setStep("mint");
        }
        return;
      }
      toast({ title: "Upload failed", description: msg.slice(0, 120), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function handleMint() {
    if (!shelbyResult || !connected || !account) {
      toast({ title: "Connect your Petra wallet first", variant: "destructive" });
      return;
    }
    setMinting(true);
    try {
      // Step 1: ask the API server to build a fee-payer transaction
      // The deployer pays gas in ShelbyUSD, user just signs as sender
      const buildResp = await fetch(`${API_BASE}/api/mint/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderAddress: account.address.toString(),
          title: title || "Untitled Meme",
          objectId: shelbyResult.objectId,
          proofHash: shelbyResult.proofHash,
        }),
      });
      if (!buildResp.ok) {
        const err = await buildResp.json().catch(() => ({}));
        throw new Error(err.error || "Failed to build transaction");
      }
      const { txBytes } = await buildResp.json() as { txBytes: string };

      // Step 2: deserialize the transaction and have Petra sign it as sender only
      const rawBytes = Uint8Array.from(atob(txBytes), (c) => c.charCodeAt(0));
      const tx = SimpleTransaction.deserialize(new Deserializer(rawBytes));

      const senderAuthenticator = await signTransaction(tx);
      const authBytes = (senderAuthenticator as AccountAuthenticator).bcsToBytes();
      const senderAuthBytes = btoa(String.fromCharCode(...authBytes));

      // Step 3: send both back to API server — it signs as fee payer and submits
      const submitResp = await fetch(`${API_BASE}/api/mint/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txBytes, senderAuthBytes }),
      });
      if (!submitResp.ok) {
        const err = await submitResp.json().catch(() => ({}));
        throw new Error(err.error || "Transaction submission failed");
      }
      const { txHash, success } = await submitResp.json() as { txHash: string; success: boolean };

      if (!success) throw new Error("Transaction executed but reported failure");

      toast({
        title: "Minted on-chain with ShelbyUSD gas!",
        description: `Tx: ${txHash.slice(0, 20)}...`,
      });

      setMintTxHash(txHash);
      await fetchFromChain();
      setStep("done");
    } catch (err) {
      console.error("Mint error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Mint failed", description: msg, variant: "destructive" });
    } finally {
      setMinting(false);
    }
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
      <p className="text-center text-[#c8a48e] mb-8">AI generate → Shelby upload → On-chain proof</p>

      {/* Stepper */}
      <div className="flex items-center mb-10">
        {STEPS.map((s, i) => {
          const idx = STEPS.findIndex((x) => x.key === step);
          const done = i < idx;
          const active = s.key === step;
          return (
            <div key={s.key} className="flex items-center flex-1 last:flex-none">
              <div className={`flex flex-col items-center gap-1 ${active || done ? "opacity-100" : "opacity-40"}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition ${
                  done ? "bg-[#F472B6] border-[#F472B6] text-[#2B1E0E]"
                    : active ? "bg-[#F472B6] border-[#F472B6] text-[#2B1E0E]"
                    : "border-[#4D3826] bg-[#372818] text-[#c8a48e]"
                }`}>
                  {done ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <span className="text-[10px] font-medium whitespace-nowrap text-[#c8a48e]">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mb-4 ${done ? "bg-[#F472B6]" : "bg-[#4D3826]"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[#4D3826] bg-[#372818] p-6 shadow-sm space-y-5">
        {step === "generate" && (
          <>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-[#FDF0E4]">Meme Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a catchy title..."
                className="w-full rounded-xl border border-[#4D3826] bg-[#2B1E0E] px-4 py-2.5 text-sm text-[#FDF0E4] placeholder-[#c8a48e] outline-none focus:ring-2 focus:ring-[#F472B6]/40"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-[#FDF0E4]">AI Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A degen ape holding ShelbyUSD bags on the moon, pixel art style..."
                rows={3}
                className="w-full rounded-xl border border-[#4D3826] bg-[#2B1E0E] px-4 py-2.5 text-sm text-[#FDF0E4] placeholder-[#c8a48e] outline-none focus:ring-2 focus:ring-[#F472B6]/40 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#F472B6] py-3 text-sm font-bold text-[#2B1E0E] transition hover:bg-[#EC4899] disabled:opacity-50"
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                {generating ? "Generating..." : "Generate with AI"}
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border-2 border-dashed border-[#F472B6]/50 px-4 py-3 text-sm font-semibold text-[#F472B6] transition hover:bg-[#F472B6]/10"
              >
                <Upload size={16} /> Upload
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            </div>
          </>
        )}

        {(step === "upload" || step === "mint") && previewUrl && (
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-xl border border-[#4D3826]">
              <img src={previewUrl} alt="Meme preview" className="h-full w-full object-cover" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-[#FDF0E4]">Meme Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your masterpiece a name..."
                className="w-full rounded-xl border border-[#4D3826] bg-[#2B1E0E] px-4 py-2.5 text-sm text-[#FDF0E4] placeholder-[#c8a48e] outline-none focus:ring-2 focus:ring-[#F472B6]/40"
              />
            </div>
          </div>
        )}

        {step === "upload" && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#F472B6] py-3 text-sm font-bold text-[#2B1E0E] transition hover:bg-[#EC4899] disabled:opacity-50"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
            {uploading ? "Uploading to Shelby… (may take ~30s)" : "Upload & Get Proof Hash"}
          </button>
        )}

        {step === "mint" && shelbyResult && (
          <div className="space-y-4">
            <div className="rounded-xl bg-[#F472B6]/10 border border-[#F472B6]/30 p-3 text-xs font-mono space-y-1">
              <div className="flex items-center gap-1 font-semibold text-[#F472B6]">
                <CheckCircle2 size={13} /> Shelby upload confirmed
              </div>
              <div className="text-[#c8a48e] break-all">Object ID: {shelbyResult.objectId}</div>
              <div className="text-[#c8a48e] break-all">Proof: {shelbyResult.proofHash.slice(0, 48)}...</div>
            </div>

            {/* Gas info badge */}
            <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-900/20 px-3 py-2">
              <Zap size={13} className="text-green-400 shrink-0" />
              <span className="text-xs text-green-300 font-medium">
                Gas paid in <span className="font-bold text-green-400">ShelbyUSD</span> by the protocol — you don't need APT
              </span>
            </div>

            {connected && !isCorrectNetwork && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/50 bg-amber-900/40 p-3.5">
                <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-300">Wrong network — switch to Shelbynet</p>
                  <p className="text-xs text-amber-200/80">
                    Open Petra → Settings → Network →{" "}
                    <span className="font-bold text-amber-400">Shelbynet</span>.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleMint}
              disabled={minting || !connected || !isCorrectNetwork}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#F472B6] py-3 text-sm font-bold text-[#2B1E0E] transition hover:bg-[#EC4899] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {minting ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              {minting
                ? "Minting on-chain..."
                : !connected
                ? "Connect Petra to Mint"
                : !isCorrectNetwork
                ? "Switch Petra to Shelbynet"
                : "Mint On-Chain (ShelbyUSD gas)"}
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div className="text-5xl">🎉</div>
              <h3 className="text-xl font-black text-[#FDF0E4]">Your meme is on-chain!</h3>
              <p className="text-sm text-[#c8a48e]">
                Immortalised on Shelbynet. Gas paid in ShelbyUSD by the protocol.
              </p>
            </div>

            {/* Explorer links */}
            <div className="rounded-xl border border-[#4D3826] bg-[#2B1E0E] divide-y divide-[#4D3826] overflow-hidden text-sm">
              {mintTxHash && (
                <a
                  href={`https://explorer.shelby.xyz/shelbynet/txn/${mintTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 hover:bg-[#372818] transition group"
                >
                  <div className="space-y-0.5">
                    <div className="text-[#F472B6] font-semibold text-xs uppercase tracking-wide">Mint Transaction</div>
                    <div className="font-mono text-[#c8a48e] text-xs break-all">
                      {mintTxHash.slice(0, 30)}...
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-[#F472B6] shrink-0 ml-3 group-hover:scale-110 transition-transform" />
                </a>
              )}
              {shelbyResult && (
                <a
                  href={shelbyResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 hover:bg-[#372818] transition group"
                >
                  <div className="space-y-0.5">
                    <div className="text-[#F472B6] font-semibold text-xs uppercase tracking-wide">Shelby Storage Blob</div>
                    <div className="font-mono text-[#c8a48e] text-xs break-all">
                      {shelbyResult.objectId.slice(0, 30)}...
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-[#F472B6] shrink-0 ml-3 group-hover:scale-110 transition-transform" />
                </a>
              )}
              {shelbyResult && (
                <div className="px-4 py-3">
                  <div className="text-[#F472B6] font-semibold text-xs uppercase tracking-wide mb-1">Proof Hash (SHA-256)</div>
                  <div className="font-mono text-[#c8a48e] text-xs break-all">{shelbyResult.proofHash}</div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStep("generate"); setPreviewUrl(null); setFile(null); setShelbyResult(null); setMintTxHash(null); setTitle(""); setPrompt(""); }}
                className="flex-1 rounded-xl border border-[#4D3826] py-2.5 text-sm font-semibold text-[#c8a48e] hover:bg-[#4D3826] transition"
              >
                Mint Another
              </button>
              <button
                onClick={() => navigate("/arena")}
                className="flex-1 rounded-xl bg-[#F472B6] py-2.5 text-sm font-bold text-[#2B1E0E] hover:bg-[#EC4899] transition"
              >
                Go to Arena
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
