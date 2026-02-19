import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { vi, test, expect, beforeEach } from 'vitest';
import App from './App';

const mockPublicKey = { toBase58: () => 'TestWallet' };

// Mock useWallet
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({
    publicKey: mockPublicKey,
    connected: true,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
  ConnectionProvider: ({ children }) => <div>{children}</div>,
  WalletProvider: ({ children }) => <div>{children}</div>,
}));

// Mock wallet-adapter-react-ui
vi.mock('@solana/wallet-adapter-react-ui', () => ({
  WalletModalProvider: ({ children }) => <div>{children}</div>,
  WalletMultiButton: () => <button>Select Wallet</button>,
}));

const fetchMock = vi.fn((url, options) => {
  const urlString = url.toString();
  if (urlString.includes('/api/verify')) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        status: 'PROBATIONARY',
        scores: {
          gini: '0.5',
          hhi: '0.1',
          syncIndex: '0.42'
        },
        reason: 'High syncIndex detected',
        latencyMs: 150
      }),
    });
  }
  if (urlString.includes('/api/pools/integrity')) {
    return Promise.resolve({
      ok: true,
      json: async () => ({}),
    });
  }
  return Promise.resolve({
      ok: true,
      json: async () => ({}),
  });
});

vi.stubGlobal('fetch', fetchMock);

beforeEach(() => {
    fetchMock.mockClear();
});

test('displays Risk Detail when status is PROBATIONARY', async () => {
  render(<App />);

  // Wait for Verifying to disappear
  await waitForElementToBeRemoved(() => screen.queryByText('Verifying...'), { timeout: 3000 });

  const badge = await screen.findByText('NEW ENTITY');
  expect(badge).toBeInTheDocument();

  // Check for Agent Insight
  expect(screen.getByText(/Agent Insight/i)).toBeInTheDocument();
  expect(screen.getByText(/High syncIndex detected/i)).toBeInTheDocument();
  expect(screen.getByText(/0.42/i)).toBeInTheDocument();
});
