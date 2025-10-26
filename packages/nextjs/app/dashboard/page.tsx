"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { ArrowsRightLeftIcon, FireIcon, PlusCircleIcon } from "@heroicons/react/24/outline";

const portfolioAssets = [
  { symbol: "eCORECPIIndex", units: 10.5, price: 142.86, totalValue: 1500.0, logo: "eCORECPIIndex" },
];

const recentActivity = [
  {
    type: "mint",
    asset: "eCORECPIIndex",
    amount: "+5.0 eCORECPIIndex",
    value: "+$714.30",
    time: "2 hours ago",
    icon: PlusCircleIcon,
    color: "success",
  },
  {
    type: "burn",
    asset: "eTSLA",
    amount: "-2.0 eTSLA",
    value: "-$769.24",
    time: "1 day ago",
    icon: FireIcon,
    color: "error",
  },
  {
    type: "trade",
    asset: "eGOOG for eAMZN",
    amount: "+$500.00",
    value: "",
    time: "3 days ago",
    icon: ArrowsRightLeftIcon,
    color: "primary",
  },
  {
    type: "mint",
    asset: "eGOOG",
    amount: "+3.0 eGOOG",
    value: "+$1111.11",
    time: "5 days ago",
    icon: PlusCircleIcon,
    color: "success",
  },
];

const vaultDetails = [
  { asset: "eCORECPIIndex", collateral: "$2,250.00", debt: "$1,500.00", ratio: "150%", status: "Safe" },
];

const Dashboard: NextPage = () => {
  const { address } = useAccount();
  const [selectedTimeframe, setSelectedTimeframe] = useState("24h");

  const totalPortfolioValue = portfolioAssets.reduce((sum, asset) => sum + asset.totalValue, 0);
  const totalCollateral = 22500.0;
  const totalDebt = 9000.0;
  const collateralRatio = (totalCollateral / totalDebt) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-base-200 to-black py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Profile Header */}
          <div className="card-glass p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                <span className="text-2xl font-bold">{address ? address.slice(2, 4).toUpperCase() : "??"}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect Wallet"}
                </h1>
                <p className="text-white/50">Your Portfolio</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Portfolio & Activity */}
            <div className="lg:col-span-2 space-y-8">
              {/* Portfolio Value Card */}
              <div className="card-glass p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-white/50 mb-2">Portfolio Value</p>
                    <h2 className="text-5xl font-bold mb-2">${totalPortfolioValue.toLocaleString()}.00</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-success text-lg font-semibold">+2.5%</span>
                      <span className="text-white/50">in last 24h</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {["24h", "7d", "30d"].map(tf => (
                      <button
                        key={tf}
                        onClick={() => setSelectedTimeframe(tf)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          selectedTimeframe === tf
                            ? "bg-primary text-white"
                            : "bg-base-300 text-white/50 hover:text-white/70"
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mock Chart */}
                <div className="relative h-48 bg-base-300/30 rounded-lg overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="portfolioGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 150 Q 100 120 200 140 T 400 100 T 600 80 T 800 90"
                      fill="url(#portfolioGradient)"
                      stroke="none"
                    />
                    <path
                      d="M 0 150 Q 100 120 200 140 T 400 100 T 600 80 T 800 90"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>

              {/* Portfolio Assets */}
              <div className="card-glass p-6">
                <h3 className="text-2xl font-bold mb-6">Your Portfolio</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {portfolioAssets.map(asset => (
                    <div
                      key={asset.symbol}
                      className="bg-base-300/50 rounded-lg p-4 hover:bg-base-300/70 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{asset.logo.slice(1, 2)}</span>
                        </div>
                        <div>
                          <h4 className="font-bold">{asset.symbol}</h4>
                          <p className="text-sm text-white/50">{asset.units} Units</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold">${asset.totalValue.toLocaleString()}.00</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vault Details Table */}
              <div className="card-glass p-6">
                <h3 className="text-2xl font-bold mb-6">Details</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-white/70">Asset</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-white/70">Collateral</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-white/70">Debt</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-white/70">Ratio</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-white/70">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vaultDetails.map((vault, index) => (
                        <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4 font-semibold">{vault.asset}</td>
                          <td className="py-4 px-4">{vault.collateral}</td>
                          <td className="py-4 px-4">{vault.debt}</td>
                          <td className="py-4 px-4">
                            <span className="text-success font-semibold">{vault.ratio}</span>
                          </td>
                          <td className="py-4 px-4">
                            <button className="text-primary hover:text-primary/80 font-medium text-sm">Trade</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column - Vault Health & Activity */}
            <div className="lg:col-span-1 space-y-8">
              {/* Vault Health */}
              <div className="card-glass p-6">
                <h3 className="text-2xl font-bold mb-6">Vault Health</h3>

                {/* Collateral Ratio Gauge */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                      <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="20" />
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="20"
                        strokeDasharray={`${(collateralRatio / 300) * 502} 502`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-4xl font-bold">{collateralRatio.toFixed(0)}%</p>
                      <p className="text-sm text-success font-medium">Safe</p>
                    </div>
                  </div>
                </div>

                {/* Vault Stats */}
                <div className="space-y-4">
                  <div className="bg-base-300/50 rounded-lg p-4">
                    <p className="text-sm text-white/50 mb-1">Collateral Value</p>
                    <p className="text-2xl font-bold">${totalCollateral.toLocaleString()}.00</p>
                  </div>
                  <div className="bg-base-300/50 rounded-lg p-4">
                    <p className="text-sm text-white/50 mb-1">Minted eAssets Value</p>
                    <p className="text-2xl font-bold">${totalDebt.toLocaleString()}.00</p>
                  </div>
                  <div className="bg-base-300/50 rounded-lg p-4">
                    <p className="text-sm text-white/50 mb-1">Liquidation Threshold</p>
                    <p className="text-2xl font-bold text-error">150%</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card-glass p-6">
                <h3 className="text-2xl font-bold mb-6">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-base-300/30 rounded-lg hover:bg-base-300/50 transition-colors"
                      >
                        <div
                          className={`w-10 h-10 rounded-full bg-${activity.color}/20 flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon className={`w-5 h-5 text-${activity.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="font-semibold capitalize">
                                {activity.type} {activity.asset}
                              </p>
                              <p className="text-sm text-white/50">{activity.time}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{activity.amount}</p>
                              {activity.value && <p className="text-sm text-success">{activity.value}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
