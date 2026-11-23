
import React, { useState, useEffect } from 'react';
import { Analytics } from "@vercel/analytics/react"
import { useQuery, useMutation } from 'convex/react';
import { api } from './convex/_generated/api';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { AuthenticatedLayout } from './components/AuthenticatedLayout';
import { UserData, View } from './types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');

  // Query user data from Convex
  const userData = useQuery(
    api.auth.getUserByEmail,
    currentUserEmail ? { email: currentUserEmail } : 'skip'
  );

  const updateUser = useMutation(api.auth.updateUser);

  // Check for existing session in localStorage (temporary until full Convex auth)
  useEffect(() => {
    const savedEmail = localStorage.getItem('amsquare_user_email');
    if (savedEmail) {
      setCurrentUserEmail(savedEmail);
      setIsAuthenticated(true);
    }
  }, []);

  const [justSignedUp, setJustSignedUp] = useState(false);

  const handleLogin = (email: string) => {
    setCurrentUserEmail(email);
    setIsAuthenticated(true);
    setJustSignedUp(false); // Reset on login
    localStorage.setItem('amsquare_user_email', email);
  };

  const handleSignupComplete = (data: UserData) => {
    setCurrentUserEmail(data.email);
    setIsAuthenticated(true);
    setJustSignedUp(true); // Flag as fresh signup
    localStorage.setItem('amsquare_user_email', data.email);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUserEmail('');
    localStorage.removeItem('amsquare_user_email');
  };

  const handleUpdateUserData = async (updates: Partial<UserData>) => {
    if (userData?._id) {
      await updateUser({
        userId: userData._id,
        updates,
      });
    }
  };

  // Convert Convex user data to UserData type
  const convertedUserData: UserData | null = userData ? {
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    email: userData.email,
    businessName: userData.businessName || '',
    niche: userData.niche || '',
    location: userData.location || '',
    legalStructure: userData.legalStructure || '',
    operationRange: userData.operationRange || [],
    size: userData.size || '',
    isFreshSignup: userData.isFreshSignup || false,
    hasConnectedBank: userData.hasConnectedBank,
    completedRequirements: userData.completedRequirements,
    theme: userData.theme as "light" | "dark" | undefined,
    language: userData.language,
    agentName: userData.agentName,
    agentPersonality: userData.agentPersonality,
    agentModel: userData.agentModel,
    billingAddress: userData.billingAddress,
    primaryAddress: userData.primaryAddress,
    staffResidencies: userData.staffResidencies,
    seenGuides: userData.seenGuides,
    funding: userData.funding,
    userType: userData.userType,
    accessLevel: userData.accessLevel as any,
    mainUserId: userData.mainUserId as any,
    _id: userData._id as any,
  } : null;

  // Check for invitation token in URL
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('inviteToken');
    if (token) {
      setInviteToken(token);
    }
  }, []);

  return (
    <>
      <Analytics />
      {isAuthenticated && convertedUserData && !convertedUserData.isFreshSignup ? <AuthenticatedLayout
        key={justSignedUp ? 'fresh-signup' : 'standard-session'}
        userData={convertedUserData}
        onLogout={handleLogout}
        onUpdateUserData={handleUpdateUserData}
        initialView={justSignedUp || convertedUserData.isFreshSignup ? View.BUSINESS : View.DASHBOARD}
      />
        : (
          <OnboardingFlow
            onLogin={handleLogin}
            onSignup={handleSignupComplete}
            inviteToken={inviteToken}
          />
        )}
    </>
  );
};

export default App;
