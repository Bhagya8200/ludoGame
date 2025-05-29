# Advanced Ludo Game - Project Structure

## File Structure
```
src/
├── components/
│   ├── GameBoard.tsx
│   ├── PlayerPanel.tsx
│   ├── PowerUpModal.tsx
│   ├── RuleVoting.tsx
│   └── TokenPiece.tsx
├── hooks/
│   ├── useGameLogic.ts
│   ├── useSocket.ts
│   └── useTimer.ts
├── server/
│   └── server.ts
├── types/
│   └── game.ts
├── utils/
│   ├── boardUtils.ts
│   ├── gameLogic.ts
│   └── powerUps.ts
├── App.tsx
├── main.tsx
└── index.css
```

## Installation Commands
```bash
npm create vite@latest ludo-game -- --template react-ts
cd ludo-game
npm install socket.io socket.io-client express cors uuid
npm install -D @types/express @types/cors @types/uuid
npm install lucide-react
```

## Package.json Scripts Addition
Add to your package.json:
```json
{
  "scripts": {
    "dev": "concurrently \"npm run server\" \"vite\"",
    "server": "tsx src/server/server.ts",
    "build": "tsc && vite build"
  }
}
```

Also install: `npm install -D tsx concurrently`

## Files Overview

### 1. src/types/game.ts - Type definitions
### 2. src/server/server.ts - Socket.io server
### 3. src/utils/ - Game logic utilities
### 4. src/components/ - React components
### 5. src/hooks/ - Custom hooks
### 6. src/App.tsx - Main app component
### 7. src/main.tsx - Entry point
### 8. src/index.css - Tailwind styles

Each file contains the complete implementation with TypeScript, proper error handling, and all the special features you requested.