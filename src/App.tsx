import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { CivicAuthProvider, UserButton } from '@civic/auth-web3/react';
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

// Add TypeScript type for window.civicAuthReady
declare global {
  interface Window {
    civicAuthReady?: () => void;
  }
}

function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useUser();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Delay auth check to allow state synchronization
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        console.log('ProtectedRoute: Auth check complete', { user, isAuthenticated });
        setIsCheckingAuth(false);
      }, 1000); // 1s delay to ensure state sync
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (isLoading || isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <svg className="animate-spin h-8 w-8 text-cyber-500 mr-2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        </svg>
        <span className="text-cyber-300">Checking authentication...</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    console.log('ProtectedRoute: Not authenticated, redirecting to /', { user, isAuthenticated });
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
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
      }, 1000); // Reduced to 1s for faster loading
    }
  }, []);

  return (
    <CivicAuthProvider clientId="035d4d41-04d7-4b2e-b1f0-87f6b78f4d27">
      <Router>
        <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white overflow-x-hidden relative">
          {/* 3D Cyber Background */}
          <CyberBackground />
          {/* Matrix rain effect */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="matrix-bg w-full h-full opacity-20"></div>
          </div>
          <Layout>
            <UserButton />
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/deposit" element={<Deposit />} />
                  <Route path="/borrow" element={<Borrow />} />
                  <Route path="/passport" element={<PassportNFT />} />
                  <Route path="/repay" element={<Repay />} />
                  <Route path="/swap" element={<Swap />} />
                </Route>
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