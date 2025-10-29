import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Shield } from 'lucide-react';
import WalletConnect from './WalletConnect';

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [network, setNetwork] = useState('Ethereum');

  const networks = ['Ethereum', 'Polygon', 'BSC'];

  function handleConnected(info) {
    console.log("✅ Wallet connected:", info.address);
  }

  function handleDisconnected() {
    console.log("🔌 Wallet disconnected");
  }

  return (
    <nav className="fixed top-0 w-full z-50 glass-strong border-b border-neon-cyan/20 animate-slide-in">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Brand - Clickable to Home */}
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center space-x-3 group cursor-pointer"
            title="Go to Home"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-blue p-2.5 flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 glow-cyan">
              <Shield className="w-full h-full text-white" strokeWidth={2} />
            </div>
            <span className="text-2xl font-bold text-gradient-cyan">
              Protego
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Network Selector Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-2 px-5 py-2.5 rounded-xl glass border border-neon-cyan/30 text-neon-cyan hover:border-neon-cyan transition-all duration-300 hover:shadow-neon font-medium">
                <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                <span>{network}</span>
                <ChevronDown className="w-4 h-4 transform group-hover:rotate-180 transition-transform duration-300" />
              </button>
              <div className="absolute right-0 mt-3 w-52 rounded-xl glass-strong border border-neon-cyan/30 shadow-glass opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 overflow-hidden">
                {networks.map((net, i) => (
                  <button
                    key={net}
                    onClick={() => setNetwork(net)}
                    className={`block w-full text-left px-5 py-3 text-neon-cyan hover:bg-neon-cyan/10 transition-all duration-200 ${
                      network === net ? 'bg-neon-cyan/20' : ''
                    } ${i === 0 ? 'rounded-t-xl' : ''} ${i === networks.length - 1 ? 'rounded-b-xl' : ''}`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${network === net ? 'bg-neon-cyan animate-pulse' : 'bg-gray-600'}`} />
                      <span>{net}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Connect Wallet Button */}
            <WalletConnect onConnected={handleConnected} onDisconnected={handleDisconnected} />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-neon-cyan hover:bg-neon-cyan/10 transition-all duration-300"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glass-strong border-t border-neon-cyan/20 animate-slide-in">
          <div className="px-4 py-4 space-y-4">
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass border border-neon-cyan/30 text-neon-cyan focus:outline-none focus:border-neon-cyan focus:shadow-neon transition-all duration-300"
            >
              {networks.map((net) => (
                <option key={net} value={net} className="bg-protego-dark">
                  {net}
                </option>
              ))}
            </select>
            <div className="w-full">
              <WalletConnect onConnected={handleConnected} onDisconnected={handleDisconnected} />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
