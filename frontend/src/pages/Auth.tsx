import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SolanaWallet } from '@supabase/auth-js/dist/module/lib/types';
import { WavyBackground } from "@/components/ui/background";
import logo from "@/assets/logo.svg";

const Auth = () => {
  const navigate = useNavigate();
  const { connected, publicKey, connecting, wallet } = useWallet();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const handleAuth = async () => {
      if (connected && publicKey && wallet && !isAuthenticating) {
        setIsAuthenticating(true);
        const loadingToastId = toast.loading("Waiting for wallet signature...");

        try {
          const { error: signInError } = await supabase.auth.signInWithWeb3({
            chain: 'solana',
            statement: 'Welcome to SolAssets! Sign to continue.',
            wallet: wallet.adapter as SolanaWallet,
          });

          if (signInError) throw signInError;

          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', user.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              throw profileError;
            }

            if (profile && profile.full_name) {
              toast.success("Successfully authenticated!", { id: loadingToastId });
              navigate("/dashboard");
            } else {
              toast.info("Please complete your profile to continue.", { id: loadingToastId });
              navigate("/create-profile");
            }
          } else {
            throw new Error("User not found after login.");
          }
        } catch (err: any) {
          console.error("Error during Web3 authentication:", err);
          if (err.message.includes("User rejected the request")) {
            toast.error("You rejected the signature request.", { id: loadingToastId });
          } else {
            toast.error(`Authentication failed: ${err.message}`, { id: loadingToastId });
          }
        } finally {
          setIsAuthenticating(false);
        }
      }
    };

    handleAuth();
  }, [connected, publicKey, wallet, isAuthenticating, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <WavyBackground
        backgroundFill="hsl(var(--background))"
        colors={["#A048F0", "#00BFFF", "#00E676"]}
        waveWidth={10}
        blur={5}
      />
      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="flex items-center justify-center mb-8">
          <img src={logo} alt="SolAssets Logo" className="h-10" />
        </Link>

        <Card className="p-8 bg-card/50 backdrop-blur-md border-border shadow-card text-center">
          <h2 className="text-2xl font-semibold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-6">
            Use your Solana wallet to access the SolAssets platform.
          </p>

          <WalletMultiButton
            className="btn-hero w-full"
            style={{ height: '48px', fontSize: '16px', borderRadius: 'var(--radius)' }}
          />

          {(connecting || isAuthenticating) &&
            <p className="text-sm text-muted-foreground mt-4 animate-pulse">
              {connecting ? "Connecting wallet..." : "Waiting for signature..."}
            </p>
          }
          {!connecting && !isAuthenticating &&
            <p className="text-center text-sm text-muted-foreground mt-4">
              We support Phantom, Solflare, Backpack, and more.
            </p>
          }
        </Card>
      </div>
    </div>
  );
};

export default Auth;