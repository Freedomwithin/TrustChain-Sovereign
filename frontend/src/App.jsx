import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from './components/Navbar.jsx';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://trustchain-2-backend.vercel.app';

function WalletIntegrity() {
  const { publicKey, connected } = useWallet();
  const [giniScore, setGiniScore] = useState(null);
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
        setGiniScore(data.giniScore);
        setLoading(false);
      })
      .catch(err => {
        console.error('Verify error:', err);
        setLoading(false);
      });
    } else {
      setGiniScore(null);
    }
  }, [connected, publicKey]);

  if (!connected) return null;

  return (
    <div className="pool-card" style={{ marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
      <h3>Your Wallet Integrity</h3>
      {loading ? (
        <span className="badge loading">Verifying...</span>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <span className={`badge risk-${giniScore < 0.1 ? 'green' : giniScore <= 0.5 ? 'orange' : 'red'}`}>
            {giniScore < 0.1 ? 'TRUSTED ACTOR ✓' : giniScore <= 0.5 ? 'PROBATIONARY ⚠️' : 'POTENTIAL SYBIL 🚨'}
          </span>
          <div style={{ marginTop: '1rem' }}>
            <small>Personal Gini Score: {giniScore?.toFixed(4)}</small>
          </div>
        </div>
      )}
    </div>
  );
}

function PoolIntegrityBadge({ integrity, loading }) {
  if (loading) return <span className="badge loading">Analyzing...</span>;

  const riskLevel = integrity?.extractivenessScore || 0;
  const riskColor = riskLevel < 0.1 ? 'green' : riskLevel < 0.5 ? 'orange' : 'red';

  return (
    <span className={`badge risk-${riskColor}`}>
      {riskLevel < 0.1 && 'LOW RISK ✓'}
      {riskLevel >= 0.1 && riskLevel < 0.5 && 'MEDIUM RISK ⚠️'}
      {riskLevel >= 0.5 && 'HIGH RISK 🚨'}
      <br />
      <small>Gini: {integrity?.giniScore?.toFixed(3) || 0}</small>
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
    const poolIds = pools.map(p => p.id);
    fetch(`${API_BASE_URL}/api/pools/integrity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ poolIds })
    })
    .then(res => res.json())
    .then(data => {
      setPoolIntegrity(data);
      setLoadingPools(false);
    })
    .catch(err => {
      console.error('Batch API error:', err);
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
