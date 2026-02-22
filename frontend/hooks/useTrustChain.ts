import { useState, useCallback } from 'react';

interface NotarizationResult {
  signature: string;
  gini: string;
  hhi: string;
  pda?: string;
}

interface UseTrustChainReturn {
  notarize: (address: string) => Promise<NotarizationResult | null>;
  data: NotarizationResult | null;
  loading: boolean;
  error: string | null;
}

export const useTrustChain = (): UseTrustChainReturn => {
  const [data, setData] = useState<NotarizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notarize = useCallback(async (address: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch('/api/notarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: address }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Notarization failed');
      }

      const result: NotarizationResult = await response.json();
      setData(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { notarize, data, loading, error };
};
