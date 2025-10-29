// frontend/src/components/WalletConnect.jsx
import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

export default function WalletConnect({ onConnected, onDisconnected }) {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);

  // Key in localStorage to remember intention to reconnect (not keys)
  const STORAGE_KEY = "protego_wallet_connected";

  // initialize if user previously connected (optional auto-init)
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached && window.ethereum) {
      // try to re-initialize silently (no permission popup)
      init().catch(()=>{}); // ignore errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // add listeners
  useEffect(() => {
    if (!window.ethereum) return;

    function handleAccountsChanged(accounts) {
      if (!accounts || accounts.length === 0) {
        // user locked or disconnected; clear app state
        doDisconnect();
        return;
      }
      const addr = accounts[0];
      setAddress(addr);
      if (onConnected) onConnected({ address: addr, provider, signer });
    }

    function handleChainChanged() {
      // reload to avoid subtle provider issues
      window.location.reload();
    }

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      try {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, signer]);

  const init = useCallback(async () => {
    if (!window.ethereum) throw new Error("No web3 wallet found");
    const p = new ethers.BrowserProvider(window.ethereum);
    const s = await p.getSigner();
    const addr = await s.getAddress();
    setProvider(p);
    setSigner(s);
    setAddress(addr);
    localStorage.setItem(STORAGE_KEY, "1");
    if (onConnected) onConnected({ address: addr, provider: p, signer: s });
  }, [onConnected]);

  async function connect() {
    setConnecting(true);
    try {
      if (!window.ethereum) {
        alert("No web3 wallet found (install MetaMask or another provider).");
        return;
      }
      // request accounts (this opens the wallet)
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await init();
    } catch (e) {
      console.error("Wallet connect failed", e);
      alert("Wallet connection failed: " + (e.message || e));
    } finally {
      setConnecting(false);
    }
  }

  // Disconnect / Forget: clear app state and localStorage. If provider supports disconnect, call it.
  async function doDisconnect() {
    try {
      // If using WalletConnect or other provider that has disconnect, call it:
      if (provider && provider.provider && typeof provider.provider.disconnect === "function") {
        try {
          await provider.provider.disconnect();
        } catch (e) {
          // ignore provider disconnect errors
        }
      }
    } catch (e) {
      // ignore
    }
    setAddress(null);
    setSigner(null);
    setProvider(null);
    localStorage.removeItem(STORAGE_KEY);
    if (onDisconnected) onDisconnected();
    // small UX feedback
    try { alert("Wallet disconnected. You can reconnect when ready."); } catch(e){}
  }

  function shortAddr(addr) {
    if (!addr) return "";
    return addr.slice(0,6) + "..." + addr.slice(-4);
  }

  function copyAddress() {
    if (navigator.clipboard && address) {
      navigator.clipboard.writeText(address);
      alert("Address copied to clipboard!");
    }
  }

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1 rounded bg-slate-700 text-white text-sm hover:bg-slate-600"
          title={address}
          onClick={copyAddress}
        >
          {shortAddr(address)}
        </button>
        <button
          className="px-3 py-1 rounded border border-slate-600 text-sm text-slate-200 hover:bg-slate-800"
          onClick={doDisconnect}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={connecting}
      className="px-4 py-2 rounded bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {connecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
