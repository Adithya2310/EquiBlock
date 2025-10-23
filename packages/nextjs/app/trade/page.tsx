"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { ExclamationTriangleIcon, MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const assets = [
  { symbol: "eAAPL", name: "Apple Inc.", price: 172.25, change: 2.5, changeAmount: 4.21 },
  { symbol: "eTSLA", name: "Tesla Inc.", price: 384.62, change: -1.2, changeAmount: -4.67 },
  { symbol: "eGOOG", name: "Google", price: 370.37, change: 0.8, changeAmount: 2.94 },
  { symbol: "eAMZN", name: "Amazon", price: 142.86, change: 1.5, changeAmount: 2.11 },
  { symbol: "eMSFT", name: "Microsoft", price: 330.6, change: -0.3, changeAmount: -0.99 },
];

const timeframes = ["1H", "4H", "1D", "1W", "1M"];

const orderHistory = [
  { date: "2023-10-27 14:30", asset: "eAAPL", type: "Buy", amount: "10.5 eAAPL", price: "$170.15" },
  { date: "2023-10-26 09:15", asset: "eTSLA", type: "Sell", amount: "5.0 eTSLA", price: "$210.45" },
  { date: "2023-10-25 11:00", asset: "eGOOG", type: "Buy", amount: "2.1 eGOOG", price: "$135.20" },
  { date: "2023-10-24 16:45", asset: "eAAPL", type: "Sell", amount: "20.0 eAAPL", price: "$172.50" },
  { date: "2023-10-23 10:05", asset: "eMSFT", type: "Buy", amount: "15.0 eMSFT", price: "$330.60" },
];

const Trade: NextPage = () => {
  const { address } = useAccount();
  const [selectedAsset] = useState(assets[0]);
  const [activeTimeframe, setActiveTimeframe] = useState("4H");
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLiquidityModal, setShowLiquidityModal] = useState(false);
  const [liquidityPyUSD, setLiquidityPyUSD] = useState("");
  const [liquidityAsset, setLiquidityAsset] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);

  // Get contract addresses dynamically
  const { data: equiPoolInfo } = useDeployedContractInfo("EquiPool");
  // const { data: equiAssetInfo } = useDeployedContractInfo("EquiAsset");

  // Read pool reserves
  const { data: reserves } = useScaffoldReadContract({
    contractName: "EquiPool",
    functionName: "getReserves",
  });

  // Read oracle price
  const { data: oraclePrice } = useScaffoldReadContract({
    contractName: "EquiPool",
    functionName: "getOraclePrice",
  });

  // Read user PYUSD balance
  const { data: pyUSDBalance } = useScaffoldReadContract({
    contractName: "PYUSD",
    functionName: "balanceOf",
    args: [address],
  });

  // Read user EquiAsset balance
  const { data: assetBalance } = useScaffoldReadContract({
    contractName: "EquiAsset",
    functionName: "balanceOf",
    args: [address],
  });

  // Write hooks
  const { writeContractAsync: writePoolAsync } = useScaffoldWriteContract({ contractName: "EquiPool" });
  const { writeContractAsync: writePyUSDAsync } = useScaffoldWriteContract({ contractName: "PYUSD" });
  const { writeContractAsync: writeAssetAsync } = useScaffoldWriteContract({ contractName: "EquiAsset" });

  // Parse contract data
  const pyUSDReserve = reserves ? Number(formatUnits(reserves[0], 6)) : 0;
  const assetReserve = reserves ? Number(formatUnits(reserves[1], 18)) : 0;
  const userPyUSD = pyUSDBalance ? Number(formatUnits(pyUSDBalance, 6)) : 0;
  const userAsset = assetBalance ? Number(formatUnits(assetBalance, 18)) : 0;
  const currentPrice = oraclePrice ? Number(formatUnits(oraclePrice, 18)) : 100;

  const calculateEstimated = (amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    if (activeTab === "buy") {
      // Buying asset with PYUSD
      return (numAmount / currentPrice).toFixed(6);
    } else {
      // Selling asset for PYUSD
      return (numAmount * currentPrice).toFixed(2);
    }
  };

  const hasEnoughLiquidity = () => {
    const numAmount = parseFloat(amount) || 0;
    if (activeTab === "buy") {
      const assetOut = numAmount / currentPrice;
      return assetOut <= assetReserve;
    } else {
      const pyUSDOut = numAmount * currentPrice;
      return pyUSDOut <= pyUSDReserve;
    }
  };

  const handleAddLiquidity = async () => {
    if (!liquidityPyUSD || !liquidityAsset || !equiPoolInfo?.address) return;

    try {
      const pyUSDAmount = parseUnits(liquidityPyUSD, 6);
      const assetAmount = parseUnits(liquidityAsset, 18);

      console.log("Adding liquidity:", {
        pyUSDAmount: pyUSDAmount.toString(),
        assetAmount: assetAmount.toString(),
        poolAddress: equiPoolInfo.address,
      });

      // 1. Approve PYUSD
      await writePyUSDAsync({
        functionName: "approve",
        args: [equiPoolInfo.address, pyUSDAmount],
      });

      // 2. Approve Asset
      await writeAssetAsync({
        functionName: "approve",
        args: [equiPoolInfo.address, assetAmount],
      });

      // 3. Add liquidity
      await writePoolAsync({
        functionName: "addLiquidity",
        args: [pyUSDAmount, assetAmount],
      });

      setShowLiquidityModal(false);
      setLiquidityPyUSD("");
      setLiquidityAsset("");
    } catch (error) {
      console.error("Error adding liquidity:", error);
      alert(`Failed to add liquidity: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleSwap = async () => {
    if (!amount || isSwapping || !equiPoolInfo?.address) return;

    try {
      setIsSwapping(true);

      console.log("Swapping:", { amount, activeTab, poolAddress: equiPoolInfo.address });

      if (activeTab === "buy") {
        // Swap PYUSD for Asset
        const pyUSDAmount = parseUnits(amount, 6);

        console.log("Buying asset with PYUSD:", pyUSDAmount.toString());

        // Approve PYUSD
        await writePyUSDAsync({
          functionName: "approve",
          args: [equiPoolInfo.address, pyUSDAmount],
        });

        // Swap
        await writePoolAsync({
          functionName: "swapPYUSDForAsset",
          args: [pyUSDAmount],
        });
      } else {
        // Swap Asset for PYUSD
        const assetAmount = parseUnits(amount, 18);

        console.log("Selling asset for PYUSD:", assetAmount.toString());

        // Approve Asset
        await writeAssetAsync({
          functionName: "approve",
          args: [equiPoolInfo.address, assetAmount],
        });

        // Swap
        await writePoolAsync({
          functionName: "swapAssetForPYUSD",
          args: [assetAmount],
        });
      }

      setAmount("");
    } catch (error) {
      console.error("Error swapping:", error);
      alert(`Swap failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSwapping(false);
    }
  };

  const filteredOrders = orderHistory.filter(
    order =>
      order.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.date.includes(searchQuery) ||
      order.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-base-200 to-black py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Asset Header */}
          <div className="card-glass p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">{selectedAsset.symbol}</h1>
                <p className="text-white/50">{selectedAsset.name}</p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-4xl font-bold mb-1">${currentPrice.toFixed(2)}</p>
                <p className="text-sm text-white/50">Oracle Price</p>
              </div>
              <button onClick={() => setShowLiquidityModal(true)} className="btn btn-primary gap-2 flex items-center">
                <PlusIcon className="w-5 h-5" />
                Add Liquidity
              </button>
            </div>

            {/* Pool Stats */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
              <div>
                <p className="text-sm text-white/50 mb-1">PYUSD Reserve</p>
                <p className="text-xl font-bold">
                  {pyUSDReserve.toLocaleString(undefined, { maximumFractionDigits: 2 })} PYUSD
                </p>
              </div>
              <div>
                <p className="text-sm text-white/50 mb-1">Asset Reserve</p>
                <p className="text-xl font-bold">
                  {assetReserve.toLocaleString(undefined, { maximumFractionDigits: 4 })} {selectedAsset.symbol}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Panel */}
            <div className="lg:col-span-2">
              <div className="card-glass p-6 mb-6">
                {/* Timeframe Selector */}
                <div className="flex gap-2 mb-6">
                  {timeframes.map(tf => (
                    <button
                      key={tf}
                      onClick={() => setActiveTimeframe(tf)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTimeframe === tf
                          ? "bg-primary text-white"
                          : "bg-base-300 text-white/50 hover:text-white/70"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                {/* Mock Chart */}
                <div className="relative h-96 bg-base-300/30 rounded-lg overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 300 Q 100 250 200 280 T 400 200 T 600 150 T 800 180"
                      fill="url(#chartGradient)"
                      stroke="none"
                    />
                    <path
                      d="M 0 300 Q 100 250 200 280 T 400 200 T 600 150 T 800 180"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="3"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">
                    Chart visualization
                  </div>
                </div>
              </div>
            </div>

            {/* Buy/Sell Panel */}
            <div className="lg:col-span-1">
              <div className="card-glass p-6 sticky top-24">
                {/* Tabs */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  <button
                    onClick={() => setActiveTab("buy")}
                    className={`py-3 rounded-lg font-semibold transition-colors ${
                      activeTab === "buy" ? "bg-success text-white" : "bg-base-300 text-white/50 hover:text-white/70"
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setActiveTab("sell")}
                    className={`py-3 rounded-lg font-semibold transition-colors ${
                      activeTab === "sell" ? "bg-error text-white" : "bg-base-300 text-white/50 hover:text-white/70"
                    }`}
                  >
                    Sell
                  </button>
                </div>

                {/* Amount Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-white/70 mb-2">Amount to spend</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-base-300 border border-white/20 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-primary transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 font-medium">
                      {activeTab === "buy" ? "PYUSD" : selectedAsset.symbol}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-2">
                    Available:{" "}
                    {activeTab === "buy"
                      ? `${userPyUSD.toFixed(2)} PYUSD`
                      : `${userAsset.toFixed(4)} ${selectedAsset.symbol}`}
                  </p>
                </div>

                {/* Liquidity Warning */}
                {amount && !hasEnoughLiquidity() && (
                  <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg flex items-start gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-error font-medium mb-2">Insufficient Pool Liquidity</p>
                      <button
                        onClick={() => setShowLiquidityModal(true)}
                        className="text-xs text-error underline hover:no-underline"
                      >
                        Add liquidity to enable this swap
                      </button>
                    </div>
                  </div>
                )}

                {/* Estimated Receive */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-white/70 mb-2">Estimated to receive</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={calculateEstimated(amount)}
                      readOnly
                      className="w-full bg-base-300/50 border border-white/10 rounded-lg px-4 py-3 text-white text-lg cursor-not-allowed"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 font-medium">
                      {activeTab === "buy" ? selectedAsset.symbol : "PYUSD"}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleSwap}
                  disabled={!amount || !hasEnoughLiquidity() || isSwapping}
                  className={`w-full py-4 rounded-lg font-semibold text-white text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    activeTab === "buy"
                      ? "bg-success hover:bg-success/90 shadow-lg shadow-success/30"
                      : "bg-error hover:bg-error/90 shadow-lg shadow-error/30"
                  }`}
                >
                  {isSwapping ? "Processing..." : `${activeTab === "buy" ? "Buy" : "Sell"} ${selectedAsset.symbol}`}
                </button>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div className="card-glass p-6 mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold">Order History</h2>
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search asset or date"
                  className="w-full bg-base-300 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                />
                <MagnifyingGlassIcon className="w-5 h-5 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white/70">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white/70">Asset</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white/70">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white/70">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white/70">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 text-white/70">{order.date}</td>
                      <td className="py-4 px-4 font-semibold">{order.asset}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            order.type === "Buy" ? "bg-success/20 text-success" : "bg-error/20 text-error"
                          }`}
                        >
                          {order.type}
                        </span>
                      </td>
                      <td className="py-4 px-4">{order.amount}</td>
                      <td className="py-4 px-4 font-semibold">{order.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Liquidity Modal */}
          {showLiquidityModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="card-glass p-6 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-6">Add Liquidity</h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">PYUSD Amount</label>
                    <input
                      type="number"
                      value={liquidityPyUSD}
                      onChange={e => setLiquidityPyUSD(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-base-300 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                    />
                    <p className="text-xs text-white/50 mt-1">Available: {userPyUSD.toFixed(2)} PYUSD</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      {selectedAsset.symbol} Amount
                    </label>
                    <input
                      type="number"
                      value={liquidityAsset}
                      onChange={e => setLiquidityAsset(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-base-300 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                    />
                    <p className="text-xs text-white/50 mt-1">
                      Available: {userAsset.toFixed(4)} {selectedAsset.symbol}
                    </p>
                  </div>

                  <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                    <p className="text-sm text-white/70">
                      <span className="font-medium">Note:</span> You can provide any ratio of PYUSD to{" "}
                      {selectedAsset.symbol}. The pool uses oracle pricing for swaps.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowLiquidityModal(false);
                      setLiquidityPyUSD("");
                      setLiquidityAsset("");
                    }}
                    className="flex-1 py-3 rounded-lg font-semibold bg-base-300 text-white hover:bg-base-300/70 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddLiquidity}
                    disabled={!liquidityPyUSD || !liquidityAsset}
                    className="flex-1 py-3 rounded-lg font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Liquidity
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Trade;
