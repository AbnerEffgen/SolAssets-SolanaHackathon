import type { Idl } from "@coral-xyz/anchor";

import idl from "./hacka_program.json";

export interface HackaProgram extends Idl {
  readonly address: string;
}

export const HackaProgramIDL = idl as HackaProgram;
export const HACKA_PROGRAM_ADDRESS = HackaProgramIDL.address;
