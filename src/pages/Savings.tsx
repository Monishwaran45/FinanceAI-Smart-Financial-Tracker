import { useState, useEffect } from 'react';
import { getExpenses, getIncome, upsertIncome } from '../lib/db';
import { Expense } from '../types';
import { DollarSign, TrendingUp, PiggyBank, Calendar, Target, AlertTriangle, CheckCircle, Loader2, ArrowDownRight, ArrowUpRight } from 'lucide-react';

const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getBudgetRecommendation(income: number, expenses: number) {
  if (income <= 0) return null;
  const savingsRate = ((income - expenses) / income) * 100;
  const needs = income * 0.5;
  const wants = income * 0.3;
  const savings = income * 0.2;

  return {
    needs: needs.toFixed(0),
    wants: wants.toFixed(0),
    savings: savings.toFixed(0),
    savingsRate: savingsRate.toFixed(1),
    status: savingsRate >= 20 ? 'excellent' : savingsRate >= 10 ? 'good' : savingsRate >= 0 ? 'low' : 'deficit',
  };
}

export default function Savings() {
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetchData(); }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const expData = await getExpenses();
      setExpenses(expData || []);
      const incData = await getIncome(selectedMonth, selectedYear);
      if (incData && incData.monthly_income) setMonthlyIncome(incData.monthly_income.toString());
      else setMonthlyIncome('');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthlyIncome || parseFloat(monthlyIncome) <= 0) return;
    try {
      await upsertIncome({
        monthly_income: parseFloat(monthlyIncome),
        month: selectedMonth,
        year: selectedYear,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
  };

  const monthlyExpenses = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    })
    .reduce((s, e) => s + Number(e.amount), 0);

  const income = parseFloat(monthlyIncome) || 0;
  const netSavings = income - monthlyExpenses;
  const rec = getBudgetRecommendation(income, monthlyExpenses);

  const statusConfig = {
    excellent: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle, msg: 'Excellent! You\'re saving at a healthy rate.' },
    good:      { color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    icon: CheckCircle, msg: 'Good start! Push savings above 20%.' },
    low:       { color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: AlertTriangle, msg: 'Low savings. Review your expenses.' },
    deficit:   { color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     icon: AlertTriangle, msg: 'Spending exceeds income! Budget review needed.' },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 size={22} className="animate-spin text-[#444CE7]" />
          <span className="text-sm font-medium">Loading savings data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div className="max-w-2xl mx-auto px-5 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Savings</h1>
          <p className="text-gray-500 text-sm">Track income, expenses, and get budget recommendations</p>
        </div>

        {/* ── Period Selector ───────────────────── */}
        <div className="card p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar size={15} className="text-[#444CE7]" />
            Select Period
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="input-field"
              >
                {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="input-field"
              >
                {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Income Input ──────────────────────── */}
        <div className="card p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <DollarSign size={15} className="text-[#444CE7]" />
            Monthly Income
          </h2>
          <form onSubmit={handleIncomeSubmit} className="flex gap-2.5">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₹</span>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                step="0.01"
                placeholder="Enter income"
                className="input-field pl-8"
              />
            </div>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex-shrink-0 ${
                saved
                  ? 'bg-emerald-500 text-white'
                  : 'btn-primary'
              }`}
            >
              {saved ? '✓ Saved' : 'Save'}
            </button>
          </form>
        </div>

        {/* ── Overview Cards ───────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Income', value: `₹${income.toFixed(0)}`, icon: DollarSign, color: 'text-[#444CE7]', bg: 'bg-[#EEF0FF]', arrow: ArrowUpRight },
            { label: 'Expenses', value: `₹${monthlyExpenses.toFixed(0)}`, icon: TrendingUp, color: 'text-red-500', bg: 'bg-red-50', arrow: ArrowDownRight },
            { label: 'Savings', value: `₹${netSavings.toFixed(0)}`, icon: PiggyBank, color: netSavings >= 0 ? 'text-emerald-600' : 'text-red-500', bg: netSavings >= 0 ? 'bg-emerald-50' : 'bg-red-50', arrow: netSavings >= 0 ? ArrowUpRight : ArrowDownRight },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-2.5`}>
                  <Icon size={16} className={s.color} />
                </div>
                <p className="text-gray-500 text-[10px] sm:text-xs font-medium mb-0.5">{s.label}</p>
                <p className={`text-base sm:text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
            );
          })}
        </div>

        {/* ── Savings Calculation ───────────────── */}
        <div className="card p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Savings Breakdown</h2>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-gray-600 text-sm">Monthly Income</span>
              <span className="text-gray-900 font-bold">₹{income.toFixed(0)}</span>
            </div>

            <div className="text-center text-gray-300 text-sm font-semibold">−</div>

            <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-gray-600 text-sm">Total Expenses</span>
              <span className="text-red-500 font-bold">₹{monthlyExpenses.toFixed(0)}</span>
            </div>

            <div className="text-center text-gray-300 text-sm font-semibold">=</div>

            <div className={`flex justify-between items-center px-4 py-4 rounded-xl border ${
              netSavings >= 0
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <span className={`font-semibold text-sm ${netSavings >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                Net Savings
              </span>
              <span className={`text-xl font-bold ${netSavings >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                ₹{netSavings.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Budget Recommendation ────────────── */}
        {rec && (
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target size={15} className="text-[#444CE7]" />
              Budget Recommendation (50-30-20)
            </h2>

            {/* Status Banner */}
            {(() => {
              const cfg = statusConfig[rec.status as keyof typeof statusConfig];
              const Icon = cfg.icon;
              return (
                <div className={`flex items-center gap-3 p-3.5 rounded-xl border mb-5 ${cfg.bg} ${cfg.border}`}>
                  <Icon size={17} className={cfg.color} />
                  <div>
                    <p className={`font-semibold text-sm ${cfg.color}`}>Savings Rate: {rec.savingsRate}%</p>
                    <p className="text-gray-500 text-xs mt-0.5">{cfg.msg}</p>
                  </div>
                </div>
              );
            })()}

            {/* 50-30-20 Cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Needs', pct: '50%', value: rec.needs, desc: 'Rent, food, bills', emoji: '🏠', color: 'border-blue-200 bg-blue-50' },
                { label: 'Wants', pct: '30%', value: rec.wants, desc: 'Fun, shopping', emoji: '🎯', color: 'border-purple-200 bg-purple-50' },
                { label: 'Save', pct: '20%', value: rec.savings, desc: 'Emergency, invest', emoji: '💰', color: 'border-emerald-200 bg-emerald-50' },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl p-3.5 sm:p-4 border text-center ${item.color}`}>
                  <div className="text-xl mb-1.5">{item.emoji}</div>
                  <p className="text-gray-500 text-[10px] sm:text-xs font-medium">{item.label} ({item.pct})</p>
                  <p className="text-gray-900 font-bold text-base sm:text-lg mt-0.5">₹{item.value}</p>
                  <p className="text-gray-400 text-[10px] mt-1 hidden sm:block">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Target Section */}
            <div className="p-4 bg-[#EEF0FF] border border-[#C7D7FE] rounded-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <Target size={13} className="text-[#444CE7]" />
                <span className="text-[#444CE7] text-xs font-semibold">Savings Target</span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                To reach 20% savings, keep expenses under{' '}
                <span className="text-gray-900 font-semibold">₹{(income * 0.8).toFixed(0)}</span>.
                {' '}Gap:{' '}
                <span className={netSavings >= income * 0.2 ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                  ₹{Math.abs(income * 0.2 - netSavings).toFixed(0)}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
