import { Wallet, Provider } from "zksync-ethers";
import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy/dist/deployer";
import { ethers } from "ethers";
import * as fs from "fs";

async function deployContracts() {
  console.log("⚙️  Starting contract deployment...");

  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const RPC_URL = process.env.RPC_URL || "https://rpc.testnet.lens.dev";

  if (!PRIVATE_KEY) throw new Error("Missing PRIVATE_KEY env variable");

  // Setup provider and wallet
  const zkProvider = new Provider(RPC_URL);
  const deployerWallet = new Wallet(PRIVATE_KEY).connect(zkProvider);

  const deployerAddress = await deployerWallet.getAddress();
  const accountBalance = await zkProvider.getBalance(deployerAddress);

  console.log(`🔑 Using account: ${deployerAddress}`);
  console.log(`💰 Balance: ${ethers.formatEther(accountBalance)} ETH`);

  // Instantiate deployer helper
  const deployer = new Deployer(hre, deployerWallet);

  // Deploy Token contract
  const tokenArtifact = await deployer.loadArtifact("NocenaToken");
  console.log("🚀 Deploying NocenaToken...");
  const totalSupply = ethers.parseUnits("1000000000", 18).toString(); // 1 billion tokens
  const tokenInstance = await deployer.deploy(tokenArtifact, [totalSupply]);
  const tokenAddress = await tokenInstance.getAddress();
  console.log(`✅ NocenaToken deployed at: ${tokenAddress}`);

  // Deploy Vesting contract
  const vestingArtifact = await deployer.loadArtifact("Vesting");
  console.log("🚀 Deploying Vesting...");
  const vestingInstance = await deployer.deploy(vestingArtifact, [tokenAddress]);
  const vestingAddress = await vestingInstance.getAddress();
  console.log(`✅ Vesting deployed at: ${vestingAddress}`);

  // Deploy MoodNftMarketplace contract
  const MoodNftMarketplaceArtifact = await deployer.loadArtifact("MoodNftMarketplace");
  console.log("🚀 Deploying MoodNftMarketplace...");
  const MoodNftMarketplaceInstance = await deployer.deploy(MoodNftMarketplaceArtifact, ['0xff37F413099547A2B237EE04a12cacec6583b4dB']);
  const MoodNftMarketplaceAddress = await MoodNftMarketplaceInstance.getAddress();
  console.log(`✅ MoodNftMarketplace deployed at: ${MoodNftMarketplaceAddress}`);

  // Save addresses
  const networkName = hre.network.name;
  const chainId = (hre.network.config as any).chainId;
  const outputPath = `deployments/${networkName}.json`;

  const deploymentData = {
    network: networkName,
    chainId,
    contracts: {
      NocenaToken: tokenAddress,
      Vesting: vestingAddress,
      MoodNftMarketplace: MoodNftMarketplaceAddress,
    },
    deployedAt: new Date().toISOString()
  };

  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));

  console.log(`📁 Deployment details saved to ${outputPath}`);
}

deployContracts()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Deployment failed:", err);
      process.exit(1);
    });
