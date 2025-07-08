pub const MARKETPLACE_SEED: &[u8] = b"terminal_marketplace";
pub const LISTING_SEED: &[u8] = b"terminal_listing";
pub const ORDER_SEED: &[u8] = b"terminal_order";
pub const USER_SEED: &[u8] = b"terminal_user";

pub const DEFAULT_FEE_RATE: u64 = 250; // 2.5%
pub const MAX_FEE_RATE: u64 = 1000; // 10%
pub const BASIS_POINTS: u64 = 10000;

pub const MIN_PRICE: u64 = 1_000_000; // 0.001 SOL
pub const MAX_PRICE: u64 = 1_000_000_000_000; // 1M SOL
