"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

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
  const [selectedAsset] = useState(assets[0]);
  const [activeTimeframe, setActiveTimeframe] = useState("4H");
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const calculateEstimated = (amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    if (activeTab === "buy") {
      return (numAmount / selectedAsset.price).toFixed(4);
    } else {
      return (numAmount * selectedAsset.price).toFixed(2);
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
              <div>
                <h1 className="text-4xl font-bold mb-2">{selectedAsset.symbol}</h1>
                <p className="text-white/50">{selectedAsset.name}</p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-4xl font-bold mb-1">${selectedAsset.price}</p>
                <p className={`text-lg ${selectedAsset.change >= 0 ? "text-success" : "text-error"}`}>
                  {selectedAsset.change >= 0 ? "+" : ""}
                  {selectedAsset.change}% ({selectedAsset.change >= 0 ? "+" : ""}${selectedAsset.changeAmount} in last
                  24h)
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
                    Available: {activeTab === "buy" ? "1,500.00 PYUSD" : "10.5 " + selectedAsset.symbol}
                  </p>
                </div>

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
                  className={`w-full py-4 rounded-lg font-semibold text-white text-lg transition-all ${
                    activeTab === "buy"
                      ? "bg-success hover:bg-success/90 shadow-lg shadow-success/30"
                      : "bg-error hover:bg-error/90 shadow-lg shadow-error/30"
                  }`}
                >
                  {activeTab === "buy" ? "Buy" : "Sell"} {selectedAsset.symbol}
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
        </div>
      </div>
    </div>
  );
};

export default Trade;
