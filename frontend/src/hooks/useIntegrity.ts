import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://trustchain-2-backend.vercel.app';

export interface IntegrityData {
    giniScore: number | null;
    hhiScore: number | null;
    syncIndex: number | null;
    reason: string | null;
    latencyMs: number | null;
    status: string | null;
    loading: boolean;
    error: string | null;
}

export function useIntegrity(): IntegrityData {
    const { publicKey, connected } = useWallet();
    const [giniScore, setGiniScore] = useState<number | null>(null);
    const [hhiScore, setHhiScore] = useState<number | null>(null);
    const [syncIndex, setSyncIndex] = useState<number | null>(null);
    const [reason, setReason] = useState<string | null>(null);
    const [latencyMs, setLatencyMs] = useState<number | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let abortController = new AbortController();

        if (connected && publicKey) {
            setLoading(true);
            setError(null);

            fetch(`${API_BASE_URL}/api/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: publicKey.toBase58() }),
                signal: abortController.signal
            })
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch integrity score: ${res.status} ${res.statusText}`);
                }
                return res.json();
            })
            .then(data => {
                if (!abortController.signal.aborted) {
                    // Parse new response shape: { status, scores: { gini, hhi, syncIndex }, reason, latencyMs }
                    const scores = data.scores || {};
                    setGiniScore(scores.gini != null ? parseFloat(scores.gini) : null);
                    setHhiScore(scores.hhi != null ? parseFloat(scores.hhi) : null);
                    setSyncIndex(scores.syncIndex != null ? parseFloat(scores.syncIndex) : null);
                    setReason(data.reason || null);
                    setLatencyMs(data.latencyMs != null ? parseFloat(data.latencyMs) : null);
                    setStatus(data.status);
                    setLoading(false);
                }
            })
            .catch(err => {
                if (!abortController.signal.aborted) {
                    console.error('Verify error:', err);
                    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                    // Check for network errors or specific connection issues
                    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network request failed')) {
                        setError('Sentinel Offline - Check RPC Connection');
                    } else {
                        setError(errorMessage);
                    }
                    setLoading(false);
                }
            });
        } else {
            setGiniScore(null);
            setHhiScore(null);
            setSyncIndex(null);
            setReason(null);
            setLatencyMs(null);
            setStatus(null);
            setError(null);
            setLoading(false);
        }

        return () => {
            abortController.abort();
        };
    }, [connected, publicKey]);

    return { giniScore, hhiScore, syncIndex, reason, latencyMs, status, loading, error };
}
