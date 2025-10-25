import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

const Tokens = () => {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateToken = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    setTimeout(() => {
      setIsCreating(false);
      toast.success("Token emitido com sucesso!", {
        description: "Hash: 0x1234...5678"
      });
    }, 2000);
  };

  const existingTokens = [
    { name: "Agro Token", tag: "AGR-001", type: "Fungível", quantity: "1,000,000", status: "Ativo", date: "15/03/2024" },
    { name: "Café Premium", tag: "CAF-002", type: "Fungível", quantity: "500,000", status: "Ativo", date: "20/03/2024" },
    { name: "Fazenda Digital", tag: "FAZ-001", type: "Não-fungível", quantity: "1", status: "Pendente", date: "25/03/2024" },
  ];

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
              <Button variant="hero">
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
                      placeholder="Ex: Agro Token"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="token-tag">Tag</Label>
                    <Input 
                      id="token-tag" 
                      placeholder="Ex: AGR-001"
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="token-type">Tipo</Label>
                    <Select>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fungible">Fungível</SelectItem>
                        <SelectItem value="non-fungible">Não-fungível</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="token-quantity">Quantidade</Label>
                    <Input 
                      id="token-quantity" 
                      type="number" 
                      placeholder="1000000"
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="token-description">Descrição</Label>
                  <Textarea 
                    id="token-description" 
                    placeholder="Descreva o propósito e características do token"
                    className="bg-background/50 min-h-24"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  variant="hero"
                  disabled={isCreating}
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
                {existingTokens.map((token, index) => (
                  <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4 font-medium">{token.name}</td>
                    <td className="py-4 px-4">
                      <code className="bg-muted px-2 py-1 rounded text-sm">{token.tag}</code>
                    </td>
                    <td className="py-4 px-4">{token.type}</td>
                    <td className="py-4 px-4">{token.quantity}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {token.status === "Ativo" ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-secondary" />
                            <span className="text-secondary">{token.status}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-gold" />
                            <span className="text-gold">{token.status}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{token.date}</td>
                    <td className="py-4 px-4">
                      <Button variant="ghost" size="sm">Ver detalhes</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Tokens;
