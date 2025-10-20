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
    uint256 public constant LIQUIDATION_BONUS = 10; // 10% bonus for liquidator
    uint256 public constant ASSET_DECIMAL = 1e18;
    uint256 public constant USD_DECIMAL = 1e6;             

    mapping(address => uint256) public userCollateral;
    mapping(address => uint256) public userDebt;

    event CollateralDeposited(address indexed user, uint256 amount);
    event EquiAssetMinted(address indexed user, uint256 amount);
    event EquiAssetBurned(address indexed user, uint256 amount);
    event Liquidated(address indexed user, address indexed liquidator, uint256 debtRepaid, uint256 collateralSeized);

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
        emit CollateralDeposited(msg.sender, normalizedAmount);
    }

    // --------------------------
    // 2. Mint EquiAsset (eTCS)
    // --------------------------
    function mintEquiAsset(uint256 amountToMint) external {
        require(amountToMint > 0, "Invalid mint amount");

        uint256 assetPrice = oracle.getPrice(); // In USD, e.g., 100 * 1e18
        uint256 totalDebtAfter = userDebt[msg.sender] + amountToMint;
        uint256 requiredCollateral = (totalDebtAfter * assetPrice * COLLATERAL_RATIO) / (100 * ASSET_DECIMAL);

        require(
            userCollateral[msg.sender] >= requiredCollateral,
            "Not enough collateral"
        );

        userDebt[msg.sender] += amountToMint; // Store in EquiAsset terms
        equiAsset.mint(msg.sender, amountToMint);
        emit EquiAssetMinted(msg.sender, amountToMint);
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
        emit EquiAssetBurned(msg.sender, amountToBurn);
    }

    // --------------------------
    // 4. Get Collateral Ratio (FIXED)
    // --------------------------
    function getCollateralRatio(address user) public view returns (uint256) {
        if (userDebt[user] == 0) return type(uint256).max; // Infinite ratio if no debt

        uint256 assetPrice = oracle.getPrice();
        uint256 debtValue = (userDebt[user] * assetPrice) / ASSET_DECIMAL;

        // Return ratio scaled to 1e18 (e.g., 5e18 = 500%, 1.5e18 = 150%)
        return (userCollateral[user] * 1e18) / debtValue;
    }

    // --------------------------
    // 5. Mock Liquidation Check (VERIFIED)
    // --------------------------
    function isLiquidatable(address user) public view returns (bool) {
        if (userDebt[user] == 0) return false;
        uint256 ratio = getCollateralRatio(user);
        return ratio < (LIQUIDATION_THRESHOLD * 1e16); // 150% = 1.5 * 1e18
    }

    // --------------------------
    // 6. LIQUIDATION FUNCTION
    // --------------------------
    /**
     * @notice Liquidate an undercollateralized position
     * @param user The address of the user to liquidate
     * @param amountToBurn The amount of eTCS to burn (debt to repay)
     * 
     * How it works:
     * 1. Liquidator must own eTCS tokens (bought from market or minted)
     * 2. Liquidator burns eTCS to pay off user's debt
     * 3. Liquidator receives user's collateral + 10% bonus
     * 4. User's position is partially or fully liquidated
     */
    function liquidate(address user, uint256 amountToBurn) external {
        require(user != address(0), "Invalid user address");
        require(amountToBurn > 0, "Invalid amount");
        require(isLiquidatable(user), "Position is not liquidatable");
        require(userDebt[user] >= amountToBurn, "Amount exceeds user debt");

        uint256 assetPrice = oracle.getPrice();
        
        // Calculate the USD value of debt being repaid
        uint256 debtValueRepaid = (amountToBurn * assetPrice) / ASSET_DECIMAL;
        
        // Calculate collateral to seize (debt value + liquidation bonus)
        // Liquidator gets 110% of the debt value they're repaying
        uint256 collateralToSeize = (debtValueRepaid * (100 + LIQUIDATION_BONUS)) / 100;
        
        // Ensure we don't seize more collateral than the user has
        if (collateralToSeize > userCollateral[user]) {
            collateralToSeize = userCollateral[user];
            // In this case, adjust amountToBurn to match available collateral
            // This prevents over-liquidation
            uint256 maxDebtValue = (collateralToSeize * 100) / (100 + LIQUIDATION_BONUS);
            amountToBurn = (maxDebtValue * ASSET_DECIMAL) / assetPrice;
            
            // Ensure we don't burn more than user's debt
            if (amountToBurn > userDebt[user]) {
                amountToBurn = userDebt[user];
            }
        }
        
        // Burn eTCS tokens from the liquidator
        equiAsset.burn(msg.sender, amountToBurn);
        
        // Update user's position
        userDebt[user] -= amountToBurn;
        userCollateral[user] -= collateralToSeize;
        
        // Transfer collateral to liquidator (denormalize from 18 to 6 decimals)
        uint256 denormalizedCollateral = collateralToSeize / 1e12;
        pyUSD.transfer(msg.sender, denormalizedCollateral);
        
        emit Liquidated(user, msg.sender, amountToBurn, collateralToSeize);
    }

    // --------------------------
    // 7. View Functions
    // --------------------------
    
    /**
     * @notice Get user's position details
     */
    function getUserPosition(address user) external view returns (
        uint256 collateral,
        uint256 debt,
        uint256 collateralRatio,
        bool liquidatable
    ) {
        collateral = userCollateral[user];
        debt = userDebt[user];
        collateralRatio = getCollateralRatio(user);
        liquidatable = isLiquidatable(user);
    }

    /**
     * @notice Calculate liquidation bonus for a given amount
     */
    function calculateLiquidationBonus(address user, uint256 amountToBurn) 
        external 
        view 
        returns (uint256 collateralToSeize, uint256 bonusAmount) 
    {
        require(amountToBurn <= userDebt[user], "Amount exceeds debt");
        
        uint256 assetPrice = oracle.getPrice();
        uint256 debtValueRepaid = (amountToBurn * assetPrice) / ASSET_DECIMAL;
        
        collateralToSeize = (debtValueRepaid * (100 + LIQUIDATION_BONUS)) / 100;
        bonusAmount = (debtValueRepaid * LIQUIDATION_BONUS) / 100;
        
        // Cap at available collateral
        if (collateralToSeize > userCollateral[user]) {
            collateralToSeize = userCollateral[user];
            bonusAmount = collateralToSeize - debtValueRepaid;
        }
    }
}