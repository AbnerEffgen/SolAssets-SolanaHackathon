import { utils } from "@coral-xyz/anchor";

export const TOKEN_RECORD_SEED = utils.bytes.utf8.encode("token-record");
export const EXPLORER_BASE_URL = "https://explorer.solana.com";

const DECIMAL_PATTERN = /^\d+(\.\d+)?$/;
const MAX_U16 = 65_535;

const sanitizeNumericInput = (value: string) => value.replace(",", ".").trim();

export const parseAmountToBaseUnits = (value: string, decimals: number): bigint => {
  const normalized = sanitizeNumericInput(value);
  if (!normalized) {
    throw new Error("Informe um valor.");
  }

  if (!DECIMAL_PATTERN.test(normalized)) {
    throw new Error("Valor inválido. Utilize apenas números e ponto decimal.");
  }

  const [wholePart, fractionalPart = ""] = normalized.split(".");
  if (fractionalPart.length > decimals) {
    throw new Error(`No máximo ${decimals} casas decimais são permitidas.`);
  }

  const paddedFraction = fractionalPart.padEnd(decimals, "0");
  const fractionValue = paddedFraction ? BigInt(paddedFraction) : 0n;
  const baseUnits =
    BigInt(wholePart) * 10n ** BigInt(decimals) +
    fractionValue;

  if (baseUnits <= 0) {
    throw new Error("O valor deve ser maior que zero.");
  }

  return baseUnits;
};

export const convertCurrencyToMinorUnits = (
  value: number | null | undefined,
  minorDecimals = 2,
): bigint => {
  if (value === null || value === undefined) {
    return 0n;
  }

  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Valor monetário inválido.");
  }

  const multiplier = 10 ** minorDecimals;
  const scaled = Math.round(value * multiplier);

  if (!Number.isFinite(scaled) || scaled < 0) {
    throw new Error("Não foi possível converter o valor informado.");
  }

  return BigInt(scaled);
};

export const toBasisPoints = (value: number | null | undefined): number => {
  if (value === null || value === undefined) {
    return 0;
  }

  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Yield inválido.");
  }

  const basis = Math.round(value * 100);
  if (basis > MAX_U16) {
    throw new Error("Yield acima do limite suportado (655,35%).");
  }

  return basis;
};

export const describeError = (error: unknown) =>
  error instanceof Error ? error.message : String(error);
