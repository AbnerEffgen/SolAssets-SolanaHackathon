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
  Menu,
  X,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import logo from "@/assets/logo.svg";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const mainMenuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Coins, label: "Tokens", path: "/dashboard/tokens" },
    { icon: FileText, label: "RWA", path: "/dashboard/rwa" },
    { icon: Vote, label: "Governança", path: "/dashboard/governance" },
    { icon: TrendingUp, label: "Mercado", path: "/dashboard/market" },
  ];

  const bottomMenuItems = [
    { icon: Bell, label: "Notificações", path: "/dashboard/notifications" },
    { icon: Settings, label: "Configurações", path: "/dashboard/settings" },
  ];

  // Função para mapear itens para o formato de link
  const createLinks = (items: typeof mainMenuItems) => items.map((item) => ({
    label: item.label,
    href: item.path,
    icon: <item.icon className="h-5 w-5" />,
  }));

  const mainLinks = createLinks(mainMenuItems);
  const bottomLinks = createLinks(bottomMenuItems);

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      <header className="shrink-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X /> : <Menu />}
            </Button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <img src={logo} alt="SolAssets Logo" className="h-8" />
              </div>
            </Link>
          </div>
          <WalletMultiButton style={{ height: '40px', fontSize: '14px' }} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
          <SidebarBody className="py-6 bg-card/30 border-r border-border">
            <div className="flex flex-col justify-between h-full">
              <div className="space-y-2">
                {mainLinks.map((link, idx) => {
                  const isActive = location.pathname === link.href;
                  return (
                    <Link to={link.href} key={`main-${idx}`} onClick={() => setSidebarOpen(false)}>
                      <SidebarLink
                        link={link}
                        className={cn(
                          "rounded-lg text-base",
                          isActive ? "bg-primary/10 text-primary font-semibold" : "hover:bg-primary/5"
                        )}
                      />
                    </Link>
                  );
                })}
              </div>

              <div className="space-y-2">
                {bottomLinks.map((link, idx) => {
                  const isActive = location.pathname === link.href;
                  return (
                    <Link to={link.href} key={`bottom-${idx}`} onClick={() => setSidebarOpen(false)}>
                      <SidebarLink
                        link={link}
                        className={cn(
                          "rounded-lg text-base",
                          isActive ? "bg-primary/10 text-primary font-semibold" : "hover:bg-primary/5"
                        )}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          </SidebarBody>
        </Sidebar>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;