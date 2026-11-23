
import React from 'react';
import { View } from '../types';
import { LayoutGrid, Scale, Users, Share2, FileText, Repeat, Layers, Settings, Headphones, ChevronRight, Diamond, Briefcase, Inbox, ChevronLeft } from 'lucide-react';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  businessName?: string;
  hasBusinessAlert?: boolean;
  hasRegulationsAlert?: boolean;
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  hasPermission: (permission: any) => boolean;
}

interface NavItem {
  view: View;
  label: string;
  icon: any;
  isAgent?: boolean;
  hasAlert?: boolean;
  permission?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  toggleCollapse,
  businessName,
  hasBusinessAlert,
  hasRegulationsAlert,
  userName,
  userRole,
  userAvatar,
  hasPermission
}) => {

  const navGroups: NavItem[][] = [
    // Section 1: Overview, Regulations, Notification Center, Financial Agent
    [
      { view: View.DASHBOARD, label: 'Overview', icon: LayoutGrid },
      { view: View.REGULATIONS, label: 'Regulations', icon: Scale, hasAlert: hasRegulationsAlert },
      { view: View.NOTIFICATIONS, label: 'Notification Center', icon: Inbox },
      { view: View.ANALYST, label: 'Financial Agent', icon: Share2, isAgent: true, permission: 'access_analyst' },
    ],
    // Section 2: Business Config, My Staff, Transactions, Reports, Automations & Rules
    [
      { view: View.BUSINESS, label: 'My Business', icon: Briefcase, hasAlert: hasBusinessAlert, permission: 'edit_business' },
      { view: View.TEAM, label: 'My Staff', icon: Users, permission: 'manage_staff' },
      { view: View.TRANSACTIONS, label: 'Transactions', icon: Repeat, permission: 'view_financials' },
      { view: View.REPORTS, label: 'Reports', icon: FileText, permission: 'view_financials' },
      { view: View.AUTOMATIONS, label: 'Automations & Rules', icon: Layers, permission: 'access_analyst' },
    ],
    // Section 3: Settings, Help
    [
      { view: View.SETTINGS, label: 'Settings', icon: Settings, permission: 'edit_settings' },
      { view: View.HELP_CENTER, label: 'Help', icon: Headphones },
    ]
  ];

  const filteredNavGroups = navGroups.map(group =>
    group.filter(item => !item.permission || hasPermission(item.permission))
  ).filter(group => group.length > 0);

  const handleNavClick = (view: View) => {
    onChangeView(view);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden transition-all duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full bg-[#0a0a0a] text-slate-400 transition-all duration-300 transform flex flex-col border-r border-slate-800
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'w-20 items-center' : 'w-64 items-start'}
      `}>
        {/* Logo */}
        <div className={`shrink-0 h-24 flex items-center ${isCollapsed ? 'justify-center w-full' : 'px-6 gap-3 w-full'}`}>
          <div className="w-10 h-10 bg-[var(--primary-color)] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] shrink-0">
            <Diamond className="w-5 h-5 text-black fill-black" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-fade-in overflow-hidden whitespace-nowrap">
              <span className="font-bold text-white tracking-wider text-lg uppercase truncate max-w-[150px]">{businessName || 'AMSQUARE'}</span>
            </div>
          )}
        </div>

        {/* Nav Items Groups */}
        <nav className={`flex-1 w-full overflow-y-auto overflow-x-hidden ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {filteredNavGroups.map((group, groupIndex) => (
            <div key={groupIndex} className={`flex flex-col gap-1.5 w-full ${groupIndex < filteredNavGroups.length - 1 ? 'mb-6 border-b border-white/5 pb-6' : ''}`}>
              {group.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.view;
                return (
                  <button
                    key={item.view}
                    onClick={() => handleNavClick(item.view)}
                    className={`h-10 flex items-center rounded-xl transition-all relative group overflow-hidden whitespace-nowrap
                      ${isCollapsed ? 'justify-center w-10 mx-auto' : 'w-full px-3 gap-3'}
                      ${isActive
                        ? 'bg-white/10 text-[var(--primary-color)]'
                        : 'hover:bg-white/5 text-slate-500 hover:text-white'
                      }
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="relative">
                      <Icon className={`w-5 h-5 shrink-0 ${item.isAgent && isActive ? 'text-[var(--primary-color)]' : ''}`} />
                      {/* Notification Dot */}
                      {item.hasAlert && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a0a0a] animate-pulse"></span>
                      )}
                    </div>

                    {!isCollapsed && (
                      <span className={`text-sm font-medium transition-opacity duration-200 ${isActive ? 'font-bold' : ''}`}>
                        {item.label}
                      </span>
                    )}

                    {isActive && isCollapsed && (
                      <div className="absolute -left-1 w-1 h-4 bg-[var(--primary-color)] rounded-r-full shadow-[0_0_8px_var(--primary-color)]" />
                    )}
                    {isActive && !isCollapsed && (
                      <div className="absolute left-0 w-1 h-4 bg-[var(--primary-color)] rounded-r-full shadow-[0_0_8px_var(--primary-color)]" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={`mt-auto shrink-0 w-full border-t border-slate-800 bg-[#0a0a0a] ${isCollapsed ? 'p-4 flex flex-col items-center gap-4' : 'p-4'}`}>

          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'mb-4'}`}>
            <div className="w-9 h-9 rounded-full border border-slate-700 overflow-hidden shrink-0 bg-slate-800 flex items-center justify-center">
              {userAvatar ? (
                <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <Users className="w-5 h-5 text-slate-500" />
              )}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{userName || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{userRole || 'Member'}</p>
              </div>
            )}
          </div>

          <button
            onClick={toggleCollapse}
            className={`flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-600 hover:text-white transition-colors
              ${isCollapsed ? 'w-8 h-8' : 'w-full py-2 bg-white/5 gap-2'}
            `}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <><ChevronLeft className="w-4 h-4" /> <span className="text-xs font-bold">Collapse Sidebar</span></>}
          </button>
        </div>
      </aside>
    </>
  );
};
