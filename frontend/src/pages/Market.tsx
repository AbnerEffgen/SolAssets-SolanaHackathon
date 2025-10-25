import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react";

const Market = () => {
  const orders = [
    { 
      token: "AGR-001", 
      type: "Venda", 
      price: "R$ 2.50", 
      quantity: "10,000",
      total: "R$ 25,000",
      status: "Aberta",
      change: "+5.2%"
    },
    { 
      token: "CAF-002", 
      type: "Compra", 
      price: "R$ 3.20", 
      quantity: "5,000",
      total: "R$ 16,000",
      status: "Aberta",
      change: "+2.8%"
    },
    { 
      token: "FAZ-001", 
      type: "Venda", 
      price: "R$ 150,000", 
      quantity: "1",
      total: "R$ 150,000",
      status: "Concluída",
      change: "-1.5%"
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Mercado Secundário</h2>
            <p className="text-muted-foreground">Negocie tokens no mercado P2P</p>
          </div>
          
          <Button variant="hero">
            Criar Ordem
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Volume 24h</span>
              <TrendingUp className="w-4 h-4 text-secondary" />
            </div>
            <p className="text-2xl font-bold">R$ 125K</p>
            <p className="text-xs text-secondary mt-1">+15.3% que ontem</p>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Ordens Ativas</span>
            </div>
            <p className="text-2xl font-bold">24</p>
            <p className="text-xs text-muted-foreground mt-1">8 compra, 16 venda</p>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Transações Hoje</span>
            </div>
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-gold mt-1">Em processamento: 3</p>
          </Card>
        </div>

        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Ordens de Mercado</h3>
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver no DEX
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Token</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Preço</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Quantidade</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Variação</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ação</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4">
                      <code className="bg-muted px-2 py-1 rounded text-sm">{order.token}</code>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.type === "Venda" 
                          ? "bg-destructive/20 text-destructive" 
                          : "bg-secondary/20 text-secondary"
                      }`}>
                        {order.type}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium">{order.price}</td>
                    <td className="py-4 px-4">{order.quantity}</td>
                    <td className="py-4 px-4 font-medium">{order.total}</td>
                    <td className="py-4 px-4">
                      <div className={`flex items-center gap-1 ${
                        order.change.startsWith('+') ? 'text-secondary' : 'text-destructive'
                      }`}>
                        {order.change.startsWith('+') ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">{order.change}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        order.status === "Aberta" 
                          ? "bg-gold/20 text-gold" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {order.status === "Aberta" ? (
                        <Button variant="ghost" size="sm">
                          {order.type === "Venda" ? "Comprar" : "Vender"}
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" disabled>
                          Ver Detalhes
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-8 bg-gradient-primary text-primary-foreground border-0">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Liquidez via DEX</h3>
              <p className="opacity-90 mb-4">
                Conecte-se a exchanges descentralizadas como Orca e Raydium para maior liquidez e alcance global.
              </p>
            </div>
            <Button variant="gold">
              Conectar DEX
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Market;
