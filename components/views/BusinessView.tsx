import React, { useState, useEffect, useMemo } from 'react';
import { Package, Tag, Plus, Edit2, DollarSign, Percent, FileText, QrCode, X, Send, Download, Copy, Trash2, ChevronDown, Clock, Calendar, Hash, Smartphone, CreditCard, Box, Briefcase, Activity, AlertTriangle, ShieldCheck, TrendingUp, Lock, Zap, ClipboardList, Check, ArrowRight, History, Loader2, Share2, Wallet, Users, Ban } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { UserData, Service, Plan, View, Transaction, ManagedUser, FundingDetails } from '../../types';

interface BusinessViewProps {
    userData?: UserData; // Remove required _id
    onUpdateUserData?: (updates: Partial<UserData>) => void;
    services: Service[];
    setServices: React.Dispatch<React.SetStateAction<Service[]>>;
    onNavigate?: (view: View, subTab?: string, requirementInfo?: { id: string, text: string }) => void;
    transactions?: Transaction[];
    onAddTransaction?: (trx: Transaction) => void;
    staff?: ManagedUser[];
    onAskAgent?: (query: string) => void;
    hasPermission: (permission: any) => boolean;
}

interface Discount {
    id: string;
    name: string;
    code: string;
    value: number;
    type: 'Percentage' | 'Fixed';
    status: 'Active' | 'Expired';
}

interface InvoiceData {
    id: string;
    title: string;
    description: string;
    clientName: string;
    clientEmail: string;
    serviceName: string;
    quantity: number;
    unitPrice: number;
    billingFrequency: string;
    amount: number;
    dueDate: string;
    paymentLink: string;
    status: 'Draft' | 'Sent' | 'Paid';
    createdAt: string;
}

// --- KPI Framework Types ---
interface KPI {
    name: string;
    value: string;
    status: 'safe' | 'warning' | 'critical' | 'unknown';
    threshold: string;
    formula?: string;
    enforcement: string;
    agentContext?: string;
}

interface KPILayer {
    id: number;
    title: string;
    subtitle: string;
    score: number;
    color: string;
    kpis: KPI[];
}

const PAYMENT_METHODS = ['Credit Card', 'Bank Transfer', 'Crypto', 'Mobile Payment'];
const PLATFORMS = ['Web', 'Android', 'iOS'];
const FUNDING_ROUNDS = ['Bootstrapped', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+'];

const CONTINENTS_AND_COUNTRIES = [
    '--- Continents ---', 'Africa', 'Antarctica', 'Asia', 'Europe', 'North America', 'Oceania', 'South America',
    '--- Countries ---',
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
    'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
    'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo (DRC)', 'Congo (Republic)', 'Costa Rica', 'Cote d\'Ivoire', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
    'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
    'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
    'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan',
    'Kazakhstan', 'Kenya', 'Kiribati', 'Korea (North)', 'Korea (South)', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
    'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
    'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
    'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
    'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

export const BusinessView: React.FC<BusinessViewProps> = ({ userData, onUpdateUserData, onNavigate, transactions = [], onAddTransaction, staff = [], onAskAgent, hasPermission, services, setServices }) => {
    // Convex Queries
    const dbServices = useQuery(api.services.getServices, userData?._id ? { userId: userData._id as any } : 'skip');
    const discounts = useQuery(api.services.getDiscounts, userData?._id ? { userId: userData._id as any } : 'skip') || [];
    const invoiceHistory = useQuery(api.invoices.getInvoices, userData?._id ? { userId: userData._id as any } : 'skip') || [];

    // Sync Services to Parent
    useEffect(() => {
        if (dbServices) {
            // Map Convex _id to id for local state
            const mappedServices = dbServices.map(s => ({
                ...s,
                id: s._id
            }));
            setServices(mappedServices);
        }
    }, [dbServices, setServices]);

    // Convex Mutations
    const createService = useMutation(api.services.createService);
    const updateServiceMutation = useMutation(api.services.updateService);
    const deleteServiceMutation = useMutation(api.services.deleteService);
    const createDiscount = useMutation(api.services.createDiscount);
    const deleteDiscountMutation = useMutation(api.services.deleteDiscount);
    const createInvoice = useMutation(api.invoices.createInvoice);
    const markInvoiceSent = useMutation(api.invoices.markInvoiceSent);

    // UI State
    const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
    const [showInvoiceHistory, setShowInvoiceHistory] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Funding State - Managed via UserData now, with local fallback for new entry
    const funding = userData?.funding;
    const [showFundingModal, setShowFundingModal] = useState(false);
    const [newFunding, setNewFunding] = useState<FundingDetails>({ round: 'Seed', amount: 0, date: '', investorCount: 0, source: '' });

    const handleSaveFunding = () => {
        if (onUpdateUserData) {
            onUpdateUserData({ funding: newFunding });
        }
        setShowFundingModal(false);
    };

    // Data Seeding Effect - DISABLED PER USER REQUEST
    // User wants a clean slate, no auto-generated services.
    useEffect(() => {
        // Keeps effect for structure but does nothing.
    }, []);
    // Dynamic KPI Calculation
    const kpiLayers = useMemo<KPILayer[]>(() => {
        // 1. Core Financials
        const totalRevenue = transactions.filter(t => t.type === 'credit').reduce((acc, t) => acc + t.amount, 0);
        const totalExpenses = transactions.filter(t => t.type === 'debit').reduce((acc, t) => acc + Math.abs(t.amount), 0);
        const cashBalance = (funding?.amount || 0) + (totalRevenue - totalExpenses);

        // Staff Costs (Operational Expense)
        const monthlyPayroll = staff.reduce((acc, s) => acc + (s.salary && s.paymentFrequency === 'Monthly' ? s.salary : 0), 0);

        // Monthly Burn Rate
        const nonPayrollExpenses = totalExpenses;
        const monthlyBurnRate = (nonPayrollExpenses / 1) + monthlyPayroll;

        // --- Layer 1: Survival ---
        const runwayMonths = monthlyBurnRate > 0 ? cashBalance / monthlyBurnRate : (cashBalance > 0 ? 99 : 0);
        const runwayDays = Math.round(runwayMonths * 30);
        const isHiringLocked = runwayDays < 120;
        const netBurn = (totalRevenue / 1) - monthlyBurnRate;
        const avgDaysToCollect = userData?.niche === 'SaaS' ? 5 : 45;
        const avgDaysToPay = 30;
        const ccc = avgDaysToCollect - avgDaysToPay;
        const isCCCSafe = ccc < 30;

        // --- Layer 2: Economic Reality ---
        const cogs = transactions.filter(t => t.category === 'COGS' || t.category === 'Infrastructure').reduce((acc, t) => acc + Math.abs(t.amount), 0);
        const grossMargin = totalRevenue > 0 ? ((totalRevenue - cogs) / totalRevenue) * 100 : 0;
        const opLeverage = 1.2;
        const marketingSpend = transactions.filter(t => t.category === 'Marketing').reduce((acc, t) => acc + Math.abs(t.amount), 0);
        const newCustomers = Math.max(1, Math.floor(totalRevenue / 1000));
        const cac = marketingSpend > 0 ? marketingSpend / newCustomers : 0;
        const ltv = 5000;
        const ltvCacRatio = cac > 0 ? ltv / cac : 0;

        // --- Layer 3: Regulatory Survival ---
        const taxTransactions = transactions.filter(t => t.category === 'Tax');
        const taxPaid = taxTransactions.reduce((acc, t) => acc + Math.abs(t.amount), 0);
        const estTaxLiability = totalRevenue * 0.2;
        const taxExposure = totalRevenue > 0 ? Math.max(0, (estTaxLiability - taxPaid) / totalRevenue * 100) : 0;
        const completedReqs = userData?.completedRequirements?.length || 0;
        const totalReqs = 5;
        const complianceScore = Math.min(100, (completedReqs / totalReqs) * 100);

        // --- Layer 4: Capital & Trust ---
        const burnMultiple = netBurn < 0 ? Math.abs(netBurn) / (totalRevenue * 0.8) : 0.5;
        const capitalRaised = funding ? funding.amount : 0;
        const cashEfficiency = capitalRaised > 0 ? (totalRevenue * 12) / capitalRaised : 0;

        // Transparency Index Logic: Accountant, Investor, Compliance, Legal (25% each)
        const hasAccountant = staff.some(s => s.role.toLowerCase().includes('accountant') || s.role.toLowerCase().includes('finance'));
        const hasCompliance = staff.some(s => s.role.toLowerCase().includes('compliance'));
        const hasLegal = staff.some(s => s.role.toLowerCase().includes('legal') || s.role.toLowerCase().includes('counsel'));
        const hasInvestor = staff.some(s => s.accessLevel === 'Investor' || s.role.toLowerCase().includes('investor'));

        let transparencyScore = 0;
        if (hasAccountant) transparencyScore += 25;
        if (hasCompliance) transparencyScore += 25;
        if (hasLegal) transparencyScore += 25;
        if (hasInvestor) transparencyScore += 25;

        // --- Layer 5: Scale Readiness ---
        const scaleScore = (runwayDays > 180 ? 100 : runwayDays / 1.8 + grossMargin + complianceScore + transparencyScore) / 4;

        // New User / Empty State Logic
        if (userData?.isFreshSignup && transactions.length === 0 && !funding) {
            return [
                {
                    id: 1,
                    title: "Survival (Non-Negotiable)",
                    subtitle: "Cash runway & burn logic",
                    score: 0,
                    color: "bg-slate-200", // Neutral color
                    kpis: [
                        { name: "Cash Runway", value: "--", status: "unknown", threshold: "Safe: ≥ 180 days", formula: "Cash Balance ÷ Monthly Burn", enforcement: "Marketing & Hiring Locked.", agentContext: "Connect a bank account to calculate runway." },
                        { name: "Net Burn Rate", value: "--", status: "unknown", threshold: "Positive is ideal", formula: "Revenue - Expenses", enforcement: "Alerts only.", agentContext: "Calculates how fast you are losing money." },
                        { name: "Cash Conversion Cycle", value: "--", status: "unknown", threshold: "< 30 days", formula: "Days to Collect - Days to Pay", enforcement: "Inventory purchases locked.", agentContext: "Measures cash efficiency." }
                    ]
                },
                {
                    id: 2,
                    title: "Economic Reality",
                    subtitle: "Margins & Efficiency",
                    score: 0,
                    color: "bg-slate-200",
                    kpis: [
                        { name: "Gross Margin", value: "--", status: "unknown", threshold: "Target: > 65% (SaaS)", formula: "(Rev - COGS) ÷ Rev × 100", enforcement: "LOCKED: Ad Spend Scaling", agentContext: "Needs revenue and COGS data." },
                        { name: "Operating Leverage", value: "--", status: "unknown", threshold: "> 1.0", formula: "% Rev Growth ÷ % OpEx Growth", enforcement: "Alert: Unsustainable Growth", agentContext: "Requires historical growth data." },
                        { name: "LTV / CAC", value: "--", status: "unknown", threshold: "Target: > 3.0", formula: "(LTV × Margin) ÷ CAC", enforcement: "LOCKED: Marketing Budget", agentContext: "Marketing efficiency metric." }
                    ]
                },
                {
                    id: 3,
                    title: "Regulatory Survival",
                    subtitle: "Tax & Compliance",
                    score: Math.round(complianceScore), // Show actual score if they did onboarding steps
                    color: complianceScore > 0 ? "bg-amber-500" : "bg-slate-200",
                    kpis: [
                        { name: "Tax Exposure Index", value: "--", status: "unknown", threshold: "< 10% of Revenue", formula: "(Liabilities + Risks) ÷ Revenue", enforcement: "LOCKED: Dividends", agentContext: "Needs revenue to estimate tax." },
                        { name: "Compliance Coverage", value: `${Math.round(complianceScore)}%`, status: complianceScore > 0 ? "warning" : "unknown", threshold: "100%", formula: "(Completed ÷ Required) × 100", enforcement: "LOCKED: Expansion", agentContext: "Completion of onboarding requirements." },
                        { name: "Regulatory Heatmap", value: "Unknown", status: "unknown", threshold: "Low Risk", formula: "Qualitative Assessment", enforcement: "Product launch blocked.", agentContext: "Based on location stability." }
                    ]
                },
                {
                    id: 4,
                    title: "Capital & Trust",
                    subtitle: "Efficiency & Transparency",
                    score: 0,
                    color: "bg-slate-200",
                    kpis: [
                        { name: "Burn Multiple", value: "--", status: "unknown", threshold: "< 1.5", formula: "Net Burn ÷ Net New ARR", enforcement: "Alert: Investor Report Flag", agentContext: "Burn efficiency." },
                        { name: "Cash Efficiency", value: "--", status: "unknown", threshold: "> 1.0", formula: "Revenue ÷ Capital Raised", enforcement: "None", agentContext: "Capital return metric." },
                        { name: "Transparency Index", value: "--", status: "unknown", threshold: "> 75%", formula: "Staff Roles (Accountant, Investor, Compliance, Legal)", enforcement: "LOCKED: Capital Raised Usage", agentContext: "Depends on key staff roles." }
                    ]
                },
                {
                    id: 5,
                    title: "Scale Readiness",
                    subtitle: "Growth Gates",
                    score: 0,
                    color: "bg-slate-200",
                    kpis: [
                        { name: "Composite Score", value: "0/100", status: "critical", threshold: "> 80 to scale", formula: "Weighted Average", enforcement: "LOCKED: Expansion", agentContext: "Master score." }
                    ]
                }
            ];
        }

        // Return calculated layers for active users
        return [
            {
                id: 1,
                title: "Survival (Non-Negotiable)",
                subtitle: "Cash runway & burn logic",
                score: Math.min(100, Math.round((runwayDays / 180) * 100)),
                color: runwayDays > 180 ? "bg-[#50C913]" : runwayDays > 120 ? "bg-amber-500" : "bg-red-500",
                kpis: [
                    {
                        name: "Cash Runway",
                        value: `${runwayDays} Days`,
                        status: runwayDays > 180 ? "safe" : "critical",
                        threshold: "Safe: ≥ 180 days",
                        formula: "Cash Balance ÷ Monthly Burn",
                        enforcement: isHiringLocked ? "LOCKED: Marketing & New Hires" : "None",
                        agentContext: `Your runway is ${runwayDays} days. If below 120 days, I automatically lock non-essential spending features.`
                    },
                    {
                        name: "Net Burn Rate",
                        value: `$${netBurn.toLocaleString()}/mo`,
                        status: netBurn > 0 ? "safe" : "warning",
                        threshold: "Positive is ideal",
                        formula: "Total Revenue - Total Expenses",
                        enforcement: netBurn < -50000 ? "Alert: High Burn" : "None",
                        agentContext: `You are burning $${Math.abs(netBurn).toLocaleString()} per month.`
                    },
                    {
                        name: "Cash Conversion Cycle",
                        value: `${ccc} Days`,
                        status: isCCCSafe ? "safe" : "warning",
                        threshold: "< 30 days",
                        formula: "Days to Collect - Days to Pay",
                        enforcement: !isCCCSafe ? "Warning: Vendor Payments Slowed" : "None",
                        agentContext: "Your CCC measures how fast you turn inventory/spend into cash."
                    }
                ]
            },
            {
                id: 2,
                title: "Economic Reality",
                subtitle: "Margins & Efficiency",
                score: Math.round(grossMargin),
                color: grossMargin > 65 ? "bg-[#50C913]" : grossMargin > 40 ? "bg-orange-500" : "bg-red-500",
                kpis: [
                    {
                        name: "Gross Margin",
                        value: `${Math.round(grossMargin)}%`,
                        status: grossMargin > 65 ? "safe" : "warning",
                        threshold: "Target: > 65% (SaaS)",
                        formula: "(Rev - COGS) ÷ Rev × 100",
                        enforcement: grossMargin < 30 ? "LOCKED: Ad Spend Scaling" : "None",
                        agentContext: "Low margins indicate high cost of delivery. I restrict ad spend until this improves."
                    },
                    {
                        name: "Operating Leverage",
                        value: `${opLeverage}x`,
                        status: opLeverage > 1.0 ? "safe" : "critical",
                        threshold: "> 1.0 (Efficient Growth)",
                        formula: "% Rev Growth ÷ % OpEx Growth",
                        enforcement: opLeverage < 1.0 ? "Alert: Unsustainable Growth" : "None",
                        agentContext: "If < 1.0, your costs are growing faster than revenue."
                    },
                    {
                        name: "LTV / CAC",
                        value: ltvCacRatio.toFixed(1),
                        status: ltvCacRatio > 3 ? "safe" : "warning",
                        threshold: "Target: > 3.0",
                        formula: "(LTV × Margin) ÷ CAC",
                        enforcement: ltvCacRatio < 1 ? "LOCKED: Marketing Budget" : "None",
                        agentContext: "Ratio of Customer Lifetime Value to Cost of Acquisition."
                    }
                ]
            },
            {
                id: 3,
                title: "Regulatory Survival",
                subtitle: "Tax & Compliance",
                score: Math.round(100 - taxExposure), // Inverse score
                color: taxExposure < 10 ? "bg-[#50C913]" : "bg-red-500",
                kpis: [
                    {
                        name: "Tax Exposure Index",
                        value: `${Math.round(taxExposure)}%`,
                        status: taxExposure < 10 ? "safe" : "critical",
                        threshold: "< 10% of Revenue",
                        formula: "(Liabilities + Risks) ÷ Revenue",
                        enforcement: taxExposure > 15 ? "LOCKED: Dividends & Bonuses" : "None",
                        agentContext: "High exposure means potential audits. I lock profit distribution."
                    },
                    {
                        name: "Compliance Coverage",
                        value: `${Math.round(complianceScore)}%`,
                        status: complianceScore > 90 ? "safe" : "warning",
                        threshold: "100%",
                        formula: "(Completed ÷ Total Required) × 100",
                        enforcement: complianceScore < 100 ? "LOCKED: New Market Expansion" : "None",
                        agentContext: "You must meet all regulatory filings to expand."
                    },
                    {
                        name: "Regulatory Heatmap",
                        value: "Medium",
                        status: "warning",
                        threshold: "Low Risk",
                        formula: "Qualitative Assessment",
                        enforcement: "Product launch blocked in red-zones.",
                        agentContext: "Assesses geopolitical and legal stability of your regions."
                    }
                ]
            },
            {
                id: 4,
                title: "Capital & Trust",
                subtitle: "Efficiency & Transparency",
                score: Math.round(transparencyScore),
                color: transparencyScore > 75 ? "bg-blue-500" : "bg-amber-500",
                kpis: [
                    {
                        name: "Burn Multiple",
                        value: burnMultiple.toFixed(1) + 'x',
                        status: burnMultiple < 1.5 ? "safe" : "warning",
                        threshold: "< 1.5 (Efficient)",
                        formula: "Net Burn ÷ Net New ARR",
                        enforcement: burnMultiple > 2.5 ? "Alert: Investor Report Flag" : "None",
                        agentContext: "How much you burn to generate $1 of new revenue."
                    },
                    {
                        name: "Cash Efficiency",
                        value: cashEfficiency.toFixed(1) + 'x',
                        status: cashEfficiency > 0.5 ? "safe" : "warning",
                        threshold: "Benchmark Sector specific",
                        formula: "Annual Revenue ÷ Total Capital Raised",
                        enforcement: "None",
                        agentContext: "Return on invested capital."
                    },
                    {
                        name: "Transparency Index",
                        value: `${transparencyScore}%`,
                        status: transparencyScore >= 75 ? "safe" : "warning",
                        threshold: ">= 75%",
                        formula: "Roles: Accountant, Investor, Compliance, Legal (25% each)",
                        enforcement: transparencyScore < 75 ? "LOCKED: Capital Raised Usage" : "None",
                        agentContext: "Requires key staff roles (Accountant, Investor, Compliance, Legal) to unlock capital usage."
                    }
                ]
            },
            {
                id: 5,
                title: "Scale Readiness",
                subtitle: "Growth Gates",
                score: Math.round(scaleScore),
                color: scaleScore > 80 ? "bg-[#50C913]" : "bg-red-500",
                kpis: [
                    {
                        name: "Composite Score",
                        value: `${Math.round(scaleScore)}/100`,
                        status: scaleScore > 80 ? "safe" : "critical",
                        threshold: "> 80 to scale",
                        formula: "Weighted Average of All Layers",
                        enforcement: scaleScore < 80 ? "LOCKED: Expansion & Fundraising" : "Unlocked",
                        agentContext: "The master score determining if your business is ready to scale up."
                    }
                ]
            }
        ];
    }, [userData, transactions, funding, staff]);

    // Calculate Overall Score for Header
    const overallScore = useMemo(() => {
        if (!kpiLayers || kpiLayers.length === 0) return 0;
        const total = kpiLayers.reduce((sum, layer) => sum + layer.score, 0);
        return Math.round(total / kpiLayers.length);
    }, [kpiLayers]);

    const missingRequirements = useMemo(() => {
        if (userData?.isFreshSignup) {
            const completed = userData.completedRequirements || [];

            const list = [
                {
                    id: 'bank_connect',
                    label: "Connect primary bank account",
                    targetView: View.SETTINGS,
                    targetTab: 'connectors',
                    guide: "Go to the Banking section and click 'Connect via Plaid' to link your primary operating account."
                },
                {
                    id: 'legal_ids',
                    label: "Fill Legal Identities & Tax IDs",
                    targetView: View.SETTINGS,
                    targetTab: 'admin',
                    guide: "Enter your tax IDs (EIN, VAT, etc.) in the Legal Identity section to ensure compliance."
                }
            ];

            // Filter out completed and handle existing bank connection logic
            return list.filter(item => {
                if (item.id === 'bank_connect' && userData.hasConnectedBank) return false;
                return !completed.includes(item.id);
            });
        }
        return [];
    }, [userData?.isFreshSignup, userData?.hasConnectedBank, userData?.completedRequirements]);

    const handleRequirementClick = (req: any) => {
        if (onNavigate) {
            onNavigate(req.targetView, req.targetTab, { id: req.id, text: req.guide });
        }
    };

    // Modal States
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [isAddingDiscount, setIsAddingDiscount] = useState(false);

    // New Item Form States
    const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
    const [itemForm, setItemForm] = useState<Partial<Service>>({ type: 'Service', name: '', description: '', price: 0, frequency: 'Monthly', status: 'Active', plans: [] });

    // Plan Form State (for products)
    const [newPlan, setNewPlan] = useState<Partial<Plan>>({ name: '', price: 0, billingPeriod: 'Monthly', paymentMethods: [], supportedCountries: [], platforms: [] });
    const [planCountries, setPlanCountries] = useState<string[]>([]);

    const [newDiscount, setNewDiscount] = useState<Partial<Discount>>({ name: '', code: '', value: 0, type: 'Percentage', status: 'Active' });

    // Invoice Generator State
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [invoiceStep, setInvoiceStep] = useState<'create' | 'preview'>('create');
    const [newInvoice, setNewInvoice] = useState({
        title: '',
        description: '',
        clientName: '',
        clientEmail: '',
        serviceId: '',
        planId: '',
        quantity: 1,
        amount: 0,
        dueDate: ''
    });
    const [generatedInvoice, setGeneratedInvoice] = useState<InvoiceData | null>(null);
    const [isInvoiceSent, setIsInvoiceSent] = useState(false); // New state to track sending

    const servicesList = dbServices || []; // Safe access

    // Derived state for selected service in invoice form
    const selectedServiceForInvoice = servicesList.find((s: any) => s._id === newInvoice.serviceId);
    const selectedPlanForInvoice = selectedServiceForInvoice?.plans?.find((p: any) => p.id === newInvoice.planId);

    // CRUD Logic
    const handleSaveItem = async () => {
        if (!itemForm.name || !userData?._id) return;
        if (itemForm.type === 'Service' && !itemForm.price) return;
        if (itemForm.type === 'Product' && (!itemForm.plans || itemForm.plans.length === 0)) return;

        setIsLoading(true);
        try {
            if (editingServiceId) {
                // Update Existing
                const { type, name, description, price, frequency, plans, status } = itemForm;
                await updateServiceMutation({
                    serviceId: editingServiceId as any,
                    updates: { type, name, description, price, frequency, plans, status }
                });
            } else {
                // Create New
                await createService({
                    userId: userData._id as any,
                    type: itemForm.type!,
                    name: itemForm.name!,
                    description: itemForm.description || '',
                    price: itemForm.type === 'Service' ? Number(itemForm.price) : undefined,
                    frequency: itemForm.type === 'Service' ? itemForm.frequency as any : undefined,
                    plans: itemForm.type === 'Product' ? itemForm.plans : undefined,
                    status: 'Active'
                });
            }
            setIsServiceModalOpen(false);
            setEditingServiceId(null);
            resetItemForm();
        } catch (err) {
            console.error("Failed to save service:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const resetItemForm = () => {
        setItemForm({ type: 'Service', name: '', description: '', price: 0, frequency: 'Monthly', status: 'Active', plans: [] });
        setNewPlan({ name: '', price: 0, billingPeriod: 'Monthly', paymentMethods: [], supportedCountries: [], platforms: [] });
        setPlanCountries([]);
    }

    const handleEditItem = (service: any) => {
        setEditingServiceId(service._id);
        const { _id, _creationTime, ...data } = service;
        setItemForm(data);
        setIsServiceModalOpen(true);
    };

    const handleDeleteItem = async (id: string) => {
        try {
            await deleteServiceMutation({ serviceId: id as any });
        } catch (err) {
            console.error("Failed to delete service:", err);
        }
    };

    // Plan Management for Products
    const handleAddPlan = () => {
        if (!newPlan.name || !newPlan.price) return;
        const plan: Plan = {
            id: Date.now().toString(),
            name: newPlan.name!,
            price: Number(newPlan.price),
            billingPeriod: newPlan.billingPeriod as any,
            paymentMethods: newPlan.paymentMethods || [],
            supportedCountries: planCountries,
            platforms: newPlan.platforms || []
        };
        setItemForm(prev => ({ ...prev, plans: [...(prev.plans || []), plan] }));
        setNewPlan({ name: '', price: 0, billingPeriod: 'Monthly', paymentMethods: [], supportedCountries: [], platforms: [] });
        setPlanCountries([]);
    };

    const removePlan = (planId: string) => {
        setItemForm(prev => ({ ...prev, plans: prev.plans?.filter(p => p.id !== planId) }));
    };

    const togglePlanArrayField = (field: 'paymentMethods' | 'platforms', value: string) => {
        setNewPlan(prev => {
            const current = prev[field] || [];
            if (current.includes(value)) {
                return { ...prev, [field]: current.filter(i => i !== value) };
            } else {
                return { ...prev, [field]: [...current, value] };
            }
        });
    };

    const handleAddDiscount = async () => {
        if (!newDiscount.name || !newDiscount.code || !newDiscount.value || !userData?._id) return;
        setIsLoading(true);
        try {
            await createDiscount({
                userId: userData._id as any,
                name: newDiscount.name!,
                code: newDiscount.code!.toUpperCase(),
                value: Number(newDiscount.value),
                type: newDiscount.type as any,
                status: 'Active'
            });
            setIsAddingDiscount(false);
            setNewDiscount({ name: '', code: '', value: 0, type: 'Percentage', status: 'Active' });
        } catch (err) {
            console.error("Failed to add discount:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteDiscount = async (id: string) => {
        try {
            await deleteDiscountMutation({ discountId: id as any });
        } catch (err) {
            console.error("Failed to delete discount:", err);
        }
    };


    const handleServiceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const serviceId = e.target.value;
        const service = servicesList.find((s: any) => s._id === serviceId);
        // Default quantity to 1 when selecting a new service
        const defaultQty = 1;

        let amount = 0;
        let planId = '';

        if (service?.type === 'Service') {
            amount = (service.price || 0) * defaultQty;
        } else if (service?.type === 'Product' && service.plans && service.plans.length > 0) {
            // Default to first plan
            planId = service.plans[0].id;
            amount = service.plans[0].price * defaultQty;
        }

        setNewInvoice(prev => ({
            ...prev,
            serviceId,
            planId,
            quantity: defaultQty,
            amount
        }));
    };

    const handlePlanSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const planId = e.target.value;
        const service = servicesList.find((s: any) => s._id === newInvoice.serviceId);
        const plan = service?.plans?.find((p: any) => p.id === planId);

        setNewInvoice(prev => ({
            ...prev,
            planId,
            amount: plan ? plan.price * prev.quantity : 0
        }));
    }

    const handleQuantityChange = (qty: number) => {
        const service = servicesList.find((s: any) => s._id === newInvoice.serviceId);
        let unitPrice = 0;

        if (service?.type === 'Service') {
            unitPrice = service.price || 0;
        } else if (service?.type === 'Product') {
            const plan = service.plans?.find((p: any) => p.id === newInvoice.planId);
            unitPrice = plan?.price || 0;
        }

        setNewInvoice(prev => ({
            ...prev,
            quantity: qty,
            amount: unitPrice * qty
        }));
    };

    const handleGenerateInvoice = () => {
        const service = servicesList.find((s: any) => s._id === newInvoice.serviceId);
        let unitPrice = 0;
        let billingFrequency = 'One-time';
        let serviceName = service ? (service as any).name : 'Custom Service';

        if (service?.type === 'Service') {
            unitPrice = service.price || 0;
            billingFrequency = service.frequency || 'One-time';
        } else if (service?.type === 'Product') {
            const plan = (service as any).plans?.find((p: any) => p.id === newInvoice.planId);
            if (plan) {
                unitPrice = plan.price;
                billingFrequency = plan.billingPeriod;
                serviceName = `${(service as any).name} - ${plan.name}`;
            }
        }

        const invData: InvoiceData = {
            id: `INV-${Math.floor(Math.random() * 10000)}`,
            title: newInvoice.title || 'Invoice',
            description: newInvoice.description,
            clientName: newInvoice.clientName,
            clientEmail: newInvoice.clientEmail,
            serviceName,
            quantity: newInvoice.quantity,
            unitPrice,
            billingFrequency,
            amount: newInvoice.amount,
            dueDate: newInvoice.dueDate,
            paymentLink: `https://pay.amsquare.com/inv/${Math.random().toString(36).substring(7)}`,
            status: 'Draft',
            createdAt: new Date().toISOString().split('T')[0] // ISO Format YYYY-MM-DD
        };
        setGeneratedInvoice(invData);
        setIsInvoiceSent(false); // Reset sent state for new invoice
        setInvoiceStep('preview');
    };

    const handleSendInvoice = async () => {
        if (!generatedInvoice || !onAddTransaction || !userData?._id) return;

        setIsLoading(true);
        try {
            // 1. Save to Convex
            const invId = await createInvoice({
                userId: userData._id as any,
                invoiceNumber: generatedInvoice.id,
                title: generatedInvoice.title,
                description: generatedInvoice.description || '',
                amount: generatedInvoice.amount,
                status: 'Sent',
                clientName: generatedInvoice.clientName,
                clientEmail: generatedInvoice.clientEmail,
                dueDate: generatedInvoice.dueDate,
                serviceId: newInvoice.serviceId as any,
                paymentLink: generatedInvoice.paymentLink,
                serviceName: generatedInvoice.serviceName,
                quantity: generatedInvoice.quantity,
                unitPrice: generatedInvoice.unitPrice,
                billingFrequency: generatedInvoice.billingFrequency
            });

            // 2. Mark as sent (tracking)
            await markInvoiceSent({ invoiceId: invId as any });

            // 3. Add as transaction
            const newTx: Transaction = {
                id: `TRX-INV-${generatedInvoice.id.split('-')[1]}`,
                date: new Date().toISOString().split('T')[0], // ISO Format YYYY-MM-DD
                amount: generatedInvoice.amount,
                desc: `Invoice: ${generatedInvoice.title}`,
                category: 'Revenue',
                status: 'Processing',
                type: 'credit',
                merchant: generatedInvoice.clientName,
                paymentMethod: 'Invoice Link'
            };
            onAddTransaction(newTx);

            setShowInvoiceModal(false);
            setGeneratedInvoice(null);
        } catch (err) {
            console.error("Failed to send invoice:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const getQuantityLabel = (frequency?: string) => {
        switch (frequency) {
            case 'Daily': return 'Days';
            case 'Hourly': return 'Total Hours';
            case 'Monthly': return 'Months';
            case 'Yearly': return 'Years';
            default: return 'Quantity';
        }
    };

    const getStatusColor = (status: 'safe' | 'warning' | 'critical' | 'unknown') => {
        switch (status) {
            case 'safe': return 'bg-[#50C913]';
            case 'warning': return 'bg-amber-500';
            case 'critical': return 'bg-red-500';
            default: return 'bg-slate-300';
        }
    };

    const getStatusText = (status: 'safe' | 'warning' | 'critical' | 'unknown') => {
        switch (status) {
            case 'safe': return 'text-[#50C913]';
            case 'warning': return 'text-amber-500';
            case 'critical': return 'text-red-500';
            default: return 'text-slate-300';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10 relative">
            <div className="flex justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Business</h1>
                    <p className="text-slate-500 text-sm mt-1">Core KPI Framework & Offerings Configuration.</p>
                </div>
                <div className="flex gap-4 items-center">
                    {/* Invoice History Button (Conditional) */}
                    {invoiceHistory.length > 0 && (
                        <button
                            onClick={() => setShowInvoiceHistory(true)}
                            className="text-slate-600 hover:text-black font-bold text-xs flex items-center gap-2 transition-colors mr-1"
                        >
                            <History className="w-4 h-4" /> Invoice History
                        </button>
                    )}
                    {hasPermission('create_invoice') && (
                        <button
                            onClick={() => {
                                setShowInvoiceModal(true);
                                setInvoiceStep('create');
                                setNewInvoice({ title: '', description: '', clientName: '', clientEmail: '', serviceId: '', planId: '', quantity: 1, amount: 0, dueDate: '' });
                            }}
                            className="bg-black hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95"
                        >
                            <FileText className="w-4 h-4 text-[var(--primary-color)]" />
                            Generate Invoice
                        </button>
                    )}
                </div>
            </div>

            {/* --- KPI ENFORCEMENT FRAMEWORK --- */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-black" />
                        Core KPI Enforcement Framework
                    </h3>
                    <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Overall Health</span>
                        <span className={`text-sm font-bold ${overallScore > 80 ? 'text-[#50C913]' : overallScore > 50 ? 'text-amber-500' : overallScore === 0 && userData?.isFreshSignup ? 'text-slate-400' : 'text-red-500'}`}>
                            {userData?.isFreshSignup && transactions.length === 0 && !funding ? 'Pending Data' : `${overallScore}/100`}
                        </span>
                    </div>
                </div>

                {/* Requirements Panel for Fresh Signups */}
                {missingRequirements.length > 0 && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-4 animate-slide-down">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-amber-900 text-sm">Action Required: Complete Financial Profile</h4>
                                <p className="text-xs text-amber-700 mt-1 mb-3 max-w-2xl">
                                    Your KPI Framework cannot be accurately calculated until the following data points are provided.
                                    Please upload documents or connect accounts to unlock full enforcement features.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {missingRequirements.map((req) => (
                                        <button
                                            key={req.id}
                                            onClick={() => handleRequirementClick(req)}
                                            className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white px-3 py-2 rounded-lg border border-amber-100/50 shadow-sm hover:border-[#50C913] hover:text-[#50C913] transition-all group text-left"
                                        >
                                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 group-hover:border-[#50C913] shrink-0"></div>
                                            <span className="flex-1">{req.label}</span>
                                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {kpiLayers.map((layer) => (
                        <div
                            key={layer.id}
                            onClick={() => setSelectedLayer(selectedLayer === layer.id ? null : layer.id)}
                            className={`bg-white rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${selectedLayer === layer.id ? 'border-black shadow-md ring-1 ring-black' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}
                        >
                            <div className="p-4 h-full flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Layer {layer.id}</span>
                                    <div className={`w-2 h-2 rounded-full ${layer.score < 50 && layer.color !== 'bg-slate-200' ? 'bg-red-500' : layer.score < 80 && layer.color !== 'bg-slate-200' ? 'bg-amber-500' : layer.color === 'bg-slate-200' ? 'bg-slate-300' : 'bg-[#50C913]'}`}></div>
                                </div>
                                <h4 className="font-bold text-slate-900 text-sm leading-tight mb-1">{layer.title}</h4>
                                <p className="text-[10px] text-slate-500 mb-3">{layer.subtitle}</p>

                                <div className="mt-auto pt-3 border-t border-slate-50">
                                    <div className="flex justify-between items-end">
                                        <span className={`text-xl font-bold ${layer.color === 'bg-slate-200' ? 'text-slate-400' : 'text-slate-900'}`}>{layer.score}%</span>
                                        {layer.score < 80 && layer.color !== 'bg-slate-200' && <Lock className="w-3.5 h-3.5 text-slate-300 group-hover:text-red-500 transition-colors" />}
                                    </div>
                                    <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
                                        <div className={`h-full ${layer.color === 'bg-slate-200' ? 'bg-slate-300' : layer.score < 50 ? 'bg-red-500' : layer.score < 80 ? 'bg-amber-500' : 'bg-[#50C913]'}`} style={{ width: `${layer.score}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            {/* Expand Indicator */}
                            <div className={`absolute bottom-0 left-0 right-0 h-1 ${selectedLayer === layer.id ? 'bg-black' : 'bg-transparent'}`}></div>
                        </div>
                    ))}
                </div>

                {/* Expanded Layer Details */}
                {selectedLayer !== null && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 animate-slide-down relative">
                        <button onClick={() => setSelectedLayer(null)} className="absolute top-4 right-4 p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-black transition-colors">
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-slate-900">{kpiLayers[selectedLayer - 1].title} Details</h3>
                                <span className={`text-xs font-bold px-2 py-1 rounded-md text-white ${kpiLayers[selectedLayer - 1].color === 'bg-slate-200' ? 'bg-slate-400' :
                                    kpiLayers[selectedLayer - 1].score < 50 ? 'bg-red-500' :
                                        kpiLayers[selectedLayer - 1].score < 80 ? 'bg-amber-500' : 'bg-[#50C913]'
                                    }`}>
                                    Score: {kpiLayers[selectedLayer - 1].score}
                                </span>
                                {/* Declare Funding Button for Capital Layer (Moved beside score) */}
                                {selectedLayer === 4 && (
                                    <button
                                        onClick={() => setShowFundingModal(true)}
                                        className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:border-black transition-colors flex items-center gap-2 ml-2"
                                    >
                                        <Wallet className="w-3.5 h-3.5" />
                                        {funding ? 'Update Funding' : 'Declare Funding'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {kpiLayers[selectedLayer - 1].kpis.map((kpi, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full relative group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center">
                                            <h5 className="font-bold text-slate-700 text-sm">{kpi.name}</h5>
                                            {/* Agent Help Icon Beside Title - Correct Position */}
                                            <button
                                                onClick={() => onAskAgent && onAskAgent(`Regarding the KPI "${kpi.name}" which has the value "${kpi.value}". First, explain exactly how it is calculated using this formula: "${kpi.formula}". Then, provide your strategic insights. Context: ${kpi.agentContext}`)}
                                                className="ml-[20px] p-1 text-slate-300 hover:text-[#50C913] hover:bg-[#50C913]/10 rounded-full transition-colors"
                                                title={`ask ${userData?.agentName || 'Ralph'}`}
                                            >
                                                <Share2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(kpi.status)} shadow-sm ring-2 ring-white`}></div>
                                    </div>
                                    <div className="mb-4">
                                        <span className={`text-2xl font-bold ${kpi.value === '--' ? 'text-slate-300' : 'text-slate-900'}`}>{kpi.value}</span>
                                        {kpi.formula && (
                                            <p className="text-[9px] text-slate-400 font-mono mt-1 mb-1">
                                                Formula: {kpi.formula}
                                            </p>
                                        )}
                                        <p className={`text-[10px] font-bold uppercase ${getStatusText(kpi.status)}`}>
                                            Threshold: {kpi.threshold}
                                        </p>
                                    </div>
                                    <div className="mt-auto bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <ShieldCheck className="w-3.5 h-3.5 text-black" />
                                            <span className="text-[10px] font-bold text-slate-900 uppercase">System Enforcement</span>
                                        </div>
                                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                            {kpi.enforcement.includes('LOCKED') ? (
                                                <span className="flex items-center gap-1.5 text-red-600">
                                                    <Ban className="w-3 h-3" /> {kpi.enforcement}
                                                </span>
                                            ) : kpi.enforcement}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="h-px bg-slate-200 w-full my-4"></div>

            {/* SERVICES & PRODUCTS CONFIGURATION */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Services Section (Abbreviated as unchanged) */}
                {/* ... existing services code ... */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <div className="p-1.5 bg-black text-white rounded-lg"><Package className="w-4 h-4" /></div>
                            Offerings Configuration
                        </h3>
                        {hasPermission('edit_business') && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setEditingServiceId(null);
                                        resetItemForm();
                                        setItemForm(prev => ({ ...prev, type: 'Service' }));
                                        setIsServiceModalOpen(true);
                                    }}
                                    className="text-xs font-bold bg-white border border-slate-200 text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                >
                                    <Briefcase className="w-3.5 h-3.5" /> Service
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingServiceId(null);
                                        resetItemForm();
                                        setItemForm(prev => ({ ...prev, type: 'Product' }));
                                        setIsServiceModalOpen(true);
                                    }}
                                    className="text-xs font-bold bg-black text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 transition-colors"
                                >
                                    <Box className="w-3.5 h-3.5" /> Product
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
                        {isServiceModalOpen && (
                            <div className="p-6 bg-white border-b border-slate-200 animate-fade-in max-h-[80vh] overflow-y-auto">
                                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    {itemForm.type === 'Service' ? <Briefcase className="w-4 h-4 text-black" /> : <Box className="w-4 h-4 text-[#50C913]" />}
                                    {editingServiceId ? `Edit ${itemForm.type}` : `New ${itemForm.type} Details`}
                                </h4>

                                <div className="grid grid-cols-2 gap-5 mb-5">
                                    <div className="space-y-2 col-span-2 md:col-span-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
                                        <input
                                            placeholder={`e.g. ${itemForm.type === 'Service' ? 'Consulting' : 'SaaS Platform'}`}
                                            className="w-full px-4 py-3 rounded-xl border border-black bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm text-slate-900"
                                            value={itemForm.name}
                                            onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                                        />
                                    </div>

                                    {itemForm.type === 'Service' && (
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Price ($)</label>
                                            <input
                                                placeholder="0.00"
                                                type="number"
                                                className="w-full px-4 py-3 rounded-xl border border-black bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm text-slate-900"
                                                value={itemForm.price || ''}
                                                onChange={e => setItemForm({ ...itemForm, price: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2 col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                                        <input
                                            placeholder="Brief description..."
                                            className="w-full px-4 py-3 rounded-xl border border-black bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm text-slate-900"
                                            value={itemForm.description}
                                            onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                                        />
                                    </div>

                                    {itemForm.type === 'Service' && (
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Billing Frequency</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full px-4 py-3 rounded-xl border border-black bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm text-slate-900 appearance-none cursor-pointer"
                                                    value={itemForm.frequency}
                                                    onChange={e => setItemForm({ ...itemForm, frequency: e.target.value as any })}
                                                >
                                                    <option>Daily</option>
                                                    <option>Monthly</option>
                                                    <option>Yearly</option>
                                                    <option>Hourly</option>
                                                    <option>One-time</option>
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2 col-span-2 md:col-span-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                                        <div className="relative">
                                            <select
                                                className="w-full px-4 py-3 rounded-xl border border-black bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm text-slate-900 appearance-none cursor-pointer"
                                                value={itemForm.status}
                                                onChange={e => setItemForm({ ...itemForm, status: e.target.value as any })}
                                            >
                                                <option>Active</option>
                                                <option>Draft</option>
                                                <option>Archived</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* PRODUCT PLANS SECTION */}
                                {itemForm.type === 'Product' && (
                                    <div className="mt-6 border-t border-slate-200 pt-6">
                                        <h5 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                                            <Package className="w-4 h-4" /> Monetisation Plans
                                        </h5>

                                        {/* Existing Plans List */}
                                        {itemForm.plans && itemForm.plans.length > 0 && (
                                            <div className="space-y-3 mb-6">
                                                {itemForm.plans.map(plan => (
                                                    <div key={plan.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-sm text-slate-900">{plan.name}</span>
                                                                <span className="text-xs text-slate-500 font-mono">${plan.price} / {plan.billingPeriod}</span>
                                                            </div>
                                                            <div className="flex gap-2 mt-1">
                                                                {plan.platforms.map(p => <span key={p} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{p}</span>)}
                                                                {plan.supportedCountries.length > 0 && <span className="text-[10px] bg-[#50C913]/20 text-black px-1.5 py-0.5 rounded">{plan.supportedCountries.length} Regions</span>}
                                                            </div>
                                                        </div>
                                                        {hasPermission('edit_business') && (
                                                            <button onClick={() => removePlan(plan.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add Plan Form */}
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div className="space-y-2 col-span-2 md:col-span-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Plan Name</label>
                                                    <input
                                                        placeholder="Plan Name (e.g. Pro)"
                                                        className="w-full px-3 py-2 rounded-lg border border-black bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black"
                                                        value={newPlan.name}
                                                        onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
                                                    />
                                                </div>
                                                <div className="flex gap-2 col-span-2 md:col-span-1">
                                                    <div className="space-y-2 flex-1">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Price</label>
                                                        <input
                                                            placeholder="0.00"
                                                            type="number"
                                                            className="w-full px-3 py-2 rounded-lg border border-black bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black"
                                                            value={newPlan.price || ''}
                                                            onChange={e => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) })}
                                                        />
                                                    </div>
                                                    <div className="space-y-2 flex-1">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Billing</label>
                                                        <div className="relative">
                                                            <select
                                                                className="w-full px-3 py-2 rounded-lg border border-black bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black appearance-none cursor-pointer"
                                                                value={newPlan.billingPeriod}
                                                                onChange={e => setNewPlan({ ...newPlan, billingPeriod: e.target.value as any })}
                                                            >
                                                                <option>Daily</option>
                                                                <option>Monthly</option>
                                                                <option>Quarterly</option>
                                                                <option>Yearly</option>
                                                                <option>One-time</option>
                                                            </select>
                                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="col-span-2 space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Supported Regions</label>
                                                    <div className="relative">
                                                        <select
                                                            className="w-full px-3 py-2 rounded-lg border border-black bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black appearance-none cursor-pointer"
                                                            value=""
                                                            onChange={(e) => {
                                                                if (e.target.value && !planCountries.includes(e.target.value)) {
                                                                    setPlanCountries([...planCountries, e.target.value]);
                                                                }
                                                            }}
                                                        >
                                                            <option value="">Select country or continent...</option>
                                                            {CONTINENTS_AND_COUNTRIES.map((c, i) => (
                                                                <option key={i} value={c} disabled={c.startsWith('---')}>{c}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none" />
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {planCountries.map(country => (
                                                            <span key={country} className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-1 rounded text-xs font-medium text-slate-700">
                                                                {country}
                                                                <button onClick={() => setPlanCountries(planCountries.filter(c => c !== country))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6 mb-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Payment Methods</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {PAYMENT_METHODS.map(pm => (
                                                            <button
                                                                key={pm}
                                                                onClick={() => togglePlanArrayField('paymentMethods', pm)}
                                                                className={`px-2 py-1 rounded text-[10px] border transition-colors ${newPlan.paymentMethods?.includes(pm) ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                                                            >
                                                                {pm}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Platforms</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {PLATFORMS.map(pl => (
                                                            <button
                                                                key={pl}
                                                                onClick={() => togglePlanArrayField('platforms', pl)}
                                                                className={`px-2 py-1 rounded text-[10px] border transition-colors ${newPlan.platforms?.includes(pl) ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                                                            >
                                                                {pl}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleAddPlan}
                                                disabled={!newPlan.name || !newPlan.price}
                                                className="w-full py-2 bg-black text-white font-bold text-xs rounded-lg hover:bg-slate-900 disabled:opacity-50 transition-colors"
                                            >
                                                Add Plan
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 justify-end mt-6">
                                    <button onClick={() => { setIsServiceModalOpen(false); resetItemForm(); }} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                                    <button onClick={handleSaveItem} className="px-5 py-2.5 bg-[var(--primary-color)] text-black font-bold text-xs rounded-xl hover:opacity-90 shadow-sm transition-opacity">
                                        {editingServiceId ? 'Update' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100">
                                    <tr>
                                        <th className="px-5 py-3 font-medium text-[10px] uppercase tracking-wider">Type</th>
                                        <th className="px-5 py-3 font-medium text-[10px] uppercase tracking-wider">Name</th>
                                        <th className="px-5 py-3 font-medium text-[10px] uppercase tracking-wider">Pricing</th>
                                        <th className="px-5 py-3 font-medium text-[10px] uppercase tracking-wider text-right">Status</th>
                                        <th className="px-5 py-3 w-20 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {dbServices?.map((service: any) => (
                                        <tr key={service._id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-5 py-4">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${service.type === 'Product' ? 'bg-[#50C913] text-black' : 'bg-black text-white'}`}>
                                                    {service.type === 'Product' ? <Package className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-slate-900">{service.name}</div>
                                                <div className="text-xs text-slate-500 truncate max-w-[200px]">{service.description}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                {service.type === 'Service' ? (
                                                    <div>
                                                        <div className="font-mono font-medium text-slate-900">
                                                            ${service.price?.toLocaleString()}
                                                            <span className="text-xs text-slate-400 font-sans ml-1">
                                                                /{service.frequency === 'One-time' ? 'unit' :
                                                                    service.frequency === 'Hourly' ? 'hr' :
                                                                        service.frequency === 'Daily' ? 'day' :
                                                                            service.frequency === 'Yearly' ? 'yr' : 'mo'}
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase">{service.frequency}</div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="font-bold text-slate-900">{service.plans?.length || 0} Plans</div>
                                                        {service.plans && service.plans.length > 0 && (
                                                            <div className="text-[10px] text-slate-500">
                                                                Starts at <span className="font-mono">${Math.min(...service.plans.map(p => p.price)).toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${service.status === 'Active' ? 'bg-[#50C913]/20 text-black border-[#50C913]/40' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                    {service.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                {hasPermission('edit_business') && (
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEditItem(service)} className="p-2 text-slate-400 hover:text-black">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteItem(service._id)} className="p-2 text-slate-400 hover:text-red-500">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {dbServices && dbServices.length === 0 && !isServiceModalOpen && (
                            <div className="p-8 text-center text-slate-400 text-sm">No services or products configured.</div>
                        )}
                    </div>
                </div>

                {/* Discounts Section (Abbreviated as unchanged) */}
                {/* ... existing discounts code ... */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <div className="p-1.5 bg-[#50C913] text-black rounded-lg"><Tag className="w-4 h-4" /></div>
                            Reductions & Promo Codes
                        </h3>
                        {hasPermission('edit_business') && (
                            <button
                                onClick={() => setIsAddingDiscount(true)}
                                className="text-xs font-bold bg-white border border-slate-200 text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" /> Create Code
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
                        {isAddingDiscount && (
                            <div className="p-6 bg-white border-b border-slate-200 animate-fade-in">
                                <h4 className="text-sm font-bold text-slate-900 mb-4">New Discount</h4>
                                <div className="grid grid-cols-2 gap-5 mb-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Promo Name</label>
                                        <input
                                            placeholder="e.g. Summer Sale"
                                            className="w-full px-4 py-3 rounded-xl border border-black bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm text-slate-900"
                                            value={newDiscount.name}
                                            onChange={e => setNewDiscount({ ...newDiscount, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Code</label>
                                        <input
                                            placeholder="SUMMER20"
                                            className="w-full px-4 py-3 rounded-xl border border-black bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm text-slate-900 uppercase"
                                            value={newDiscount.code}
                                            onChange={e => setNewDiscount({ ...newDiscount, code: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Value</label>
                                        <input
                                            placeholder="20"
                                            type="number"
                                            className="w-full px-4 py-3 rounded-xl border border-black bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm text-slate-900"
                                            value={newDiscount.value || ''}
                                            onChange={e => setNewDiscount({ ...newDiscount, value: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                                        <div className="relative">
                                            <select
                                                className="w-full px-4 py-3 rounded-xl border border-black bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm text-slate-900 appearance-none cursor-pointer"
                                                value={newDiscount.type}
                                                onChange={e => setNewDiscount({ ...newDiscount, type: e.target.value as any })}
                                            >
                                                <option value="Percentage">Percentage (%)</option>
                                                <option value="Fixed">Fixed Amount ($)</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 justify-end">
                                    <button onClick={() => setIsAddingDiscount(false)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                                    <button onClick={handleAddDiscount} className="px-5 py-2.5 bg-[var(--primary-color)] text-black font-bold text-xs rounded-xl hover:opacity-90 shadow-sm transition-opacity">Create Code</button>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 divide-y divide-slate-100">
                            {discounts.map((discount: any) => (
                                <div key={discount._id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${discount.type === 'Percentage' ? 'bg-[#50C913] text-black' : 'bg-black text-white'}`}>
                                            {discount.type === 'Percentage' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-slate-900 text-sm">{discount.name}</h4>
                                                <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-600 tracking-wider uppercase">{discount.code}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Reduces price by <span className="font-bold text-slate-700">{discount.type === 'Percentage' ? `${discount.value}%` : `$${discount.value}`}</span>
                                            </p>
                                        </div>
                                    </div>
                                    {hasPermission('edit_business') && (
                                        <div className="flex items-center gap-4">
                                            <span className={`text-[10px] font-bold ${discount.status === 'Active' ? 'text-[var(--primary-color)]' : 'text-slate-400'}`}>
                                                {discount.status}
                                            </span>
                                            <button onClick={() => handleDeleteDiscount(discount._id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {discounts.length === 0 && !isAddingDiscount && (
                            <div className="p-8 text-center text-slate-400 text-sm">No active reductions.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Funding Modal */}
            {showFundingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Declare Funding</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Log capital raised to update cash efficiency metrics.</p>
                            </div>
                            <button onClick={() => setShowFundingModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 hover:text-black transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Funding Round</label>
                                <div className="relative">
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border border-black bg-white text-sm font-medium focus:outline-none appearance-none cursor-pointer"
                                        value={newFunding.round}
                                        onChange={(e) => setNewFunding({ ...newFunding, round: e.target.value })}
                                    >
                                        {FUNDING_ROUNDS.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Amount Raised ($)</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 rounded-xl border border-black bg-white text-sm font-medium focus:outline-none"
                                        placeholder="1000000"
                                        value={newFunding.amount || ''}
                                        onChange={(e) => setNewFunding({ ...newFunding, amount: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Date Received</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 rounded-xl border border-black bg-white text-sm font-medium focus:outline-none"
                                        value={newFunding.date}
                                        onChange={(e) => setNewFunding({ ...newFunding, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Funding Source</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-black bg-white text-sm font-medium focus:outline-none"
                                    placeholder="e.g. Y Combinator, Angel Investor, Bank Loan"
                                    value={newFunding.source}
                                    onChange={(e) => setNewFunding({ ...newFunding, source: e.target.value })}
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={handleSaveFunding}
                                    disabled={!newFunding.amount || !newFunding.date || !newFunding.source}
                                    className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-slate-900 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4" /> Save Funding Record
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice History Modal */}
            {showInvoiceHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Invoice History</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Track and manage issued invoices.</p>
                            </div>
                            <button onClick={() => setShowInvoiceHistory(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 hover:text-black transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0">
                            <table className="w-full text-left text-sm text-slate-600 border-separate border-spacing-0">
                                <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 border-b border-slate-100 font-bold text-[10px] uppercase tracking-wider">Number</th>
                                        <th className="px-6 py-4 border-b border-slate-100 font-bold text-[10px] uppercase tracking-wider">Client</th>
                                        <th className="px-6 py-4 border-b border-slate-100 font-bold text-[10px] uppercase tracking-wider">Title</th>
                                        <th className="px-6 py-4 border-b border-slate-100 font-bold text-[10px] uppercase tracking-wider text-right">Amount</th>
                                        <th className="px-6 py-4 border-b border-slate-100 font-bold text-[10px] uppercase tracking-wider text-right">Due Date</th>
                                        <th className="px-6 py-4 border-b border-slate-100 font-bold text-[10px] uppercase tracking-wider text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {invoiceHistory.map((inv: any) => (
                                        <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">{inv.invoiceNumber}</td>
                                            <td className="px-6 py-4 font-medium">{inv.clientName}</td>
                                            <td className="px-6 py-4 text-xs">{inv.title}</td>
                                            <td className="px-6 py-4 text-right font-bold text-black font-mono">${inv.amount.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right text-xs">{inv.dueDate}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inv.status === 'Paid' ? 'bg-[#50C913]/20 text-black' : inv.status === 'Sent' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {invoiceHistory.length === 0 && (
                                <div className="p-10 text-center text-slate-400 text-sm">No invoice history found.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Generator Modal */}
            {showInvoiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Generate Intelligent Invoice</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Professional billing for your offerings.</p>
                            </div>
                            <button onClick={() => setShowInvoiceModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 hover:text-black transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-8">
                            {invoiceStep === 'create' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                                                Bill To
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Client Name</label>
                                                    <input
                                                        placeholder="e.g. Acme Corp"
                                                        className="w-full px-4 py-3 rounded-xl border border-black bg-white text-sm font-medium focus:outline-none"
                                                        value={newInvoice.clientName}
                                                        onChange={e => setNewInvoice({ ...newInvoice, clientName: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Client Email</label>
                                                    <input
                                                        placeholder="client@example.com"
                                                        className="w-full px-4 py-3 rounded-xl border border-black bg-white text-sm font-medium focus:outline-none"
                                                        value={newInvoice.clientEmail}
                                                        onChange={e => setNewInvoice({ ...newInvoice, clientEmail: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                                                Invoice Meta
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Invoice Title</label>
                                                    <input
                                                        placeholder="e.g. Q1 Consulting Fee"
                                                        className="w-full px-4 py-3 rounded-xl border border-black bg-white text-sm font-medium focus:outline-none"
                                                        value={newInvoice.title}
                                                        onChange={e => setNewInvoice({ ...newInvoice, title: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Due Date</label>
                                                    <input
                                                        type="date"
                                                        className="w-full px-4 py-3 rounded-xl border border-black bg-white text-sm font-medium focus:outline-none"
                                                        value={newInvoice.dueDate}
                                                        onChange={e => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                                                Offering Selection
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Choose Service/Product</label>
                                                    <div className="relative">
                                                        <select
                                                            className="w-full px-4 py-3 rounded-xl border border-black bg-white text-sm font-medium focus:outline-none appearance-none cursor-pointer"
                                                            value={newInvoice.serviceId}
                                                            onChange={handleServiceSelect}
                                                        >
                                                            <option value="">Select Offering...</option>
                                                            {servicesList.map((s: any) => (
                                                                <option key={s._id} value={s._id}>{s.name} ({s.type})</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none" />
                                                    </div>
                                                </div>

                                                {selectedServiceForInvoice?.type === 'Product' && (
                                                    <div className="space-y-1.5 animate-fade-in">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Select Plan</label>
                                                        <div className="relative">
                                                            <select
                                                                className="w-full px-4 py-3 rounded-xl border border-black bg-white text-sm font-medium focus:outline-none appearance-none cursor-pointer"
                                                                value={newInvoice.planId}
                                                                onChange={handlePlanSelect}
                                                            >
                                                                {selectedServiceForInvoice.plans?.map((p: any) => (
                                                                    <option key={p.id} value={p.id}>{p.name} - ${p.price}</option>
                                                                ))}
                                                            </select>
                                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none" />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                                                        {getQuantityLabel(selectedServiceForInvoice?.type === 'Service' ? selectedServiceForInvoice?.frequency : selectedPlanForInvoice?.billingPeriod)}
                                                    </label>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="number"
                                                            className="flex-1 px-4 py-3 rounded-xl border border-black bg-white text-sm font-medium focus:outline-none"
                                                            value={newInvoice.quantity}
                                                            onChange={e => handleQuantityChange(parseInt(e.target.value) || 1)}
                                                            min="1"
                                                        />
                                                        <div className="bg-slate-100 px-4 py-3 rounded-xl border border-slate-200 min-w-[120px] text-right">
                                                            <span className="text-[10px] font-bold text-slate-400 block uppercase leading-none mb-1">Total Amount</span>
                                                            <span className="text-sm font-bold text-slate-900">${newInvoice.amount.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                onClick={handleGenerateInvoice}
                                                disabled={!newInvoice.clientName || !newInvoice.serviceId || !newInvoice.dueDate}
                                                className="w-full py-4 bg-black text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-xl active:scale-[0.98] disabled:opacity-30"
                                            >
                                                <Zap className="w-4 h-4 text-[var(--primary-color)]" />
                                                Generate Preview
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : generatedInvoice && (
                                <div className="space-y-8 animate-fade-in">
                                    {/* Professional Invoice Preview Card */}
                                    <div className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden shadow-inner p-8">
                                        <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                                                        <Smartphone className="w-6 h-6 text-white" />
                                                    </div>
                                                    <span className="text-xl font-bold tracking-tight text-black">{userData?.businessName || 'AMSquare Enterprise'}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium">Billed to: <span className="text-black font-bold">{generatedInvoice.clientName}</span> ({generatedInvoice.clientEmail})</p>
                                            </div>
                                            <div className="text-right">
                                                <h4 className="text-2xl font-bold text-black uppercase tracking-tighter">Invoice</h4>
                                                <p className="text-[10px] font-mono text-slate-500 font-bold">{generatedInvoice.id}</p>
                                                <p className="text-xs text-slate-500 mt-2">Due Date: <span className="text-black font-bold">{generatedInvoice.dueDate}</span></p>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="grid grid-cols-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                                                <div className="col-span-2">Description</div>
                                                <div className="text-center">Rate / Qty</div>
                                                <div className="text-right">Total</div>
                                            </div>

                                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm grid grid-cols-4 items-center">
                                                <div className="col-span-2">
                                                    <h5 className="font-bold text-slate-900">{generatedInvoice.serviceName}</h5>
                                                    <p className="text-xs text-slate-500 mt-1">{generatedInvoice.description || 'Professional services provided.'}</p>
                                                    <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase tracking-wide">{generatedInvoice.billingFrequency}</span>
                                                </div>
                                                <div className="text-center">
                                                    <div className="font-bold text-slate-900">${generatedInvoice.unitPrice.toLocaleString()}</div>
                                                    <div className="text-[10px] text-slate-400">× {generatedInvoice.quantity} units</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-black text-black">${generatedInvoice.amount.toLocaleString()}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 flex justify-end">
                                            <div className="w-full max-w-[240px] space-y-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Subtotal</span>
                                                    <span className="font-bold text-slate-900">${generatedInvoice.amount.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Tax (0%)</span>
                                                    <span className="font-bold text-slate-900">$0.00</span>
                                                </div>
                                                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                                                    <span className="font-black text-slate-900 uppercase text-xs">Total Due</span>
                                                    <span className="text-3xl font-black text-black tracking-tighter">${generatedInvoice.amount.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setInvoiceStep('create')}
                                            className="px-8 py-4 bg-white border border-slate-200 font-bold text-slate-700 rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2"
                                        >
                                            <Edit2 className="w-4 h-4" /> Edit Details
                                        </button>
                                        <button
                                            onClick={handleSendInvoice}
                                            disabled={isLoading}
                                            className="flex-1 py-4 bg-black text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-xl shadow-black/10 relative overflow-hidden group"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                                    <Send className="w-4 h-4 text-[var(--primary-color)]" />
                                                    <span>Finalize & Send to Client</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 text-center font-medium">By sending, you agree to AMSquare's terms of service and automated collection policy.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
