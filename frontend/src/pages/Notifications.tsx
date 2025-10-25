import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Bell, CheckCircle2, Users, Vote, TrendingUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const Notifications = () => {
  const notifications = [
    {
      icon: Users,
      title: "Novo investidor",
      description: "Maria Santos adquiriu 5.000 tokens AGR-001",
      time: "2 horas atrás",
      read: false
    },
    {
      icon: CheckCircle2,
      title: "KYC aprovado",
      description: "Sua documentação foi verificada e aprovada",
      time: "5 horas atrás",
      read: false
    },
    {
      icon: Vote,
      title: "Votação encerrada",
      description: "Proposta 'Distribuição de Dividendos' foi aprovada com 85% dos votos",
      time: "1 dia atrás",
      read: true
    },
    {
      icon: TrendingUp,
      title: "Alta no mercado",
      description: "Token CAF-002 valorizou 15% nas últimas 24h",
      time: "1 dia atrás",
      read: true
    },
    {
      icon: FileText,
      title: "Documento pendente",
      description: "Ativo FAZ-001 requer atualização de certificado",
      time: "2 dias atrás",
      read: true
    },
    {
      icon: Users,
      title: "Novo holder",
      description: "João Silva entrou no token FAZ-001",
      time: "3 dias atrás",
      read: true
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Notificações</h2>
            <p className="text-muted-foreground">Acompanhe todas as atividades</p>
          </div>
          
          <Button variant="outline">
            Marcar todas como lidas
          </Button>
        </div>

        <div className="space-y-3">
          {notifications.map((notification, index) => (
            <Card 
              key={index}
              className={`p-5 bg-card/50 backdrop-blur-sm border-border transition-all duration-300 hover:border-primary ${
                !notification.read ? 'border-l-4 border-l-primary' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${
                  !notification.read ? 'bg-primary/20' : 'bg-muted'
                }`}>
                  <notification.icon className={`w-5 h-5 ${
                    !notification.read ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className={`font-semibold mb-1 ${
                        !notification.read ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {notification.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {notification.description}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {notification.time}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
