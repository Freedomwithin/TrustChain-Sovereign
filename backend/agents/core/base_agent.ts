export interface TemporalObserver {
  gini: number;
  hhi: number;
  syncIndex: number;
}

export interface IntegrityDecision {
  status: 'VERIFIED' | 'PROBATIONARY' | 'ERROR';
  score: TemporalObserver;
  reason?: string;
}

export class RiskAuditorAgent {
  /**
   * Wraps the TemporalObserver results into a JSON decision object for the Notary.
   * Logic: If syncIndex > 0.35, trigger 'Probationary' status.
   */
  public evaluate(data: TemporalObserver): IntegrityDecision {
    // Default status
    let status: IntegrityDecision['status'] = 'VERIFIED';
    let reason: string | undefined;

    // Threshold Alignment: syncIndex > 0.35 -> Probationary
    if (data.syncIndex > 0.35) {
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
