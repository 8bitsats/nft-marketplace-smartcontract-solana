#!/usr/bin/env node

import { Command } from 'commander';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js';
import { AnchorProvider, BN, Program } from '@project-serum/anchor';
import * as fs from 'fs';

// Terminal Marketplace Program ID
const PROGRAM_ID = new PublicKey("brCRRQ6jBAScsJdwWRx5azEAuYqWxjJGKnaHr3q3gyj");

class SimpleMarketplace {
    private connection: Connection;
    private provider: AnchorProvider;
    private payer: Keypair;

    constructor(rpcUrl: string, payerPath: string) {
        this.connection = new Connection(rpcUrl, 'confirmed');
        this.payer = this.loadKeypair(payerPath);
        
        // Create a simple provider without requiring IDL
        this.provider = new AnchorProvider(
            this.connection, 
            { publicKey: this.payer.publicKey, signTransaction: async (tx) => tx, signAllTransactions: async (txs) => txs },
            { commitment: 'confirmed' }
        );
    }

    private loadKeypair(filePath: string): Keypair {
        const keypairData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return Keypair.fromSecretKey(new Uint8Array(keypairData));
    }

    async checkCluster(): Promise<void> {
        try {
            const version = await this.connection.getVersion();
            console.log('🌐 Connected to Solana cluster');
            console.log(`📊 Solana Version: ${version['solana-core']}`);
            
            const balance = await this.connection.getBalance(this.payer.publicKey);
            console.log(`💰 Wallet Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
            console.log(`🔑 Wallet Address: ${this.payer.publicKey.toBase58()}`);
            console.log(`🔗 Program ID: ${PROGRAM_ID.toBase58()}`);
        } catch (error) {
            console.error('❌ Failed to connect to cluster:', error);
        }
    }

    async findMarketplacePDA(): Promise<[PublicKey, number]> {
        return await PublicKey.findProgramAddress(
            [Buffer.from('marketplace')],
            PROGRAM_ID
        );
    }

    async findListingPDA(seller: PublicKey): Promise<[PublicKey, number]> {
        return await PublicKey.findProgramAddress(
            [Buffer.from('listing'), seller.toBuffer()],
            PROGRAM_ID
        );
    }

    async simulateInitialize(): Promise<void> {
        console.log('🚀 Simulating marketplace initialization...');
        
        const [marketplacePda, bump] = await this.findMarketplacePDA();
        
        console.log('✅ Marketplace would be initialized at:');
        console.log(`📍 PDA: ${marketplacePda.toBase58()}`);
        console.log(`🔢 Bump: ${bump}`);
        console.log(`👑 Authority: ${this.payer.publicKey.toBase58()}`);
        console.log(`💰 Fee Rate: 2.5% (250 basis points)`);
        console.log('');
        console.log('💡 Note: Run this with deployed program to actually initialize');
    }

    async simulateCreateListing(price: number): Promise<void> {
        console.log(`📝 Simulating listing creation for ${price} SOL...`);
        
        const [listingPda, bump] = await this.findListingPDA(this.payer.publicKey);
        
        console.log('✅ Listing would be created at:');
        console.log(`📍 PDA: ${listingPda.toBase58()}`);
        console.log(`🔢 Bump: ${bump}`);
        console.log(`👤 Seller: ${this.payer.publicKey.toBase58()}`);
        console.log(`💰 Price: ${price} SOL (${price * LAMPORTS_PER_SOL} lamports)`);
        console.log('');
        console.log('💡 Note: Run this with deployed program to actually create listing');
    }

    async getAccountInfo(address: string): Promise<void> {
        try {
            const pubkey = new PublicKey(address);
            const accountInfo = await this.connection.getAccountInfo(pubkey);
            
            if (accountInfo) {
                console.log(`📊 Account Info for ${address}:`);
                console.log(`💰 Balance: ${accountInfo.lamports / LAMPORTS_PER_SOL} SOL`);
                console.log(`👑 Owner: ${accountInfo.owner.toBase58()}`);
                console.log(`📏 Data Length: ${accountInfo.data.length} bytes`);
                console.log(`✅ Executable: ${accountInfo.executable ? 'Yes' : 'No'}`);
            } else {
                console.log(`❌ Account ${address} not found`);
            }
        } catch (error) {
            console.error('❌ Failed to get account info:', error);
        }
    }

    async getMarketplaceStats(): Promise<void> {
        console.log('📊 Getting marketplace statistics...');
        
        const [marketplacePda] = await this.findMarketplacePDA();
        
        try {
            const accountInfo = await this.connection.getAccountInfo(marketplacePda);
            
            if (accountInfo && accountInfo.owner.equals(PROGRAM_ID)) {
                console.log('✅ Marketplace account found!');
                console.log(`📍 Address: ${marketplacePda.toBase58()}`);
                console.log(`💰 Balance: ${accountInfo.lamports / LAMPORTS_PER_SOL} SOL`);
                console.log(`📏 Data Size: ${accountInfo.data.length} bytes`);
                
                // If we had the IDL, we could decode the data here
                console.log('💡 Note: Account data decoding requires deployed program with IDL');
            } else {
                console.log('❌ Marketplace not initialized yet');
                console.log(`📍 Expected Address: ${marketplacePda.toBase58()}`);
                console.log('💡 Run "init" command first to initialize the marketplace');
            }
        } catch (error) {
            console.error('❌ Failed to get marketplace stats:', error);
        }
    }
}

// CLI Setup
const program = new Command();
program
    .name('simple-marketplace')
    .description('Simple Terminal Marketplace CLI')
    .version('1.0.0');

// Global options
program
    .option('-r, --rpc <url>', 'RPC URL', 'http://localhost:8899')
    .option('-k, --keypair <path>', 'Keypair file path', './new-deploy-authority.json');

// Check cluster status
program
    .command('status')
    .description('Check cluster and wallet status')
    .action(async () => {
        const marketplace = new SimpleMarketplace(program.opts().rpc, program.opts().keypair);
        await marketplace.checkCluster();
    });

// Simulate initialization
program
    .command('init')
    .description('Simulate marketplace initialization')
    .action(async () => {
        const marketplace = new SimpleMarketplace(program.opts().rpc, program.opts().keypair);
        await marketplace.simulateInitialize();
    });

// Simulate listing
program
    .command('list')
    .description('Simulate creating a listing')
    .argument('<price>', 'Price in SOL')
    .action(async (price) => {
        const marketplace = new SimpleMarketplace(program.opts().rpc, program.opts().keypair);
        await marketplace.simulateCreateListing(parseFloat(price));
    });

// Get account info
program
    .command('account')
    .description('Get account information')
    .argument('<address>', 'Account public key')
    .action(async (address) => {
        const marketplace = new SimpleMarketplace(program.opts().rpc, program.opts().keypair);
        await marketplace.getAccountInfo(address);
    });

// Get marketplace stats
program
    .command('stats')
    .description('Get marketplace statistics')
    .action(async () => {
        const marketplace = new SimpleMarketplace(program.opts().rpc, program.opts().keypair);
        await marketplace.getMarketplaceStats();
    });

// Program info
program
    .command('info')
    .description('Show program information')
    .action(() => {
        console.log('📋 Terminal Marketplace Information:');
        console.log(`🔗 Program ID: ${PROGRAM_ID.toBase58()}`);
        console.log(`🌐 RPC URL: ${program.opts().rpc}`);
        console.log(`🔑 Keypair: ${program.opts().keypair}`);
        console.log('');
        console.log('Available Commands:');
        console.log('  status    - Check cluster and wallet status');
        console.log('  init      - Simulate marketplace initialization');
        console.log('  list      - Simulate creating a listing');
        console.log('  account   - Get account information');
        console.log('  stats     - Get marketplace statistics');
        console.log('  info      - Show this information');
    });

program.parse();