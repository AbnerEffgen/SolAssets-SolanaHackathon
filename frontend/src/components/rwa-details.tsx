import { useState, useEffect, ChangeEvent } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  MapPin,
  Coins,
  BadgePercent,
  Wallet,
  Paperclip,
} from "lucide-react";
import { FileUpload } from "@/components/file-upload";
import {
  updateRwaAssetStatus,
  type AssetStatus,
  type RwaAsset,
  type RwaDocument,
  type UpdateRwaAssetStatusInput,
} from "@/integrations/supabase/rwa";
import { cn } from "@/lib/utils";
import { describeError } from "@/lib/solana";

const assetStatusOptions = ["Pendente", "Em Análise", "Aprovado", "Rejeitado"] as const;

const numberFormatter = new Intl.NumberFormat("pt-BR");

const getStatusIcon = (status: AssetStatus) => {
  switch (status) {
    case "Aprovado":
      return <CheckCircle2 className="w-5 h-5 text-secondary" />;
    case "Pendente":
      return <Clock className="w-5 h-5 text-gold" />;
    case "Em Análise":
      return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    case "Rejeitado":
      return <XCircle className="w-5 h-5 text-destructive" />;
    default:
      return null;
  }
};

const getStatusColor = (status: AssetStatus) => {
  switch (status) {
    case "Aprovado":
      return "text-secondary";
    case "Pendente":
      return "text-gold";
    case "Em Análise":
      return "text-primary";
    case "Rejeitado":
      return "text-destructive";
    default:
      return "";
  }
};

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "Data não informada";
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("pt-BR");
};

const formatPercentage = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "Não informado";
  }
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
};

interface RwaDetailsDialogProps {
  asset: RwaAsset | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string | null;
  onAssetUpdate: (updatedAsset: RwaAsset) => void;
  onDocumentUpload: (asset: RwaAsset, file: File, profileId: string) => Promise<RwaDocument>;
}

export const RwaDetailsDialog = ({
  asset,
  isOpen,
  onOpenChange,
  profileId,
  onAssetUpdate,
  onDocumentUpload,
}: RwaDetailsDialogProps) => {
  const [statusDraft, setStatusDraft] = useState<AssetStatus>("Pendente");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const trimmedReason = rejectionReason.trim();

  useEffect(() => {
    if (asset) {
      setStatusDraft(asset.status);
      setRejectionReason(asset.rejection_reason ?? "");
    } else {
      // Reset state when dialog closes or asset is null
      setTimeout(() => {
        setSelectedFile(null);
        setRejectionReason("");
      }, 150);
    }
  }, [asset]);

  const hasStatusChanges = asset
    ? statusDraft !== asset.status ||
      (statusDraft === "Rejeitado"
        ? trimmedReason !== (asset.rejection_reason ?? "")
        : Boolean(asset.rejection_reason))
    : false;

  const hasChanges = hasStatusChanges || Boolean(selectedFile);

  const handleSaveChanges = async () => {
    if (!asset) return;

    setIsSaving(true);
    let assetAfterUpdate = asset;
    let success = true;

    // 1. Salvar mudanças de status, se houver
    if (hasStatusChanges) {
      if (statusDraft === "Rejeitado" && trimmedReason.length < 3) {
        toast.error("Informe um motivo para a rejeição com pelo menos 3 caracteres.");
        setIsSaving(false);
        return;
      }

      const payload: UpdateRwaAssetStatusInput = {
        assetId: asset.id,
        status: statusDraft,
        rejection_reason: statusDraft === "Rejeitado" ? trimmedReason : null,
      };

      try {
        assetAfterUpdate = await updateRwaAssetStatus(payload);
        toast.success("Status atualizado com sucesso!");
      } catch (err) {
        success = false;
        toast.error("Não foi possível atualizar o status.", {
          description: describeError(err),
        });
      }
    }

    // 2. Fazer upload do documento, se houver e o passo anterior foi bem sucedido
    if (selectedFile && success) {
      if (!profileId) {
        toast.error("ID do perfil não encontrado. Por favor, recarregue a página.");
        setIsSaving(false);
        return;
      }
      try {
        const newDocument = await onDocumentUpload(assetAfterUpdate, selectedFile, profileId);
        assetAfterUpdate = {
          ...assetAfterUpdate,
          documents: [...assetAfterUpdate.documents, newDocument],
        };
        toast.success("Documento enviado com sucesso!");
        setSelectedFile(null); // Limpa o arquivo após o envio
      } catch (error) {
        success = false;
        toast.error("Falha ao enviar o documento.", {
          description: describeError(error),
        });
      }
    }

    // 3. Atualizar o estado final do ativo
    if (success) {
      onAssetUpdate(assetAfterUpdate);
    }

    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        {asset && (
          <>
            <DialogHeader>
              <DialogTitle>{asset.name}</DialogTitle>
              <DialogDescription>
                Acompanhe a documentação e atualize o status desse ativo real.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[70vh] pr-6">
              <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Status atual</p>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(statusDraft)}
                      <span className={cn("font-medium", getStatusColor(statusDraft))}>
                        {statusDraft}
                      </span>
                    </div>
                  </div>
                  <div className="w-full md:w-60">
                    <Select
                      value={statusDraft}
                      onValueChange={(value) => setStatusDraft(value as AssetStatus)}
                      disabled={isSaving}
                    >
                      <SelectTrigger className="bg-background/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {assetStatusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status === "Em Análise" ? "Em análise" : status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {statusDraft === "Rejeitado" && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Motivo da rejeição</p>
                    <Textarea
                      placeholder="Descreva o que precisa ser ajustado"
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      className="bg-background/60 min-h-[100px]"
                      disabled={isSaving}
                    />
                    <p className="text-xs text-muted-foreground">
                      Essa mensagem será exibida para o time responsável pelo ativo.
                    </p>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Token</p>
                    <p className="text-lg font-semibold">{asset.token_code}</p>
                    <p className="text-xs text-muted-foreground">
                      Cadastrado em {formatDate(asset.created_at)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Localização</span>
                    </div>
                    <p className="text-sm font-medium">{asset.location ?? "Não informada"}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Wallet className="h-4 w-4" />
                      <span>Carteira responsável</span>
                    </div>
                    <p className="text-sm font-medium break-all">
                      {asset.owner_wallet ?? "Não vinculada"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Coins className="h-4 w-4" />
                      <span>Valuation estimado</span>
                    </div>
                    <p className="text-sm font-medium">
                      {asset.valuation !== null
                        ? `R$ ${numberFormatter.format(asset.valuation)}`
                        : "Não informado"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BadgePercent className="h-4 w-4" />
                      <span>Yield esperado (a.a.)</span>
                    </div>
                    <p className="text-sm font-medium">{formatPercentage(asset.yield_rate)}</p>
                  </div>
                </div>

                {asset.description && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">Descrição</h4>
                    <p className="text-sm text-muted-foreground">{asset.description}</p>
                  </div>
                )}

                {asset.document_requirements && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">Documentação exigida</h4>
                    <p className="text-sm text-muted-foreground">{asset.document_requirements}</p>
                  </div>
                )}

                <div className="space-y-4 rounded-lg border border-border bg-card/50 p-4">
                  <h3 className="font-semibold text-lg">Documentos</h3>
                  <div className="space-y-2">
                    {asset.documents.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum documento enviado para este ativo.
                      </p>
                    ) : (
                      asset.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between rounded-md border border-border/50 bg-background/50 p-3">
                          <div className="flex items-center gap-3">
                            <Paperclip className="h-5 w-5 text-muted-foreground" />
                            <div className="flex flex-col">
                              <a
                                href={doc.url ?? "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium hover:underline"
                              >
                                {doc.name}
                              </a>
                              <span className="text-xs text-muted-foreground">
                                Enviado em: {formatDate(doc.submitted_at)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            {getStatusIcon(doc.status)}
                            <span className={cn(getStatusColor(doc.status))}>{doc.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-2 pt-4 border-t border-border">
                    <FileUpload
                      id="document-upload-detail"
                      label="Enviar novo documento"
                      selectedFile={selectedFile}
                      onFileChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                      onFileClear={() => setSelectedFile(null)}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="pt-4 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button
                type="button"
                variant="hero"
                onClick={handleSaveChanges}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};