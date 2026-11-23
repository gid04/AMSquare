
import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, CreditCard, Scale, Briefcase, AlertCircle, Plus } from 'lucide-react';
import { Metric, ChartData, UserData, Transaction, View } from '../../types';

interface DashboardViewProps {
  userData?: UserData;
  transactions?: Transaction[];
  onNavigate?: (view: View, subTab?: string) => void;
}

const emptyCostStructure = [
  { name: 'No Data', value: 100, color: '#e5e5e5' }
];

const COLORS = ['#50C913', '#171717', '#525252', '#a3a3a3', '#e5e5e5', '#3b82f6', '#f97316'];

export const DashboardView: React.FC<DashboardViewProps> = ({ userData, transactions = [], onNavigate }) => {
  const isFresh = userData?.isFreshSignup;
  const currentYear = new Date().getFullYear();
  const [timeRange, setTimeRange] = useState<'6M' | 'YTD'>('6M');

  // Aggregate Data from Transactions
  const { metrics, financialHistory, costStructure } = useMemo(() => {
    // 1. Calculate Totals (All Time / based on data)
    // Note: Cards typically show overall health or MTD/YTD. Here we show All Time for simplicity in demo or YTD could be applied.
    // Let's stick to All Time completed for the top cards to show total business value.
    const totalRevenue = transactions.filter(t => t.type === 'credit' && t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'debit' && t.status === 'Completed').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const netProfit = totalRevenue - totalExpenses;

    // Est Taxes (Simple 20% of Profit for demo, max 0)
    const estTaxes = Math.max(netProfit * 0.2, 0);

    const computedMetrics: Metric[] = [
      { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, change: 0, trend: totalRevenue > 0 ? 'up' : 'neutral' },
      { label: 'Total Expenses', value: `$${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, change: 0, trend: totalExpenses > 0 ? 'down' : 'neutral' },
      { label: 'Est. Taxes (YTD)', value: `$${estTaxes.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, change: 0, trend: 'neutral' },
      { label: 'Net Profit', value: `$${netProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, change: 0, trend: netProfit >= 0 ? 'up' : 'down' }
    ];

    // 2. Calculate History (Group by Month) based on TimeRange
    const monthsMap = new Map<string, { revenue: number, expenses: number, sortIndex: number }>();
    const today = new Date();

    if (timeRange === '6M') {
      // Last 6 months including current
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = d.toLocaleString('default', { month: 'short' });
        monthsMap.set(key, { revenue: 0, expenses: 0, sortIndex: i });
      }
    } else {
      // YTD
      for (let i = 0; i <= today.getMonth(); i++) {
        const d = new Date(today.getFullYear(), i, 1);
        const key = d.toLocaleString('default', { month: 'short' });
        monthsMap.set(key, { revenue: 0, expenses: 0, sortIndex: i });
      }
    }

    transactions.forEach(t => {
      if (t.status !== 'Completed') return;
      const d = new Date(t.date);

      // Filter checks
      if (timeRange === 'YTD' && d.getFullYear() !== currentYear) return;
      if (timeRange === '6M') {
        const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
        if (d < sixMonthsAgo) return;
      }

      const key = d.toLocaleString('default', { month: 'short' });
      if (monthsMap.has(key)) {
        const current = monthsMap.get(key)!;
        if (t.type === 'credit') current.revenue += t.amount;
        else current.expenses += Math.abs(t.amount);
      }
    });

    const historyData: ChartData[] = Array.from(monthsMap.entries())
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.revenue - data.expenses,
        sortIndex: data.sortIndex
      }))
      .sort((a, b) => a.sortIndex - b.sortIndex); // Ensure chronological order

    // 3. Cost Structure (Group Expenses by Category)
    const expenses = transactions.filter(t => t.type === 'debit' && t.status === 'Completed');
    const categoryMap = new Map<string, number>();

    expenses.forEach(t => {
      const cat = t.category || 'Uncategorized';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + Math.abs(t.amount));
    });

    const structureData = Array.from(categoryMap.entries()).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    })).sort((a, b) => b.value - a.value);

    return {
      metrics: computedMetrics,
      financialHistory: historyData,
      costStructure: structureData.length > 0 ? structureData : emptyCostStructure
    };

  }, [transactions, timeRange, currentYear]);

  const topExpenseCategory = costStructure.length > 0 && costStructure[0].name !== 'No Data'
    ? costStructure[0]
    : { name: 'Expenses', value: 0 };

  const totalExp = costStructure.reduce((acc, curr) => acc + curr.value, 0);
  const topExpensePercentage = totalExp > 0 ? Math.round((topExpenseCategory.value / totalExp) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{userData ? `${userData.businessName} Overview` : 'Overview'}</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time breakdown of revenue, expenses, and financial structure.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate?.(View.TRANSACTIONS)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all shadow-lg active:scale-95 group"
          >
            <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
            Quick Transaction
          </button>
          <div className="text-xs font-bold text-black bg-[#50C913]/10 px-4 py-2 rounded-full border border-[#50C913]/20 shadow-sm">
            FY {currentYear}
          </div>
        </div>
      </div>

      {isFresh && transactions.length === 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-4 animate-fade-in">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900 text-sm">Welcome back to your dashboard!</h3>
            <p className="text-xs text-blue-700 mt-1">
              Connect your bank accounts or manually add your first transaction to get started with Ralph.
            </p>
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => onNavigate?.(View.SETTINGS, 'connectors')}
                className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Connect Bank
              </button>
              <button
                onClick={() => onNavigate?.(View.TRANSACTIONS)}
                className="text-xs font-bold bg-white text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Add Transaction
              </button>
            </div>
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
                <span className={`flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${metric.trend === 'up'
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
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="text-xs font-bold bg-black text-white border-none rounded-lg p-[5px] cursor-pointer outline-none hover:text-[#50C913] focus:text-[#50C913] transition-colors"
            >
              <option value="6M">Last 6 Months</option>
              <option value="YTD">Year to Date</option>
            </select>
          </div>
          <div className="h-[280px] w-full relative">
            {financialHistory.every(d => d.revenue === 0 && d.expenses === 0) && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10 backdrop-blur-[1px]">
                <span className="bg-slate-100 text-slate-500 px-4 py-2 rounded-full text-xs font-bold">No data available yet</span>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#50C913" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#50C913" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#171717" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#171717" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} dy={10} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000000', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', padding: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#fff', paddingBottom: '2px' }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
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
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />
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
                  contentStyle={{ backgroundColor: '#000000', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
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
                <span className="text-2xl font-bold text-slate-900 leading-none">{topExpensePercentage}%</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 truncate max-w-[80px]">{topExpenseCategory.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
