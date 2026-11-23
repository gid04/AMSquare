
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
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
import { UserData, View, Transaction, Service, ManagedUser, AutomationRule, Notification, Permission, RolePermissions } from '../types';
import { Share2, Search, Mic, Bell, LogOut, Menu, PieChart, Users, FileText, Settings, Shield, Zap, Info, Briefcase, Activity } from 'lucide-react';

interface AuthenticatedLayoutProps {
  userData: UserData;
  onLogout: () => void;
  onUpdateUserData: (updates: Partial<UserData>) => void;
  initialView?: View;
}

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

export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({
  userData,
  onLogout,
  onUpdateUserData,
  initialView = View.DASHBOARD
}) => {
  const [currentView, setCurrentView] = useState<View>(initialView);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Data State
  const [services, setServices] = useState<Service[]>([]);
  // Convex Data
  // Convex Data
  const dbNotifications = useQuery(api.notifications.getNotifications, userData._id ? { userId: userData._id as any } : 'skip');
  const updateUser = useMutation(api.auth.updateUser);
  const createNotification = useMutation(api.notifications.createNotification);
  const createTransaction = useMutation(api.transactions.createTransaction);
  const createAutomation = useMutation(api.automations.createAutomation);
  const updateAutomation = useMutation(api.automations.updateAutomation);
  const deleteAutomation = useMutation(api.automations.deleteAutomation);
  const dbStaff = useQuery(api.staff.getStaff, userData._id ? { mainUserId: userData._id as any } : 'skip');
  const dbTransactions = useQuery(api.transactions.getTransactions, userData._id ? { userId: userData._id as any } : 'skip');
  const dbAutomations = useQuery(api.automations.getAutomations, userData._id ? { userId: userData._id as any } : 'skip');

  // Sync to local types
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [staffMembers, setStaffMembers] = useState<ManagedUser[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);

  useEffect(() => {
    if (dbNotifications) {
      setNotifications(dbNotifications as any);
    }
  }, [dbNotifications]);

  useEffect(() => {
    if (dbStaff) {
      const mappedStaff: ManagedUser[] = (dbStaff as any).map((s: any) => ({
        id: s._id,
        name: `${s.firstName} ${s.lastName}`,
        email: s.email,
        role: s.accessLevel || 'Staff',
        avatar: `https://ui-avatars.com/api/?name=${s.firstName}+${s.lastName}&background=random`,
        status: s.invitationStatus === 'accepted' ? 'active' : 'offline',
        accessLevel: s.accessLevel,
        joinedDate: s.joinedDate || (s.invitationStatus === 'pending' ? 'Pending' : ''),
        amsid: s.amsid,
        residency: s.residency,
        salary: s.salary,
        paymentFrequency: s.paymentFrequency,
        paymentDate: s.paymentDate
      }));
      setStaffMembers(mappedStaff);
    }
  }, [dbStaff]);

  useEffect(() => {
    if (dbTransactions) {
      setTransactions(dbTransactions as any);
    }
  }, [dbTransactions]);

  useEffect(() => {
    if (dbAutomations) {
      setAutomationRules(dbAutomations as any);
    }
  }, [dbAutomations]);

  // Seed initial notification for fresh signup
  useEffect(() => {
    const seedInitialNotification = async () => {
      if (userData.isFreshSignup && dbNotifications && dbNotifications.length === 0 && userData._id) {
        const country = userData.location.split(',')[1]?.trim() || userData.location.split(',')[0]?.trim() || 'Local';
        await createNotification({
          userId: userData._id as any,
          title: `Upcoming Tax Filing: ${country}`,
          description: `Compliance checks initialized for ${country} tax jurisdiction. Please review regional requirements.`,
          type: 'alert',
          actionLabel: 'View Frameworks'
        });
      }
    };
    seedInitialNotification();
  }, [userData.isFreshSignup, dbNotifications?.length, userData._id]);

  // UI State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [agentInitialQuery, setAgentInitialQuery] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  // Navigation State
  const [activeSubTab, setActiveSubTab] = useState<string | undefined>(undefined);
  const [requirementInfo, setRequirementInfo] = useState<{ id: string, text: string } | undefined>(undefined);

  // Calculate Unread Notifications for Bell
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  // Handle Guide Logic - Persistent via UserData
  useEffect(() => {
    // Check if guide is needed and not already seen
    // Ensure userData exists before checking properties
    // NEW LOGIC: Only show guides if user has 'seenGuides' initialized (New Flow) AND hasn't seen this view yet.
    if (userData && userData.seenGuides !== undefined && !userData.seenGuides.includes(currentView) && currentView !== View.HELP_CENTER) {
      // Small delay to allow transition
      const timer = setTimeout(() => setShowGuide(true), 800);
      return () => clearTimeout(timer);
    } else {
      setShowGuide(false);
    }
  }, [currentView, userData.seenGuides]);

  const handleGuideComplete = () => {
    setShowGuide(false);
    const currentSeen = userData.seenGuides || [];
    if (!currentSeen.includes(currentView)) {
      onUpdateUserData({ seenGuides: [...currentSeen, currentView] });
    }
  };

  const handleNavigate = (view: View, subTab?: string, reqInfo?: { id: string, text: string }) => {
    setCurrentView(view);
    if (subTab) setActiveSubTab(subTab);
    if (reqInfo) {
      setRequirementInfo(reqInfo);
    }
    setIsMobileNavOpen(false);
  };

  const handleAddRule = (rule: Partial<AutomationRule>) => {
    createAutomation({
      userId: userData._id as any,
      name: rule.name!,
      description: rule.action!,
      type: 'Treasury', // Default
      isActive: true,
      config: {
        condition: rule.condition,
        action: rule.action,
        source: rule.source || 'manual',
        lastRun: 'Never'
      }
    }).catch(err => console.error("Failed to add automation:", err));
  };

  const handleToggleRule = (automationId: string, isActive: boolean) => {
    updateAutomation({
      automationId: automationId as any,
      userId: userData._id as any,
      updates: { isActive: !isActive }
    }).catch(err => console.error("Failed to toggle automation:", err));
  };

  const handleDeleteRule = (automationId: string) => {
    deleteAutomation({
      automationId: automationId as any,
      userId: userData._id as any
    }).catch(err => console.error("Failed to delete automation:", err));
  };

  // RBAC Helpers
  const userPermissions = useMemo(() => {
    const role = userData.accessLevel || (userData.userType === 'main' ? 'Admin' : 'Viewer');
    return RolePermissions[role] || [];
  }, [userData.accessLevel, userData.userType]);

  const hasPermission = (permission: Permission) => {
    return userPermissions.includes(permission);
  };

  const isFixedView = currentView === View.ANALYST || currentView === View.TRANSACTIONS || currentView === View.NOTIFICATIONS;
  const isAnalystView = currentView === View.ANALYST;

  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <DashboardView userData={userData} transactions={transactions} onNavigate={handleNavigate} />;
      case View.ANALYST:
        return <AnalystView
          userData={userData}
          onAddRule={handleAddRule}
          staffList={staffMembers}
        />;
      case View.REPORTS:
        return <ReportsView userData={userData} />;
      case View.TEAM:
        return <TeamView
          userData={userData}
          onUpdateUserData={onUpdateUserData}
          staff={staffMembers}
          setStaff={setStaffMembers}
          hasPermission={hasPermission}
        />;
      case View.REGULATIONS:
        return <RegulationsView
          userData={userData}
          onAskAgent={(q) => { setIsChatOpen(true); setAgentInitialQuery(q); }}
          transactions={transactions}
        />;
      case View.AUTOMATIONS:
        return <AutomationsView
          rules={automationRules}
          onAddRule={handleAddRule}
          onToggleRule={handleToggleRule}
          onDeleteRule={handleDeleteRule}
          userData={userData}
        />;
      case View.SETTINGS:
        return <SettingsView
          userData={userData}
          onUpdateUserData={onUpdateUserData}
          initialTab={activeSubTab as any}
          onCompleteRequirement={(id) => {
            if (userData.completedRequirements && !userData.completedRequirements.includes(id)) {
              onUpdateUserData({ completedRequirements: [...userData.completedRequirements, id] });
            }
          }}
          onReturnToBusiness={() => {
            setRequirementInfo(undefined);
            setCurrentView(View.BUSINESS); // Or Dashboard
          }}
          isInRequirementMode={!!requirementInfo}
          onAskAgent={(q) => { setIsChatOpen(true); setAgentInitialQuery(q); }}
          onBankDisconnect={() => {
            // Clear transactions on disconnect for demo purposes
            setTransactions([]);
            onUpdateUserData({ hasConnectedBank: false });
          }}
        />;
      case View.TRANSACTIONS:
        return <TransactionsView
          userData={userData}
          transactions={transactions}
          services={services}
          onNavigate={handleNavigate}
          staff={staffMembers}
        />;
      case View.BUSINESS:
        return <BusinessView
          userData={userData}
          onUpdateUserData={onUpdateUserData}
          services={services}
          setServices={setServices}
          onNavigate={handleNavigate}
          transactions={transactions}
          onAddTransaction={(trx) => {
            createTransaction({
              userId: userData._id as any,
              date: trx.date,
              description: trx.description,
              category: trx.category || 'Revenue',
              amount: trx.amount,
              status: trx.status,
              type: trx.type,
              merchant: trx.merchant,
              paymentMethod: trx.paymentMethod
            }).catch(err => console.error("Failed to add transaction from BusinessView:", err));
          }}
          staff={staffMembers}
          onAskAgent={(q) => { setIsChatOpen(true); setAgentInitialQuery(q); }}
          hasPermission={hasPermission}
        />;
      case View.NOTIFICATIONS:
        return <NotificationsView
          userData={userData}
          notifications={notifications}
          setNotifications={setNotifications}
          onNavigate={handleNavigate}
        />;
      case View.HELP_CENTER:
        return <HelpCenterView />;
      default:
        return <DashboardView userData={userData} transactions={transactions} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#f5f5f5] overflow-hidden font-sans text-slate-900">
      <Sidebar
        currentView={currentView}
        onChangeView={handleNavigate}
        isMobileOpen={isMobileNavOpen}
        setIsMobileOpen={setIsMobileNavOpen}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        businessName={userData.businessName}
        hasBusinessAlert={false}
        hasRegulationsAlert={false}
        userName={`${userData.firstName} ${userData.lastName}`}
        userRole={userData.accessLevel || (userData.userType === 'main' ? 'Owner' : 'Staff')}
        userAvatar={`https://ui-avatars.com/api/?name=${userData.firstName}+${userData.lastName}&background=random`}
        hasPermission={hasPermission}
      />

      <main
        className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ${isSidebarCollapsed ? 'ml-20' : 'ml-0 lg:ml-64'} ${showGuide && currentView !== View.HELP_CENTER ? 'filter blur-sm pointer-events-none' : ''}`}
      >

        {/* DESKTOP HEADER - RESTORED */}
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
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[#f5f5f5]"></span>
              )}
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
          <button onClick={() => setIsMobileNavOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-lg">{userData.businessName}</span>
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
            <img src={`https://ui-avatars.com/api/?name=${userData.firstName}+${userData.lastName}&background=random`} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className={`flex-1 px-4 lg:px-8 pt-2 pb-4 lg:pb-8 relative scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent ${isFixedView ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'
          }`}>
          {renderContent()}
        </div>
      </main>

      {/* Floating Elements (Not Blurred) */}
      {!isAnalystView && (
        <>
          <FloatingAgentChat
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            userData={userData}
            initialQuery={agentInitialQuery}
            staffList={staffMembers}
            onAutoFill={(newServices) => setServices([...services, ...newServices])}
          />

          {/* Persistent floating button if chat is closed */}
          {!isChatOpen && !showGuide && (
            <button
              onClick={() => { setIsChatOpen(true); setAgentInitialQuery(''); }}
              className="fixed bottom-8 right-8 w-14 h-14 bg-[#171717] rounded-2xl shadow-2xl flex items-center justify-center text-white hover:scale-105 transition-all z-40 group"
            >
              <Share2 className="w-6 h-6 text-white group-hover:text-[var(--primary-color)] transition-colors" />
            </button>
          )}
        </>
      )}

      {showGuide && userData && (
        <PageGuide
          view={currentView}
          onClose={() => setShowGuide(false)}
          onComplete={handleGuideComplete}
        />
      )}
    </div>
  );
};
