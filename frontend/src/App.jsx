import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from './components/Navbar.jsx';
import RiskDetail from './components/RiskDetail.jsx';
import { useIntegrity } from './hooks/useIntegrity';
import { getStatusDisplay } from './utils/statusDisplay';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://trustchain-2-backend.vercel.app';

function WalletIntegrity() {
  const { connected } = useWallet();
  const { giniScore, hhiScore, syncIndex, reason, latencyMs, status, loading, error } = useIntegrity();

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

  // error prop is undefined here, but getStatusDisplay handles it being undefined/falsy
  const display = getStatusDisplay(integrity?.status, integrity?.extractivenessScore || 0);

  return (
    <span className={`badge risk-${display.color}`}>
      {display.label}
      <br />
      <small>Gini: {integrity?.giniScore?.toFixed(3) || '0.500'}</small>
    </span>
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
