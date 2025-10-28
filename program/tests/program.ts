import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
const TOKEN_RECORD_SEED = Buffer.from("token-record");

describe("program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.hackaProgram as Program;
  const tokenRecordAccount = program.account as any;

  it("creates a standard token", async () => {
    const mintKeypair = anchor.web3.Keypair.generate();
    const [tokenRecord] = anchor.web3.PublicKey.findProgramAddressSync(
      [TOKEN_RECORD_SEED, mintKeypair.publicKey.toBuffer()],
      program.programId,
    );
    const destination = getAssociatedTokenAddressSync(
      mintKeypair.publicKey,
      provider.wallet.publicKey,
    );

    const initialSupply = new anchor.BN(1_000_000_000);

    await program.methods
      .createStandardToken({
        name: "Hacka Token",
        symbol: "HACKA",
        uri: "https://example.com/hacka.json",
        initialSupply,
      })
      .accounts({
        authority: provider.wallet.publicKey,
        tokenRecord,
        mint: mintKeypair.publicKey,
        destination,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([mintKeypair])
      .rpc();

    const record = await tokenRecordAccount.tokenRecord.fetch(tokenRecord);
    expect(record.kind).to.deep.equal({ standard: {} });
    expect(record.decimals).to.equal(9);
    expect(record.supply.toNumber()).to.equal(initialSupply.toNumber());
    expect(record.name).to.equal("Hacka Token");
    expect(record.symbol).to.equal("HACKA");

    const tokenAccount = await getAccount(provider.connection, destination);
    expect(Number(tokenAccount.amount)).to.equal(initialSupply.toNumber());
  });

  it("creates an RWA token", async () => {
    const mintKeypair = anchor.web3.Keypair.generate();
    const [tokenRecord] = anchor.web3.PublicKey.findProgramAddressSync(
      [TOKEN_RECORD_SEED, mintKeypair.publicKey.toBuffer()],
      program.programId,
    );
    const destination = getAssociatedTokenAddressSync(
      mintKeypair.publicKey,
      provider.wallet.publicKey,
    );

    const initialSupply = new anchor.BN(500_000);
    const assetId = "9c6dd20a-5b93-4f90-9d79-ef0d829f3b40";

    await program.methods
      .createRwaToken({
        name: "RWA Credit",
        symbol: "RWA",
        uri: "https://example.com/rwa.json",
        initialSupply,
        assetId,
        valuation: new anchor.BN(2_500_000_000),
        yieldBps: 725,
      })
      .accounts({
        authority: provider.wallet.publicKey,
        tokenRecord,
        mint: mintKeypair.publicKey,
        destination,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([mintKeypair])
      .rpc();

    const record = await tokenRecordAccount.tokenRecord.fetch(tokenRecord);
    expect(record.kind).to.deep.equal({ rwa: {} });
    expect(record.decimals).to.equal(6);
    expect(record.rwa).to.not.equal(null);
    expect(record.rwa?.assetId).to.equal(assetId);
    expect(record.rwa?.yieldBps).to.equal(725);

    const tokenAccount = await getAccount(provider.connection, destination);
    expect(Number(tokenAccount.amount)).to.equal(initialSupply.toNumber());
  });
});
