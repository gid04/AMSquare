
import React, { useMemo, useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Globe, ChevronRight, ArrowLeft, Info, CheckCircle2, Activity, Eye, Zap, TrendingUp, Calendar, DollarSign, FileCheck, Landmark, Briefcase, ChevronDown } from 'lucide-react';
import { UserData, Transaction } from '../../types';

interface RegulationsViewProps {
    userData?: UserData;
    onAskAgent?: (query: string) => void;
    transactions?: Transaction[];
}

interface Regulation {
    id: string; // Added ID for stable keys
    name: string;
    region: string;
    tags: string[];
    risk: string;
    description: string;
    // Detail view properties
    keyToBusiness: string;
    howItWorks: string;
    requiredActions: string[];
    agentAction: string;
    // New properties
    type: 'Privacy' | 'Finance' | 'Security' | 'Tax' | 'Employment' | 'Industry';
    isAutomatable: boolean;
    automationCapability?: string;
    level?: 'Federal' | 'State' | 'Local' | 'International';
}

interface TaxInfo {
    federalRate: number;
    bracketName: string;
    filingDeadline: string;
    currency: string;
    vatLabel: string;
    vatRate: number;
    exchangeRateToUSD: number; // For basic conversion estimation
}

// Comprehensive Tax Intelligence Map
const TAX_INTELLIGENCE: Record<string, TaxInfo> = {
    'United States': { federalRate: 21, bracketName: 'Federal Corporate', filingDeadline: 'Apr 15', currency: '$', vatLabel: 'Sales Tax (Avg)', vatRate: 6.35, exchangeRateToUSD: 1 },
    'United Kingdom': { federalRate: 25, bracketName: 'Corporation Tax', filingDeadline: '12m after Y.E.', currency: '£', vatLabel: 'VAT', vatRate: 20, exchangeRateToUSD: 1.27 },
    'Canada': { federalRate: 26.5, bracketName: 'Fed + Prov Combined', filingDeadline: 'Jun 30', currency: 'C$', vatLabel: 'GST/HST', vatRate: 13, exchangeRateToUSD: 0.74 },
    'Germany': { federalRate: 29.8, bracketName: 'Körperschaftsteuer', filingDeadline: 'Jul 31', currency: '€', vatLabel: 'VAT (MwSt)', vatRate: 19, exchangeRateToUSD: 1.09 },
    'France': { federalRate: 25, bracketName: 'Impôt sur les Sociétés', filingDeadline: 'May 15', currency: '€', vatLabel: 'TVA', vatRate: 20, exchangeRateToUSD: 1.09 },
    'Australia': { federalRate: 30, bracketName: 'Company Tax', filingDeadline: 'May 15', currency: 'A$', vatLabel: 'GST', vatRate: 10, exchangeRateToUSD: 0.66 },
    'Brazil': { federalRate: 34, bracketName: 'IRPJ + CSLL', filingDeadline: 'Mar 31', currency: 'R$', vatLabel: 'ICMS (Avg)', vatRate: 17, exchangeRateToUSD: 0.20 },
    'India': { federalRate: 25, bracketName: 'Corporate Tax', filingDeadline: 'Oct 31', currency: '₹', vatLabel: 'GST', vatRate: 18, exchangeRateToUSD: 0.012 },
    'China': { federalRate: 25, bracketName: 'Enterprise Income Tax', filingDeadline: 'May 31', currency: '¥', vatLabel: 'VAT', vatRate: 13, exchangeRateToUSD: 0.14 },
    'Japan': { federalRate: 23.2, bracketName: 'Corporate Tax', filingDeadline: '2m after Y.E.', currency: '¥', vatLabel: 'Consumption Tax', vatRate: 10, exchangeRateToUSD: 0.0068 },
    'Singapore': { federalRate: 17, bracketName: 'Corporate Income Tax', filingDeadline: 'Nov 30', currency: 'S$', vatLabel: 'GST', vatRate: 9, exchangeRateToUSD: 0.75 },
    'United Arab Emirates': { federalRate: 9, bracketName: 'Corporate Tax', filingDeadline: '9m after Y.E.', currency: 'AED', vatLabel: 'VAT', vatRate: 5, exchangeRateToUSD: 0.27 },
    'South Africa': { federalRate: 27, bracketName: 'CIT', filingDeadline: '12m after Y.E.', currency: 'R', vatLabel: 'VAT', vatRate: 15, exchangeRateToUSD: 0.053 },
    'Mexico': { federalRate: 30, bracketName: 'ISR', filingDeadline: 'Mar 31', currency: 'MX$', vatLabel: 'IVA', vatRate: 16, exchangeRateToUSD: 0.059 },
    'Nigeria': { federalRate: 30, bracketName: 'CIT', filingDeadline: 'Jun 30', currency: '₦', vatLabel: 'VAT', vatRate: 7.5, exchangeRateToUSD: 0.0011 }, // Mock rate
    'Default': { federalRate: 20, bracketName: 'Standard Corporate', filingDeadline: 'Dec 31', currency: '$', vatLabel: 'VAT/GST', vatRate: 15, exchangeRateToUSD: 1 }
};

// Hardcoded specific regulations (high priority)
const SPECIFIC_REGULATIONS: Regulation[] = [
    {
        id: 'gdpr',
        name: 'General Data Protection Regulation (GDPR)',
        region: 'EU',
        tags: ['Europe', 'Germany', 'France', 'Spain', 'Italy', 'Poland', 'Sweden', 'Netherlands', 'United Kingdom', 'Privacy'],
        risk: 'High',
        type: 'Privacy',
        level: 'International',
        description: 'Mandatory data privacy and security law for European Union operations.',
        keyToBusiness: 'Failure to comply can result in fines up to €20 million. Crucial for customer trust in EU markets.',
        howItWorks: 'Regulates processing of personal data. Gives individuals rights over their data.',
        requiredActions: ['Appoint DPO', 'Privacy by Design', 'Breach Response Plan'],
        agentAction: 'Monitor new EU amendments and flag non-compliant data.',
        isAutomatable: false
    },
    {
        id: 'ccpa',
        name: 'California Consumer Privacy Act (CCPA)',
        region: 'United States',
        tags: ['United States', 'Privacy'],
        risk: 'Medium',
        type: 'Privacy',
        level: 'State',
        description: 'Enhances privacy rights and consumer protection for California residents.',
        keyToBusiness: 'Essential for US market. Non-compliance leads to civil penalties.',
        howItWorks: 'Gives consumers right to know, delete, and opt-out of sale of personal info.',
        requiredActions: ['Update Privacy Policy', 'Data Inventory', 'Opt-out Mechanism'],
        agentAction: 'Scan customer database for CA residents and verify opt-out status.',
        isAutomatable: true,
        automationCapability: 'Auto-process "Do Not Sell" requests.'
    },
    {
        id: 'sox',
        name: 'Sarbanes-Oxley Act (SOX)',
        region: 'United States',
        tags: ['United States', 'Finance'],
        risk: 'Low',
        type: 'Finance',
        level: 'Federal',
        description: 'Protects investors from fraudulent accounting activities.',
        keyToBusiness: 'Mandatory for public companies. Standardizes financial reporting.',
        howItWorks: 'Requires strict internal controls and independent audits.',
        requiredActions: ['Internal Control Report', 'Auditor Independence', '7-Year Record Retention'],
        agentAction: 'Cross-reference expense reports against SOX checklists.',
        isAutomatable: true,
        automationCapability: 'Real-time ledger locking and audit trail generation.'
    }
];

// Helper to generate generic regulations for countries not explicitly covered
const generateDynamicRegulations = (locationStr: string, niche: string, structure: string, staffResidencies: string[] = []): Regulation[] => {
    const regs: Regulation[] = [];

    // Parse Location "City, Country"
    const parts = locationStr.split(',').map(s => s.trim());
    const country = parts.length > 1 ? parts[1] : parts[0];
    const city = parts.length > 1 ? parts[0] : '';

    const isSoleProp = structure.toLowerCase().includes('sole') || structure.toLowerCase().includes('proprietorship');

    // --- 1. FEDERAL / NATIONAL TAXES ---
    regs.push({
        id: `${country}-fed-tax`,
        name: `${country} Federal/Corporate Tax (CIT)`,
        region: country,
        tags: [country, 'Tax'],
        risk: 'High',
        type: 'Tax',
        level: 'Federal',
        description: `Mandatory federal tax filing for entities operating in ${country}.`,
        keyToBusiness: `Ensures good standing with national authorities (e.g. IRS, HMRC, FIRS).`,
        howItWorks: `Requires annual filing of audited financial statements.`,
        requiredActions: [`Register for Tax ID`, 'File Annual Returns', 'Pay Provisional Tax'],
        agentAction: `Forecast ${country} tax liability based on real-time revenue.`,
        isAutomatable: true,
        automationCapability: `Sync ledger with ${country} tax e-filing formats.`
    });

    if (country === 'Nigeria') {
        regs.push({
            id: 'ng-vat',
            name: 'Value Added Tax (VAT) - Nigeria',
            region: 'Nigeria',
            tags: ['Nigeria', 'Tax'],
            risk: 'High',
            type: 'Tax',
            level: 'Federal',
            description: 'Consumption tax of 7.5% on goods and services.',
            keyToBusiness: 'Failure to remit VAT attracts heavy penalties.',
            howItWorks: 'Collect 7.5% from customers and remit to FIRS monthly.',
            requiredActions: ['Monthly VAT Filing (Form 002)', 'Issue VAT Invoices'],
            agentAction: 'Calculate monthly VAT remittance.',
            isAutomatable: true,
            automationCapability: 'Auto-calculate VAT from invoices.'
        });
        regs.push({
            id: 'ng-itf',
            name: 'Industrial Training Fund (ITF)',
            region: 'Nigeria',
            tags: ['Nigeria', 'Employment'],
            risk: 'Medium',
            type: 'Employment',
            level: 'Federal',
            description: 'Mandatory contribution for staff training (1% of annual payroll).',
            keyToBusiness: 'Compliance required for government contracts.',
            howItWorks: 'Pay 1% of total annual payroll to ITF.',
            requiredActions: ['Register with ITF', 'Annual Contribution'],
            agentAction: 'Estimate ITF liability based on payroll.',
            isAutomatable: true,
            automationCapability: 'Accrue 1% of payroll monthly.'
        });
    }

    // --- 2. STATE / REGIONAL TAXES ---
    if (city && country === 'Nigeria') {
        // Assume Lagos if city is Lagos
        if (city.includes('Lagos')) {
            regs.push({
                id: 'lagos-paye',
                name: 'Lagos State PAYE (LIRS)',
                region: 'Lagos, Nigeria',
                tags: ['Lagos', 'Nigeria', 'Tax'],
                risk: 'High',
                type: 'Tax',
                level: 'State',
                description: 'Personal Income Tax for employees residing in Lagos.',
                keyToBusiness: 'Mandatory for all employers in Lagos.',
                howItWorks: 'Deduct tax from salary based on consolidated relief allowance.',
                requiredActions: ['Monthly Remittance to LIRS', 'Annual Tax Returns'],
                agentAction: 'Generate PAYE schedule for payroll.',
                isAutomatable: true,
                automationCapability: 'Auto-deduct PAYE from payroll.'
            });
            regs.push({
                id: 'lagos-luc',
                name: 'Land Use Charge (LUC)',
                region: 'Lagos, Nigeria',
                tags: ['Lagos', 'Property'],
                risk: 'Medium',
                type: 'Tax',
                level: 'State',
                description: 'Consolidated property tax for business premises in Lagos.',
                keyToBusiness: 'Required for physical offices.',
                howItWorks: 'Annual payment based on property valuation.',
                requiredActions: ['Pay Annual Demand Notice'],
                agentAction: 'Remind of annual due date.',
                isAutomatable: false
            });
        }
    } else if (country === 'United States' || country === 'US') {
        regs.push({
            id: `us-state-tax`,
            name: `${city ? city + ' / ' : ''}State Franchise Tax`,
            region: 'United States',
            tags: ['United States', 'Tax'],
            risk: 'Medium',
            type: 'Tax',
            level: 'State',
            description: `State-level tax for the privilege of doing business.`,
            keyToBusiness: 'Maintains limited liability protection.',
            howItWorks: 'Annual fee or income-based tax depending on the state.',
            requiredActions: ['File Annual Report', 'Pay Franchise Tax'],
            agentAction: 'Check specific state deadlines.',
            isAutomatable: false
        });
    }

    // --- 3. STAFF RESIDENCY / EMPLOYMENT COMPLIANCE ---
    // Deduplicate staff countries
    const uniqueResidencies = Array.from(new Set(staffResidencies)).filter(r => r !== country); // Don't duplicate home country if already covered

    uniqueResidencies.forEach(residency => {
        regs.push({
            id: `employment-${residency}`,
            name: `${residency} Foreign Employer Registration`,
            region: residency,
            tags: [residency, 'Employment'],
            risk: 'High',
            type: 'Employment',
            level: 'International',
            description: `Compliance for employing staff residing in ${residency}.`,
            keyToBusiness: 'Avoids misclassification penalties and permanent establishment risk.',
            howItWorks: `You must register as a foreign employer or use an EOR (Employer of Record) in ${residency}.`,
            requiredActions: [`Register for ${residency} Payroll`, 'Comply with local labor laws', 'Social Security Contributions'],
            agentAction: `Check EOR costs for ${residency}.`,
            isAutomatable: false
        });
    });

    // --- 4. INDUSTRY SPECIFIC ---
    if (niche) {
        regs.push({
            id: `${country}-${niche}-reg`,
            name: `${country} ${niche} Regulatory Standard`,
            region: country,
            tags: [country, 'Industry'],
            risk: 'Medium',
            type: 'Industry',
            level: 'Federal',
            description: `Operational standards for ${niche} businesses in ${country}.`,
            keyToBusiness: `License to operate within the ${niche} sector in this region.`,
            howItWorks: 'Adherence to sector-specific safety, reporting, or operational guidelines.',
            requiredActions: ['Obtain sector license', 'Regular compliance audits', 'Safety reporting'],
            agentAction: `Monitor ${country} official gazette for ${niche} regulatory updates.`,
            isAutomatable: false
        });
    }

    return regs;
};

export const RegulationsView: React.FC<RegulationsViewProps> = ({ userData, onAskAgent, transactions = [] }) => {
    const [selectedRegulation, setSelectedRegulation] = useState<Regulation | null>(null);
    const [agentAssignedMap, setAgentAssignedMap] = useState<Record<string, boolean>>({});
    const [automatedMap, setAutomatedMap] = useState<Record<string, boolean>>({});

    // Determine Primary Location
    const primaryLocation = useMemo(() => {
        return userData?.location?.split(',')[1]?.trim() || userData?.location?.split(',')[0]?.trim() || 'Nigeria';
    }, [userData]);

    const [activeTaxRegion, setActiveTaxRegion] = useState<string>(primaryLocation);

    // Collapsible State
    const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});

    // Consolidated Regulations Logic
    const allRelevantRegulations = useMemo(() => {
        if (!userData) return SPECIFIC_REGULATIONS;

        const homeLocation = userData.location;
        const homeCountry = homeLocation.split(',')[1]?.trim() || homeLocation.split(',')[0].trim();

        // Merge home location with operation range, remove duplicates
        const allRegions = Array.from(new Set([homeCountry, ...(userData.operationRange || [])]));

        let compiledRegs: Regulation[] = [];

        // 1. Add specific hardcoded regs if they match any region or staff residency
        compiledRegs = compiledRegs.concat(SPECIFIC_REGULATIONS.filter(reg => {
            // Check if regulation tags match any of our regions ONLY (No implicit global matching)
            const matchesRegion = reg.tags.some(tag => {
                // Special case for 'United States' vs 'US' etc if needed, but for now rely on exact string logic from our arrays
                return allRegions.some(region => region.includes(tag) || tag.includes(region));
            });

            // Note: Previously we matched niche, but user requested strict filtering. 
            // "only display frameworks of the user primary location... not a single extra framework"
            // So we disable general niche matching unless it's tied to a location we are in.
            // For now, let's assume specific regulations must match location.
            // But we keep staff residency checks as they are "operating countries" effectively for employment law.

            const matchesStaff = userData.staffResidencies?.some(res => reg.tags.includes(res));

            return matchesRegion || matchesStaff;
        }));

        // 2. Generate dynamic regs for Home Location (Most detailed)
        compiledRegs = compiledRegs.concat(generateDynamicRegulations(
            userData.location, // Pass full "City, Country"
            userData.niche,
            userData.legalStructure,
            userData.staffResidencies
        ));

        // 3. Generate simplified regs for other operating regions
        userData.operationRange?.forEach(opRegion => {
            if (!userData.location.includes(opRegion)) { // Don't duplicate home
                // Simplified generation for operating regions
                compiledRegs.push({
                    id: `${opRegion}-foreign-entity`,
                    name: `${opRegion} Foreign Entity Compliance`,
                    region: opRegion,
                    tags: [opRegion, 'Tax'],
                    risk: 'Medium',
                    type: 'Tax',
                    level: 'International',
                    description: `Tax obligations for foreign entities operating in ${opRegion}.`,
                    keyToBusiness: 'Avoid double taxation issues.',
                    howItWorks: 'File returns on income derived within the region.',
                    requiredActions: ['Register for VAT/GST', 'File Income Tax'],
                    agentAction: `Track revenue generated in ${opRegion}.`,
                    isAutomatable: true,
                    automationCapability: 'Segregate revenue by region.'
                });
            }
        });

        // Remove duplicates by ID
        const uniqueRegs = Array.from(new Map(compiledRegs.map(item => [item.id, item])).values());

        return uniqueRegs;
    }, [userData]);

    const groupedRegulations = useMemo<Record<string, Regulation[]>>(() => {
        const groups: Record<string, Regulation[]> = {};
        allRelevantRegulations.forEach(reg => {
            const regionKey = reg.region === 'USA' ? 'United States' : reg.region;
            if (!groups[regionKey]) {
                groups[regionKey] = [];
            }
            groups[regionKey].push(reg);
        });
        return groups;
    }, [allRelevantRegulations]);

    // Initialize expanded state when groups change
    useEffect(() => {
        const initialExpanded: Record<string, boolean> = {};
        Object.keys(groupedRegulations).forEach(region => {
            // Default to expanded
            initialExpanded[region] = true;
        });
        setExpandedRegions(prev => ({ ...initialExpanded, ...prev }));
    }, [groupedRegulations]);

    const toggleRegion = (region: string) => {
        setExpandedRegions(prev => ({
            ...prev,
            [region]: !prev[region]
        }));
    };

    const handleAssignAgent = (regId: string) => {
        setAgentAssignedMap(prev => ({ ...prev, [regId]: true }));
    };

    const handleToggleAutomation = (regId: string) => {
        setAutomatedMap(prev => ({ ...prev, [regId]: !prev[regId] }));
        if (!automatedMap[regId]) {
            setAgentAssignedMap(prev => ({ ...prev, [regId]: true }));
        }
    };

    // Get active tax info
    const currentTaxInfo = useMemo(() => {
        return TAX_INTELLIGENCE[activeTaxRegion] || TAX_INTELLIGENCE['Default'];
    }, [activeTaxRegion]);

    const primaryTaxInfo = useMemo(() => {
        return TAX_INTELLIGENCE[primaryLocation] || TAX_INTELLIGENCE['Default'];
    }, [primaryLocation]);

    // Calculate Estimated Liability based on real transactions for specific location
    const { estLiability, convertedLiability } = useMemo(() => {
        // Filter transactions for revenue credited to the active region
        // If a transaction has NO location, assume it belongs to the PRIMARY region.
        const regionRevenue = transactions.filter(t => {
            if (t.type !== 'credit' || t.status !== 'Completed') return false;

            const txLocation = t.location;
            if (!txLocation) {
                // If no location set on transaction, attribute to primary location
                return activeTaxRegion === primaryLocation;
            }
            return txLocation === activeTaxRegion;
        }).reduce((acc, t) => acc + t.amount, 0);

        // Simple estimation: Revenue * Tax Rate
        const rawLiability = regionRevenue * (currentTaxInfo.federalRate / 100);

        let converted = null;
        // If active region is not primary, convert to primary currency
        if (activeTaxRegion !== primaryLocation) {
            // Convert Local -> USD -> Primary
            const liabilityInUSD = rawLiability * currentTaxInfo.exchangeRateToUSD;
            const liabilityInPrimary = liabilityInUSD / primaryTaxInfo.exchangeRateToUSD;
            converted = liabilityInPrimary;
        }

        return { estLiability: rawLiability, convertedLiability: converted };
    }, [transactions, currentTaxInfo, activeTaxRegion, primaryLocation, primaryTaxInfo]);

    const operationalRegions = useMemo(() => {
        if (!userData) return ['Nigeria'];
        const home = userData.location.split(',')[1]?.trim() || userData.location.split(',')[0].trim();
        return Array.from(new Set([home, ...(userData.operationRange || [])])).filter(Boolean);
    }, [userData]);

    // --- Detail View ---
    if (selectedRegulation) {
        // ... (existing detail view logic, omitted for brevity as no changes requested here)
        const isAssigned = agentAssignedMap[selectedRegulation.id];
        const isAutomated = automatedMap[selectedRegulation.id];

        return (
            <div className="space-y-6 animate-fade-in pb-10">
                <button
                    onClick={() => setSelectedRegulation(null)}
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-black transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Frameworks
                </button>

                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1 space-y-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{selectedRegulation.name}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedRegulation.risk === 'High' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {selectedRegulation.risk} Risk
                                </span>
                                {selectedRegulation.level && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                        {selectedRegulation.level} Level
                                    </span>
                                )}
                            </div>
                            <p className="text-lg text-slate-600 leading-relaxed">{selectedRegulation.description}</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="flex items-center gap-2 font-bold text-slate-900 mb-4">
                                <Activity className="w-5 h-5 text-[#50C913]" /> Key to Business
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed">{selectedRegulation.keyToBusiness}</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="flex items-center gap-2 font-bold text-slate-900 mb-4">
                                <Info className="w-5 h-5 text-blue-500" /> How it Works
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed">{selectedRegulation.howItWorks}</p>
                        </div>
                    </div>

                    <div className="w-full md:w-96 space-y-6">
                        {/* Required Actions Card */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4">Required Actions</h3>
                            <ul className="space-y-4">
                                {selectedRegulation.requiredActions.map((action, i) => (
                                    <li key={i} className="flex gap-3">
                                        <div className="mt-1 flex-shrink-0">
                                            <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex items-center justify-center">
                                                <div className="w-2.5 h-2.5 rounded-full bg-transparent"></div>
                                            </div>
                                        </div>
                                        <span className="text-sm text-slate-600 font-medium">{action}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Agent Assignment Card */}
                        <div className={`p-6 rounded-2xl shadow-xl transition-all relative overflow-hidden ${isAutomated ? 'bg-[#50C913] text-black shadow-[#50C913]/30' : 'bg-black text-white shadow-slate-900/10'}`}>
                            <div className="relative z-10">
                                <h3 className={`flex items-center gap-2 font-bold mb-2 ${isAutomated ? 'text-black' : 'text-white'}`}>
                                    {isAutomated ? <Zap className="w-5 h-5" /> : <Eye className={`w-5 h-5 ${isAutomated ? 'text-black' : 'text-[#50C913]'}`} />}
                                    {isAutomated ? 'Autopilot Active' : 'Agent Surveillance'}
                                </h3>

                                <p className={`text-xs mb-6 leading-relaxed ${isAutomated ? 'text-slate-800' : 'text-slate-400'}`}>
                                    {isAutomated ? selectedRegulation.automationCapability : selectedRegulation.agentAction}
                                </p>

                                {!isAutomated && isAssigned && (
                                    <div className="flex items-center gap-3 bg-[#50C913]/20 border border-[#50C913] rounded-xl p-3 mb-4">
                                        <CheckCircle2 className="w-5 h-5 text-[#50C913]" />
                                        <div>
                                            <span className="block text-xs font-bold text-[#50C913]">Active Monitoring</span>
                                            <span className="block text-[10px] text-slate-300">Ralph is tracking this.</span>
                                        </div>
                                    </div>
                                )}

                                {!isAutomated ? (
                                    <div className="space-y-3">
                                        {!isAssigned && (
                                            <button
                                                onClick={() => handleAssignAgent(selectedRegulation.id)}
                                                className="w-full bg-[#50C913] hover:bg-[#44ab10] text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#50C913]/20 active:scale-95"
                                            >
                                                Enable Continuous Monitoring
                                            </button>
                                        )}
                                        {selectedRegulation.isAutomatable && (
                                            <button
                                                onClick={() => handleToggleAutomation(selectedRegulation.id)}
                                                className="w-full bg-white text-black font-bold py-3 rounded-xl transition-all hover:bg-slate-100 active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <Zap className="w-4 h-4" /> Switch to Autopilot
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleToggleAutomation(selectedRegulation.id)}
                                        className="w-full bg-black/10 hover:bg-black/20 text-black font-bold py-3 rounded-xl transition-all active:scale-95 border border-black/10"
                                    >
                                        Disable Autopilot
                                    </button>
                                )}
                            </div>
                            {/* Decorative BG */}
                            <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-2xl ${isAutomated ? 'bg-white/30' : 'bg-[#50C913]/10'}`}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- List View ---
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Regulations & Taxes</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Compliance for <strong className="text-slate-700">{userData?.legalStructure}</strong> in <strong className="text-slate-700">{userData?.niche}</strong> across <strong className="text-slate-700">{operationalRegions.length} regions</strong>.
                    </p>
                </div>
                <div className="bg-[#50C913]/10 text-black px-4 py-2 rounded-xl border border-[#50C913]/20 flex items-center gap-3 shadow-sm">
                    <div className="p-1 bg-[#50C913]/20 rounded-full">
                        <ShieldCheck className="w-4 h-4 text-[#50C913]" />
                    </div>
                    <div>
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Overall Score</span>
                        <span className="font-bold text-base leading-none">
                            {userData?.isFreshSignup ? '100% Compliant' : '92% Compliant'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                <div className="xl:col-span-2 space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 text-base">Regional Frameworks</h3>
                        </div>

                        <div className="space-y-4">
                            {Object.keys(groupedRegulations).length > 0 ? (
                                Object.entries(groupedRegulations).sort().map(([region, regs]) => (
                                    <div key={region} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all">
                                        <div
                                            onClick={() => toggleRegion(region)}
                                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors bg-white z-10 relative"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-lg ${region === 'EU' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                                                    <Globe className="w-4 h-4" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-slate-900 text-sm">{region}</h4>
                                                    <span className="text-xs text-slate-400 font-medium">({(regs as Regulation[]).length} frameworks)</span>
                                                </div>
                                            </div>
                                            <div className={`p-1 rounded-full transition-all duration-300 ${expandedRegions[region] ? 'bg-slate-100 rotate-180' : 'bg-white'}`}>
                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>

                                        {/* Collapsible Content */}
                                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedRegions[region] ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <div className="p-4 pt-0 grid gap-3 border-t border-slate-50 bg-slate-50/30">
                                                {(regs as Regulation[]).map(reg => (
                                                    <div
                                                        key={reg.id}
                                                        onClick={() => setSelectedRegulation(reg)}
                                                        className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group flex items-start justify-between relative overflow-hidden"
                                                    >
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-[#50C913] transition-colors"></div>
                                                        <div className="flex items-start gap-4 pl-2">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0 ${reg.risk === 'Critical' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                                reg.risk === 'High' ? 'bg-black text-white border border-black' :
                                                                    reg.risk === 'Medium' ? 'bg-slate-200 text-slate-700 border border-slate-300' :
                                                                        'bg-slate-50 text-slate-600 border border-slate-100'
                                                                }`}>
                                                                {reg.region === 'EU' ? 'EU' : reg.region.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-slate-900 text-sm group-hover:text-[#50C913] transition-colors flex items-center gap-2">
                                                                    {reg.name}
                                                                    {automatedMap[reg.id] && <Zap className="w-3 h-3 text-[#50C913] fill-[#50C913]" />}
                                                                </h4>
                                                                <p className="text-xs text-slate-500 mt-0.5 max-w-lg line-clamp-2">{reg.description}</p>
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    {/* Tags */}
                                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{reg.type}</span>
                                                                    {reg.level && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 uppercase">{reg.level}</span>}

                                                                    {agentAssignedMap[reg.id] && !automatedMap[reg.id] && (
                                                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-[#50C913]/10 text-black border-[#50C913]/20 flex items-center gap-1">
                                                                            <Activity className="w-3 h-3" /> Monitored
                                                                        </span>
                                                                    )}
                                                                    {automatedMap[reg.id] && (
                                                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-black text-white border-black flex items-center gap-1">
                                                                            <Zap className="w-3 h-3 fill-current" /> Automated
                                                                        </span>
                                                                    )}
                                                                    {reg.risk !== 'Low' && (
                                                                        <span className={`text-[9px] font-bold ${reg.risk === 'High' ? 'text-red-600' : 'text-slate-400'}`}>Risk: {reg.risk}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="p-1.5 bg-slate-50 rounded text-slate-400 group-hover:bg-[#50C913]/10 group-hover:text-black transition-colors self-center">
                                                            <ChevronRight className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                    No specific regulations found for your criteria.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 sticky top-6">
                    {/* Multi-Region Tax Intelligence Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <DollarSign className="w-4 h-4 text-slate-700" />
                                Tax Intelligence
                            </h3>
                            <div className="relative">
                                <select
                                    value={activeTaxRegion}
                                    onChange={(e) => setActiveTaxRegion(e.target.value)}
                                    className="text-xs font-bold bg-white border border-slate-200 rounded-lg py-1 pl-2 pr-6 appearance-none cursor-pointer focus:outline-none focus:border-black max-w-[120px] truncate"
                                >
                                    {operationalRegions.map(region => (
                                        <option key={region} value={region}>{region}</option>
                                    ))}
                                </select>
                                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 rotate-90 pointer-events-none text-slate-400" />
                            </div>
                        </div>
                        <div className="p-5 space-y-5 animate-fade-in">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Corporate Tax ({activeTaxRegion})</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-slate-900">{currentTaxInfo.federalRate}%</span>
                                        <span className="text-xs font-medium text-slate-500">{currentTaxInfo.bracketName}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{currentTaxInfo.vatLabel}</p>
                                    <span className="text-xl font-bold text-slate-900">{currentTaxInfo.vatRate}%</span>
                                </div>
                            </div>

                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-[#50C913] h-full" style={{ width: `${Math.min(currentTaxInfo.federalRate * 1.5, 100)}%` }}></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-500 mb-1">Next Filing</p>
                                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {currentTaxInfo.filingDeadline}
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-500 mb-1">Est. Liability</p>
                                    <div className="flex flex-col">
                                        <span className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                                            <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                                            {currentTaxInfo.currency}{estLiability.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </span>
                                        {convertedLiability !== null && (
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                (≈ {primaryTaxInfo.currency}{convertedLiability.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })})
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => onAskAgent?.(`I need to prepare my tax filing for ${activeTaxRegion}. Please provide a checklist of required documents, deadlines, and an estimation of liability based on my current revenue of ${currentTaxInfo.currency}${estLiability.toLocaleString()}.`)}
                                className="w-full py-2.5 bg-black text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <FileCheck className="w-3.5 h-3.5" /> Prepare {activeTaxRegion} Filing
                            </button>
                        </div>
                    </div>

                    {/* Pending Actions */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
                            <AlertTriangle className="w-4 h-4 text-black" />
                            Pending Actions
                        </h3>
                        {userData?.completedRequirements && userData.completedRequirements.length > 0 ? (
                            <div className="text-center py-6">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <ShieldCheck className="w-4 h-4 text-green-600" />
                                </div>
                                <p className="text-xs text-slate-500">You are fully compliant!</p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                <li className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="mt-1">
                                        <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Review Data Policy</p>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">Update regarding user data handling.</p>
                                        <button className="mt-2 text-xs text-white bg-black px-3 py-1.5 rounded-lg hover:bg-slate-800 font-medium">Review Now</button>
                                    </div>
                                </li>
                            </ul>
                        )}
                    </div>

                    <div className="bg-black rounded-2xl p-5 text-white relative overflow-hidden shadow-lg shadow-black/20 border border-slate-800">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <Globe className="w-24 h-24 text-[#50C913]" />
                        </div>
                        <h3 className="font-bold text-base relative z-10">Going Global?</h3>
                        <p className="text-slate-400 text-xs mt-2 relative z-10 mb-4 leading-relaxed">
                            Check regulatory requirements for new markets.
                        </p>
                        <button
                            onClick={() => onAskAgent?.("I am planning to expand my business globally. Can you analyze regulatory requirements for potential new markets?")}
                            className="relative z-10 w-full bg-[#50C913] text-black py-2 rounded-lg text-xs font-bold hover:bg-[#44ab10] transition-colors shadow-sm"
                        >
                            Check Regulations
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
