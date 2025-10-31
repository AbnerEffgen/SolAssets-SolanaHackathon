import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import {
  Coins,
  Package,
  LucideIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useHackaProgram } from "@/hooks/useHackaProgram";
import { fetchRwaAssets, RwaAsset } from "@/integrations/supabase/rwa";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { describeError, EXPLORER_BASE_URL } from "@/lib/solana";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type Token = Database["public"]["Tables"]["tokens"]["Row"];

interface MyDashboardStats {
  myTokensCreated: number;
  myRwaAssets: number;
}

type TokenCreationData = {
  date: string;
  count: number;
};

type StatDetail = {
  key: keyof MyDashboardStats;
  label: string;
  icon: LucideIcon;
};

const myStatDetails: StatDetail[] = [
  { key: "myTokensCreated", label: "My Tokens Created", icon: Coins },
  { key: "myRwaAssets", label: "My RWA Assets", icon: Package },
];

const MyDashboard = () => {
  const [stats, setStats] = useState<MyDashboardStats | null>(null);
  const [myTokenCreationData, setMyTokenCreationData] = useState<
    TokenCreationData[]
  >([]);
  const [myTokens, setMyTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const program = useHackaProgram();
  const wallet = useAnchorWallet();
  const navigate = useNavigate();

  useEffect(() => {
    const loadMyDashboardData = async () => {
      if (!wallet || !wallet.publicKey) {
        setError("Please connect your wallet to view your dashboard.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const allRwaAssets = await fetchRwaAssets();
        const myRwaAssets = allRwaAssets.filter(
          (asset) => asset.owner_wallet === wallet.publicKey.toBase58()
        );

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("User not authenticated.");
        }

        const { data: myTokensData, error: tokensError } = await supabase
          .from("tokens")
          .select("*")
          .eq("profile_id", user.id)
          .order("created_at", { ascending: false });

        if (tokensError) {
          throw tokensError;
        }

        const tokensList = myTokensData || [];

        const dailyCounts = new Map<string, number>();
        tokensList.forEach((token) => {
          const date = new Date(token.created_at);
          const dateString = date.toISOString().split("T")[0];
          dailyCounts.set(dateString, (dailyCounts.get(dateString) || 0) + 1);
        });

        const chartData = Array.from(dailyCounts.entries())
          .map(([date, count]) => ({ date, count }))
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );

        setMyTokenCreationData(chartData);

        // Set states
        setMyTokens(tokensList);
        setStats({
          myTokensCreated: tokensList.length,
          myRwaAssets: myRwaAssets.length,
        });
      } catch (err) {
        console.error("Failed to load user dashboard data:", err);
        setError("Failed to load your dashboard data.");
        toast.error("Error loading data", { description: describeError(err) });
      } finally {
        setLoading(false);
      }
    };

    loadMyDashboardData();
  }, [program, wallet]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold mb-2">My Dashboard</h2>
            <p className="text-muted-foreground">
              Overview of your personal assets and tokens
            </p>
          </div>
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
            myStatDetails.map((stat) => {
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
                    <p className="text-sm text-muted-foreground mb-1">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold mb-1">{displayValue}</p>
                  </div>
                </Card>
              );
            })
          ) : null}
        </div>

        <div className="grid gap-6">
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
            <h3 className="text-xl font-semibold mb-4">
              My Daily Token Creations
            </h3>
            <div className="h-64">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : myTokenCreationData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={myTokenCreationData}
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
                        return date.toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                        });
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
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                      labelFormatter={(label) =>
                        new Date(label).toLocaleDateString("en-US", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      }
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      name="Tokens Created"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  You haven't created any tokens yet.
                </div>
              )}
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
          <h3 className="text-xl font-semibold mb-4">My Recent Tokens</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Tag
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Transaction
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      Loading tokens...
                    </td>
                  </tr>
                ) : myTokens.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No tokens found.
                    </td>
                  </tr>
                ) : (
                  myTokens.slice(0, 5).map((token) => (
                    <tr
                      key={token.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-4 px-4 font-medium">{token.name}</td>
                      <td className="py-4 px-4">
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {token.tag}
                        </code>
                      </td>
                      <td className="py-4 px-4">
                        {token.type === "Fungível"
                          ? "Fungible"
                          : "Non-fungible"}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {token.status === "Ativo" ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-secondary" />
                              <span className="text-secondary">Active</span>
                            </>
                          ) : token.status === "Pendente" ? (
                            <>
                              <Clock className="w-4 h-4 text-gold" />
                              <span className="text-gold">Pending</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-destructive" />
                              <span className="text-destructive">
                                {token.status}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {new Date(token.created_at).toLocaleDateString("en-US")}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {token.transaction_hash ? (
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={`${EXPLORER_BASE_URL}/tx/${token.transaction_hash}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View details
                            </a>
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {myTokens.length > 5 && (
              <div className="text-center mt-4">
                <Button variant="link" onClick={() => navigate("/tokens")}>
                  View all tokens ({myTokens.length})
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MyDashboard;