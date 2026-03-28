import { useState, useEffect } from 'react';
import { getExpenses } from '../lib/db';
import { predictNextMonth, getModelMetrics, detectAnomaly, type PredictionResult, type ModelMetrics } from '../lib/api';
import { Expense, AIInsight } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart,
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info, Lightbulb, Zap, FlaskConical, Loader2 } from 'lucide-react';

const COLORS = ['#444CE7', '#7C3AED', '#0EA5E9', '#10B981', '#F59E0B', '#EC4899', '#6366F1', '#94A3B8'];

const categoryEmoji: Record<string, string> = {
  Food: '🍔', Travel: '🚗', Shopping: '🛍️', Bills: '📄',
  Health: '💊', Entertainment: '🎬', Education: '📚', Other: '💰',
};

function generateInsights(expenses: Expense[]): AIInsight[] {
  const insights: AIInsight[] = [];
  if (expenses.length === 0) return insights;

  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
  });
  const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  if (topCategory && topCategory[1] / total > 0.4) {
    insights.push({
      type: 'warning',
      title: 'High Spending Concentration',
      message: `${topCategory[0]} accounts for ${((topCategory[1] / total) * 100).toFixed(0)}% of total expenses. Consider diversifying your budget.`,
    });
  }

  const weekendExpenses = expenses.filter((e) => {
    const day = new Date(e.date).getDay();
    return day === 0 || day === 6;
  });
  const weekendTotal = weekendExpenses.reduce((s, e) => s + Number(e.amount), 0);
  if (weekendTotal / total > 0.45) {
    insights.push({
      type: 'info',
      title: 'Weekend Spending Pattern',
      message: `${((weekendTotal / total) * 100).toFixed(0)}% of spending happens on weekends. Set a weekend entertainment budget.`,
    });
  }

  const monthlyTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    const key = new Date(e.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    monthlyTotals[key] = (monthlyTotals[key] || 0) + Number(e.amount);
  });
  const months = Object.values(monthlyTotals);
  if (months.length >= 2) {
    const last = months[months.length - 1];
    const prev = months[months.length - 2];
    const change = ((last - prev) / prev) * 100;
    if (change > 20) {
      insights.push({ type: 'warning', title: 'Spending Spike', message: `Spending increased ${change.toFixed(0)}% vs last month. Review recent transactions.` });
    } else if (change < -10) {
      insights.push({ type: 'success', title: 'Great Progress!', message: `Spending reduced by ${Math.abs(change).toFixed(0)}% this month. Keep it up!` });
    }
  }

  if (categoryTotals['Food'] && categoryTotals['Food'] / total > 0.3) {
    insights.push({ type: 'tip', title: 'Food Budget Tip', message: 'Meal prepping can reduce food expenses by up to 40%. Try planning weekly meals.' });
  }

  if (insights.length === 0) {
    insights.push({ type: 'success', title: 'Balanced Spending', message: 'Your spending looks well-distributed. Keep tracking to maintain this balance.' });
  }
  return insights;
}

const insightStyles: Record<string, { icon: any; bg: string; border: string; text: string }> = {
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  success: { icon: CheckCircle, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  info:    { icon: Info,         bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700' },
  tip:     { icon: Lightbulb,    bg: 'bg-purple-50',  border: 'border-purple-200',  text: 'text-purple-700' },
};

export default function Analysis() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [mlPrediction, setMlPrediction] = useState<PredictionResult | null>(null);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);
  const [anomalies, setAnomalies] = useState<string[]>([]);

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    try {
      const data = await getExpenses();
      const exp = data || [];
      setExpenses(exp);
      await fetchMLData(exp);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchMLData = async (exp: Expense[]) => {
    const monthlyMap: Record<string, number> = {};
    exp.forEach((e) => {
      const key = new Date(e.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyMap[key] = (monthlyMap[key] || 0) + Number(e.amount);
    });
    const totals = Object.values(monthlyMap);

    const categoryAmounts: Record<string, number[]> = {};
    exp.forEach((e) => {
      if (!categoryAmounts[e.category]) categoryAmounts[e.category] = [];
      categoryAmounts[e.category].push(Number(e.amount));
    });

    try {
      if (totals.length >= 2) {
        const pred = await predictNextMonth(totals);
        setMlPrediction(pred);
      }
      const metrics = await getModelMetrics();
      setModelMetrics(metrics);

      const anomalyMessages: string[] = [];
      for (const [cat, amounts] of Object.entries(categoryAmounts)) {
        if (amounts.length >= 3) {
          const last = amounts[amounts.length - 1];
          const past = amounts.slice(0, -1);
          const result = await detectAnomaly(past, last);
          if (result.is_anomaly) anomalyMessages.push(`${cat}: ${result.reason}`);
        }
      }
      setAnomalies(anomalyMessages);
    } catch { /* backend not running */ }
  };

  const getCategoryData = () => {
    const totals: Record<string, number> = {};
    expenses.forEach((e) => { totals[e.category] = (totals[e.category] || 0) + Number(e.amount); });
    return Object.entries(totals).map(([name, value]) => ({ name, value: +value.toFixed(2) }));
  };

  const getMonthlyData = () => {
    const totals: Record<string, number> = {};
    expenses.forEach((e) => {
      const m = new Date(e.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      totals[m] = (totals[m] || 0) + Number(e.amount);
    });
    return Object.entries(totals).map(([month, total]) => ({ month, total: +total.toFixed(2) }));
  };

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const categoryData = getCategoryData();
  const monthlyData = getMonthlyData();
  const insights = generateInsights(expenses);
  const trend = monthlyData.length >= 2
    ? monthlyData[monthlyData.length - 1].total > monthlyData[monthlyData.length - 2].total ? 'increasing' : 'decreasing'
    : null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white rounded-xl p-3 shadow-lg border border-gray-100">
          <p className="text-gray-500 text-xs mb-0.5">{label}</p>
          <p className="text-gray-900 font-bold text-sm">₹{payload[0].value?.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 size={22} className="animate-spin text-[#444CE7]" />
          <span className="text-sm font-medium">Analyzing your data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Analytics</h1>
          <p className="text-gray-500 text-sm">AI-powered insights into your spending</p>
        </div>

        {expenses.length === 0 ? (
          <div className="card p-12 sm:p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <BarChart size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-500">No expenses yet. Add some to see AI insights.</p>
          </div>
        ) : (
          <>
            {/* ── KPI Cards ────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {[
                { label: 'Total Spent', value: `₹${totalExpenses.toFixed(0)}`, icon: TrendingUp, color: 'text-[#444CE7]', bg: 'bg-[#EEF0FF]' },
                { label: 'Transactions', value: String(expenses.length), icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Categories', value: String(categoryData.length), icon: FlaskConical, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Trend', value: trend === 'increasing' ? '↑ Rising' : trend === 'decreasing' ? '↓ Falling' : '—', icon: trend === 'increasing' ? TrendingUp : TrendingDown, color: trend === 'increasing' ? 'text-red-500' : 'text-emerald-600', bg: trend === 'increasing' ? 'bg-red-50' : 'bg-emerald-50' },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="card p-4 sm:p-5 animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-gray-500 text-xs font-medium">{s.label}</p>
                      <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                        <Icon size={15} className={s.color} />
                      </div>
                    </div>
                    <p className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                );
              })}
            </div>

            {/* ── AI Insights ──────────────────────── */}
            <div className="card p-5 sm:p-6 mb-6">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lightbulb size={17} className="text-amber-500" />
                AI Insights
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.map((insight, i) => {
                  const style = insightStyles[insight.type];
                  const Icon = style.icon;
                  return (
                    <div key={i} className={`rounded-xl p-4 border ${style.bg} ${style.border} animate-slide-up`} style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon size={15} className={style.text} />
                        <span className={`font-semibold text-sm ${style.text}`}>{insight.title}</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{insight.message}</p>
                    </div>
                  );
                })}

                {/* ML Prediction */}
                {mlPrediction?.prediction != null && (
                  <div className="rounded-xl p-4 border bg-[#EEF0FF] border-[#C7D7FE] animate-slide-up">
                    <div className="flex items-center gap-2 mb-1.5">
                      <TrendingUp size={15} className="text-[#444CE7]" />
                      <span className="font-semibold text-sm text-[#444CE7]">ML Prediction — Next Month</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 mb-1">₹{mlPrediction.prediction.toFixed(0)}</p>
                    <p className="text-xs text-gray-500 mb-2">{mlPrediction.explanation}</p>
                    <div className="flex gap-3 text-xs text-gray-400">
                      {mlPrediction.mae != null && <span>MAE: ₹{mlPrediction.mae}</span>}
                      {mlPrediction.rmse != null && <span>RMSE: ₹{mlPrediction.rmse}</span>}
                      {mlPrediction.mape != null && <span>MAPE: {mlPrediction.mape}%</span>}
                    </div>
                  </div>
                )}

                {/* Anomalies */}
                {anomalies.map((msg, i) => (
                  <div key={i} className="rounded-xl p-4 border bg-red-50 border-red-200 animate-slide-up">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={15} className="text-red-600" />
                      <span className="font-semibold text-sm text-red-600">Anomaly Detected</span>
                    </div>
                    <p className="text-xs text-gray-600">{msg}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Model Metrics ────────────────────── */}
            {modelMetrics && (
              <div className="card p-5 sm:p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <FlaskConical size={17} className="text-purple-500" />
                    ML Model Performance
                  </h2>
                  <span className="badge badge-brand text-[10px]">Naive Bayes + TF-IDF</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Accuracy', value: `${modelMetrics.accuracy_pct}%`, color: 'text-emerald-600' },
                    { label: 'CV Mean', value: `${(modelMetrics.cv_mean * 100).toFixed(1)}%`, color: 'text-[#444CE7]' },
                    { label: 'Train', value: String(modelMetrics.train_samples), color: 'text-blue-600' },
                    { label: 'Test', value: String(modelMetrics.test_samples), color: 'text-purple-600' },
                  ].map((m) => (
                    <div key={m.label} className="bg-gray-50 rounded-xl p-3.5 text-center border border-gray-100">
                      <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Model Accuracy</span>
                    <span className="font-semibold">{modelMetrics.accuracy_pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#444CE7] to-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${modelMetrics.accuracy_pct}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Charts ──────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-5">
              {/* Monthly Trend */}
              <div className="card p-5 sm:p-6">
                <h2 className="text-base font-bold text-gray-900 mb-5">Monthly Trend</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#444CE7" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#444CE7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="total" stroke="#444CE7" strokeWidth={2.5} fill="url(#colorTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Category Breakdown */}
              <div className="card p-5 sm:p-6">
                <h2 className="text-base font-bold text-gray-900 mb-5">Category Split</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryData} cx="50%" cy="50%" outerRadius={80} innerRadius={45}
                      dataKey="value" paddingAngle={3} cornerRadius={4}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: any) => `₹${Number(v).toFixed(2)}`}
                      contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Bar Chart */}
            <div className="card p-5 sm:p-6 mb-5">
              <h2 className="text-base font-bold text-gray-900 mb-5">Category Expenses</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ── Category Summary ─────────────────── */}
            <div className="card p-5 sm:p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5">Category Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categoryData.map((cat, i) => (
                  <div key={cat.name} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-sm transition-shadow">
                    <div className="text-2xl mb-2">{categoryEmoji[cat.name] || '💰'}</div>
                    <p className="text-gray-700 text-sm font-medium">{cat.name}</p>
                    <p className="text-gray-900 font-bold text-lg">₹{cat.value.toFixed(0)}</p>
                    <div className="mt-2.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(cat.value / totalExpenses) * 100}%`, background: COLORS[i % COLORS.length] }}
                      />
                    </div>
                    <p className="text-gray-400 text-xs mt-1">{((cat.value / totalExpenses) * 100).toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
