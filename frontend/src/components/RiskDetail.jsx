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
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.8rem', fontFamily: 'monospace' }}>
                [SENTINEL_LATENCY]: {latencyMs.toFixed(0)}ms
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
                <div className="tooltip-container" style={{ width: '100%', borderBottom: 'none' }}>
                  <div className="hhi-bar-labels">
                    <span>Concentration (HHI)</span>
                    <span>{hhiScore.toFixed(4)}</span>
                  </div>
                  <span className="tooltip-text">
                    Herfindahl-Hirschman Index: Detects wallet concentration. {"Scores > 0.25"} indicate "Whale" behavior or low liquidity spread.
                  </span>
                </div>
                <div className="hhi-track">
                  <div
                    className="hhi-fill"
                    style={{
                      width: `${Math.min(hhiScore * 100, 100)}%`,
                      background: (hhiScore > 0.25) ? '#ef4444' : (hhiScore > 0.15) ? '#fbbf24' : '#34d399',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Always show the insight box if there is a reason OR a risk status */}
            {(reason || ['SYBIL', 'PROBATIONARY', 'VERIFIED'].includes(status)) && (
              <div className="insight-box">
                <strong>⚠️ Agent Insight:</strong> {reason || "Sovereign patterns verified."}

                {syncIndex !== null && syncIndex !== undefined && (
                  <div className="tooltip-container" style={{ display: 'block', marginTop: '0.5rem', borderBottom: 'none' }}>
                    <div style={{ fontSize: '0.8rem', color: '#fff', borderTop: '1px solid rgba(255, 215, 0, 0.2)', paddingTop: '0.5rem' }}>
                      Temporal Sync Index: <strong>{syncIndex.toFixed(2)}</strong>
                    </div>
                    <span className="tooltip-text">Measures transaction timing regularity. High values indicate bot activity.</span>
                  </div>
                )}
              </div>
            )}

            {status === 'ERROR' && <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#9ca3af' }}>Insufficient transaction history.</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskDetail;