import React from 'react';
import './RiskDetail.css';

const TRUSTED_THRESHOLD = 0.1;
const PROBATIONARY_THRESHOLD = 0.5;

const STATUS_THEMES = {
  ERROR: { label: 'INSUFFICIENT DATA', className: 'error' },
  VERIFIED: { label: 'TRUSTED ACTOR', className: 'verified' },
  PROBATIONARY: { label: 'NEW ENTITY', className: 'probationary' },
  SYBIL: { label: 'POTENTIAL SYBIL 🚨', className: 'sybil' }
};

const getStatusDisplay = (status, score) => {
  if (status === 'ERROR' || score == null || Number.isNaN(score)) {
    return STATUS_THEMES.ERROR;
  }
  if (status === 'VERIFIED') return STATUS_THEMES.VERIFIED;
  if (status === 'PROBATIONARY') return STATUS_THEMES.PROBATIONARY;

  if (score < TRUSTED_THRESHOLD) return STATUS_THEMES.VERIFIED;
  if (score <= PROBATIONARY_THRESHOLD) return STATUS_THEMES.PROBATIONARY;
  return STATUS_THEMES.SYBIL;
};

const RiskDetail = ({ status, giniScore, hhiScore, syncIndex, reason, loading }) => {
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

  const display = getStatusDisplay(status, giniScore);

  return (
    <div className="risk-detail-card">
      <h3>Your Wallet Integrity</h3>
      <div className="risk-detail-content">
        <span className={`risk-badge ${display.className}`}>
          {display.label}
        </span>

        <div className="metrics-container">
          {/* Gini Score with Tooltip */}
          <div className="tooltip-container">
            <small>Personal Gini Score: {giniScore?.toFixed(4) || 'N/A'}</small>
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
        </div>

        {/* Probationary Insight */}
        {status === 'PROBATIONARY' && (
          <div className="insight-box">
            {reason ? (
               <>
                 <strong>⚠️ Agent Insight:</strong> {reason}
                 {syncIndex !== null && syncIndex !== undefined && (
                   <div className="tooltip-container" style={{ display: 'block', marginTop: '0.2rem' }}>
                      <div style={{ fontSize: '0.75rem' }}>
                        Temporal Sync Index: <strong>{syncIndex.toFixed(2)}</strong> (High Correlation)
                      </div>
                      <span className="tooltip-text">Temporal Sync Index: Measures transaction timing regularity. High values indicate bot activity.</span>
                   </div>
                 )}
               </>
            ) : (
               "Limited history: Minimum 2 transactions required for full verification."
            )}
          </div>
        )}

        {status === 'ERROR' && <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#9ca3af' }}>Insufficient transaction history for analysis</div>}
      </div>
    </div>
  );
};

export default RiskDetail;
