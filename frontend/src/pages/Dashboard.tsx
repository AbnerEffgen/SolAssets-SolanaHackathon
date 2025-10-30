import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Coins, Users, LucideIcon } from "lucide-react";
import { useHackaProgram } from "@/hooks/useHackaProgram";
import { fetchRwaAssets, RwaAsset } from "@/integrations/supabase/rwa";
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
import { ProgramAccount } from "@coral-xyz/anchor";
import { TokenRecord } from "@/idl/hacka_program";

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
  { key: "tokensCreated", label: "Tokens Created", icon: Coins },
  { key: "totalHolders", label: "Total Holders", icon: Users },
];

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RwaAsset[]>([]);
  const [tokenCreationData, setTokenCreationData] = useState<TokenCreationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const program = useHackaProgram();
  const wallet = useAnchorWallet();

  const calculateStats = (
    rwaAssets: RwaAsset[],
    tokenRecords: ProgramAccount<TokenRecord>[]
  ): DashboardStats => {
    
    const tokensCreated = tokenRecords.length;

    const holders = new Set(rwaAssets.map(asset => asset.owner_wallet).filter(Boolean));
    const totalHolders = holders.size;

    return { tokensCreated, totalHolders };
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!program || !wallet) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const rwaAssets = await fetchRwaAssets();
        const tokenRecords = await program.account.tokenRecord.all();

        const calculatedStats = calculateStats(rwaAssets, tokenRecords);
        setStats(calculatedStats);

        const dailyCounts = new Map<string, number>();
        rwaAssets.forEach(asset => {
          const date = new Date(asset.created_at);
          const dateString = date.toISOString().split('T')[0];
          dailyCounts.set(dateString, (dailyCounts.get(dateString) || 0) + 1);
        });

        const chartData = Array.from(dailyCounts.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setTokenCreationData(chartData);

        const sortedAssets = [...rwaAssets].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setRecentActivity(sortedAssets.slice(0, 3));
        
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [program, wallet]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your tokenized assets</p>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" disabled>
            My Dashboard
          </Button>
          <Button variant="outline" disabled>
            Tokens Dashboard
          </Button>
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
            <h3 className="text-xl font-semibold mb-4">Daily Token Creation</h3>
            <div className="h-64">
              {loading ? (
                <Skeleton className="h-full w-full" />
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
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Tokens Created" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No token creation data found.
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
            <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {loading ? (
                <>
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </>
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