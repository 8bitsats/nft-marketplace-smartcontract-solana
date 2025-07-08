use anchor_lang::prelude::*;

declare_id!("brCRRQ6jBAScsJdwWRx5azEAuYqWxjJGKnaHr3q3gyj");

#[program]
pub mod terminal_marketplace {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let marketplace = &mut ctx.accounts.marketplace;
        marketplace.authority = ctx.accounts.authority.key();
        marketplace.fee_rate = 250; // 2.5%
        marketplace.total_trades = 0;
        msg!("Terminal Marketplace initialized!");
        Ok(())
    }

    pub fn create_listing(ctx: Context<CreateListing>, price: u64) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        listing.seller = ctx.accounts.seller.key();
        listing.price = price;
        listing.is_active = true;
        msg!("Listing created for {} lamports", price);
        Ok(())
    }

    pub fn buy_listing(ctx: Context<BuyListing>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        let marketplace = &mut ctx.accounts.marketplace;
        
        require!(listing.is_active, ErrorCode::ListingNotActive);
        require!(listing.seller != ctx.accounts.buyer.key(), ErrorCode::CannotBuyOwnListing);
        
        let price = listing.price;
        let fee = price * marketplace.fee_rate / 10000;
        let seller_amount = price - fee;
        
        // Transfer SOL to seller
        **ctx.accounts.buyer.to_account_info().try_borrow_mut_lamports()? -= price;
        **ctx.accounts.seller.to_account_info().try_borrow_mut_lamports()? += seller_amount;
        **ctx.accounts.treasury.to_account_info().try_borrow_mut_lamports()? += fee;
        
        listing.is_active = false;
        marketplace.total_trades += 1;
        
        msg!("Listing purchased for {} lamports", price);
        Ok(())
    }

    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        require!(listing.is_active, ErrorCode::ListingNotActive);
        require!(listing.seller == ctx.accounts.seller.key(), ErrorCode::Unauthorized);
        
        listing.is_active = false;
        msg!("Listing cancelled");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 8,
        seeds = [b"marketplace"],
        bump
    )]
    pub marketplace: Account<'info, Marketplace>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateListing<'info> {
    #[account(
        init,
        payer = seller,
        space = 8 + 32 + 8 + 1,
        seeds = [b"listing", seller.key().as_ref()],
        bump
    )]
    pub listing: Account<'info, Listing>,
    #[account(mut)]
    pub seller: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyListing<'info> {
    #[account(
        mut,
        seeds = [b"marketplace"],
        bump
    )]
    pub marketplace: Account<'info, Marketplace>,
    #[account(
        mut,
        seeds = [b"listing", listing.seller.as_ref()],
        bump,
        close = seller
    )]
    pub listing: Account<'info, Listing>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK: This is safe as we're only transferring lamports
    #[account(mut)]
    pub seller: AccountInfo<'info>,
    /// CHECK: This is safe as we're only transferring lamports
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(
        mut,
        seeds = [b"listing", seller.key().as_ref()],
        bump,
        close = seller
    )]
    pub listing: Account<'info, Listing>,
    #[account(mut)]
    pub seller: Signer<'info>,
}

#[account]
pub struct Marketplace {
    pub authority: Pubkey,
    pub fee_rate: u64,
    pub total_trades: u64,
}

#[account]
pub struct Listing {
    pub seller: Pubkey,
    pub price: u64,
    pub is_active: bool,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Listing is not active")]
    ListingNotActive,
    #[msg("Cannot buy your own listing")]
    CannotBuyOwnListing,
    #[msg("Unauthorized")]
    Unauthorized,
}