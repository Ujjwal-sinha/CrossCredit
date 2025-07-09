# Civic Auth Integration - Hackathon Proof

This repository demonstrates a minimal Civic Auth integration for hackathon proof-of-concept purposes, showcasing Web3 authentication in a React application with React Router, Framer Motion, and a responsive UI.

## Files

- `README.md`: This file, providing an overview and usage instructions.
- `App.tsx`: The main React app component, integrating `CivicAuthProvider`, React Router for navigation, and protected routes with authentication checks.
- `Header.tsx`: A responsive header component with navigation links, Civic Web3 authentication buttons (`SignInButton` and `SignOutButton`), and Framer Motion animations.
- `civic.ts`: Civic Auth utility exports for easy import and configuration.

## Features

- **Web3 Authentication**: Utilizes Civic's `@civic/auth-web3` package for seamless user sign-in and sign-out with Web3 wallets.
- **Protected Routes**: Implements `ProtectedRoute` to restrict access to authenticated users, redirecting unauthenticated users to the landing page (`/`).
- **Responsive Design**: Features a mobile-friendly navigation menu with Framer Motion animations for smooth transitions.
- **Dynamic Navigation**: Supports navigation to multiple routes (`/dashboard`, `/deposit`, `/borrow`, `/passport`, `/swap`) with active state highlighting.
- **Loading States**: Manages authentication processing with loading spinners and disabled buttons to prevent race conditions.
- **3D Background & Effects**: Includes a `CyberBackground` component and matrix rain effect for a futuristic UI aesthetic.

## Usage

1. **Install Dependencies**:

   Ensure the required dependencies are installed:

   ```bash
   npm install react react-dom react-router-dom framer-motion @civic/auth-web3 react-hot-toast

   Or with Yarn:bash

     ```bash
yarn add react react-dom react-router-dom framer-motion @civic/auth-web3 react-hot-toast

Set Up Civic Auth:Obtain a clientId from Civic and update the CivicAuthProvider in App.tsx:tsx

<CivicAuthProvider clientId="your-civic-client-id">

Configure the civic.ts utility file with the correct Civic Auth settings (e.g., endpoint, chain).

Integrate Files:Copy App.tsx, Header.tsx, and civic.ts into your project’s src directory.
Ensure referenced components (Layout, LandingPage, Dashboard, Deposit, Borrow, PassportNFT, Repay, Swap, CyberBackground) are implemented or stubbed out.
Update the navigation array in Header.tsx to match your routes if necessary:tsx

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Deposit', href: '/deposit' },
  // Add or modify routes as needed
];
  ```bash
Customize Styling:The app uses Tailwind CSS classes (e.g., cyber-glass, neon-text, bg-gradient-cyber) and a custom App.css. Set up Tailwind CSS or replace with your styling solution.
Adjust the matrix-bg and CyberBackground components to align with your app’s visual design.

Run the Application:Start the development server:bash

npm start

Test the authentication flow by clicking "Sign into CrossCredit" (unauthenticated) or "Sign out" (authenticated) in the header.
Navigate to protected routes (/dashboard, etc.) to verify redirection for unauthenticated users.

NotesClient ID: Replace the placeholder clientId in App.tsx (035d4d41-04d7-4b2e-b1f0-87f6b78f4d27) with your actual Civic Auth client ID.
Authentication Delay: The ProtectedRoute component uses a 1-second delay for state synchronization. Adjust the timeout in App.tsx if needed:tsx

 ```bash
Error Handling: Header.tsx includes basic error handling with alerts. Enhance with custom modals or toast notifications for production.
Civic Auth Configuration: Refer to Civic's Documentation for advanced configuration options in civic.ts.
API Access: For xAI API integration, see xAI API Documentation.

ExampleTo integrate into a new project:Create a React project with TypeScript and Tailwind CSS.
Copy App.tsx, Header.tsx, and civic.ts into src.
Replace the clientId in App.tsx with your Civic Auth client ID.
Implement or stub out referenced components (e.g., Dashboard, Deposit).
Run npm start and test the authentication flow.

