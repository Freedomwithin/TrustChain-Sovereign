import ReputationScore from './ConnectButton.jsx';
import './App.css';

function App() {
  return (
    <div className="App min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl">
          🛡️ TrustChain
        </h1>
        <h2 className="text-2xl text-white/80 font-light tracking-wide">
          Osmosis DID + Reputation System
        </h2>
      </div>
      <ReputationScore />
    </div>
  );
}

export default App;
