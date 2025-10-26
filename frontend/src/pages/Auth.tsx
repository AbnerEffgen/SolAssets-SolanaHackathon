import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const { connected, publicKey, connecting, disconnecting } = useWallet();
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);

  useEffect(() => {
    if (connected && publicKey && !isCheckingProfile) {
      setIsCheckingProfile(true);
      console.log("Carteira conectada:", publicKey.toBase58(), "Verificando perfil...");
      const loadingToastId = toast.loading("Verificando perfil...");

      const checkProfile = async () => {
        try {
          // A consulta continua a mesma
          const { data, error, status } = await supabase
            .from('profiles')
            .select('id')
            .eq('wallet_address', publicKey.toBase58())
            .maybeSingle();

          if (error && status !== 406) {
             console.error("Erro Supabase:", error);
             throw new Error(error.message);
          }

          if (data) {
            console.log("Perfil encontrado, redirecionando para /dashboard");
            toast.success("Bem-vindo de volta!", { id: loadingToastId });
            navigate("/dashboard");
          } else {
            console.log("Perfil não encontrado, redirecionando para /create-profile");
            toast.info("Parece que é sua primeira vez aqui. Complete seu perfil.", { id: loadingToastId });
            navigate("/create-profile", { state: { walletAddress: publicKey.toBase58() } });
          }
        } catch (err: any) {
          console.error("Erro ao verificar perfil no Supabase:", err);
          toast.error(`Erro ao verificar perfil: ${err.message}`, { id: loadingToastId });
          setIsCheckingProfile(false);
        }
      };

      checkProfile();
    } else if (!connected && !connecting && !disconnecting) {
        if (isCheckingProfile) {
             setIsCheckingProfile(false);
             toast.dismiss();
        }
    }

  }, [connected, publicKey, navigate, isCheckingProfile, connecting, disconnecting]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Wallet className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            SolAssets
          </h1>
        </Link>

        <Card className="p-8 bg-card/50 backdrop-blur-md border-border shadow-card text-center">
          <h2 className="text-2xl font-semibold mb-2">Conecte sua Carteira</h2>
          <p className="text-muted-foreground mb-6">
            Use sua carteira Solana para acessar a plataforma SolAssets.
          </p>

          <WalletMultiButton style={{ width: '100%', height: '48px', fontSize: '16px', borderRadius: 'var(--radius)' }} />

          { (connecting || isCheckingProfile) &&
            <p className="text-sm text-muted-foreground mt-4 animate-pulse">
                {connecting ? "Conectando carteira..." : "Verificando perfil..."}
            </p>
          }
           { !connecting && !isCheckingProfile &&
            <p className="text-center text-sm text-muted-foreground mt-4">
                Suportamos Phantom, Solflare, Backpack e mais.
            </p>
           }
        </Card>
      </div>
    </div>
  );
};

export default Auth;