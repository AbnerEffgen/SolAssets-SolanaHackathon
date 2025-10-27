import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Token = Database['public']['Tables']['tokens']['Row'];
type NewToken = Database['public']['Tables']['tokens']['Insert'];

const Tokens = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [existingTokens, setExistingTokens] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [tokenType, setTokenType] = useState<NewToken['type'] | "">("");

  // Buscar o perfil do usuário e seus tokens
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingTokens(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Usuário não autenticado. Por favor, faça o login novamente.");
        }
        
        const currentProfileId = user.id;
        setProfileId(currentProfileId);

        const { data: tokensData, error: tokensError } = await supabase
          .from('tokens')
          .select('*')
          .eq('profile_id', currentProfileId)
          .order('created_at', { ascending: false });

        if (tokensError) {
          throw tokensError;
        }

        setExistingTokens(tokensData || []);
      } catch (error: any) {
        console.error("Erro ao buscar dados:", error);
        toast.error("Erro ao carregar seus tokens.", { description: error.message });
      } finally {
        setIsLoadingTokens(false);
      }
    };

    fetchData();
  }, []);


  const handleCreateToken = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profileId) {
        toast.error("Perfil de usuário não encontrado. Não é possível criar o token.");
        return;
    }
    if (!tokenType) {
        toast.error("Por favor, selecione um tipo de token.");
        return;
    }

    setIsCreating(true);
    const formData = new FormData(e.currentTarget);

  
    const tokenData: NewToken = {
      profile_id: profileId,
      name: formData.get("token-name") as string,
      tag: formData.get("token-tag") as string,
      type: tokenType,
      quantity: Number(formData.get("token-quantity")),
      description: formData.get("token-description") as string,
      status: 'Pendente',
    };

    try {
      const { data, error } = await supabase
        .from('tokens')
        .insert(tokenData)
        .select()
        .single();

      if (error) throw error;

      toast.success("Token emitido com sucesso!", {
        description: `O token "${data.name}" está pendente de validação.`
      });
      setExistingTokens(prev => [data, ...prev]);
    } catch (error: any) {
      console.error("Erro ao criar token:", error);
      toast.error("Falha ao emitir o token.", { description: error.message });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Tokens</h2>
            <p className="text-muted-foreground">Crie e gerencie seus tokens</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="hero" disabled={!profileId}>
                <Plus className="mr-2" />
                Emitir Token
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-2xl">Emitir Novo Token</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateToken} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="token-name">Nome do Token</Label>
                    <Input 
                      id="token-name"
                      name="token-name"
                      placeholder="Ex: Agro Token"
                      className="bg-background/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="token-tag">Tag</Label>
                    <Input 
                      id="token-tag"
                      name="token-tag"
                      placeholder="Ex: AGR-001"
                      className="bg-background/50"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="token-type">Tipo</Label>
                    <Select required onValueChange={(value) => setTokenType(value as NewToken['type'])} value={tokenType}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fungível">Fungível</SelectItem>
                        <SelectItem value="Não-fungível">Não-fungível</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="token-quantity">Quantidade</Label>
                    <Input 
                      id="token-quantity"
                      name="token-quantity"
                      type="number" 
                      placeholder="1000000"
                      className="bg-background/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="token-description">Descrição</Label>
                  <Textarea 
                    id="token-description"
                    name="token-description"
                    placeholder="Descreva o propósito e características do token"
                    className="bg-background/50 min-h-24"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  variant="hero"
                  disabled={isCreating || !profileId}
                >
                  {isCreating ? "Emitindo..." : "Emitir Token"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
          <h3 className="text-xl font-semibold mb-4">Tokens Criados</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nome</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tag</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Quantidade</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingTokens ? (
                    <tr><td colSpan={7} className="text-center py-8">Carregando tokens...</td></tr>
                ) : existingTokens.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum token encontrado.</td></tr>
                ) : (
                    existingTokens.map((token) => (
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
                        <td className="py-4 px-4 text-sm text-muted-foreground">{new Date(token.created_at).toLocaleDateString()}</td>
                        <td className="py-4 px-4">
                        <Button variant="ghost" size="sm">Ver detalhes</Button>
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

export default Tokens;
