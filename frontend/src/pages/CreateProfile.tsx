import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWallet } from '@solana/wallet-adapter-react';

const CreateProfile = () => {
  const navigate = useNavigate();
  const { connected, publicKey } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!connected || !publicKey) {
      toast.error("Por favor, conecte sua carteira primeiro.");
      navigate("/auth", { replace: true });
    } else {
      setWalletAddress(publicKey.toBase58());
    }
  }, [connected, publicKey, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !publicKey) { 
      toast.error("Usuário ou carteira não encontrados. Redirecionando...");
      navigate('/auth');
      setIsLoading(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .insert({
        id: user.id, 
        full_name: fullName,
        email: email,
        wallet_address: publicKey.toBase58() 
      });

    if (error) {
      console.error("Erro ao criar perfil:", error);
      toast.error(`Erro ao salvar perfil: ${error.message}`);
    } else {
      toast.success("Perfil salvo com sucesso! Bem-vindo!");
      navigate("/dashboard");
    }
    setIsLoading(false);
  };

  if (!walletAddress) {
     return (
        <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
            <p className="text-white animate-pulse">Verificando conexão...</p>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
         <div className="flex items-center justify-center gap-2 mb-8">
            <Wallet className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SolAssets
            </h1>
          </div>

        <Card className="p-8 bg-card/50 backdrop-blur-md border-border shadow-card">
          <h2 className="text-2xl font-semibold mb-2 text-center">Complete seu Perfil</h2>
          <p className="text-muted-foreground mb-6 text-center">
            Bem-vindo! Precisamos de mais algumas informações para criar sua conta.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="walletAddress">Endereço da Carteira</Label>
              <Input
                id="walletAddress"
                type="text"
                value={walletAddress}
                className="bg-background/30 text-muted-foreground cursor-not-allowed"
                readOnly
                disabled
              />
               <p className='text-xs text-muted-foreground'>Este endereço será seu identificador único.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Seu nome completo"
                className="bg-background/50"
                required
              />
            </div>

             <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                className="bg-background/50"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              variant="hero"
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Salvar Perfil e Acessar"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateProfile;