import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployEquiBlock: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  const { ethers } = hre;

  console.log("🚀 Deploying EquiBlock contracts with deployer:", deployer);

  // 1️⃣ Deploy MockOracle (for fixed price testing)
  const oracle = await deploy("MockOracle", {
    from: deployer,
    args: [],
    log: true,
  });
  console.log("✅ MockOracle deployed at:", oracle.address);

  // 2️⃣ Deploy EquiVault
  // Replace this with actual PYUSD address when on mainnet/testnet
  const PYUSD_ADDRESS = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9"; // Dummy placeholder for now

  const vault = await deploy("EquiVault", {
    from: deployer,
    args: [PYUSD_ADDRESS, oracle.address],
    log: true,
  });
  console.log("✅ EquiVault deployed at:", vault.address);

  // 3️⃣ Deploy EquiAsset
  const equiAsset = await deploy("EquiAsset", {
    from: deployer,
    args: [],
    log: true,
  });
  console.log("✅ EquiAsset deployed at:", equiAsset.address);

  // 4️⃣ Link EquiAsset with Vault
  const vaultContract = await ethers.getContractAt("EquiVault", vault.address);
  const tx = await vaultContract.setEquiAsset(equiAsset.address);
  await tx.wait();
  console.log("🔗 EquiAsset linked to Vault successfully");

  // 5️⃣ Link Vault in EquiAsset
  const equiAssetContract = await ethers.getContractAt("EquiAsset", equiAsset.address);
  const tx2 = await equiAssetContract.setVault(vault.address);
  await tx2.wait();
  console.log("🔗 Vault linked in EquiAsset successfully");

  console.log("🎯 Deployment complete!");
  console.log({
    MockOracle: oracle.address,
    EquiVault: vault.address,
    EquiAsset: equiAsset.address,
  });
};

export default deployEquiBlock;
deployEquiBlock.tags = ["EquiBlock"];
