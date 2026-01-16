
import React, { useState, useMemo, useEffect } from 'react';
import { Mail, Inbox, Bell, CheckCircle2, AlertCircle, Share2, Sparkles, X, ChevronRight, FileText, Send, Paperclip, Search, Plus, MoreHorizontal, Trash2, MailOpen, Eye, ArrowDownUp, Calendar, PieChart, ArrowRight, Plug } from 'lucide-react';
import { UserData } from '../../types';

interface NotificationsViewProps {
    userData?: UserData;
}

interface Notification {
    id: string;
    title: string;
    description: string;
    type: 'approval' | 'alert' | 'agent' | 'success';
    time: string;
    read: boolean;
    actionLabel?: string;
}

interface AgentActionContext {
    type: 'invoice' | 'calendar' | 'analysis' | 'reconcile';
    title: string;
    description: string;
    buttonLabel: string;
}

interface ExternalMessage {
    id: string;
    sender: string;
    subject: string;
    preview: string;
    body: string;
    source: 'gmail' | 'outlook';
    time: string;
    read: boolean;
    tags?: string[];
    agentAction?: AgentActionContext;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ userData }) => {
    const [activeTab, setActiveTab] = useState<'inbox' | 'outbox'>('inbox');
    const [selectedEmail, setSelectedEmail] = useState<ExternalMessage | null>(null);
    const [isAgentWorking, setIsAgentWorking] = useState(false);
    const [agentResult, setAgentResult] = useState<any>(null); // Generic result holder
    const [outboxSearch, setOutboxSearch] = useState('');
    const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
    
    // Connection State
    const [connectedApps, setConnectedApps] = useState({ gmail: false, outlook: false });
    const [isConnecting, setIsConnecting] = useState<string | null>(null);

    // Filter States
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [sourceFilter, setSourceFilter] = useState<'all' | 'gmail' | 'outlook'>('all');

    // Data States
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [emails, setEmails] = useState<ExternalMessage[]>([]);

    useEffect(() => {
        if (!userData?.isFreshSignup) {
            // Existing user logic
            setConnectedApps({ gmail: true, outlook: true }); // Assume connected
            loadNotifications();
            loadEmails();
        } else {
            // Fresh signup logic
            setNotifications([]);
            setEmails([]);
            // Keep connectedApps false initially
        }
    }, [userData]);

    const loadNotifications = () => {
        setNotifications([
            { id: '1', title: 'Transaction Approval Needed', description: 'Gideon Wolfe requested $450.00 for "Software Subscription".', type: 'approval', time: '10 mins ago', read: false, actionLabel: 'Approve' },
            { id: '2', title: 'Ralph Suggestion', description: 'I found 3 subscriptions that can be consolidated to save $120/mo.', type: 'agent', time: '1 hour ago', read: false, actionLabel: 'View Report' },
            { id: '3', title: 'Low Balance Warning', description: 'Operations Card (••4242) is below $1,000 threshold.', type: 'alert', time: '3 hours ago', read: true },
            { id: '4', title: 'Automation Success', description: 'Successfully allocated 10% of revenue to Tax Reserve.', type: 'success', time: 'Yesterday', read: true },
        ]);
    };

    const loadEmails = () => {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
        const yesterdayString = yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        setEmails([
            { 
                id: 'e1', 
                sender: 'Alice from TechCorp', 
                subject: 'Project Alpha Invoice?', 
                preview: 'Hi Gideon, just checking when we can expect the invoice for the last sprint...', 
                body: "Hi Gideon,\n\nHope you're doing well.\n\nJust checking when we can expect the invoice for the last sprint (Project Alpha, 40 hours). We are wrapping up our quarterly budget and would love to get this processed.\n\nBest,\nAlice",
                source: 'gmail', 
                time: timeString, 
                read: false,
                tags: ['Client', 'Urgent'],
                agentAction: {
                    type: 'invoice',
                    title: 'Invoice Request Detected',
                    description: 'The sender is asking for the "Project Alpha" invoice (40 hours).',
                    buttonLabel: 'Generate Invoice'
                }
            },
            { 
                id: 'e2', 
                sender: 'Stripe Support', 
                subject: 'Your payout is on the way', 
                preview: 'A payout of $15,420.50 is estimated to arrive by...', 
                body: 'Your payout of $15,420.50 is processed and will arrive in 2 business days. Reference ID: py_123456789.',
                source: 'gmail', 
                time: yesterdayString, 
                read: true,
                tags: ['Finance'],
                agentAction: {
                    type: 'reconcile',
                    title: 'Incoming Funds',
                    description: 'A payout of $15,420.50 is en route. I can match this to your ledger.',
                    buttonLabel: 'Reconcile Transaction'
                }
            },
            { 
                id: 'e3', 
                sender: 'Microsoft Azure', 
                subject: 'Usage Alert: 80% limit reached', 
                preview: 'Your subscription "Pay-As-You-Go" has reached 80% of your budget...', 
                body: 'Your Azure subscription usage is higher than normal. You have reached 80% of your $500 monthly limit. Top resource consumers: Virtual Machines, SQL Database.',
                source: 'outlook', 
                time: '2 days ago', 
                read: true,
                tags: ['Infra', 'Urgent'],
                agentAction: {
                    type: 'analysis',
                    title: 'Budget Anomaly',
                    description: 'Spending is 80% of limit earlier than projected. I can analyze the root cause.',
                    buttonLabel: 'Analyze Cost Structure'
                }
            }
        ]);
    };

    const handleConnectApp = (app: 'gmail' | 'outlook') => {
        setIsConnecting(app);
        setTimeout(() => {
            setConnectedApps(prev => ({ ...prev, [app]: true }));
            setIsConnecting(null);
            // Load mock emails if they aren't loaded yet
            if (emails.length === 0) loadEmails();
        }, 1500); // Simulate network delay
    };

    // Reset agent state when switching emails
    const handleSelectEmail = (email: ExternalMessage) => {
        setSelectedEmail(email);
        setAgentResult(null);
        setIsAgentWorking(false);
    };

    // Computed
    const filteredEmails = useMemo(() => {
        let result = emails.filter(email => {
            // Source Filter
            if (sourceFilter !== 'all' && email.source !== sourceFilter) return false;
            
            // Search Filter
            if (!outboxSearch) return true;
            const term = outboxSearch.toLowerCase();
            return email.sender.toLowerCase().includes(term) || 
                   email.subject.toLowerCase().includes(term) || 
                   email.tags?.some(t => t.toLowerCase().includes(term));
        });

        // Sorting
        if (sortOrder === 'oldest') {
            return [...result].reverse();
        }
        return result;
    }, [emails, outboxSearch, sortOrder, sourceFilter]);

    const handleAgentAction = () => {
        if (!selectedEmail?.agentAction) return;
        
        setIsAgentWorking(true);
        setTimeout(() => {
            setIsAgentWorking(false);
            
            // Mock Results based on action type
            if (selectedEmail.agentAction?.type === 'invoice') {
                setAgentResult({
                    type: 'invoice',
                    client: 'TechCorp (Alice)',
                    items: [{ desc: 'Project Alpha Sprint', amount: 6000 }],
                    total: 6000
                });
            } else if (selectedEmail.agentAction?.type === 'analysis') {
                setAgentResult({
                    type: 'analysis',
                    summary: 'Cost spike detected in "Virtual Machines" (US-East). Recommended action: Switch to Reserved Instances to save 40%.'
                });
            } else if (selectedEmail.agentAction?.type === 'reconcile') {
                setAgentResult({
                    type: 'success',
                    summary: 'Transaction matched to "Revenue: Stripe Sales". Ledger updated.'
                });
            }
        }, 2000);
    };

    // Quick Actions
    const handleMarkRead = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setEmails(prev => prev.map(email => email.id === id ? { ...email, read: !email.read } : email));
        setActiveActionMenu(null);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setEmails(prev => prev.filter(email => email.id !== id));
        if (selectedEmail?.id === id) setSelectedEmail(null);
        setActiveActionMenu(null);
    };

    const handleSummarize = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const email = emails.find(e => e.id === id);
        if (email) {
            alert(`AGENT SUMMARY for "${email.subject}":\n\nThe sender is requesting an invoice for Project Alpha. Action required: Generate Invoice.`);
        }
        setActiveActionMenu(null);
    };

    const getTagStyles = (tag: string) => {
        const t = tag.toLowerCase();
        if (t === 'urgent') return 'bg-red-50 text-red-600 border-red-100';
        if (t === 'client') return 'bg-blue-50 text-blue-600 border-blue-100';
        if (t === 'finance') return 'bg-green-50 text-green-600 border-green-100';
        return 'bg-slate-50 text-slate-600 border-slate-200';
    };

    return (
        <div className="h-full flex flex-col animate-fade-in relative pb-5" onClick={() => setActiveActionMenu(null)}>
            <div className="flex justify-between items-end mb-6 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notification Center</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage internal alerts and external communications.</p>
                </div>
                <div className="flex p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <button 
                        onClick={() => { setActiveTab('inbox'); setSelectedEmail(null); }}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'inbox' ? 'bg-[var(--primary-color)] text-black shadow-sm' : 'text-slate-500 hover:text-black hover:bg-slate-50'}`}
                    >
                        <Bell className="w-4 h-4" /> Inbox <span className="bg-black text-white px-1.5 py-0.5 rounded-full text-[10px]">{notifications.filter(n => !n.read).length}</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('outbox')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'outbox' ? 'bg-[var(--primary-color)] text-black shadow-sm' : 'text-slate-500 hover:text-black hover:bg-slate-50'}`}
                    >
                        <Mail className="w-4 h-4" /> Outbox <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px]">{emails.filter(e => !e.read).length}</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex gap-6">
                {/* Main Content Area */}
                <div className={`flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${activeTab === 'outbox' && selectedEmail ? 'hidden md:flex' : ''}`}>
                    {activeTab === 'inbox' ? (
                        <div className="overflow-y-auto divide-y divide-slate-50 h-full">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-8">
                                    <Bell className="w-12 h-12 text-slate-200 mb-4" />
                                    <p>You're all caught up!</p>
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div key={notif.id} className={`p-5 hover:bg-slate-50 transition-colors flex gap-4 ${!notif.read ? 'bg-slate-50/50' : ''}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                            notif.type === 'approval' ? 'bg-blue-50 text-blue-600' :
                                            notif.type === 'agent' ? 'bg-[var(--primary-color)]/10 text-black' :
                                            notif.type === 'alert' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                        }`}>
                                            {notif.type === 'approval' && <CheckCircle2 className="w-5 h-5" />}
                                            {notif.type === 'agent' && <Sparkles className="w-5 h-5" />}
                                            {notif.type === 'alert' && <AlertCircle className="w-5 h-5" />}
                                            {notif.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className={`text-sm font-bold ${!notif.read ? 'text-slate-900' : 'text-slate-700'}`}>{notif.title}</h3>
                                                <span className="text-xs text-slate-400 whitespace-nowrap">{notif.time}</span>
                                            </div>
                                            <p className="text-sm text-slate-500 leading-relaxed mb-3">{notif.description}</p>
                                            {notif.actionLabel && (
                                                <button className="text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:border-black transition-colors shadow-sm">
                                                    {notif.actionLabel}
                                                </button>
                                            )}
                                        </div>
                                        {!notif.read && <div className="w-2 h-2 rounded-full bg-[var(--primary-color)] mt-2"></div>}
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        // OUTBOX LIST
                        !connectedApps.gmail && !connectedApps.outlook ? (
                            <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                                    <Plug className="w-10 h-10 text-slate-300" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 mb-2">Connect your inbox</h2>
                                <p className="text-slate-500 text-sm max-w-sm mb-8 leading-relaxed">
                                    To enable the Outbox and let the Agent assist with drafts and invoices, please connect your email provider.
                                </p>
                                <div className="flex flex-col gap-3 w-full max-w-xs">
                                    <button 
                                        onClick={() => handleConnectApp('gmail')}
                                        disabled={!!isConnecting}
                                        className="flex items-center justify-center gap-3 w-full py-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 font-bold text-sm shadow-sm transition-all"
                                    >
                                        {isConnecting === 'gmail' ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <Mail className="w-4 h-4 text-red-500" />}
                                        Connect Gmail
                                    </button>
                                    <button 
                                        onClick={() => handleConnectApp('outlook')}
                                        disabled={!!isConnecting}
                                        className="flex items-center justify-center gap-3 w-full py-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 font-bold text-sm shadow-sm transition-all"
                                    >
                                        {isConnecting === 'outlook' ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <Mail className="w-4 h-4 text-blue-500" />}
                                        Connect Outlook
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // CONNECTED STATE
                            <div className="flex flex-col h-full">
                                {/* Outbox Header: Search & Filters */}
                                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col xl:flex-row gap-4 xl:items-center">
                                     <div className="relative flex-1 w-full">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Search by sender, subject or #tags..." 
                                            value={outboxSearch}
                                            onChange={(e) => setOutboxSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)] bg-white shadow-sm transition-all text-slate-900 placeholder:text-slate-400"
                                        />
                                     </div>
                                     
                                     <div className="flex items-center gap-3 overflow-x-auto pb-1 xl:pb-0">
                                        {/* Source Filter */}
                                        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm shrink-0">
                                            <button 
                                                onClick={() => setSourceFilter('all')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sourceFilter === 'all' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                All
                                            </button>
                                            <button 
                                                onClick={() => setSourceFilter('gmail')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${sourceFilter === 'gmail' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                <Mail className="w-3.5 h-3.5" /> Gmail
                                            </button>
                                            <button 
                                                onClick={() => setSourceFilter('outlook')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${sourceFilter === 'outlook' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                <Mail className="w-3.5 h-3.5" /> Outlook
                                            </button>
                                        </div>

                                        {/* Sort Filter */}
                                        <button 
                                            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                                            className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap shrink-0"
                                        >
                                            <ArrowDownUp className="w-3.5 h-3.5" />
                                            {sortOrder === 'newest' ? 'Recent to Old' : 'Old to Recent'}
                                        </button>
                                     </div>
                                </div>

                                <div className="overflow-y-auto divide-y divide-slate-50 flex-1">
                                    {filteredEmails.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400 text-sm">
                                            <Inbox className="w-12 h-12 text-slate-200 mb-4" />
                                            <p>No messages found.</p>
                                        </div>
                                    ) : (
                                        filteredEmails.map(email => (
                                            <div 
                                                key={email.id} 
                                                onClick={() => handleSelectEmail(email)}
                                                className={`p-5 cursor-pointer hover:bg-slate-50 transition-colors group relative ${selectedEmail?.id === email.id ? 'bg-slate-50 ring-1 ring-inset ring-slate-200' : ''}`}
                                            >
                                                {/* Source Badge & Sender */}
                                                <div className="flex justify-between items-start mb-1.5">
                                                    <div className="flex items-center gap-3">
                                                        {/* Source Icon/Logo */}
                                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center shadow-sm ${
                                                            email.source === 'gmail' 
                                                            ? 'bg-red-50 text-red-600' 
                                                            : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                            <Mail className="w-3.5 h-3.5" />
                                                        </div>
                                                        <span className={`text-sm font-bold ${!email.read ? 'text-slate-900' : 'text-slate-600'}`}>{email.sender}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-400">{email.time}</span>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === email.id ? null : email.id); }}
                                                            className="p-1 text-slate-300 hover:text-black hover:bg-slate-200 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                        
                                                        {/* Quick Actions Menu */}
                                                        {activeActionMenu === email.id && (
                                                            <div className="absolute right-5 top-8 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-1 animate-fade-in">
                                                                <button onClick={(e) => handleMarkRead(e, email.id)} className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                                                    {email.read ? <Mail className="w-3.5 h-3.5" /> : <MailOpen className="w-3.5 h-3.5" />}
                                                                    Mark as {email.read ? 'Unread' : 'Read'}
                                                                </button>
                                                                <button onClick={(e) => handleSummarize(e, email.id)} className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                                                    <Sparkles className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                                                                    Summarize with Agent
                                                                </button>
                                                                <div className="h-px bg-slate-100 my-1"></div>
                                                                <button onClick={(e) => handleDelete(e, email.id)} className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                    Delete Message
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="pl-9">
                                                    <h4 className={`text-sm mb-1.5 ${!email.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{email.subject}</h4>
                                                    <p className="text-xs text-slate-500 line-clamp-1">{email.preview}</p>
                                                    
                                                    {email.tags && (
                                                        <div className="flex gap-2 mt-2.5">
                                                            {email.tags.map(tag => (
                                                                <span key={tag} className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTagStyles(tag)}`}>
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Agent Badge Hint in List */}
                                                    {email.agentAction && (
                                                        <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-[var(--primary-color)] bg-[var(--primary-color)]/5 px-2 py-0.5 rounded border border-[var(--primary-color)]/10">
                                                            <Sparkles className="w-3 h-3" />
                                                            Agent Action Available
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )
                    )}
                </div>

                {/* Detail View (Outbox Only) */}
                {activeTab === 'outbox' && selectedEmail && (
                    <div className="w-full md:w-[450px] bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col animate-slide-left absolute md:static inset-0 z-10 md:z-0">
                         {/* Header */}
                         <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <button onClick={() => setSelectedEmail(null)} className="md:hidden p-2 -ml-2 text-slate-500"><ChevronRight className="w-5 h-5 rotate-180" /></button>
                            <div className="flex gap-2">
                                <button className="p-2 hover:bg-white rounded-lg transition-colors text-slate-500 hover:text-black"><Share2 className="w-4 h-4" /></button>
                                <button onClick={() => setSelectedEmail(null)} className="p-2 hover:bg-white rounded-lg transition-colors text-slate-500 hover:text-black"><X className="w-4 h-4" /></button>
                            </div>
                         </div>

                         <div className="flex-1 overflow-y-auto p-6">
                             <div className="flex items-center gap-2 mb-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                    selectedEmail.source === 'gmail' 
                                    ? 'bg-red-50 text-red-600 border-red-100' 
                                    : 'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>
                                    <Mail className="w-3 h-3" /> {selectedEmail.source}
                                </span>
                                {selectedEmail.tags?.map(tag => (
                                    <span key={tag} className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTagStyles(tag)}`}>
                                        #{tag}
                                    </span>
                                ))}
                             </div>

                             <h2 className="text-xl font-bold text-slate-900 mb-4">{selectedEmail.subject}</h2>
                             <div className="flex items-center gap-3 mb-6">
                                 <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                                     {selectedEmail.sender[0]}
                                 </div>
                                 <div>
                                     <p className="text-sm font-bold text-slate-900">{selectedEmail.sender}</p>
                                     <p className="text-xs text-slate-400">{selectedEmail.time}</p>
                                 </div>
                             </div>
                             
                             <div className="prose prose-sm prose-slate mb-8">
                                 <p className="whitespace-pre-line text-slate-700">{selectedEmail.body}</p>
                             </div>

                             {/* Agent Action Zone */}
                             {selectedEmail.agentAction && (
                                <div className="bg-black/5 rounded-2xl p-4 border border-black/10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="w-4 h-4 text-[var(--primary-color)] fill-[var(--primary-color)]" />
                                        <span className="text-xs font-bold text-black uppercase tracking-wider">Agent Suggested Action</span>
                                    </div>
                                    
                                    {/* Action Content */}
                                    {agentResult ? (
                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 animate-fade-in">
                                            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
                                                {agentResult.type === 'invoice' && <FileText className="w-8 h-8 text-[var(--primary-color)]" />}
                                                {agentResult.type === 'analysis' && <PieChart className="w-8 h-8 text-amber-500" />}
                                                {agentResult.type === 'success' && <CheckCircle2 className="w-8 h-8 text-green-500" />}
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">
                                                        {agentResult.type === 'invoice' ? 'Invoice Draft #1024' : 
                                                         agentResult.type === 'analysis' ? 'Analysis Complete' : 'Success'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {agentResult.client ? `To: ${agentResult.client}` : 'Action processed.'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {agentResult.type === 'invoice' && (
                                                <div className="flex justify-between items-center text-sm mb-4">
                                                    <span className="text-slate-600">Total Amount</span>
                                                    <span className="font-bold text-slate-900">${agentResult.total.toLocaleString()}</span>
                                                </div>
                                            )}

                                            {agentResult.type === 'analysis' && (
                                                <p className="text-xs text-slate-600 mb-4 leading-relaxed bg-amber-50 p-2 rounded border border-amber-100">
                                                    {agentResult.summary}
                                                </p>
                                            )}
                                            
                                            {agentResult.type === 'success' && (
                                                <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                                                    {agentResult.summary}
                                                </p>
                                            )}

                                            {agentResult.type === 'invoice' && (
                                                <div className="flex gap-2">
                                                    <button className="flex-1 bg-black text-white text-xs font-bold py-2 rounded-lg hover:opacity-90">Send Invoice</button>
                                                    <button className="flex-1 bg-white border border-slate-200 text-slate-700 text-xs font-bold py-2 rounded-lg hover:bg-slate-50">Edit</button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{selectedEmail.agentAction.title}</p>
                                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{selectedEmail.agentAction.description}</p>
                                            </div>
                                            <button 
                                                onClick={handleAgentAction}
                                                disabled={isAgentWorking}
                                                className="w-full bg-white border border-slate-300 hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] text-slate-700 font-bold text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                                            >
                                                {isAgentWorking ? (
                                                    <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                                                ) : (
                                                    selectedEmail.agentAction.type === 'invoice' ? <FileText className="w-4 h-4" /> :
                                                    selectedEmail.agentAction.type === 'analysis' ? <PieChart className="w-4 h-4" /> :
                                                    selectedEmail.agentAction.type === 'reconcile' ? <ArrowRight className="w-4 h-4" /> : 
                                                    <Sparkles className="w-4 h-4" />
                                                )}
                                                {isAgentWorking ? 'Working...' : selectedEmail.agentAction.buttonLabel}
                                            </button>
                                        </div>
                                    )}
                                </div>
                             )}
                         </div>

                         {/* Reply Box */}
                         <div className="p-4 border-t border-slate-100 bg-white">
                             <div className="relative">
                                 <textarea 
                                    placeholder="Type your reply..." 
                                    className="w-full pl-4 pr-12 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-black text-sm resize-none h-20 placeholder:text-slate-400"
                                 />
                                 <div className="absolute right-2 bottom-2 flex gap-1">
                                     <button className="p-1.5 text-slate-400 hover:text-black"><Paperclip className="w-4 h-4" /></button>
                                     <button className="p-1.5 bg-black text-white rounded-lg hover:opacity-90"><Send className="w-3.5 h-3.5" /></button>
                                 </div>
                             </div>
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
};
