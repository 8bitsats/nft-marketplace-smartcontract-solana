# Terminal Marketplace - Solana NFT Marketplace for Terminals

## 🚀 Overview

A completely rewritten Solana NFT marketplace designed specifically for terminal-based operations. This marketplace provides a command-line interface for trading NFTs on Solana with custom cluster deployment capabilities.

## 🏗️ Architecture

### Core Components

1. **Terminal Marketplace Program** - The on-chain Solana program
2. **Terminal CLI** - Command-line interface for marketplace operations
3. **Custom Cluster** - Deployed local Solana validator
4. **Authority Management** - Keypair-based authority system

### Program Features

- **Initialize Marketplace** - Set up marketplace with custom fee rates
- **Create Listings** - List NFTs for sale with escrow protection
- **Buy NFTs** - Purchase listed NFTs with automatic fee distribution
- **Cancel Listings** - Cancel active listings and return NFTs
- **Update Prices** - Modify listing prices
- **Terminal Interface** - Complete command-line operations

## 🔧 Technical Stack

- **Solana Program**: Anchor Framework v0.24.2
- **CLI Interface**: TypeScript with Commander.js
- **Token Standard**: SPL Token Program
- **Cluster**: Local Solana Test Validator

## 🚀 Setup & Deployment

### 1. Prerequisites

```bash
# Install Solana CLI tools
sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"

# Install Node.js and Yarn
npm install -g yarn

# Install Anchor CLI
npm install -g @project-serum/anchor-cli@0.24.2
```

### 2. Authority Setup

```bash
# Deploy authority keypair (already created)
Deploy Authority: 2XMzvXXPBRRK5CJNFLVF8Dg2Uj6QfGJiHUhxJWCBLL59

# Cluster authority keypair (already created)
Cluster Authority: AMn6LB4X2C7QSug74vKR4y2bApBUEUTgqyy1igJhNLSt

# Program keypair (already created)
Program ID: brCRRQ6jBAScsJdwWRx5azEAuYqWxjJGKnaHr3q3gyj
```

### 3. Cluster Deployment

```bash
# Start local cluster
./scripts/deploy-cluster.sh

# Cluster Details:
# RPC URL: http://localhost:8899
# Faucet: http://localhost:9900
# Funded with 100+ SOL each authority
```

### 4. Program Deployment

```bash
# Build the program
yarn build

# Deploy to local cluster
anchor deploy --provider.cluster localhost

# Initialize marketplace
yarn terminal init --fee-rate 250 --treasury <treasury_pubkey>
```

## 🖥️ Terminal CLI Usage

### Basic Commands

```bash
# Initialize marketplace
yarn terminal init [--fee-rate <rate>] [--treasury <pubkey>]

# Create a listing
yarn terminal list <mint_address> <price_in_sol>

# Buy an NFT
yarn terminal buy <mint_address>

# Cancel listing
yarn terminal cancel <mint_address>

# Update price
yarn terminal update <mint_address> <new_price_in_sol>

# Show listing details
yarn terminal show <mint_address>

# Show marketplace stats
yarn terminal stats
```

### Advanced Usage

```bash
# Use custom RPC endpoint
yarn terminal --rpc <rpc_url> --keypair <keypair_path> <command>

# Example with custom settings
yarn terminal --rpc http://localhost:8899 --keypair ./my-wallet.json list ABC123... 1.5
```

## 🏪 Marketplace Operations

### 1. Marketplace Initialization

```bash
yarn terminal init
```

Sets up the marketplace with:
- Default fee rate: 2.5% (250 basis points)
- Treasury wallet for fee collection
- Global marketplace state

### 2. NFT Listing

```bash
yarn terminal list <NFT_MINT> <PRICE_SOL>
```

Process:
- Transfers NFT to escrow account
- Creates listing PDA
- Sets price and activation status

### 3. NFT Purchase

```bash
yarn terminal buy <NFT_MINT>
```

Process:
- Calculates marketplace fee
- Transfers SOL to seller (minus fees)
- Transfers fee to treasury
- Transfers NFT to buyer
- Updates marketplace statistics

### 4. Listing Management

```bash
# Cancel listing
yarn terminal cancel <NFT_MINT>

# Update price
yarn terminal update <NFT_MINT> <NEW_PRICE>
```

## 🏛️ Program Architecture

### Account Structure

1. **Marketplace Account**
   - Authority: Program deployer
   - Fee Rate: Configurable (default 2.5%)
   - Total Trades: Transaction counter
   - Bump: PDA bump seed

2. **Listing Account**
   - Seller: NFT owner
   - Price: Listed price in lamports
   - Active: Listing status
   - Bump: PDA bump seed

3. **Order Account** (planned)
   - Buyer: Purchaser address
   - Seller: Original owner
   - Amount: Transaction value
   - Timestamp: Execution time

### Security Features

- **PDA-based Escrow**: NFTs held in program-derived addresses
- **Authority Validation**: Only authorized operations allowed
- **Price Constraints**: Min/max price validation
- **Ownership Verification**: NFT ownership validation before listing

## 💰 Fee Structure

- **Marketplace Fee**: 2.5% (configurable)
- **Treasury Distribution**: 100% to designated treasury
- **Gas Optimization**: Minimal instruction complexity

## 🔒 Security Considerations

### Implemented Protections

1. **Escrow Security**: NFTs locked in PDAs until sale completion
2. **Authority Checks**: Only owners can manage their listings
3. **Price Validation**: Reasonable price bounds enforced
4. **State Validation**: Listing status verification

### Recommendations

1. **Audit**: Professional security audit recommended
2. **Testing**: Comprehensive testing on devnet
3. **Monitoring**: Transaction monitoring and alerting
4. **Upgrades**: Controlled upgrade mechanism

## 🛠️ Development

### Project Structure

```
├── programs/Mugs_Marketplace/src/
│   ├── lib.rs                 # Main program logic
│   ├── state.rs              # Account structures
│   ├── errors.rs             # Error definitions
│   ├── constants.rs          # Program constants
│   └── instructions/         # Instruction handlers
├── terminal/
│   └── terminal-cli.ts       # CLI interface
├── scripts/
│   └── deploy-cluster.sh     # Cluster deployment
└── README.md
```

### Building from Source

```bash
# Clone repository
git clone <repository_url>
cd nft-marketplace-smartcontract-solana

# Install dependencies
yarn install

# Build program
cargo build-sbf

# Run tests
anchor test --skip-local-validator
```

## 🚀 Deployment Checklist

- [x] ✅ Authority keypairs generated
- [x] ✅ Local cluster deployed and funded
- [x] ✅ Program architecture designed
- [x] ✅ Core marketplace logic implemented
- [x] ✅ Terminal CLI interface created
- [x] ✅ Cluster deployment scripts
- [ ] ⏳ Program compilation and deployment
- [ ] ⏳ End-to-end testing
- [ ] ⏳ Production deployment

## 🎯 Next Steps

1. **Fix Compilation Issues**: Resolve dependency conflicts
2. **Complete Deployment**: Deploy program to local cluster
3. **Testing Suite**: Comprehensive testing of all features
4. **Production Readiness**: Security audit and optimization
5. **Documentation**: API documentation and tutorials

## 🆘 Troubleshooting

### Common Issues

1. **Compilation Errors**: Check Rust/Anchor versions
2. **RPC Connection**: Verify cluster is running
3. **Keypair Issues**: Ensure proper file permissions
4. **Transaction Failures**: Check account balances

### Support

- Check cluster status: `solana cluster-version`
- Verify balance: `solana balance`
- View logs: Check validator logs in `/tmp/terminal-marketplace-ledger/`

## 📞 Contact

For technical support or questions about the Terminal Marketplace implementation, please refer to the Solana documentation and Anchor framework guides.

---

**Terminal Marketplace** - Bringing NFT trading to the command line! 🚀