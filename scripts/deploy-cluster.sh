#!/bin/bash

echo "🚀 Setting up Terminal Marketplace Cluster..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if solana-test-validator is available
if ! command -v solana-test-validator &> /dev/null; then
    print_error "solana-test-validator not found. Please install Solana CLI tools."
    exit 1
fi

# Kill any existing validator
print_status "Stopping any existing validator..."
pkill -f solana-test-validator

# Wait for the process to be killed
sleep 2

# Start local validator with custom settings
print_status "Starting local Solana validator..."
solana-test-validator \
    --ledger /tmp/terminal-marketplace-ledger \
    --reset \
    --quiet \
    --rpc-port 8899 \
    --bind-address 0.0.0.0 \
    --faucet-port 9900 \
    --faucet-sol 1000000 &

# Wait for validator to start
print_status "Waiting for validator to start..."
sleep 5

# Check if validator is running
if ! curl -s http://localhost:8899/health > /dev/null; then
    print_error "Failed to start validator"
    exit 1
fi

print_status "Validator started successfully!"

# Configure Solana CLI to use local cluster
print_status "Configuring Solana CLI for local cluster..."
solana config set --url localhost

# Fund the deploy authority
print_status "Funding deploy authority..."
solana airdrop 100 ./deploy-authority.json

# Fund the cluster authority
print_status "Funding cluster authority..."
solana airdrop 100 ./cluster-authority.json

print_status "Local cluster setup complete!"
echo ""
echo "🌐 RPC URL: http://localhost:8899"
echo "💰 Faucet: http://localhost:9900"
echo "🔑 Deploy Authority: $(solana address --keypair ./deploy-authority.json)"
echo "🔑 Cluster Authority: $(solana address --keypair ./cluster-authority.json)"
echo ""
echo "Next steps:"
echo "1. Run: yarn build"
echo "2. Run: yarn deploy"
echo "3. Run: yarn terminal init"
echo ""
print_status "Cluster is ready for deployment!"