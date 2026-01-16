
import React, { useState } from 'react';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { AuthenticatedLayout } from './components/AuthenticatedLayout';
import { UserData } from './types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Default demo data
  const [userData, setUserData] = useState<UserData>({
    firstName: 'Gideon',
    lastName: 'Wolfe',
    email: 'gideon@amsquare.com',
    businessName: 'AMSquare Demo',
    niche: 'Fintech',
    location: 'Lagos, Nigeria', // Updated default location
    legalStructure: 'Limited Liability Company (LLC)',
    operationRange: ['Nigeria'],
    size: '100-500',
    isFreshSignup: false,
    hasConnectedBank: true, 
    completedRequirements: [],
    theme: 'light',
    language: 'English',
    agentName: 'Ralph',
    agentPersonality: 'Professional',
    agentModel: 'Flash',
    billingAddress: '142 Ahmadu Bello Way, Victoria Island, Lagos',
    primaryAddress: '142 Ahmadu Bello Way, Victoria Island, Lagos',
    staffResidencies: ['Nigeria', 'United Kingdom']
  });

  const handleLogin = (data?: Partial<UserData>) => {
    if (data) {
        setUserData(prev => ({ ...prev, ...data, isFreshSignup: false, hasConnectedBank: true }));
    }
    setIsAuthenticated(true);
  };

  const handleSignupComplete = (data: UserData) => {
    setUserData({ 
        ...data, 
        isFreshSignup: true,
        hasConnectedBank: false,
        completedRequirements: [],
        // Set defaults if not provided
        theme: 'light',
        language: 'English',
        agentName: 'Ralph',
        agentPersonality: 'Professional',
        agentModel: 'Flash',
        billingAddress: data.location,
        primaryAddress: data.location,
        staffResidencies: []
    });
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    // Reset to demo default on logout
    setUserData({
      firstName: 'Gideon',
      lastName: 'Wolfe',
      email: 'gideon@amsquare.com',
      businessName: 'AMSquare Demo',
      niche: 'Fintech',
      location: 'Lagos, Nigeria',
      legalStructure: 'Limited Liability Company (LLC)',
      operationRange: ['Nigeria'],
      size: '100-500',
      isFreshSignup: false,
      hasConnectedBank: true,
      completedRequirements: [],
      theme: 'light',
      language: 'English',
      agentName: 'Ralph',
      agentPersonality: 'Professional',
      agentModel: 'Flash',
      billingAddress: '142 Ahmadu Bello Way, Victoria Island, Lagos',
      primaryAddress: '142 Ahmadu Bello Way, Victoria Island, Lagos',
      staffResidencies: ['Nigeria', 'United Kingdom']
    });
  };

  const handleUpdateUserData = (updates: Partial<UserData>) => {
      setUserData(prev => ({ ...prev, ...updates }));
  };

  return (
    <>
      {isAuthenticated ? (
        <AuthenticatedLayout 
            userData={userData} 
            onLogout={handleLogout} 
            onUpdateUserData={handleUpdateUserData}
        />
      ) : (
        <OnboardingFlow 
            onLogin={(email) => handleLogin({ email })} 
            onSignup={handleSignupComplete} 
        />
      )}
    </>
  );
};

export default App;
