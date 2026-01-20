import ReputationScore from './ConnectButton.jsx';
import './App.css';

function App() {
  return (
    <div className="App">
      <div className="header">
        <h1>🛡️ TrustChain</h1>
        <h2>Osmosis DID + Reputation System</h2>
      </div>
      <ReputationScore />
    </div>
  );
}

export default App;
