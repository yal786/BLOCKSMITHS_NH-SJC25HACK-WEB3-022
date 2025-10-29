import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
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

function AlertCard({ a, onSelect, onOpenCharts, onIgnore }) {
  const riskColor = a.risk_level === "HIGH" ? "bg-red-600" : a.risk_level === "MEDIUM" ? "bg-yellow-500" : "bg-green-500";
  
  const handleCardClick = (e) => {
    // Don't trigger select if clicking on action buttons
    if (e.target.closest('.action-button')) {
      return;
    }
    onSelect(a);
  };

  const handleIgnore = (e) => {
    e.stopPropagation();
    onIgnore(a);
  };

  const handleAnalytics = (e) => {
    e.stopPropagation();
    onOpenCharts(a);
  };

  return (
    <div className="p-3 rounded bg-slate-800 mb-3 hover:bg-slate-700 transition-colors" onClick={handleCardClick}>
      <div className="flex justify-between mb-3">
        <div className="cursor-pointer flex-1">
          <div className="text-sm text-slate-300">To: {a.to?.slice(0,12)}...</div>
          <div className="text-xs text-slate-400">Hash: {a.tx_hash?.slice(0,12)}...</div>
        </div>
        <div className="text-right">
          <div className={`px-2 py-1 rounded ${riskColor} text-white text-xs`}>{a.risk_level}</div>
          <div className="text-xs text-slate-400">{a.est_loss_usd ? `$${a.est_loss_usd}` : "-"}</div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleIgnore}
          className="action-button flex-1 text-gray-400 hover:text-red-500 hover:bg-slate-700 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
          title="Ignore this alert"
        >
          Ignore
        </button>
        <button
          onClick={handleAnalytics}
          className="action-button flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-all inline-flex items-center justify-center gap-1"
          title="View analytics for this transaction"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Analytics
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [simError, setSimError] = useState(null);
  const [showReSimulateModal, setShowReSimulateModal] = useState(false);
  const [showProtectModal, setShowProtectModal] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [filteredMetrics, setFilteredMetrics] = useState(null);
  const [chartFilter, setChartFilter] = useState(null);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  async function downloadFullReport() {
    setDownloadingReport(true);
    try {
      const response = await fetch('http://localhost:4000/v1/reports/full/pdf', {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

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

  async function load() {
    try {
      const res = await api.get("/v1/alerts");
      setAlerts(res.data || []);
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

  async function loadFilteredMetrics(txHash) {
    try {
      const res = await api.get(`/api/dashboard-metrics?txHash=${txHash}`);
      if (res.data && res.data.ok) {
        setFilteredMetrics(res.data);
      }
    } catch (e) {
      console.error("filtered metrics fetch error", e);
    }
  }

  function handleOpenCharts(alert) {
    setChartFilter({
      txHash: alert.tx_hash,
      contractAddress: alert.to,
      walletAddress: alert.from,
    });
    loadFilteredMetrics(alert.tx_hash);
    setShowAnalytics(true);
  }

  function handleIgnore(alert) {
    const confirmed = window.confirm(`Are you sure you want to ignore this alert?\n\nTransaction: ${alert.tx_hash?.slice(0, 16)}...`);
    if (confirmed) {
      // TODO: Implement ignore functionality with backend API
      console.log('Ignoring alert:', alert.id);
      // For now, just show a message
      alert('Alert marked as ignored (demo mode)');
    }
  }

  function handleResetCharts() {
    setChartFilter(null);
    setFilteredMetrics(null);
    setShowAnalytics(true);
  }

  async function runSimulation(alert) {
    if (!alert.tx_hash) {
      alert('No transaction hash available');
      return;
    }

    setSimulating(true);
    setSimError(null);

    try {
      // Construct transaction object from alert payload
      const tx = {
        from: alert.from || alert.payload?.from,
        to: alert.to || alert.payload?.to,
        data: alert.payload?.data || alert.payload?.input || '0x',
        value: alert.payload?.value || '0x0',
        gas: alert.payload?.gas || '8000000',
        gasPrice: alert.payload?.gasPrice || alert.payload?.gas_price,
        networkId: '1'
      };

      const response = await api.post('/api/simulate', {
        tx,
        txHash: alert.tx_hash,
        victimAddress: alert.from,
        tokenAddress: alert.payload?.tokenAddress,
        baselineTokenOutWei: alert.payload?.expectedOut || '1000000000000000000',
        tokenDecimals: 18,
        tokenUsdPrice: 2500
      });

      if (response.data.ok) {
        // Refresh alerts to get updated values
        await load();
        
        // Update selected alert
        const updatedAlert = alerts.find(a => a.tx_hash === alert.tx_hash);
        if (updatedAlert) {
          setSelected(updatedAlert);
        }
        
        alert(`✅ Simulation complete!\nSlippage: ${response.data.slippagePct?.toFixed(2) || 0}%\nLoss: $${response.data.estLossUsd?.toFixed(2) || 0}`);
      } else {
        setSimError(response.data.error || 'Simulation failed');
      }
    } catch (err) {
      console.error('Simulation error:', err);
      setSimError(err.response?.data?.error || err.message || 'Failed to run simulation');
    } finally {
      setSimulating(false);
    }
  }

  useEffect(() => {
    load();
    loadMetrics();
    const alertInterval = setInterval(load, 3000);
    const metricsInterval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds
    return () => {
      clearInterval(alertInterval);
      clearInterval(metricsInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#071428]">
      <Navbar />

      {showAnalytics ? (
        // Analytics Dashboard View
        <div className="container mx-auto p-6 pt-24">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setShowAnalytics(false);
                  setChartFilter(null);
                  setFilteredMetrics(null);
                }}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all inline-flex items-center gap-2 shadow-lg"
                title="Back to Dashboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <span>📊</span>
                {chartFilter ? 'Transaction Analytics' : 'Analytics Dashboard'}
                {chartFilter && (
                  <span className="text-sm font-normal text-slate-400">
                    for {chartFilter.txHash?.slice(0, 12)}...
                  </span>
                )}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={downloadFullReport}
                disabled={downloadingReport}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 text-white font-semibold transition-all inline-flex items-center gap-2 shadow-lg disabled:cursor-not-allowed"
                title="Download comprehensive report with all alerts, simulations, protections, and analytics"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {downloadingReport ? 'Generating...' : 'Download Full Report'}
              </button>
              {chartFilter && (
                <button
                  onClick={handleResetCharts}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all inline-flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  View Global Metrics
                </button>
              )}
              <span className="text-sm text-slate-400">
                Auto-refresh every 30 seconds
              </span>
            </div>
          </div>

          {chartFilter && (
            <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700/30 rounded-xl">
              <div className="flex items-center gap-3 text-blue-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <div className="font-semibold">Filtered View Active</div>
                  <div className="text-sm text-blue-200 mt-1">
                    Showing analytics for transaction: <span className="font-mono">{chartFilter.txHash}</span>
                  </div>
                  {chartFilter.contractAddress && (
                    <div className="text-sm text-blue-200">
                      Contract: <span className="font-mono">{chartFilter.contractAddress}</span>
                    </div>
                  )}
                  {chartFilter.walletAddress && (
                    <div className="text-sm text-blue-200">
                      Wallet: <span className="font-mono">{chartFilter.walletAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {(filteredMetrics || metrics) ? (
            <>
              <StatsCards stats={(filteredMetrics || metrics).totalStats} />
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <SimulationTrendChart data={(filteredMetrics || metrics).txsOverTime} />
                <RiskPieChart data={(filteredMetrics || metrics).riskLevels} />
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <ExecutionBarChart data={(filteredMetrics || metrics).executionStatus} />
                <ProtectionDonutChart data={(filteredMetrics || metrics).protectionRate} />
              </div>

              <div className="w-full">
                <LossProfitChart data={(filteredMetrics || metrics).lossTrend} />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-6xl mb-4">⏳</div>
                <div className="text-slate-400">Loading analytics...</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Original Alerts Feed View
        <div className="container mx-auto p-6 grid grid-cols-12 gap-6">
        <div className="col-span-3">
          <h3 className="text-slate-300 mb-3">Live Feed</h3>
          {alerts.map(a => (
            <AlertCard 
              key={a.id} 
              a={a} 
              onSelect={setSelected}
              onOpenCharts={handleOpenCharts}
              onIgnore={handleIgnore}
            />
          ))}
          {alerts.length === 0 && <div className="text-slate-500">No alerts yet</div>}
        </div>

        <div className="col-span-9">
          <h2 className="text-white mb-3">Protego Dashboard</h2>
          <div className="p-4 bg-slate-900 rounded min-h-[260px]">
            {!selected ? (
              <div>
                <p className="text-slate-300 mb-4">Select an alert on the left to see details</p>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="p-4 bg-slate-800 rounded">
                    <div className="text-slate-400 text-sm">Total Alerts</div>
                    <div className="text-2xl font-bold text-white mt-2">{alerts.length}</div>
                  </div>
                  <div className="p-4 bg-slate-800 rounded">
                    <div className="text-slate-400 text-sm">High Risk</div>
                    <div className="text-2xl font-bold text-red-500 mt-2">
                      {alerts.filter(a => a.risk_level === 'HIGH').length}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-800 rounded">
                    <div className="text-slate-400 text-sm">Medium Risk</div>
                    <div className="text-2xl font-bold text-yellow-500 mt-2">
                      {alerts.filter(a => a.risk_level === 'MEDIUM').length}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-200">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">Alert Details</h3>
                  <button 
                    onClick={() => setSelected(null)}
                    className="px-3 py-1 text-sm rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
                  >
                    ← Back
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="text-slate-400 text-sm">Transaction Hash</div>
                      <div className="font-mono text-sm mt-1">{selected.tx_hash}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Risk Level</div>
                      <div className={`mt-1 px-3 py-1 rounded inline-block ${
                        selected.risk_level === 'HIGH' ? 'bg-red-600' : 
                        selected.risk_level === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}>
                        {selected.risk_level}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Confidence</div>
                      <div className="text-lg font-bold mt-1">{selected.confidence}%</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-slate-400 text-sm">From Address</div>
                      <div className="font-mono text-sm mt-1">{selected.from || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">To Address</div>
                      <div className="font-mono text-sm mt-1">{selected.to || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-slate-400 text-sm">Estimated Loss (USD)</div>
                      <div className="text-lg font-bold text-red-400 mt-1">
                        ${selected.est_loss_usd ? parseFloat(selected.est_loss_usd).toFixed(2) : '0.00'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Slippage</div>
                      <div className="text-lg font-bold text-yellow-400 mt-1">
                        {selected.slippage_pct ? parseFloat(selected.slippage_pct).toFixed(2) : '0.00'}%
                      </div>
                    </div>
                  </div>

                  {selected.sim_status && (
                    <div className="p-3 bg-slate-800 rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-slate-400 text-sm">Simulation Status</div>
                          <div className={`mt-1 font-semibold ${
                            selected.sim_status === 'done' ? 'text-green-400' : 
                            selected.sim_status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                          }`}>
                            {selected.sim_status.toUpperCase()}
                          </div>
                        </div>
                        {selected.sim_url && (
                          <a 
                            href={selected.sim_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-sm rounded bg-cyan-700 hover:bg-cyan-600 text-white"
                          >
                            View on Tenderly →
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {simError && (
                    <div className="p-3 bg-red-900/30 border border-red-700 rounded">
                      <div className="text-red-400 text-sm">❌ {simError}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-slate-400 text-sm mb-2">Triggered Rules</div>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(selected.rules) ? selected.rules : JSON.parse(selected.rules || '[]')).map((r, i) => (
                        <span key={i} className="px-3 py-1 rounded bg-cyan-900 text-cyan-300 text-sm">
                          {r}
                        </span>
                      ))}
                      {(!selected.rules || (Array.isArray(selected.rules) && selected.rules.length === 0)) && (
                        <span className="text-slate-500 text-sm">No rules triggered</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-sm mb-2">Transaction Payload</div>
                    <pre className="bg-slate-800 p-3 rounded text-xs overflow-auto max-h-48 text-slate-300">
                      {JSON.stringify(selected.payload, null, 2)}
                    </pre>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-700">
                    <button 
                      className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold transition-all" 
                      onClick={() => setShowProtectModal(true)}
                    >
                      🛡️ Protect Transaction
                    </button>
                    <button 
                      className="px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-black font-semibold transition-all"
                      onClick={() => setShowReSimulateModal(true)}
                    >
                      🔬 Re-simulate
                    </button>
                    <button 
                      className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all inline-flex items-center gap-2" 
                      onClick={() => handleOpenCharts(selected)}
                      title="View analytics for this transaction"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Analytics
                    </button>
                    <button 
                      className="px-4 py-2 rounded border border-slate-700 hover:bg-slate-800 text-slate-300 transition-all" 
                      onClick={() => alert('Ignore (demo) - This alert will be marked as ignored')}
                    >
                      Ignore
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {/* Re-Simulate Modal */}
      {showReSimulateModal && selected && (
        <ReSimulateModal 
          txHash={selected.tx_hash} 
          onClose={() => {
            setShowReSimulateModal(false);
            load(); // Refresh alerts after simulation
          }} 
        />
      )}

      {/* Protect Modal */}
      {showProtectModal && selected && (
        <ProtectModal 
          alert={selected} 
          onClose={() => {
            setShowProtectModal(false);
            load(); // Refresh alerts after protection
          }} 
        />
      )}

      {/* Proty Chat Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-full shadow-2xl flex items-center justify-center text-3xl transition-all transform hover:scale-110 z-40"
        title="Chat with Proty - Your Protego AI Assistant"
      >
        {isChatOpen ? '✕' : '💬'}
      </button>

      {/* Proty Chat Component */}
      <ProtyChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
