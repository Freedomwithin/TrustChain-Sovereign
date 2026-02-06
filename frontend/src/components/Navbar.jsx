import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const Navbar = () => {
  return (
    <nav className="glass-navbar">
      <div className="logo">
        <span className="icon">🛡️</span>
        <span className="text">TrustChain</span>
      </div>
      <div className="nav-actions">
        <WalletMultiButton className="wallet-btn" />
      </div>
    </nav>
  );
};

export default Navbar;
