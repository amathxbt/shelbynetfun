import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Wallet, LogOut, Copy, Check } from "lucide-react";
import { useState } from "react";

export function WalletConnect() {
  const { account, connected, connect, disconnect, wallets } = useWallet();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const shortAddr = account?.address
    ? `${String(account.address).slice(0, 6)}…${String(account.address).slice(-4)}`
    : "";

  async function copyAddr() {
    if (!account?.address) return;
    await navigator.clipboard.writeText(String(account.address));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // Only show Petra — filter out social/AptosConnect wallets
  const petraWallets = wallets?.filter(
    (w) =>
      w.name.toLowerCase().includes("petra") ||
      w.name.toLowerCase().includes("martian") ||
      w.name.toLowerCase().includes("pontem") ||
      (!w.name.toLowerCase().includes("google") &&
        !w.name.toLowerCase().includes("apple") &&
        !w.name.toLowerCase().includes("continue with") &&
        !w.name.toLowerCase().includes("aptos connect"))
  ) ?? [];

  if (connected && account) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={copyAddr}
          className="flex items-center gap-1.5 rounded-full border border-[#F472B6] bg-[#F472B615] px-3 py-1.5 text-sm font-medium text-[#F472B6] transition hover:bg-[#F472B625]"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {shortAddr}
        </button>
        <button
          onClick={() => disconnect()}
          className="flex items-center gap-1.5 rounded-full border border-[#4D3826] px-3 py-1.5 text-sm text-[#c8a48e] transition hover:border-[#F472B6] hover:text-[#F472B6]"
        >
          <LogOut size={14} />
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full bg-[#F472B6] px-4 py-2 text-sm font-bold text-[#2B1E0E] transition hover:bg-[#EC4899] active:scale-95"
      >
        <Wallet size={16} />
        Connect Petra
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-[#4D3826] bg-[#372818] p-3 shadow-2xl z-50">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#F472B6]">
            Petra Wallet
          </p>
          {petraWallets.length > 0 ? (
            petraWallets.map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => { connect(wallet.name); setOpen(false); }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#FDF0E4] transition hover:bg-[#F472B615] hover:text-[#F472B6]"
              >
                {wallet.icon && (
                  <img src={wallet.icon} alt="" className="h-6 w-6 rounded" />
                )}
                {wallet.name}
              </button>
            ))
          ) : (
            <div className="space-y-3">
              <p className="px-2 text-xs text-[#c8a48e]">
                Petra wallet not detected. Install it to connect.
              </p>
              <a
                href="https://petra.app/"
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#F472B6] px-3 py-2.5 text-sm font-bold text-[#2B1E0E] hover:bg-[#EC4899] transition"
              >
                <img
                  src="https://petra.app/favicon.ico"
                  alt="Petra"
                  className="h-4 w-4 rounded"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                Install Petra Wallet ↗
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
