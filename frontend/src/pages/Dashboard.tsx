import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Coins, Users, LucideIcon, Package, Building } from "lucide-react";
import { useHackaProgram } from "@/hooks/useHackaProgram";
import { fetchRwaAssets, RwaAsset } from "@/integrations/supabase/rwa"; //
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
// import { ProgramAccount } from "@coral-xyz/anchor"; // <-- REMOVIDO
// import { TokenRecord } from "@/idl/hacka_program"; // <-- REMOVIDO

import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"; //
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; //
import { supabase } from "@/integrations/supabase/client"; //
import { Database } from "@/integrations/supabase/types"; //
import { toast } from "sonner";
import { describeError } from "@/lib/solana"; //

type Token = Database['public']['Tables']['tokens']['Row'];

interface TokenMetrics {
  totalAssetsLinked: number;
  uniqueRwaHolders: number;
  initialSupply: number;
}

interface DashboardStats {
  tokensCreated: number;
  totalHolders: number;
}

type TokenCreationData = {
  date: string;
  count: number;
};

const statDetails: {
  key: keyof DashboardStats;
  label: string;
  icon: LucideIcon;
}[] = [
  { key: "tokensCreated", label: "Total Tokens on Platform", icon: Coins },
  { key: "totalHolders", label: "Total RWA Holders", icon: Users },
];

const Dashboard = () => {
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [myTokens, setMyTokens] = useState<Token[]>([]); //
  const [allRwaAssets, setAllRwaAssets] = useState<RwaAsset[]>([]); //
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [selectedTokenMetrics, setSelectedTokenMetrics] = useState<TokenMetrics | null>(null);
  const [isTokenMetricsLoading, setIsTokenMetricsLoading] = useState(false);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RwaAsset[]>([]);
  const [tokenCreationData, setTokenCreationData] = useState<TokenCreationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const program = useHackaProgram();
  const wallet = useAnchorWallet();
  const navigate = useNavigate();

  // --- FUNÇÃO calculateStats MODIFICADA ---
  // Agora recebe 'tokenCount' (um número) em vez de 'tokenRecords' (uma array)
  const calculateStats = (
    rwaAssets: RwaAsset[],
    tokenCount: number // <-- Alterado
  ): DashboardStats => {
    
    const tokensCreated = tokenCount; // <-- Alterado

    const holders = new Set(rwaAssets.map(asset => asset.owner_wallet).filter(Boolean)); //
    const totalHolders = holders.size;

    return { tokensCreated, totalHolders };
  };
  // --- FIM DA MODIFICAÇÃO ---

  useEffect(() => {
    const loadDashboardData = async () => {
      // Deixei !program de fora para a UI carregar mesmo sem o programa
      if (!wallet) {
        setLoading(false); // Permite que a UI renderize sem dados
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch RWA Assets
        const fetchedRwaAssets = await fetchRwaAssets(); //
        setAllRwaAssets(fetchedRwaAssets);

        // --- LÓGICA ON-CHAIN REMOVIDA ---
        // const tokenRecords = await program.account.tokenRecord.all(); // <-- REMOVIDO (Causava erro)

        // --- NOVA LÓGICA: BUSCAR CONTAGEM TOTAL DE TOKENS DO SUPABASE ---
        const { count: tokenCount, error: countError } = await supabase
          .from('tokens')
          .select('*', { count: 'exact', head: true });

        if (countError) {
          console.error("Failed to fetch token count:", countError);
          throw new Error("Failed to fetch token count.");
        }
        // --- FIM DA NOVA LÓGICA ---

        // Calcular Stats Globais (Modificado para usar tokenCount)
        const calculatedStats = calculateStats(fetchedRwaAssets, tokenCount || 0); // <-- Alterado
        setStats(calculatedStats);

        // --- BUSCA DE TOKENS DO USUÁRIO (para o modal) ---
        const { data: { user } } = await supabase.auth.getUser(); //
        if (user) {
          const { data: tokensData, error: tokensError } = await supabase
            .from('tokens')
            .select('*')
            .eq('profile_id', user.id); //

          if (tokensError) {
            console.warn("Could not load user's tokens for modal:", tokensError);
          } else {
            setMyTokens(tokensData || []);
          }
        }
        // --- FIM DA BUSCA ---

        // Preparar Chart Data
        const dailyCounts = new Map<string, number>();
        fetchedRwaAssets.forEach(asset => {
          const date = new Date(asset.created_at);
          const dateString = date.toISOString().split('T')[0];
          dailyCounts.set(dateString, (dailyCounts.get(dateString) || 0) + 1);
        });

        const chartData = Array.from(dailyCounts.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setTokenCreationData(chartData);

        // Preparar Recent Activity
        const sortedAssets = [...fetchedRwaAssets].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setRecentActivity(sortedAssets.slice(0, 3));
        
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError("Failed to load dashboard data.");
        if (err instanceof Error) {
            toast.error("Failed to load dashboard data", { description: describeError(err) });
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [program, wallet]); // Mantido 'program' por precaução, mas não é mais usado para 'tokenRecords'

  const handleTokenSelect = (tokenId: string) => {
    if (!tokenId) {
        setSelectedTokenId(null);
        setSelectedTokenMetrics(null);
        return;
    }

    setIsTokenMetricsLoading(true);
    setSelectedTokenId(tokenId);

    const token = myTokens.find(t => t.id === tokenId);
    if (!token) {
        toast.error("Selected token not found.");
        setIsTokenMetricsLoading(false);
        return;
    }

    const filteredAssets = allRwaAssets.filter(asset => asset.token_code === token.tag); //
    const uniqueHolders = new Set(filteredAssets.map(a => a.owner_wallet).filter(Boolean)); //

    setSelectedTokenMetrics({
        totalAssetsLinked: filteredAssets.length,
        uniqueRwaHolders: uniqueHolders.size,
        initialSupply: token.quantity, //
    });

    setIsTokenMetricsLoading(false);
  };

  const handleModalOpenChange = (isOpen: boolean) => {
    setIsTokenModalOpen(isOpen);
    if (!isOpen) {
        setSelectedTokenId(null);
        setSelectedTokenMetrics(null);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Platform Dashboard</h2>
          <p className="text-muted-foreground">Overview of all tokenized assets</p>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/my-dashboard')}>
            My Dashboard
          </Button>

          <Dialog open={isTokenModalOpen} onOpenChange={handleModalOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!wallet || myTokens.length === 0}>
                { !wallet ? "Connect Wallet" : myTokens.length === 0 ? "No Tokens Found" : "Token Metrics" }
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-2xl">Token Dashboard</DialogTitle>
                <DialogDescription>
                  Select one of your created tokens to see its metrics.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 pt-4">
                <Select
                  onValueChange={handleTokenSelect}
                  value={selectedTokenId || ""}
                  disabled={loading || myTokens.length === 0}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder={myTokens.length > 0 ? "Select your token..." : "No tokens found"} />
                  </SelectTrigger>
                  <SelectContent>
                    {myTokens.map((token) => (
                      <SelectItem key={token.id} value={token.id}>
                        {token.name} ({token.tag})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {isTokenMetricsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : selectedTokenMetrics ? (
                  <div className="space-y-3">
                    <Card className="p-4 bg-background/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Package className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total RWA Assets Linked</p>
                                <p className="text-2xl font-bold">{selectedTokenMetrics.totalAssetsLinked.toLocaleString()}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 bg-background/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Building className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Unique RWA Holders</p>
                                <p className="text-2xl font-bold">{selectedTokenMetrics.uniqueRwaHolders.toLocaleString()}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 bg-background/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Coins className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Initial Supply</p>
                                <p className="text-2xl font-bold">{selectedTokenMetrics.initialSupply.toLocaleString()}</p>
                            </div>
                        </div>
                    </Card>
                  </div>
                ) : (
                    selectedTokenId && (
                        <p className="text-sm text-center text-muted-foreground">No RWA assets found for this token.</p>
                    )
                )}
              </div>
            </DialogContent>
          </Dialog>

        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {loading ? (
            <>
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </>
          ) : error ? (
            <Card className="p-6 md:col-span-2 text-center text-destructive">
              {error}
            </Card>
          ) : !wallet ? (
             <Card className="p-6 md:col-span-2 text-center text-muted-foreground">
              Please connect your wallet to view platform data.
            </Card>
          ) : stats ? (
            statDetails.map((stat) => {
              const value = stats[stat.key];
              const displayValue = value.toLocaleString();

              return (
                <Card
                  key={stat.key}
                  className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <stat.icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold mb-1">{displayValue}</p>
                  </div>
                </Card>
              );
            })
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
            <h3 className="text-xl font-semibold mb-4">Daily RWA Registration</h3>
            <div className="h-64">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : !wallet ? (
                 <div className="h-full flex items-center justify-center text-muted-foreground">
                  Connect wallet to see data.
                </div>
              ) : tokenCreationData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={tokenCreationData}
                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                  >
                    <XAxis 
                      dataKey="date" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(str) => {
                        const date = new Date(str);
                        date.setDate(date.getDate() + 1);
                        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                      }}
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem" }}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="RWAs Registered" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No RWA registration data found.
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
            <h3 className="text-xl font-semibold mb-4">Recent Platform Activity</h3>
            <div className="space-y-4">
              {loading ? (
                <>
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </>
              ) : !wallet ? (
                 <p className="text-sm text-muted-foreground">Connect wallet to see data.</p>
              ) : recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-border last:border-0">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1">
                      <p className="font-medium">New Asset Registered</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.name} ({activity.token_code})
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.created_at).toLocaleString('en-US')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;