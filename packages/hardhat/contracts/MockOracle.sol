// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockOracle {
    uint256 private price = 100 * 1e18; // Fixed price: $100

    function getPrice() external view returns (uint256) {
        return price;
    }

    function setPrice(uint256 _newPrice) external {
        price = _newPrice;
    }
}