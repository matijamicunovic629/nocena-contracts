# Smart Contracts Guide 📜

This repository contains the core functionality for **Nocena Token**, **Vesting**, **MoodNftMarkertplace**. 

The smart contracts handle vesting schedules for token allocations, token distribution, and deployment on lens testnet.

## Quick Start 🚀

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your environment:
   - Copy `.env.example` to `.env`
   - Add your private key and RPC URLs

3. Compile contracts:
   ```bash
   npx hardhat compile
   ```

## Key Contracts 📋
- `NocenaToken.sol`: Main token for development [(View deployed contract on Lens Testnet)](https://explorer.testnet.lens.xyz/address/0xff37F413099547A2B237EE04a12cacec6583b4dB) 
- `vesting.sol`: Manages token vesting schedules and distribution [(View deployed contract on Lens Testnet)](https://explorer.testnet.lens.xyz/address/0x63C95E6B23E20De964378bd2B41F96480758b338)
- `MoodNftMarketplace.sol`: Manages Mood Nft Marketplace [(View deployed contract on Lens Testnet)](https://explorer.testnet.lens.xyz/address/0x183731e6308794876086a2e7bd9F1C2DEfa204Dd)

## Features ✨

- Set vesting schedules for different allocation rounds.
- Supports multiple allocation types (Seed, Private, Public, Team, Advisors, etc.).
- Time-based vesting with cliffs for lock periods.
- Token Generation Event (TGE) percent release.
- Easy deployment and scheduling through Hardhat scripts.
- Unique Nft Marketplace by Moods 

## Deployment 🌐

1. Deploy to testnet:
   ```bash
   npx hardhat run scripts/deploy.ts --network lensTestnet
   ```

2. Set Vesting Schedules (after deployment):
   ```bash
   npx hardhat run scripts/set-schedules.ts --network lensTestnet
   ```

## Testing 🧪

Run the test suite:
```bash
npx hardhat test
```

## Security 🔒
- Built using OpenZeppelin contracts for security and reliability.
- Protects against reentrancy attacks.
- Owner-only functions for critical contract changes.
