import {ethers} from "hardhat";
import {Vesting} from "../typechain-types";
import {Provider, Wallet, Contract} from "zksync-ethers";
import {Deployer} from "@matterlabs/hardhat-zksync-deploy/dist/deployer";
import * as hre from "hardhat";


async function main() {
  console.log("Starting token minting...");

  // Initialize the wallet.
  const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
  if (!PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is not set");
  }

  // Create provider
  const provider = new Provider("https://rpc.testnet.lens.dev");

  // Initialize wallet
  const wallet = new Wallet(PRIVATE_KEY).connect(provider);
  const deployer = new Deployer(hre, wallet);


  // Load the NocenaToken contract
  const tokenArtifact = await deployer.loadArtifact("NocenaToken");
  const token = new Contract(
      "0xff37F413099547A2B237EE04a12cacec6583b4dB",
      tokenArtifact.abi,
      wallet
  );

  // send all balance to vesting contract
  const balance = await token.balanceOf(wallet.address);
  const decimals = await token.decimals();

  console.log(`Your token balance: ${ethers.formatUnits(balance, decimals)} tokens`);

  if (balance > 0n) {
    const tx = await token.transfer("0x63C95E6B23E20De964378bd2B41F96480758b338", balance);
    console.log("Sending tokens...");
    await tx.wait();
    console.log(`✅ Tokens sent to vesting contract at 0x63C95E6B23E20De964378bd2B41F96480758b338`);
  } else {
    console.log("❌ You have 0 tokens to transfer.");
  }
  // --------------------------------


  const vestingArtifact = await deployer.loadArtifact("Vesting");
  const vesting = new Contract(
      "0x63C95E6B23E20De964378bd2B41F96480758b338",
      vestingArtifact.abi,
      wallet
  );

  const allocations = [
    {
      name: "Seed",
      beneficiary: "0x2c7711f2282cA337f0efcB1B0D5E9A1eB56c3084",
      totalAllocation: "40000000",
      tgePercent: 10,
      cliff: 0,
      vesting: 18,
    },
    {
      name: "Private",
      beneficiary: "0x9C11ad6E50640EBC62B683523D4F426326918D4F",
      totalAllocation: "60000000",
      tgePercent: 10,
      cliff: 0,
      vesting: 15,
    },
    {
      name: "KOL Round",
      beneficiary: "0x639CC8f997FDDFc96B2fDf2b3aC68f1995d3F066",
      totalAllocation: "10000000",
      tgePercent: 15,
      cliff: 0,
      vesting: 12,
    },
    {
      name: "Public",
      beneficiary: "0x2200B10bC153b9597E9a75c0D2baFA57457925a9",
      totalAllocation: "10000000",
      tgePercent: 15,
      cliff: 0,
      vesting: 4,
    },
    {
      name: "Team",
      beneficiary: "0xD13f20B822c250ef191B9464F8187d17CFBA3a73",
      totalAllocation: "100000000",
      tgePercent: 0,
      cliff: 6,
      vesting: 30,
    },
    {
      name: "Advisors",
      beneficiary: "0xF599B8Ad478000aF156FF540334aD115cDb159a2",
      totalAllocation: "50000000",
      tgePercent: 0,
      cliff: 6,
      vesting: 30,
    },
    {
      name: "Reserve",
      beneficiary: "0x0A84D83E4465A7C0002De424ab1CDF938479D29b",
      totalAllocation: "120000000",
      tgePercent: 0,
      cliff: 12,
      vesting: 36,
    },
    {
      name: "Ecosystem Rewards",
      beneficiary: "0x152b39203553084eCD25805C1962d8Efd530D425",
      totalAllocation: "220000000",
      tgePercent: 0,
      cliff: 1,
      vesting: 36,
    },
    {
      name: "Marketing",
      beneficiary: "0xf2959699A2042D17edFe0B08Ad00090f6bbc6b47",
      totalAllocation: "220000000",
      tgePercent: 0,
      cliff: 1,
      vesting: 36,
    },
    {
      name: "Liquidity",
      beneficiary: "0xa25395160FB607F4E3220f83f84045fA5dc4851B",
      totalAllocation: "170000000",
      tgePercent: 10,
      cliff: 1,
      vesting: 24,
    },
  ];

  for (const allocation of allocations) {
    const total = ethers.parseUnits(allocation.totalAllocation, 18).toString();
    console.log(`⏳ Setting schedule for ${allocation.name}...`);
    const tx = await vesting.setSchedule(
        allocation.beneficiary,
        total,
        allocation.tgePercent,
        allocation.cliff,
        allocation.vesting
    );
    await tx.wait();
    console.log(`✅ Schedule set for ${allocation.name}`);
  }
}

main().catch((error) => {
  console.error("❌ Error during setSchedule:", error);
  process.exitCode = 1;
});
