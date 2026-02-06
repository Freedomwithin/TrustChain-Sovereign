import { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import './App.css';

function PoolIntegrityBadge({ poolId = 'RAY123' }) {
  const [integrity, setIntegrity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://trust-chain-backend-1nixsz5ct-jonathon-koerners-projects.vercel.app/api/pool/${poolId}/integrity`)
      .then(res => res.json())
      .then(data => {
        setIntegrity(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('API error:', err);
        setLoading(false);
      });
  }, [poolId]);

  if (loading) return <span className="badge loading">Analyzing...</span>;

  const riskLevel = integrity?.extractivenessScore || 0;
  const riskColor = riskLevel < 0.1 ? 'green' : riskLevel < 0.5 ? 'orange' : 'red';

  return (
    <span className={`badge risk-${riskColor}`}>
      {riskLevel < 0.1 && 'LOW RISK ✓'}
      {riskLevel < 0.5 && 'MEDIUM RISK ⚠️'}
      {riskLevel >= 0.5 && 'HIGH RISK 🚨'}
      <br />
      <small>Gini: {integrity?.giniScore?.toFixed(3) || 0}</small>
    </span>
  );
}

function App() {
  const pools = [
    { id: 'SOL-USDC', name: 'SOL-USDC Pool' },
    { id: 'JUP-SOL', name: 'JUP-SOL Pool' },
    { id: 'RAY-SOL', name: 'RAY-SOL Pool' },
  ];

  return (
    <div className="App">
      <Navbar />
      <div className="hero-content">
        <h1>🚀 TrustChain - Live Solana Pools</h1>
        <div className="pool-grid">
          {pools.map(pool => (
            <div key={pool.id} className="pool-card">
              <h3>{pool.name}</h3>
              <PoolIntegrityBadge poolId={pool.id} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
