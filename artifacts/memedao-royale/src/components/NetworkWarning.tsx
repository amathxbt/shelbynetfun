import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { AlertTriangle } from "lucide-react";

const SHELBYNET_URL = "https://api.shelbynet.shelby.xyz";

function isShelbynet(network: { name?: string; url?: string } | null | undefined): boolean {
  if (!network) return false;
  const name = (network.name ?? "").toLowerCase();
  const url = network.url ?? "";
  return (
    name.includes("shelby") ||
    name === "shelbynet" ||
    url.includes("shelbynet") ||
    url.includes("shelby.xyz")
  );
}

export function NetworkWarning() {
  const { connected, network } = useWallet();

  if (!connected) return null;
  if (isShelbynet(network)) return null;

  const networkName = network?.name ?? "unknown network";

  return (
    <div className="w-full bg-amber-900/80 border-b border-amber-500/60 px-4 py-2.5 flex items-center justify-center gap-3 z-50">
      <AlertTriangle size={16} className="text-amber-400 shrink-0" />
      <span className="text-amber-200 text-sm font-semibold">
        Petra is on{" "}
        <span className="text-amber-400 font-bold uppercase">{networkName}</span>{" "}
        — Switch to{" "}
        <span className="text-amber-400 font-bold">Shelbynet</span> in Petra to use Shelbynetfun.
      </span>
      <span className="text-amber-400/70 text-xs hidden sm:inline">
        (Petra → Settings → Network → Shelbynet)
      </span>
    </div>
  );
}

export function useIsCorrectNetwork() {
  const { connected, network } = useWallet();
  if (!connected) return true;
  return isShelbynet(network);
}
