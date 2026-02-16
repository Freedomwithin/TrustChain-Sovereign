export interface TemporalObserver {
  gini: number;
  hhi: number;
  syncIndex: number;
}

export interface IntegrityDecision {
  status: 'VERIFIED' | 'PROBATIONARY';
  score: TemporalObserver;
  reason?: string;
}

export class RiskAuditorAgent {
  static readonly PROBATIONARY_SYNC_INDEX_THRESHOLD = 0.35;

  /**
   * Wraps the TemporalObserver results into a JSON decision object for the Notary.
   * Logic: If syncIndex > 0.35, trigger 'Probationary' status.
   */
  public evaluate(data: TemporalObserver): IntegrityDecision {
    // Default status
    let status: IntegrityDecision['status'] = 'VERIFIED';
    let reason: string | undefined;

    // Threshold Alignment: syncIndex > 0.35 -> Probationary
    if (data.syncIndex > RiskAuditorAgent.PROBATIONARY_SYNC_INDEX_THRESHOLD) {
      status = 'PROBATIONARY';
      reason = 'High syncIndex detected (Potential Cluster)';
    }

    return {
      status,
      score: data,
      reason,
    };
  }
}
