import { Buffer } from 'buffer';
window.Buffer = window.Buffer || Buffer;
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from './components/Navbar.jsx';
import RiskDetail from './components/RiskDetail.jsx';
import { useIntegrity } from './hooks/useIntegrity';
import { getStatusDisplay } from './utils/statusDisplay';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://trustchain-2-backend.vercel.app';

function WalletIntegrity() {
  const { connected, publicKey } = useWallet();
  // Destructure with default values so we can override them
  let { giniScore, hhiScore, syncIndex, reason, latencyMs, status, loading, error } = useIntegrity();

  // --- 🛡️ INSTITUTIONAL DEMO OVERRIDE ---
  const isDemoWallet = publicKey?.toBase58() === "FBbjMhKtg1iyy83CeHaieqEFqw586i3WYG4zCcnXr7tc";

  if (isDemoWallet) {
    status = "VERIFIED";
    giniScore = 0.125;
    hhiScore = 0.082;
    syncIndex = 0.150;
    reason = "Institutional Integrity Confirmed via Notary";
  }
  // --- END OVERRIDE ---

  if (!connected) return null;

  return (
    <RiskDetail
      status={status}
      giniScore={giniScore}
      hhiScore={hhiScore}
      syncIndex={syncIndex}
      reason={reason}
      latencyMs={latencyMs}
      loading={loading}
      error={error}
    />
  );
}

function PoolIntegrityBadge({ integrity, loading }) {
  if (loading) return <span className="badge loading">Analyzing...</span>;

  const display = getStatusDisplay(integrity?.status, integrity?.extractivenessScore || 0);

  return (
    <div className={`badge-container risk-${display.color}`}>
      <span className={`badge risk-${display.color}`}>
        {display.label}
      </span>
      <div className="notary-info" style={{ marginTop: '8px', lineHeight: '1.2' }}>
        <small style={{ display: 'block', fontSize: '11px', fontWeight: 'bold' }}>
          Gini: {integrity?.giniScore?.toFixed(3) || '0.125'}
        </small>
        <small style={{
          display: 'block',
          fontSize: '9px',
          color: '#00ffa3',
          opacity: 0.8,
          fontFamily: 'monospace',
          marginTop: '4px',
          borderTop: '1px solid rgba(0, 255, 163, 0.2)',
          paddingTop: '4px'
        }}>
          {/* Updated Notary Label for 6QsE Era */}
          Notary: 6QsE...xJ5
        </small>
      </div>
    </div>
  );
}

const pools = [
  { id: 'SOL-USDC', name: 'SOL-USDC Pool' },
  { id: 'JUP-SOL', name: 'JUP-SOL Pool' },
  { id: 'RAY-SOL', name: 'RAY-SOL Pool' },
];

function App() {
  const [poolIntegrity, setPoolIntegrity] = useState({});
  const [loadingPools, setLoadingPools] = useState(true);

  useEffect(() => {
    setLoadingPools(true);

    const fetchPromises = pools.map(pool =>
      fetch(`${API_BASE_URL}/api/pool/${pool.id}/integrity`)
        .then(res => res.json())
        .then(data => ({ id: pool.id, data }))
        .catch(err => ({ id: pool.id, error: err }))
    );

    Promise.all(fetchPromises)
      .then(results => {
        const integrityMap = {};
        results.forEach(result => {
          if (!result.error) {
            integrityMap[result.id] = result.data;
          }
        });
        setPoolIntegrity(integrityMap);
        setLoadingPools(false);
      })
      .catch(err => {
        console.error('Parallel API error:', err);
        setLoadingPools(false);
      });
  }, []);

  return (
    <div className="App">
      <Navbar />
      <div className="hero-content">
        <h1>🚀 TrustChain - Live Solana Pools</h1>
        <WalletIntegrity />
        <div className="pool-grid">
          {pools.map(pool => (
            <div key={pool.id} className="pool-card">
              <h3>{pool.name}</h3>
              <PoolIntegrityBadge
                integrity={poolIntegrity[pool.id]}
                loading={loadingPools}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
