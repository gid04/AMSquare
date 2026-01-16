
import React, { useState, useEffect } from 'react';
import { UserData } from '../../types';
import { Settings, Image, Globe, Lock, Bell, ChevronRight, Check, Shield, Smartphone, Mail, CreditCard, ArrowLeft, DollarSign, Clock, ChevronDown, Link2, Code, Webhook, Key, Copy, Plus, Trash2, RefreshCw, CheckCircle2, XCircle, AlertCircle, Eye, EyeOff, X, Palette, User, Zap, Briefcase, MapPin, FileText, Building2, Wallet, Share2 } from 'lucide-react';

interface SettingsViewProps {
    userData?: UserData;
    onUpdateUserData?: (updates: Partial<UserData>) => void;
    initialTab?: 'main' | 'branding' | 'agent' | 'admin' | 'security' | 'connectors' | 'api';
    onCompleteRequirement?: (reqId: string) => void;
    onReturnToBusiness?: () => void;
    isInRequirementMode?: boolean;
    onAskAgent?: (query: string) => void;
}

const COLOR_SWATCHES = [
    '#50C913', // Green (Default)
    '#3B82F6', // Blue
    '#F97316', // Orange
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#EAB308', // Yellow
    '#14B8A6', // Teal
];

const LANGUAGES = [
    'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Russian', 'Arabic', 'Portuguese', 'Hindi', 'Italian', 'Korean', 'Dutch', 'Turkish'
];

const PERSONALITIES = [
    'Professional', 'Relaxed', 'Cool', 'Strict', 'Friendly', 'Ghetto', 'Illiterate', 'Pirate', 'Shakespearean'
];

const CONTINENTS_AND_COUNTRIES = [
  '--- Continents ---', 'Africa', 'Antarctica', 'Asia', 'Europe', 'North America', 'Oceania', 'South America',
  '--- Countries ---', 
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Australia', 'Austria', 
  'Belgium', 'Brazil', 'Canada', 'China', 'Egypt', 'France', 'Germany', 'India', 'Indonesia', 
  'Italy', 'Japan', 'Mexico', 'Netherlands', 'Nigeria', 'Russia', 'Saudi Arabia', 'South Africa', 
  'South Korea', 'Spain', 'Sweden', 'Switzerland', 'Turkey', 'United Arab Emirates', 'United Kingdom', 'United States'
];

// Mock database of legal ID requirements with FORMAT hints
const ID_SUGGESTIONS: Record<string, {label: string, value: string, format?: string}[]> = {
    'United States': [
        { label: 'EIN', value: '', format: 'XX-XXXXXXX' },
        { label: 'State Tax ID', value: '', format: 'XXXXXXXX' },
        { label: 'NAICS Code', value: '', format: 'XXXXXX' }
    ],
    'United Kingdom': [
        { label: 'CRN', value: '', format: 'XXXXXXXX' },
        { label: 'UTR', value: '', format: 'XXXXX XXXXX' },
        { label: 'VAT Number', value: '', format: 'GB XXX XXXX XX' }
    ],
    'Canada': [
        { label: 'Business Number (BN)', value: '', format: 'XXXXXXXXX' },
        { label: 'GST/HST Account Number', value: '', format: 'XXXXXXXXX RT XXXX' }
    ],
    'Default': [
        { label: 'Tax Identification Number', value: '' },
        { label: 'Company Registration ID', value: '' }
    ]
};

export const SettingsView: React.FC<SettingsViewProps> = ({ 
    userData, 
    onUpdateUserData, 
    initialTab = 'main',
    onCompleteRequirement,
    onReturnToBusiness,
    isInRequirementMode,
    onAskAgent
}) => {
    const [activeTab, setActiveTab] = useState<'main' | 'branding' | 'agent' | 'admin' | 'security' | 'connectors' | 'api' >(initialTab);
    
    // Local State
    const [primaryColor, setPrimaryColor] = useState('#50C913');
    const [agentName, setAgentName] = useState(userData?.agentName || 'Ralph');
    const [agentPersonality, setAgentPersonality] = useState(userData?.agentPersonality || 'Professional');
    const [agentModel, setAgentModel] = useState(userData?.agentModel || 'Flash');
    const [billingAddress, setBillingAddress] = useState(userData?.billingAddress || '');
    const [primaryAddress, setPrimaryAddress] = useState(userData?.primaryAddress || '');
    const [opsRange, setOpsRange] = useState<string[]>(userData?.operationRange || []);
    const [newOpLocation, setNewOpLocation] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
    
    // Legal Details
    const [legalDetails, setLegalDetails] = useState<{label: string, value: string, format?: string}[]>([]);

    // Security State
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    
    // Integrations State
    const [bankConnected, setBankConnected] = useState(userData?.hasConnectedBank || false);
    const [isConnectingBank, setIsConnectingBank] = useState(false);

    // Effect to handle external navigation props
    useEffect(() => {
        if (initialTab && initialTab !== activeTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    // Sync state on load
    useEffect(() => {
        if (userData) {
            setAgentName(userData.agentName || 'Ralph');
            setAgentPersonality(userData.agentPersonality || 'Professional');
            setAgentModel(userData.agentModel || 'Flash');
            setBillingAddress(userData.billingAddress || userData.location);
            setPrimaryAddress(userData.primaryAddress || userData.location);
            setOpsRange(userData.operationRange || []);
            setBankConnected(userData.hasConnectedBank || false);
            
            // Auto-populate legal details if empty
            if (!userData.legalDetails || userData.legalDetails.length === 0) {
                const country = userData.location.split(',')[0].trim();
                const suggestions = ID_SUGGESTIONS[country] || ID_SUGGESTIONS['Default'];
                setLegalDetails(suggestions);
            } else {
                // Merge with format hints if possible
                const country = userData.location.split(',')[0].trim();
                const defaults = ID_SUGGESTIONS[country] || ID_SUGGESTIONS['Default'];
                
                const merged = userData.legalDetails.map(d => {
                    const found = defaults.find(def => def.label === d.label);
                    return { ...d, format: found?.format };
                });
                setLegalDetails(merged);
            }
            
            // Apply Theme Functional Logic
            if (userData.theme === 'dark') {
                applyDarkMode(true);
            } else {
                applyDarkMode(false);
            }
        }
    }, [userData]);

    const handleUpdate = (updates: Partial<UserData>) => {
        if (onUpdateUserData) {
            onUpdateUserData(updates);
        }
    };

    const applyDarkMode = (enable: boolean) => {
        // Functional implementation of dark mode via style injection
        const styleId = 'amsquare-dark-mode';
        let styleTag = document.getElementById(styleId);
        
        if (enable) {
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = styleId;
                styleTag.innerHTML = `
                    body, .bg-white, .bg-\\[\\#f5f5f5\\] { background-color: #171717 !important; color: #e5e5e5 !important; }
                    .text-slate-900, .text-slate-800 { color: #ffffff !important; }
                    .text-slate-500, .text-slate-600, .text-slate-700 { color: #a3a3a3 !important; }
                    .border-slate-100, .border-slate-200, .border-slate-300 { border-color: #262626 !important; }
                    .bg-slate-50, .bg-slate-100, .bg-slate-200 { background-color: #262626 !important; }
                    
                    /* Inputs & Search Bars - Light Gray Border in Dark Mode */
                    input, select, textarea { 
                        background-color: #262626 !important; 
                        color: white !important; 
                        border: 1.5px solid #525252 !important; 
                    }
                    input::placeholder { color: #737373 !important; }
                    
                    .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl { box-shadow: none !important; }

                    /* Blue Elements -> Gray */
                    .text-blue-600, .text-blue-700, .text-blue-800, .text-blue-900 { color: #a3a3a3 !important; }
                    .bg-blue-50, .bg-blue-100 { background-color: #262626 !important; border-color: #404040 !important; }
                    .border-blue-100 { border-color: #404040 !important; }

                    /* Chat Box Darkening */
                    .bg-\\[\\#fafafa\\] { background-color: #262626 !important; border-color: #404040 !important; }

                    /* Settings Hover -> Black */
                    .hover\\:bg-slate-50:hover { background-color: #000000 !important; }

                    /* Floating Agent Button -> Black */
                    .bg-\\[\\#171717\\] { background-color: #000000 !important; border: 1px solid #333 !important; }

                    /* Report Headers -> Black */
                    .bg-slate-50\\/50 { background-color: #000000 !important; }
                `;
                document.head.appendChild(styleTag);
            }
        } else {
            if (styleTag) {
                styleTag.remove();
            }
        }
    };

    const handleThemeChange = (theme: 'light' | 'dark') => {
        handleUpdate({ theme });
        applyDarkMode(theme === 'dark');
    };

    const handleColorChange = (color: string) => {
        setPrimaryColor(color);
        document.documentElement.style.setProperty('--primary-color', color);
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
    };

    const handleAddOperation = () => {
        if (newOpLocation && !opsRange.includes(newOpLocation)) {
            const updated = [...opsRange, newOpLocation];
            setOpsRange(updated);
            handleUpdate({ operationRange: updated });
            setNewOpLocation('');
        }
    };

    const handleDeleteOperation = () => {
        if (deleteConfirmation) {
            const updated = opsRange.filter(loc => loc !== deleteConfirmation);
            setOpsRange(updated);
            handleUpdate({ operationRange: updated });
            setDeleteConfirmation(null);
        }
    };

    const handleLegalDetailChange = (index: number, field: 'label' | 'value', val: string) => {
        const updated = [...legalDetails];
        updated[index][field] = val;
        setLegalDetails(updated);
        handleUpdate({ legalDetails: updated });
    };

    const addLegalRow = () => {
        const updated = [...legalDetails, { label: '', value: '' }];
        setLegalDetails(updated);
        handleUpdate({ legalDetails: updated });
    };

    const removeLegalRow = (index: number) => {
        const updated = legalDetails.filter((_, i) => i !== index);
        setLegalDetails(updated);
        handleUpdate({ legalDetails: updated });
    };

    const handleBankConnect = () => {
        setIsConnectingBank(true);
        setTimeout(() => {
            setIsConnectingBank(false);
            setBankConnected(true);
            handleUpdate({ hasConnectedBank: true });
            if (isInRequirementMode && onCompleteRequirement) {
                onCompleteRequirement('bank_connect');
            }
        }, 2000);
    };

    const validateFormat = (value: string, format?: string) => {
        if (!format || !value) return true;
        // Simple length check for demo purposes, could be regex
        // E.g., EIN XX-XXXXXXX is length 10
        if (format.length === value.length) return true;
        // Check for hyphen positions if any
        return false;
    };

    // Save handler for Admin tab to trigger requirement completion
    const handleSaveAdmin = () => {
        // Check if all fields are filled
        const allFilled = legalDetails.every(d => d.value.length > 0);
        if (allFilled && isInRequirementMode && onCompleteRequirement) {
            onCompleteRequirement('legal_ids');
        }
    };

    // Render methods
    const renderBrandingSettings = () => (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slide-left">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-base font-bold text-slate-900">Branding & Appearance</h2>
                <p className="text-xs text-slate-500 mt-1">Customize look, feel, and localization.</p>
            </div>
            <div className="p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-3 uppercase">Theme</label>
                        <div className="flex gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200 inline-flex">
                            <button 
                                onClick={() => handleThemeChange('light')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${userData?.theme !== 'dark' ? 'bg-white shadow-sm text-black' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Bright Mode
                            </button>
                            <button 
                                onClick={() => handleThemeChange('dark')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${userData?.theme === 'dark' ? 'bg-black shadow-sm text-white' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Dark Mode
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-3 uppercase">Language</label>
                        <div className="relative group">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select 
                                value={userData?.language || 'English'}
                                onChange={(e) => handleUpdate({ language: e.target.value })}
                                className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:border-black appearance-none cursor-pointer shadow-sm transition-all"
                            >
                                {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
                <div className="h-px bg-slate-100"></div>
                <div>
                    <h3 className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-4">
                        <Bell className="w-4 h-4 text-slate-500" /> Notification Preferences
                    </h3>
                    <div className="space-y-4">
                        {["Weekly Financial Digest", "New Invoice Generated", "Security Alerts"].map((item, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 font-medium">{item}</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked={true} />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary-color)]"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="h-px bg-slate-100"></div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-3 uppercase">Brand Accent Color</label>
                    <div className="flex gap-2 flex-wrap">
                        {COLOR_SWATCHES.map(color => (
                            <button
                                key={color}
                                onClick={() => handleColorChange(color)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${primaryColor === color ? 'border-black scale-110' : 'border-transparent hover:scale-105'}`}
                                style={{ backgroundColor: color }}
                            >
                                {primaryColor === color && <Check className="w-4 h-4 text-white mx-auto" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button onClick={() => setActiveTab('main')} className="text-sm font-bold text-slate-600 hover:text-black">Back to Settings</button>
            </div>
        </div>
    );

    const renderAgentSettings = () => (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slide-left">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-base font-bold text-slate-900">Agent Personalisation</h2>
                <p className="text-xs text-slate-500 mt-1">Configure your AI CFO's identity and behavior.</p>
            </div>
            <div className="p-6 space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Agent Name</label>
                    <input 
                        type="text" 
                        value={agentName}
                        onChange={(e) => { setAgentName(e.target.value); handleUpdate({ agentName: e.target.value }); }}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:border-black transition-all"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Personality</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select 
                                value={agentPersonality}
                                onChange={(e) => { setAgentPersonality(e.target.value); handleUpdate({ agentPersonality: e.target.value }); }}
                                className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:border-black appearance-none cursor-pointer"
                            >
                                {PERSONALITIES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Model Intelligence</label>
                        <div className="relative group">
                            <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select 
                                value={agentModel}
                                onChange={(e) => { setAgentModel(e.target.value); handleUpdate({ agentModel: e.target.value }); }}
                                className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:border-black appearance-none cursor-pointer"
                            >
                                <option value="Flash">Gemini Flash (Fastest)</option>
                                <option value="Pro">Gemini Pro (Reasoning)</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button onClick={() => setActiveTab('main')} className="text-sm font-bold text-slate-600 hover:text-black">Back to Settings</button>
            </div>
        </div>
    );

    const renderAdminSettings = () => (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slide-left relative">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-base font-bold text-slate-900">Administration</h2>
                <p className="text-xs text-slate-500 mt-1">Billing details, legal identity, and operational jurisdictions.</p>
            </div>
            
            {/* Validation Banner if IDs are empty */}
            {legalDetails.some(d => !d.value) && (
                <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-sm font-bold text-red-700">Legal Identities are required for full app access. Please complete the fields below.</p>
                </div>
            )}

            <div className="p-6 space-y-8">
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Primary HQ Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                value={primaryAddress}
                                onChange={(e) => { setPrimaryAddress(e.target.value); handleUpdate({ primaryAddress: e.target.value }); }}
                                placeholder="123 Business St, City, Country"
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:border-black transition-all"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 pl-1">Appears on invoices and official reports.</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Billing Address</label>
                        <div className="relative">
                            <CreditCard className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                value={billingAddress}
                                onChange={(e) => { setBillingAddress(e.target.value); handleUpdate({ billingAddress: e.target.value }); }}
                                placeholder="Same as HQ"
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:border-black transition-all"
                            />
                        </div>
                    </div>
                </div>
                
                <div className="h-px bg-slate-100"></div>

                {/* Legal Identity Section */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            Legal Identity & Compliance IDs <span className="text-red-500">*</span>
                        </label>
                        <button onClick={addLegalRow} className="text-xs text-[#50C913] font-bold hover:underline flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add Field
                        </button>
                    </div>
                    
                    {/* Auto-suggestion Info */}
                    {userData?.isFreshSignup && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-2 mb-2">
                            <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
                            <p className="text-[11px] text-blue-700 leading-tight">
                                Based on your location ({userData.location.split(',')[0]}) and structure, we've pre-filled the required IDs. Please verify.
                            </p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {legalDetails.map((detail, idx) => (
                            <div key={idx} className="flex gap-3">
                                <div className="w-1/3">
                                    <input 
                                        type="text" 
                                        placeholder="Label (e.g. VAT ID)"
                                        value={detail.label}
                                        onChange={(e) => handleLegalDetailChange(idx, 'label', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:border-black"
                                    />
                                </div>
                                <div className="flex-1 flex gap-2">
                                    <div className="relative flex-1 group">
                                        <input 
                                            type="text" 
                                            placeholder={detail.format || "Value (Required)"}
                                            value={detail.value}
                                            onChange={(e) => handleLegalDetailChange(idx, 'value', e.target.value)}
                                            className={`w-full pl-3 pr-10 py-2 rounded-lg border bg-white text-sm font-medium text-slate-900 focus:outline-none focus:border-black transition-all ${
                                                !detail.value ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'
                                            }`}
                                        />
                                        {/* Agent Trigger Icon */}
                                        <button 
                                            onClick={() => onAskAgent && onAskAgent(`What is ${detail.label} in ${userData?.location?.split(',')[0]} and where can I find it?`)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-[#50C913] hover:bg-[#50C913]/10 rounded-md transition-all"
                                            title="Ask Agent about this ID"
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => removeLegalRow(idx)}
                                        className="p-2 text-slate-400 hover:text-red-500"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-400">Required by local regulations for your business niche.</p>
                </div>

                <div className="h-px bg-slate-100"></div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-500 uppercase">Operation Range</label>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select 
                                value={newOpLocation}
                                onChange={(e) => setNewOpLocation(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:border-black appearance-none cursor-pointer"
                            >
                                <option value="">Select a region...</option>
                                {CONTINENTS_AND_COUNTRIES.map((loc, i) => <option key={i} value={loc} disabled={loc.startsWith('---')}>{loc}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                        <button 
                            onClick={handleAddOperation}
                            disabled={!newOpLocation}
                            className="bg-black text-white px-4 rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50"
                        >
                            Add
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {opsRange.map((loc, i) => (
                            <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                                <span className="text-sm font-medium text-slate-700">{loc}</span>
                                <button onClick={() => setDeleteConfirmation(loc)} className="text-slate-400 hover:text-red-500">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                {/* Back / Save Logic for Requirement Flow */}
                {isInRequirementMode && onReturnToBusiness ? (
                    <>
                        <button 
                            onClick={onReturnToBusiness}
                            className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveAdmin}
                            className="px-5 py-2.5 bg-[#50C913] hover:bg-[#44ab10] text-black font-bold text-sm rounded-xl transition-all shadow-md active:scale-95"
                        >
                            Save & Complete
                        </button>
                    </>
                ) : (
                    <button onClick={() => setActiveTab('main')} className="text-sm font-bold text-slate-600 hover:text-black">Back to Settings</button>
                )}
            </div>
            {deleteConfirmation && (
                <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden text-center p-6">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Remove Location?</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            Are you sure you want to remove <strong>{deleteConfirmation}</strong> from your operation range? This may affect tax compliance tracking.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirmation(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                            <button onClick={handleDeleteOperation} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600">Remove</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderSecuritySettings = () => (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slide-left">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-base font-bold text-slate-900">Security & Permissions</h2>
                <p className="text-xs text-slate-500 mt-1">Manage authentication methods and active sessions.</p>
            </div>
            <div className="p-6 space-y-8">
                {/* 2FA Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Two-Factor Authentication (2FA)</h3>
                        <p className="text-xs text-slate-500 mt-1">Protect your account with an extra layer of security.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={twoFactorEnabled} onChange={() => setTwoFactorEnabled(!twoFactorEnabled)} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-color)]"></div>
                    </label>
                </div>

                <div className="h-px bg-slate-100"></div>

                {/* Password Change */}
                <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Change Password</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Current Password</label>
                            <div className="relative">
                                <input type="password" placeholder="••••••••" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-black" />
                                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">New Password</label>
                            <div className="relative">
                                <input type="password" placeholder="••••••••" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-black" />
                                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>
                    </div>
                    <button className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors">
                        Update Password
                    </button>
                </div>

                <div className="h-px bg-slate-100"></div>

                {/* Sessions */}
                <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Active Sessions</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <Globe className="w-4 h-4 text-slate-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900">Chrome on macOS</p>
                                    <p className="text-[10px] text-slate-500">San Francisco, USA • Current Session</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#50C913] rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-bold text-[#50C913]">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button onClick={() => setActiveTab('main')} className="text-sm font-bold text-slate-600 hover:text-black">Back to Settings</button>
            </div>
        </div>
    );

    const renderIntegrationsSettings = () => (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slide-left relative">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-base font-bold text-slate-900">Integrations</h2>
                <p className="text-xs text-slate-500 mt-1">Connect your banking, payment, and accounting tools.</p>
            </div>
            <div className="p-6 space-y-8">
                {/* Banking Section */}
                <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Building2 className="w-4 h-4" /> Banking & Treasury
                    </h3>
                    
                    {bankConnected ? (
                        <div className="bg-[#50C913]/5 border border-[#50C913]/20 rounded-xl p-4 flex items-center justify-between animate-fade-in">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm">
                                    <Wallet className="w-5 h-5 text-[#50C913]" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Chase Business Checking</p>
                                    <p className="text-xs text-slate-500">Connected ••4432</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-[#50C913]">Active</p>
                                <button onClick={() => { setBankConnected(false); handleUpdate({ hasConnectedBank: false }); }} className="text-[10px] text-red-500 hover:underline mt-1">Disconnect</button>
                            </div>
                        </div>
                    ) : (
                        <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50/50">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                <Building2 className="w-6 h-6 text-slate-400" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-900">No bank account connected</h4>
                            <p className="text-xs text-slate-500 mt-1 mb-4 max-w-xs mx-auto">Connect your primary business account to enable real-time cash flow tracking and automated treasury rules.</p>
                            <button 
                                onClick={handleBankConnect}
                                disabled={isConnectingBank}
                                className="px-5 py-2.5 bg-black text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-70 flex items-center gap-2 mx-auto"
                            >
                                {isConnectingBank ? (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Connecting via Plaid...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-3.5 h-3.5" /> Connect via Plaid
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                <div className="h-px bg-slate-100"></div>

                {/* Payment Gateways */}
                <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Payment Gateways
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#635BFF] rounded-lg flex items-center justify-center text-white font-bold text-[10px]">S</div>
                                <span className="text-sm font-bold text-slate-900">Stripe</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary-color)]"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#003087] rounded-lg flex items-center justify-center text-white font-bold text-[10px]">P</div>
                                <span className="text-sm font-bold text-slate-900">PayPal</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary-color)]"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-100"></div>

                {/* Accounting */}
                <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Accounting Software
                    </h3>
                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl opacity-60">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#2CA01C] rounded-lg flex items-center justify-center text-white font-bold text-[10px]">QB</div>
                            <span className="text-sm font-bold text-slate-900">QuickBooks Online</span>
                        </div>
                        <button className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">Connect</button>
                    </div>
                </div>
            </div>
            
            {/* Conditional footer buttons for Requirement Flow */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                {isInRequirementMode && onReturnToBusiness ? (
                    <button 
                        onClick={onReturnToBusiness}
                        className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        Back
                    </button>
                ) : (
                    <button onClick={() => setActiveTab('main')} className="text-sm font-bold text-slate-600 hover:text-black">Back to Settings</button>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in w-full pb-10">
            <div className="flex items-center gap-4">
                {/* Override default back button if in Requirement Mode */}
                {isInRequirementMode && onReturnToBusiness ? (
                    <button onClick={onReturnToBusiness} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                ) : (
                    activeTab !== 'main' && (
                        <button onClick={() => setActiveTab('main')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                    )
                )}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage branding, agent, and administration.</p>
                </div>
            </div>
            
            {activeTab === 'main' && (
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Branding & Appearance</h3>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                        <div onClick={() => setActiveTab('branding')} className="p-5 flex items-center justify-between hover:bg-slate-50 cursor-pointer group transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-[var(--primary-color)]/10 group-hover:text-black transition-colors"><Palette className="w-5 h-5" /></div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">Themes & Language</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Dark mode, regional formats, and notifications.</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-black transition-colors" />
                        </div>
                    </div>

                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Agent Personalisation</h3>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                        <div onClick={() => setActiveTab('agent')} className="p-5 flex items-center justify-between hover:bg-slate-50 cursor-pointer group transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-[var(--primary-color)]/10 group-hover:text-black transition-colors"><User className="w-5 h-5" /></div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">Identity & Model</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Customize Agent Name, Personality, and Intelligence.</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-black transition-colors" />
                        </div>
                    </div>

                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Administration</h3>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                        <div onClick={() => setActiveTab('admin')} className="p-5 flex items-center justify-between hover:bg-slate-50 cursor-pointer group transition-colors border-b border-slate-100 relative">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-[var(--primary-color)]/10 group-hover:text-black transition-colors"><Briefcase className="w-5 h-5" /></div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">Billing & Operations</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Manage addresses, legal identity, and jurisdictions.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Visual cue for missing fields */}
                                {legalDetails.some(d => !d.value) && (
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-black transition-colors" />
                            </div>
                        </div>
                        <div onClick={() => setActiveTab('security')} className="p-5 flex items-center justify-between hover:bg-slate-50 cursor-pointer group transition-colors border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-[var(--primary-color)]/10 group-hover:text-black transition-colors"><Lock className="w-5 h-5" /></div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">Security & Permissions</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">2FA, Password management, and Sessions.</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-black transition-colors" />
                        </div>
                         <div onClick={() => setActiveTab('connectors')} className="p-5 flex items-center justify-between hover:bg-slate-50 cursor-pointer group transition-colors border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-[var(--primary-color)]/10 group-hover:text-black transition-colors"><Link2 className="w-5 h-5" /></div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">Integrations</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Payment rails and external services.</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-black transition-colors" />
                         </div>
                    </div>
                </div>
            )}

            {activeTab === 'branding' && renderBrandingSettings()}
            {activeTab === 'agent' && renderAgentSettings()}
            {activeTab === 'admin' && renderAdminSettings()}
            {activeTab === 'security' && renderSecuritySettings()}
            {activeTab === 'connectors' && renderIntegrationsSettings()}
        </div>
    );
};
