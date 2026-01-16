import React, { useState, useEffect } from 'react';
import { generateBusinessReport } from '../../services/geminiService';
import { FileText, Download, Loader2, RefreshCw, Copy, Check, MapPin, Layers, Printer, Sparkles, Calendar, ArrowRight, History, Inbox } from 'lucide-react';
import { UserData } from '../../types';

interface ReportsViewProps {
    userData?: UserData;
}

interface ReportHistoryItem {
    id: string;
    title: string;
    type: string;
    date: string;
    location: string;
}

const getRelativeDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const ReportsView: React.FC<ReportsViewProps> = ({ userData }) => {
  const [topic, setTopic] = useState('');
  const [location, setLocation] = useState(userData?.location || 'North America (HQ)');
  const [reportType, setReportType] = useState('Executive Summary');
  const [report, setReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize History based on user freshness
  const [history, setHistory] = useState<ReportHistoryItem[]>([]);

  useEffect(() => {
    if (!userData?.isFreshSignup) {
        setHistory([
            { id: 'R-1023', title: 'Q3 Financial Performance', type: 'Executive Summary', date: getRelativeDate(0), location: 'North America (HQ)' },
            { id: 'R-1022', title: 'EU Data Privacy Audit', type: 'Risk Assessment', date: getRelativeDate(4), location: 'European Union' },
            { id: 'R-1021', title: 'Operational Cost Structure', type: 'Expense Optimization', date: getRelativeDate(9), location: 'Global Consolidated' },
        ]);
    } else {
        setHistory([]);
    }
    
    if (userData?.location) {
        setLocation(userData.location);
    }
  }, [userData]);

  const suggestions = [
      { title: 'Tax Liability Forecast', type: 'Revenue Forecast', icon: Calendar, desc: 'Estimate Q4 tax obligations based on current revenue trends.' },
      { title: 'Compliance Audit Scan', type: 'Risk Assessment', icon: FileText, desc: 'Check recent transactions against local regulatory frameworks.' },
      { title: 'Expense Reduction', type: 'Expense Optimization', icon: ArrowRight, desc: 'Identify top 5 areas for immediate operational savings.' },
  ];

  const handleGenerate = async (overrideTopic?: string, overrideType?: string) => {
    const finalTopic = overrideTopic || topic;
    const finalType = overrideType || reportType;

    if (!finalTopic.trim()) return;
    
    // Fill UI if suggestion clicked
    setTopic(finalTopic);
    if(overrideType) setReportType(finalType);

    setIsGenerating(true);
    setReport(null);
    
    const fullQuery = `
      Report Type: ${finalType}
      Topic: ${finalTopic}
      Region Context: ${location}
      
      Please generate a detailed financial report following the specific format and depth required for a ${finalType}.
    `;
    
    const result = await generateBusinessReport(fullQuery);
    setReport(result);
    setIsGenerating(false);

    // Add to history
    setHistory(prev => [{
        id: `R-${Math.floor(Math.random() * 10000)}`,
        title: finalTopic,
        type: finalType,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        location: location
    }, ...prev]);
  };

  const copyToClipboard = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full space-y-8 animate-fade-in pb-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports</h1>
        <p className="text-slate-500 text-sm">Generate location-aware financial audits, forecasts, and executive summaries.</p>
      </div>

      {/* Parameters Form - Full Width */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Location Context</label>
                 <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#50C913] transition-colors" />
                    <select 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-300 appearance-none bg-white shadow-sm transition-all cursor-pointer"
                    >
                        <option>{userData?.location || 'North America (HQ)'}</option>
                        <option>European Union (Branch)</option>
                        <option>Asia Pacific (Remote)</option>
                        <option>Global Consolidated</option>
                    </select>
                 </div>
            </div>
            
            <div className="space-y-2">
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Report Type</label>
                 <div className="relative group">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#50C913] transition-colors" />
                    <select 
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-300 appearance-none bg-white shadow-sm transition-all cursor-pointer"
                    >
                        <option>Executive Summary</option>
                        <option>Detailed Financial Audit</option>
                        <option>Risk Assessment & Compliance</option>
                        <option>Revenue Forecast & Projection</option>
                        <option>Expense Optimization Strategy</option>
                    </select>
                 </div>
            </div>
        </div>

        <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Query
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
            <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Q3 Tax Liability analysis"
                className="flex-1 rounded-xl border border-slate-200 px-5 py-3 focus:outline-none focus:ring-1 focus:ring-slate-300 bg-white shadow-sm transition-all text-slate-900 placeholder:text-slate-400"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button
                onClick={() => handleGenerate()}
                disabled={isGenerating || !topic.trim()}
                className="bg-[#50C913] hover:bg-[#44ab10] text-black px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-[#50C913]/20 active:scale-95 whitespace-nowrap"
            >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                Generate
            </button>
            </div>
        </div>
      </div>

      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 animate-fade-in bg-white rounded-2xl border border-slate-100 shadow-sm">
           <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-[#50C913]/20 border-t-[#50C913] animate-spin mb-4"></div>
           </div>
           <p className="font-semibold text-slate-700 text-lg">Analyzing financial ledger...</p>
           <p className="text-sm text-slate-400 mt-2">Correlating data with regional compliance laws</p>
        </div>
      )}

      {report && !isGenerating && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden animate-slide-up ring-1 ring-slate-100">
          <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex justify-between items-center backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                <FileText className="w-4 h-4 text-[#50C913]" />
              </div>
              <div>
                  <span className="font-bold text-slate-800 block text-sm">{reportType}</span>
                  <span className="text-xs text-slate-500">Generated on {new Date().toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={copyToClipboard}
                className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-500 hover:text-black transition-all active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-[#50C913]" /> : <Copy className="w-4 h-4" />}
              </button>
              <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-500 hover:text-black transition-all active:scale-95">
                <Printer className="w-4 h-4" />
              </button>
              <button className="p-2 bg-[#50C913] hover:bg-[#44ab10] text-black rounded-lg shadow-md shadow-[#50C913]/20 transition-all active:scale-95">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-10 prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-lg prose-p:text-slate-600 prose-li:text-slate-600">
             <div className="whitespace-pre-wrap font-serif text-slate-800 leading-relaxed text-base">
               {report}
             </div>
          </div>
        </div>
      )}

      {/* Agent Smart Suggestions (Only show when not viewing a report) */}
      {!report && !isGenerating && (
        <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
                <Sparkles className="w-4 h-4 text-[var(--primary-color)] fill-[var(--primary-color)]" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Agent Smart Suggestions</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {suggestions.map((sug, i) => (
                    <button 
                        key={i}
                        onClick={() => handleGenerate(sug.title, sug.type)}
                        className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-[#50C913] transition-all text-left group flex flex-col h-full"
                    >
                        <div className="flex items-center justify-between mb-3 w-full">
                            <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-[#50C913]/10 text-slate-500 group-hover:text-black transition-colors">
                                <sug.icon className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{sug.type}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-[var(--primary-color)] transition-colors">{sug.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4 flex-1">{sug.desc}</p>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1 mt-auto">
                            Generate Report <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
      )}

      {/* Report History (Only show when not viewing a report) */}
      {!report && !isGenerating && (
        <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 px-1">
                <History className="w-4 h-4 text-slate-400" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Report History</h3>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider">Report Title</th>
                                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider">Type</th>
                                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider">Location</th>
                                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider">Date</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {history.length > 0 ? history.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                                    <td className="px-6 py-4 font-bold text-slate-900">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-slate-100 rounded text-slate-500">
                                                <FileText className="w-3.5 h-3.5" />
                                            </div>
                                            {item.title}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs">{item.location}</td>
                                    <td className="px-6 py-4 text-xs font-mono text-slate-500">{item.date}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-xs font-bold text-[var(--primary-color)] hover:text-black transition-colors opacity-0 group-hover:opacity-100">View</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No reports generated yet.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
      )}
    </div>
  );
};