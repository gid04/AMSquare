
import React, { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Search, Filter, Download, MoreHorizontal, Calendar, Info, X, Repeat, CheckCircle2, AlertCircle, FileText, Building2, CreditCard, Eye, EyeOff, Plus, Lock, Shield, SlidersHorizontal, ChevronDown, Copy } from 'lucide-react';
import { UserData } from '../../types';

interface TransactionsViewProps {
    userData?: UserData;
}

interface Transaction {
    id: string;
    date: string;
    desc: string;
    category: string;
    amount: number;
    status: 'Completed' | 'Pending' | 'Processing' | 'Failed';
    type: 'debit' | 'credit';
    isRecurring?: boolean;
    merchant?: string;
    paymentMethod?: string;
    notes?: string;
}

interface BusinessCard {
    id: string;
    last4: string;
    expiry: string;
    cvv: string;
    balance: number;
    limit: number;
    purpose: string;
    holder: string;
    color: 'black' | 'green';
    status: 'Active' | 'Frozen';
    network: 'Visa' | 'Mastercard';
}

const getRelativeDate = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysOffset);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const mockTransactions: Transaction[] = [
  { id: 'TRX-9821', date: getRelativeDate(0), desc: 'AWS Infrastructure', category: 'Infrastructure', amount: -2450.00, status: 'Completed', type: 'debit', isRecurring: true, merchant: 'Amazon Web Services', paymentMethod: 'Corporate Card ••4242' },
  { id: 'TRX-9822', date: getRelativeDate(0), desc: 'Stripe Payout', category: 'Revenue', amount: 15420.50, status: 'Completed', type: 'credit', merchant: 'Stripe Inc.', paymentMethod: 'Direct Deposit' },
  { id: 'TRX-9823', date: getRelativeDate(1), desc: 'WeWork Office Rent', category: 'Operations', amount: -4500.00, status: 'Pending', type: 'debit', isRecurring: true, merchant: 'WeWork', paymentMethod: 'ACH Transfer' },
  { id: 'TRX-9824', date: getRelativeDate(1), desc: 'Q3 Tax Provision', category: 'Tax', amount: -12000.00, status: 'Completed', type: 'debit', merchant: 'IRS', paymentMethod: 'Wire Transfer', notes: 'Quarterly tax estimation payment.' },
  { id: 'TRX-9825', date: getRelativeDate(2), desc: 'Client Payment - Acme Corp', category: 'Revenue', amount: 8500.00, status: 'Completed', type: 'credit', merchant: 'Acme Corp', paymentMethod: 'Wire Transfer' },
  { id: 'TRX-9826', date: getRelativeDate(3), desc: 'Slack Technologies', category: 'Software', amount: -450.00, status: 'Completed', type: 'debit', isRecurring: true, merchant: 'Slack', paymentMethod: 'Corporate Card ••4242' },
  { id: 'TRX-9827', date: getRelativeDate(3), desc: 'Uber Business', category: 'Travel', amount: -125.40, status: 'Processing', type: 'debit', merchant: 'Uber', paymentMethod: 'Employee Card ••8811' },
];

const initialMockCards: BusinessCard[] = [
    { id: 'card_1', last4: '4242', expiry: '12/28', cvv: '843', balance: 12450.00, limit: 50000, purpose: 'Operations & Infrastructure', holder: 'Gideon Wolfe', color: 'black', status: 'Active', network: 'Visa' },
    { id: 'card_2', last4: '8811', expiry: '09/26', cvv: '125', balance: 3200.50, limit: 10000, purpose: 'Travel & Expenses', holder: 'Team Shared', color: 'green', status: 'Active', network: 'Mastercard' },
];

const generateNicheTransactions = (niche: string): Transaction[] => {
    // Generate simulated data based on industry
    const base: Transaction[] = [];
    const n = niche.toLowerCase();

    if (n.includes('tech') || n.includes('software') || n.includes('saas') || n.includes('ai')) {
        base.push(
            { id: 'TRX-NEW-1', date: getRelativeDate(0), desc: 'Cloud Hosting', category: 'Infrastructure', amount: -120.00, status: 'Completed', type: 'debit', merchant: 'DigitalOcean', paymentMethod: 'Debit Card ••1234' },
            { id: 'TRX-NEW-2', date: getRelativeDate(1), desc: 'SaaS Subscription Revenue', category: 'Revenue', amount: 4500.00, status: 'Completed', type: 'credit', merchant: 'Stripe', paymentMethod: 'Payout' },
            { id: 'TRX-NEW-3', date: getRelativeDate(2), desc: 'GitHub Enterprise', category: 'Software', amount: -210.00, status: 'Completed', type: 'debit', merchant: 'GitHub', paymentMethod: 'Debit Card ••1234' }
        );
    } else if (n.includes('retail') || n.includes('commerce') || n.includes('fashion')) {
        base.push(
            { id: 'TRX-NEW-1', date: getRelativeDate(0), desc: 'Inventory Resupply', category: 'COGS', amount: -3500.00, status: 'Pending', type: 'debit', merchant: 'Wholesale Supplier', paymentMethod: 'Wire Transfer' },
            { id: 'TRX-NEW-2', date: getRelativeDate(0), desc: 'Shopify Payout', category: 'Revenue', amount: 1240.00, status: 'Completed', type: 'credit', merchant: 'Shopify', paymentMethod: 'Direct Deposit' },
            { id: 'TRX-NEW-3', date: getRelativeDate(2), desc: 'Packaging Materials', category: 'Operations', amount: -450.00, status: 'Completed', type: 'debit', merchant: 'Uline', paymentMethod: 'Debit Card ••1234' }
        );
    } else if (n.includes('consulting') || n.includes('marketing') || n.includes('agency')) {
        base.push(
            { id: 'TRX-NEW-1', date: getRelativeDate(0), desc: 'Client Retainer - Alpha', category: 'Revenue', amount: 5000.00, status: 'Completed', type: 'credit', merchant: 'Alpha Industries', paymentMethod: 'Wire Transfer' },
            { id: 'TRX-NEW-2', date: getRelativeDate(1), desc: 'LinkedIn Ads', category: 'Marketing', amount: -800.00, status: 'Completed', type: 'debit', merchant: 'LinkedIn', paymentMethod: 'Debit Card ••1234' },
            { id: 'TRX-NEW-3', date: getRelativeDate(3), desc: 'Software Tools', category: 'Software', amount: -150.00, status: 'Completed', type: 'debit', merchant: 'HubSpot', paymentMethod: 'Debit Card ••1234' }
        );
    } else {
        // Generic fallback
        base.push(
            { id: 'TRX-NEW-1', date: getRelativeDate(0), desc: 'Opening Balance', category: 'Equity', amount: 1000.00, status: 'Completed', type: 'credit', merchant: 'Bank Deposit', paymentMethod: 'Transfer' },
            { id: 'TRX-NEW-2', date: getRelativeDate(1), desc: 'Office Supplies', category: 'Operations', amount: -250.00, status: 'Completed', type: 'debit', merchant: 'Office Depot', paymentMethod: 'Debit Card ••1234' }
        );
    }
    return base;
};

export const TransactionsView: React.FC<TransactionsViewProps> = ({ userData }) => {
  const isFresh = userData?.isFreshSignup;
  const hasBank = userData?.hasConnectedBank;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  // Date Filter State
  const [dateFilter, setDateFilter] = useState<'This Month' | 'This Year' | 'Today'>('This Month');

  // Advanced Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
      category: '',
      status: '',
      recurring: 'any' // 'any', 'yes', 'no'
  });

  // Cards State
  const [cards, setCards] = useState<BusinessCard[]>(initialMockCards);
  const [showCards, setShowCards] = useState(false);
  const [revealSensitive, setRevealSensitive] = useState(false);
  
  // Card Issuing State
  const [isIssuingCard, setIsIssuingCard] = useState(false);
  const [newCardForm, setNewCardForm] = useState({
      holder: '',
      purpose: '',
      limit: 1000,
      color: 'black' as 'black' | 'green'
  });

  const handleDateFilterClick = () => {
      if (dateFilter === 'This Month') setDateFilter('This Year');
      else if (dateFilter === 'This Year') setDateFilter('Today');
      else setDateFilter('This Month');
  };

  const handleIssueCard = () => {
      const newCard: BusinessCard = {
          id: `card_${Date.now()}`,
          last4: Math.floor(1000 + Math.random() * 9000).toString(),
          expiry: '12/29',
          cvv: Math.floor(100 + Math.random() * 900).toString(),
          balance: 0,
          limit: newCardForm.limit,
          purpose: newCardForm.purpose || 'General Expenses',
          holder: newCardForm.holder || 'New Employee',
          color: newCardForm.color,
          status: 'Active',
          network: 'Visa'
      };
      setCards([...cards, newCard]);
      setIsIssuingCard(false);
      setNewCardForm({ holder: '', purpose: '', limit: 1000, color: 'black' });
  };

  // Determine Source Data
  const sourceTransactions = useMemo(() => {
      if (isFresh) {
          if (hasBank) {
              return generateNicheTransactions(userData?.niche || 'General');
          }
          return [];
      }
      return mockTransactions;
  }, [isFresh, hasBank, userData?.niche]);

  // Filter Logic for Table
  const filteredTransactions = useMemo(() => {
    return sourceTransactions.filter(trx => {
        // Base Search
        const matchesSearch = 
            trx.desc.toLowerCase().includes(searchQuery.toLowerCase()) || 
            trx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trx.merchant?.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Tab Filter
        const matchesType = filterType === 'all' || trx.type === filterType;

        // Advanced Filters
        const matchesCategory = activeFilters.category === '' || trx.category === activeFilters.category;
        const matchesStatus = activeFilters.status === '' || trx.status === activeFilters.status;
        const matchesRecurring = activeFilters.recurring === 'any' || 
            (activeFilters.recurring === 'yes' && trx.isRecurring) || 
            (activeFilters.recurring === 'no' && !trx.isRecurring);

        return matchesSearch && matchesType && matchesCategory && matchesStatus && matchesRecurring;
    });
  }, [searchQuery, filterType, sourceTransactions, activeFilters]);

  // Calculations for Overview Cards
  const overviewMetrics = useMemo(() => {
    if (sourceTransactions.length === 0) return { income: 0, expenses: 0, balance: 0, pending: 0 };
    
    // Dynamic Reference Date (Now)
    const REF_DATE = new Date();
    const refMonth = REF_DATE.getMonth();
    const refYear = REF_DATE.getFullYear();
    const refDay = REF_DATE.getDate();

    const dateFiltered = sourceTransactions.filter(t => {
        const tDate = new Date(t.date);
        // Reset hours to avoid timezone mismatches when comparing simple dates
        tDate.setHours(12, 0, 0, 0); 
        
        if (dateFilter === 'Today') {
            return tDate.getDate() === refDay && tDate.getMonth() === refMonth && tDate.getFullYear() === refYear;
        } else if (dateFilter === 'This Month') {
            return tDate.getMonth() === refMonth && tDate.getFullYear() === refYear;
        } else if (dateFilter === 'This Year') {
            return tDate.getFullYear() === refYear;
        }
        return true;
    });

    const income = dateFiltered.filter(t => t.type === 'credit').reduce((acc, t) => acc + t.amount, 0);
    const expenses = dateFiltered.filter(t => t.type === 'debit').reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const balance = income - expenses;
    const pending = dateFiltered.filter(t => t.status === 'Pending' || t.status === 'Processing').length;
    
    return { income, expenses, balance, pending };
  }, [sourceTransactions, dateFilter]);

  const uniqueCategories = Array.from(new Set(sourceTransactions.map(t => t.category)));

  return (
    <div className="flex gap-6 h-full relative animate-fade-in pb-5">
        <div className={`flex-1 flex flex-col space-y-6 transition-all duration-300 ${selectedTransaction ? 'w-2/3' : 'w-full'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transactions</h1>
                <p className="text-slate-500 text-sm mt-1">Monitor real-time cash flow and expense categorization.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowCards(true)}
                        className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all hover:bg-slate-50 hover:border-slate-300"
                    >
                        <CreditCard className="w-3.5 h-3.5" />
                        Cards
                    </button>
                    <button 
                        onClick={handleDateFilterClick}
                        className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all hover:bg-slate-50 min-w-[110px] justify-center"
                    >
                        <Calendar className="w-3.5 h-3.5" />
                        {dateFilter}
                    </button>
                    <button className="bg-[#50C913] hover:bg-[#44ab10] text-black px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-[#50C913]/20 active:scale-95">
                        <Download className="w-3.5 h-3.5" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Income</p>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-900">
                            {overviewMetrics.income.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </span>
                        <div className="w-5 h-5 rounded-full bg-[#50C913]/10 flex items-center justify-center text-[#50C913]">
                            <ArrowUpRight className="w-3 h-3" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Expenses</p>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-900">
                            {overviewMetrics.expenses.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </span>
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                            <ArrowDownRight className="w-3 h-3" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Net Flow</p>
                    <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${overviewMetrics.balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                            {overviewMetrics.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Actions</p>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-900">{overviewMetrics.pending}</span>
                        {overviewMetrics.pending > 0 && <span className="text-xs text-amber-500 font-bold">Requires review</span>}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0 relative">
                {/* Toolbar */}
                <div className={`p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 transition-all ${showFilters ? 'border-b-0 pb-2' : 'border-b border-slate-100'}`}>
                    <div className="relative flex-1 w-full max-w-sm">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                        type="text" 
                        placeholder="Search by ID, merchant or amount..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 bg-white shadow-sm transition-all text-slate-900 placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                         <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 rounded-xl border transition-colors ${showFilters ? 'bg-black text-white border-black' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                         >
                             <SlidersHorizontal className="w-4 h-4" />
                         </button>
                         <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button 
                                onClick={() => setFilterType('all')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'all' ? 'bg-black text-[var(--primary-color)] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                All
                            </button>
                            <button 
                                onClick={() => setFilterType('credit')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'credit' ? 'bg-black text-[var(--primary-color)] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Income
                            </button>
                            <button 
                                onClick={() => setFilterType('debit')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'debit' ? 'bg-black text-[var(--primary-color)] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Expenses
                            </button>
                         </div>
                    </div>
                </div>

                {/* Horizontal Filters Panel */}
                {showFilters && (
                    <div className="px-5 pb-4 flex flex-wrap items-center gap-3 animate-slide-down border-b border-slate-100 bg-slate-50/30">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                            <div className="relative">
                                <select 
                                    value={activeFilters.category}
                                    onChange={(e) => setActiveFilters({...activeFilters, category: e.target.value})}
                                    className="pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-black appearance-none cursor-pointer min-w-[140px]"
                                >
                                    <option value="">All Categories</option>
                                    {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
                            <div className="relative">
                                <select 
                                    value={activeFilters.status}
                                    onChange={(e) => setActiveFilters({...activeFilters, status: e.target.value})}
                                    className="pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-black appearance-none cursor-pointer min-w-[140px]"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Failed">Failed</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Recurring</label>
                            <div className="flex bg-white rounded-lg p-0.5 border border-slate-200">
                                {['any', 'yes', 'no'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => setActiveFilters({...activeFilters, recurring: opt as any})}
                                        className={`px-3 py-1 text-[10px] font-bold capitalize rounded-md transition-all ${activeFilters.recurring === opt ? 'bg-black text-[var(--primary-color)]' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={() => setActiveFilters({ category: '', status: '', recurring: 'any' })}
                            className="self-end mb-0.5 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                        >
                            Reset
                        </button>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-auto flex-1">
                    {filteredTransactions.length > 0 ? (
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100 sticky top-0 z-10 backdrop-blur-sm">
                            <tr>
                                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider whitespace-nowrap w-40">Transaction ID</th>
                                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider">Description</th>
                                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider w-32">Date</th>
                                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider text-right w-40">Amount</th>
                                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider w-32 text-center">Status</th>
                                <th className="px-6 py-4 text-right font-medium uppercase text-[10px] tracking-wider w-16"></th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                            {filteredTransactions.map((trx) => (
                                <tr 
                                    key={trx.id} 
                                    onClick={() => setSelectedTransaction(trx)}
                                    className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${selectedTransaction?.id === trx.id ? 'bg-slate-50 ring-1 ring-inset ring-slate-200' : ''}`}
                                >
                                <td className="px-6 py-4 font-mono text-xs text-slate-500 whitespace-nowrap align-middle">
                                    {trx.id}
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${trx.type === 'credit' ? 'bg-[#50C913]/10 text-[#50C913]' : 'bg-slate-100 text-slate-500'}`}>
                                            {trx.category === 'Revenue' ? <ArrowDownRight className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900">{trx.desc}</span>
                                                {trx.isRecurring && (
                                                    <div className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1" title="Recurring Transaction">
                                                        <Repeat className="w-3 h-3" />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-slate-400 inline-flex items-center gap-1 mt-0.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${trx.category === 'Revenue' ? 'bg-[#50C913]' : 'bg-slate-300'}`}></span>
                                                {trx.category}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    <span className="text-slate-500 whitespace-nowrap">{trx.date}</span>
                                </td>
                                <td className="px-6 py-4 align-middle text-right">
                                    <span className={`font-mono font-medium ${trx.type === 'credit' ? 'text-[#50C913]' : 'text-slate-900'}`}>
                                        {trx.type === 'credit' ? '+' : ''}{trx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </span>
                                </td>
                                <td className="px-6 py-4 align-middle text-center">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                                        trx.status === 'Completed' ? 'bg-[#50C913]/10 text-black border-[#50C913]/20' :
                                        trx.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        'bg-slate-100 text-slate-500 border-slate-200'
                                    }`}>
                                    {trx.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right align-middle">
                                    <button className="p-2 text-slate-400 hover:text-black rounded-lg hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100">
                                    <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 min-h-[300px]">
                            <div className="p-4 bg-slate-50 rounded-full mb-3">
                                <Info className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="font-semibold text-slate-600">No transactions found</p>
                            <p className="text-xs mt-1">Try adjusting your filters or search query.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Transaction Detail Panel */}
        {selectedTransaction && (
            <div className="w-[400px] bg-white border-l border-slate-200 fixed right-0 top-0 h-full shadow-2xl z-40 animate-slide-left overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-lg font-bold text-slate-900">Transaction Details</h2>
                    <button 
                        onClick={() => setSelectedTransaction(null)}
                        className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-black transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Amount & Status Header */}
                    <div className="text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                            selectedTransaction.type === 'credit' ? 'bg-[#50C913]/10 text-[#50C913]' : 'bg-slate-100 text-slate-600'
                        }`}>
                             {selectedTransaction.category === 'Revenue' ? <ArrowDownRight className="w-8 h-8" /> : <Building2 className="w-8 h-8" />}
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                             {selectedTransaction.type === 'credit' ? '+' : ''}{selectedTransaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </h3>
                        <div className="flex items-center justify-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                selectedTransaction.status === 'Completed' ? 'bg-[#50C913]/10 text-black border-[#50C913]/20' :
                                selectedTransaction.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                                {selectedTransaction.status === 'Completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                {selectedTransaction.status}
                            </span>
                            {selectedTransaction.isRecurring && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                    <Repeat className="w-3.5 h-3.5" /> Recurring
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Details List */}
                    <div className="space-y-4">
                        <div className="flex justify-between py-3 border-b border-slate-50">
                            <span className="text-sm text-slate-500 font-medium">Merchant</span>
                            <span className="text-sm text-slate-900 font-bold">{selectedTransaction.merchant}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-slate-50">
                            <span className="text-sm text-slate-500 font-medium">Date</span>
                            <span className="text-sm text-slate-900 font-bold">{selectedTransaction.date}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-slate-50">
                            <span className="text-sm text-slate-500 font-medium">Category</span>
                            <span className="text-sm text-slate-900 font-bold flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${selectedTransaction.category === 'Revenue' ? 'bg-[#50C913]' : 'bg-slate-300'}`}></span>
                                {selectedTransaction.category}
                            </span>
                        </div>
                         <div className="flex justify-between py-3 border-b border-slate-50">
                            <span className="text-sm text-slate-500 font-medium">Payment Method</span>
                            <span className="text-sm text-slate-900 font-bold">{selectedTransaction.paymentMethod}</span>
                        </div>
                         <div className="flex justify-between py-3 border-b border-slate-50">
                            <span className="text-sm text-slate-500 font-medium">Transaction ID</span>
                            <span className="text-sm text-slate-900 font-mono">{selectedTransaction.id}</span>
                        </div>
                    </div>

                    {selectedTransaction.notes && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notes</h4>
                            <p className="text-sm text-slate-700">{selectedTransaction.notes}</p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                            <FileText className="w-4 h-4" />
                            Receipt
                        </button>
                        <button className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                             <AlertCircle className="w-4 h-4" />
                            Report Issue
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Cards Modal/Panel */}
        {showCards && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-[#f5f5f5] rounded-[32px] w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-fade-in shadow-2xl">
                    <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Business Cards</h2>
                            <p className="text-sm text-slate-500">Manage corporate cards and spending limits.</p>
                        </div>
                        <button 
                            onClick={() => setShowCards(false)}
                            className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-auto p-8">
                        {isIssuingCard ? (
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 max-w-lg mx-auto shadow-sm animate-fade-in">
                                <h3 className="text-xl font-bold text-slate-900 mb-6">Issue New Card</h3>
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Card Holder</label>
                                        <input 
                                            placeholder="Employee Name" 
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-black transition-all"
                                            value={newCardForm.holder}
                                            onChange={(e) => setNewCardForm({...newCardForm, holder: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Purpose / Department</label>
                                        <input 
                                            placeholder="e.g. Marketing Expenses" 
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-black transition-all"
                                            value={newCardForm.purpose}
                                            onChange={(e) => setNewCardForm({...newCardForm, purpose: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Monthly Limit ($)</label>
                                        <input 
                                            type="number"
                                            placeholder="1000" 
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-black transition-all"
                                            value={newCardForm.limit}
                                            onChange={(e) => setNewCardForm({...newCardForm, limit: parseFloat(e.target.value)})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Card Design</label>
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={() => setNewCardForm({...newCardForm, color: 'black'})}
                                                className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-sm ${newCardForm.color === 'black' ? 'border-black bg-black text-white' : 'border-slate-200 text-slate-600'}`}
                                            >
                                                Black Metal
                                            </button>
                                            <button 
                                                onClick={() => setNewCardForm({...newCardForm, color: 'green'})}
                                                className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-sm ${newCardForm.color === 'green' ? 'border-[#0a3305] bg-[#0a3305] text-white' : 'border-slate-200 text-slate-600'}`}
                                            >
                                                Forest Green
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-3 pt-4">
                                        <button 
                                            onClick={() => setIsIssuingCard(false)}
                                            className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold hover:bg-slate-50"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleIssueCard}
                                            className="flex-1 py-3 bg-black text-white rounded-xl font-bold hover:bg-slate-800"
                                        >
                                            Issue Card
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200 text-xs font-bold">
                                        <Lock className="w-3.5 h-3.5" />
                                        Admin View Active
                                    </div>
                                    <button 
                                        onClick={() => setRevealSensitive(!revealSensitive)}
                                        className="text-xs font-bold text-slate-600 flex items-center gap-2 hover:text-black transition-colors"
                                    >
                                        {revealSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        {revealSensitive ? 'Hide Details' : 'Show Details'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {cards.map(card => (
                                        <div key={card.id} className="space-y-6">
                                            {/* Card Visual */}
                                            <div className={`aspect-[1.586/1] rounded-2xl p-6 relative overflow-hidden shadow-xl transition-transform hover:scale-[1.02] duration-300 flex flex-col justify-between ${
                                                card.color === 'black' ? 'bg-[#1a1a1a] text-white' : 'bg-[#0a3305] text-white'
                                            }`}>
                                                {/* Background Pattern */}
                                                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)] pointer-events-none"></div>
                                                
                                                <div className="flex justify-between items-start z-10">
                                                    <span className="font-bold text-lg tracking-wider">AMSquare</span>
                                                    <span className="font-bold italic opacity-80">{card.network}</span>
                                                </div>

                                                <div className="z-10 space-y-4">
                                                    <div className="flex items-center gap-1.5 opacity-80">
                                                        <div className="w-8 h-5 bg-yellow-500/80 rounded"></div>
                                                        <div className="w-5 h-5 border border-white/50 rounded-full flex items-center justify-center"><div className="w-3 h-3 border border-white/50 rounded-full"></div></div>
                                                    </div>
                                                    <div className="font-mono text-2xl tracking-[0.15em] flex gap-4">
                                                        <span>••••</span>
                                                        <span>••••</span>
                                                        <span>••••</span>
                                                        <span>{card.last4}</span>
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <div className="text-[10px] uppercase opacity-60 font-bold mb-0.5">Card Holder</div>
                                                            <div className="font-medium tracking-wide uppercase">{card.holder}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] uppercase opacity-60 font-bold mb-0.5 text-right">Expires</div>
                                                            <div className="font-mono">{card.expiry}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Details Panel */}
                                            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                                                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                                    <span className="text-sm font-bold text-slate-500">Card Purpose</span>
                                                    <span className="text-sm font-bold text-slate-900">{card.purpose}</span>
                                                </div>
                                                
                                                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                                    <span className="text-sm font-bold text-slate-500">Card Number</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-sm text-slate-900">
                                                            {revealSensitive ? `4532 1290 8721 ${card.last4}` : `•••• •••• •••• ${card.last4}`}
                                                        </span>
                                                        <button className="text-slate-400 hover:text-black"><Copy size={12}/></button>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                                    <span className="text-sm font-bold text-slate-500">CVV / CVC</span>
                                                    <span className="font-mono text-sm text-slate-900">
                                                        {revealSensitive ? card.cvv : '•••'}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center pt-1">
                                                     <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Available Balance</p>
                                                        <p className="text-lg font-bold text-[#50C913]">{card.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                                                     </div>
                                                     <div className="text-right">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Monthly Limit</p>
                                                        <p className="text-sm font-bold text-slate-900">{card.limit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                                                     </div>
                                                </div>

                                                <div className="pt-2">
                                                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex gap-3 items-start">
                                                        <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className="text-xs font-bold text-blue-800">Payment Protocol</p>
                                                            <p className="text-[11px] text-blue-600 mt-0.5 leading-relaxed">
                                                                Payments initiated by staff are marked as <span className="font-bold">Pending</span> until approved by an admin.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 pt-2">
                                                    <button className="py-2.5 rounded-xl border border-slate-200 font-bold text-xs hover:bg-slate-50 transition-colors">
                                                        Freeze Card
                                                    </button>
                                                    <button className="py-2.5 rounded-xl bg-black text-white font-bold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                                                        <Plus className="w-3.5 h-3.5" /> Initiate Payment
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Add New Card Slot */}
                                    <button 
                                        onClick={() => setIsIssuingCard(true)}
                                        className="aspect-[1.586/1] rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-[#50C913] hover:border-[#50C913] hover:bg-[#50C913]/5 transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-[#50C913]/20 flex items-center justify-center transition-colors">
                                            <Plus className="w-6 h-6" />
                                        </div>
                                        <span className="font-bold text-sm">Issue New Card</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
