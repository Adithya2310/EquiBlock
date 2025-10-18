// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./EquiAsset.sol";
import "./MockOracle.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EquiVault is Ownable {
    IERC20 public pyUSD;               // Collateral token
    EquiAsset public equiAsset;        // Synthetic asset (eTCS)
    MockOracle public oracle;          // Mock price oracle

    uint256 public constant COLLATERAL_RATIO = 500; // 500%
    uint256 public constant LIQUIDATION_THRESHOLD = 150; // 150%
    uint256 public constant ASSET_DECIMAL = 1e18;
    uint256 public constant USD_DECIMAL = 1e6;             

    mapping(address => uint256) public userCollateral;
    mapping(address => uint256) public userDebt;

    constructor(address _pyUSD, address _oracle) Ownable(msg.sender) {
        pyUSD = IERC20(_pyUSD);
        oracle = MockOracle(_oracle);
    }

    // Link EquiAsset contract after deployment
    function setEquiAsset(address _asset) external onlyOwner {
        equiAsset = EquiAsset(_asset);
    }

    // --------------------------
    // 1. Deposit Collateral
    // --------------------------
    function depositCollateral(uint256 amountPYUSD) external {
        require(amountPYUSD > 0, "Invalid amount");
        pyUSD.transferFrom(msg.sender, address(this), amountPYUSD);

        uint256 normalizedAmount = amountPYUSD * 1e12;

        userCollateral[msg.sender] += normalizedAmount;
    }

    // --------------------------
    // 2. Mint EquiAsset (eTCS)
    // --------------------------
    function mintEquiAsset(uint256 amountToMint) external {
        require(amountToMint > 0, "Invalid mint amount");

        uint256 assetPrice = oracle.getPrice(); // In USD, e.g., 100 * 1e18
        uint256 requiredCollateral = (amountToMint * assetPrice * COLLATERAL_RATIO) / (100 * ASSET_DECIMAL);

        require(
            userCollateral[msg.sender] >= requiredCollateral,
            "Not enough collateral"
        );

        userDebt[msg.sender] += amountToMint; // Store in EquiAsset terms
        equiAsset.mint(msg.sender, amountToMint);
    }

    // --------------------------
    // 3. Burn EquiAsset (Repay)
    // --------------------------
    function burnEquiAsset(uint256 amountToBurn) external {
        require(amountToBurn > 0, "Invalid burn amount");
        require(userDebt[msg.sender] >= amountToBurn, "Debt is lesser than the burn amount");

        uint256 assetPrice = oracle.getPrice();
        equiAsset.burn(msg.sender, amountToBurn);
        userDebt[msg.sender] -= amountToBurn;

        // Allow user to withdraw equivalent PYUSD
        uint256 repayValue = (amountToBurn * assetPrice) / ASSET_DECIMAL;
        uint256 collateralReleased = (repayValue * COLLATERAL_RATIO) / 100;
        userCollateral[msg.sender] -= collateralReleased;

        // denormalized the pyUSD collateral
        uint256 denormalizedCollateralReleased = collateralReleased/1e12;
        pyUSD.transfer(msg.sender, denormalizedCollateralReleased);
    }

    // --------------------------
    // 4. Get Collateral Ratio
    // --------------------------
    function getCollateralRatio(address user) public view returns (uint256) {
        if (userDebt[user] == 0) return type(uint256).max; // Infinite ratio if no debt

        uint256 assetPrice = oracle.getPrice();
        uint256 debtValue = (userDebt[user] * assetPrice) / ASSET_DECIMAL;

        return (userCollateral[user]) / debtValue;
    }

    // --------------------------
    // 5. Mock Liquidation Check
    // --------------------------
    function isLiquidatable(address user) external view returns (bool) {
        uint256 ratio = getCollateralRatio(user);
        return ratio < (LIQUIDATION_THRESHOLD * 1e16); // 150% = 1.5 * 1e18
    }
}