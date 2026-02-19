import React from 'react';
import './RiskDetail.css';
import { getStatusDisplay } from '../utils/statusDisplay';

const RiskDetail = ({ status, giniScore, hhiScore, syncIndex, reason, latencyMs, loading, error }) => {
  if (loading) {
    return (
      <div className="risk-detail-card">
        <h3>Your Wallet Integrity</h3>
        <div className="risk-detail-content">
          <span className="loading-spinner">Verifying...</span>
        </div>
      </div>
    );
  }

  const display = getStatusDisplay(status, giniScore, error);

  return (
    <div className="risk-detail-card">
      <h3>Your Wallet Integrity</h3>
      <div className="risk-detail-content">
        <span className={`risk-badge ${display.className}`}>
          {display.label}
        </span>

        {error ? (
           <div className="insight-box" style={{ color: '#ef4444', borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}>
             <strong>Connection Error:</strong> {error}
           </div>
        ) : (
          <div className="metrics-container">
            {/* System Latency */}
            {latencyMs != null && (
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                    System Latency: {latencyMs.toFixed(0)}ms
                </div>
            )}

            {/* Gini Score with Tooltip */}
            <div className="tooltip-container">
              <small>Personal Gini Score: {Number.isFinite(giniScore) ? giniScore.toFixed(4) : 'N/A'}</small>
              <span className="tooltip-text">Gini Coefficient: Measures wealth inequality (0-1). Lower is better distribution.</span>
            </div>

            {/* HHI Score */}
            {hhiScore != null && !Number.isNaN(hhiScore) && (
              <div className="hhi-bar-container">
                 <div className="hhi-bar-labels">
                   <span>Concentration (HHI)</span>
                   <span>{hhiScore.toFixed(4)}</span>
                 </div>
                 <div className="hhi-track">
                   <div
                     className="hhi-fill"
                     style={{
                       width: `${Math.min(hhiScore * 100, 100)}%`,
                       background: hhiScore > 0.25 ? '#ef4444' : hhiScore > 0.15 ? '#fbbf24' : '#34d399',
                     }}
                   />
                 </div>
              </div>
            )}

            {/* Reason Tooltip/Insight */}
            {reason && (
                <div className="insight-box">
                    <strong>⚠️ Agent Insight:</strong> {reason}
                    {syncIndex !== null && syncIndex !== undefined && (
                        <div className="tooltip-container" style={{ display: 'block', marginTop: '0.2rem' }}>
                            <div style={{ fontSize: '0.75rem' }}>
                                Temporal Sync Index: <strong>{syncIndex.toFixed(2)}</strong>
                            </div>
                            <span className="tooltip-text">Temporal Sync Index: Measures transaction timing regularity. High values indicate bot activity.</span>
                        </div>
                    )}
                </div>
            )}

            {!reason && status === 'PROBATIONARY' && (
                <div className="insight-box">
                    Limited history: Minimum 3 transactions required for full verification.
                </div>
            )}

             {status === 'ERROR' && <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#9ca3af' }}>Insufficient transaction history for analysis</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskDetail;
