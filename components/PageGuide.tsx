
import React, { useState } from 'react';
import { ChevronRight, X, Sparkles } from 'lucide-react';
import { View } from '../types';

interface PageGuideProps {
    view: View;
    onClose: () => void;
    onComplete: () => void;
}

const GUIDE_CONTENT: Record<string, { title: string, content: string }[]> = {
    [View.DASHBOARD]: [
        { title: 'Financial Overview', content: 'Track real-time revenue, expenses, and net profit at a glance. See your financial health in one place.' },
        { title: 'Interactive Charts', content: 'Hover over the income statement graph to see granular monthly data.' },
        { title: 'Structure Breakdown', content: 'Understand exactly where your money goes with the cost structure breakdown.' }
    ],
    [View.ANALYST]: [
        { title: 'Your AI CFO', content: 'Ralph is here to answer any financial question, draft strategies, or forecast revenue.' },
        { title: 'Data Aware', content: 'The agent has access to your live dashboard data, so you can ask about specific transactions or trends.' },
        { title: 'Actionable Advice', content: 'Ask Ralph to "Create a rule" or "Generate a report" to perform actions directly.' }
    ],
    [View.REPORTS]: [
        { title: 'Formal Reporting', content: 'Generate professional Executive Summaries, Audits, or Forecasts with one click.' },
        { title: 'Location Context', content: 'Reports are tailored to your specific operating regions for maximum relevance.' },
        { title: 'Export Ready', content: 'Copy or download reports to share with stakeholders immediately.' }
    ],
    [View.TEAM]: [
        { title: 'Staff Management', content: 'Invite team members and assign granular roles (Viewer, Editor, Manager, Admin).' },
        { title: 'Access Control', content: 'Control who can see sensitive financial data or approve transactions.' }
    ],
    [View.REGULATIONS]: [
        { title: 'Compliance Radar', content: 'Stay ahead of the law. See which regulations apply to your specific business niche and location.' },
        { title: 'Tax Intelligence', content: 'Get real-time estimates on corporate tax obligations and filing deadlines.' },
        { title: 'Auto-Monitoring', content: 'Enable "Agent Surveillance" to have Ralph alert you of regulatory changes.' }
    ],
    [View.AUTOMATIONS]: [
        { title: 'Smart Rules', content: 'Program your money. Create "If This Then That" rules for your finances.' },
        { title: 'Auto-Allocation', content: 'Automatically set aside percentages for taxes, savings, or operations from every income transaction.' },
        { title: 'Allocations Panel', content: 'View your current balances in different allocation buckets on the right.' }
    ],
    [View.SETTINGS]: [
        { title: 'Customization', content: 'Brand your dashboard, change themes, or give your Agent a new personality.' },
        { title: 'Legal Identity', content: 'Update your business registration and tax IDs in the Administration tab.' }
    ],
    [View.TRANSACTIONS]: [
        { title: 'Live Ledger', content: 'A searchable, filterable feed of all money entering and leaving your business.' },
        { title: 'Smart Cards', content: 'Issue virtual corporate cards with spending limits for specific employees or departments.' }
    ],
    [View.BUSINESS]: [
        { title: 'Service Catalog', content: 'Define what you sell. Add services, products, and subscription plans.' },
        { title: 'Invoice Generator', content: 'Create and send professional invoices directly linked to your catalog items.' },
        { title: 'Discount Codes', content: 'Manage promo codes and price reductions for your customers.' }
    ],
    [View.NOTIFICATIONS]: [
        { title: 'Central Command', content: 'View system alerts, approval requests, and messages from connected apps (Gmail, Outlook) in one stream.' },
        { title: 'Agent Actions', content: 'Ralph analyzes incoming messages and suggests one-click actions like "Generate Invoice" or "Reconcile Payment".' },
        { title: 'Smart Outbox', content: 'Review and approve AI-drafted replies before they are sent to your clients.' }
    ]
};

export const PageGuide: React.FC<PageGuideProps> = ({ view, onClose, onComplete }) => {
    const [step, setStep] = useState(0);
    const content = GUIDE_CONTENT[view];

    if (!content) return null;

    const handleNext = () => {
        if (step < content.length - 1) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-50 w-80 bg-black text-white p-6 rounded-2xl shadow-2xl animate-slide-up border border-slate-800">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-[#50C913] rounded-lg text-black">
                    <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-[#50C913] uppercase tracking-wider">Quick Guide</span>
            </div>

            <div className="min-h-[80px]">
                <h3 className="font-bold text-lg mb-2">{content[step].title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{content[step].content}</p>
            </div>

            <div className="flex items-center justify-between mt-6">
                <div className="flex gap-1.5">
                    {content.map((_, i) => (
                        <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-white' : 'w-1.5 bg-white/20'}`} />
                    ))}
                </div>
                <button
                    onClick={handleNext}
                    className="flex items-center gap-2 text-xs font-bold hover:text-[#50C913] transition-colors"
                >
                    {step === content.length - 1 ? 'Got it' : 'Next'} <ChevronRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
};
