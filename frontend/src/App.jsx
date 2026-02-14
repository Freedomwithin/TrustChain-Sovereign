import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from './components/Navbar.jsx';
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
    }
  }, [connected, publicKey]);

  if (!connected) return null;

  const display = getStatusDisplay(status, giniScore);

  return (
    <div className="wallet-integrity-card" style={{ marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
      <h3>Your Wallet Integrity</h3>
      {loading ? (
        <span className="badge loading">Verifying...</span>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <span className={`badge risk-${display.color}`}>
            {display.label}
          </span>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'center' }}>
               <small>Personal Gini Score: {giniScore?.toFixed(4)}</small>
               {hhiScore != null && !Number.isNaN(hhiScore) && (
                 <div style={{ width: '100%', maxWidth: '200px', margin: '0.5rem auto' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                     <span>Concentration (HHI)</span>
                     <span>{hhiScore.toFixed(4)}</span>
                   </div>
                   <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                     <div style={{
                       width: `${Math.min(hhiScore * 100, 100)}%`,
                       height: '100%',
                       background: hhiScore > 0.25 ? '#ef4444' : hhiScore > 0.15 ? '#fbbf24' : '#34d399',
                       transition: 'width 0.5s ease'
                     }} />
                   </div>
                 </div>
               )}
            </div>
            {status === 'PROBATIONARY' && <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#ffd700' }}>Limited history: Minimum 2 transactions required for full verification.</div>}
            {status === 'ERROR' && <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#708090' }}>Insufficient transaction history for analysis</div>}
          </div>
        </div>
      )}
    </div>
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
