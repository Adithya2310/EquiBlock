const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EquiVault full integration test", function () {
    let deployer, user;
    let pyUSD, oracle, equiAsset, vault;

    beforeEach(async function () {
        [deployer, user] = await ethers.getSigners();

        // Deploy mock stablecoin (6 decimals)
        const MockPyUSD = await ethers.getContractFactory("MockPyUSD");
        const initialSupply = ethers.parseUnits("1000000", 6); // 1,000,000 pyUSD
        pyUSD = await MockPyUSD.deploy();
        await pyUSD.waitForDeployment?.();

        // Deploy oracle and set price = 100 * 1e18 (e.g. $100)
        const MockOracle = await ethers.getContractFactory("MockOracle");
        oracle = await MockOracle.deploy();
        await oracle.waitForDeployment?.();
        await oracle.setPrice(ethers.parseUnits("100", 18));

        // Deploy EquiAsset
        const EquiAsset = await ethers.getContractFactory("EquiAsset");
        equiAsset = await EquiAsset.deploy();
        await equiAsset.waitForDeployment?.();

        // Deploy Vault
        const EquiVault = await ethers.getContractFactory("EquiVault");
        vault = await EquiVault.deploy(
            pyUSD.target ?? pyUSD.address,
            oracle.target ?? oracle.address
        );
        await vault.waitForDeployment?.();

        // Connect vault <-> asset
        await vault.setEquiAsset(equiAsset.target ?? equiAsset.address);
        await equiAsset.setVault(vault.target ?? vault.address);

        // Give user 100 pyUSD
        const userAmount = ethers.parseUnits("100", 6);
        await pyUSD.mint(user.address, userAmount);
    });

    it("User can deposit pyUSD and vault tracks normalized collateral", async function () {
        const amount = ethers.parseUnits("100", 6); // 100 pyUSD
        await pyUSD.connect(user).approve(vault, amount);
        await expect(vault.connect(user).depositCollateral(amount)).to.not.be.reverted;

        const stored = await vault.userCollateral(user.address);
        expect(stored).to.equal(ethers.parseUnits("100", 18)); // normalized to 18 decimals
    });

    it("User cannot mint more than collateral allows", async function () {
        const amount = ethers.parseUnits("100", 6);
        await pyUSD.connect(user).approve(vault, amount);
        await vault.connect(user).depositCollateral(amount);

        const tooMuch = ethers.parseUnits("1", 18); // 1 eTCS
        await expect(vault.connect(user).mintEquiAsset(tooMuch)).to.be.revertedWith(
            "Not enough collateral"
        );
    });

    it("User can mint within limits and burn successfully", async function () {
        const amount = ethers.parseUnits("100", 6);
        await pyUSD.connect(user).approve(vault, amount);
        await vault.connect(user).depositCollateral(amount);

        let ratioBefore = await vault.getCollateralRatio(user.address);
        console.log("Collateral ratio BEFORE minting:", ethers.formatUnits(ratioBefore, 18));

        const mintAmount = ethers.parseUnits("0.1", 18);
        await expect(vault.connect(user).mintEquiAsset(mintAmount)).to.not.be.reverted;

        let ratioAfter = await vault.getCollateralRatio(user.address);
        console.log("Collateral ratio AFTER minting:", ethers.formatUnits(ratioAfter, 18));

        const bal = await equiAsset.balanceOf(user.address);
        expect(bal).to.equal(mintAmount);

        // burn and repay
        await expect(vault.connect(user).burnEquiAsset(mintAmount)).to.not.be.reverted;
        expect(await equiAsset.balanceOf(user.address)).to.equal(0);
    });

    it("User becomes liquidatable after price rise", async function () {
        const amount = ethers.parseUnits("100", 6);
        await pyUSD.connect(user).approve(vault, amount);
        await vault.connect(user).depositCollateral(amount);
        const mintAmount = ethers.parseUnits("0.1", 18);
        await vault.connect(user).mintEquiAsset(mintAmount);
        const fmt = (bn, decimals = 18) => ethers.formatUnits(bn, decimals);
        const storedCollateral = await vault.userCollateral(user.address);
        const userDebt = await vault.userDebt(user.address);
        const oraclePrice = await oracle.getPrice();

        console.log("BEFORE PRICE RISE:", {
            storedCollateral: fmt(storedCollateral),
            userDebt: fmt(userDebt),
            oraclePrice: fmt(oraclePrice)
        });

        const liquidBefore = await vault.isLiquidatable(user.address);
        console.log("isLiquidatable BEFORE price rise:", liquidBefore);

        // increase oracle price
        await oracle.setPrice(ethers.parseUnits("1000", 18));
        const oracleAfter = await oracle.getPrice();
        console.log("oraclePrice AFTER rise:", fmt(oracleAfter));

        const liquidAfter = await vault.isLiquidatable(user.address);
        console.log("isLiquidatable AFTER price rise:", liquidAfter);

        expect(liquidBefore).to.equal(false);
        expect(liquidAfter).to.equal(true);
    });
});