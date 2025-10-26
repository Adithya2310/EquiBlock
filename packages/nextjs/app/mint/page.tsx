"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { formatEther, formatUnits, parseEther } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { FireIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const MintBurn: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [activeTab, setActiveTab] = useState<"mint" | "burn">("mint");
  const [mintAmount, setMintAmount] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Hermes / Pyth configuration
  const PYTH_PRICE_ID: `0x${string}` = "0x4ec77ff732418ba9ffc3385c6f67108df6ce7295484be028861362c13142647c"; // ECO.US.CORECPIINDEX
  const HERMES_BASE_URL = "https://hermes.pyth.network";

  // Get vault address
  const { data: vaultInfo } = useDeployedContractInfo({ contractName: "EquiVault" as const });
  const vaultAddress = vaultInfo?.address;
  // const { data: oracleInfo } = useDeployedContractInfo({ contractName: "PythOracle" as const });

  // Read user's position from the vault
  const { data: userPosition, refetch: refetchPosition } = useScaffoldReadContract({
    contractName: "EquiVault",
    functionName: "getUserPosition",
    args: [connectedAddress as `0x${string}`],
    watch: true,
  });

  // Hermes numeric price (read-only for display & calculations)
  const [hermesPriceWei, setHermesPriceWei] = useState<bigint | null>(null);
  const [hermesPrice, setHermesPrice] = useState<number>(0);

  // Read user's EquiAsset balance
  const { data: equiAssetBalance, refetch: refetchBalance } = useScaffoldReadContract({
    contractName: "EquiAsset",
    functionName: "balanceOf",
    args: [connectedAddress as `0x${string}`],
    watch: true,
  });

  // Read user's PYUSD balance
  const { data: pyusdBalance } = useScaffoldReadContract({
    contractName: "PYUSD",
    functionName: "balanceOf",
    args: [connectedAddress as `0x${string}`],
    watch: true,
  });

  // Write contracts
  const { writeContractAsync: writeVaultAsync } = useScaffoldWriteContract({ contractName: "EquiVault" });
  const { writeContractAsync: writePYUSDAsync } = useScaffoldWriteContract({ contractName: "PYUSD" });
  const { writeContractAsync: writeOracleAsync } = useScaffoldWriteContract({ contractName: "PythOracle" });
  const publicClient = usePublicClient();

  // Fetch latest Pyth price update from Hermes and return bytes[] payload for EVM
  const fetchHermesPriceUpdate = async (): Promise<`0x${string}`[]> => {
    const url = `${HERMES_BASE_URL}/v2/updates/price/latest?ids[]=${PYTH_PRICE_ID}&encoding=hex`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Hermes request failed (${res.status})`);
    const body = await res.json();

    // Try common response shapes
    const updates: string[] | undefined =
      body?.binary?.data ||
      body?.data?.binary?.data ||
      (Array.isArray(body?.updates)
        ? body.updates
            .map((u: any) => u?.binary?.data || u?.update?.data || u?.vaa || u?.updateData)
            .flat()
            .filter(Boolean)
        : undefined);

    if (!updates || updates.length === 0) throw new Error("No price updates returned by Hermes");

    const hexUpdates = updates.map((u: string) =>
      u.startsWith("0x") ? (u as `0x${string}`) : (("0x" + u) as `0x${string}`),
    );
    return hexUpdates as `0x${string}`[];
  };

  // Fetch numeric price from Hermes (not on-chain); result scaled to 1e18 for calculations
  const fetchHermesNumericPrice = async () => {
    const url = `${HERMES_BASE_URL}/v2/updates/price/latest?ids[]=${PYTH_PRICE_ID}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Hermes price request failed (${res.status})`);
    const body = await res.json();
    // robust extraction supporting example: { parsed: [ { price, ema_price } ] }
    const priceNode =
      (Array.isArray(body?.parsed) && body.parsed[0]) ||
      (Array.isArray(body?.prices) && body.prices[0]) ||
      (Array.isArray(body?.priceFeeds) && body.priceFeeds[0]) ||
      null;
    const p = priceNode?.price?.price ?? priceNode?.ema_price?.price;
    const expo = priceNode?.price?.expo ?? priceNode?.ema_price?.expo;
    if (p === undefined || expo === undefined) throw new Error("Malformed Hermes price response");
    const priceInt = BigInt(typeof p === "string" ? p : p.toString());
    const expNum: number = Number(expo);
    const power = expNum + 18; // scale to 1e18
    let scaled: bigint;
    if (power >= 0) scaled = priceInt * 10n ** BigInt(power);
    else scaled = priceInt / 10n ** BigInt(-power);
    setHermesPriceWei(scaled);
    // numeric for UI
    const floatVal = Number(priceInt) * Math.pow(10, expNum);
    setHermesPrice(floatVal);
  };

  // Poll Hermes price periodically
  useEffect(() => {
    const run = async () => {
      try {
        await fetchHermesNumericPrice();
      } catch (e) {
        console.error(e);
      }
    };
    run();
    const id = setInterval(run, 20000);
    return () => {
      clearInterval(id);
    };
  }, []);

  // Calculate collateral required for minting
  // Formula from contract: requiredCollateral = (amountToMint * assetPrice * COLLATERAL_RATIO) / (100 * ASSET_DECIMAL)
  const calculateCollateralRequired = (amountToMint: string) => {
    if (!amountToMint || !hermesPriceWei) return "0";
    try {
      const mintAmountWei = parseEther(amountToMint); // 18 decimals
      const price = hermesPriceWei; // 18 decimals
      const COLLATERAL_RATIO = BigInt(500);
      const ASSET_DECIMAL = parseEther("1");

      // Calculate required collateral in normalized form (18 decimals)
      const requiredNormalized = (mintAmountWei * price * COLLATERAL_RATIO) / (BigInt(100) * ASSET_DECIMAL);

      // Convert to PYUSD (6 decimals) for display
      const requiredPYUSD = requiredNormalized / BigInt(1e12);
      return formatUnits(requiredPYUSD, 6);
    } catch (error) {
      console.error("Error calculating collateral:", error);
      return "0";
    }
  };

  // Calculate PYUSD to redeem when burning
  // Formula from contract: collateralReleased = (amountToBurn * assetPrice * COLLATERAL_RATIO) / (100 * ASSET_DECIMAL)
  const calculateRedemption = (amountToBurn: string) => {
    if (!amountToBurn || !hermesPriceWei) return "0";
    try {
      const burnAmountWei = parseEther(amountToBurn);
      const price = hermesPriceWei;
      const COLLATERAL_RATIO = BigInt(500);
      const ASSET_DECIMAL = parseEther("1");

      // Calculate collateral released in normalized form (18 decimals)
      const releasedNormalized = (burnAmountWei * price * COLLATERAL_RATIO) / (BigInt(100) * ASSET_DECIMAL);

      // Convert to PYUSD (6 decimals) for display
      const releasedPYUSD = releasedNormalized / BigInt(1e12);
      return formatUnits(releasedPYUSD, 6);
    } catch (error) {
      console.error("Error calculating redemption:", error);
      return "0";
    }
  };

  // Handle mint - approve, deposit, and mint in sequence
  const handleMint = async () => {
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      notification.error("Please enter a valid mint amount");
      return;
    }

    if (!connectedAddress) {
      notification.error("Please connect your wallet");
      return;
    }

    if (!vaultAddress) {
      notification.error("Vault address not found");
      return;
    }

    setIsProcessing(true);

    try {
      // Step 0: Update oracle with latest Pyth price via Hermes
      notification.info("Step 0/3: Updating oracle price...");
      const updates = await fetchHermesPriceUpdate();
      const updateHash = await writeOracleAsync({
        functionName: "UpdateAndGetPrice",
        args: [updates],
        value: parseEther("0.003"),
      });
      // wait for oracle update to be mined, then refetch latest price
      if (publicClient && updateHash) {
        try {
          await publicClient.waitForTransactionReceipt({ hash: updateHash as `0x${string}` });
        } catch {}
      }
      const amountToMint = parseEther(mintAmount);
      // Recalculate collateral with the updated price (fallback to existing if needed)
      if (!hermesPriceWei) {
        notification.error("Hermes price not available. Please try again.");
        setIsProcessing(false);
        return;
      }
      const priceBI = hermesPriceWei;
      const requiredNormalized = (amountToMint * priceBI * BigInt(500)) / (BigInt(100) * parseEther("1"));
      const collateralRequiredPYUSD = requiredNormalized / BigInt(1e12);

      notification.info("Step 1/3: Approving PYUSD...");

      // Step 1: Approve PYUSD spending by the vault
      await writePYUSDAsync({
        functionName: "approve",
        args: [vaultAddress, collateralRequiredPYUSD],
      });

      notification.success(`PYUSD approved! ${vaultAddress}`);
      console.log(`PYUSD approved! ${vaultAddress}`);
      notification.info("Step 2/3: Depositing collateral...");

      // Step 2: Deposit collateral
      await writeVaultAsync({
        functionName: "depositCollateral",
        args: [collateralRequiredPYUSD],
      });

      notification.success("Collateral deposited!");
      notification.info("Step 3/3: Minting eCORECPIIndex...");

      // Step 3: Mint EquiAsset
      await writeVaultAsync({
        functionName: "mintEquiAsset",
        args: [amountToMint],
      });

      notification.success(`Successfully minted ${mintAmount} eCORECPIIndex!`);
      setMintAmount("");

      // Refetch balances
      await refetchPosition();
      await refetchBalance();
    } catch (error: any) {
      console.error("Error minting:", error);
      const errorMessage = error?.message || "Failed to mint asset";
      notification.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle burn
  const handleBurn = async () => {
    if (!burnAmount || parseFloat(burnAmount) <= 0) {
      notification.error("Please enter a valid burn amount");
      return;
    }

    if (!connectedAddress) {
      notification.error("Please connect your wallet");
      return;
    }

    setIsProcessing(true);

    try {
      // Step 0: Update oracle with latest Pyth price via Hermes
      notification.info("Updating oracle price...");
      const updates = await fetchHermesPriceUpdate();
      const updateHash = await writeOracleAsync({
        functionName: "UpdateAndGetPrice",
        args: [updates],
        value: parseEther("0.003"),
      });
      if (publicClient && updateHash) {
        try {
          await publicClient.waitForTransactionReceipt({ hash: updateHash as `0x${string}` });
        } catch {}
      }

      const amountToBurn = parseEther(burnAmount);

      notification.info("Burning eCORECPIIndex...");

      await writeVaultAsync({
        functionName: "burnEquiAsset",
        args: [amountToBurn],
      });

      notification.success(`Successfully burned ${burnAmount} eCORECPIIndex!`);
      setBurnAmount("");

      // Refetch balances
      await refetchPosition();
      await refetchBalance();
    } catch (error: any) {
      console.error("Error burning:", error);
      const errorMessage = error?.message || "Failed to burn asset";
      notification.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Format user position data
  const userCollateral = userPosition ? formatEther(userPosition[0]) : "0";
  const userDebt = userPosition ? formatEther(userPosition[1]) : "0";
  const collateralRatio =
    userPosition && userPosition[2] !== BigInt(2) ** BigInt(256) - BigInt(1) ? Number(userPosition[2]) / 1e16 : 0; // Convert from 1e18 to percentage, handle max uint256 (infinite)
  const isLiquidatable = userPosition ? userPosition[3] : false;

  const currentPrice = hermesPrice;
  const userEquiAssetBalance = equiAssetBalance ? formatEther(equiAssetBalance) : "0";
  const userPYUSDBalance = pyusdBalance ? formatUnits(pyusdBalance, 6) : "0";

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-base-200 to-black py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Mint & Burn <span className="gradient-text">Synthetic Assets</span>
            </h1>
            <p className="text-xl text-white/70">Create or redeem synthetic assets backed by PYUSD collateral</p>
          </div>

          {!connectedAddress && (
            <div className="card-glass p-8 text-center mb-8">
              <p className="text-xl text-white/70">Please connect your wallet to continue</p>
            </div>
          )}

          {connectedAddress && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Panel */}
              <div className="lg:col-span-2">
                <div className="card-glass p-8">
                  {/* Asset Info */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-white/70 mb-3">
                      Asset: eCORECPIIndex (United States Core Consumer Price Index)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-base-300/50 rounded-lg p-4">
                        <p className="text-sm text-white/50 mb-1">Oracle Price</p>
                        <p className="text-2xl font-bold text-primary">${currentPrice.toFixed(2)}</p>
                      </div>
                      <div className="bg-base-300/50 rounded-lg p-4">
                        <p className="text-sm text-white/50 mb-1">Required Collateral Ratio</p>
                        <p className="text-2xl font-bold text-primary">500%</p>
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 mb-8 border-b border-white/10">
                    <button
                      onClick={() => setActiveTab("mint")}
                      className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors ${
                        activeTab === "mint"
                          ? "text-primary border-b-2 border-primary"
                          : "text-white/50 hover:text-white/70"
                      }`}
                      disabled={isProcessing}
                    >
                      <PlusCircleIcon className="w-5 h-5" />
                      Mint
                    </button>
                    <button
                      onClick={() => setActiveTab("burn")}
                      className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors ${
                        activeTab === "burn"
                          ? "text-primary border-b-2 border-primary"
                          : "text-white/50 hover:text-white/70"
                      }`}
                      disabled={isProcessing}
                    >
                      <FireIcon className="w-5 h-5" />
                      Burn
                    </button>
                  </div>

                  {/* Mint Tab */}
                  {activeTab === "mint" && (
                    <div className="space-y-6">
                      <div className="bg-info/10 border border-info/30 rounded-lg p-4 mb-4">
                        <p className="text-sm text-info">
                          ℹ️ Minting will: (0) Update Pyth price, (1) Approve PYUSD, (2) Deposit collateral, (3) Mint
                          eCORECPIIndex
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-3">
                          Amount of eCORECPIIndex to Mint
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={mintAmount}
                            onChange={e => setMintAmount(e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            disabled={isProcessing}
                            className="w-full bg-base-300 border border-white/20 rounded-lg px-4 py-4 text-white text-xl focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 font-medium">
                            eCORECPIIndex
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-3">
                          PYUSD Collateral Required
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={calculateCollateralRequired(mintAmount)}
                            readOnly
                            className="w-full bg-base-300/50 border border-white/10 rounded-lg px-4 py-4 text-white text-xl cursor-not-allowed"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 font-medium">
                            PYUSD
                          </span>
                        </div>
                        <p className="text-xs text-white/50 mt-2">
                          At 500% collateral ratio (5x overcollateralized) | Your PYUSD Balance:{" "}
                          {parseFloat(userPYUSDBalance).toFixed(2)}
                        </p>
                      </div>

                      <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                        <p className="text-sm text-warning">
                          ⚠️ Collateral ratio must remain above 500% initially and above 150% to avoid liquidation
                        </p>
                      </div>

                      <button
                        onClick={handleMint}
                        disabled={isProcessing || !mintAmount || parseFloat(mintAmount) <= 0}
                        className="w-full btn btn-primary text-white py-4 text-lg rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? "Processing..." : "Mint eCORECPIIndex"}
                      </button>
                    </div>
                  )}

                  {/* Burn Tab */}
                  {activeTab === "burn" && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-3">
                          Amount of eCORECPIIndex to Burn
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={burnAmount}
                            onChange={e => setBurnAmount(e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            disabled={isProcessing}
                            className="w-full bg-base-300 border border-white/20 rounded-lg px-4 py-4 text-white text-xl focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 font-medium">
                            eCORECPIIndex
                          </span>
                        </div>
                        <p className="text-xs text-white/50 mt-2">
                          Available: {parseFloat(userEquiAssetBalance).toFixed(4)} eCORECPIIndex
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-3">PYUSD to Redeem</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={calculateRedemption(burnAmount)}
                            readOnly
                            className="w-full bg-base-300/50 border border-white/10 rounded-lg px-4 py-4 text-white text-xl cursor-not-allowed"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 font-medium">
                            PYUSD
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleBurn}
                        disabled={isProcessing || !burnAmount || parseFloat(burnAmount) <= 0}
                        className="w-full btn btn-primary text-white py-4 text-lg rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? "Processing..." : "Burn eCORECPIIndex"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Vault Summary */}
              <div className="lg:col-span-1">
                <div className="card-glass p-6 sticky top-24">
                  <h3 className="text-2xl font-bold mb-6">My Vault</h3>

                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-white/50 mb-2">Total Collateral</p>
                      <p className="text-3xl font-bold">
                        {parseFloat(userCollateral).toFixed(4)} <span className="text-lg text-white/50">PYUSD</span>
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-white/50 mb-2">Minted eCORECPIIndex</p>
                      <p className="text-3xl font-bold">
                        {parseFloat(userDebt).toFixed(4)} <span className="text-lg text-white/50">eCORECPIIndex</span>
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-white/50 mb-2">eCORECPIIndex Balance</p>
                      <p className="text-2xl font-bold">
                        {parseFloat(userEquiAssetBalance).toFixed(4)}{" "}
                        <span className="text-base text-white/50">eCORECPIIndex</span>
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-sm text-white/50">Current C-Ratio</p>
                        <p
                          className={`text-2xl font-bold ${
                            collateralRatio >= 500
                              ? "text-success"
                              : collateralRatio >= 150
                                ? "text-warning"
                                : collateralRatio > 0
                                  ? "text-error"
                                  : "text-white"
                          }`}
                        >
                          {collateralRatio > 0 ? `${collateralRatio.toFixed(2)}%` : "∞"}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      {collateralRatio > 0 && (
                        <>
                          <div className="relative h-3 bg-base-300 rounded-full overflow-hidden">
                            <div className="absolute inset-0 flex">
                              <div className="w-[60%] bg-gradient-to-r from-success to-success"></div>
                              <div className="w-[25%] bg-gradient-to-r from-warning to-warning"></div>
                              <div className="w-[15%] bg-gradient-to-r from-error to-error"></div>
                            </div>
                            {collateralRatio < 1000 && (
                              <div
                                className="absolute top-0 left-0 h-full bg-white rounded-full"
                                style={{ width: "2px", left: `${Math.min(collateralRatio / 10, 100)}%` }}
                              ></div>
                            )}
                          </div>

                          <div className="flex justify-between mt-2 text-xs text-white/50">
                            <span>150%</span>
                            <span className="text-error">Liquidation</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div
                      className={`${
                        isLiquidatable ? "bg-error/10 border-error/30" : "bg-success/10 border-success/30"
                      } border rounded-lg p-4`}
                    >
                      <p className={`text-sm font-medium ${isLiquidatable ? "text-error" : "text-success"}`}>
                        {isLiquidatable ? "⚠️ Liquidatable" : collateralRatio > 0 ? "✓ Safe" : "No Position"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MintBurn;
