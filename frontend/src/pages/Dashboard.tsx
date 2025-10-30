import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Coins, Users, TrendingUp, Wallet } from "lucide-react";

const Dashboard = () => {
  const stats = [
    { label: "Tokens Created", value: "12", icon: Coins, change: "+3 this month" },
    { label: "Total Holders", value: "1,234", icon: Users, change: "+156 this month" },
    { label: "Total Value Locked", value: "$2.5M", icon: Wallet, change: "+12% this month" },
    { label: "Monthly Yield", value: "$45K", icon: TrendingUp, change: "+8% this month" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your tokenized assets</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-xs text-secondary">{stat.change}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
            <h3 className="text-xl font-semibold mb-4">Token Distribution</h3>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Distribution chart coming soon
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
            <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[
                { action: "New Investor", detail: "John Doe joined the AGR-001 token", time: "2h ago" },
                { action: "Vote Ended", detail: "Dividend distribution approved", time: "5h ago" },
                { action: "Token Issued", detail: "CAF-002 successfully created", time: "1d ago" },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-4 border-b border-border last:border-0">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.detail}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
