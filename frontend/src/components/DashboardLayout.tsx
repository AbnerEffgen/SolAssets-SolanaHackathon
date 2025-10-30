import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Coins,
  Home,
  FileText,
  Vote,
  TrendingUp,
  Bell,
  Wallet,
  Menu,
  X,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
// Importar o botão do Wallet Adapter
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import logo from "@/assets/logo.svg";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Coins, label: "Tokens", path: "/dashboard/tokens" },
    { icon: FileText, label: "RWA", path: "/dashboard/rwa" },
    { icon: Vote, label: "Governança", path: "/dashboard/governance" },
    { icon: TrendingUp, label: "Mercado", path: "/dashboard/market" },
    { icon: Bell, label: "Notificações", path: "/dashboard/notifications" },
    { icon: Settings, label: "Configurações", path: "/dashboard/settings" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X /> : <Menu />}
            </Button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <img src={logo} alt="SolAssets Logo" className="h-10" />
              </div>
            </Link>
          </div>
          {/* Substituir o botão antigo por este */}
          <WalletMultiButton style={{ height: '40px', fontSize: '14px' }} />
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className={cn(
          "fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 border-r border-border bg-sidebar transition-transform duration-300 z-40",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isActive && "shadow-glow"
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;