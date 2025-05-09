import { expect } from "chai";
import { ethers } from "hardhat";
import { NocenaToken, Vesting } from "../typechain-types";
import { BigNumberish } from "ethers";

const parse = (amount: string | number): BigNumberish => ethers.parseUnits(amount.toString(), 18);

describe("NocenaToken and Vesting", function () {
    let token: NocenaToken;
    let vesting: Vesting;
    let owner: any;
    let alice: any;
    const TOTAL_SUPPLY = parse("1000000000");

    beforeEach(async () => {
        [owner, alice] = await ethers.getSigners();

        const TokenFactory = await ethers.getContractFactory("NocenaToken");
        token = await TokenFactory.deploy(TOTAL_SUPPLY);
        await token.waitForDeployment();

        const VestingFactory = await ethers.getContractFactory("Vesting");
        vesting = await VestingFactory.deploy(await token.getAddress());
        await vesting.waitForDeployment();

        // Transfer full supply to vesting contract
        await token.transfer(await vesting.getAddress(), TOTAL_SUPPLY);
    });

    it("should deploy token with correct supply", async () => {
        const supply = await token.totalSupply();
        expect(supply).to.equal(TOTAL_SUPPLY);
    });

    it("should set vesting schedule and transfer TGE tokens", async () => {
        const tgePercent = 10;
        const allocation = parse("1000");

        await vesting.setSchedule(
            alice.address,
            allocation,
            tgePercent,
            1, // 1 month cliff
            12 // 12 month vesting
        );

        const balance = await token.balanceOf(alice.address);
        const expectedTGE = parse("100"); // 10% of 1000
        expect(balance).to.equal(expectedTGE);
    });

    it("should release tokens over time", async () => {
        const tgePercent = 10;
        const allocation = parse("1000");

        await vesting.setSchedule(
            alice.address,
            allocation,
            tgePercent,
            1,
            12
        );

        // Move forward 7 months after cliff
        await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60 * 7]); // 7 months
        await ethers.provider.send("evm_mine", []);

        const claimable = await vesting.getClaimable(alice.address);
        expect(claimable).to.be.gt(0);

        const before = await token.balanceOf(alice.address);
        await vesting.connect(alice).claim();
        const after = await token.balanceOf(alice.address);

        expect(after).to.be.gt(before);
    });

    it("should not allow claiming before cliff", async () => {
        const allocation = parse("1000");

        await vesting.setSchedule(
            alice.address,
            allocation,
            10,
            3,
            12
        );

        // Move time to just before cliff
        await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60 * 2]); // 2 months
        await ethers.provider.send("evm_mine", []);

        await expect(vesting.connect(alice).claim()).to.be.revertedWith("Nothing to claim");
    });
});
