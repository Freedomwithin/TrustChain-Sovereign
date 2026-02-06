import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Solana Wallet Adapter hooks
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({
    publicKey: null,
    connected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
  ConnectionProvider: ({ children }) => <div>{children}</div>,
  WalletProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock('@solana/wallet-adapter-react-ui', () => ({
  WalletModalProvider: ({ children }) => <div>{children}</div>,
  WalletMultiButton: () => <button>Select Wallet</button>,
}));
