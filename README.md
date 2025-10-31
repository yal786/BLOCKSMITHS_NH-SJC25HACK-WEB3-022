# 🛡️ Protego - Web3 Transaction Protection Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Ethereum](https://img.shields.io/badge/Ethereum-Mainnet-3C3C3D?logo=ethereum)](https://ethereum.org/)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)

**Protego** is a comprehensive blockchain security solution that provides real-time MEV attack detection, transaction simulation, and protection for Ethereum users. Built with cutting-edge Web3 technology, Protego helps users navigate the complex world of DeFi safely.

## 🌟 Key Features

### 🔴 Real-Time MEV Detection
- **Live Mempool Monitoring** - Real-time analysis of Ethereum pending transactions via Alchemy WebSocket
- **Instant Alerts** - <100ms alert delivery using Socket.IO
- **Enhanced Detection** - Advanced algorithms for frontrunning, sandwich attacks, and price manipulation
- **Browser Notifications** - Desktop alerts for high-risk transactions
- **Live Status Indicator** - Real-time connection health monitoring

### 🎯 Transaction Simulation
- **Tenderly Integration** - Pre-execution transaction simulation
- **Multi-Scenario Analysis** - Baseline vs sandwich attack simulations
- **Risk Scoring** - Confidence-based threat assessment (0-100%)
- **Loss Estimation** - Calculate potential slippage and USD loss
- **Re-Simulation** - Historical transaction analysis

### 🛡️ Transaction Protection
- **Flashbots Integration** - Private transaction relay to avoid MEV
- **Demo Mode** - Safe testing with Hardhat accounts
- **Transaction Builder** - Interactive UI for protected transactions
- **Smart Routing** - Automatic protection for high-risk transactions

### 🤖 AI-Powered Assistant (Proty)
- **Gemini AI Integration** - Google's Generative AI for blockchain education
- **Web3 Expert** - Answers questions about blockchain, DeFi, MEV, and security
- **Contextual Help** - Smart assistance based on user activity
- **Interactive Chat** - Natural conversation interface

### 📊 Analytics Dashboard
- **Three-Column Layout**
  - Live Alerts Feed (real-time)
  - Interactive Analytics (on-demand)
  - Forensic Logs (searchable)
- **Rich Visualizations**
  - Risk distribution pie charts
  - Slippage trend charts
  - Protection donut charts
  - Transaction statistics
- **Unique Transaction Tracking** - Avoid duplicate alerts
- **Export Reports** - Download PDF reports with analytics

### 🎨 Futuristic UI/UX
- **Glassmorphism Design** - Modern frosted glass effects
- **Neon Animations** - Smooth, eye-catching transitions
- **3D Effects** - Rotating shield logo, parallax backgrounds
- **Particle System** - Dynamic animated backgrounds
- **Responsive Design** - Mobile-friendly interface

## 🏗️ Architecture

```
Protego/
├── backend/                    # Node.js + Express Server
│   ├── core/                   # Core detection logic
│   │   ├── detector.js        # MEV detection algorithms
│   │   ├── detectorHelpers.js # Uniswap decoding utilities
│   │   └── mempoolListener.js # Real-time mempool monitor
│   ├── src/
│   │   ├── api/               # API routes
│   │   ├── db/                # Database utilities
│   │   ├── sim/               # Simulation modules
│   │   │   ├── tenderlySim.js # Tenderly integration
│   │   │   ├── hardhatSim.js  # Local simulation
│   │   │   ├── metrics.js     # Loss/slippage calculations
│   │   │   └── analyzeSimResult.js
│   │   ├── queue/             # BullMQ job processing
│   │   └── integrations/      # External integrations
│   ├── routes/                # Express routes
│   │   ├── protect.js         # Flashbots protection
│   │   ├── proty.js           # AI chatbot
│   │   ├── simulateRouter.js  # Simulation endpoints
│   │   ├── dashboardMetrics.js
│   │   └── reports.js         # PDF generation
│   ├── scripts/               # Database & setup scripts
│   └── server.js              # Main server entry
│
├── frontend/                   # React + Vite App
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── WalletConnect.jsx
│   │   │   ├── ProtectModal.jsx
│   │   │   ├── ReSimulateModal.jsx
│   │   │   ├── ProtyChat.jsx
│   │   │   ├── SimulationPanel.jsx
│   │   │   ├── TransactionBuilder.jsx
│   │   │   ├── ParticlesBackground.jsx
│   │   │   └── charts/        # Recharts components
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── LandingNew.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DashboardRealTime.jsx
│   │   │   └── ReSimulate.jsx
│   │   └── services/
│   │       └── api.js         # Axios API client
│   └── index.html
│
├── .gitignore
├── README.md
└── Documentation/              # Comprehensive guides
    ├── START_HERE.md
    ├── REAL_TIME_COMPLETE.md
    ├── SIMULATION_INTEGRATION_GUIDE.md
    └── [50+ other guides]
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ or v20+
- **PostgreSQL** 14+ (for alert storage)
- **Redis** 6+ (for BullMQ job queue)
- **Alchemy API Key** (for Ethereum RPC/WebSocket)
- **Tenderly Account** (for transaction simulation)
- **Gemini API Key** (optional, for AI chatbot)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yal786/BLOCKSMITHS_NH-SJC25HACK-WEB3-022.git
   cd BLOCKSMITHS_NH-SJC25HACK-WEB3-022
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Configuration

1. **Setup PostgreSQL Database**
   ```bash
   # Create database
   createdb protego
   
   # Run migrations
   cd backend/scripts
   psql -U your_user -d protego -f create-simulation-tables.sql
   psql -U your_user -d protego -f create-events-log-table.sql
   node setup-analytics-db.js
   ```

2. **Configure Backend Environment**
   
   Create `backend/.env`:
   ```env
   # Server
   PORT=4000
   
   # Database
   DATABASE_URL=postgres://your_user:your_password@localhost:5432/protego
   
   # Redis
   REDIS_URL=redis://127.0.0.1:6379
   
   # Alchemy (Get from https://dashboard.alchemy.com)
   ALCHEMY_WSS=wss://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
   ALCHEMY_HTTPS=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
   
   # Tenderly (Get from https://dashboard.tenderly.co)
   TENDERLY_ACCESS_KEY=your_access_key
   TENDERLY_ACCOUNT=your_account_name
   TENDERLY_PROJECT=your_project_name
   
   # Flashbots
   FLASHBOTS_MODE=demo
   FLASHBOTS_RPC=https://rpc.flashbots.net
   
   # Gemini AI (Optional - Get from https://makersuite.google.com/app/apikey)
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Configure Frontend Environment**
   
   Create `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:4000
   ```

### Running the Application

#### Option 1: Using Batch Files (Windows)

```bash
# Start backend
start-backend.bat

# Start frontend (in new terminal)
start-frontend.bat
```

#### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Test Real-Time Alerts (Optional):**
```bash
cd backend
node test-real-time-alert.js
```

### Access the Application

- **Landing Page:** http://localhost:3000
- **Dashboard:** http://localhost:3000/dashboard
- **Re-Simulate:** http://localhost:3000/resimulate

## 📖 Usage Guide

### 1. Monitoring Real-Time Alerts

1. Navigate to **Dashboard** (http://localhost:3000/dashboard)
2. Check for **🟢 LIVE** status in the "Live Alerts Feed"
3. Alerts appear instantly as MEV attacks are detected
4. Click any alert to view detailed analytics
5. Browser notifications alert you to high-risk transactions

### 2. Simulating Transactions

**Using Transaction Builder:**
1. Go to Dashboard
2. Fill in transaction details:
   - Contract Address
   - Calldata
   - Value (ETH)
   - Gas Limit
3. Click "Simulate Transaction"
4. View detailed simulation results with risk assessment

**Using Re-Simulate:**
1. Go to Re-Simulate page
2. Enter any Ethereum transaction hash
3. Click "Re-Simulate Transaction"
4. Analyze historical transaction for MEV attacks

### 3. Protecting Transactions

1. When an alert shows high risk:
2. Click "Protect This Transaction"
3. Review transaction details
4. Click "Send via Flashbots"
5. Transaction is routed through private mempool
6. Avoid frontrunning and sandwich attacks

### 4. Chatting with Proty

1. Click the **chat bubble** icon (bottom-right)
2. Ask questions about:
   - Blockchain basics
   - DeFi protocols
   - MEV attacks
   - Smart contract security
   - Transaction optimization
3. Get instant AI-powered answers

### 5. Exporting Reports

1. View analytics for any alert
2. Click "Download Report" button
3. PDF report generated with:
   - Transaction details
   - Risk assessment
   - Simulation results
   - Recommendations

## 🔬 Testing

### Test Real-Time System

```bash
# Windows
TEST_REAL_TIME.bat

# Linux/Mac
cd backend
node test-real-time-alert.js
```

Expected output:
- Alert appears in dashboard every 5 seconds
- Browser notification pops up
- Smooth animations
- LIVE status indicator

### Test Individual Components

```bash
cd backend

# Test MEV detector
node test-enhanced-detector.js

# Test Tenderly simulation
node test-simulate-endpoint.js

# Test Gemini chatbot
node test-gemini-api.js

# Test Flashbots protection
node test-protect-endpoint.js

# Test unique transaction tracking
node test-unique-transactions.js
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Socket.IO** - Real-time WebSocket communication
- **Ethers.js** - Ethereum library
- **PostgreSQL** - Primary database
- **Redis** - Caching & job queue
- **BullMQ** - Background job processing
- **Tenderly** - Transaction simulation
- **Alchemy** - Ethereum RPC/WebSocket provider
- **Google Gemini AI** - Chatbot AI
- **PDFKit** - PDF report generation

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time updates
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **TailwindCSS** - Utility-first CSS
- **Ethers.js** - Web3 wallet integration

### DevOps
- **Hardhat** - Local blockchain for testing
- **Git** - Version control

## 📊 API Documentation

### Core Endpoints

#### POST `/api/simulate`
Simulate a transaction for MEV attacks.

**Request:**
```json
{
  "tx": {
    "to": "0x...",
    "data": "0x...",
    "value": "0",
    "gasLimit": "200000",
    "from": "0x..."
  },
  "attackerBuyAmount": "1000000000000000000",
  "tokenAddress": "0x...",
  "tokenDecimals": 18,
  "tokenUsdPrice": 2500
}
```

**Response:**
```json
{
  "simulated": true,
  "baselineResult": {...},
  "sandwichResult": {...},
  "comparison": {
    "slippage_pct": 2.5,
    "victim_loss_usd": 125.50
  }
}
```

#### POST `/api/resimulate`
Re-simulate a historical transaction.

**Request:**
```json
{
  "txHash": "0x..."
}
```

#### POST `/api/protect`
Submit transaction via Flashbots.

**Request:**
```json
{
  "tx": {...},
  "signedTx": "0x..."
}
```

#### POST `/api/proty/chat`
Chat with Proty AI assistant.

**Request:**
```json
{
  "message": "What is MEV?"
}
```

#### GET `/api/dashboard/metrics`
Get dashboard analytics.

#### GET `/api/dashboard/unique-metrics`
Get unique transaction analytics (no duplicates).

#### POST `/api/reports/download`
Generate and download PDF report.

### WebSocket Events

#### Client → Server
- `requestInitialData` - Request historical alerts

#### Server → Client
- `initialData` - Historical alerts batch
- `newAlert` - Real-time new alert
- `mevAlert` - High-risk MEV alert

## 🎯 Features Breakdown

### MEV Detection Algorithms

1. **Frontrunning Detection**
   - Monitors transactions with higher gas prices
   - Detects same target contract/method
   - Calculates potential victim impact

2. **Sandwich Attack Detection**
   - Identifies buy-victim-sell patterns
   - Tracks same token pairs
   - Detects sequential attacker transactions

3. **Enhanced DEX Analysis**
   - Decodes Uniswap V2/V3 swaps
   - Fetches real-time liquidity reserves
   - Calculates price impact
   - Estimates slippage percentage

### Simulation Features

1. **Tenderly Simulation**
   - Full EVM execution trace
   - State changes analysis
   - Gas estimation
   - Error detection

2. **Sandwich Comparison**
   - Baseline simulation (no attack)
   - Sandwich simulation (with MEV)
   - Side-by-side comparison
   - Loss quantification

3. **Metrics Calculation**
   - Token output comparison
   - Slippage percentage
   - USD loss estimation
   - Attacker profit calculation

## 🔒 Security Considerations

### Demo vs Production

**Current Setup: DEMO MODE**
- Uses publicly known Hardhat private key
- Flashbots protection in demo mode
- Tenderly simulations on testnet/fork

**For Production:**
1. **Never commit `.env` files**
2. **Use environment-specific keys**
3. **Enable Flashbots signature**
4. **Implement user wallet integration**
5. **Add authentication/authorization**
6. **Use secure RPC providers**
7. **Enable rate limiting**
8. **Add input validation**

### Private Keys

⚠️ **WARNING:** The demo private key in `ProtectModal.jsx` is:
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

This is **Hardhat's default account #0** - publicly known and for testing only.

**NEVER use on mainnet with real funds!**

## 🐛 Troubleshooting

### Backend Won't Start

```bash
# Check if port 4000 is in use
netstat -ano | findstr :4000

# Kill process using port 4000 (Windows)
taskkill /PID <PID> /F

# Or use the fix script
FIX-PORT-4000.bat
```

### Database Connection Error

```bash
# Verify PostgreSQL is running
pg_isready

# Check connection string in .env
DATABASE_URL=postgres://user:password@localhost:5432/protego

# Test connection
psql -U your_user -d protego -c "SELECT 1;"
```

### Redis Connection Error

```bash
# Start Redis server
redis-server

# Test connection
redis-cli ping
# Should return: PONG
```

### Alchemy WebSocket Disconnects

- Check API key is valid
- Verify not exceeding rate limits
- Check network connectivity
- Backend auto-reconnects on disconnect

### No Alerts Appearing

1. **Check backend logs** - Should show "Connected to Alchemy WSS"
2. **Lower detection threshold** - Edit `mempoolListener.js` CONFIDENCE_THRESHOLD
3. **Use test script** - `node test-real-time-alert.js`
4. **Check browser console** - Should show "Connected to real-time mempool monitor"

### Frontend Build Errors

```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
npm run dev
```

## 📈 Performance Optimization

### Backend
- Uses connection pooling for PostgreSQL
- Redis caching for frequently accessed data
- BullMQ for background job processing
- Efficient WebSocket event handling
- Debounced database writes

### Frontend
- Code splitting with React.lazy()
- Memoized components with React.memo()
- Optimized re-renders
- Lazy-loaded charts
- Efficient WebSocket subscriptions

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Keep commits atomic and descriptive
- Use meaningful variable names

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Alchemy** - Ethereum infrastructure
- **Tenderly** - Transaction simulation platform
- **Flashbots** - MEV protection infrastructure
- **Google Gemini** - AI-powered chatbot
- **Uniswap** - DEX protocol reference
- **Ethereum Foundation** - Blockchain technology
- **React Team** - Frontend framework
- **Vite Team** - Build tool

## 📞 Support

For questions, issues, or feature requests:

- **GitHub Issues:** [Create an issue](https://github.com/yal786/BLOCKSMITHS_NH-SJC25HACK-WEB3-022/issues)
- **Documentation:** Check the `/Documentation` folder
- **Guides:** See `START_HERE.md` for detailed setup

## 🗺️ Roadmap

### Current Version (v1.0)
- ✅ Real-time MEV detection
- ✅ Transaction simulation
- ✅ Flashbots protection
- ✅ AI chatbot
- ✅ Analytics dashboard
- ✅ PDF reports

### Future Enhancements
- 🔲 Multi-chain support (Polygon, Arbitrum, Optimism)
- 🔲 Advanced MEV strategies (JIT liquidity, liquidations)
- 🔲 Machine learning risk models
- 🔲 Social features (share alerts, leaderboards)
- 🔲 Mobile app (React Native)
- 🔲 Token price oracles integration
- 🔲 DeFi protocol-specific detection
- 🔲 User authentication & profiles
- 🔲 Subscription-based premium features
- 🔲 Public API for developers

## 📊 Project Stats

- **Lines of Code:** ~15,000+
- **Components:** 25+ React components
- **API Endpoints:** 15+
- **WebSocket Events:** 5+
- **Documentation Files:** 50+
- **Test Scripts:** 10+

---

<div align="center">

**Built with ❤️ for the Ethereum community**

[⭐ Star this repo](https://github.com/yal786/BLOCKSMITHS_NH-SJC25HACK-WEB3-022) | [🐛 Report Bug](https://github.com/yal786/BLOCKSMITHS_NH-SJC25HACK-WEB3-022/issues) | [✨ Request Feature](https://github.com/yal786/BLOCKSMITHS_NH-SJC25HACK-WEB3-022/issues)

</div>
