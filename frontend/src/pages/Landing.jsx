import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Eye, 
  Zap, 
  Lock, 
  FileSearch, 
  Activity,
  Radio,
  Brain,
  TestTube,
  Send,
  Database,
  BarChart,
  ArrowRight,
  CheckCircle2,
  Server,
  Code,
  Layers
} from 'lucide-react';
import Navbar from '../components/Navbar';

const Landing = () => {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#020c1b] text-[#e6f0ff]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/20 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl animate-pulse delay-700" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center space-y-8">
            <div className="inline-block p-4 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-2xl backdrop-blur-sm border border-cyan-500/30">
              <Shield className="w-20 h-20 text-cyan-400" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent animate-gradient">
              Protego
            </h1>
            
            <p className="text-2xl md:text-3xl font-semibold text-cyan-400">
              Real-time MEV Detection & Transaction Protection
            </p>
            
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
              Your DeFi security radar — detect, simulate, and protect from MEV attacks before they strike.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => scrollToSection('vision')}
                className="px-8 py-4 rounded-2xl bg-[#0f2330] text-cyan-400 font-bold text-lg border-2 border-cyan-500/30 hover:border-cyan-500 hover:bg-[#0f2330]/80 transition-all duration-300"
              >
                Explore Solution
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section id="vision" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-[#0f2330] to-[#020c1b] p-8 md:p-12 rounded-3xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 shadow-xl hover:shadow-cyan-500/20">
            <div className="flex items-center space-x-3 mb-6">
              <Eye className="w-8 h-8 text-cyan-400" />
              <h2 className="text-3xl md:text-4xl font-bold text-cyan-400">Our Vision</h2>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed">
              We're building <span className="text-cyan-400 font-semibold">SecureDApp Shield</span> — a middleware dashboard that detects MEV attacks in real time, 
              warns users, protects transactions privately, and logs everything for audits. Our mission is to make DeFi safer 
              by providing traders, protocols, and security teams with the tools they need to identify and prevent MEV exploitation 
              before it happens.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-[#0f2330]/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-center text-gray-400 mb-16 text-lg">7-Step Protection Pipeline</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Send, title: "1. User Submits Tx", desc: "Transaction enters the system" },
              { icon: Radio, title: "2. Mempool Monitor", desc: "Real-time scanning via Alchemy WebSocket" },
              { icon: Brain, title: "3. Detection Engine", desc: "Rule-based + ML analysis" },
              { icon: TestTube, title: "4. Simulation", desc: "Tenderly fork testing" },
              { icon: Activity, title: "5. Dashboard Alert", desc: "Visualize risk scores" },
              { icon: Lock, title: "6. Protection", desc: "Flashbots private relay" },
              { icon: Database, title: "7. Forensics", desc: "Log & audit trail" }
            ].map((step, index) => (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-[#0f2330] to-[#020c1b] p-6 rounded-2xl border border-cyan-500/20 hover:border-cyan-500/60 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <step.icon className="w-12 h-12 text-cyan-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Key Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Radio,
                title: "Real-Time Mempool Scanning",
                desc: "Monitor pending transactions across multiple chains with sub-second latency"
              },
              {
                icon: Brain,
                title: "Rule-Based + ML Detection",
                desc: "Hybrid detection system combining predefined rules and machine learning models"
              },
              {
                icon: TestTube,
                title: "Simulation Engine",
                desc: "Test transactions in forked environments before execution"
              },
              {
                icon: Send,
                title: "Private Transaction Relay",
                desc: "Route sensitive transactions through Flashbots to prevent frontrunning"
              },
              {
                icon: FileSearch,
                title: "Audit & Forensic Logs",
                desc: "Complete transaction history and attack patterns for compliance and analysis"
              },
              {
                icon: BarChart,
                title: "Transparent Risk Scoring",
                desc: "Clear, explainable risk metrics for every transaction"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-[#0f2330] to-[#020c1b] p-8 rounded-2xl border border-cyan-500/20 hover:border-cyan-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-[#0f2330]/20 to-transparent">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Roadmap
          </h2>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-400 via-blue-500 to-cyan-400" />

            <div className="space-y-12">
              {[
                {
                  phase: "Phase 1",
                  title: "Core Detection + Alchemy Integration",
                  status: "In Progress",
                  items: ["Real-time mempool monitoring", "Basic detection rules", "PostgreSQL logging"]
                },
                {
                  phase: "Phase 2",
                  title: "Flashbots Protect + Simulation",
                  status: "Next",
                  items: ["Private transaction relay", "Tenderly simulation", "Risk scoring system"]
                },
                {
                  phase: "Phase 3",
                  title: "ML Detection + Multi-chain",
                  status: "Planned",
                  items: ["Machine learning models", "Polygon, Arbitrum support", "Advanced analytics"]
                },
                {
                  phase: "Phase 4",
                  title: "Production Audit Dashboard",
                  status: "Future",
                  items: ["Enterprise features", "API access", "Compliance reporting"]
                }
              ].map((milestone, index) => (
                <div key={index} className="relative pl-20">
                  <div className="absolute left-4 w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center border-4 border-[#020c1b]">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  
                  <div className="bg-gradient-to-br from-[#0f2330] to-[#020c1b] p-6 rounded-2xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-cyan-400">{milestone.phase}</span>
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        milestone.status === 'In Progress' 
                          ? 'bg-cyan-500/20 text-cyan-400' 
                          : 'bg-gray-700 text-gray-400'
                      }`}>
                        {milestone.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{milestone.title}</h3>
                    <ul className="space-y-2">
                      {milestone.items.map((item, i) => (
                        <li key={i} className="flex items-start space-x-2 text-gray-400">
                          <ArrowRight className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Tech Stack
          </h2>
          <p className="text-center text-gray-400 mb-16 text-lg">Built with industry-leading tools</p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { name: "React", icon: Code },
              { name: "Node.js", icon: Server },
              { name: "Tailwind", icon: Layers },
              { name: "Redis", icon: Database },
              { name: "Postgres", icon: Database },
              { name: "Hardhat", icon: Code },
              { name: "Tenderly", icon: TestTube },
              { name: "Flashbots", icon: Lock },
              { name: "Alchemy", icon: Zap },
              { name: "Ethers.js", icon: Code }
            ].map((tech, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-[#0f2330] to-[#020c1b] p-6 rounded-2xl border border-cyan-500/20 hover:border-cyan-500/60 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20 flex flex-col items-center justify-center text-center"
              >
                <tech.icon className="w-12 h-12 text-cyan-400 mb-3 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-white font-semibold">{tech.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-cyan-500/20 bg-[#0f2330]/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <span className="text-xl font-bold text-cyan-400">Protego</span>
            </div>

            <p className="text-gray-400 text-center">
              © 2025 Protego — Built for the SecureDApp Hackathon
            </p>

            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors duration-300">
                Docs
              </a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors duration-300">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
