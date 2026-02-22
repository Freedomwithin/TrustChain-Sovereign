use anchor_lang::prelude::*;

declare_id!("5nbMQKE3kpUPpXRw7TdnReJDoeQfKBgLTnrfuENZn3Xe");

#[program]
pub mod trustchain_notary {
    use super::*;

    pub fn update_integrity(ctx: Context<UpdateIntegrity>, gini_score: u16, hhi_score: u16, status: u8) -> Result<()> {
        let notary_account = &mut ctx.accounts.notary_account;
        notary_account.gini_score = gini_score;
        notary_account.hhi_score = hhi_score;
        notary_account.status = status;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct UpdateIntegrity<'info> {
    #[account(
        init_if_needed,
        payer = notary,
        space = 8 + 2 + 2 + 1, 
        seeds = [b"notary", target_user.key().as_ref()],
        bump
    )]
    pub notary_account: Account<'info, NotaryAccount>,

    #[account(mut)]
    pub notary: Signer<'info>,

    /// CHECK: This is the wallet being analyzed (the target)
    pub target_user: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct NotaryAccount {
    pub gini_score: u16,
    pub hhi_score: u16,
    pub status: u8,
}