# Real-Time Multiplayer Chess Platform

An elegant, fully-featured, full-stack Chess application built with React, Vite, Tailwind CSS, Exprerss, and Firebase Firestore. Enjoy real-time multiplayer lobbies, private/public match requests, in-game chat, responsive chess controls, interactive chess lessons, and tactical puzzles of varying difficulties!

---

## 🌟 Key Features

### 🤝 Robust Multiplayer Matchmaking
- **Public Match Requests**: Standard public chess rooms listed directly in the community lobby for anyone to join and play instantly.
- **Private Matches (Room Code)**: Secure, private game rooms with auto-generated room codes. Share codes directly with friends to invite them to a private battle.
- **Host Room Controls**: Easily clean up or delete your own pending, unjoined match configurations directly from the lobby if you change your mind.

### 🎮 In-Game Features & Synchronization
- **Real-Time Board Sync**: Seamless turn-by-turn orchestration powered by Firebase Firestore, tracking complete state, timing, and moves.
- **Active Game Chat**: Real-time integrated game room chat channels allowing players to discuss strategies or share greetings.
- **Draw Offers & Resignation**: Expressive standard board game interactions, handling drawn matches and resignations securely.

### 🧠 Practice & Training Hub
- **Chess Puzzles**: Solitary tactical puzzles covering various scenarios with visual board indicators, step-by-step progress, interactive feedback, and hints.
- **Chess Lessons**: Curated interactive training guides, perfect for learning everything from initial pawn moves to advanced openings and endgame tactics.
- **Offline / Practice play**: Play single-player offline games local-only or practice with specific customized time controls.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React (Functional Components & Hooks), Vite, Tailwind CSS for visual stylings, and [Lucide React](https://lucide.dev) for high-fidelity icons.
- **Backend / Real-Time Sync**: Express.js server bundled with Vite, synced directly through Firebase (Firestore Database & Anonymous Authentication).
- **Styling**: Modern dark grid design with a custom warm-amber and emerald visual aesthetic.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+) and npm installed.

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open the browser and navigate to the local development environment:
   `http://localhost:3000`

---

## 📁 Project Structure

```
├── src/
│   ├── components/         # Extracted modular UI components (Lobby, Board, Chat, Puzzles, Lessons)
│   ├── data/               # Static puzzle databases, lessons, and configuration settings
│   ├── lib/                # Firebase core helpers and configuration hooks
│   ├── types.ts            # Shared global TypeScript types and room state structures
│   └── App.tsx             # Main core application router and state management
├── firestore.rules         # Security validation filters for Firestore document actions
├── server.ts               # Custom Express server configuring developmental Vite middleware
└── package.json            # Task commands, configurations, and core dependencies
```
