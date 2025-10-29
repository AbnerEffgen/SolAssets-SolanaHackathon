import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { useHackaProgram } from "@/hooks/useHackaProgram";
import { TOKEN_RECORD_SEED, EXPLORER_BASE_URL, describeError } from "@/lib/solana";

type Token = Database['public']['Tables']['tokens']['Row'];
type NewToken = Database['public']['Tables']['tokens']['Insert'];

const Tokens = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [existingTokens, setExistingTokens] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [tokenType, setTokenType] = useState<NewToken['type'] | "">("");
  const { publicKey, connected } = useWallet();
  const program = useHackaProgram();

  // Buscar o perfil do usuário e seus tokens
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingTokens(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Usuário não autenticado. Por favor, faça o login novamente.");
        }
        
        const currentProfileId = user.id;
        setProfileId(currentProfileId);

        const { data: tokensData, error: tokensError } = await supabase
          .from('tokens')
          .select('*')
          .eq('profile_id', currentProfileId)
          .order('created_at', { ascending: false });

        if (tokensError) {
          throw tokensError;
        }

        setExistingTokens(tokensData || []);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        toast.error("Erro ao carregar seus tokens.", { description: describeError(error) });
      } finally {
        setIsLoadingTokens(false);
      }
    };

    fetchData();
  }, []);


  const handleCreateToken = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profileId) {
      toast.error("Perfil de usuário não encontrado. Não é possível criar o token.");
      return;
    }
    if (!tokenType) {
      toast.error("Por favor, selecione um tipo de token.");
      return;
    }
    if (!connected || !publicKey) {
      toast.error("Conecte sua carteira para emitir tokens on-chain.");
      return;
    }
    if (!program) {
      toast.error("Não foi possível inicializar o programa Anchor. Recarregue a página e tente novamente.");
      return;
    }

    const formData = new FormData(e.currentTarget);

    const name = (formData.get("token-name") as string)?.trim();
    const symbol = (formData.get("token-tag") as string)?.trim();
    const description = (formData.get("token-description") as string)?.trim() || "";
    const rawUri = formData.get("token-uri");
    const metadataUri = typeof rawUri === "string" ? rawUri.trim() : "";
    const quantityRaw = (formData.get("token-quantity") as string)?.trim();

    if (!name || !symbol) {
      toast.error("Informe nome e tag do token.");
      setIsCreating(false);
      return;
    }

    if (!quantityRaw) {
      toast.error("Informe a quantidade inicial de tokens.");
      setIsCreating(false);
      return;
    }

    let quantityBigInt: bigint;
    try {
      quantityBigInt = BigInt(quantityRaw);
    } catch (error) {
      toast.error("Quantidade inválida. Informe um número inteiro.");
      setIsCreating(false);
      return;
    }

    if (quantityBigInt <= 0n) {
      toast.error("A quantidade inicial deve ser maior que zero.");
      setIsCreating(false);
      return;
    }

    if (tokenType === "Não-fungível" && quantityBigInt !== 1n) {
      toast.error("Tokens não-fungíveis devem ter quantidade igual a 1.");
      setIsCreating(false);
      return;
    }

    if (metadataUri.length > 200) {
      toast.error("A URI de metadata deve ter no máximo 200 caracteres.");
      setIsCreating(false);
      return;
    }

    const maxSafeSupply = BigInt(Number.MAX_SAFE_INTEGER);
    if (quantityBigInt > maxSafeSupply) {
      toast.error("Quantidade muito alta. Utilize um valor até 9.007.199.254.740.991.");
      setIsCreating(false);
      return;
    }

    setIsCreating(true);

    const mintKeypair = Keypair.generate();

    const [tokenRecord] = PublicKey.findProgramAddressSync(
      [TOKEN_RECORD_SEED, mintKeypair.publicKey.toBuffer()],
      program.programId,
    );

    const destination = getAssociatedTokenAddressSync(
      mintKeypair.publicKey,
      publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    let transactionSignature: string;
    try {
      const method = program.methods.createStandardToken({
        name,
        symbol,
        uri: metadataUri,
        initialSupply: new BN(quantityBigInt.toString()),
      });

      transactionSignature = await method
        .accounts({
          authority: publicKey,
          tokenRecord,
          mint: mintKeypair.publicKey,
          destination,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([mintKeypair])
        .rpc();
    } catch (error) {
      console.error("Erro ao executar transação on-chain:", error);
      toast.error("Falha ao executar a transação on-chain.", {
        description: describeError(error),
      });
      setIsCreating(false);
      return;
    }

    try {
      const tokenData: NewToken = {
        profile_id: profileId,
        name,
        tag: symbol,
        type: tokenType,
        quantity: Number(quantityBigInt),
        description,
        status: "Ativo",
        transaction_hash: transactionSignature,
      };

      const { data, error } = await supabase
        .from("tokens")
        .insert(tokenData)
        .select()
        .single();

      if (error) throw error;

      toast.success("Token emitido com sucesso!", {
        description: `Explorer: ${EXPLORER_BASE_URL}/tx/${transactionSignature}?cluster=devnet`,
      });
      setExistingTokens((prev) => [data, ...prev]);
      e.currentTarget.reset();
      setTokenType("");
    } catch (error) {
      console.error("Erro ao salvar token no Supabase:", error);
      toast.warning("Token criado on-chain, mas não foi salvo no Supabase.", {
        description: `${describeError(error)}. Guarde a transação: ${transactionSignature}`,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Tokens</h2>
            <p className="text-muted-foreground">Crie e gerencie seus tokens</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="hero" disabled={!profileId || !connected || !program}>
                <Plus className="mr-2" />
                Emitir Token
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-2xl">Emitir Novo Token</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateToken} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="token-name">Nome do Token</Label>
                    <Input 
                      id="token-name"
                      name="token-name"
                      placeholder="Ex: Agro Token"
                      className="bg-background/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="token-tag">Tag</Label>
                    <Input 
                      id="token-tag"
                      name="token-tag"
                      placeholder="Ex: AGR-001"
                      className="bg-background/50"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="token-type">Tipo</Label>
                    <Select required onValueChange={(value) => setTokenType(value as NewToken['type'])} value={tokenType}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fungível">Fungível</SelectItem>
                        <SelectItem value="Não-fungível">Não-fungível</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="token-quantity">Quantidade</Label>
                    <Input 
                      id="token-quantity"
                      name="token-quantity"
                      type="number" 
                      placeholder="1000000"
                      className="bg-background/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="token-description">Descrição</Label>
                  <Textarea 
                    id="token-description"
                    name="token-description"
                    placeholder="Descreva o propósito e características do token"
                    className="bg-background/50 min-h-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="token-uri">Metadata URI</Label>
                  <Input
                    id="token-uri"
                    name="token-uri"
                    type="url"
                    placeholder="https://..."
                    className="bg-background/50"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    Opcional. Informe a URL do metadata (Arweave/IPFS). Máx. 200 caracteres.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  variant="hero"
                  disabled={isCreating || !profileId || !connected || !program}
                >
                  {isCreating ? "Emitindo no blockchain..." : "Emitir Token"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {!connected && (
          <Card className="p-4 border-dashed border-primary/40 bg-card/40">
            <p className="text-muted-foreground text-sm">
              Conecte uma carteira Solana suportada para emitir tokens no blockchain.
            </p>
          </Card>
        )}

        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
          <h3 className="text-xl font-semibold mb-4">Tokens Criados</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nome</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tag</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Quantidade</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Transação</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingTokens ? (
                    <tr><td colSpan={8} className="text-center py-8">Carregando tokens...</td></tr>
                ) : existingTokens.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum token encontrado.</td></tr>
                ) : (
                    existingTokens.map((token) => (
                    <tr key={token.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-4 px-4 font-medium">{token.name}</td>
                        <td className="py-4 px-4">
                        <code className="bg-muted px-2 py-1 rounded text-sm">{token.tag}</code>
                        </td>
                        <td className="py-4 px-4">{token.type}</td>
                        <td className="py-4 px-4">{token.quantity.toLocaleString()}</td>
                        <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                            {token.status === "Ativo" ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 text-secondary" />
                                <span className="text-secondary">{token.status}</span>
                            </>
                            ) : token.status === 'Pendente' ? (
                            <>
                                <Clock className="w-4 h-4 text-gold" />
                                <span className="text-gold">{token.status}</span>
                            </>
                            ) : (
                            <>
                                <AlertCircle className="w-4 h-4 text-destructive" />
                                <span className="text-destructive">{token.status}</span>
                            </>
                            )}
                        </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">{new Date(token.created_at).toLocaleDateString()}</td>
                        <td className="py-4 px-4 text-sm">
                          {token.transaction_hash ? (
                            <code className="bg-muted px-2 py-1 rounded">
                              {token.transaction_hash.slice(0, 8)}&hellip;
                            </code>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {token.transaction_hash && (
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={`${EXPLORER_BASE_URL}/tx/${token.transaction_hash}?cluster=devnet`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Explorer
                                </a>
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">Ver detalhes</Button>
                          </div>
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Tokens;
