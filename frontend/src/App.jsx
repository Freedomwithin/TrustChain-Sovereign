import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from './components/Navbar.jsx';
import RiskDetail from './components/RiskDetail.jsx';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://trustchain-2-backend.vercel.app';

export const TRUSTED_THRESHOLD = 0.1;
export const PROBATIONARY_THRESHOLD = 0.5;

export const STATUS_THEMES = {
  ERROR: { label: 'INSUFFICIENT DATA', color: 'slate' },
  VERIFIED: { label: 'TRUSTED ACTOR', color: 'neon-green' },
  PROBATIONARY: { label: 'NEW ENTITY', color: 'gold' },
  SYBIL: { label: 'POTENTIAL SYBIL 🚨', color: 'red' }
};

export const getStatusDisplay = (status, score) => {
  if (status === 'ERROR' || score == null || Number.isNaN(score)) {
    return STATUS_THEMES.ERROR;
  }
  if (status === 'VERIFIED') return STATUS_THEMES.VERIFIED;
  if (status === 'PROBATIONARY') return STATUS_THEMES.PROBATIONARY;

  if (score < TRUSTED_THRESHOLD) return STATUS_THEMES.VERIFIED;
  if (score <= PROBATIONARY_THRESHOLD) return STATUS_THEMES.PROBATIONARY;
  return STATUS_THEMES.SYBIL;
};

function WalletIntegrity() {
  const { publicKey, connected } = useWallet();
  const [giniScore, setGiniScore] = useState(null);
  const [hhiScore, setHhiScore] = useState(null);
  const [syncIndex, setSyncIndex] = useState(null);
  const [reason, setReason] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      setLoading(true);
      fetch(`${API_BASE_URL}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: publicKey.toBase58() })
      })
      .then(res => res.json())
      .then(data => {
        setGiniScore(parseFloat(data.giniScore));
        setHhiScore(parseFloat(data.hhiScore));
        setSyncIndex(data.syncIndex !== undefined ? parseFloat(data.syncIndex) : null);
        setReason(data.reason || null);
        setStatus(data.status);
        setLoading(false);
      })
      .catch(err => {
        console.error('Verify error:', err);
        setLoading(false);
      });
    } else {
      setGiniScore(null);
      setHhiScore(null);
      setSyncIndex(null);
      setReason(null);
    }
  }, [connected, publicKey]);

  if (!connected) return null;

  return (
    <RiskDetail
      status={status}
      giniScore={giniScore}
      hhiScore={hhiScore}
      syncIndex={syncIndex}
      reason={reason}
      loading={loading}
    />
  );
}

function PoolIntegrityBadge({ integrity, loading }) {
  if (loading) return <span className="badge loading">Analyzing...</span>;

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
  }, []); // Added closing brace for useEffect

  // RESTORED RETURN BLOCK
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

