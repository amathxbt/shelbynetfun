import { Link, useLocation } from "wouter";
import { WalletConnect } from "./WalletConnect";
import { NetworkWarning } from "./NetworkWarning";
import { Zap, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Arena", href: "/arena" },
  { label: "Mint", href: "/mint" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "My Memes", href: "/my-memes" },
];

export function Navbar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#4D3826] bg-[#2B1E0E]/95 backdrop-blur shadow-lg shadow-black/30">
      <NetworkWarning />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F472B6] shadow-sm shadow-[#F472B640]">
            <Zap size={16} className="text-[#2B1E0E]" />
          </div>
          <span className="font-black text-lg shelby-text-gradient hidden sm:block">
            MemeDAO Royale
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                location === n.href
                  ? "bg-[#F472B6] text-[#2B1E0E] font-bold"
                  : "text-[#c8a48e] hover:bg-[#F472B615] hover:text-[#F472B6]"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <WalletConnect />
          <button
            className="md:hidden p-2 rounded-lg hover:bg-[#4D3826] text-[#F472B6]"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-[#4D3826] bg-[#2B1E0E] px-4 py-3 space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`block rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                location === n.href
                  ? "bg-[#F472B6] text-[#2B1E0E] font-bold"
                  : "text-[#c8a48e] hover:bg-[#4D3826]"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
