#!/usr/bin/env node

import { Command } from 'commander';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js';
import { AnchorProvider, BN, Program, web3 } from '@project-serum/anchor';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

// Terminal Marketplace Program ID
const TERMINAL_MARKETPLACE_PROGRAM_ID = new PublicKey("brCRRQ6jBAScsJdwWRx5azEAuYqWxjJGKnaHr3q3gyj");

// Terminal-specific constants
const TERMINAL_COMMANDS = {
    INIT: 'init',
    LIST: 'list',
    BUY: 'buy',
    CANCEL: 'cancel',
    UPDATE: 'update',
    SHOW: 'show',
    STATS: 'stats',
    DEPLOY: 'deploy',
    CLUSTER: 'cluster'
};

class TerminalMarketplace {
    private connection: Connection;
    private provider: AnchorProvider;
    private program: Program;
    private payer: Keypair;

    constructor(rpcUrl: string, payerPath: string) {
        this.connection = new Connection(rpcUrl, 'confirmed');
        this.payer = this.loadKeypair(payerPath);
        this.provider = new AnchorProvider(this.connection, this.payer, { commitment: 'confirmed' });
        // Load IDL dynamically
        const idlPath = path.join(__dirname, '../target/idl/terminal_marketplace.json');
        const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
        this.program = new Program(idl, TERMINAL_MARKETPLACE_PROGRAM_ID, this.provider);
    }

    private loadKeypair(filePath: string): Keypair {
        const keypairData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return Keypair.fromSecretKey(new Uint8Array(keypairData));
    }

    async initialize(feeRate: number = 250, treasury?: string): Promise<void> {
        console.log('🚀 Initializing Terminal Marketplace...');
        
        const treasuryPubkey = treasury ? new PublicKey(treasury) : this.payer.publicKey;
        
        const [marketplacePda] = await PublicKey.findProgramAddress(
            [Buffer.from('marketplace')],
            this.program.programId
        );

        try {
            const tx = await this.program.methods
                .initialize(new BN(feeRate))
                .accounts({
                    marketplace: marketplacePda,
                    authority: this.payer.publicKey,
                    treasury: treasuryPubkey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([this.payer])
                .rpc();

            console.log(`✅ Marketplace initialized!`);
            console.log(`📊 Fee Rate: ${feeRate} basis points (${feeRate/100}%)`);
            console.log(`💰 Treasury: ${treasuryPubkey.toBase58()}`);
            console.log(`🔗 Transaction: ${tx}`);
        } catch (error) {
            console.error('❌ Failed to initialize marketplace:', error);
        }
    }

    async createListing(mint: string, price: number): Promise<void> {
        console.log(`📝 Creating listing for NFT: ${mint}`);
        
        const mintPubkey = new PublicKey(mint);
        const priceLamports = price * LAMPORTS_PER_SOL;
        
        const [listingPda] = await PublicKey.findProgramAddress(
            [Buffer.from('listing'), this.payer.publicKey.toBuffer()],
            this.program.programId
        );

        const sellerTokenAccount = await getAssociatedTokenAddress(
            mintPubkey,
            this.payer.publicKey
        );

        const escrowTokenAccount = await getAssociatedTokenAddress(
            mintPubkey,
            listingPda,
            true
        );

        try {
            const tx = await this.program.methods
                .createListing(new BN(priceLamports))
                .accounts({
                    listing: listingPda,
                    seller: this.payer.publicKey,
                    mint: mintPubkey,
                    sellerTokenAccount,
                    escrowTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                })
                .signers([this.payer])
                .rpc();

            console.log(`✅ NFT listed successfully!`);
            console.log(`💰 Price: ${price} SOL`);
            console.log(`🔗 Transaction: ${tx}`);
        } catch (error) {
            console.error('❌ Failed to create listing:', error);
        }
    }

    async buyNft(mint: string): Promise<void> {
        console.log(`🛒 Buying NFT: ${mint}`);
        
        const mintPubkey = new PublicKey(mint);
        
        const [marketplacePda] = await PublicKey.findProgramAddress(
            [Buffer.from('marketplace')],
            this.program.programId
        );

        const [listingPda] = await PublicKey.findProgramAddress(
            [Buffer.from('listing'), this.payer.publicKey.toBuffer()],
            this.program.programId
        );

        // Get listing data to find seller
        const listingData = await this.program.account.terminalListing.fetch(listingPda);
        
        const [orderPda] = await PublicKey.findProgramAddress(
            [Buffer.from('order'), mintPubkey.toBuffer(), this.payer.publicKey.toBuffer()],
            this.program.programId
        );

        const escrowTokenAccount = await getAssociatedTokenAddress(
            mintPubkey,
            listingPda,
            true
        );

        const buyerTokenAccount = await getAssociatedTokenAddress(
            mintPubkey,
            this.payer.publicKey
        );

        // Get marketplace data for treasury
        const marketplaceData = await this.program.account.terminalMarketplace.fetch(marketplacePda);

        try {
            const tx = await this.program.methods
                .buyNft()
                .accounts({
                    marketplace: marketplacePda,
                    listing: listingPda,
                    order: orderPda,
                    buyer: this.payer.publicKey,
                    seller: listingData.seller,
                    treasury: marketplaceData.treasury,
                    mint: mintPubkey,
                    escrowTokenAccount,
                    buyerTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                })
                .signers([this.payer])
                .rpc();

            console.log(`✅ NFT purchased successfully!`);
            console.log(`💰 Price: ${listingData.price.toNumber() / LAMPORTS_PER_SOL} SOL`);
            console.log(`🔗 Transaction: ${tx}`);
        } catch (error) {
            console.error('❌ Failed to buy NFT:', error);
        }
    }

    async cancelListing(mint: string): Promise<void> {
        console.log(`❌ Cancelling listing for NFT: ${mint}`);
        
        const mintPubkey = new PublicKey(mint);
        
        const [listingPda] = await PublicKey.findProgramAddress(
            [Buffer.from('listing'), this.payer.publicKey.toBuffer()],
            this.program.programId
        );

        const escrowTokenAccount = await getAssociatedTokenAddress(
            mintPubkey,
            listingPda,
            true
        );

        const sellerTokenAccount = await getAssociatedTokenAddress(
            mintPubkey,
            this.payer.publicKey
        );

        try {
            const tx = await this.program.methods
                .cancelListing()
                .accounts({
                    listing: listingPda,
                    seller: this.payer.publicKey,
                    mint: mintPubkey,
                    escrowTokenAccount,
                    sellerTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                })
                .signers([this.payer])
                .rpc();

            console.log(`✅ Listing cancelled successfully!`);
            console.log(`🔗 Transaction: ${tx}`);
        } catch (error) {
            console.error('❌ Failed to cancel listing:', error);
        }
    }

    async updatePrice(mint: string, newPrice: number): Promise<void> {
        console.log(`📝 Updating price for NFT: ${mint}`);
        
        const mintPubkey = new PublicKey(mint);
        const newPriceLamports = newPrice * LAMPORTS_PER_SOL;
        
        const [listingPda] = await PublicKey.findProgramAddress(
            [Buffer.from('listing'), this.payer.publicKey.toBuffer()],
            this.program.programId
        );

        try {
            const tx = await this.program.methods
                .updatePrice(new BN(newPriceLamports))
                .accounts({
                    listing: listingPda,
                    seller: this.payer.publicKey,
                    mint: mintPubkey,
                })
                .signers([this.payer])
                .rpc();

            console.log(`✅ Price updated successfully!`);
            console.log(`💰 New Price: ${newPrice} SOL`);
            console.log(`🔗 Transaction: ${tx}`);
        } catch (error) {
            console.error('❌ Failed to update price:', error);
        }
    }

    async showListing(mint: string): Promise<void> {
        console.log(`🔍 Fetching listing for NFT: ${mint}`);
        
        const mintPubkey = new PublicKey(mint);
        
        const [listingPda] = await PublicKey.findProgramAddress(
            [Buffer.from('listing'), this.payer.publicKey.toBuffer()],
            this.program.programId
        );

        try {
            const listingData = await this.program.account.terminalListing.fetch(listingPda);
            
            console.log(`📊 Listing Details:`);
            console.log(`🏷️  NFT: ${listingData.mint.toBase58()}`);
            console.log(`👤 Seller: ${listingData.seller.toBase58()}`);
            console.log(`💰 Price: ${listingData.price.toNumber() / LAMPORTS_PER_SOL} SOL`);
            console.log(`📅 Created: ${new Date(listingData.createdAt.toNumber() * 1000).toLocaleString()}`);
            console.log(`🟢 Active: ${listingData.isActive ? 'Yes' : 'No'}`);
        } catch (error) {
            console.error('❌ Failed to fetch listing:', error);
        }
    }

    async showStats(): Promise<void> {
        console.log(`📊 Fetching marketplace statistics...`);
        
        const [marketplacePda] = await PublicKey.findProgramAddress(
            [Buffer.from('marketplace')],
            this.program.programId
        );

        try {
            const marketplaceData = await this.program.account.terminalMarketplace.fetch(marketplacePda);
            
            console.log(`📈 Marketplace Statistics:`);
            console.log(`👑 Authority: ${marketplaceData.authority.toBase58()}`);
            console.log(`💰 Fee Rate: ${marketplaceData.feeRate} basis points (${marketplaceData.feeRate/100}%)`);
            console.log(`📊 Total Volume: ${marketplaceData.totalVolume.toNumber() / LAMPORTS_PER_SOL} SOL`);
            console.log(`🔢 Total Trades: ${marketplaceData.totalTrades.toNumber()}`);
            console.log(`🏦 Treasury: ${marketplaceData.treasury.toBase58()}`);
        } catch (error) {
            console.error('❌ Failed to fetch marketplace stats:', error);
        }
    }
}

// CLI Setup
const program = new Command();
program
    .name('terminal-marketplace')
    .description('Terminal-based Solana NFT Marketplace CLI')
    .version('1.0.0');

// Global options
program
    .option('-r, --rpc <url>', 'RPC URL', 'http://localhost:8899')
    .option('-k, --keypair <path>', 'Keypair file path', './deploy-authority.json');

// Initialize marketplace
program
    .command('init')
    .description('Initialize the terminal marketplace')
    .option('-f, --fee-rate <rate>', 'Fee rate in basis points', '250')
    .option('-t, --treasury <pubkey>', 'Treasury public key')
    .action(async (options) => {
        const marketplace = new TerminalMarketplace(program.opts().rpc, program.opts().keypair);
        await marketplace.initialize(parseInt(options.feeRate), options.treasury);
    });

// Create listing
program
    .command('list')
    .description('Create a new NFT listing')
    .argument('<mint>', 'NFT mint address')
    .argument('<price>', 'Price in SOL')
    .action(async (mint, price) => {
        const marketplace = new TerminalMarketplace(program.opts().rpc, program.opts().keypair);
        await marketplace.createListing(mint, parseFloat(price));
    });

// Buy NFT
program
    .command('buy')
    .description('Buy an NFT')
    .argument('<mint>', 'NFT mint address')
    .action(async (mint) => {
        const marketplace = new TerminalMarketplace(program.opts().rpc, program.opts().keypair);
        await marketplace.buyNft(mint);
    });

// Cancel listing
program
    .command('cancel')
    .description('Cancel an NFT listing')
    .argument('<mint>', 'NFT mint address')
    .action(async (mint) => {
        const marketplace = new TerminalMarketplace(program.opts().rpc, program.opts().keypair);
        await marketplace.cancelListing(mint);
    });

// Update price
program
    .command('update')
    .description('Update listing price')
    .argument('<mint>', 'NFT mint address')
    .argument('<price>', 'New price in SOL')
    .action(async (mint, price) => {
        const marketplace = new TerminalMarketplace(program.opts().rpc, program.opts().keypair);
        await marketplace.updatePrice(mint, parseFloat(price));
    });

// Show listing
program
    .command('show')
    .description('Show NFT listing details')
    .argument('<mint>', 'NFT mint address')
    .action(async (mint) => {
        const marketplace = new TerminalMarketplace(program.opts().rpc, program.opts().keypair);
        await marketplace.showListing(mint);
    });

// Show stats
program
    .command('stats')
    .description('Show marketplace statistics')
    .action(async () => {
        const marketplace = new TerminalMarketplace(program.opts().rpc, program.opts().keypair);
        await marketplace.showStats();
    });

// Deploy cluster
program
    .command('cluster')
    .description('Deploy and manage custom cluster')
    .action(async () => {
        console.log('🌐 Custom cluster deployment coming soon...');
    });

program.parse();