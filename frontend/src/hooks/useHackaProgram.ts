import { useMemo } from "react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";

import { HackaProgramIDL, type HackaProgram } from "@/idl/hacka_program";

export const useHackaProgram = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const normalizedIdl = useMemo(() => {
    const clone = JSON.parse(JSON.stringify(HackaProgramIDL)) as HackaProgram;

    if (!clone.accounts || !clone.types) {
      return clone;
    }

    const typeMap = new Map(
      clone.types.map((item) => [item.name, item.type]),
    );

    clone.accounts = clone.accounts.map((account: any) => {
      if (!account.type) {
        const matchedType = typeMap.get(account.name);
        if (matchedType) {
          return {
            ...account,
            type: matchedType,
          };
        }
      }

      return account;
    });

    return clone;
  }, []);

  return useMemo(() => {
    if (!wallet) {
      return null;
    }

    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions(),
    );

    return new Program<HackaProgram>(normalizedIdl, provider);
  }, [connection, wallet, normalizedIdl]);
};
