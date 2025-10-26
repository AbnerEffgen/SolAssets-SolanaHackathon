import React, { useMemo, useEffect, useRef } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom"; 
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import CreateProfile from "./pages/CreateProfile"; 
import Dashboard from "./pages/Dashboard";
import Tokens from "./pages/Tokens";
import RWA from "./pages/RWA";
import Governance from "./pages/Governance";
import Market from "./pages/Market";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react'; 
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';
import { toast } from 'sonner';

const queryClient = new QueryClient();

const WalletWatcher = () => {
  const { connected, disconnecting } = useWallet();
  const navigate = useNavigate();
  
  const wasConnected = useRef(connected);

  useEffect(() => {
    if (wasConnected.current && !connected && !disconnecting) {
      toast.info("Carteira desconectada. Redirecionando para a página inicial.");
      navigate('/');
    }
    
    wasConnected.current = connected;
  }, [connected, disconnecting, navigate]);

  return null; 
};

const App = () => {
    const network = WalletAdapterNetwork.Devnet;
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
        ],
        [network] 
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect> 
                <WalletModalProvider>
                    <QueryClientProvider client={queryClient}>
                        <TooltipProvider>
                            <Toaster /> 
                            <Sonner /> 
                            <BrowserRouter>
                                <WalletWatcher /> 
                                <Routes>
                                    <Route path="/" element={<Landing />} />
                                    <Route path="/auth" element={<Auth />} />
                                    <Route path="/create-profile" element={<CreateProfile />} /> 
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/dashboard/tokens" element={<Tokens />} />
                                    <Route path="/dashboard/rwa" element={<RWA />} />
                                    <Route path="/dashboard/governance" element={<Governance />} />
                                    <Route path="/dashboard/market" element={<Market />} />
                                    <Route path="/dashboard/notifications" element={<Notifications />} />
                                    <Route path="/dashboard/settings" element={<Settings />} />
                                    <Route path="*" element={<NotFound />} />
                                </Routes>
                            </BrowserRouter>
                        </TooltipProvider>
                    </QueryClientProvider>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default App;