# Scamlab — Digital Security Education Platform

Scamlab is a comprehensive Telegram Mini App (TMA) ecosystem designed to educate users on cybersecurity and fraud prevention through gamified interactive simulations.

## 🌟 Overview

Scamlab replaces traditional dry security briefings with a high-fidelity, interactive "lab" where users face real-world scam scenarios (phishing, social engineering, SMS fraud) in a safe environment. The platform features a hybrid architecture connecting a React-based frontend with a Node.js backend and a Telegram Bot.

---

## 🛠 Technical Architecture

### 1. Frontend: React Mini App
The core user experience is a Single Page Application (SPA) optimized for the Telegram environment.

*   **Framework**: React 18 with Vite.
*   **Styling**: Tailwind CSS with custom "glassmorphic" design patterns.
*   **Animations**: Framer Motion for high-density UI transitions and route effects.
*   **State Management**: Complex local state synchronized with Firebase/Backend for persistence.
*   **Localization**: A dual-language system (Belarusian & Russian) using a reactive `t()` helper.
*   **Audio Engine**: Howler.js for immersive sound effects and haptic feedback integration.

### 2. Backend: Hybrid Node.js Server
A unified server (`server.ts`) that manages both the REST API and the Telegram Bot logic.

*   **API Layer**: Express.js handling user synchronization, analytics, and leaderboard data.
*   **Bot Framework**: Telegraf.js managing an asynchronous event loop for Telegram interactions.
*   **Dual-Database Support**: 
    *   **SQLite**: Handled via `better-sqlite3` for local development or lightweight deployments.
    *   **Firebase/Firestore**: Cloud-native persistence for production scale.
*   **Webhook Interface**: Secure endpoint for Telegram update delivery.

---

## ⚙️ Core Systems

### 🎮 The Game Engine
The simulation engine manages the educational flow:
*   **Scenario Logic**: A non-linear progression system where users make choices under a countdown timer.
*   **Scoring Algorithm**: Points are awarded based on accuracy and speed. A "Correctness Threshold" (currently 80%) determines if an answer qualifies as a success.
*   **Combo & Streak System**: 
    *   **Combo**: Rewards consecutive correct answers within a single session.
    *   **Streak**: An "anti-fragile" metric that currently tracks *consecutive failures* (as per specific user request) to highlight user vulnerability patterns.

### 🤖 Telegram Bot System
The bot acts as the entry point and administrative dashboard:
*   **Inline Navigation**: Unlike traditional bots that spam messages, Scamlab uses "stateless" UI updates. Every menu interaction triggers an `editMessageText` call, providing a seamless, app-like experience within the chat.
*   **Web App Integration**: Launches the Mini App with authenticated user data via the `web_app` button type.
*   **Commands**:
    *   `/start`: Deep-linking and user onboarding.
    *   `/leaders`: Fetches the top 10 global players.
    *   `/status`: Real-time system health check (DB mode, user count).

### 📊 Progress & Sync System
Bridges the gap between the Mini App and the Chat Bot:
*   **Real-time Sync**: XP, Levels, and Streaks updated in the Mini App are immediately visible in the Bot's profile view.
*   **Leveling Curve**: A square-root-based progression formula (`level = floor(sqrt(xp/10)) + 1`) ensures a satisfying but challenging advancement.
*   **Rank Hierarchy**: Users progress through tiers from "Novice" to "Security Master" based on their level.

### 🛡️ Security & Content System
*   **Firebase Rules**: Hardened Firestore rules preventing unauthorized data modification.
*   **Content Schema**: Scenarios are defined in a modular JSON-like structure, allowing for rapid deployment of new "threat vectors" without code changes.

---

## 🚀 Deployment & Configuration

### Environment Variables
Required secrets in `.env.example`:
*   `TELEGRAM_BOT_TOKEN`: API token from @BotFather.
*   `APP_URL`: The public endpoint for webhooks and WebApp links.
*   `ADMIN_TELEGRAM_ID`: ID of the system administrator for support routing.
*   `USE_WEBHOOK`: Toggle between long-polling and webhook mode.

### Scripts
*   `npm run dev`: Starts the hybrid server with Vite middleware.
*   `npm run build`: Compiles the frontend for production delivery.
*   `npm run start`: Launches the production server.

---
*Developed by Google AI Studio Build.*
