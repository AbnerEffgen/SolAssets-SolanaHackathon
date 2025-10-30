import { useState, useEffect, useCallback, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Profile,
  ProposalWithVotes,
  RwaAsset,
} from "@/integrations/supabase/types";

const getFutureDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const Governance = () => {
  const [proposals, setProposals] = useState<ProposalWithVotes[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [ownedAssets, setOwnedAssets] = useState<RwaAsset[]>([]);

  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<{ [key: string]: boolean }>({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    deadlineDays: 7,
    asset_id: "none", 
  });

  const { publicKey } = useWallet();
  const navigate = useNavigate();

  const fetchProfileAndOwnership = useCallback(async () => {
    if (!publicKey) {
      toast.error("Por favor, conecte sua carteira.");
      return;
    }

    const walletAddress = publicKey.toBase58();

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("wallet_address", walletAddress)
      .single();

    if (profileError || !profileData) {
      toast.warning(
        "Você precisa criar um perfil para participar da governança."
      );
      navigate("/create-profile");
      return;
    }
    setProfile(profileData);

    const { data: assetsData, error: ownerError } = await supabase
      .from("rwa_assets")
      .select("*")
      .eq("owner_wallet", walletAddress);

    if (ownerError) {
      console.error("Erro ao verificar posse de RWA:", ownerError);
    }

    if (assetsData && assetsData.length > 0) {
      setIsOwner(true);
      setOwnedAssets(assetsData); 
    }
  }, [publicKey, navigate]);

  const fetchProposals = useCallback(async () => {
    setLoading(true);

    const { data: proposalsData, error: proposalsError } = await supabase
      .from("proposals")
      .select("*, rwa_assets ( name, token_code )")
      .order("created_at", { ascending: false });

    if (proposalsError) {
      toast.error("Erro ao buscar propostas.");
      console.error(proposalsError);
      setLoading(false);
      return;
    }

    const { data: votesData, error: votesError } = await supabase
      .from("votes")
      .select("*");

    if (votesError) {
      toast.error("Erro ao buscar votos.");
      console.error(votesError);
      setLoading(false);
      return;
    }

    const proposalsWithVotes: ProposalWithVotes[] = (
      proposalsData as any[]
    ).map((proposal) => {
      const proposalVotes = votesData.filter(
        (v) => v.proposal_id === proposal.id
      );

      const votesYes = proposalVotes.filter((v) => v.vote === true).length;
      const votesNo = proposalVotes.filter((v) => v.vote === false).length;

      const userVoteRecord = profile
        ? proposalVotes.find((v) => v.voter_id === profile.id)
        : null;

      const userVote = userVoteRecord ? userVoteRecord.vote : null;

      return {
        ...proposal,
        votesYes,
        votesNo,
        userVote,
      };
    });

    setProposals(proposalsWithVotes);
    setLoading(false);
  }, [profile]); 

  useEffect(() => {
    if (publicKey) {
      fetchProfileAndOwnership();
    }
  }, [publicKey, fetchProfileAndOwnership]);

  useEffect(() => {
    if (profile || !publicKey) {
      fetchProposals();
    }
  }, [profile, publicKey, fetchProposals]);

  const handleCreateProposal = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) {
      toast.error("Perfil não encontrado.");
      return;
    }

    const { title, description, deadlineDays, asset_id } = formState;
    if (!title || !description || deadlineDays <= 0) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    const deadline = getFutureDate(Number(deadlineDays));

    const { error } = await supabase.from("proposals").insert({
      title,
      description,
      deadline,
      creator_id: profile.id,
      status: "Ativa",
      asset_id: asset_id === "none" ? null : asset_id,
    });

    if (error) {
      toast.error("Erro ao criar proposta.");
      console.error(error);
    } else {
      toast.success("Proposta criada com sucesso!");
      setDialogOpen(false);
      setFormState({
        title: "",
        description: "",
        deadlineDays: 7,
        asset_id: "none",
      });
      fetchProposals(); 
    }
  };

  const handleVote = async (proposalId: string, vote: boolean) => {
    if (!profile) {
      toast.error("Você precisa de um perfil para votar.");
      return;
    }

    setVoting({ ...voting, [proposalId]: true });

    const { error } = await supabase
      .from("votes")
      .upsert(
        {
          proposal_id: proposalId,
          voter_id: profile.id,
          vote: vote,
        },
        {
          onConflict: "proposal_id, voter_id",
        }
      );

    setVoting({ ...voting, [proposalId]: false });

    if (error) {
      toast.error("Erro ao registrar voto.");
      console.error(error);
    } else {
      toast.success("Voto registrado com sucesso!");
      fetchProposals(); 
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormState((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormState((prev) => ({ ...prev, asset_id: value }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Governança</h2>
            <p className="text-muted-foreground">
              Vote nas propostas e participe das decisões
            </p>
          </div>

          {isOwner && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero">
                  <Plus className="mr-2" />
                  Nova Proposta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-2xl">
                    Criar Nova Proposta
                  </DialogTitle>
                </DialogHeader>
                <form
                  className="space-y-4 mt-4"
                  onSubmit={handleCreateProposal}
                >
                  <div className="space-y-2">
                    <Label htmlFor="asset_id">Referente ao Ativo (Token)</Label>
                    <Select
                      value={formState.asset_id}
                      onValueChange={handleSelectChange}
                    >
                      <SelectTrigger className="w-full bg-background/50">
                        <SelectValue placeholder="Selecione um ativo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          Proposta Geral (Nenhum)
                        </SelectItem>
                        {ownedAssets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.name} ({asset.token_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Título da Proposta</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Distribuição de Dividendos"
                      className="bg-background/50"
                      value={formState.title}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva detalhadamente a proposta"
                      className="bg-background/50 min-h-32"
                      value={formState.description}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadlineDays">
                      Prazo de Votação (dias)
                    </Label>
                    <Input
                      id="deadlineDays"
                      type="number"
                      placeholder="7"
                      className="bg-background/50"
                      value={formState.deadlineDays}
                      onChange={handleFormChange}
                    />
                  </div>

                  <Button type="submit" className="w-full" variant="hero">
                    Criar Proposta
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6">
            {proposals.map((proposal) => {
              const totalVotes = proposal.votesYes + proposal.votesNo;
              const yesPercentage =
                totalVotes === 0 ? 0 : (proposal.votesYes / totalVotes) * 100;
              const noPercentage =
                totalVotes === 0 ? 0 : (proposal.votesNo / totalVotes) * 100;

              const isVoting = voting[proposal.id];
              const hasVoted = proposal.userVote !== null;

              const deadlineDate = new Date(proposal.deadline);
              const isExpired = deadlineDate < new Date();
              const status =
                isExpired && proposal.status === "Ativa"
                  ? "Encerrada"
                  : proposal.status;

              return (
                <Card
                  key={proposal.id}
                  className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {proposal.rwa_assets && (
                          <Badge variant="secondary">
                            {proposal.rwa_assets.name}
                          </Badge>
                        )}
                        <h3 className="text-xl font-semibold">
                          {proposal.title}
                        </h3>

                        {status === "Ativa" ? (
                          <span className="flex items-center gap-1 text-sm text-gold">
                            <Clock className="w-4 h-4" />
                            {status}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-sm text-secondary">
                            <CheckCircle2 className="w-4 h-4" />
                            {status}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-4">
                        {proposal.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Encerra em:{" "}
                        {deadlineDate.toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4 text-secondary" />A favor
                        </span>
                        <span className="font-medium">
                          {yesPercentage.toFixed(0)}% ({proposal.votesYes})
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <ThumbsDown className="w-4 h-4 text-destructive" />
                          Contra
                        </span>
                        <span className="font-medium">
                          {noPercentage.toFixed(0)}% ({proposal.votesNo})
                        </span>
                      </div>
                    </div>
                  </div>

                  {status === "Ativa" && (
                    <div className="flex gap-3 mt-6">
                      <Button
                        variant={
                          hasVoted && proposal.userVote === true
                            ? "secondary"
                            : "outline"
                        }
                        className="flex-1 border-secondary hover:bg-secondary hover:text-secondary-foreground disabled:opacity-50"
                        onClick={() => handleVote(proposal.id, true)}
                        disabled={isVoting || !profile}
                      >
                        {isVoting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ThumbsUp className="mr-2 h-4 w-4" />
                        )}
                        {hasVoted && proposal.userVote === true
                          ? "Votado"
                          : "Votar a Favor"}
                      </Button>
                      <Button
                        variant={
                          hasVoted && proposal.userVote === false
                            ? "destructive"
                            : "outline"
                        }
                        className="flex-1 border-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
                        onClick={() => handleVote(proposal.id, false)}
                        disabled={isVoting || !profile}
                      >
                        {isVoting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ThumbsDown className="mr-2 h-4 w-4" />
                        )}
                        {hasVoted && proposal.userVote === false
                          ? "Votado"
                          : "Votar Contra"}
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Governance;