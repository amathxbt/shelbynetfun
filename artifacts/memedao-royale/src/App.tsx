import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Arena from "@/pages/Arena";
import Mint from "@/pages/Mint";
import Remix from "@/pages/Remix";
import Leaderboard from "@/pages/Leaderboard";
import MyMemes from "@/pages/MyMemes";

const queryClient = new QueryClient();

// Shelbynet is a custom Aptos-compatible network — we don't pass a network
// enum here so the wallet adapter doesn't reject Petra on Shelbynet.
const SHELBYNET_CONFIG = {
  aptosConnectDappId: undefined,
};

function Router() {
  return (
    <div className="min-h-screen bg-[#2B1E0E]">
      <Navbar />
      <main>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/arena" component={Arena} />
          <Route path="/mint" component={Mint} />
          <Route path="/remix/:id" component={Remix} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/my-memes" component={MyMemes} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AptosWalletAdapterProvider
        autoConnect={false}
        dappConfig={SHELBYNET_CONFIG}
        onError={(error) => console.error("Wallet error:", error)}
      >
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") ?? ""}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AptosWalletAdapterProvider>
    </QueryClientProvider>
  );
}
