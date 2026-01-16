
import React, { useState, useEffect } from 'react';
import { View, UserData, Service, ManagedUser, AutomationRule } from '../types';
import { Sidebar } from './Sidebar';
import { DashboardView } from './views/DashboardView';
import { AnalystView } from './views/AnalystView';
import { ReportsView } from './views/ReportsView';
import { TeamView } from './views/TeamView';
import { RegulationsView } from './views/RegulationsView';
import { AutomationsView } from './views/AutomationsView';
import { SettingsView } from './views/SettingsView';
import { TransactionsView } from './views/TransactionsView';
import { BusinessView } from './views/BusinessView';
import { HelpCenterView } from './views/HelpCenterView';
import { NotificationsView } from './views/NotificationsView';
import { FloatingAgentChat } from './FloatingAgentChat';
import { PageGuide } from './PageGuide';
import { Share2, Menu, Search, Mic, Bell, LogOut, ArrowRight } from 'lucide-react';

interface AuthenticatedLayoutProps {
  userData: UserData;
  onLogout: () => void;
  onUpdateUserData: (updates: Partial<UserData>) => void;
}

const FIRST_NAMES = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const LOCATIONS = ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Australia', 'Singapore', 'Japan', 'Brazil', 'Nigeria', 'India', 'South Africa'];
const PAYMENT_DATES = ['1st of month', '15th of month', '25th of month', 'Last day of month', 'Every Friday', 'Every second Thursday'];

const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// Generate 8-char AMSID (Uppercase Alphanumeric)
const generateAMSID = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Helper to generate mock staff based on business size
const generateStaffBySize = (size: string, userLocation: string): ManagedUser[] => {
    const baseStaff: ManagedUser[] = [];
    const userCountry = userLocation.split(',')[0].trim();
    
    // Weighted location picker to favor user's country but allow diversity
    const getResidency = () => Math.random() > 0.6 ? userCountry : getRandomElement(LOCATIONS);

    // Roles pool
    const roles = [
        { role: 'Product Manager', salary: 120000 },
        { role: 'Senior Developer', salary: 140000 },
        { role: 'Marketing Lead', salary: 95000 },
        { role: 'Sales Director', salary: 110000 },
        { role: 'Customer Support', salary: 55000 },
        { role: 'HR Manager', salary: 85000 },
        { role: 'Accountant', salary: 75000 },
        { role: 'Operations Manager', salary: 90000 },
        { role: 'Junior Developer', salary: 85000 },
        { role: 'Content Writer', salary: 60000 }
    ];

    let count = 0;
    if (size === '0-1') count = 0;
    else if (size === '0-10') count = 4;
    else if (size === '0-100') count = 12;
    else count = 25;

    for (let i = 0; i < count; i++) {
        const roleData = roles[i % roles.length];
        const id = `mock-user-${i}`;
        const firstName = getRandomElement(FIRST_NAMES);
        const lastName = getRandomElement(LAST_NAMES);
        const name = `${firstName} ${lastName}`;
        const residency = getResidency();
        
        baseStaff.push({
            id,
            name: name,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
            role: roleData.role,
            avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random&color=fff`,
            status: Math.random() > 0.3 ? 'active' : 'offline',
            accessLevel: i < 2 ? 'Manager' : 'Viewer',
            residency: residency,
            salary: roleData.salary,
            paymentFrequency: 'Monthly',
            paymentDate: getRandomElement(PAYMENT_DATES),
            joinedDate: new Date().toISOString().split('T')[0],
            amsid: generateAMSID()
        });
    }
    return baseStaff;
};

const getSearchPlaceholder = (view: View): string => {
    switch (view) {
        case View.DASHBOARD: return 'Search overview...';
        case View.ANALYST: return 'Search conversation history...';
        case View.REPORTS: return 'Search reports...';
        case View.TEAM: return 'Search staff members...';
        case View.REGULATIONS: return 'Search compliance frameworks...';
        case View.AUTOMATIONS: return 'Search rules...';
        case View.SETTINGS: return 'Search settings...';
        case View.TRANSACTIONS: return 'Search transactions...';
        case View.BUSINESS: return 'Search services & products...';
        case View.NOTIFICATIONS: return 'Search notifications...';
        case View.HELP_CENTER: return 'Search help articles...';
        default: return 'Search...';
    }
};

export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ userData, onLogout, onUpdateUserData }) => {
  const [currentView, setCurrentView] = useState<View>(View.BUSINESS);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  
  // Data States managed here to persist between view switches
  const [services, setServices] = useState<Service[]>([]);
  const [staffMembers, setStaffMembers] = useState<ManagedUser[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);

  // Initialize Staff based on User Data logic
  useEffect(() => {
      // If staff already initialized, don't re-run unless it's to switch from fresh to demo
      if (staffMembers.length > 0) return;

      const isSoleProp = userData.legalStructure?.toLowerCase().includes('sole') || userData.legalStructure?.toLowerCase().includes('proprietorship');
      
      let initialStaff: ManagedUser[] = [];

      // 1. Always Add Owner
      initialStaff.push({ 
          id: '0', 
          name: `${userData.firstName} ${userData.lastName}`, 
          role: 'Owner', 
          email: userData.email,
          avatar: `https://ui-avatars.com/api/?name=${userData.firstName}+${userData.lastName}&background=50C913&color=000`, 
          status: 'active', 
          accessLevel: 'Admin', 
          residency: userData.location.split(',')[0],
          salary: 0,
          paymentFrequency: 'Monthly',
          paymentDate: '1st of month',
          amsid: generateAMSID()
      });

      // 2. ONLY Generate mock staff/compliance for Demo Mode (!isFreshSignup)
      // Fresh signups start empty (except owner) per request
      if (!userData.isFreshSignup) {
          const generated = generateStaffBySize(userData.size, userData.location);
          initialStaff = [...initialStaff, ...generated];

          // Inject Compliance Staff if NOT Sole Proprietorship (Demo Mode only)
          if (!isSoleProp) {
              const complianceRoles = [
                  { name: 'Sarah Jenkins', role: 'Compliance Officer' },
                  { name: 'David Okafor', role: 'Legal Counsel' }
              ];
              
              complianceRoles.forEach((cr, idx) => {
                  if (!initialStaff.some(s => s.role === cr.role)) {
                      initialStaff.push({
                          id: `comp-${idx}`,
                          name: cr.name,
                          email: `${cr.name.split(' ')[0].toLowerCase()}@amsquare.compliance`,
                          role: cr.role,
                          avatar: `https://ui-avatars.com/api/?name=${cr.name.replace(' ', '+')}&background=000&color=fff`,
                          status: 'active',
                          accessLevel: 'Manager',
                          residency: userData.location.split(',')[0], // Local expert
                          salary: 110000,
                          paymentFrequency: 'Monthly',
                          paymentDate: '28th of month',
                          joinedDate: new Date().toISOString().split('T')[0],
                          amsid: generateAMSID()
                      });
                  }
              });
          }
      }

      setStaffMembers(initialStaff);
  }, [userData.isFreshSignup, userData.size, userData.location, userData.legalStructure]);

  // Floating Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [agentInitialQuery, setAgentInitialQuery] = useState('');

  // Guide State
  const [showGuide, setShowGuide] = useState(true);

  // Settings Tab State handling from requirements
  const [settingsTab, setSettingsTab] = useState<'main' | 'branding' | 'agent' | 'admin' | 'security' | 'connectors' | 'api'>('main');
  const [requirementMode, setRequirementMode] = useState(false);

  const handleNavigate = (view: View, subTab?: string, requirementInfo?: { id: string, text: string }) => {
      setCurrentView(view);
      if (view === View.SETTINGS && subTab) {
          setSettingsTab(subTab as any);
      }
      if (requirementInfo) {
          if (view === View.ANALYST) {
              setAgentInitialQuery(requirementInfo.text);
          } else {
             setRequirementMode(true);
          }
      }
  };

  const handleRequirementComplete = (reqId: string) => {
      const completed = userData.completedRequirements || [];
      if (!completed.includes(reqId)) {
          onUpdateUserData({ completedRequirements: [...completed, reqId] });
      }
      setRequirementMode(false);
      setCurrentView(View.BUSINESS); // Return to business view
  };

  const isAnalystView = currentView === View.ANALYST;
  
  // Views that should handle their own scrolling (fixed viewport)
  const isFixedView = currentView === View.ANALYST || currentView === View.TRANSACTIONS || currentView === View.NOTIFICATIONS;

  const renderView = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <DashboardView userData={userData} />;
      case View.ANALYST:
        return <AnalystView userData={userData} onAddRule={(rule) => setAutomationRules([...automationRules, rule])} staffList={staffMembers} />;
      case View.REPORTS:
        return <ReportsView userData={userData} />;
      case View.TEAM:
        return <TeamView userData={userData} onUpdateUserData={onUpdateUserData} staff={staffMembers} setStaff={setStaffMembers} />;
      case View.REGULATIONS:
        return <RegulationsView userData={userData} onAskAgent={(q) => { setIsChatOpen(true); setAgentInitialQuery(q); }} />;
      case View.AUTOMATIONS:
        return <AutomationsView rules={automationRules} onAddRule={(rule) => setAutomationRules([...automationRules, rule])} userData={userData} />;
      case View.SETTINGS:
        return (
            <SettingsView 
                userData={userData} 
                onUpdateUserData={onUpdateUserData} 
                initialTab={settingsTab}
                isInRequirementMode={requirementMode}
                onCompleteRequirement={handleRequirementComplete}
                onReturnToBusiness={() => { setRequirementMode(false); setCurrentView(View.BUSINESS); }}
                onAskAgent={(q) => { setIsChatOpen(true); setAgentInitialQuery(q); }}
            />
        );
      case View.TRANSACTIONS:
        return <TransactionsView userData={userData} />;
      case View.BUSINESS:
        return <BusinessView userData={userData} services={services} setServices={setServices} onNavigate={handleNavigate} />;
      case View.HELP_CENTER:
        return <HelpCenterView />;
      case View.NOTIFICATIONS:
        return <NotificationsView userData={userData} />;
      default:
        return <DashboardView userData={userData} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#f5f5f5] overflow-hidden font-sans text-slate-900">
      <Sidebar 
        currentView={currentView} 
        onChangeView={(view) => { setCurrentView(view); setSettingsTab('main'); setRequirementMode(false); }}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(!isCollapsed)}
        businessName={userData.businessName}
        hasBusinessAlert={userData.isFreshSignup && (!userData.completedRequirements || userData.completedRequirements.length < 4)}
      />

      <main className={`flex-1 flex flex-col h-full transition-all duration-300 relative overflow-hidden ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        
        {/* DESKTOP HEADER */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3 bg-[#f5f5f5] shrink-0 border-b border-transparent">
           {/* Search Bar - Extended width with 30px gap from actions */}
           <div className="relative group flex-1 mr-[30px]">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-black transition-colors" />
              <input 
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-white rounded-full border border-slate-200 pl-14 pr-12 py-3.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 transition-all shadow-sm" 
                placeholder={getSearchPlaceholder(currentView)}
              />
              <Mic className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 cursor-pointer hover:text-black transition-colors" />
           </div>

           {/* Right Actions */}
           <div className="flex items-center gap-6 shrink-0">
              <button className="relative p-1 hover:bg-slate-200 rounded-full transition-colors group" onClick={() => setCurrentView(View.NOTIFICATIONS)}>
                  <Bell className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[#f5f5f5]"></span>
              </button>
              
              <div className="h-8 w-px bg-slate-300 mx-1"></div>
              
              <button onClick={onLogout} className="p-1 hover:bg-slate-200 rounded-full transition-colors" title="Logout">
                  <LogOut className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
              </button>

              <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setCurrentView(View.SETTINGS)}>
                  <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">Hi, <span className="font-bold text-[#50C913]">{userData.firstName}</span></p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                      <img src={`https://ui-avatars.com/api/?name=${userData.firstName}+${userData.lastName}&background=random`} alt="Profile" className="w-full h-full object-cover" />
                  </div>
              </div>
           </div>
        </header>

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
            <button onClick={() => setIsMobileOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg">
                <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-lg">{userData.businessName}</span>
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                <img src={`https://ui-avatars.com/api/?name=${userData.firstName}+${userData.lastName}&background=random`} alt="Profile" className="w-full h-full object-cover" />
            </div>
        </div>

        {/* View Content - Conditional Overflow */}
        <div 
            className={`flex-1 px-4 lg:px-8 pt-2 pb-4 lg:pb-8 relative scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent ${
                isFixedView ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'
            }`}
        >
            {renderView()}
        </div>

        {/* Page Guide Overlay */}
        {showGuide && (
            <PageGuide view={currentView} onClose={() => setShowGuide(false)} onComplete={() => setShowGuide(false)} />
        )}

        {/* Floating Agent Chat Button & Window */}
        {!isAnalystView && (
            <>
                <FloatingAgentChat 
                    isOpen={isChatOpen} 
                    onClose={() => { setIsChatOpen(false); setAgentInitialQuery(''); }}
                    onAutoFill={(newServices) => {
                        setServices(prev => [...prev, ...newServices]);
                    }}
                    userData={userData}
                    initialQuery={agentInitialQuery}
                    staffList={staffMembers}
                />
                
                {!isChatOpen && (
                <button 
                    onClick={() => setIsChatOpen(true)}
                    className="fixed bottom-8 right-8 w-14 h-14 bg-[#171717] hover:scale-105 active:scale-95 text-white rounded-2xl shadow-2xl flex items-center justify-center transition-all z-40 group"
                >
                    <Share2 className="w-6 h-6 text-white group-hover:text-[var(--primary-color)] transition-colors" />
                </button>
                )}
            </>
        )}
      </main>
    </div>
  );
};
