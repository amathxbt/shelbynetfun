import { Link, useLocation } from "wouter";
import { WalletConnect } from "./WalletConnect";
import { Zap } from "lucide-react";

const NAV = [
  { label: "Arena", href: "/" },
  { label: "Mint", href: "/mint" },
  { label: "Leaderboard", href: "/leaderboard" },
];

export function Navbar() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg shelby-gradient">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg shelby-text-gradient hidden sm:block">
            MemeDAO Royale
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                location === n.href
                  ? "bg-[#d66868] text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <WalletConnect />
      </div>
    </header>
  );
}
