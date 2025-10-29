import React, { useEffect, useState, useRef } from "react";
import { Shield, Activity, Download, Filter, Search, X, Radio, ArrowLeft, AlertTriangle, TrendingUp } from "lucide-react";
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
const LiveAlertCard = ({ alert, isSelected, onClick }) => {
  const getRiskColor = () => {
    switch (alert.risk_level) {
      case 'HIGH': return 'border-red-500/50';
      case 'MEDIUM': return 'border-yellow-500/50';
      default: return 'border-green-500/50';
    }
  };

  const getRiskBadgeColor = () => {
    switch (alert.risk_level) {
      case 'HIGH': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default: return 'bg-green-500/20 text-green-400 border-green-500/50';
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
      className={`glass-card p-4 rounded-xl border-l-4 transition-all duration-300 cursor-pointer animate-slide-in ${
        getRiskColor()
      } ${
        isSelected 
          ? 'shadow-neon-strong border-neon-cyan bg-neon-cyan/10' 
          : 'hover:shadow-neon card-hover'
      }`}
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
        <div className={`px-3 py-1 rounded-lg text-xs font-bold border ${getRiskBadgeColor()}`}>
          {alert.risk_level}
        </div>
      </div>

      <div className="space-y-2">
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
    </div>
  );
};

// Empty State Component
const EmptyAnalyticsState = () => (
  <div className="flex flex-col items-center justify-center h-full text-center py-20">
    <div className="relative mb-8">
      <div className="absolute inset-0 bg-neon-cyan/20 blur-3xl rounded-full animate-pulse-slow" />
      <Shield className="w-24 h-24 text-neon-cyan/50 relative animate-float" strokeWidth={1.5} />
    </div>
    <h3 className="text-2xl font-bold text-protego-text/70 mb-3">
      Select an Alert to View Analytics
    </h3>
    <p className="text-protego-text/50 max-w-md">
      Click on any alert from the Live Feed to see detailed analytics, transaction information, and protection options.
    </p>
    <div className="mt-8 flex items-center space-x-2 text-sm text-protego-text/40">
      <Activity className="w-4 h-4" />
      <span>Waiting for selection...</span>
    </div>
  </div>
);

// Alert Details & Analytics Component
const AlertAnalytics = ({ alert, metrics, onProtect, onReSimulate, onClose }) => {
  const getRiskColor = () => {
    switch (alert.risk_level) {
      case 'HIGH': return 'text-red-400 bg-red-500/20 border-red-500/50';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      default: return 'text-green-400 bg-green-500/20 border-green-500/50';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg glass border border-neon-cyan/30 hover:border-neon-cyan transition-all"
              title="Back to feed"
            >
              <ArrowLeft className="w-5 h-5 text-neon-cyan" />
            </button>
            <h2 className="text-2xl font-bold text-neon-cyan">Alert Analysis</h2>
          </div>
          <div className="flex items-center space-x-3 ml-14">
            <div className={`px-4 py-2 rounded-xl text-sm font-bold border ${getRiskColor()}`}>
              {alert.risk_level} RISK
            </div>
            <div className="px-4 py-2 rounded-xl glass border border-neon-cyan/30 text-sm">
              Confidence: <span className="text-neon-cyan font-bold">{alert.confidence}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="glass-card p-6 rounded-2xl border border-neon-cyan/30">
        <h3 className="text-lg font-bold text-neon-cyan mb-4">Transaction Details</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-protego-text/60 mb-1">Transaction Hash</div>
              <div className="text-sm font-mono text-protego-text break-all">{alert.tx_hash}</div>
            </div>
            <div>
              <div className="text-sm text-protego-text/60 mb-1">Timestamp</div>
              <div className="text-sm text-protego-text">
                {new Date(alert.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-protego-text/60 mb-1">From Address</div>
              <div className="text-sm font-mono text-protego-text break-all">{alert.from || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-protego-text/60 mb-1">To Address</div>
              <div className="text-sm font-mono text-protego-text break-all">{alert.to || 'N/A'}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-neon-cyan/20">
            <div>
              <div className="text-sm text-protego-text/60 mb-1">Estimated Loss</div>
              <div className="text-xl font-bold text-red-400">
                ${alert.est_loss_usd ? parseFloat(alert.est_loss_usd).toFixed(2) : '0.00'}
              </div>
            </div>
            <div>
              <div className="text-sm text-protego-text/60 mb-1">Slippage</div>
              <div className="text-xl font-bold text-yellow-400">
                {alert.slippage_pct ? parseFloat(alert.slippage_pct).toFixed(2) : '0.00'}%
              </div>
            </div>
            <div>
              <div className="text-sm text-protego-text/60 mb-1">Confidence Score</div>
              <div className="text-xl font-bold text-neon-cyan">{alert.confidence}%</div>
            </div>
          </div>

          {alert.rules && Array.isArray(alert.rules) && alert.rules.length > 0 && (
            <div className="pt-3 border-t border-neon-cyan/20">
              <div className="text-sm text-protego-text/60 mb-2">Triggered Rules</div>
              <div className="flex flex-wrap gap-2">
                {alert.rules.map((rule, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-lg bg-neon-cyan/20 text-neon-cyan text-sm border border-neon-cyan/30"
                  >
                    {rule}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onProtect}
          className="flex-1 py-4 rounded-xl bg-gradient-to-r from-neon-blue to-neon-cyan text-white font-bold text-lg hover:shadow-neon-strong transition-all duration-300 flex items-center justify-center space-x-2"
        >
          <Shield className="w-6 h-6" />
          <span>Protect Transaction</span>
        </button>
        <button
          onClick={onReSimulate}
          className="flex-1 py-4 rounded-xl glass border border-neon-cyan/30 text-neon-cyan font-bold text-lg hover:border-neon-cyan hover:shadow-neon transition-all duration-300 flex items-center justify-center space-x-2"
        >
          <Activity className="w-6 h-6" />
          <span>Re-Simulate</span>
        </button>
      </div>

      {/* Analytics Charts */}
      {metrics ? (
        metrics.txsOverTime || metrics.riskLevels || metrics.executionStatus ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-neon-cyan">Transaction Analytics</h3>
              {metrics._mock && (
                <span className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs border border-purple-500/50 flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-9h2v4h-2V7zm0 5h2v2h-2v-2z"/>
                  </svg>
                  <span>Mock Data (Testing)</span>
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="glass-card p-6 rounded-2xl border border-neon-cyan/30">
                <SimulationTrendChart data={metrics.txsOverTime} />
              </div>
              <div className="glass-card p-6 rounded-2xl border border-neon-cyan/30">
                <RiskPieChart data={metrics.riskLevels} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="glass-card p-6 rounded-2xl border border-neon-cyan/30">
                <ExecutionBarChart data={metrics.executionStatus} />
              </div>
              <div className="glass-card p-6 rounded-2xl border border-neon-cyan/30">
                <ProtectionDonutChart data={metrics.protectionRate} />
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-neon-cyan/30">
              <LossProfitChart data={metrics.lossTrend} />
            </div>
          </div>
        ) : (
          <div className="glass-card p-12 rounded-2xl border border-neon-cyan/30 text-center">
            <div className="flex flex-col items-center">
              <AlertTriangle className="w-16 h-16 text-yellow-400 mb-4 opacity-50" />
              <p className="text-protego-text/70 font-semibold mb-2">No analytics available for this transaction yet</p>
              <p className="text-protego-text/50 text-sm">Run a simulation or protection to generate analytics data</p>
            </div>
          </div>
        )
      ) : (
        <div className="glass-card p-12 rounded-2xl border border-neon-cyan/30 text-center">
          <div className="animate-pulse flex flex-col items-center">
            <TrendingUp className="w-16 h-16 text-neon-cyan mx-auto mb-4 opacity-50 animate-spin-slow" />
            <p className="text-protego-text/70 font-semibold mb-2">Fetching updated analytics...</p>
            <p className="text-protego-text/50 text-sm">This may take a few seconds</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Log Entry Component
const LogEntry = ({ log, onClick }) => {
  const getStatusColor = () => {
    if (log.sim_status === 'done') return 'text-green-400';
    if (log.sim_status === 'failed') return 'text-red-400';
    return 'text-yellow-400';
  };

  return (
    <div 
      className="glass-card p-4 rounded-xl hover:shadow-neon transition-all duration-300 animate-slide-in cursor-pointer"
      onClick={onClick}
    >
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
          <span className="text-protego-text/50">Confidence:</span>
          <span className="text-neon-cyan ml-1 font-bold">{log.confidence}%</span>
        </div>
      </div>
    </div>
  );
};

export default function DashboardRealTime() {
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [alertMetrics, setAlertMetrics] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
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
      setLogs(res.data || []);
    } catch (e) {
      console.error("alerts fetch", e);
    }
  }

  async function loadGlobalStats() {
    try {
      let res = await api.get("/api/dashboard-metrics");
      
      // If no real data, use mock data
      if (res.data && res.data.ok) {
        const hasData = res.data.totalStats?.totalEvents > 0;
        
        if (!hasData) {
          console.log("📊 No real global stats, using mock data");
          res = await api.get("/api/mock-dashboard-metrics");
        }
        
        setGlobalStats(res.data.totalStats);
      }
    } catch (e) {
      console.error("stats fetch error", e);
      
      // Fallback to mock
      try {
        const mockRes = await api.get("/api/mock-dashboard-metrics");
        setGlobalStats(mockRes.data.totalStats);
      } catch (mockErr) {
        console.error("mock stats also failed", mockErr);
      }
    }
  }

  async function loadAlertMetrics(txHash) {
    try {
      setAlertMetrics(null); // Reset
      
      // Try real data first
      let res = await api.get(`/api/dashboard-metrics?txHash=${txHash}`);
      
      // If no real data available, use mock data for testing
      if (res.data && res.data.ok) {
        const hasData = res.data.txsOverTime?.length > 0 || 
                       res.data.totalStats?.totalEvents > 0;
        
        if (!hasData) {
          console.log(`📊 No real data for ${txHash.slice(0, 16)}..., using mock analytics`);
          res = await api.get(`/api/mock-dashboard-metrics?txHash=${txHash}`);
        }
        
        setAlertMetrics(res.data);
      }
    } catch (e) {
      console.error("alert metrics fetch error", e);
      
      // Fallback to mock data on error
      try {
        console.log(`📊 Fallback to mock analytics for ${txHash.slice(0, 16)}...`);
        const mockRes = await api.get(`/api/mock-dashboard-metrics?txHash=${txHash}`);
        setAlertMetrics(mockRes.data);
      } catch (mockErr) {
        console.error("mock metrics also failed", mockErr);
      }
    }
  }

  function handleAlertClick(alert) {
    setSelectedAlert(alert);
    loadAlertMetrics(alert.tx_hash);
  }

  function handleCloseAnalytics() {
    setSelectedAlert(null);
    setAlertMetrics(null);
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
    loadGlobalStats();

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
      
      // Update global stats
      loadGlobalStats();
      
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

    // Refresh global stats every 30 seconds
    const statsInterval = setInterval(loadGlobalStats, 30000);

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      clearInterval(statsInterval);
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
            {globalStats && <StatsCards stats={globalStats} />}
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
                      <p className="text-xs text-protego-text/30 mt-2">
                        {isLive ? 'Monitoring mempool...' : 'Waiting for connection...'}
                      </p>
                    </div>
                  ) : (
                    alerts.map(alert => (
                      <LiveAlertCard
                        key={alert.id}
                        alert={alert}
                        isSelected={selectedAlert?.id === alert.id}
                        onClick={() => handleAlertClick(alert)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Center Column - Alert Analytics (Shows only when alert selected) */}
            <div className="col-span-12 lg:col-span-6">
              <div className="glass-strong p-6 rounded-2xl border border-neon-cyan/30 h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
                {selectedAlert ? (
                  <AlertAnalytics
                    alert={selectedAlert}
                    metrics={alertMetrics}
                    onProtect={() => setShowProtectModal(true)}
                    onReSimulate={() => setShowReSimulateModal(true)}
                    onClose={handleCloseAnalytics}
                  />
                ) : (
                  <EmptyAnalyticsState />
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
                    filteredLogs.map((log, i) => (
                      <LogEntry 
                        key={i} 
                        log={log}
                        onClick={() => handleAlertClick(log)}
                      />
                    ))
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
            loadGlobalStats();
            // Reload analytics for selected alert if still selected
            if (selectedAlert) {
              loadAlertMetrics(selectedAlert.tx_hash);
            }
          }}
        />
      )}

      {showProtectModal && selectedAlert && (
        <ProtectModal
          alert={selectedAlert}
          onClose={() => {
            setShowProtectModal(false);
            loadAlerts();
            loadGlobalStats();
            // Reload analytics for selected alert if still selected
            if (selectedAlert) {
              loadAlertMetrics(selectedAlert.tx_hash);
            }
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
