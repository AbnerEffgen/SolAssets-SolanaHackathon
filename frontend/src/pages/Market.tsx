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
  type: 'Fungible' | 'Non-Fungible';
  quantity: number;
  status: 'Active' | 'Pending' | 'Failed';
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
      toast.error("Connect your wallet to create P2P orders.");
      return;
    }

    if (!mintAddress.trim() || !recipientAddress.trim() || !transferAmount.trim()) {
      toast.error("Please fill in all order information.");
      return;
    }

    let mint: PublicKey;
    let recipient: PublicKey;

    try {
      mint = new PublicKey(mintAddress.trim());
      recipient = new PublicKey(recipientAddress.trim());
    } catch (error) {
      toast.error("Invalid address.", {
        description: "Please check the provided mint and destination wallet addresses.",
      });
      return;
    }

    if (recipient.equals(publicKey)) {
      toast.error("Please provide a destination wallet different from your own.");
      return;
    }

    setIsSubmittingOrder(true);

    try {
      const mintInfo = await getMint(connection, mint, "confirmed");
      const amountBase = parseAmountToBaseUnits(transferAmount, mintInfo.decimals);

      const amountNumber = Number(amountBase);
      if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
        throw new Error("Invalid amount for transfer.");
      }

      if (amountNumber > Number.MAX_SAFE_INTEGER) {
        throw new Error("Amount too high to be processed.");
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
        throw new Error("Source account not found. Please confirm you own this token.");
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
      toast.success("P2P transfer sent successfully!", {
        description: `Explorer: ${EXPLORER_BASE_URL}/tx/${signature}?cluster=devnet`,
      });
      handleOrderDialogChange(false);
    } catch (error) {
      console.error("Error creating P2P order:", error);
      toast.error("Failed to send transaction.", {
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

        const translatedTokens = (data ?? []).map(token => ({
          ...token,
          type: token.type === 'Fungível' ? 'Fungible' : 'Non-Fungible',
          status: token.status === 'Ativo' ? 'Active' : token.status === 'Pendente' ? 'Pending' : 'Failed',
        })) as Token[];

        setTokens(translatedTokens);
      } catch (error) {
        console.error("Error fetching market tokens:", error);
        toast.error("Failed to load market.", { description: describeError(error) });
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
            <DialogTitle>Create P2P Order</DialogTitle>
            <DialogDescription>
              Set the token, destination wallet, and amount to transfer directly on the blockchain.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mint-address">Token Mint Address</Label>
              <Input
                id="mint-address"
                placeholder="E.g., 4Nd1m..."
                value={mintAddress}
                onChange={(event) => setMintAddress(event.target.value)}
                className="bg-background/60"
              />
              <p className="text-xs text-muted-foreground">
                Use the mint address of the token you wish to trade.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipient-address">Recipient Wallet</Label>
              <Input
                id="recipient-address"
                placeholder="Buyer's wallet"
                value={recipientAddress}
                onChange={(event) => setRecipientAddress(event.target.value)}
                className="bg-background/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order-amount">Amount</Label>
              <Input
                id="order-amount"
                placeholder="E.g., 1000.5"
                value={transferAmount}
                onChange={(event) => setTransferAmount(event.target.value)}
                className="bg-background/60"
                inputMode="decimal"
              />
              <p className="text-xs text-muted-foreground">
                Values with a decimal point are converted according to the mint's decimals.
              </p>
            </div>
            {publicKey && (
              <div className="rounded-lg border border-border/60 bg-muted/10 p-3 text-xs text-muted-foreground break-all">
                Sender wallet: {publicKey.toBase58()}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleOrderDialogChange(false)}
              disabled={isSubmittingOrder}
            >
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={handleSubmitOrder}
              disabled={isSubmittingOrder || !connected}
            >
              {isSubmittingOrder ? "Sending..." : "Send Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Token Market</h2>
            <p className="text-muted-foreground">Explore all tokens created on the platform</p>
          </div>
          <Button
            variant="hero"
            onClick={() => handleOrderDialogChange(true)}
            disabled={!connected}
          >
            Create Trade Order
          </Button>
        </div>

        {!connected && (
          <Card className="p-4 border-dashed border-primary/40 bg-card/40 text-sm text-muted-foreground">
            Connect your wallet to trade P2P tokens.
          </Card>
        )}

        {lastSignature && (
          <Card className="p-4 bg-card/40 border-border/70 text-sm">
            <div className="flex flex-col gap-1">
              <span className="font-medium">Last transfer sent</span>
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
        </div>

        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Available Tokens</h3>
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Explorer
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Token</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tag</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Quantity</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Creator</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center py-8">Loading market...</td></tr>
                ) : tokens.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No tokens on the market yet.</td></tr>
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
                          {token.status === "Active" ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-secondary" />
                              <span className="text-secondary">{token.status}</span>
                            </>
                          ) : token.status === 'Pending' ? (
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
                        {token.profiles?.full_name || 'Unknown'}
                      </td>
                      <td className="py-4 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOrderDialogChange(true)}
                          disabled={!connected}
                        >
                          Trade
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