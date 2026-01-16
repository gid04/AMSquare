
import React, { useState } from 'react';
import { Workflow, Zap, Play, Pause, DollarSign, Clock, Layers, Plus, X, ArrowRight, Sparkles, Check, PieChart, AlertCircle } from 'lucide-react';
import { AutomationRule, UserData } from '../../types';

interface AutomationsViewProps {
    rules: AutomationRule[];
    onAddRule: (rule: AutomationRule) => void;
    userData?: UserData;
}

export const AutomationsView: React.FC<AutomationsViewProps> = ({ rules, onAddRule, userData }) => {
    const isFresh = userData?.isFreshSignup;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRule, setNewRule] = useState({
        name: '',
        condition: '',
        action: ''
    });

    const templates = [
        { name: 'Tax Safety Net', condition: 'Income Transaction > $0', action: 'Transfer 20% to Tax Vault' },
        { name: 'Low Balance Alert', condition: 'Total Balance < $5,000', action: 'Send SMS & Email Alert' },
        { name: 'Profit Sweep', condition: 'End of Month Profit > $0', action: 'Move 50% to Savings' },
    ];

    // Mock Allocation Data
    const allocations = isFresh ? [] : [
        { label: 'Tax Vault', amount: 12450, percentage: 20, color: 'bg-red-500' },
        { label: 'Operations', amount: 37200, percentage: 60, color: 'bg-blue-500' },
        { label: 'Profit/Savings', amount: 12350, percentage: 20, color: 'bg-[#50C913]' },
    ];
    const totalBalance = allocations.reduce((acc, curr) => acc + curr.amount, 0);

    const handleCreateRule = () => {
        if (!newRule.name || !newRule.condition || !newRule.action) return;
        
        onAddRule({
            id: Date.now(),
            name: newRule.name,
            active: true,
            condition: newRule.condition,
            action: newRule.action,
            lastRun: 'Never',
            source: 'manual'
        });
        
        setIsModalOpen(false);
        setNewRule({ name: '', condition: '', action: '' });
    };

    const applyTemplate = (t: typeof templates[0]) => {
        setNewRule({ name: t.name, condition: t.condition, action: t.action });
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
             <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Automations & Rules</h1>
                    <p className="text-slate-500 text-sm mt-1">Configure logic for automatic fund allocation.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-black hover:bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Create New Rule
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {rules.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Layers className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No automations yet</h3>
                            <p className="text-slate-500 text-sm mt-2 max-w-xs leading-relaxed">
                                You can create rules manually or ask Ralph, your Agent, to set them up for you in the chat.
                            </p>
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="mt-6 text-[#50C913] font-bold text-sm hover:underline"
                            >
                                Start with a template
                            </button>
                        </div>
                    ) : (
                        rules.map((rule) => (
                            <div key={rule.id} className={`bg-white rounded-2xl border p-5 transition-all duration-300 ${rule.active ? 'border-slate-200 shadow-sm hover:shadow-md' : 'border-slate-100 opacity-60 grayscale'}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${rule.active ? 'bg-[#50C913]/10 text-[#50C913]' : 'bg-slate-100 text-slate-400'}`}>
                                            <Workflow className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-900 text-sm">{rule.name}</h3>
                                                {rule.source === 'agent' && (
                                                    <span className="text-[9px] font-bold bg-black text-white px-1.5 py-0.5 rounded">Agent Created</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                                                <Clock className="w-3 h-3" />
                                                Last run: {rule.lastRun}
                                            </div>
                                        </div>
                                    </div>
                                    <button className={`p-1.5 rounded-lg transition-colors border ${rule.active ? 'text-black bg-white border-slate-200 hover:bg-slate-50' : 'text-slate-400 bg-slate-50 border-slate-100 hover:bg-slate-100'}`}>
                                        {rule.active ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                    </button>
                                </div>
                                
                                <div className="relative pl-3 border-l-2 border-slate-100 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider w-8">When</span>
                                        <span className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-md text-slate-700 font-mono text-[10px] font-medium">{rule.condition}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-bold text-[#50C913] uppercase tracking-wider w-8">Do</span>
                                        <span className="bg-[#50C913]/10 border border-[#50C913]/20 px-2 py-1 rounded-md text-black font-mono text-[10px] font-bold flex-1">{rule.action}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="space-y-6">
                     {/* Allocations Panel */}
                     <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <PieChart className="w-4 h-4 text-slate-500" />
                                Allocations
                            </h3>
                            <span className="text-xs font-bold text-slate-500">Total: ${totalBalance.toLocaleString()}</span>
                        </div>
                        
                        {allocations.length === 0 ? (
                            <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center">
                                <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                                <p className="text-xs font-bold text-slate-600">No active allocations</p>
                                <p className="text-[10px] text-slate-400 mt-1 max-w-[150px]">Create rules or connect a bank account to see your funds split here.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Visual Bar */}
                                <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
                                    {allocations.map((alloc, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`h-full ${alloc.color}`} 
                                            style={{ width: `${alloc.percentage}%` }}
                                            title={`${alloc.label}: ${alloc.percentage}%`}
                                        />
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    {allocations.map((alloc, idx) => (
                                        <div key={idx} className="flex justify-between items-center group">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${alloc.color}`}></div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{alloc.label}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">{alloc.percentage}% of income</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-slate-900">${alloc.amount.toLocaleString()}</p>
                                                <button className="text-[10px] font-bold text-[#50C913] opacity-0 group-hover:opacity-100 transition-opacity hover:underline">
                                                    Withdraw
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-6 pt-4 border-t border-slate-100">
                            <button className="w-full py-2.5 bg-slate-50 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-100 hover:text-black transition-colors">
                                Edit Allocation Rules
                            </button>
                        </div>
                     </div>

                     <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4 text-sm">Automation Log</h3>
                        {rules.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs">No activity yet.</div>
                        ) : (
                            <div className="relative">
                                <div className="absolute left-1 top-2 bottom-2 w-0.5 bg-slate-100"></div>
                                <ul className="space-y-4">
                                    <li className="flex gap-3 relative">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#50C913] ring-4 ring-white mt-1.5 z-10 shadow-sm"></div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">Rule "{rules[0].name}" Active</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Just now • Trigger: User Action</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        )}
                     </div>
                </div>
            </div>

            {/* Create Rule Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Workflow className="w-5 h-5 text-[var(--primary-color)]" />
                                    New Automation Rule
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">Define logic to automate your financial flows.</p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-black"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Templates</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {templates.map((t, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => applyTemplate(t)}
                                            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#50C913] hover:bg-[#50C913]/5 transition-all group text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-lg border border-slate-100 group-hover:border-[#50C913]/20 shadow-sm">
                                                    <Sparkles className="w-4 h-4 text-slate-400 group-hover:text-[#50C913]" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">{t.name}</p>
                                                    <p className="text-[10px] text-slate-500">{t.condition} → {t.action}</p>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#50C913] group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Rule Name</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Monthly Savings"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-black transition-all text-sm font-medium"
                                        value={newRule.name}
                                        onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Trigger Condition (When)</label>
                                    <div className="relative">
                                        <input 
                                            type="text"
                                            placeholder="e.g. Revenue > $5000"
                                            className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-black transition-all text-sm font-mono text-slate-700"
                                            value={newRule.condition}
                                            onChange={(e) => setNewRule({...newRule, condition: e.target.value})}
                                        />
                                        <Zap className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Action (Do)</label>
                                    <div className="relative">
                                        <input 
                                            type="text"
                                            placeholder="e.g. Move 10% to Reserve"
                                            className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-black transition-all text-sm font-mono text-slate-700"
                                            value={newRule.action}
                                            onChange={(e) => setNewRule({...newRule, action: e.target.value})}
                                        />
                                        <Play className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCreateRule}
                                disabled={!newRule.name || !newRule.condition || !newRule.action}
                                className="px-5 py-2.5 bg-black text-white font-bold text-xs rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/10 flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" /> Create Rule
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
