import { useCallback, useEffect, useMemo, useState, ChangeEvent } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Keypair,
  PublicKey,
  SendTransactionError,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Search,
  MapPin,
  Coins,
  BadgePercent,
  ExternalLink,
  Wallet,
  Paperclip,
  Trash2,
} from "lucide-react";
import {
  RwaCreateAssetForm,
  type RwaFormValues,
} from "@/components/rwa-forms";
import { RwaDetailsDialog } from "@/components/rwa-details";
import {
  fetchRwaAssets,
  createRwaAsset,
  updateRwaAssetStatus,
  type AssetStatus,
  type RwaAsset,
  type CreateRwaAssetInput,
  type UpdateRwaAssetStatusInput,
  type RwaDocument,
} from "@/integrations/supabase/rwa";
import { supabase } from "@/integrations/supabase/client";
import { useHackaProgram } from "@/hooks/useHackaProgram";
import {
  TOKEN_RECORD_SEED,
  EXPLORER_BASE_URL,
  describeError,
  parseAmountToBaseUnits,
  convertCurrencyToMinorUnits,
  toBasisPoints,
} from "@/lib/solana";
import type { Database, TablesInsert } from "@/integrations/supabase/types";

type FilterValue = "all" | AssetStatus;

// NOTE: These values correspond to the database enum and should not be translated.
const assetStatusOptions = ["Pendente", "Em Análise", "Aprovado", "Rejeitado"] as const;

const statusFilters: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Pendente", label: "Pending" },
  { value: "Em Análise", label: "In Review" },
  { value: "Aprovado", label: "Approved" },
  { value: "Rejeitado", label: "Rejected" },
];

const formSchema = z.object({
  name: z.string().min(3, "Please provide the asset name."),
  tokenCode: z
    .string()
    .min(3, "Please provide the token code.")
    .max(15, "The code can have a maximum of 15 characters."),
  status: z.enum(assetStatusOptions, {
    errorMap: () => ({ message: "Please select a valid status." }),
  }),
  location: z.string().max(120, "Maximum 120 characters.").optional(),
  valuation: z.string().optional(),
  yieldRate: z.string().optional(),
  description: z.string().max(500, "Maximum 500 characters.").optional(),
  documentRequirements: z.string().max(500, "Maximum 500 characters.").optional(),
  ownerWallet: z.string().max(120, "Maximum 120 characters.").optional(),
});

type FormValues = z.infer<typeof formSchema>;

const formDefaultValues: FormValues = {
  name: "",
  tokenCode: "",
  status: "Pendente", // Default enum value
  location: "",
  valuation: "",
  yieldRate: "",
  description: "",
  documentRequirements: "",
  ownerWallet: "",
};

const RWA_TOKEN_DECIMALS = 6;
const MAX_METADATA_URI = 200;

const numberFormatter = new Intl.NumberFormat("en-US");

const parseOptionalNumber = (value?: string | null): number | null => {
  if (!value) {
    return null;
  }
  // Use en-US/UK format for parsing (e.g., 1,000.50)
  const sanitized = value.replace(/,/g, "").trim();
  if (!sanitized) {
    return null;
  }

  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : null;
};

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

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "Date not provided";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-US");
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

const RWA = () => {
  const [statusFilter, setStatusFilter] = useState<FilterValue>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<RwaAsset | null>(null);

  const [assets, setAssets] = useState<RwaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSavingAsset, setIsSavingAsset] = useState(false);
  const { publicKey, connected } = useWallet();
  const program = useHackaProgram();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [assetToTokenize, setAssetToTokenize] = useState<RwaAsset | null>(null);
  const [isTokenizeOpen, setIsTokenizeOpen] = useState(false);
  const [tokenizeSupply, setTokenizeSupply] = useState("");
  const [tokenizeMetadataUri, setTokenizeMetadataUri] = useState("");
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setProfileId(user.id);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
        toast.error("Could not load your profile.", {
          description: describeError(error),
        });
      }
    };

    fetchProfile();
  }, []);

  const uploadAndRegisterDocument = async (
    asset: RwaAsset,
    file: File,
    profileId: string,
  ): Promise<RwaDocument> => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed.");
    }

    const maxSizeInMB = 15;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      throw new Error(`File too large. Maximum allowed size is ${maxSizeInMB}MB.`);
    }

    const bucketName = "raw_docs";
    const filePath = `${profileId}/${asset.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error("Could not get the file's public URL.");
    }

    const newDocument: TablesInsert<"rwa_documents"> = {
      asset_id: asset.id,
      name: file.name,
      status: "Pendente", // Database enum value
      url: urlData.publicUrl,
      profile_id: profileId,
    };

    const { data: dbData, error: dbError } = await supabase
      .from("rwa_documents")
      .insert(newDocument)
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    return dbData as RwaDocument;
  };

  const loadAssets = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const fetchedAssets = await fetchRwaAssets();
      setAssets(fetchedAssets);
      setLoadError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error loading assets.";
      setLoadError(message);
    } finally {
      if (isInitial) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAssets(true);
  }, [loadAssets]);

  const counts = useMemo(() => {
    // Logic depends on Portuguese enum values
    const approved = assets.filter((asset) => asset.status === "Aprovado").length;
    const pending = assets.filter((asset) => asset.status === "Pendente").length;
    const reviewing = assets.filter((asset) => asset.status === "Em Análise").length;
    const rejected = assets.filter((asset) => asset.status === "Rejeitado").length;
    const documents = assets.reduce((total, asset) => total + asset.documents.length, 0);

    return {
      approved,
      pending,
      reviewing,
      rejected,
      total: assets.length,
      documents,
    };
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return assets.filter((asset) => {
      // Logic depends on Portuguese enum values
      const matchesStatus = statusFilter === "all" ? true : asset.status === statusFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        asset.name.toLowerCase().includes(normalizedSearch) ||
        asset.token_code.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [assets, searchTerm, statusFilter]);

  const summaryCards = [
    {
      label: "Total Assets",
      value: counts.total,
      description: "Registered on the platform",
      icon: FileText,
    },
    {
      label: "In Validation",
      value: counts.pending + counts.reviewing,
      description: "Pending and in review",
      icon: Clock,
    },
    {
      label: "Approved",
      value: counts.approved,
      description: "Ready for tokenization",
      icon: CheckCircle2,
    },
    {
      label: "Documents Submitted",
      value: counts.documents,
      description: "Total uploads",
      icon: Upload,
    },
  ];

  const handleDetailDialogChange = (open: boolean) => {
    if (!open) {
      setSelectedAsset(null);
    }
  };

  const handleCreateSubmit = async (values: RwaFormValues, file: File | null): Promise<boolean> => {
    setIsSavingAsset(true);
    try {
      const payload: CreateRwaAssetInput = {
        name: values.name.trim(),
        token_code: values.tokenCode.trim().toUpperCase(),
        status: values.status, // Uses Portuguese enum value
        location: values.location?.trim() ? values.location.trim() : null,
        valuation: parseOptionalNumber(values.valuation),
        yield_rate: parseOptionalNumber(values.yieldRate),
        description: values.description?.trim() ? values.description.trim() : null,
        document_requirements: values.documentRequirements?.trim()
          ? values.documentRequirements.trim()
          : null,
        owner_wallet: values.ownerWallet?.trim() ? values.ownerWallet.trim() : null,
      };

      const createdAsset = await createRwaAsset(payload);

      if (file) {
        try {
          if (!profileId) {
            throw new Error("User profile ID not found. Please log in again.");
          }
          const newDocument = await uploadAndRegisterDocument(createdAsset, file, profileId);
          const assetWithDoc = {
            ...createdAsset,
            documents: [newDocument],
          };
          setAssets((previous) => [assetWithDoc, ...previous]);
          toast.success("Asset and document registered successfully!");
        } catch (uploadError) {
          toast.error("Failed to upload document. The asset was not saved.", {
            description: describeError(uploadError),
          });
          return false; 
        }
      } else {
        setAssets((previous) => [createdAsset, ...previous]);
        toast.success("Asset registered successfully!");
      }
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error registering the asset.";
      toast.error("Could not register the asset.", {
        description: message,
      });
      return false;
    } finally {
      setIsSavingAsset(false);
    }
  };

  const handleAssetUpdate = (updatedAsset: RwaAsset) => {
    setAssets((previous) =>
      previous.map((asset) => (asset.id === updatedAsset.id ? updatedAsset : asset)),
    );
    setSelectedAsset(updatedAsset);
  };

  const resetTokenizeState = () => {
    setAssetToTokenize(null);
    setTokenizeSupply("");
    setTokenizeMetadataUri("");
    setIsTokenizing(false);
  };

  const handleTokenizeDialogChange = (open: boolean) => {
    setIsTokenizeOpen(open);
    if (!open) {
      resetTokenizeState();
    }
  };

  const handleOpenTokenize = (asset: RwaAsset) => {
    setAssetToTokenize(asset);
    setTokenizeSupply(
      asset.valuation !== null && asset.valuation !== undefined
        // Format for display/edit, assumes parseOptionalNumber handles it
        ? String(asset.valuation) 
        : "",
    );
    setTokenizeMetadataUri("");
    setIsTokenizeOpen(true);
  };

  const handleTokenizeAsset = async () => {
    if (!assetToTokenize) {
      toast.error("Select an asset to tokenize.");
      return;
    }

    if (assetToTokenize.owner_wallet) {
      toast.error("This asset has already been tokenized.");
      return;
    }

    if (!connected || !publicKey) {
      toast.error("Connect your wallet to tokenize the asset.");
      return;
    }

    if (!program) {
      toast.error("Could not initialize Anchor program. Reload the page and try again.");
      return;
    }

    if (!profileId) {
      toast.error("Your profile was not loaded. Please log in again.");
      return;
    }

    let initialSupplyBase: bigint;
    try {
      initialSupplyBase = parseAmountToBaseUnits(
        tokenizeSupply,
        RWA_TOKEN_DECIMALS,
      );
    } catch (error) {
      toast.error("Invalid quantity.", {
        description: describeError(error),
      });
      return;
    }

    if (!Number.isFinite(Number(initialSupplyBase)) || Number(initialSupplyBase) > Number.MAX_SAFE_INTEGER) {
      toast.error("Quantity too high for off-chain registration.");
      return;
    }

    const metadataUri = tokenizeMetadataUri.trim();
    if (metadataUri.length > MAX_METADATA_URI) {
      toast.error(`Metadata URI must be ${MAX_METADATA_URI} characters or less.`);
      return;
    }

    let valuationMinorUnits: bigint;
    let yieldBps: number;
    try {
      valuationMinorUnits = convertCurrencyToMinorUnits(assetToTokenize.valuation);
      yieldBps = toBasisPoints(assetToTokenize.yield_rate);
    } catch (error) {
      toast.error("Invalid financial data.", {
        description: describeError(error),
      });
      return;
    }

    const mintKeypair = Keypair.generate();
    const [tokenRecord] = PublicKey.findProgramAddressSync(
      [TOKEN_RECORD_SEED, mintKeypair.publicKey.toBuffer()],
      program.programId,
    );

    const destination = getAssociatedTokenAddressSync(
      mintKeypair.publicKey,
      publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    const buildMethod = () =>
      program.methods
        .createRwaToken({
          name: assetToTokenize.name,
          symbol: assetToTokenize.token_code,
          uri: metadataUri,
          initialSupply: new BN(initialSupplyBase.toString()),
          assetId: assetToTokenize.id,
          valuation: new BN(valuationMinorUnits.toString()),
          yieldBps,
        })
        .accounts({
          authority: publicKey,
          tokenRecord,
          mint: mintKeypair.publicKey,
          destination,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([mintKeypair]);

    console.debug(
      "[tokenizeRwa] mint",
      mintKeypair.publicKey.toBase58(),
      "destination",
      destination.toBase58(),
      "tokenRecord",
      tokenRecord.toBase58(),
    );

    setIsTokenizing(true);

    let transactionSignature: string;
    try {
      transactionSignature = await buildMethod().rpc();
    } catch (error) {
      console.error("Error tokenizing RWA asset:", error);

      let description = describeError(error);
      if (error instanceof SendTransactionError) {
        try {
          const logs = await error.getLogs(program.provider.connection);
          console.error("Transaction logs:", logs);
          const programLog = logs.find((log) => log.startsWith("Program log:"));
          if (programLog) {
            description = `${description}\n${programLog}`;
          }
          if (!logs.length) {
            try {
              const simulation = await buildMethod().simulate();
              const simulationLogs = simulation.value.logs ?? [];
              const simulationError = simulation.value.err
                ? JSON.stringify(simulation.value.err)
                : null;
              console.error("Manual simulation - logs:", simulationLogs);
              if (simulationError) {
                console.error("Manual simulation - error:", simulationError);
                description = `${description}\nSimulation error: ${simulationError}`;
              } else if (simulationLogs.length) {
                description = `${description}\nSimulation logs:\n${simulationLogs.join("\n")}`;
              }
            } catch (simulationError) {
              console.error("Manual simulation failed:", simulationError);
            }
          }
        } catch (logError) {
          console.error("Could not get transaction logs:", logError);
        }
      }

      toast.error("Failed to execute on-chain transaction.", {
        description,
      });
      setIsTokenizing(false);
      return;
    }

    try {
      const quantityNumber = Number(initialSupplyBase);
      if (!Number.isFinite(quantityNumber) || quantityNumber > Number.MAX_SAFE_INTEGER) {
        throw new Error("Quantity exceeds supported limit for registration.");
      }

      const tokenInsert: Database["public"]["Tables"]["tokens"]["Insert"] = {
        profile_id: profileId,
        name: assetToTokenize.name,
        tag: assetToTokenize.token_code,
        type: "Fungível", // Database enum value
        quantity: quantityNumber,
        description: assetToTokenize.description ?? "",
        status: "Ativo", // Database enum value
        transaction_hash: transactionSignature,
      };

      const { error: insertError } = await supabase.from("tokens").insert(tokenInsert);
      if (insertError) {
        throw insertError;
      }

      const ownerWallet = publicKey.toBase58();
      const { error: updateError } = await supabase
        .from("rwa_assets")
        .update({ owner_wallet: ownerWallet })
        .eq("id", assetToTokenize.id);

      if (updateError) {
        console.warn("Could not update asset owner in Supabase:", updateError);
      }

      setAssets((previous) =>
        previous.map((asset) =>
          asset.id === assetToTokenize.id
            ? { ...asset, owner_wallet: ownerWallet }
            : asset,
        ),
      );

      if (selectedAsset?.id === assetToTokenize.id) {
        setSelectedAsset({
          ...selectedAsset,
          owner_wallet: ownerWallet,
        });
      }

      toast.success("Asset tokenized successfully!", {
        description: `Explorer: ${EXPLORER_BASE_URL}/tx/${transactionSignature}?cluster=devnet`,
      });
    } catch (error) {
      console.error("Error registering tokenization in Supabase:", error);
      toast.warning("Token created on-chain, but not registered in Supabase.", {
        description: describeError(error),
      });
    } finally {
      setIsTokenizing(false);
      handleTokenizeDialogChange(false);
      void loadAssets();
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDocumentUpload = async (asset: RwaAsset, file: File, profileId: string) => {
    setIsUploading(true);
    try {
      const newDocument = await uploadAndRegisterDocument(asset, file, profileId);
      return newDocument;
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document.", {
        description: describeError(error),
      });
      throw error; 
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <Dialog open={isTokenizeOpen} onOpenChange={handleTokenizeDialogChange}>
        <DialogContent className="max-w-lg">
          {assetToTokenize && (
            <>
              <DialogHeader>
                <DialogTitle>Tokenize Asset</DialogTitle>
                <DialogDescription>
                  Mint the on-chain token for <strong>{assetToTokenize.name}</strong>.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Card className="p-4 border-border/80 bg-card/60">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      <span>
                        Minter wallet:{" "}
                        {publicKey ? publicKey.toBase58() : "Connect your wallet"}
                      </span>
                    </div>
                    {assetToTokenize.valuation !== null && (
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        <span>
                          Estimated valuation: ${" "}
                          {numberFormatter.format(assetToTokenize.valuation)}
                        </span>
                      </div>
                    )}
                    {assetToTokenize.yield_rate !== null && (
                      <div className="flex items-center gap-2">
                        <BadgePercent className="h-4 w-4" />
                        <span>
                          Expected yield: {assetToTokenize.yield_rate.toFixed(2)}% p.a.
                        </span>
                      </div>
                    )}
                    {assetToTokenize.owner_wallet && (
                      <div className="flex items-center gap-2 text-secondary">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Already tokenized by {assetToTokenize.owner_wallet}</span>
                      </div>
                    )}
                  </div>
                </Card>

                <div className="space-y-2">
                  <Label>Initial quantity (minor units)</Label>
                  <Input
                    value={tokenizeSupply}
                    onChange={(event) => setTokenizeSupply(event.target.value)}
                    placeholder="1000000"
                    type="text"
                    className="bg-background/60"
                    inputMode="decimal"
                  />
                  <p className="text-xs text-muted-foreground">
                    RWA tokens use {RWA_TOKEN_DECIMALS} decimals. Enter the quantity in minor units.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Metadata URI (optional)</Label>
                  <Input
                    value={tokenizeMetadataUri}
                    onChange={(event) => setTokenizeMetadataUri(event.target.value)}
                    placeholder="https://..."
                    type="url"
                    className="bg-background/60"
                    maxLength={MAX_METADATA_URI}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum {MAX_METADATA_URI} characters. Use an IPFS/Arweave URL with the asset metadata.
                  </p>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleTokenizeDialogChange(false)}
                  disabled={isTokenizing}
                >
                  Cancel
                </Button>
                <Button
                  variant="hero"
                  onClick={handleTokenizeAsset}
                  disabled={
                    isTokenizing ||
                    !connected ||
                    !program ||
                    Boolean(assetToTokenize.owner_wallet)
                  }
                >
                  {isTokenizing ? "Tokenizing..." : "Confirm Tokenization"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <RwaCreateAssetForm
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateSubmit}
        isSubmitting={isSavingAsset}
        ownerWallet={publicKey ? publicKey.toBase58() : null}
      />

      <RwaDetailsDialog
        isOpen={Boolean(selectedAsset)}
        onOpenChange={handleDetailDialogChange}
        asset={selectedAsset}
        profileId={profileId}
        onAssetUpdate={handleAssetUpdate}
        onDocumentUpload={handleDocumentUpload}
      />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold">RWA - Real-World Assets</h2>
            <p className="text-muted-foreground">
              Register, monitor, and validate real-world assets in one place.
            </p>
          </div>

          <Button variant="hero" onClick={() => setIsCreateOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <Card
              key={card.label}
              className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-3xl font-semibold mt-2">
                    {numberFormatter.format(card.value)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">{card.description}</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {!connected && (
          <Card className="p-4 border-dashed border-primary/40 bg-card/40">
            <p className="text-sm text-muted-foreground">
              Connect your Solana wallet to mint RWA tokens directly on the blockchain.
            </p>
          </Card>
        )}

        <Card className="p-4 md:p-6 bg-card/60 border-border/80 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={statusFilter === filter.value ? "default" : "outline"}
                  className={cn(
                    "h-9",
                    statusFilter === filter.value && "shadow-glow bg-primary text-primary-foreground",
                  )}
                  onClick={() => setStatusFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or code"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10 bg-background/60"
              />
              {isRefreshing && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        </Card>

        {loadError && (
          <Card className="p-6 border-destructive/40 bg-destructive/10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-destructive">
                  Could not load assets
                </h3>
                <p className="text-sm text-destructive/80">{loadError}</p>
              </div>
              <Button variant="outline" onClick={() => loadAssets()} disabled={isRefreshing}>
                Try again
              </Button>
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={`skeleton-${index}`} className="p-6 bg-card/50 border-border/80">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-72" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredAssets.length === 0 ? (
          <Card className="p-10 text-center bg-card/40 border-border/60">
            <div className="max-w-lg mx-auto space-y-3">
              <h3 className="text-xl font-semibold">No assets found</h3>
              <p className="text-sm text-muted-foreground">
                Adjust the filters or register a new real-world asset to start tracking its
                tokenization journey.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredAssets.map((asset) => (
              <Card
                key={asset.id}
                className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all duration-300"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <h3 className="text-xl font-semibold">{asset.name}</h3>
                      <code className="bg-muted px-2 py-1 rounded text-sm">{asset.token_code}</code>
                    </div>

                    {asset.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{asset.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>
                          {asset.documents.length}{" "}
                          {asset.documents.length === 1 ? "document" : "documents"}
                        </span>
                      </div>
                      <span className="hidden sm:inline">•</span>
                      <span>Registered on {formatDate(asset.created_at)}</span>
                      {asset.location && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span>{asset.location}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(asset.status)}
                      <span className={cn("font-medium", getStatusColor(asset.status))}>
                        {translateStatus(asset.status)}
                      </span>
                    </div>
                    {asset.status === "Aprovado" && !asset.owner_wallet && (
                      <Button
                        variant="hero"
                        size="sm"
                        onClick={() => handleOpenTokenize(asset)}
                        disabled={!connected || !program || isTokenizing}
                      >
                        Tokenize
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setSelectedAsset(asset)}>
                      View details
                    </Button>
                  </div>
                </div>

                {asset.owner_wallet && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Wallet className="h-4 w-4" />
                    <span>Tokenized to {asset.owner_wallet}</span>
                  </div>
                )}

                {asset.status === "Rejeitado" && asset.rejection_reason && (
                  <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">
                      <strong>Reason:</strong> {asset.rejection_reason}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        <Card className="p-8 bg-gradient-secondary text-secondary-foreground border-0">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">How does validation work?</h3>
              <p className="opacity-90 mb-4">
                Our team analyzes each submitted document to ensure the authenticity and
                compliance of the real asset.
              </p>
              <ul className="space-y-2 text-sm opacity-90">
                <li>✓ Document analysis within 48h</li>
                <li>✓ Authenticity verification</li>
                <li>✓ Legal and regulatory compliance</li>
              </ul>
            </div>
            <Button variant="gold">Learn More</Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RWA;