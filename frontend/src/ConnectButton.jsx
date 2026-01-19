import { useContext } from 'react';
import WalletConnectContext from './context/WalletConnectContext';

const ConnectButton = () => {
  const { account, isReady, connectWallet, disconnectWallet } = useContext(WalletConnectContext);

  if (!isReady) return <div>Loading...</div>;

  if (!account?.address) {
    return <button onClick={connectWallet}>Connect Wallet</button>;
  }

  return (
    <div>
      <p>Connected: {account.address.slice(0, 6)}...{account.address.slice(-4)}</p>
      <button onClick={disconnectWallet}>Disconnect</button>
    </div>
  );
};

export default ConnectButton;
