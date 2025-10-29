import React, { useEffect, useState, useRef } from "react";
import { Shield, AlertTriangle, CheckCircle, TrendingUp, Activity, Download, Filter, Search, X, Radio } from "lucide-react";
import Navbar from "../components/Navbar";
import ParticlesBackground from "../components/ParticlesBackground";
import ReSimulateModal from "../components/ReSimulateModal";
import ProtectModal from "../components/ProtectModal";
import ProtyChat from "../components/ProtyChat";
import { api } from "../services/api";
import SimulationTrendChart from "../components/charts/SimulationTrendChart";
import RiskPieChart from "../components/charts/RiskPieChart";
import ExecutionBarChart from "../components/charts/ExecutionBarChart";
import LossProfitChart from "../components/charts/LossProfitChart";
import ProtectionDonutChart from "../components/charts/ProtectionDonutChart";
import StatsCards from "../components/charts/StatsCards";
import io from "socket.io-client";

// Live Alert Card Component
const LiveAlertCard = ({ alert, onClick, onProtect, onAnalyze }) => {
  const getRiskColor = () => {
    switch (alert.risk_level) {
      case 'HIGH': return 'bg-red-500/20 border-red-500/50 text-red-400';
      case 'MEDIUM': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      default: return 'bg-green-500/20 border-green-500/50 text-green-400';
    }
  };

  const getRiskIcon = () => {
    switch (alert.risk_level) {
      case 'HIGH': return '🔴';
      case 'MEDIUM': return '🟡';
      default: return '🟢';
    }
  };

  return (
    <div
      className="glass-card p-4 rounded-xl border-l-4 hover:shadow-neon transition-all duration-300 cursor-pointer animate-slide-in card-hover"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getRiskIcon()}</span>
          <div>
            <div className="text-sm font-mono text-protego-text/70">
              {alert.tx_hash?.slice(0, 12)}...
            </div>
            <div className="text-xs text-protego-text/50">
              {new Date(alert.created_at).toLocaleTimeString()}
            </div>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-lg text-xs font-bold border ${getRiskColor()}`}>
          {alert.risk_level}
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-protego-text/60">Est. Loss:</span>
          <span className="text-red-400 font-bold">
            ${alert.est_loss_usd ? parseFloat(alert.est_loss_usd).toFixed(2) : '0.00'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-protego-text/60">Confidence:</span>
          <span className="text-neon-cyan font-bold">{alert.confidence}%</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onProtect(alert); }}
          className="flex-1 py-2 rounded-lg bg-neon-blue/20 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-blue/30 transition-all text-xs font-semibold"
        >
          🛡️ Protect
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onAnalyze(alert); }}
          className="flex-1 py-2 rounded-lg bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/30 transition-all text-xs font-semibold"
        >
          📊 Analyze
        </button>
      </div>
    </div>
  );
};

// Log Entry Component
const LogEntry = ({ log }) => {
  const getStatusColor = () => {
    if (log.sim_status === 'done') return 'text-green-400';
    if (log.sim_status === 'failed') return 'text-red-400';
    return 'text-yellow-400';
  };

  return (
    <div className="glass-card p-4 rounded-xl hover:shadow-neon transition-all duration-300 animate-slide-in">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-mono text-neon-cyan">
          {log.tx_hash?.slice(0, 16)}...
        </div>
        <div className={`text-xs px-2 py-1 rounded ${
          log.risk_level === 'HIGH' ? 'bg-red-500/20 text-red-400' :
          log.risk_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-green-500/20 text-green-400'
        }`}>
          {log.risk_level}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-protego-text/50">Time:</span>
          <span className="text-protego-text ml-1">{new Date(log.created_at).toLocaleTimeString()}</span>
        </div>
        <div>
          <span className="text-protego-text/50">Status:</span>
          <span className={`ml-1 font-bold ${getStatusColor()}`}>{log.sim_status || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

export default function DashboardNew() {
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showReSimulateModal, setShowReSimulateModal] = useState(false);
  const [showProtectModal, setShowProtectModal] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const socketRef = useRef(null);

  async function loadAlerts() {
    try {
      const res = await api.get("/v1/alerts");
      setAlerts(res.data || []);
      setLogs(res.data || []); // Use alerts as logs for now
    } catch (e) {
      console.error("alerts fetch", e);
    }
  }

  async function loadMetrics() {
    try {
      const res = await api.get("/api/dashboard-metrics");
      if (res.data && res.data.ok) {
        setMetrics(res.data);
      }
    } catch (e) {
      console.error("metrics fetch error", e);
    }
  }

  async function downloadFullReport() {
    setDownloadingReport(true);
    try {
      const response = await fetch('http://localhost:4000/v1/reports/full/pdf', {
        method: 'GET',
        headers: { 'Accept': 'application/pdf' },
      });

      if (!response.ok) throw new Error('Failed to download report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Protego-Full-Report.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert('✅ Full report downloaded successfully!');
    } catch (error) {
      console.error('Report download error:', error);
      alert('❌ Failed to download report: ' + error.message);
    } finally {
      setDownloadingReport(false);
    }
  }

  useEffect(() => {
    // Initial load
    loadAlerts();
    loadMetrics();

    // Setup Socket.IO for real-time alerts
    const BACKEND_URL = 'http://localhost:4000';
    socketRef.current = io(BACKEND_URL);

    socketRef.current.on('connect', () => {
      console.log('🟢 Connected to real-time mempool monitor');
      setIsLive(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('🔴 Disconnected from mempool monitor');
      setIsLive(false);
    });

    socketRef.current.on('new_alert', (newAlert) => {
      console.log('🚨 NEW REAL-TIME ALERT:', newAlert);
      
      // Add new alert to the beginning of the list
      setAlerts(prevAlerts => [newAlert, ...prevAlerts]);
      setLogs(prevLogs => [newAlert, ...prevLogs]);
      
      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification('⚠️ Protego Alert', {
          body: `${newAlert.risk_level} risk detected: ${newAlert.tx_hash?.slice(0, 16)}...`,
          icon: '/favicon.ico'
        });
      }
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsLive(false);
    });

    // Fallback: still poll metrics every 30 seconds
    const metricsInterval = setInterval(loadMetrics, 30000);

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      clearInterval(metricsInterval);
    };
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesRisk = filterRisk === 'ALL' || log.risk_level === filterRisk;
    const matchesSearch = !searchTerm || 
      log.tx_hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.from?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <ParticlesBackground />

      {/* Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <Navbar />

        {/* Dashboard Header */}
        <div className="pt-28 px-6 mb-8">
          <div className="max-w-[1920px] mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="p-4 rounded-2xl glass-card border border-neon-cyan/30 glow-cyan">
                  <Shield className="w-8 h-8 text-neon-cyan" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gradient-cyan">Security Dashboard</h1>
                  <p className="text-protego-text/60">Real-time MEV Detection & Protection</p>
                </div>
              </div>

              <button
                onClick={downloadFullReport}
                disabled={downloadingReport}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-blue text-white font-bold hover:shadow-neon-strong transition-all duration-300 disabled:opacity-50 flex items-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>{downloadingReport ? 'Generating...' : 'Download Report'}</span>
              </button>
            </div>

            {/* Stats Cards */}
            {metrics && <StatsCards stats={metrics.totalStats} />}
          </div>
        </div>

        {/* Three-Column Layout */}
        <div className="px-6 pb-12">
          <div className="max-w-[1920px] mx-auto grid grid-cols-12 gap-6">
            {/* Left Column - Live Alerts Feed */}
            <div className="col-span-12 lg:col-span-3">
              <div className="glass-strong p-6 rounded-2xl border border-neon-cyan/30 h-[calc(100vh-400px)] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-neon-cyan flex items-center space-x-2">
                    <Activity className="w-6 h-6 animate-pulse" />
                    <span>Live Alerts</span>
                  </h2>
                  <div className="flex items-center space-x-3">
                    {/* Live Connection Status */}
                    <div className="flex items-center space-x-2">
                      {isLive ? (
                        <>
                          <Radio className="w-4 h-4 text-green-400 animate-pulse" />
                          <span className="text-xs text-green-400 font-semibold">LIVE</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-xs text-red-400 font-semibold">OFFLINE</span>
                        </>
                      )}
                    </div>
                    {/* Alert Count */}
                    <div className="px-3 py-1 rounded-lg bg-neon-cyan/20 text-neon-cyan text-sm font-bold">
                      {alerts.length}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                  {alerts.length === 0 ? (
                    <div className="text-center py-12">
                      <Shield className="w-16 h-16 text-protego-text/30 mx-auto mb-4" />
                      <p className="text-protego-text/50">No alerts detected</p>
                      <p className="text-xs text-protego-text/30 mt-2">System is monitoring...</p>
                    </div>
                  ) : (
                    alerts.map(alert => (
                      <LiveAlertCard
                        key={alert.id}
                        alert={alert}
                        onClick={() => setSelectedAlert(alert)}
                        onProtect={(a) => { setSelectedAlert(a); setShowProtectModal(true); }}
                        onAnalyze={(a) => setSelectedAlert(a)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Center Column - Analytics & Charts */}
            <div className="col-span-12 lg:col-span-6">
              <div className="space-y-6">
                {/* Charts */}
                {metrics ? (
                  <>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="glass-strong p-6 rounded-2xl border border-neon-cyan/30">
                        <SimulationTrendChart data={metrics.txsOverTime} />
                      </div>
                      <div className="glass-strong p-6 rounded-2xl border border-neon-cyan/30">
                        <RiskPieChart data={metrics.riskLevels} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="glass-strong p-6 rounded-2xl border border-neon-cyan/30">
                        <ExecutionBarChart data={metrics.executionStatus} />
                      </div>
                      <div className="glass-strong p-6 rounded-2xl border border-neon-cyan/30">
                        <ProtectionDonutChart data={metrics.protectionRate} />
                      </div>
                    </div>

                    <div className="glass-strong p-6 rounded-2xl border border-neon-cyan/30">
                      <LossProfitChart data={metrics.lossTrend} />
                    </div>
                  </>
                ) : (
                  <div className="glass-strong p-12 rounded-2xl border border-neon-cyan/30 text-center">
                    <div className="animate-pulse">
                      <TrendingUp className="w-16 h-16 text-neon-cyan mx-auto mb-4" />
                      <p className="text-protego-text/50">Loading analytics...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Logs & Reports Panel */}
            <div className="col-span-12 lg:col-span-3">
              <div className="glass-strong p-6 rounded-2xl border border-neon-cyan/30 h-[calc(100vh-400px)] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-neon-cyan flex items-center space-x-2">
                    <Activity className="w-6 h-6" />
                    <span>Forensic Logs</span>
                  </h2>
                </div>

                {/* Filters */}
                <div className="space-y-3 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-protego-text/50" />
                    <input
                      type="text"
                      placeholder="Search tx hash or address..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 rounded-lg glass border border-neon-cyan/30 text-protego-text placeholder-protego-text/50 focus:outline-none focus:border-neon-cyan transition-all"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-protego-text/50 hover:text-neon-cyan"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {['ALL', 'HIGH', 'MEDIUM', 'SAFE'].map(risk => (
                      <button
                        key={risk}
                        onClick={() => setFilterRisk(risk)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                          filterRisk === risk
                            ? 'bg-neon-cyan/30 text-neon-cyan border border-neon-cyan/50'
                            : 'glass border border-neon-cyan/20 text-protego-text/60 hover:border-neon-cyan/40'
                        }`}
                      >
                        {risk}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logs List */}
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                  {filteredLogs.length === 0 ? (
                    <div className="text-center py-12">
                      <Filter className="w-16 h-16 text-protego-text/30 mx-auto mb-4" />
                      <p className="text-protego-text/50">No logs found</p>
                      <p className="text-xs text-protego-text/30 mt-2">Adjust filters to see more</p>
                    </div>
                  ) : (
                    filteredLogs.map((log, i) => <LogEntry key={i} log={log} />)
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showReSimulateModal && selectedAlert && (
        <ReSimulateModal
          txHash={selectedAlert.tx_hash}
          onClose={() => {
            setShowReSimulateModal(false);
            loadAlerts();
          }}
        />
      )}

      {showProtectModal && selectedAlert && (
        <ProtectModal
          alert={selectedAlert}
          onClose={() => {
            setShowProtectModal(false);
            loadAlerts();
          }}
        />
      )}

      {/* Proty Chat Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-blue text-3xl shadow-neon-strong hover:scale-110 transition-all duration-300 z-40 flex items-center justify-center animate-bounce-slow"
        title="Chat with Proty"
      >
        {isChatOpen ? '✕' : '💬'}
      </button>

      <ProtyChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
