import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Token {
  id: string;
  name: string;
  tag: string;
  type: 'Fungível' | 'Não-fungível';
  quantity: number;
  status: 'Ativo' | 'Pendente' | 'Falhou';
  created_at: string;
  profiles: {
    full_name: string;
    wallet_address: string;
  } | null;
}

const Market = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

        setTokens(data as Token[]);
      } catch (error: any) {
        console.error("Erro ao buscar tokens do mercado:", error);
        toast.error("Falha ao carregar o mercado.", { description: error.message });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketTokens();
  }, []);


  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Mercado de Tokens</h2>
            <p className="text-muted-foreground">Explore todos os tokens criados na plataforma</p>
          </div>
          
          <Button variant="hero">
            Criar Ordem de Negociação
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* ... cards de estatísticas ... */}
        </div>

        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Tokens Disponíveis</h3>
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver no Explorer
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Token</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tag</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Quantidade</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Criador</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ação</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center py-8">Carregando mercado...</td></tr>
                ) : tokens.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum token no mercado ainda.</td></tr>
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
                            {token.status === "Ativo" ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 text-secondary" />
                                <span className="text-secondary">{token.status}</span>
                            </>
                            ) : token.status === 'Pendente' ? (
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
                      <td className="py-4 px-4 text-sm text-muted-foreground" title={token.profiles?.wallet_address}>
                        {token.profiles?.full_name || 'Desconhecido'}
                      </td>
                      <td className="py-4 px-4">
                        <Button variant="ghost" size="sm">
                          Negociar
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
