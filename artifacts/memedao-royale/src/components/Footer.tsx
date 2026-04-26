import { Github } from "lucide-react";

const GITHUB_URL = "https://github.com/amathxbt/shelbynetfun";

export function Footer() {
  return (
    <footer className="border-t border-[#4D3826] bg-[#2B1E0E] mt-16 py-8">
      <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-[#c8a48e] text-sm">
          <span className="font-black text-[#F472B6]">MemeDAO Royale</span>
          <span className="text-[#4D3826]">·</span>
          <span>Fully on-chain · Shelbynet · Aptos Move</span>
        </div>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-[#4D3826] bg-[#372818] px-4 py-2 text-sm font-semibold text-[#c8a48e] hover:border-[#F472B6]/50 hover:text-[#F472B6] transition"
        >
          <Github size={16} />
          Open Source on GitHub
        </a>
      </div>
    </footer>
  );
}
