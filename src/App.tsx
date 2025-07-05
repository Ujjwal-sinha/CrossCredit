import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { CivicAuthProvider } from '@civic/auth/react';
import { useUser } from '@civic/auth-web3/react';
import Layout from './components/Layout/Layout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Deposit from './pages/Deposit';
import Borrow from './pages/Borrow';
import PassportNFT from './pages/PassportNFT';
import Repay from './pages/Repay';
import Swap from './pages/Swap';
import CyberBackground from './components/3D/CyberBackground';
import './App.css';

function AuthRedirect() {
  const { user, isAuthenticated } = useUser();
  const navigate = useNavigate();
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);
  return null;
}

function App() {
  useEffect(() => {
    // Hide loading screen after app loads
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
          loadingScreen.remove();
        }, 500);
      }, 2000);
    }
  }, []);

  return (
    <CivicAuthProvider clientId="55df4ea5-c3c5-403f-a8b8-c585d5d2206d">
      <Router>
        <AuthRedirect />
        <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white overflow-x-hidden relative">
          {/* 3D Cyber Background */}
          <CyberBackground />
          {/* Matrix rain effect */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="matrix-bg w-full h-full opacity-20"></div>
          </div>
          <Layout>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/deposit" element={<Deposit />} />
                <Route path="/borrow" element={<Borrow />} />
                <Route path="/passport" element={<PassportNFT />} />
                <Route path="/repay" element={<Repay />} />
                <Route path="/swap" element={<Swap />} />
              </Routes>
            </AnimatePresence>
          </Layout>
          <Toaster 
            position="bottom-right"
            toastOptions={{
              className: 'cyber-glass text-white border border-cyber-500',
              duration: 4000,
              style: {
                background: 'rgba(6, 182, 212, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: 'white',
              },
            }}
          />
        </div>
      </Router>
    </CivicAuthProvider>
  );
}

export default App;