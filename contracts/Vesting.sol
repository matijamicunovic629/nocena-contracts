// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Vesting is Ownable {
    struct Schedule {
        uint256 totalAllocation;
        uint256 tgeRelease;
        uint256 start;
        uint256 cliff;
        uint256 duration;
        uint256 claimed;
    }

    IERC20 public token;
    mapping(address => Schedule) public schedules;

    constructor(IERC20 _token) Ownable(msg.sender) {
        token = _token;
    }

    function setSchedule(
        address beneficiary,
        uint256 totalAllocation,
        uint256 tgePercent, // e.g. 10 means 10%
        uint256 cliffMonths,
        uint256 vestingMonths
    ) external onlyOwner {
        require(schedules[beneficiary].totalAllocation == 0, "Already set");
        uint256 tgeAmount = (totalAllocation * tgePercent) / 100;
        schedules[beneficiary] = Schedule({
            totalAllocation: totalAllocation,
            tgeRelease: tgeAmount,
            start: block.timestamp,
            cliff: block.timestamp + cliffMonths * 30 days,
            duration: vestingMonths * 30 days,
            claimed: 0
        });

        // Send TGE tokens immediately
        if (tgeAmount > 0) {
            token.transfer(beneficiary, tgeAmount);
            schedules[beneficiary].claimed = tgeAmount;
        }
    }

    function claim() external {
        Schedule storage s = schedules[msg.sender];
        require(s.totalAllocation > 0, "No schedule");

        uint256 elapsed = block.timestamp > s.cliff ? block.timestamp - s.cliff : 0;
        uint256 vested = s.tgeRelease;

        if (elapsed > 0) {
            uint256 linear = s.totalAllocation - s.tgeRelease;
            uint256 unlocked = linear * elapsed / s.duration;
            vested += unlocked;
        }

        uint256 claimable = vested > s.claimed ? vested - s.claimed : 0;
        require(claimable > 0, "Nothing to claim");

        s.claimed += claimable;
        token.transfer(msg.sender, claimable);
    }

    function getClaimable(address beneficiary) public view returns (uint256) {
        Schedule storage s = schedules[beneficiary];
        if (s.totalAllocation == 0) return 0;

        uint256 elapsed = block.timestamp > s.cliff ? block.timestamp - s.cliff : 0;
        uint256 vested = s.tgeRelease;

        if (elapsed > 0) {
            uint256 linear = s.totalAllocation - s.tgeRelease;
            uint256 unlocked = linear * elapsed / s.duration;
            vested += unlocked;
        }

        return vested > s.claimed ? vested - s.claimed : 0;
    }

    function getSchedule(address beneficiary) external view returns (
        uint256 totalAllocation,
        uint256 tgeRelease,
        uint256 start,
        uint256 cliff,
        uint256 duration,
        uint256 claimed
    ) {
        Schedule storage s = schedules[beneficiary];
        return (
            s.totalAllocation,
            s.tgeRelease,
            s.start,
            s.cliff,
            s.duration,
            s.claimed
        );
    }

    function getVestedAmount(address beneficiary) public view returns (uint256) {
        Schedule storage s = schedules[beneficiary];
        if (s.totalAllocation == 0) return 0;

        uint256 elapsed = block.timestamp > s.cliff ? block.timestamp - s.cliff : 0;
        uint256 vested = s.tgeRelease;

        if (elapsed > 0) {
            uint256 linear = s.totalAllocation - s.tgeRelease;
            uint256 unlocked = linear * elapsed / s.duration;
            vested += unlocked;
        }

        return vested > s.totalAllocation ? s.totalAllocation : vested;
    }

    function getClaimed(address beneficiary) external view returns (uint256) {
        return schedules[beneficiary].claimed;
    }
}
