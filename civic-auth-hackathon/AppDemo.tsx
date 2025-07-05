import React from 'react';
import { CivicAuthProvider, SignInButton, UserButton, useUser } from './civic';

const DemoNav: React.FC = () => {
  const { user } = useUser();
  return (
    <nav style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 16 }}>
      <span style={{ fontWeight: 'bold' }}>Civic Auth Demo</span>
      <div style={{ marginLeft: 'auto' }}>
        {user ? <UserButton /> : <SignInButton />}
      </div>
    </nav>
  );
};

const AppDemo: React.FC = () => (
  <CivicAuthProvider clientId="YOUR_CIVIC_CLIENT_ID">
    <DemoNav />
    <main style={{ padding: 32 }}>
      <h1>Welcome to Civic Auth Hackathon Demo</h1>
      <p>Sign in with Civic to access protected features.</p>
    </main>
  </CivicAuthProvider>
);

export default AppDemo;
