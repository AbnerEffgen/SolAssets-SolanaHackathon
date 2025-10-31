# SolAssets
### A Platform for Tokenizing Real-World Assets on Solana

*Submission for the Solana Cypherpunk Hackathon.*

[![Deployed Site](https://img.shields.io/badge/Visit-Website-blue?style=for-the-badge&logo=vercel)](https://sol-assets-solana-hackathon-zhtg.vercel.app/)
[![Deployed Contract](https://img.shields.io/badge/View_Contract-Devnet-purple?style=for-the-badge&logo=solana)](https://solscan.io/account/7i8DEgM1A7UuQyTSC9tofxmBFxu6rEYJxHbA1sA5ZMwm?cluster=devnet)
[![GitHub](https://img.shields.io/badge/View-GitHub-black?style=for-the-badge&logo=github)](https://github.com/AbnerEffgen/SolAssets-SolanaHackathon)
[![Project Pitch](https://img.shields.io/badge/Project-Pitch-red?style=for-the-badge&logo=youtube)](https://youtu.be/ivpEU7tbcZg)
[![Demonstration](https://img.shields.io/badge/dApp_Demonstration-red?style=for-the-badge&logo=youtube)](https://www.youtube.com/)

[![Twitter](https://img.shields.io/badge/Follow-Twitter-blue?style=for-the-badge&logo=x)](https://x.com/Sol_Assets)
[![Discord](https://img.shields.io/badge/Join-Discord-7289DA?style=for-the-badge&logo=discord)](https://discord.gg/pZzcwDe56H)
[![Telegram](https://img.shields.io/badge/Join-Telegram-2CA5E0?style=for-the-badge&logo=telegram)](https://t.me/+_ek3UETcpXlhMTdh)

**SolAssets** is a decentralized platform built on Solana, designed to simplify the tokenization of assets. Our primary focus is on **Real-World Assets (RWAs)**, enabling users to bring off-chain value onto the blockchain with ease, transparency, and security.

The project provides a user-friendly dApp and a powerful Anchor-based smart contract, giving users the tools to create, manage, and verify both standard SPL tokens and specialized RWA tokens.

---

## Table of Contents

- [About The Project](#-about-the-project)
- [Key Features](#-key-features)
- [Technology Stack](#️-technology-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [On-Chain Program Setup](#on-chain-program-setup)
  - [Frontend Setup](#frontend-setup)
- [License](#-license)
- [Community](#-community)

---

## About The Project

Tokenization of Real-World Assets is a powerful narrative, but the process can be complex and opaque. SolAssets tackles this by providing a streamlined, on-chain solution.

Our platform consists of:
1.  **A Solana Smart Contract:** An Anchor-based program that handles the creation of tokens and, crucially, stores verifiable metadata on-chain in a custom PDA (`TokenRecord`).
2.  **A Web dApp:** A modern React/Vite/Shadcn frontend that provides a clean interface for users to connect their wallets, manage their profiles (via Supabase), and interact with the smart contract to create their own tokens.

This project aims to be the foundation for a larger RWA ecosystem on Solana, enabling future features like fractionalization, a secondary market, and governance.

## Key Features

* **Standard Token Creation:** Mint standard SPL tokens (9 decimals) directly from the dashboard.
* **RWA Tokenization:** A specialized flow to create RWA tokens (6 decimals) and store critical metadata on-chain.
* **On-Chain Metadata Store:** Uses a custom `TokenRecord` PDA (Program Derived Address) to permanently and verifiably link metadata to the token mint. This metadata includes:
    * `kind`: `Standard` or `Rwa`
    * `name`: Token Name
    * `symbol`: Token Symbol
    * `uri`: Metadata URI (e.g., for JSON or images)
    * `asset_id`: (RWA Only) A unique identifier for the off-chain asset.
    * `valuation`: (RWA Only) The current value of the asset.
    * `yield_bps`: (RWA Only) The yield in basis points (if applicable).
* **Modern dApp Interface:** A clean, responsive dashboard built with React, Vite, and Shadcn/ui.
* **Wallet Integration:** Seamless connection with popular Solana wallets like Phantom and Solflare.
* **User Management:** Leverages Supabase for secure user authentication and profile management.

## Technology Stack

### On-Chain (Program)

* **Framework:** [Anchor (0.32.1)](https://www.anchor-lang.com/)
* **Language:** [Rust](https://www.rust-lang.org/)
* **Libraries:** `anchor-lang`, `anchor-spl`
* **Contract ID:** `7i8DEgM1A7UuQyTSC9tofxmBFxu6rEYJxHbA1sA5ZMwm`

### Off-Chain (Frontend)

* **Framework:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **UI:** [Shadcn/ui](https://ui.shadcn.com/) & [Tailwind CSS](https://tailwindcss.com/)
* **State Management:** [TanStack Query](https://tanstack.com/query/latest)
* **Wallet Integration:** `@solana/wallet-adapter`
* **Web3:** `@solana/web3.js`, `@coral-xyz/anchor`

### Backend-as-a-Service

* **Database & Auth:** [Supabase](https://supabase.com/)

## Architecture

The SolAssets platform is composed of three main components:

1.  **Frontend dApp:** The React-based user interface that users interact with. It handles wallet connections, user authentication (via Supabase), and transaction building.
2.  **Supabase:** Provides the backend infrastructure for user authentication and storing non-critical, off-chain data (like user profiles).
3.  **Solana Program:** The Anchor smart contract deployed to the Solana Devnet. It contains the core logic for creating token mints and `TokenRecord` PDAs, ensuring all critical asset metadata is stored immutably on-chain.

## Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

* **Node.js (v18+):** [https://nodejs.org/](https://nodejs.org/)
* **npm** (or `pnpm`/`yarn`)
* **Rust & Cargo:** [https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install)
* **Solana CLI:** [https://docs.solana.com/cli/install](https://docs.solana.com/cli/install)
* **Anchor (v0.32.1):** [https://www.anchor-lang.com/docs/installation](https://www.anchor-lang.com/docs/installation)

### On-Chain Program Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/AbnerEffgen/SolAssets-SolanaHackathon.git

    cd SolAssets-SolanaHackathon/program
    ```

2.  **Build the program:**
    ```sh
    anchor build
    ```
    
3.  **Deploy the program (optional, requires devnet SOL):**
    ```sh
    anchor deploy
    ```
    *(You can also use the already-deployed contract ID: `7i8DEgM1A7UuQyTSC9tofxmBFxu6rEYJxHbA1sA5ZMwm`)*
    
4.  **Update the Program ID:**
    * If you deployed your own, copy the new program ID into `program/programs/program/src/lib.rs` and `frontend/src/lib/solana.ts` (or your project's constant file).

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```sh
    cd ../frontend
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```
    
3.  **Set up environment variables:**
    * Create a `.env` file by copying `.env.example`.
    * Fill in your Supabase URL and Key.
    * Set `VITE_PROGRAM_ID` to the deployed program ID.
    ```env
    VITE_SUPABASE_URL=YOUR_SUPABASE_URL
    VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_ANON_KEY
    VITE_PROGRAM_ID=7i8DEgM1A7UuQyTSC9tofxmBFxu6rEYJxHbA1sA5ZMwm
    ```
    
4.  **Run the development server:**
    ```sh
    npm dev
    ```
    
5.  Open [http://localhost:8080](http://localhost:8080) (or your configured port) in your browser.

---

## Community

Join our community to stay updated, ask questions, and contribute!

* **Twitter:** [@Sol_Assets](https://x.com/Sol_Assets)
* **Discord:** [SolAssets Discord Server](https://discord.gg/pZzcwDe56H)
* **Telegram:** [SolAssets Telegram Group](https://t.me/+_ek3UETcpXlhMTdh)
