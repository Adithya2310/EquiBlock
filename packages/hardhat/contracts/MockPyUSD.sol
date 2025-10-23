// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockPyUSD - 6-decimal mock stablecoin for testing
contract MockPyUSD is ERC20 {
    uint8 private immutable _decimals;

    constructor() ERC20("Mock PayPal USD", "pyUSD") {
        _decimals = 6; // 6 decimals like real stablecoins
        _mint(msg.sender, 1_000_000 * 10 ** _decimals); // Mint initial supply to deployer
    }

    /// @notice Override decimals to 6
    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /// @notice Mint more tokens (just for testing)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

