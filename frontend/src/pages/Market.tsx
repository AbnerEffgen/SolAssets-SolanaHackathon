import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getMint,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ExternalLink,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { parseAmountToBaseUnits, describeError, EXPLORER_BASE_URL } from "@/lib/solana";

interface Token {
  id: string;
  name: string;
  tag: string;
  type: 'Fungível' | 'Não-fungível';
  quantity: number;
  status: 'Ativo' | 'Pendente' | 'Falhou';
  created_at: string;
  profiles: {
    full_name: string;
    wallet_address: string;
  } | null;
}

const Market = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [mintAddress, setMintAddress] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [lastSignature, setLastSignature] = useState<string | null>(null);
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();

  const resetOrderForm = () => {
    setMintAddress("");
    setRecipientAddress("");
    setTransferAmount("");
  };

  const handleOrderDialogChange = (open: boolean) => {
    setIsOrderOpen(open);
    if (!open) {
      resetOrderForm();
      setIsSubmittingOrder(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!connected || !publicKey) {
      toast.error("Conecte sua carteira para criar ordens P2P.");
      return;
    }

    if (!mintAddress.trim() || !recipientAddress.trim() || !transferAmount.trim()) {
      toast.error("Preencha todas as informações da ordem.");
      return;
    }

    let mint: PublicKey;
    let recipient: PublicKey;

    try {
      mint = new PublicKey(mintAddress.trim());
      recipient = new PublicKey(recipientAddress.trim());
    } catch (error) {
      toast.error("Endereço inválido.", {
        description: "Verifique o mint e a carteira de destino informados.",
      });
      return;
    }

    if (recipient.equals(publicKey)) {
      toast.error("Informe uma carteira de destino diferente da sua.");
      return;
    }

    setIsSubmittingOrder(true);

    try {
      const mintInfo = await getMint(connection, mint, "confirmed");
      const amountBase = parseAmountToBaseUnits(transferAmount, mintInfo.decimals);

      const amountNumber = Number(amountBase);
      if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
        throw new Error("Quantidade inválida para transferência.");
      }

      if (amountNumber > Number.MAX_SAFE_INTEGER) {
        throw new Error("Quantidade muito alta para ser processada.");
      }

      const sourceAta = await getAssociatedTokenAddress(
        mint,
        publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      );
      const destinationAta = await getAssociatedTokenAddress(
        mint,
        recipient,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      );

      const senderAccount = await connection.getAccountInfo(sourceAta, "confirmed");
      if (!senderAccount) {
        throw new Error("Conta de origem não encontrada. Confirme se você possui esse token.");
      }

      const instructions: TransactionInstruction[] = [];
      const destinationAccount = await connection.getAccountInfo(destinationAta, "confirmed");
      if (!destinationAccount) {
        instructions.push(
          createAssociatedTokenAccountInstruction(
            publicKey,
            destinationAta,
            recipient,
            mint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
          ),
        );
      }

      instructions.push(
        createTransferCheckedInstruction(
          sourceAta,
          mint,
          destinationAta,
          publicKey,
          amountNumber,
          mintInfo.decimals,
        ),
      );

      const transaction = new Transaction().add(...instructions);
      transaction.feePayer = publicKey;
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;

      const signature = await sendTransaction(transaction, connection);

      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");

      setLastSignature(signature);
      toast.success("Transferência P2P enviada!", {
        description: `Explorer: ${EXPLORER_BASE_URL}/tx/${signature}?cluster=devnet`,
      });
      handleOrderDialogChange(false);
    } catch (error) {
      console.error("Erro ao criar ordem P2P:", error);
      toast.error("Falha ao enviar a transação.", {
        description: describeError(error),
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  useEffect(() => {
    const fetchMarketTokens = async () => {
      setIsLoading(true);
      try {

        const { data, error } = await supabase
          .from('tokens')
          .select(`
            id,
            name,
            tag,
            type,
            quantity,
            status,
            created_at,
            profiles (
              full_name,
              wallet_address
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setTokens((data ?? []) as Token[]);
      } catch (error) {
        console.error("Erro ao buscar tokens do mercado:", error);
        toast.error("Falha ao carregar o mercado.", { description: describeError(error) });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketTokens();
  }, []);


  return (
    <DashboardLayout>
      <Dialog open={isOrderOpen} onOpenChange={handleOrderDialogChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar ordem P2P</DialogTitle>
            <DialogDescription>
              Defina o token, a carteira de destino e a quantidade para transferir direto na blockchain.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mint-address">Mint address do token</Label>
              <Input
                id="mint-address"
                placeholder="Ex: 4Nd1m..."
                value={mintAddress}
                onChange={(event) => setMintAddress(event.target.value)}
                className="bg-background/60"
              />
              <p className="text-xs text-muted-foreground">
                Utilize o endereço do mint do token que deseja negociar.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipient-address">Carteira do destinatário</Label>
              <Input
                id="recipient-address"
                placeholder="Wallet do comprador"
                value={recipientAddress}
                onChange={(event) => setRecipientAddress(event.target.value)}
                className="bg-background/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order-amount">Quantidade</Label>
              <Input
                id="order-amount"
                placeholder="Ex: 1000.5"
                value={transferAmount}
                onChange={(event) => setTransferAmount(event.target.value)}
                className="bg-background/60"
                inputMode="decimal"
              />
              <p className="text-xs text-muted-foreground">
                Valores com ponto decimal são convertidos conforme os decimais do mint.
              </p>
            </div>
            {publicKey && (
              <div className="rounded-lg border border-border/60 bg-muted/10 p-3 text-xs text-muted-foreground break-all">
                Carteira emissora: {publicKey.toBase58()}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleOrderDialogChange(false)}
              disabled={isSubmittingOrder}
            >
              Cancelar
            </Button>
            <Button
              variant="hero"
              onClick={handleSubmitOrder}
              disabled={isSubmittingOrder || !connected}
            >
              {isSubmittingOrder ? "Enviando..." : "Enviar ordem"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Mercado de Tokens</h2>
            <p className="text-muted-foreground">Explore todos os tokens criados na plataforma</p>
          </div>
          <Button
            variant="hero"
            onClick={() => handleOrderDialogChange(true)}
            disabled={!connected}
          >
            Criar Ordem de Negociação
          </Button>
        </div>

        {!connected && (
          <Card className="p-4 border-dashed border-primary/40 bg-card/40 text-sm text-muted-foreground">
            Conecte sua carteira para negociar tokens P2P.
          </Card>
        )}

        {lastSignature && (
          <Card className="p-4 bg-card/40 border-border/70 text-sm">
            <div className="flex flex-col gap-1">
              <span className="font-medium">Última transferência enviada</span>
              <a
                href={`${EXPLORER_BASE_URL}/tx/${lastSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline break-all"
              >
                {lastSignature}
              </a>
            </div>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* ... cards de estatísticas ... */}
        </div>

        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Tokens Disponíveis</h3>
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver no Explorer
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Token</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tag</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Quantidade</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Criador</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ação</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center py-8">Carregando mercado...</td></tr>
                ) : tokens.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum token no mercado ainda.</td></tr>
                ) : (
                  tokens.map((token) => (
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
                      <td className="py-4 px-4 text-sm text-muted-foreground" title={token.profiles?.wallet_address ?? undefined}>
                        {token.profiles?.full_name || 'Desconhecido'}
                      </td>
                      <td className="py-4 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOrderDialogChange(true)}
                          disabled={!connected}
                        >
                          Negociar
                        </Button>
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

export default Market;
