"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { BookOpenIcon, CodeBracketIcon, CurrencyDollarIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

const Docs: NextPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-base-200 to-black py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">
              <span className="gradient-text">Documentation</span>
            </h1>
            <p className="text-xl text-white/70">
              Learn how to use EquiBlock to mint, burn, and trade synthetic assets
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <Link href="/mint" className="card-glass p-6 hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <BookOpenIcon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Getting Started</h3>
              <p className="text-white/70">Learn the basics of minting your first synthetic asset</p>
            </Link>

            <Link href="/trade" className="card-glass p-6 hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <CodeBracketIcon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Trading Guide</h3>
              <p className="text-white/70">Understand how to trade synthetic assets efficiently</p>
            </Link>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="card-glass p-6 hover:scale-105 transition-transform"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <ShieldCheckIcon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Smart Contracts</h3>
              <p className="text-white/70">Explore our audited smart contract code</p>
            </a>

            <Link href="/dashboard" className="card-glass p-6 hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <CurrencyDollarIcon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Vault Management</h3>
              <p className="text-white/70">Learn how to manage your collateral and avoid liquidation</p>
            </Link>
          </div>

          {/* Main Content */}
          <div className="card-glass p-8 space-y-8">
            <section>
              <h2 className="text-3xl font-bold mb-4">What is EquiBlock?</h2>
              <p className="text-white/70 leading-relaxed text-lg">
                EquiBlock is a decentralized synthetic asset platform that allows users to mint, burn, and trade
                tokenized real-world equity assets backed by PYUSD collateral. Our platform provides exposure to
                traditional financial markets through blockchain technology.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-primary">1. Deposit Collateral</h3>
                  <p className="text-white/70 leading-relaxed">
                    Users deposit PYUSD as collateral into our secure smart contracts. The collateral ratio is set at
                    150% to ensure system stability and protect against price volatility.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-primary">2. Mint Synthetic Assets</h3>
                  <p className="text-white/70 leading-relaxed">
                    Once collateral is deposited, users can mint synthetic assets (eAAPL, eTSLA, eGOOG, etc.) that track
                    the price of real-world equities using oracle price feeds.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-primary">3. Trade or Hold</h3>
                  <p className="text-white/70 leading-relaxed">
                    Synthetic assets can be traded on our decentralized exchange or held in your portfolio. All trades
                    are executed on-chain with transparent pricing.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-primary">4. Burn to Redeem</h3>
                  <p className="text-white/70 leading-relaxed">
                    At any time, users can burn their synthetic assets to redeem the underlying PYUSD collateral, minus
                    any debt obligations.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">Key Features</h2>
              <ul className="space-y-3 text-white/70 leading-relaxed text-lg">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong className="text-white">Decentralized:</strong> No central authority controls your assets
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong className="text-white">Transparent:</strong> All transactions are recorded on-chain
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong className="text-white">Secure:</strong> Audited smart contracts protect your funds
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong className="text-white">AI-Powered Liquidations:</strong> Fair liquidation mechanism using
                    Vincent protocol
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">Risk Disclaimer</h2>
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-6">
                <p className="text-warning leading-relaxed">
                  ⚠️ Trading synthetic assets involves risk. Always maintain a healthy collateral ratio above 150% to
                  avoid liquidation. The value of synthetic assets may fluctuate based on oracle price feeds. Never
                  invest more than you can afford to lose.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">Get Started</h2>
              <p className="text-white/70 leading-relaxed text-lg mb-6">
                Ready to start trading synthetic assets? Connect your wallet and begin minting today.
              </p>
              <Link href="/mint" className="btn btn-primary text-white px-8 py-3 text-lg rounded-lg inline-block">
                Launch App
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;
