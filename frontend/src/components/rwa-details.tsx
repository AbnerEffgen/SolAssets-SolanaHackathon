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

// NOTE: These values correspond to the database enum and should not be translated.
const assetStatusOptions = ["Pendente", "Em Análise", "Aprovado", "Rejeitado"] as const;

// Helper function to translate status for display
const translateStatus = (status: AssetStatus): string => {
  switch (status) {
    case "Pendente":
      return "Pending";
    case "Em Análise":
      return "In Review";
    case "Aprovado":
      return "Approved";
    case "Rejeitado":
      return "Rejected";
    default:
      return status;
  }
};

const numberFormatter = new Intl.NumberFormat("en-US");

// Status logic relies on Portuguese enum values
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
    return "Date not provided";
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("en-US");
};

const formatPercentage = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "Not provided";
  }
  return `${value.toLocaleString("en-US", {
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

  // const hasStatusChanges = asset
  //   ? statusDraft !== asset.status ||
  //   (statusDraft === "Rejeitado" // Logic uses PT enum
  //     ? trimmedReason !== (asset.rejection_reason ?? "")
  //     : Boolean(asset.rejection_reason))
  //   : false;
  const hasStatusChanges = false; // Status changes are disabled for now

  const hasChanges = hasStatusChanges || Boolean(selectedFile);

  const handleSaveChanges = async () => {
    if (!asset) return;

    setIsSaving(true);
    let assetAfterUpdate = asset;
    let success = true;

    // // 1. Save status changes, if any
    // if (hasStatusChanges) {
    //   if (statusDraft === "Rejeitado" && trimmedReason.length < 3) { // Logic uses PT enum
    //     toast.error("Please provide a rejection reason with at least 3 characters.");
    //     setIsSaving(false);
    //     return;
    //   }

    //   const payload: UpdateRwaAssetStatusInput = {
    //     assetId: asset.id,
    //     status: statusDraft,
    //     rejection_reason: statusDraft === "Rejeitado" ? trimmedReason : null, // Logic uses PT enum
    //   };

    //   try {
    //     assetAfterUpdate = await updateRwaAssetStatus(payload);
    //     toast.success("Status updated successfully!");
    //   } catch (err) {
    //     success = false;
    //     toast.error("Could not update status.", {
    //       description: describeError(err),
    //     });
    //   }
    // }

    // 2. Upload the document, if present and the previous step succeeded
    if (selectedFile && success) {
      if (!profileId) {
        toast.error("Profile ID not found. Please reload the page.");
        setIsSaving(false);
        return;
      }
      try {
        const newDocument = await onDocumentUpload(assetAfterUpdate, selectedFile, profileId);
        assetAfterUpdate = {
          ...assetAfterUpdate,
          documents: [...assetAfterUpdate.documents, newDocument],
        };
        toast.success("Document uploaded successfully!");
        setSelectedFile(null); // Clear the file after upload
      } catch (error) {
        success = false;
        toast.error("Failed to upload document.", {
          description: describeError(error),
        });
      }
    }

    // 3. Update the final asset state
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
                Track documentation and update the status of this real-world asset.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[70vh] pr-6">
              <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Status</p>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(statusDraft)}
                      <span className={cn("font-medium", getStatusColor(statusDraft))}>
                        {translateStatus(statusDraft)}
                      </span>
                    </div>
                  </div>
                  {/* <div className="w-full md:w-60">
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
                            {translateStatus(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div> */}
                </div>

                {/* {statusDraft === "Rejeitado" && ( // Logic uses PT enum
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Rejection Reason</p>
                    <Textarea
                      placeholder="Describe what needs to be adjusted"
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      className="bg-background/60 min-h-[100px]"
                      disabled={isSaving}
                    />
                    <p className="text-xs text-muted-foreground">
                      This message will be displayed to the team responsible for the asset.
                    </p>
                  </div>
                )} */}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Token</p>
                    <p className="text-lg font-semibold">{asset.token_code}</p>
                    <p className="text-xs text-muted-foreground">
                      Registered on {formatDate(asset.created_at)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Location</span>
                    </div>
                    <p className="text-sm font-medium">{asset.location ?? "Not provided"}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Wallet className="h-4 w-4" />
                      <span>Responsible Wallet</span>
                    </div>
                    <p className="text-sm font-medium break-all">
                      {asset.owner_wallet ?? "Not linked"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Coins className="h-4 w-4" />
                      <span>Estimated Valuation</span>
                    </div>
                    <p className="text-sm font-medium">
                      {asset.valuation !== null
                        ? `$${numberFormatter.format(asset.valuation)}`
                        : "Not provided"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BadgePercent className="h-4 w-4" />
                      <span>Expected Yield (p.a.)</span>
                    </div>
                    <p className="text-sm font-medium">{formatPercentage(asset.yield_rate)}</p>
                  </div>
                </div>

                {asset.description && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">Description</h4>
                    <p className="text-sm text-muted-foreground">{asset.description}</p>
                  </div>
                )}

                {asset.document_requirements && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">Required Documentation</h4>
                    <p className="text-sm text-muted-foreground">{asset.document_requirements}</p>
                  </div>
                )}

                <div className="space-y-4 rounded-lg border border-border bg-card/50 p-4">
                  <h3 className="font-semibold text-lg">Documents</h3>
                  <div className="space-y-2">
                    {asset.documents.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No documents submitted for this asset.
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
                                Submitted on: {formatDate(doc.submitted_at)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            {getStatusIcon(doc.status)}
                            <span className={cn(getStatusColor(doc.status))}>{translateStatus(doc.status)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-2 pt-4 border-t border-border">
                    <FileUpload
                      id="document-upload-detail"
                      label="Upload new document"
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
                Close
              </Button>
              <Button
                type="button"
                variant="hero"
                onClick={handleSaveChanges}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};