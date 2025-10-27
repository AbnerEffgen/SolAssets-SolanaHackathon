import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type SupabaseAny = SupabaseClient<any>;

const supabaseClient = supabase as SupabaseAny;

export type AssetStatus = "Pendente" | "Em Análise" | "Aprovado" | "Rejeitado";

export interface RwaDocument {
  id: string;
  asset_id: string;
  name: string;
  status: AssetStatus;
  url: string | null;
  submitted_at: string;
  reviewer_notes: string | null;
}

export interface RwaAsset {
  id: string;
  asset_name: string;
  token_code: string;
  status: AssetStatus;
  location: string | null;
  valuation: number | null;
  yield_rate: number | null;
  description: string | null;
  document_requirements: string | null;
  owner_wallet: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  documents: RwaDocument[];
}

export interface CreateRwaAssetInput {
  asset_name: string;
  token_code: string;
  status?: AssetStatus;
  location?: string | null;
  valuation?: number | null;
  yield_rate?: number | null;
  description?: string | null;
  document_requirements?: string | null;
  owner_wallet?: string | null;
}

export interface UpdateRwaAssetStatusInput {
  assetId: string;
  status: AssetStatus;
  rejection_reason?: string | null;
}

type RwaAssetRow = Omit<RwaAsset, "documents">;

const documentColumns =
  "id,asset_id,name,status,url,submitted_at,reviewer_notes";

const assetColumns = [
  "id",
  "asset_name",
  "token_code",
  "status",
  "location",
  "valuation",
  "yield_rate",
  "description",
  "document_requirements",
  "owner_wallet",
  "rejection_reason",
  "created_at",
  "updated_at",
].join(",");

export const fetchRwaAssets = async (): Promise<RwaAsset[]> => {
  const { data, error } = await supabaseClient
    .from("rwa_assets")
    .select(assetColumns)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const assets = (data ?? []) as unknown as RwaAssetRow[];

  if (assets.length === 0) {
    return [];
  }

  const assetIds = assets.map((asset) => asset.id);

  const { data: documents, error: documentsError } = await supabaseClient
    .from("rwa_documents")
    .select(documentColumns)
    .in("asset_id", assetIds);

  if (documentsError) {
    throw documentsError;
  }

  const documentsMap = new Map<string, RwaDocument[]>();

  (documents ?? []).forEach((document: any) => {
    const list = documentsMap.get(document.asset_id) ?? [];
    list.push(document as RwaDocument);
    documentsMap.set(document.asset_id, list);
  });

  return assets.map((row) => ({
    ...row,
    documents: documentsMap.get(row.id) ?? [],
  })) as RwaAsset[];
};

export const createRwaAsset = async (payload: CreateRwaAssetInput): Promise<RwaAsset> => {
  const insertPayload = {
    status: "Pendente",
    ...payload,
  };

  const { data, error } = await supabaseClient
    .from("rwa_assets")
    .insert(insertPayload)
    .select(assetColumns)
    .single();

  if (error) {
    throw error;
  }

  return {
    ...(data as unknown as RwaAssetRow),
    documents: [],
  } as RwaAsset;
};

export const updateRwaAssetStatus = async ({
  assetId,
  status,
  rejection_reason = null,
}: UpdateRwaAssetStatusInput): Promise<RwaAsset> => {
  const { data, error } = await supabaseClient
    .from("rwa_assets")
    .update({ status, rejection_reason })
    .eq("id", assetId)
    .select(assetColumns)
    .single();

  if (error) {
    throw error;
  }

  const { data: documents, error: documentsError } = await supabaseClient
    .from("rwa_documents")
    .select(documentColumns)
    .eq("asset_id", assetId);

  if (documentsError) {
    throw documentsError;
  }

  return {
    ...(data as unknown as RwaAssetRow),
    documents: (documents ?? []) as RwaDocument[],
  };
};
