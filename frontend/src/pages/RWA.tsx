import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, CheckCircle2, XCircle, Clock } from "lucide-react";

const RWA = () => {
  const assets = [
    { 
      name: "Fazenda São João", 
      token: "AGR-001", 
      status: "Aprovado",
      documents: 3,
      date: "15/03/2024"
    },
    { 
      name: "Plantação de Café", 
      token: "CAF-002", 
      status: "Pendente",
      documents: 2,
      date: "20/03/2024"
    },
    { 
      name: "Imóvel Rural", 
      token: "FAZ-001", 
      status: "Rejeitado",
      documents: 1,
      date: "25/03/2024"
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Aprovado":
        return <CheckCircle2 className="w-5 h-5 text-secondary" />;
      case "Pendente":
        return <Clock className="w-5 h-5 text-gold" />;
      case "Rejeitado":
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aprovado":
        return "text-secondary";
      case "Pendente":
        return "text-gold";
      case "Rejeitado":
        return "text-destructive";
      default:
        return "";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">RWA - Ativos Reais</h2>
            <p className="text-muted-foreground">Cadastre e valide seus ativos físicos</p>
          </div>
          
          <Button variant="hero">
            <Upload className="mr-2" />
            Adicionar Ativo
          </Button>
        </div>

        <div className="grid gap-6">
          {assets.map((asset, index) => (
            <Card key={index} className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all duration-300">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{asset.name}</h3>
                    <code className="bg-muted px-2 py-1 rounded text-sm">{asset.token}</code>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>{asset.documents} documentos</span>
                    </div>
                    <span>•</span>
                    <span>Cadastrado em {asset.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(asset.status)}
                    <span className={`font-medium ${getStatusColor(asset.status)}`}>
                      {asset.status}
                    </span>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver Documentos
                  </Button>
                </div>
              </div>

              {asset.status === "Rejeitado" && (
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">
                    <strong>Motivo:</strong> Documentação incompleta. É necessário incluir o certificado de propriedade atualizado.
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>

        <Card className="p-8 bg-gradient-secondary text-secondary-foreground border-0">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Como funciona a validação?</h3>
              <p className="opacity-90 mb-4">
                Nossa equipe analisa cada documento enviado para garantir a autenticidade e conformidade do ativo real.
              </p>
              <ul className="space-y-2 text-sm opacity-90">
                <li>✓ Análise de documentação em até 48h</li>
                <li>✓ Verificação de autenticidade</li>
                <li>✓ Conformidade legal e regulatória</li>
              </ul>
            </div>
            <Button variant="gold">
              Saiba Mais
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RWA;
