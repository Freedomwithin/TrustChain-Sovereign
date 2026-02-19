
export const TRUSTED_THRESHOLD = 0.1;
export const PROBATIONARY_THRESHOLD = 0.5;

export const STATUS_THEMES = {
  ERROR: { label: 'INSUFFICIENT DATA', className: 'error', color: 'slate' },
  OFFLINE: { label: 'SENTINEL OFFLINE', className: 'error', color: 'slate' },
  VERIFIED: { label: 'TRUSTED ACTOR', className: 'verified', color: 'neon-green' },
  PROBATIONARY: { label: 'NEW ENTITY', className: 'probationary', color: 'gold' },
  SYBIL: { label: 'POTENTIAL SYBIL 🚨', className: 'sybil', color: 'red' }
};

export const getStatusDisplay = (status, score, error) => {
  if (error) {
      return STATUS_THEMES.OFFLINE;
  }

  if (status === 'ERROR' || score == null || Number.isNaN(score)) {
    return STATUS_THEMES.ERROR;
  }

  if (status === 'VERIFIED') return STATUS_THEMES.VERIFIED;
  if (status === 'PROBATIONARY') return STATUS_THEMES.PROBATIONARY;
  if (status === 'SYBIL') return STATUS_THEMES.SYBIL;

  if (score < TRUSTED_THRESHOLD) return STATUS_THEMES.VERIFIED;
  if (score <= PROBATIONARY_THRESHOLD) return STATUS_THEMES.PROBATIONARY;
  return STATUS_THEMES.SYBIL;
};
