"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { ChartBarIcon, CurrencyDollarIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

const Home: NextPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-base-200 to-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 relative">
          <div className="text-center max-w-5xl mx-auto fade-in">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Unlock the Future of <span className="gradient-text">Equity Trading</span>
            </h1>
            <p className="text-xl sm:text-2xl text-white/70 mb-10 max-w-3xl mx-auto">
              Mint, burn, and trade synthetic equity assets backed by secure PYUSD collateral.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/mint" className="btn btn-primary text-white px-8 py-4 text-lg rounded-lg min-w-[200px]">
                Launch App
              </Link>
              {/* <Link
                href="/docs"
                className="btn bg-base-300 hover:bg-base-200 text-white px-8 py-4 text-lg rounded-lg min-w-[200px] border border-white/20"
              >
                Read the Docs
              </Link> */}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-semibold tracking-wider uppercase mb-3">FEATURES</p>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Why EquiBlock?</h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Discover the advantages of trading on a decentralized synthetic asset platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="card-glass p-8 hover:scale-105 transition-transform duration-300 fade-in">
              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                <ShieldCheckIcon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Decentralized & Secure</h3>
              <p className="text-white/70 leading-relaxed">
                Experience a trustless platform built on blockchain technology, ensuring security and transparency.
              </p>
            </div>

            {/* Feature 2 */}
            <div
              className="card-glass p-8 hover:scale-105 transition-transform duration-300 fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                <ChartBarIcon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Synthetic Assets</h3>
              <p className="text-white/70 leading-relaxed">
                Gain exposure to real-world equities through tokenized synthetic assets.
              </p>
            </div>

            {/* Feature 3 */}
            <div
              className="card-glass p-8 hover:scale-105 transition-transform duration-300 fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                <CurrencyDollarIcon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">PYUSD Collateral</h3>
              <p className="text-white/70 leading-relaxed">
                Utilize a stable and reliable collateral system backed by PYUSD.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 sm:py-32 bg-base-200/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-semibold tracking-wider uppercase mb-3">PROCESS</p>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">How It Works</h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-start gap-6 fade-in">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-3">Mint</h3>
                <p className="text-white/70 text-lg">
                  Create synthetic assets by depositing PYUSD collateral into a secure smart contract.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row items-start gap-6 fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-3">Trade</h3>
                <p className="text-white/70 text-lg">
                  Trade your tokenized assets on our decentralized exchange with deep liquidity and low slippage.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-start gap-6 fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-3">Burn</h3>
                <p className="text-white/70 text-lg">
                  Burn your synthetic assets at any time to redeem your underlying PYUSD collateral.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" />
                <path
                  d="M16 8L22 12V20L16 24L10 20V12L16 8Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M16 16L22 12M16 16L10 12M16 16V24" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <defs>
                  <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3B82F6" />
                    <stop offset="1" stopColor="#2563EB" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-sm text-white/70">© 2024 EquiBlock. All rights reserved.</span>
            </div>
            <div className="flex gap-8">
              <Link href="/docs" className="text-white/70 hover:text-primary transition-colors">
                Docs
              </Link>
              <a
                href="https://github.com"
                className="text-white/70 hover:text-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <a
                href="https://twitter.com"
                className="text-white/70 hover:text-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Twitter
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
