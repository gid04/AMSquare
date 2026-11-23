
import React, { useState, useMemo, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Search, Filter, Download, MoreHorizontal, Calendar, Info, X, Repeat, CheckCircle2, AlertCircle, FileText, Building2, CreditCard, Eye, EyeOff, Plus, Lock, Shield, SlidersHorizontal, ChevronDown, Copy, Check, Receipt, Tag, Wallet, MapPin } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { UserData, Transaction, Service, View, ManagedUser } from '../../types';

interface TransactionsViewProps {
    userData?: UserData;
    transactions: Transaction[];
    services: Service[];
    onNavigate?: (view: View, subTab?: string, requirementInfo?: { id: string, text: string }) => void;
    staff?: ManagedUser[];
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
    color: 'black' | 'green' | 'gold';
    status: 'Active' | 'Frozen' | 'Locked';
    network: 'Visa' | 'Mastercard' | 'Internal';
    isVirtual?: boolean;
}

const initialMockCards: BusinessCard[] = [
    { id: 'card_1', last4: '4242', expiry: '12/28', cvv: '843', balance: 12450.00, limit: 50000, purpose: 'Operations & Infrastructure', holder: 'Gideon Wolfe', color: 'black', status: 'Active', network: 'Visa' },
    { id: 'card_2', last4: '8811', expiry: '09/26', cvv: '125', balance: 3200.50, limit: 10000, purpose: 'Travel & Expenses', holder: 'Team Shared', color: 'green', status: 'Active', network: 'Mastercard' },
];

const EXPENSE_PAYMENT_METHODS = ['Corporate Card', 'Bank Transfer', 'Wire', 'Check', 'Petty Cash', 'Vendor Portal'];

export const TransactionsView: React.FC<TransactionsViewProps> = ({ userData, transactions, services, onNavigate, staff = [] }) => {
    const isFresh = userData?.isFreshSignup;

    // Convex Mutations
    const createTransaction = useMutation(api.transactions.createTransaction);

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
        recurring: 'any', // 'any', 'yes', 'no'
        paymentMethod: '',
        location: ''
    });

    // Calculate Transparency Score for Lock Logic
    const transparencyScore = useMemo(() => {
        const hasAccountant = staff.some(s => s.role.toLowerCase().includes('accountant') || s.role.toLowerCase().includes('finance'));
        const hasCompliance = staff.some(s => s.role.toLowerCase().includes('compliance'));
        const hasLegal = staff.some(s => s.role.toLowerCase().includes('legal') || s.role.toLowerCase().includes('counsel'));
        const hasInvestor = staff.some(s => s.accessLevel === 'Investor' || s.role.toLowerCase().includes('investor'));

        let score = 0;
        if (hasAccountant) score += 25;
        if (hasCompliance) score += 25;
        if (hasLegal) score += 25;
        if (hasInvestor) score += 25;
        return score;
    }, [staff]);

    const isCapitalLocked = transparencyScore < 75;

    // --- Financial State Calculations for Spend Logic ---
    const { spendableBalance, netFlow } = useMemo(() => {
        const allTimeIncome = transactions.filter(t => t.type === 'credit').reduce((acc, t) => acc + t.amount, 0);
        const allTimeExpenses = transactions.filter(t => t.type === 'debit').reduce((acc, t) => acc + Math.abs(t.amount), 0);
        const allTimeNetFlow = allTimeIncome - allTimeExpenses;
        const capitalRaised = userData?.funding?.amount || 0;
        const totalBalance = allTimeNetFlow + capitalRaised;

        let spendable = 0;
        if (isCapitalLocked) {
            // If locked, can only spend positive net flow (income generated)
            spendable = Math.max(0, allTimeNetFlow);
        } else {
            // If unlocked, can spend entire balance (net flow + capital)
            spendable = Math.max(0, totalBalance);
        }

        return { spendableBalance: spendable, netFlow: allTimeNetFlow };
    }, [transactions, userData?.funding, isCapitalLocked]);


    // Cards State
    const [cards, setCards] = useState<BusinessCard[]>([]);

    // Initialize Cards based on User State & Funding
    useEffect(() => {
        let activeCards: BusinessCard[] = [];

        if (!isFresh) {
            activeCards = [...initialMockCards];
        }

        // Add Capital Card if funding exists
        if (userData?.funding) {
            activeCards.unshift({
                id: 'funding-card',
                last4: '0000',
                expiry: 'N/A',
                cvv: '***',
                balance: userData.funding.amount,
                limit: userData.funding.amount,
                purpose: `Capital: ${userData.funding.source}`,
                holder: userData.businessName,
                color: 'gold',
                status: isCapitalLocked ? 'Locked' : 'Active',
                network: 'Internal',
                isVirtual: true
            });
        }
        setCards(activeCards);
    }, [userData?.funding, isFresh, isCapitalLocked]);

    const [showCards, setShowCards] = useState(false);
    const [revealSensitive, setRevealSensitive] = useState(false);

    // Card Issuing State
    const [isIssuingCard, setIsIssuingCard] = useState(false);
    const [newCardForm, setNewCardForm] = useState({
        holder: '',
        purpose: '',
        limit: 1000,
        deposit: 0,
        color: 'black' as 'black' | 'green' | 'gold'
    });

    // New Transaction Modal State
    const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
    const [newTx, setNewTx] = useState<Partial<Transaction> & { planId?: string, frequency?: string }>({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        type: 'debit',
        status: 'Completed',
        category: '',
        merchant: '', // Used for merchant (debit) or client (credit)
        serviceId: '',
        planId: '',
        frequency: '',
        paymentMethod: '',
        location: '',
        isRecurring: false
    });

    // Available Locations for Income
    const availableLocations = useMemo(() => {
        if (!userData) return [];
        const homeCountry = userData.location?.split(',')[1]?.trim() || userData.location?.split(',')[0]?.trim();
        return Array.from(new Set([homeCountry, ...(userData.operationRange || [])])).filter(Boolean);
    }, [userData]);

    // Receipt Modal
    const [showReceipt, setShowReceipt] = useState<Transaction | null>(null);

    // Derived state for Add Transaction Form
    const selectedService = useMemo(() => services.find(s => s.id === newTx.serviceId), [services, newTx.serviceId]);
    const selectedPlan = useMemo(() => selectedService?.plans?.find(p => p.id === newTx.planId), [selectedService, newTx.planId]);

    // Effect to auto-fill Amount and Frequency based on selections
    useEffect(() => {
        if (newTx.type === 'credit') {
            if (selectedPlan) {
                setNewTx(prev => ({
                    ...prev,
                    amount: selectedPlan.price,
                    frequency: selectedPlan.billingPeriod
                }));
            } else if (selectedService && selectedService.type === 'Service') {
                setNewTx(prev => ({
                    ...prev,
                    amount: selectedService.price || 0,
                    frequency: selectedService.frequency
                }));
            }
        }
    }, [newTx.type, selectedService, selectedPlan]);

    // Auto-set default location if not set
    useEffect(() => {
        if (isAddTransactionOpen && !newTx.location && availableLocations.length > 0) {
            setNewTx(prev => ({ ...prev, location: availableLocations[0] }));
        }
    }, [isAddTransactionOpen, availableLocations]);

    const handleDateFilterClick = () => {
        if (dateFilter === 'This Month') setDateFilter('This Year');
        else if (dateFilter === 'This Year') setDateFilter('Today');
        else setDateFilter('This Month');
    };

    const handleIssueCard = () => {
        // Validate deposit amount
        if (newCardForm.deposit > spendableBalance) {
            alert(`Insufficient spendable funds. You have $${spendableBalance.toLocaleString()} available.`);
            return;
        }
        if (newCardForm.deposit < 0) {
            alert("Deposit cannot be negative.");
            return;
        }

        // Automatically create debit transaction for the deposit
        if (newCardForm.deposit > 0 && userData?._id) {
            createTransaction({
                userId: userData._id as any,
                date: new Date().toISOString().split('T')[0], // ISO Format YYYY-MM-DD
                amount: -newCardForm.deposit,
                description: `Card Funding: ${newCardForm.holder || 'New Card'}`,
                category: 'Operations',
                status: 'Completed',
                type: 'debit',
                merchant: 'Internal Transfer',
                paymentMethod: 'Transfer',
                notes: 'Initial deposit for corporate card'
            }).catch(err => console.error("Failed to fund card:", err));
        }

        const newCard: BusinessCard = {
            id: `card_${Date.now()}`,
            last4: Math.floor(1000 + Math.random() * 9000).toString(),
            expiry: '12/29',
            cvv: Math.floor(100 + Math.random() * 900).toString(),
            balance: newCardForm.deposit,
            limit: newCardForm.limit,
            purpose: newCardForm.purpose || 'General Expenses',
            holder: newCardForm.holder || 'New Employee',
            color: newCardForm.color,
            status: 'Active',
            network: 'Visa'
        };
        setCards(prev => {
            // If fresh user and this is the first card (and no funding), remove any potential placeholders
            if (isFresh && prev.length === 0) return [newCard];
            return [...prev, newCard];
        });
        setIsIssuingCard(false);
        setNewCardForm({ holder: '', purpose: '', limit: 1000, deposit: 0, color: 'black' });
    };

    const handleAddTransaction = () => {
        if (!newTx.amount || !newTx.category) return;
        if (newTx.type === 'credit' && !newTx.serviceId) {
            alert("Please select a Service or Product for income transactions.");
            return;
        }

        // Check for Spendability Rules on Expenses
        if (newTx.type === 'debit') {
            const expenseAmount = Math.abs(Number(newTx.amount));

            if (spendableBalance <= 0) {
                alert(isCapitalLocked
                    ? "Transaction blocked: You have no positive net flow to spend, and your capital is locked. Increase revenue or unlock capital by improving transparency."
                    : "Transaction blocked: Insufficient funds.");
                return;
            }

            if (expenseAmount > spendableBalance) {
                alert(`Transaction blocked: Insufficient spendable funds. You have $${spendableBalance.toLocaleString()} available.`);
                return;
            }
        }

        // Construct Description with Plan info if available
        let desc = newTx.merchant || (newTx.type === 'credit' ? 'Client Payment' : 'Expense');
        if (newTx.type === 'credit' && selectedService) {
            desc = `${selectedService.name}`;
            if (selectedPlan) desc += ` - ${selectedPlan.name}`;
        }

        createTransaction({
            userId: userData?._id as any,
            date: new Date(newTx.date!).toISOString().split('T')[0], // Store as YYYY-MM-DD
            amount: newTx.type === 'debit' ? -Math.abs(Number(newTx.amount)) : Math.abs(Number(newTx.amount)),
            description: desc,
            category: newTx.category!,
            status: newTx.status!,
            type: newTx.type as any,
            isRecurring: newTx.isRecurring,
            merchant: newTx.merchant,
            paymentMethod: newTx.paymentMethod || 'Manual Entry',
            notes: newTx.frequency ? `Frequency: ${newTx.frequency}` : undefined,
            location: newTx.location,
            serviceId: (newTx.serviceId as any) || undefined
        }).catch(err => console.error("Failed to add transaction:", err));

        setIsAddTransactionOpen(false);
        // Reset form
        setNewTx({
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            type: 'debit',
            status: 'Completed',
            category: '',
            merchant: '',
            serviceId: '',
            planId: '',
            frequency: '',
            paymentMethod: '',
            location: '',
            isRecurring: false
        });
    };

    // Filter Logic for Table
    const filteredTransactions = useMemo(() => {
        return transactions.filter(trx => {
            // Base Search
            const safeSearch = searchQuery.toLowerCase();
            const matchesSearch =
                (trx.description || "").toLowerCase().includes(safeSearch) ||
                (trx.id || "").toLowerCase().includes(safeSearch) ||
                (trx.category || "").toLowerCase().includes(safeSearch) ||
                (trx.merchant || "").toLowerCase().includes(safeSearch) ||
                (trx.paymentMethod || "").toLowerCase().includes(safeSearch) ||
                (trx.location || "").toLowerCase().includes(safeSearch);

            // Tab Filter
            const matchesType = filterType === 'all' || trx.type === filterType;

            // Advanced Filters
            const matchesCategory = activeFilters.category === '' || trx.category === activeFilters.category;
            const matchesStatus = activeFilters.status === '' || trx.status === activeFilters.status;
            const matchesLocation = activeFilters.location === '' || trx.location === activeFilters.location;
            const matchesRecurring = activeFilters.recurring === 'any' ||
                (activeFilters.recurring === 'yes' && trx.isRecurring) ||
                (activeFilters.recurring === 'no' && !trx.isRecurring);
            const matchesPaymentMethod = activeFilters.paymentMethod === '' || trx.paymentMethod === activeFilters.paymentMethod;

            return matchesSearch && matchesType && matchesCategory && matchesStatus && matchesRecurring && matchesPaymentMethod && matchesLocation;
        });
    }, [searchQuery, filterType, transactions, activeFilters]);

    // Calculations for Overview Cards (Filtered by Date)
    const overviewMetrics = useMemo(() => {
        if (transactions.length === 0) return { income: 0, expenses: 0, balance: 0, netBalance: userData?.funding?.amount || 0 };

        // Dynamic Reference Date (Now)
        const REF_DATE = new Date();
        const refMonth = REF_DATE.getMonth();
        const refYear = REF_DATE.getFullYear();
        const refDay = REF_DATE.getDate();

        const dateFiltered = transactions.filter(t => {
            const tDate = new Date(t.date);
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
        const flowBalance = income - expenses; // Net Flow

        // Net Balance Calculation = Net Flow (Filtered) + Total Capital Raised
        // Note: The card visualizes specific time period data + absolute capital
        const capitalRaised = userData?.funding?.amount || 0;
        const netBalance = flowBalance + capitalRaised;

        return { income, expenses, balance: flowBalance, netBalance };
    }, [transactions, dateFilter, userData]);

    const uniqueCategories = Array.from(new Set(transactions.map(t => t.category)));
    const uniquePaymentMethods = Array.from(new Set(transactions.map(t => t.paymentMethod).filter(Boolean) as string[]));
    const uniqueLocations = Array.from(new Set(transactions.map(t => t.location).filter(Boolean) as string[]));

    return (
        <div className="flex gap-6 h-full relative animate-fade-in pb-5">
            <div className={`flex-1 flex flex-col space-y-6 transition-all duration-300 ${selectedTransaction ? 'w-2/3' : 'w-full'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transactions</h1>
                        <p className="text-slate-500 text-sm mt-1">Monitor real-time cash flow and expense categorization.</p>
                    </div>
                    <div className="flex gap-2">
                        {/* Add Transaction Button */}
                        <button
                            onClick={() => setIsAddTransactionOpen(true)}
                            className="bg-black hover:bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Transaction
                        </button>
                        <button
                            onClick={() => setShowCards(true)}
                            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all hover:bg-slate-50 hover:border-slate-300"
                        >
                            <CreditCard className="w-3.5 h-3.5" />
                            Cards
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
                    <div className="bg-black p-4 rounded-2xl border border-slate-900 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Net Balance</p>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-white">
                                {overviewMetrics.netBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                            </span>
                            <div className="w-5 h-5 rounded-full bg-[#50C913] flex items-center justify-center text-black">
                                <Building2 className="w-3 h-3" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Area (Abbreviated, same as previous) */}
                {/* ... table and filters ... */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0 relative">
                    {/* Toolbar */}
                    <div className={`p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 transition-all ${showFilters ? 'border-b-0 pb-2' : 'border-b border-slate-100'}`}>
                        <div className="relative flex-1 w-full max-w-sm">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by client, date, category..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 bg-white shadow-sm transition-all text-slate-900 placeholder:text-slate-400"
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {/* Date Filter Moved Here */}
                            <button
                                onClick={handleDateFilterClick}
                                className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all hover:bg-slate-50 min-w-[100px] justify-center"
                            >
                                <Calendar className="w-3.5 h-3.5" />
                                {dateFilter}
                            </button>

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
                                        onChange={(e) => setActiveFilters({ ...activeFilters, category: e.target.value })}
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
                                        onChange={(e) => setActiveFilters({ ...activeFilters, status: e.target.value })}
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
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Location</label>
                                <div className="relative">
                                    <select
                                        value={activeFilters.location}
                                        onChange={(e) => setActiveFilters({ ...activeFilters, location: e.target.value })}
                                        className="pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-black appearance-none cursor-pointer min-w-[140px]"
                                    >
                                        <option value="">All Locations</option>
                                        {uniqueLocations.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Method</label>
                                <div className="relative">
                                    <select
                                        value={activeFilters.paymentMethod}
                                        onChange={(e) => setActiveFilters({ ...activeFilters, paymentMethod: e.target.value })}
                                        className="pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-black appearance-none cursor-pointer min-w-[140px]"
                                    >
                                        <option value="">All Methods</option>
                                        {uniquePaymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
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
                                            onClick={() => setActiveFilters({ ...activeFilters, recurring: opt as any })}
                                            className={`px-3 py-1 text-[10px] font-bold capitalize rounded-md transition-all ${activeFilters.recurring === opt ? 'bg-black text-[var(--primary-color)]' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setActiveFilters({ category: '', status: '', recurring: 'any', paymentMethod: '', location: '' })}
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
                                                            <span className="font-bold text-slate-900">{trx.description}</span>
                                                            {trx.isRecurring && (
                                                                <div className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1" title="Recurring Transaction">
                                                                    <Repeat className="w-3 h-3" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-slate-400 inline-flex items-center gap-1">
                                                                <span className={`w-1.5 h-1.5 rounded-full ${trx.category === 'Revenue' ? 'bg-[#50C913]' : 'bg-slate-300'}`}></span>
                                                                {trx.category}
                                                            </span>
                                                            {trx.location && (
                                                                <span className="text-[10px] text-slate-400 inline-flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3" />
                                                                    {trx.location}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <span className="text-slate-500 whitespace-nowrap">
                                                    {(() => {
                                                        // Handle both ISO (YYYY-MM-DD) and Legacy (Jan 21, 2026) dates
                                                        const date = new Date(trx.date);
                                                        // Check if date is valid
                                                        if (isNaN(date.getTime())) return trx.date;

                                                        return date.toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        });
                                                    })()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 align-middle text-right">
                                                <span className={`font-mono font-medium ${trx.type === 'credit' ? 'text-[#50C913]' : 'text-slate-900'}`}>
                                                    {trx.type === 'credit' ? '+' : ''}{Math.abs(trx.amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 align-middle text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${trx.status === 'Completed' ? 'bg-[#50C913]/10 text-black border-[#50C913]/20' :
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

            {/* Transaction Detail Panel (Unchanged) */}
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
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${selectedTransaction.type === 'credit' ? 'bg-[#50C913]/10 text-[#50C913]' : 'bg-slate-100 text-slate-600'
                                }`}>
                                {selectedTransaction.category === 'Revenue' ? <ArrowDownRight className="w-8 h-8" /> : <Building2 className="w-8 h-8" />}
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                                {selectedTransaction.type === 'credit' ? '+' : ''}{Math.abs(selectedTransaction.amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                            </h3>
                            <div className="flex items-center justify-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${selectedTransaction.status === 'Completed' ? 'bg-[#50C913]/10 text-black border-[#50C913]/20' :
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
                                <span className="text-sm text-slate-500 font-medium">{selectedTransaction.type === 'credit' ? 'Client' : 'Merchant'}</span>
                                <span className="text-sm text-slate-900 font-bold">{selectedTransaction.merchant}</span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-slate-50">
                                <span className="text-sm text-slate-500 font-medium">Date</span>
                                <span className="text-sm text-slate-900 font-bold">
                                    {(() => {
                                        const date = new Date(selectedTransaction.date);
                                        return isNaN(date.getTime())
                                            ? selectedTransaction.date
                                            : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                    })()}
                                </span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-slate-50">
                                <span className="text-sm text-slate-500 font-medium">Category</span>
                                <span className="text-sm text-slate-900 font-bold flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${selectedTransaction.category === 'Revenue' ? 'bg-[#50C913]' : 'bg-slate-300'}`}></span>
                                    {selectedTransaction.category}
                                </span>
                            </div>
                            {selectedTransaction.location && (
                                <div className="flex justify-between py-3 border-b border-slate-50">
                                    <span className="text-sm text-slate-500 font-medium">Location</span>
                                    <span className="text-sm text-slate-900 font-bold flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                        {selectedTransaction.location}
                                    </span>
                                </div>
                            )}
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
                            <button
                                onClick={() => setShowReceipt(selectedTransaction)}
                                className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                            >
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

            {/* Add Transaction Modal */}
            {isAddTransactionOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Add Transaction</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Manually register an expense or income.</p>
                            </div>
                            <button onClick={() => setIsAddTransactionOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 hover:text-black transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-5">
                            {/* Spendable Balance Indicator for Expenses */}
                            {newTx.type === 'debit' && (
                                <div className={`p-3 rounded-xl border flex items-center justify-between ${spendableBalance > 0 ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-red-50 border-red-100 text-red-700'
                                    }`}>
                                    <div className="flex items-center gap-2">
                                        <Wallet className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase">Available to Spend</span>
                                    </div>
                                    <span className="text-sm font-bold">${spendableBalance.toLocaleString()}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Transaction Type</label>
                                    <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 h-[58px]">
                                        <button
                                            onClick={() => setNewTx({ ...newTx, type: 'debit', category: '', serviceId: '' })}
                                            className={`flex-1 rounded-lg text-xs font-bold transition-all ${newTx.type === 'debit' ? 'bg-[#50C913] shadow-sm text-black' : 'text-slate-500'}`}
                                        >
                                            Expense
                                        </button>
                                        <button
                                            onClick={() => setNewTx({ ...newTx, type: 'credit', category: 'Revenue' })}
                                            className={`flex-1 rounded-lg text-xs font-bold transition-all ${newTx.type === 'credit' ? 'bg-[#50C913] shadow-sm text-black' : 'text-slate-500'}`}
                                        >
                                            Income
                                        </button>
                                    </div>
                                </div>
                                <FloatingLabelInput
                                    label="Amount ($)"
                                    placeholder="0.00"
                                    type="number"
                                    value={newTx.amount || ''}
                                    onChange={(e: any) => setNewTx({ ...newTx, amount: parseFloat(e.target.value) })}
                                />
                            </div>

                            <FloatingLabelInput
                                label="Date"
                                type="date"
                                value={newTx.date}
                                onChange={(e: any) => setNewTx({ ...newTx, date: e.target.value })}
                            />

                            <FloatingLabelInput
                                label={newTx.type === 'debit' ? 'Merchant Name' : 'Client Name'}
                                placeholder={newTx.type === 'debit' ? "e.g. Amazon Web Services" : "e.g. Acme Corp"}
                                value={newTx.merchant}
                                onChange={(e: any) => setNewTx({ ...newTx, merchant: e.target.value })}
                            />

                            {newTx.type === 'debit' ? (
                                <>
                                    <FloatingLabelSelect
                                        label="Category"
                                        placeholder="Select Category"
                                        value={newTx.category}
                                        onChange={(e: any) => setNewTx({ ...newTx, category: e.target.value })}
                                    >
                                        <option value="" disabled>Select Category</option>
                                        <option value="Infrastructure">Infrastructure</option>
                                        <option value="Operations">Operations</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Software">Software</option>
                                        <option value="Travel">Travel</option>
                                        <option value="Tax">Tax</option>
                                        <option value="COGS">COGS</option>
                                        <option value="Misc">Misc</option>
                                    </FloatingLabelSelect>
                                    <FloatingLabelSelect
                                        label="Payment Method"
                                        placeholder="Select Method"
                                        value={newTx.paymentMethod}
                                        onChange={(e: any) => setNewTx({ ...newTx, paymentMethod: e.target.value })}
                                    >
                                        <option value="" disabled>Select Method</option>
                                        {EXPENSE_PAYMENT_METHODS.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </FloatingLabelSelect>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <FloatingLabelSelect
                                                label="Product / Service"
                                                placeholder="Select Offering"
                                                value={newTx.serviceId}
                                                onChange={(e: any) => setNewTx({ ...newTx, serviceId: e.target.value, planId: '' })} // Reset plan when service changes
                                            >
                                                <option value="" disabled>Select Offering</option>
                                                {services.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
                                                ))}
                                            </FloatingLabelSelect>
                                        </div>
                                    </div>
                                    {services.length === 0 && (
                                        <p className="text-[10px] text-amber-600 font-medium pl-1">No services defined. Go to My Business to add one.</p>
                                    )}

                                    {/* Plan Selection if Product */}
                                    {selectedService?.type === 'Product' && (
                                        <FloatingLabelSelect
                                            label="Plan"
                                            placeholder="Select Plan"
                                            value={newTx.planId}
                                            onChange={(e: any) => setNewTx({ ...newTx, planId: e.target.value })}
                                        >
                                            <option value="" disabled>Select Plan</option>
                                            {selectedService.plans?.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} - ${p.price}</option>
                                            ))}
                                        </FloatingLabelSelect>
                                    )}

                                    {/* Location Selection for Income */}
                                    <FloatingLabelSelect
                                        label="Revenue Location"
                                        placeholder="Select Region"
                                        value={newTx.location}
                                        onChange={(e: any) => setNewTx({ ...newTx, location: e.target.value })}
                                    >
                                        <option value="" disabled>Select Region</option>
                                        {availableLocations.map(l => (
                                            <option key={l} value={l}>{l}</option>
                                        ))}
                                    </FloatingLabelSelect>

                                    {/* Payment Method for Income */}
                                    <FloatingLabelSelect
                                        label="Payment Method"
                                        placeholder="Select Method"
                                        value={newTx.paymentMethod}
                                        onChange={(e: any) => setNewTx({ ...newTx, paymentMethod: e.target.value })}
                                    >
                                        <option value="" disabled>Select Method</option>
                                        {selectedPlan?.paymentMethods?.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                        {(!selectedPlan || !selectedPlan.paymentMethods?.length) && (
                                            <>
                                                <option value="Credit Card">Credit Card</option>
                                                <option value="Bank Transfer">Bank Transfer</option>
                                                <option value="Cash">Cash</option>
                                                <option value="Other">Other</option>
                                            </>
                                        )}
                                    </FloatingLabelSelect>
                                </div>
                            )}

                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <input
                                    type="checkbox"
                                    id="recurring"
                                    className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black cursor-pointer"
                                    checked={newTx.isRecurring}
                                    onChange={(e) => setNewTx({ ...newTx, isRecurring: e.target.checked })}
                                />
                                <label htmlFor="recurring" className="text-sm font-medium text-slate-700 cursor-pointer select-none">Recurring Transaction</label>
                            </div>

                            {newTx.isRecurring && newTx.type === 'credit' && (
                                <FloatingLabelSelect
                                    label="Recurrence Frequency"
                                    placeholder="Select Frequency"
                                    value={newTx.frequency}
                                    onChange={(e: any) => setNewTx({ ...newTx, frequency: e.target.value })}
                                >
                                    <option value="" disabled>Select Frequency</option>
                                    {/* Auto populate based on Plan/Service if available, otherwise generic */}
                                    {selectedPlan ? (
                                        <option value={selectedPlan.billingPeriod}>{selectedPlan.billingPeriod}</option>
                                    ) : selectedService?.frequency ? (
                                        <option value={selectedService.frequency}>{selectedService.frequency}</option>
                                    ) : (
                                        <>
                                            <option value="Monthly">Monthly</option>
                                            <option value="Yearly">Yearly</option>
                                            <option value="Weekly">Weekly</option>
                                        </>
                                    )}
                                </FloatingLabelSelect>
                            )}

                            <div className="pt-2">
                                <button
                                    onClick={handleAddTransaction}
                                    disabled={!newTx.amount || !newTx.category || (newTx.type === 'credit' && !newTx.serviceId)}
                                    className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/20 flex items-center justify-center gap-2 transition-all"
                                >
                                    <Check className="w-4 h-4" /> Save Transaction
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal (Unchanged) */}
            {/* ... */}

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
                                    {/* Issue Card Form */}
                                    <h3 className="text-xl font-bold text-slate-900 mb-6">Issue New Card</h3>

                                    {/* Available Balance Display */}
                                    <div className={`p-4 rounded-xl border mb-6 flex items-center justify-between ${spendableBalance > 0 ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                        <div className="flex items-center gap-2">
                                            <Wallet className="w-5 h-5" />
                                            <div>
                                                <p className="text-xs font-bold uppercase opacity-80">Capital Available to Deposit</p>
                                                <p className="text-lg font-bold">${spendableBalance.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <FloatingLabelInput
                                            label="Card Holder"
                                            placeholder="Employee Name"
                                            value={newCardForm.holder}
                                            onChange={(e: any) => setNewCardForm({ ...newCardForm, holder: e.target.value })}
                                        />
                                        <FloatingLabelInput
                                            label="Purpose / Department"
                                            placeholder="e.g. Marketing Expenses"
                                            value={newCardForm.purpose}
                                            onChange={(e: any) => setNewCardForm({ ...newCardForm, purpose: e.target.value })}
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FloatingLabelInput
                                                label="Monthly Limit ($)"
                                                type="number"
                                                placeholder="1000"
                                                value={newCardForm.limit}
                                                onChange={(e: any) => setNewCardForm({ ...newCardForm, limit: parseFloat(e.target.value) })}
                                            />
                                            <FloatingLabelInput
                                                label="Initial Deposit ($)"
                                                type="number"
                                                placeholder="0"
                                                value={newCardForm.deposit}
                                                onChange={(e: any) => setNewCardForm({ ...newCardForm, deposit: parseFloat(e.target.value) })}
                                                max={spendableBalance}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Card Design</label>
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => setNewCardForm({ ...newCardForm, color: 'black' })}
                                                    className={`flex-1 py-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-sm ${newCardForm.color === 'black' ? 'border-black bg-black text-white' : 'border-slate-200 text-slate-600'}`}
                                                >
                                                    Black Metal
                                                </button>
                                                <button
                                                    onClick={() => setNewCardForm({ ...newCardForm, color: 'green' })}
                                                    className={`flex-1 py-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-sm ${newCardForm.color === 'green' ? 'border-[#0a3305] bg-[#0a3305] text-white' : 'border-slate-200 text-slate-600'}`}
                                                >
                                                    Forest Green
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <button
                                                onClick={() => setIsIssuingCard(false)}
                                                className="flex-1 py-4 bg-white border border-slate-200 rounded-xl font-bold hover:bg-slate-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleIssueCard}
                                                disabled={spendableBalance <= 0 || newCardForm.deposit > spendableBalance}
                                                className="flex-1 py-4 bg-black text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                                            <div key={card.id} className={`space-y-6 ${card.status === 'Locked' ? 'opacity-80' : ''}`}>
                                                {/* Card Visual */}
                                                <div className={`aspect-[1.586/1] rounded-2xl p-6 relative overflow-hidden shadow-xl transition-transform hover:scale-[1.02] duration-300 flex flex-col justify-between ${card.color === 'black' ? 'bg-[#1a1a1a] text-white' :
                                                    card.color === 'gold' ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black' :
                                                        'bg-[#0a3305] text-white'
                                                    }`}>
                                                    {/* Background Pattern */}
                                                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)] pointer-events-none"></div>

                                                    {/* Locked Overlay */}
                                                    {card.status === 'Locked' && (
                                                        <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                                                            <Lock className="w-10 h-10 mb-2" />
                                                            <span className="text-sm font-bold uppercase tracking-widest">Locked</span>
                                                            <span className="text-[10px] opacity-80 mt-1">Transparency Threshold Not Met</span>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-start z-10">
                                                        <span className="font-bold text-lg tracking-wider">AMSquare</span>
                                                        <span className="font-bold italic opacity-80">{card.network}</span>
                                                    </div>

                                                    <div className="z-10 space-y-4">
                                                        <div className="flex items-center gap-1.5 opacity-80">
                                                            <div className={`w-8 h-5 rounded ${card.color === 'gold' ? 'bg-black/20' : 'bg-yellow-500/80'}`}></div>
                                                            <div className={`w-5 h-5 border rounded-full flex items-center justify-center ${card.color === 'gold' ? 'border-black/30' : 'border-white/50'}`}>
                                                                <div className={`w-3 h-3 border rounded-full ${card.color === 'gold' ? 'border-black/30' : 'border-white/50'}`}></div>
                                                            </div>
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
                                                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 relative">
                                                    {card.status === 'Locked' && <div className="absolute inset-0 bg-slate-50/50 z-10"></div>}
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
                                                            <button className="text-slate-400 hover:text-black"><Copy size={12} /></button>
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
                                                            {card.status === 'Locked' ? 'Locked by KPI' : 'Freeze Card'}
                                                        </button>
                                                        <button
                                                            disabled={card.status === 'Locked'}
                                                            className="py-2.5 rounded-xl bg-black text-white font-bold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
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

// Reusable Floating Label Inputs (Matched to OnboardingFlow UI)
const FloatingLabelInput = ({ label, placeholder, type = "text", value, onChange, className = "", min, step, max }: any) => (
    <div className="relative group">
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            step={step}
            className={`w-full px-4 py-4 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-transparent pt-4 pb-4 ${className}`}
        />
        <label className="absolute -top-2.5 left-4 bg-white px-1 text-xs font-bold text-black pointer-events-none">{label}</label>
    </div>
);

const FloatingLabelSelect = ({ label, placeholder, value, onChange, children }: any) => (
    <div className="relative group">
        <div className="relative">
            <select
                className="w-full px-4 py-4 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-transparent appearance-none cursor-pointer pt-4 pb-4"
                value={value || ""}
                onChange={onChange}
            >
                <option value="" disabled>{placeholder}</option>
                {children}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black pointer-events-none" />
        </div>
        <label className="absolute -top-2.5 left-4 bg-white px-1 text-xs font-bold text-black pointer-events-none">{label}</label>
    </div>
);
