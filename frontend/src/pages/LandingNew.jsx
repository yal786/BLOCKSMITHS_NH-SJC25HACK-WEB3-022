import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Zap, Lock, Eye, Activity } from 'lucide-react';
import Navbar from '../components/Navbar';
import ParticlesBackground from '../components/ParticlesBackground';

const LandingNew = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Particles Background */}
      <ParticlesBackground />

      {/* Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/20 rounded-full blur-3xl animate-pulse-slow"
          style={{
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-blue/20 rounded-full blur-3xl animate-pulse-slow"
          style={{
            transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <Navbar />

        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 pt-20">
          <div className="max-w-7xl mx-auto text-center space-y-8 animate-fade-in">
            {/* 3D Rotating Shield Logo */}
            <div className="relative inline-block group">
              <div className="absolute inset-0 bg-neon-cyan/30 blur-2xl rounded-full animate-pulse-slow" />
              <div className="relative glass-card p-8 rounded-3xl transform hover:scale-110 transition-all duration-500 animate-float">
                <Shield className="w-24 h-24 text-neon-cyan animate-spin-slow" strokeWidth={1.5} />
                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/20 to-neon-blue/20 rounded-3xl animate-gradient" />
              </div>
            </div>

            {/* Title with Text Gradient Animation */}
            <h1 className="text-6xl md:text-8xl font-bold text-gradient-rainbow animate-shimmer">
              Protego
            </h1>

            {/* Subtitle */}
            <p className="text-2xl md:text-4xl font-semibold text-neon-cyan animate-slide-up">
              Real-time MEV Detection & Transaction Protection
            </p>

            {/* Description */}
            <p className="text-lg md:text-xl text-protego-text max-w-3xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Your DeFi radar — detect, simulate, and protect transactions before attacks strike.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <button
                onClick={() => navigate('/dashboard')}
                className="group relative px-10 py-5 rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-blue text-white font-bold text-lg overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-neon-strong"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-neon-blue to-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center space-x-3">
                  <span>Open Dashboard</span>
                  <ArrowRight className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </button>

              <button
                onClick={() => scrollToSection('features')}
                className="px-10 py-5 rounded-2xl glass-card text-neon-cyan font-bold text-lg border-2 border-neon-cyan/30 hover:border-neon-cyan transition-all duration-300 hover:shadow-neon"
              >
                Explore Solution
              </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto pt-16 animate-scale-in" style={{ animationDelay: '0.6s' }}>
              {[
                { label: 'Transactions Scanned', value: '10K+' },
                { label: 'Attacks Prevented', value: '500+' },
                { label: 'Networks Supported', value: '3' },
              ].map((stat, i) => (
                <div key={i} className="glass-card p-6 rounded-xl text-center card-hover">
                  <div className="text-3xl font-bold text-neon-cyan mb-2">{stat.value}</div>
                  <div className="text-sm text-protego-text/70">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold text-center mb-6 text-gradient-cyan">
              AI-Powered Security
            </h2>
            <p className="text-center text-protego-text/70 text-xl mb-20">
              Real-time protection at every layer
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Eye,
                  title: 'Mempool Monitoring',
                  desc: 'Real-time scanning of pending transactions across multiple chains',
                  color: 'from-cyan-500 to-blue-500',
                },
                {
                  icon: Zap,
                  title: 'Instant Detection',
                  desc: 'Rule-based + ML hybrid engine identifies threats in milliseconds',
                  color: 'from-blue-500 to-purple-500',
                },
                {
                  icon: Activity,
                  title: 'Simulation Engine',
                  desc: 'Test transactions in forked environments before execution',
                  color: 'from-purple-500 to-pink-500',
                },
                {
                  icon: Lock,
                  title: 'Private Relay',
                  desc: 'Route sensitive transactions through Flashbots protection',
                  color: 'from-pink-500 to-red-500',
                },
                {
                  icon: Shield,
                  title: 'Risk Scoring',
                  desc: 'Transparent, explainable risk metrics for every transaction',
                  color: 'from-red-500 to-orange-500',
                },
                {
                  icon: Activity,
                  title: 'Forensic Logs',
                  desc: 'Complete audit trail for compliance and analysis',
                  color: 'from-orange-500 to-yellow-500',
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="glass-card p-8 rounded-2xl card-hover group animate-slide-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} p-4 mb-6 group-hover:scale-110 transition-transform duration-300 glow-cyan`}>
                    <feature.icon className="w-full h-full text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-protego-text/70 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-32 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-cyan/5 to-transparent" />
          <div className="max-w-7xl mx-auto relative">
            <h2 className="text-5xl md:text-6xl font-bold text-center mb-6 text-gradient-cyan">
              How It Works
            </h2>
            <p className="text-center text-protego-text/70 text-xl mb-20">
              7-Step Protection Pipeline
            </p>

            <div className="relative">
              {/* Connection Line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-neon-cyan via-neon-blue to-neon-cyan hidden lg:block" />

              <div className="space-y-16">
                {[
                  { step: '01', title: 'User Submits Transaction', desc: 'Transaction enters the protection pipeline' },
                  { step: '02', title: 'Mempool Monitor', desc: 'Real-time scanning via Alchemy WebSocket' },
                  { step: '03', title: 'Detection Engine', desc: 'Hybrid rule-based + ML analysis' },
                  { step: '04', title: 'Simulation', desc: 'Tenderly fork testing for safety validation' },
                  { step: '05', title: 'Dashboard Alert', desc: 'Visualize risk scores and threat details' },
                  { step: '06', title: 'Protection', desc: 'Flashbots private relay for safe execution' },
                  { step: '07', title: 'Forensics', desc: 'Complete audit trail and reporting' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-8 ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} flex-col`}
                  >
                    <div className={`flex-1 ${i % 2 === 0 ? 'lg:text-right' : 'lg:text-left'} text-center`}>
                      <div className="glass-card p-8 rounded-2xl inline-block card-hover animate-slide-in">
                        <h3 className="text-3xl font-bold text-neon-cyan mb-4">{item.title}</h3>
                        <p className="text-protego-text/70 text-lg">{item.desc}</p>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="w-20 h-20 rounded-full glass-strong flex items-center justify-center text-3xl font-bold text-neon-cyan border-4 border-neon-cyan/30 glow-cyan animate-pulse-slow">
                        {item.step}
                      </div>
                    </div>

                    <div className="flex-1 hidden lg:block" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="glass-card p-16 rounded-3xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/10 via-neon-blue/10 to-neon-cyan/10 animate-gradient" />
              <div className="relative">
                <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gradient-rainbow">
                  Ready to Protect Your Transactions?
                </h2>
                <p className="text-xl text-protego-text/70 mb-10">
                  Join the future of DeFi security with Protego
                </p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-12 py-6 rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-blue text-white font-bold text-xl hover:shadow-neon-strong transition-all duration-300 transform hover:scale-105"
                >
                  Launch Dashboard →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 border-t border-neon-cyan/20">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-neon-cyan" />
              <span className="text-2xl font-bold text-neon-cyan">Protego</span>
            </div>

            <p className="text-protego-text/50 text-center">
              © 2025 Protego — Securing the Future of DeFi
            </p>

            <div className="flex space-x-6">
              <a href="#" className="text-protego-text/50 hover:text-neon-cyan transition-colors duration-300">
                Docs
              </a>
              <a href="#" className="text-protego-text/50 hover:text-neon-cyan transition-colors duration-300">
                GitHub
              </a>
              <a href="#" className="text-protego-text/50 hover:text-neon-cyan transition-colors duration-300">
                Discord
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingNew;
