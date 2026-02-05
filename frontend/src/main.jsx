import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { WalletConnectProvider } from './context/WalletConnectContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WalletConnectProvider>
      <App />
    </WalletConnectProvider>
  </React.StrictMode>,
)
