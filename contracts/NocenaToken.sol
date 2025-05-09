// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NocenaToken is ERC20, Ownable {
    constructor(uint256 totalSupply) ERC20("NocenaToken", "NOCX") Ownable(msg.sender) {
        _mint(msg.sender, totalSupply); // mint full supply to owner (vesting contract)
    }
}