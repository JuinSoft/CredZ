import React, { useState, createContext } from 'react';
import './App.css';
import { GoldRushProvider } from '@covalenthq/goldrush-kit';
import '@covalenthq/goldrush-kit/styles.css';
import { ethers } from 'ethers';
import { Routes, Route } from "react-router-dom";
import Borrow from './components/Borrow';
import Lend from './components/Lend';
import CreditScore from './components/CreditScore';
import VerifyScore from './components/VerifyScore';
import Error from './components/Error';
import Navbar from './components/Navbar'; // Import the Navbar component
import config from './config/Constants.json';
const apiKey = config.api.covalent;
export const WalletContext = createContext(null);

function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [chainID, setChainID] = useState(null);

  const handleWalletConnect = async () => {
    if (!walletConnected) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const chainID = await provider.getNetwork();
        setChainID(parseInt(chainID.chainId));
        setWalletConnected(true);
        setWalletAddress(address);
      } catch (error) {
        console.error("Wallet connection failed:", error);
      }
    } else {
      setWalletConnected(false);
      setWalletAddress('');
    }
  };

  const connectChainId = 11155111;

  return (
    <WalletContext.Provider value={{ walletAddress, setWalletAddress }}>
      <GoldRushProvider apikey={apiKey}>
        <div className="bg-gray-900 text-white min-h-screen">
          <Navbar walletConnected={walletConnected} handleWalletConnect={handleWalletConnect} walletAddress={walletAddress} />
          {walletConnected && chainID === connectChainId && (
            <Routes>
              <Route path="/" element={<Borrow walletConnected={walletConnected} walletAddress={walletAddress} />} />
              <Route path="/lend" element={<Lend />} />
              <Route path="/credit-score" element={<CreditScore />} />
              {/* <Route path="/credit-verify" element={<VerifyScore />} /> */}
              <Route path="*" element={<Error />} />
            </Routes>
          )}
          {
            chainID != connectChainId && (
              <div className="flex justify-center items-center h-screen">
                <p className="text-white text-2xl">Please connect to Scroll Testnet</p>
              </div>
            )
          }
          {
            !walletConnected && (
              <div className="flex justify-center items-center h-screen">
                <p className="text-white text-2xl">Please connect your wallet to Scroll testnet!</p>
              </div>
            )
          }
        </div>
      </GoldRushProvider>
    </WalletContext.Provider>
  );
}

export default App;