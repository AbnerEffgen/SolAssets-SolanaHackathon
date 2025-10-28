use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount},
};

anchor_lang::declare_id!("7i8DEgM1A7UuQyTSC9tofxmBFxu6rEYJxHbA1sA5ZMwm");

pub const STANDARD_TOKEN_DECIMALS: u8 = 9;
pub const RWA_TOKEN_DECIMALS: u8 = 6;

#[program]
pub mod hacka_program {
    use super::*;

    pub fn create_standard_token(
        ctx: Context<CreateStandardToken>,
        args: CreateStandardTokenArgs,
    ) -> Result<()> {
        args.validate_standard()?;
        let CreateStandardTokenArgs {
            name,
            symbol,
            uri,
            initial_supply,
        } = args;

        if initial_supply > 0 {
            let cpi_accounts = MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.destination.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            };
            let cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
            );
            token::mint_to(cpi_ctx, initial_supply)?;
        }

        let bump = ctx.bumps.token_record;

        let token_record = &mut ctx.accounts.token_record;
        token_record.bump = bump;
        token_record.kind = TokenKind::Standard;
        token_record.authority = ctx.accounts.authority.key();
        token_record.mint = ctx.accounts.mint.key();
        token_record.decimals = STANDARD_TOKEN_DECIMALS;
        token_record.supply = initial_supply;
        token_record.name = name;
        token_record.symbol = symbol;
        token_record.uri = uri;
        token_record.rwa = None;

        Ok(())
    }

    pub fn create_rwa_token(
        ctx: Context<CreateRwaToken>,
        args: CreateRwaTokenArgs,
    ) -> Result<()> {
        args.validate_rwa()?;
        let CreateRwaTokenArgs {
            name,
            symbol,
            uri,
            initial_supply,
            asset_id,
            valuation,
            yield_bps,
        } = args;

        if initial_supply > 0 {
            let cpi_accounts = MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.destination.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            };
            let cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
            );
            token::mint_to(cpi_ctx, initial_supply)?;
        }

        let bump = ctx.bumps.token_record;

        let token_record = &mut ctx.accounts.token_record;
        token_record.bump = bump;
        token_record.kind = TokenKind::Rwa;
        token_record.authority = ctx.accounts.authority.key();
        token_record.mint = ctx.accounts.mint.key();
        token_record.decimals = RWA_TOKEN_DECIMALS;
        token_record.supply = initial_supply;
        token_record.name = name;
        token_record.symbol = symbol;
        token_record.uri = uri;
        token_record.rwa = Some(RwaData {
            asset_id,
            valuation,
            yield_bps,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateStandardToken<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = TokenRecord::space(),
        seeds = [TokenRecord::SEED_PREFIX, mint.key().as_ref()],
        bump
    )]
    pub token_record: Account<'info, TokenRecord>,
    #[account(
        init,
        payer = authority,
        mint::decimals = STANDARD_TOKEN_DECIMALS,
        mint::authority = authority,
        mint::freeze_authority = authority
    )]
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = authority
    )]
    pub destination: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CreateRwaToken<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = TokenRecord::space(),
        seeds = [TokenRecord::SEED_PREFIX, mint.key().as_ref()],
        bump
    )]
    pub token_record: Account<'info, TokenRecord>,
    #[account(
        init,
        payer = authority,
        mint::decimals = RWA_TOKEN_DECIMALS,
        mint::authority = authority,
        mint::freeze_authority = authority
    )]
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = authority
    )]
    pub destination: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateStandardTokenArgs {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub initial_supply: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateRwaTokenArgs {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub initial_supply: u64,
    pub asset_id: String,
    pub valuation: u64,
    pub yield_bps: u16,
}

#[account]
pub struct TokenRecord {
    pub bump: u8,
    pub kind: TokenKind,
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub decimals: u8,
    pub supply: u64,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub rwa: Option<RwaData>,
}

impl TokenRecord {
    pub const SEED_PREFIX: &'static [u8] = b"token-record";
    pub const MAX_NAME_LEN: usize = 64;
    pub const MAX_SYMBOL_LEN: usize = 16;
    pub const MAX_URI_LEN: usize = 200;
    pub const MAX_ASSET_ID_LEN: usize = 64;

    pub const fn space() -> usize {
        let base = 8 // discriminator
            + 1 // bump
            + TokenKind::SIZE
            + 32 // authority
            + 32 // mint
            + 1 // decimals
            + 8 // supply
            + 4 + Self::MAX_NAME_LEN
            + 4 + Self::MAX_SYMBOL_LEN
            + 4 + Self::MAX_URI_LEN;

        let rwa_size = 1 // option flag
            + (4 + Self::MAX_ASSET_ID_LEN // asset id string
                + 8 // valuation
                + 2); // yield_bps

        base + rwa_size
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum TokenKind {
    Standard,
    Rwa,
}

impl TokenKind {
    pub const SIZE: usize = 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RwaData {
    pub asset_id: String,
    pub valuation: u64,
    pub yield_bps: u16,
}

impl CreateStandardTokenArgs {
    fn validate_standard(&self) -> Result<()> {
        anchor_lang::require!(
            self.name.as_bytes().len() <= TokenRecord::MAX_NAME_LEN,
            ErrorCode::NameTooLong
        );
        anchor_lang::require!(
            self.symbol.as_bytes().len() <= TokenRecord::MAX_SYMBOL_LEN,
            ErrorCode::SymbolTooLong
        );
        anchor_lang::require!(
            self.uri.as_bytes().len() <= TokenRecord::MAX_URI_LEN,
            ErrorCode::UriTooLong
        );
        Ok(())
    }
}

impl CreateRwaTokenArgs {
    fn validate_rwa(&self) -> Result<()> {
        anchor_lang::require!(
            self.name.as_bytes().len() <= TokenRecord::MAX_NAME_LEN,
            ErrorCode::NameTooLong
        );
        anchor_lang::require!(
            self.symbol.as_bytes().len() <= TokenRecord::MAX_SYMBOL_LEN,
            ErrorCode::SymbolTooLong
        );
        anchor_lang::require!(
            self.uri.as_bytes().len() <= TokenRecord::MAX_URI_LEN,
            ErrorCode::UriTooLong
        );
        anchor_lang::require!(
            self.asset_id.as_bytes().len() <= TokenRecord::MAX_ASSET_ID_LEN,
            ErrorCode::AssetIdTooLong
        );
        Ok(())
    }
}

#[anchor_lang::error_code]
pub enum ErrorCode {
    #[msg("The provided name exceeds the allowed length.")]
    NameTooLong,
    #[msg("The provided symbol exceeds the allowed length.")]
    SymbolTooLong,
    #[msg("The provided URI exceeds the allowed length.")]
    UriTooLong,
    #[msg("The provided asset identifier is too long.")]
    AssetIdTooLong,
}
