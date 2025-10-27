import {supabase} from "@/integrations/supabase/client";

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
  name: string;
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
  name: string;
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

type AssetNameColumn = "asset_name" | "name";

const assetNameColumnCandidates: AssetNameColumn[] = ["asset_name", "name"];
const undefinedColumnErrorCode = "42703";
let cachedAssetNameColumn: AssetNameColumn | null = null;

const rememberAssetNameColumn = (column: AssetNameColumn | null) => {
  if (column) {
    cachedAssetNameColumn = column;
  }
};

const detectAssetNameColumn = (
  row: Record<string, unknown> | null | undefined,
): AssetNameColumn | null => {
  if (!row || typeof row !== "object") {
    return null;
  }

  if (Object.prototype.hasOwnProperty.call(row, "asset_name")) {
    return "asset_name";
  }

  if (Object.prototype.hasOwnProperty.call(row, "name")) {
    return "name";
  }

  return null;
};

const extractAssetName = (row: Record<string, any>): string => {
  const column = detectAssetNameColumn(row);
  rememberAssetNameColumn(column);

  if (column && typeof row[column] === "string" && row[column].trim().length > 0) {
    return row[column];
  }

  return "Ativo sem nome";
};

const mapDocumentRow = (row: any): RwaDocument => ({
  id: row.id,
  asset_id: row.asset_id,
  name: row.name,
  status: (row.status as AssetStatus) ?? "Pendente",
  url: row.url ?? null,
  submitted_at: row.submitted_at,
  reviewer_notes: row.reviewer_notes ?? null,
});

const mapAssetRow = (row: any, documents: RwaDocument[] = []): RwaAsset => ({
  id: row.id,
  name: extractAssetName(row),
  token_code: row.token_code,
  status: (row.status as AssetStatus) ?? "Pendente",
  location: row.location ?? null,
  valuation: row.valuation ?? null,
  yield_rate: row.yield_rate ?? null,
  description: row.description ?? null,
  document_requirements: row.document_requirements ?? null,
  owner_wallet: row.owner_wallet ?? null,
  rejection_reason: row.rejection_reason ?? null,
  created_at: row.created_at,
  updated_at: row.updated_at,
  documents,
});

export const fetchRwaAssets = async (): Promise<RwaAsset[]> => {

  console.log("[fetchRwaAssets] Fetching all assets");

  const { data: rwa_assets, error } = await supabase.from('rwa_assets').select('*')

  if (error) {
    console.error("[fetchRwaAssets] Error:", error);
    throw error;
  }

  const assetRows = rwa_assets ?? [];

  console.log("[fetchRwaAssets] Success, found", assetRows.length, "assets");

  if (assetRows.length === 0) {
    return [];
  }

  const assetIds = assetRows.map((asset) => asset.id);

  const { data: documents, error: documentsError } = await supabase
    .from("rwa_documents")
    .select("*")
    .in("asset_id", assetIds);

  if (documentsError) {
    console.error("[fetchRwaAssets] Documents error:", documentsError);
    throw documentsError;
  }

  const documentsMap = new Map<string, RwaDocument[]>();
  (documents ?? []).forEach((doc) => {
    const typedDocument = mapDocumentRow(doc);
    const list = documentsMap.get(typedDocument.asset_id) ?? [];
    list.push(typedDocument);
    documentsMap.set(typedDocument.asset_id, list);
  });

  return assetRows.map((asset) => mapAssetRow(asset, documentsMap.get(asset.id) ?? []));
};

const normalizeInsertPayload = (
  column: AssetNameColumn,
  payload: CreateRwaAssetInput,
) => ({
  [column]: payload.name,
  token_code: payload.token_code,
  status: payload.status ?? "Pendente",
  location: payload.location ?? null,
  valuation: payload.valuation ?? null,
  yield_rate: payload.yield_rate ?? null,
  description: payload.description ?? null,
  document_requirements: payload.document_requirements ?? null,
  owner_wallet: payload.owner_wallet ?? null,
});

export const createRwaAsset = async (payload: CreateRwaAssetInput): Promise<RwaAsset> => {

  const attemptInsert = async (column: AssetNameColumn) => {
    const insertPayload = normalizeInsertPayload(column, payload);
    console.log("[createRwaAsset] Creating asset:", insertPayload);

    const response = await supabase
      .from("rwa_assets")
      .insert(insertPayload)
      .select("*")
      .single();

    if (!response.error) {
      rememberAssetNameColumn(column);
    }

    return response;
  };

  let columnToUse = cachedAssetNameColumn ?? assetNameColumnCandidates[0];
  let { data, error } = await attemptInsert(columnToUse);

  if (error?.code === undefinedColumnErrorCode) {
    console.warn(
      "[createRwaAsset] Column",
      columnToUse,
      "is missing. Trying alternative column.",
    );
    const fallbackColumn =
      columnToUse === assetNameColumnCandidates[0]
        ? assetNameColumnCandidates[1]
        : assetNameColumnCandidates[0];

    columnToUse = fallbackColumn;
    ({ data, error } = await attemptInsert(fallbackColumn));
  }

  if (error) {
    console.error("[createRwaAsset] Error:", error);
    throw error;
  }

  console.log("[createRwaAsset] Success");

  return mapAssetRow(data, []);
};

export const updateRwaAssetStatus = async ({
  assetId,
  status,
  rejection_reason = null,
}: UpdateRwaAssetStatusInput): Promise<RwaAsset> => {

  console.log("[updateRwaAssetStatus] Updating asset:", assetId, "to", status);

  const { data, error } = await supabase
    .from("rwa_assets")
    .update({ status, rejection_reason })
    .eq("id", assetId)
    .select("*")
    .single();

  if (error) {
    console.error("[updateRwaAssetStatus] Error:", error);
    throw error;
  }

  const { data: documents, error: documentsError } = await supabase
    .from("rwa_documents")
    .select("*")
    .eq("asset_id", assetId);

  if (documentsError) {
    console.error("[updateRwaAssetStatus] Documents error:", documentsError);
    throw documentsError;
  }

  console.log("[updateRwaAssetStatus] Success");

  const typedDocuments = (documents ?? []).map(mapDocumentRow);

  return mapAssetRow(data, typedDocuments);
};
