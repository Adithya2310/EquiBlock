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
<<<<<<< HEAD

=======
        await pyUSD.waitForDeployment();
>>>>>>> d6af68f (Contracts tested using hardhat3)

        // Deploy oracle and set price = 100 * 1e18 (e.g. $100)
        const MockOracle = await ethers.getContractFactory("MockOracle");
        oracle = await MockOracle.deploy();
<<<<<<< HEAD

=======
        await oracle.waitForDeployment();
>>>>>>> d6af68f (Contracts tested using hardhat3)
        await oracle.setPrice(ethers.parseUnits("100", 18));

        // Deploy EquiAsset
        const EquiAsset = await ethers.getContractFactory("EquiAsset");
        equiAsset = await EquiAsset.deploy();
<<<<<<< HEAD

=======
        await equiAsset.waitForDeployment();
>>>>>>> d6af68f (Contracts tested using hardhat3)

        // Deploy Vault
        const EquiVault = await ethers.getContractFactory("EquiVault");
        vault = await EquiVault.deploy(
            pyUSD.target ?? pyUSD.address,
            oracle.target ?? oracle.address
        );
<<<<<<< HEAD
=======
        await vault.waitForDeployment();

>>>>>>> d6af68f (Contracts tested using hardhat3)
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

        const ratioBefore = await vault.getCollateralRatio(user.address);
        expect(ratioBefore).to.be.gt(0);

        const mintAmount = ethers.parseUnits("0.1", 18);
        await expect(vault.connect(user).mintEquiAsset(mintAmount)).to.not.be.reverted;

        const ratioAfter = await vault.getCollateralRatio(user.address);
        expect(ratioAfter).to.be.lt(ratioBefore); // minting reduces collateral ratio

        const bal = await equiAsset.balanceOf(user.address);
        expect(bal).to.equal(mintAmount);

        // Burn and repay
        await expect(vault.connect(user).burnEquiAsset(mintAmount)).to.not.be.reverted;
        expect(await equiAsset.balanceOf(user.address)).to.equal(0);
    });

    it("User becomes liquidatable after price rise", async function () {
        const amount = ethers.parseUnits("100", 6);
        await pyUSD.connect(user).approve(vault, amount);
        await vault.connect(user).depositCollateral(amount);

        const mintAmount = ethers.parseUnits("0.1", 18);
        await vault.connect(user).mintEquiAsset(mintAmount);

        const liquidBefore = await vault.isLiquidatable(user.address);
        expect(liquidBefore).to.equal(false);

        // Increase oracle price dramatically
        await oracle.setPrice(ethers.parseUnits("1000", 18));

        const liquidAfter = await vault.isLiquidatable(user.address);
        expect(liquidAfter).to.equal(true);
    });
});