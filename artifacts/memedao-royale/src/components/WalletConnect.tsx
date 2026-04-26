import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Wallet, LogOut, Copy, Check } from "lucide-react";
import { useState } from "react";

export function WalletConnect() {
  const { account, connected, connect, disconnect, wallets } = useWallet();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const shortAddr = account?.address
    ? `${account.address.slice(0, 6)}…${account.address.slice(-4)}`
    : "";

  async function copyAddr() {
    if (!account?.address) return;
    await navigator.clipboard.writeText(account.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (connected && account) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={copyAddr}
          className="flex items-center gap-1.5 rounded-full border border-[#6dd6ce] bg-[#6dd6ce15] px-3 py-1.5 text-sm font-medium text-[#6dd6ce] transition hover:bg-[#6dd6ce25]"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {shortAddr}
        </button>
        <button
          onClick={() => disconnect()}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:border-[#d66868] hover:text-[#d66868]"
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
        className="flex items-center gap-2 rounded-full bg-[#d66868] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c45858] active:scale-95"
      >
        <Wallet size={16} />
        Connect Wallet
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-card p-3 shadow-xl z-50">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Choose a wallet
          </p>
          {wallets && wallets.length > 0 ? (
            wallets.map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => { connect(wallet.name); setOpen(false); }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-muted"
              >
                {wallet.icon && (
                  <img src={wallet.icon} alt="" className="h-6 w-6 rounded" />
                )}
                {wallet.name}
              </button>
            ))
          ) : (
            <div className="space-y-2">
              <p className="px-2 text-xs text-muted-foreground">
                No wallets detected. Install Petra or Martian wallet.
              </p>
              <a
                href="https://petra.app/"
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center rounded-lg bg-[#d66868] px-3 py-2 text-xs font-semibold text-white hover:bg-[#c45858]"
              >
                Get Petra Wallet ↗
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
