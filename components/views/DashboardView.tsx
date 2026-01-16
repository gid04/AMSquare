import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, CreditCard, Scale, Briefcase, AlertCircle } from 'lucide-react';
import { Metric, ChartData, UserData } from '../../types';

interface DashboardViewProps {
  userData?: UserData;
}

// Demo Financial Data Generator
const generateFinancialHistory = () => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('default', { month: 'short' });
        // Use deterministic values based on index to keep shape consistent but dates dynamic
        const baseRevenue = [1100, 1300, 1150, 1450, 1600, 1800][5-i];
        const baseExpenses = [800, 850, 820, 900, 950, 1000][5-i];
        
        data.push({
            name: monthName,
            revenue: baseRevenue,
            expenses: baseExpenses,
            profit: baseRevenue - baseExpenses
        });
    }
    return data;
};

const demoFinancialHistory: ChartData[] = generateFinancialHistory();

const emptyFinancialHistory: ChartData[] = [
    { name: 'Jan', revenue: 0, expenses: 0, profit: 0 },
    { name: 'Feb', revenue: 0, expenses: 0, profit: 0 },
    { name: 'Mar', revenue: 0, expenses: 0, profit: 0 },
    { name: 'Apr', revenue: 0, expenses: 0, profit: 0 },
    { name: 'May', revenue: 0, expenses: 0, profit: 0 },
    { name: 'Jun', revenue: 0, expenses: 0, profit: 0 },
];

const demoCostStructure = [
  { name: 'Salaries & Benefits', value: 45, color: '#50C913' }, 
  { name: 'Infrastructure', value: 20, color: '#171717' },
  { name: 'Taxes & Compliance', value: 15, color: '#525252' },
  { name: 'Marketing', value: 10, color: '#a3a3a3' },
  { name: 'Misc', value: 10, color: '#e5e5e5' },
];

const emptyCostStructure = [
    { name: 'No Data', value: 100, color: '#e5e5e5' }
];

export const DashboardView: React.FC<DashboardViewProps> = ({ userData }) => {
  const isFresh = userData?.isFreshSignup;
  const currentYear = new Date().getFullYear();
  
  const financialHistory = isFresh ? emptyFinancialHistory : demoFinancialHistory;
  const costStructure = isFresh ? emptyCostStructure : demoCostStructure;
  
  const metrics: Metric[] = isFresh ? [
    { label: 'Total Revenue', value: '$0.00', change: 0, trend: 'neutral' },
    { label: 'Total Expenses', value: '$0.00', change: 0, trend: 'neutral' }, 
    { label: 'Est. Taxes (YTD)', value: '$0.00', change: 0, trend: 'neutral' },
    { label: 'Net Profit', value: '$0.00', change: 0, trend: 'neutral' },
  ] : [
    { label: 'Total Revenue', value: '$1.8M', change: 12.5, trend: 'up' },
    { label: 'Total Expenses', value: '$1.0M', change: 4.2, trend: 'up' }, 
    { label: 'Est. Taxes (YTD)', value: '$240k', change: 0.0, trend: 'neutral' },
    { label: 'Net Profit', value: '$560k', change: 18.4, trend: 'up' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{userData ? `${userData.businessName} Overview` : 'Overview'}</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time breakdown of revenue, expenses, and financial structure.</p>
        </div>
        <div className="flex items-center gap-3">
             <div className="text-xs font-bold text-black bg-[#50C913]/10 px-4 py-2 rounded-full border border-[#50C913]/20 shadow-sm">
                FY {currentYear}
             </div>
        </div>
      </div>

      {isFresh && (
         <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-4 animate-fade-in">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <AlertCircle className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-bold text-blue-900 text-sm">Welcome to your new dashboard!</h3>
                <p className="text-xs text-blue-700 mt-1">
                    Connect your bank accounts or start uploading invoices to see real-time data here.
                </p>
            </div>
         </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_-2px_rgba(80,201,19,0.15)] transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-[#50C913] group-hover:border-[#50C913] transition-colors">
                {idx === 0 && <DollarSign className="w-5 h-5 text-black group-hover:text-black" />}
                {idx === 1 && <CreditCard className="w-5 h-5 text-slate-600 group-hover:text-black" />}
                {idx === 2 && <Scale className="w-5 h-5 text-slate-600 group-hover:text-black" />}
                {idx === 3 && <Briefcase className="w-5 h-5 text-slate-600 group-hover:text-black" />}
              </div>
              {metric.trend !== 'neutral' && (
                <span className={`flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    metric.trend === 'up' 
                    ? 'bg-[#50C913]/10 text-black' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                    {metric.trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {Math.abs(metric.change)}%
                </span>
              )}
            </div>
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">{metric.label}</h3>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Income Statement */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-base font-bold text-slate-900 tracking-tight">Income Statement Trend</h3>
             <select className="text-xs font-bold bg-black text-white border-none rounded-lg p-[5px] cursor-pointer outline-none hover:text-[#50C913] focus:text-[#50C913] transition-colors">
                 <option>Last 6 Months</option>
                 <option>Year to Date</option>
             </select>
          </div>
          <div className="h-[280px] w-full relative">
            {isFresh && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10 backdrop-blur-[1px]">
                    <span className="bg-slate-100 text-slate-500 px-4 py-2 rounded-full text-xs font-bold">No data available yet</span>
                </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#50C913" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#50C913" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#171717" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#171717" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} unit="k" />
                <Tooltip 
                  contentStyle={{backgroundColor: '#000000', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', padding: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                  itemStyle={{color: '#fff', paddingBottom: '2px'}}
                  formatter={(value) => [`$${value}k`, '']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenue"
                  stroke="#50C913" 
                  strokeWidth={2}
                  fill="url(#colorRevenue)" 
                />
                 <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  name="Expenses"
                  stroke="#d4d4d4" 
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="none" 
                />
                 <Area 
                  type="monotone" 
                  dataKey="profit" 
                  name="Net Profit"
                  stroke="#171717" 
                  strokeWidth={2}
                  fill="url(#colorProfit)" 
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '15px', fontSize: '12px'}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Structure */}
        <div className="bg-white p-6 pb-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col relative">
            <h3 className="text-base font-bold text-slate-900 mb-1 tracking-tight">Financial Structure</h3>
            <p className="text-xs text-slate-500 mb-4">Breakdown of monthly costs.</p>
            
            <div className="h-[240px] relative w-full">
                {/* Chart Container */}
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={costStructure}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            cornerRadius={5}
                            stroke="none"
                        >
                            {costStructure.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{backgroundColor: '#000000', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px'}}
                            itemStyle={{color: '#fff'}}
                        />
                        <Legend 
                            verticalAlign="bottom" 
                            height={36} 
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '11px' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                
                {/* Centered Text Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-slate-900 leading-none">{isFresh ? '0%' : '45%'}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{isFresh ? 'Expenses' : 'Salaries'}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};