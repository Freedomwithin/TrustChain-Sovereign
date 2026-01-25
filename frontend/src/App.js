import { useState, useEffect } from 'react';
import './App.css';

function PoolIntegrityBadge({ poolId = 'RAY123' }) {
  const [integrity, setIntegrity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:3001/api/pool/${poolId}/integrity`)
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
  return (
    <div className="App">
      <h1>TrustChain Demo</h1>
      <h2>Pool Integrity Badge</h2>
      <PoolIntegrityBadge poolId="RAY123" />
      <PoolIntegrityBadge poolId="SOL-USDC" />
    </div>
  );
}

export default App;
