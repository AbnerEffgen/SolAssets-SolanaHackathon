import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ThumbsUp, ThumbsDown, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

const Governance = () => {
  const [voting, setVoting] = useState<{ [key: number]: boolean }>({});

  const proposals = [
    {
      id: 1,
      title: "Distribuição de Dividendos Q1 2024",
      description: "Proposta para distribuir R$ 45.000 em dividendos referente ao primeiro trimestre",
      status: "Ativa",
      votesYes: 75,
      votesNo: 25,
      deadline: "2 dias restantes"
    },
    {
      id: 2,
      title: "Expansão da Produção",
      description: "Investir R$ 200.000 na compra de equipamentos para aumentar a produção em 30%",
      status: "Ativa",
      votesYes: 60,
      votesNo: 40,
      deadline: "5 dias restantes"
    },
    {
      id: 3,
      title: "Renovação de Certificações",
      description: "Renovar certificações orgânicas e de sustentabilidade",
      status: "Encerrada",
      votesYes: 85,
      votesNo: 15,
      deadline: "Aprovado"
    },
  ];

  const handleVote = (proposalId: number, vote: 'yes' | 'no') => {
    setVoting({ ...voting, [proposalId]: true });
    
    setTimeout(() => {
      setVoting({ ...voting, [proposalId]: false });
      toast.success(vote === 'yes' ? "Voto registrado a favor!" : "Voto registrado contra!");
    }, 1500);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Governança</h2>
            <p className="text-muted-foreground">Vote nas propostas e participe das decisões</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="mr-2" />
                Nova Proposta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-2xl">Criar Nova Proposta</DialogTitle>
              </DialogHeader>
              <form className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="proposal-title">Título da Proposta</Label>
                  <Input 
                    id="proposal-title" 
                    placeholder="Ex: Distribuição de Dividendos"
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proposal-description">Descrição</Label>
                  <Textarea 
                    id="proposal-description" 
                    placeholder="Descreva detalhadamente a proposta"
                    className="bg-background/50 min-h-32"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proposal-deadline">Prazo de Votação (dias)</Label>
                  <Input 
                    id="proposal-deadline" 
                    type="number"
                    placeholder="7"
                    className="bg-background/50"
                  />
                </div>

                <Button type="submit" className="w-full" variant="hero">
                  Criar Proposta
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {proposals.map((proposal) => (
            <Card key={proposal.id} className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all duration-300">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{proposal.title}</h3>
                    {proposal.status === "Ativa" ? (
                      <span className="flex items-center gap-1 text-sm text-gold">
                        <Clock className="w-4 h-4" />
                        {proposal.status}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-secondary">
                        <CheckCircle2 className="w-4 h-4" />
                        {proposal.status}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-4">{proposal.description}</p>
                  <p className="text-sm text-muted-foreground">{proposal.deadline}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4 text-secondary" />
                      A favor
                    </span>
                    <span className="font-medium">{proposal.votesYes}%</span>
                  </div>
                  <Progress value={proposal.votesYes} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <ThumbsDown className="w-4 h-4 text-destructive" />
                      Contra
                    </span>
                    <span className="font-medium">{proposal.votesNo}%</span>
                  </div>
                  <Progress value={proposal.votesNo} className="h-2" />
                </div>
              </div>

              {proposal.status === "Ativa" && (
                <div className="flex gap-3 mt-6">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-secondary hover:bg-secondary hover:text-secondary-foreground"
                    onClick={() => handleVote(proposal.id, 'yes')}
                    disabled={voting[proposal.id]}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    {voting[proposal.id] ? "Votando..." : "Votar a Favor"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 border-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleVote(proposal.id, 'no')}
                    disabled={voting[proposal.id]}
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    {voting[proposal.id] ? "Votando..." : "Votar Contra"}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Governance;
