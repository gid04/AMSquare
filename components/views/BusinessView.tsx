
import React, { useState, useEffect, useMemo } from 'react';
import { Package, Tag, Plus, Edit2, DollarSign, Percent, FileText, QrCode, X, Send, Download, Copy, Trash2, ChevronDown, Clock, Calendar, Hash, Smartphone, CreditCard, Box, Briefcase, Activity, AlertTriangle, ShieldCheck, TrendingUp, Lock, Zap, ClipboardList, Check, ArrowRight } from 'lucide-react';
import { UserData, Service, Plan, View } from '../../types';

interface BusinessViewProps {
    userData?: UserData;
    services: Service[];
    setServices: React.Dispatch<React.SetStateAction<Service[]>>;
    onNavigate?: (view: View, subTab?: string, requirementInfo?: { id: string, text: string }) => void;
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
}

// --- KPI Framework Types ---
interface KPI {
    name: string;
    value: string;
    status: 'safe' | 'warning' | 'critical' | 'unknown';
    threshold: string;
    enforcement: string;
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

export const BusinessView: React.FC<BusinessViewProps> = ({ userData, services, setServices, onNavigate }) => {
    // Data State
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [selectedLayer, setSelectedLayer] = useState<number | null>(null);

    useEffect(() => {
        // Initialize default data if not fresh and empty
        if (!userData?.isFreshSignup && services.length === 0) {
            setServices([
                { id: '1', type: 'Service', name: 'Enterprise License', description: 'Full access to all modules.', price: 2999, frequency: 'Monthly', status: 'Active' },
                { id: '2', type: 'Service', name: 'Consulting Hour', description: 'Expert financial consultation.', price: 250, frequency: 'One-time', status: 'Active' }
            ]);
            setDiscounts([
                { id: '1', name: 'Startup Grant', code: 'START2024', value: 20, type: 'Percentage', status: 'Active' },
                { id: '2', name: 'Loyalty Bonus', code: 'LOYAL500', value: 500, type: 'Fixed', status: 'Active' }
            ]);
        }
    }, [userData]);

    // Derived KPI Layers based on User Data state
    const kpiLayers = useMemo<KPILayer[]>(() => {
        if (userData?.isFreshSignup) {
            // Fresh user state - Unknowns / Requirements needed
            return [
                {
                    id: 1,
                    title: "Survival (Non-Negotiable)",
                    subtitle: "Cash runway & burn logic",
                    score: 0,
                    color: "bg-red-500",
                    kpis: [
                        { name: "Cash Runway", value: "N/A", status: "unknown", threshold: "Safe: ≥ 180 days", enforcement: "Marketing spend & Hiring locked below 120 days." },
                        { name: "Net Burn Rate", value: "N/A", status: "unknown", threshold: "Trend flat/down 90 days", enforcement: "Alerts when acceleration > revenue growth." },
                        { name: "Cash Conversion Cycle", value: "N/A", status: "unknown", threshold: "< 30 days", enforcement: "Flagging slow-paying customers." }
                    ]
                },
                {
                    id: 2,
                    title: "Economic Reality",
                    subtitle: "Margins & Unit Economics",
                    score: 0,
                    color: "bg-red-500",
                    kpis: [
                        { name: "Gross Margin", value: "N/A", status: "unknown", threshold: "SaaS ≥ 65%", enforcement: "Scale alerts blocked if margin < threshold." },
                        { name: "Operating Leverage", value: "N/A", status: "unknown", threshold: "> 1.2", enforcement: "Hiring blocked if ratio < 1." },
                        { name: "LTV / CAC", value: "N/A", status: "unknown", threshold: "≥ 3.0", enforcement: "Ad spend scaling requires attribution." }
                    ]
                },
                {
                    id: 3,
                    title: "Regulatory Survival",
                    subtitle: "Tax & Compliance",
                    score: 50, // Partial info available
                    color: "bg-amber-500",
                    kpis: [
                        { name: "Tax Exposure Index", value: "Unknown", status: "warning", threshold: "< 5%", enforcement: "Dividend payouts locked." },
                        { name: "Compliance Coverage", value: "50%", status: "warning", threshold: "100% for scale", enforcement: "New country expansion disabled." },
                        { name: "Regulatory Heatmap", value: "Unknown", status: "warning", threshold: "Low Risk", enforcement: "Product launch blocked in red-zones." }
                    ]
                },
                {
                    id: 4,
                    title: "Capital & Trust",
                    subtitle: "Efficiency & Transparency",
                    score: 0,
                    color: "bg-red-500",
                    kpis: [
                        { name: "Burn Multiple", value: "N/A", status: "unknown", threshold: "< 1.5", enforcement: "Investor alerts active > 3.0." },
                        { name: "Capital Efficiency", value: "N/A", status: "unknown", threshold: "Sector Benchmark", enforcement: "Inefficient patterns flagged." },
                        { name: "Transparency Index", value: "20%", status: "critical", threshold: "> 90%", enforcement: "Investor dashboard access granted." }
                    ]
                },
                {
                    id: 5,
                    title: "Scale Readiness",
                    subtitle: "Growth Gates",
                    score: 0,
                    color: "bg-red-500",
                    kpis: [
                        { name: "Composite Score", value: "0/100", status: "critical", threshold: "> 80 to scale", enforcement: "Expansion & Fundraising features LOCKED." }
                    ]
                }
            ];
        } else {
            // Existing user state (Mocked healthy data)
            return [
                {
                    id: 1,
                    title: "Survival (Non-Negotiable)",
                    subtitle: "Cash runway & burn logic",
                    score: 72,
                    color: "bg-red-500",
                    kpis: [
                        { name: "Cash Runway", value: "142 Days", status: "warning", threshold: "Safe: ≥ 180 days", enforcement: "Marketing spend & Hiring locked below 120 days." },
                        { name: "Net Burn Rate", value: "-$12.5k / mo", status: "safe", threshold: "Trend flat/down 90 days", enforcement: "Alerts when acceleration > revenue growth." },
                        { name: "Cash Conversion Cycle", value: "45 Days", status: "warning", threshold: "< 30 days", enforcement: "Flagging slow-paying customers." }
                    ]
                },
                {
                    id: 2,
                    title: "Economic Reality",
                    subtitle: "Margins & Unit Economics",
                    score: 88,
                    color: "bg-orange-500",
                    kpis: [
                        { name: "Gross Margin", value: "71%", status: "safe", threshold: "SaaS ≥ 65%", enforcement: "Scale alerts blocked if margin < threshold." },
                        { name: "Operating Leverage", value: "1.4x", status: "safe", threshold: "> 1.2", enforcement: "Hiring blocked if ratio < 1." },
                        { name: "LTV / CAC", value: "3.2", status: "safe", threshold: "≥ 3.0", enforcement: "Ad spend scaling requires attribution." }
                    ]
                },
                {
                    id: 3,
                    title: "Regulatory Survival",
                    subtitle: "Tax & Compliance",
                    score: 65,
                    color: "bg-yellow-500",
                    kpis: [
                        { name: "Tax Exposure Index", value: "8%", status: "warning", threshold: "< 5%", enforcement: "Dividend payouts locked." },
                        { name: "Compliance Coverage", value: "90%", status: "safe", threshold: "100% for scale", enforcement: "New country expansion disabled." },
                        { name: "Regulatory Heatmap", value: "Medium", status: "warning", threshold: "Low Risk", enforcement: "Product launch blocked in red-zones." }
                    ]
                },
                {
                    id: 4,
                    title: "Capital & Trust",
                    subtitle: "Efficiency & Transparency",
                    score: 92,
                    color: "bg-blue-500",
                    kpis: [
                        { name: "Burn Multiple", value: "1.2", status: "safe", threshold: "< 1.5", enforcement: "Investor alerts active > 3.0." },
                        { name: "Capital Efficiency", value: "$1.8 Revenue/$1", status: "safe", threshold: "Sector Benchmark", enforcement: "Inefficient patterns flagged." },
                        { name: "Transparency Index", value: "98%", status: "safe", threshold: "> 90%", enforcement: "Investor dashboard access granted." }
                    ]
                },
                {
                    id: 5,
                    title: "Scale Readiness",
                    subtitle: "Growth Gates",
                    score: 45,
                    color: "bg-[#50C913]",
                    kpis: [
                        { name: "Composite Score", value: "45/100", status: "critical", threshold: "> 80 to scale", enforcement: "Expansion & Fundraising features LOCKED." }
                    ]
                }
            ];
        }
    }, [userData?.isFreshSignup]);

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
                    id: 'upload_pl',
                    label: "Upload P&L statement (Last Month)", 
                    targetView: View.REPORTS,
                    guide: "Generate or upload a financial report to give the Agent historical context."
                },
                { 
                    id: 'legal_ids',
                    label: "Fill Legal Identities & Tax IDs", 
                    targetView: View.SETTINGS, 
                    targetTab: 'admin',
                    guide: "Enter your tax IDs (EIN, VAT, etc.) in the Legal Identity section to ensure compliance."
                },
                { 
                    id: 'burn_rate',
                    label: "Define monthly burn rate", 
                    targetView: View.ANALYST,
                    guide: "Chat with the Financial Agent to set your target burn rate or budget limits."
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

    // Derived state for selected service in invoice form
    const selectedServiceForInvoice = services.find(s => s.id === newInvoice.serviceId);
    const selectedPlanForInvoice = selectedServiceForInvoice?.plans?.find(p => p.id === newInvoice.planId);

    // CRUD Logic
    const handleSaveItem = () => {
        if (!itemForm.name) return;
        if (itemForm.type === 'Service' && !itemForm.price) return;
        if (itemForm.type === 'Product' && (!itemForm.plans || itemForm.plans.length === 0)) return;
        
        if (editingServiceId) {
            // Update Existing
            setServices(prev => prev.map(s => s.id === editingServiceId ? { ...s, ...itemForm } as Service : s));
        } else {
            // Create New
            const s: Service = {
                id: Date.now().toString(),
                type: itemForm.type!,
                name: itemForm.name!,
                description: itemForm.description || '',
                price: itemForm.type === 'Service' ? Number(itemForm.price) : undefined,
                frequency: itemForm.type === 'Service' ? itemForm.frequency as any : undefined,
                plans: itemForm.type === 'Product' ? itemForm.plans : undefined,
                status: 'Active'
            };
            setServices([...services, s]);
        }
        
        setIsServiceModalOpen(false);
        setEditingServiceId(null);
        resetItemForm();
    };

    const resetItemForm = () => {
        setItemForm({ type: 'Service', name: '', description: '', price: 0, frequency: 'Monthly', status: 'Active', plans: [] });
        setNewPlan({ name: '', price: 0, billingPeriod: 'Monthly', paymentMethods: [], supportedCountries: [], platforms: [] });
        setPlanCountries([]);
    }

    const handleEditItem = (service: Service) => {
        setEditingServiceId(service.id);
        setItemForm(service);
        setIsServiceModalOpen(true);
    };

    const handleDeleteItem = (id: string) => {
        setServices(services.filter(s => s.id !== id));
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

    const handleAddDiscount = () => {
        if (!newDiscount.name || !newDiscount.code || !newDiscount.value) return;
        const d: Discount = {
            id: Date.now().toString(),
            name: newDiscount.name!,
            code: newDiscount.code!.toUpperCase(),
            value: Number(newDiscount.value),
            type: newDiscount.type as any,
            status: 'Active'
        };
        setDiscounts([...discounts, d]);
        setIsAddingDiscount(false);
        setNewDiscount({ name: '', code: '', value: 0, type: 'Percentage', status: 'Active' });
    };

    const handleDeleteDiscount = (id: string) => {
        setDiscounts(discounts.filter(d => d.id !== id));
    };


    const handleServiceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const serviceId = e.target.value;
        const service = services.find(s => s.id === serviceId);
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
        const service = services.find(s => s.id === newInvoice.serviceId);
        const plan = service?.plans?.find(p => p.id === planId);
        
        setNewInvoice(prev => ({
            ...prev,
            planId,
            amount: plan ? plan.price * prev.quantity : 0
        }));
    }

    const handleQuantityChange = (qty: number) => {
        const service = services.find(s => s.id === newInvoice.serviceId);
        let unitPrice = 0;
        
        if (service?.type === 'Service') {
            unitPrice = service.price || 0;
        } else if (service?.type === 'Product') {
            const plan = service.plans?.find(p => p.id === newInvoice.planId);
            unitPrice = plan?.price || 0;
        }

        setNewInvoice(prev => ({
            ...prev,
            quantity: qty,
            amount: unitPrice * qty
        }));
    };

    const handleGenerateInvoice = () => {
        const service = services.find(s => s.id === newInvoice.serviceId);
        let unitPrice = 0;
        let billingFrequency = 'One-time';
        let serviceName = service ? service.name : 'Custom Service';

        if (service?.type === 'Service') {
            unitPrice = service.price || 0;
            billingFrequency = service.frequency || 'One-time';
        } else if (service?.type === 'Product') {
            const plan = service.plans?.find(p => p.id === newInvoice.planId);
            if (plan) {
                unitPrice = plan.price;
                billingFrequency = plan.billingPeriod;
                serviceName = `${service.name} - ${plan.name}`;
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
            paymentLink: `https://pay.amsquare.com/inv/${Math.random().toString(36).substring(7)}`
        };
        setGeneratedInvoice(invData);
        setInvoiceStep('preview');
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
        switch(status) {
            case 'safe': return 'bg-[#50C913]';
            case 'warning': return 'bg-amber-500';
            case 'critical': return 'bg-red-500';
            default: return 'bg-slate-300';
        }
    };

    const getStatusText = (status: 'safe' | 'warning' | 'critical' | 'unknown') => {
        switch(status) {
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
                        <span className="text-sm font-bold text-slate-900">
                            {userData?.isFreshSignup ? 'Pending Data' : '72/100'}
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
                                    <div className={`w-2 h-2 rounded-full ${layer.score < 50 ? 'bg-red-500' : layer.score < 80 ? 'bg-amber-500' : 'bg-[#50C913]'}`}></div>
                                </div>
                                <h4 className="font-bold text-slate-900 text-sm leading-tight mb-1">{layer.title}</h4>
                                <p className="text-[10px] text-slate-500 mb-3">{layer.subtitle}</p>
                                
                                <div className="mt-auto pt-3 border-t border-slate-50">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xl font-bold text-slate-900">{layer.score}%</span>
                                        {layer.score < 80 && <Lock className="w-3.5 h-3.5 text-slate-300 group-hover:text-red-500 transition-colors" />}
                                    </div>
                                    <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
                                        <div className={`h-full ${layer.score < 50 ? 'bg-red-500' : layer.score < 80 ? 'bg-amber-500' : 'bg-[#50C913]'}`} style={{ width: `${layer.score}%` }}></div>
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
                        
                        <div className="flex items-center gap-3 mb-6">
                            <h3 className="text-xl font-bold text-slate-900">{kpiLayers[selectedLayer - 1].title} Details</h3>
                            <span className={`text-xs font-bold px-2 py-1 rounded-md text-white ${kpiLayers[selectedLayer - 1].score < 50 ? 'bg-red-500' : kpiLayers[selectedLayer - 1].score < 80 ? 'bg-amber-500' : 'bg-[#50C913]'}`}>
                                Score: {kpiLayers[selectedLayer - 1].score}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {kpiLayers[selectedLayer - 1].kpis.map((kpi, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-2">
                                        <h5 className="font-bold text-slate-700 text-sm">{kpi.name}</h5>
                                        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(kpi.status)} shadow-sm ring-2 ring-white`}></div>
                                    </div>
                                    <div className="mb-4">
                                        <span className="text-2xl font-bold text-slate-900">{kpi.value}</span>
                                        <p className={`text-[10px] font-bold uppercase mt-1 ${getStatusText(kpi.status)}`}>
                                            Threshold: {kpi.threshold}
                                        </p>
                                    </div>
                                    <div className="mt-auto bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <ShieldCheck className="w-3.5 h-3.5 text-black" />
                                            <span className="text-[10px] font-bold text-slate-900 uppercase">AMSquare Enforcement</span>
                                        </div>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            {kpi.enforcement}
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
                {/* Services Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                         <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <div className="p-1.5 bg-black text-white rounded-lg"><Package className="w-4 h-4"/></div>
                            Offerings Configuration
                         </h3>
                         <div className="flex gap-2">
                            <button 
                                onClick={() => {
                                    setEditingServiceId(null);
                                    resetItemForm();
                                    setItemForm(prev => ({...prev, type: 'Service'}));
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
                                    setItemForm(prev => ({...prev, type: 'Product'}));
                                    setIsServiceModalOpen(true);
                                }}
                                className="text-xs font-bold bg-black text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 transition-colors"
                            >
                                <Box className="w-3.5 h-3.5" /> Product
                            </button>
                         </div>
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
                                            onChange={e => setItemForm({...itemForm, name: e.target.value})} 
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
                                                onChange={e => setItemForm({...itemForm, price: parseFloat(e.target.value)})} 
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2 col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                                        <input 
                                            placeholder="Brief description..." 
                                            className="w-full px-4 py-3 rounded-xl border border-black bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm text-slate-900" 
                                            value={itemForm.description} 
                                            onChange={e => setItemForm({...itemForm, description: e.target.value})} 
                                        />
                                    </div>

                                    {itemForm.type === 'Service' && (
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Billing Frequency</label>
                                            <div className="relative">
                                                <select 
                                                    className="w-full px-4 py-3 rounded-xl border border-black bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm text-slate-900 appearance-none cursor-pointer" 
                                                    value={itemForm.frequency} 
                                                    onChange={e => setItemForm({...itemForm, frequency: e.target.value as any})}
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
                                                onChange={e => setItemForm({...itemForm, status: e.target.value as any})}
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
                                                        <button onClick={() => removePlan(plan.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                                            <X className="w-4 h-4" />
                                                        </button>
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
                                                        onChange={e => setNewPlan({...newPlan, name: e.target.value})}
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
                                                            onChange={e => setNewPlan({...newPlan, price: parseFloat(e.target.value)})}
                                                        />
                                                    </div>
                                                    <div className="space-y-2 flex-1">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Billing</label>
                                                        <div className="relative">
                                                            <select 
                                                                className="w-full px-3 py-2 rounded-lg border border-black bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black appearance-none cursor-pointer"
                                                                value={newPlan.billingPeriod}
                                                                onChange={e => setNewPlan({...newPlan, billingPeriod: e.target.value as any})}
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
                                                                <button onClick={() => setPlanCountries(planCountries.filter(c => c !== country))} className="hover:text-red-500"><X className="w-3 h-3"/></button>
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
                                    {services.map(service => (
                                        <tr key={service.id} className="hover:bg-slate-50 transition-colors group">
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
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEditItem(service)} className="p-2 text-slate-400 hover:text-black">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteItem(service.id)} className="p-2 text-slate-400 hover:text-red-500">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                         {services.length === 0 && !isServiceModalOpen && (
                            <div className="p-8 text-center text-slate-400 text-sm">No services or products configured.</div>
                        )}
                    </div>
                </div>

                {/* Discounts Section */}
                <div className="space-y-4">
                     <div className="flex items-center justify-between">
                         <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <div className="p-1.5 bg-[#50C913] text-black rounded-lg"><Tag className="w-4 h-4"/></div>
                            Reductions & Promo Codes
                         </h3>
                         <button 
                            onClick={() => setIsAddingDiscount(true)}
                            className="text-xs font-bold bg-white border border-slate-200 text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-colors"
                         >
                            <Plus className="w-3.5 h-3.5" /> Create Code
                         </button>
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
                                            onChange={e => setNewDiscount({...newDiscount, name: e.target.value})} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Code</label>
                                        <input 
                                            placeholder="SUMMER20" 
                                            className="w-full px-4 py-3 rounded-xl border border-black bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm text-slate-900 uppercase" 
                                            value={newDiscount.code} 
                                            onChange={e => setNewDiscount({...newDiscount, code: e.target.value})} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Value</label>
                                        <input 
                                            placeholder="20" 
                                            type="number" 
                                            className="w-full px-4 py-3 rounded-xl border border-black bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm text-slate-900" 
                                            value={newDiscount.value || ''} 
                                            onChange={e => setNewDiscount({...newDiscount, value: parseFloat(e.target.value)})} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                                        <div className="relative">
                                            <select 
                                                className="w-full px-4 py-3 rounded-xl border border-black bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm text-slate-900 appearance-none cursor-pointer" 
                                                value={newDiscount.type} 
                                                onChange={e => setNewDiscount({...newDiscount, type: e.target.value as any})}
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
                            {discounts.map(discount => (
                                <div key={discount.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
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
                                    <div className="flex items-center gap-4">
                                         <span className={`text-[10px] font-bold ${discount.status === 'Active' ? 'text-[var(--primary-color)]' : 'text-slate-400'}`}>
                                            {discount.status}
                                        </span>
                                        <button onClick={() => handleDeleteDiscount(discount.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {discounts.length === 0 && !isAddingDiscount && (
                            <div className="p-8 text-center text-slate-400 text-sm">No active reductions.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Invoice Modal */}
            {showInvoiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-[var(--primary-color)]" />
                                {invoiceStep === 'create' ? 'New Invoice' : 'Invoice Preview'}
                            </h2>
                            <button onClick={() => setShowInvoiceModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-black transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {invoiceStep === 'create' ? (
                                <div className="space-y-5">
                                    {/* Title & Description */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Invoice Title</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-4 py-3 rounded-xl border border-black bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm text-slate-900"
                                                placeholder="e.g. Web Development Services"
                                                value={newInvoice.title}
                                                onChange={(e) => setNewInvoice({...newInvoice, title: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Description / Memo</label>
                                            <textarea 
                                                className="w-full px-4 py-3 rounded-xl border border-black bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm text-slate-900 resize-none h-20"
                                                placeholder="Details about the work performed..."
                                                value={newInvoice.description}
                                                onChange={(e) => setNewInvoice({...newInvoice, description: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-100 w-full"></div>

                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Client Name</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-4 py-3 rounded-xl border border-black bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm text-slate-900"
                                                placeholder="e.g. Acme Corp"
                                                value={newInvoice.clientName}
                                                onChange={(e) => setNewInvoice({...newInvoice, clientName: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Client Email</label>
                                            <input 
                                                type="email" 
                                                className="w-full px-4 py-3 rounded-xl border border-black bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm text-slate-900"
                                                placeholder="billing@acme.com"
                                                value={newInvoice.clientEmail}
                                                onChange={(e) => setNewInvoice({...newInvoice, clientEmail: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Service / Product</label>
                                        <div className="relative">
                                            <select 
                                                className="w-full px-4 py-3 rounded-xl border border-black bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm appearance-none text-slate-900"
                                                value={newInvoice.serviceId}
                                                onChange={handleServiceSelect}
                                            >
                                                <option value="">Select a service or product...</option>
                                                {services.map(s => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.type === 'Service' ? `${s.name} - $${s.price}` : s.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <Package className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>
                                        
                                        {/* Dynamic Plan Selection for Products */}
                                        {selectedServiceForInvoice && selectedServiceForInvoice.type === 'Product' && (
                                            <div className="mt-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Select Plan</label>
                                                <div className="relative">
                                                    <select 
                                                        className="w-full px-4 py-3 rounded-xl border border-black bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm appearance-none text-slate-900"
                                                        value={newInvoice.planId}
                                                        onChange={handlePlanSelect}
                                                    >
                                                        {selectedServiceForInvoice.plans?.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name} - ${p.price} / {p.billingPeriod}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Dynamic Quantity Input Based on Frequency */}
                                        {(selectedServiceForInvoice?.type === 'Service' || (selectedServiceForInvoice?.type === 'Product' && selectedPlanForInvoice)) && (
                                            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-500 uppercase">Base Rate</span>
                                                        <span className="text-sm font-bold text-slate-900">
                                                            ${selectedServiceForInvoice.type === 'Service' ? selectedServiceForInvoice.price?.toLocaleString() : selectedPlanForInvoice?.price.toLocaleString()} 
                                                            <span className="text-slate-400 font-medium"> / {selectedServiceForInvoice.type === 'Service' ? selectedServiceForInvoice.frequency : selectedPlanForInvoice?.billingPeriod}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-end gap-4">
                                                    <div className="space-y-2 flex-1">
                                                        <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                                            {(selectedServiceForInvoice.frequency === 'Hourly' || selectedPlanForInvoice?.billingPeriod === 'Hourly') ? <Clock className="w-3.5 h-3.5" /> : 
                                                             (selectedServiceForInvoice.frequency === 'One-time' || selectedPlanForInvoice?.billingPeriod === 'One-time') ? <Hash className="w-3.5 h-3.5" /> : 
                                                             <Calendar className="w-3.5 h-3.5" />}
                                                            {getQuantityLabel(selectedServiceForInvoice.type === 'Service' ? selectedServiceForInvoice.frequency : selectedPlanForInvoice?.billingPeriod)}
                                                        </label>
                                                        <input 
                                                            type="number"
                                                            min="1"
                                                            step={(selectedServiceForInvoice.frequency === 'Hourly' || selectedPlanForInvoice?.billingPeriod === 'Hourly') ? 0.5 : 1}
                                                            className="w-full px-4 py-2 rounded-lg border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black transition-all font-bold text-sm text-slate-900"
                                                            value={newInvoice.quantity}
                                                            onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2 flex-1 text-right">
                                                        <label className="text-xs font-bold text-slate-500 uppercase">Calculated Total</label>
                                                        <div className="text-xl font-bold text-[#50C913] px-4 py-2 bg-white rounded-lg border border-slate-200">
                                                            ${newInvoice.amount.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Due Date</label>
                                        <input 
                                            type="date" 
                                            className="w-full px-4 py-3 rounded-xl border border-black bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm text-slate-900"
                                            value={newInvoice.dueDate}
                                            onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                                        />
                                    </div>
                                    
                                    <div className="pt-4">
                                        <button 
                                            onClick={handleGenerateInvoice}
                                            disabled={!newInvoice.clientName || !newInvoice.amount}
                                            className="w-full py-3.5 bg-black text-white font-bold rounded-xl hover:bg-slate-900 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Generate Invoice <FileText className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Preview Step
                                generatedInvoice && (
                                    <div className="flex flex-col md:flex-row gap-8">
                                        {/* Invoice Paper */}
                                        <div className="flex-1 bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-2 bg-[var(--primary-color)]"></div>
                                            <div className="flex justify-between items-start mb-8 mt-2">
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-900">{generatedInvoice.title}</h3>
                                                    <p className="text-xs text-slate-500 font-mono mt-1">{generatedInvoice.id}</p>
                                                </div>
                                                <div className="text-right">
                                                    <h4 className="font-bold text-slate-800">{userData?.businessName || 'AMSquare Enterprise'}</h4>
                                                    <p className="text-[10px] text-slate-400">{userData?.primaryAddress || '777 Tech Blvd, San Francisco'}</p>
                                                </div>
                                            </div>

                                            <div className="mb-8 flex justify-between">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Billed To</p>
                                                    <p className="font-bold text-slate-900">{generatedInvoice.clientName}</p>
                                                    <p className="text-xs text-slate-500">{generatedInvoice.clientEmail}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Due Date</p>
                                                    <p className="font-bold text-slate-900">{new Date(generatedInvoice.dueDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>

                                            {generatedInvoice.description && (
                                                <div className="mb-6 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 italic">
                                                    {generatedInvoice.description}
                                                </div>
                                            )}

                                            <div className="bg-slate-50 rounded-lg p-4 mb-6">
                                                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase mb-2">
                                                    <span className="w-1/2">Item</span>
                                                    <span className="w-1/4 text-right">Rate / Qty</span>
                                                    <span className="w-1/4 text-right">Amount</span>
                                                </div>
                                                <div className="flex justify-between font-medium text-sm text-slate-800 border-t border-slate-200 pt-2 items-center">
                                                    <span className="w-1/2">{generatedInvoice.serviceName}</span>
                                                    <div className="w-1/4 text-right text-xs">
                                                        <div>${generatedInvoice.unitPrice.toLocaleString()}</div>
                                                        <div className="text-slate-400">x {generatedInvoice.quantity} {generatedInvoice.billingFrequency === 'Hourly' ? 'hrs' : 'units'}</div>
                                                    </div>
                                                    <span className="w-1/4 text-right font-bold">${generatedInvoice.amount.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center border-t border-slate-200 pt-4">
                                                <span className="font-bold text-slate-900">Total Due</span>
                                                <span className="text-2xl font-bold text-[var(--primary-color)]">${generatedInvoice.amount.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {/* Payment Actions */}
                                        <div className="w-full md:w-64 space-y-5">
                                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                                                <div className="bg-white p-2 rounded-xl border border-slate-200 mb-3 shadow-sm">
                                                    <QrCode className="w-32 h-32 text-slate-900" strokeWidth={1.5} />
                                                </div>
                                                <p className="text-xs font-bold text-slate-900 mb-1">Scan to Pay</p>
                                                <p className="text-[10px] text-slate-500">Secure checkout via AMSquare App</p>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="p-3 border border-slate-200 rounded-xl bg-white">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Payment Link</p>
                                                    <div className="flex items-center gap-2">
                                                        <input 
                                                            readOnly 
                                                            value={generatedInvoice.paymentLink}
                                                            className="flex-1 text-xs text-slate-600 bg-transparent outline-none truncate"
                                                        />
                                                        <button className="text-slate-400 hover:text-black" title="Copy">
                                                            <Copy className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <button className="w-full py-2.5 bg-[var(--primary-color)] text-black font-bold text-xs rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                                                    <Send className="w-3.5 h-3.5" /> Send to Client
                                                </button>
                                                <button className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2">
                                                    <Download className="w-3.5 h-3.5" /> Download PDF
                                                </button>
                                                <button 
                                                    onClick={() => setInvoiceStep('create')}
                                                    className="w-full py-2.5 text-slate-500 font-bold text-xs hover:text-black transition-colors"
                                                >
                                                    Back to Edit
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
