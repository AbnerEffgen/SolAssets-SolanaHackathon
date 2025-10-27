use anchor_lang::prelude::*;

declare_id!("B7RzTzoLXnqQHtdmxsAswKNeH74i3CEaTyWDWjUgVAW3");

#[program]
pub mod program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
