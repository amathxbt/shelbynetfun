import { Link, useLocation } from "wouter";
import { WalletConnect } from "./WalletConnect";
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
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg shelby-gradient shadow-sm">
            <Zap size={16} className="text-white" />
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
                  ? "bg-[#d66868] text-white"
                  : "text-muted-foreground hover:bg-[#f0f0f0] hover:text-foreground"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <WalletConnect />
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-white px-4 py-3 space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`block rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                location === n.href ? "bg-[#d66868] text-white" : "text-foreground hover:bg-muted"
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
