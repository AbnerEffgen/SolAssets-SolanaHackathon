import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SolanaWallet } from '@supabase/auth-js/dist/module/lib/types';

const Auth = () => {
  const navigate = useNavigate();
  const { connected, publicKey, connecting, wallet } = useWallet();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const handleAuth = async () => {
      if (connected && publicKey && wallet && !isAuthenticating) {
        setIsAuthenticating(true);
        const loadingToastId = toast.loading("Aguardando assinatura da carteira...");

        try {
          // 1. Autentica com a carteira
          const { error: signInError } = await supabase.auth.signInWithWeb3({
            chain: 'solana',
            statement: 'Bem-vindo ao SolAssets! Assine para continuar.',
            wallet: wallet.adapter as SolanaWallet,
          });

          if (signInError) throw signInError;

          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('full_name') // Só precisamos saber se o nome existe
              .eq('id', user.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              throw profileError;
            }

            if (profile && profile.full_name) {
              toast.success("Autenticado com sucesso!", { id: loadingToastId });
              navigate("/dashboard");
            } else {
              toast.info("Complete seu perfil para continuar.", { id: loadingToastId });
              navigate("/create-profile");
            }
          } else {
             throw new Error("Usuário não encontrado após o login.");
          }
        } catch (err: any) {
          console.error("Erro durante a autenticação Web3:", err);
          if (err.message.includes("User rejected the request")) {
            toast.error("Você cancelou a assinatura.", { id: loadingToastId });
          } else {
            toast.error(`Falha na autenticação: ${err.message}`, { id: loadingToastId });
          }
        } finally {
            setIsAuthenticating(false);
        }
      }
    };

    handleAuth();
  }, [connected, publicKey, wallet, isAuthenticating, navigate]);

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

          { (connecting || isAuthenticating) &&
            <p className="text-sm text-muted-foreground mt-4 animate-pulse">
                {connecting ? "Conectando carteira..." : "Aguardando assinatura..."}
            </p>
          }
           { !connecting && !isAuthenticating &&
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