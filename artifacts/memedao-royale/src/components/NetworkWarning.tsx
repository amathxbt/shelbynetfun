import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { AlertTriangle } from "lucide-react";

export function NetworkWarning() {
  const { connected, network } = useWallet();

  if (!connected) return null;

  const networkName = (network?.name ?? "").toLowerCase();
  const isDevnet =
    networkName === "devnet" ||
    networkName.includes("devnet") ||
    network?.url?.includes("devnet");

  if (isDevnet) return null;

  return (
    <div className="w-full bg-amber-900/80 border-b border-amber-500/60 px-4 py-2.5 flex items-center justify-center gap-3 z-50">
      <AlertTriangle size={16} className="text-amber-400 shrink-0" />
      <span className="text-amber-200 text-sm font-semibold">
        Petra is connected to{" "}
        <span className="text-amber-400 font-bold uppercase">
          {network?.name ?? "wrong network"}
        </span>{" "}
        — Switch to{" "}
        <span className="text-amber-400 font-bold">Devnet</span> in Petra to
        use MemeDAO Royale.
      </span>
      <span className="text-amber-400/70 text-xs hidden sm:inline">
        (Petra → Settings → Network → Devnet)
      </span>
    </div>
  );
}

export function useIsCorrectNetwork() {
  const { connected, network } = useWallet();
  if (!connected) return true;
  const networkName = (network?.name ?? "").toLowerCase();
  return (
    networkName === "devnet" ||
    networkName.includes("devnet") ||
    (network?.url?.includes("devnet") ?? false)
  );
}
