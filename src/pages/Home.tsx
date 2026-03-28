import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, ShieldCheck, Zap, BarChart3,
  MessageSquare, ScanLine, Wallet, ArrowRight, Sparkles, Brain
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: 'Smart Categorization',
      description: 'ML-powered expense classification from your descriptions',
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      icon: TrendingUp,
      title: 'Predictive Budgeting',
      description: 'Forecasts next month\'s spending from your patterns',
      color: 'bg-emerald-50 text-emerald-600',
      iconBg: 'bg-emerald-100',
    },
    {
      icon: Zap,
      title: 'Smart Alerts',
      description: 'Warnings when you approach or exceed budget limits',
      color: 'bg-amber-50 text-amber-600',
      iconBg: 'bg-amber-100',
    },
    {
      icon: ShieldCheck,
      title: 'Anomaly Detection',
      description: 'Flags unusual spending to protect your finances',
      color: 'bg-purple-50 text-purple-600',
      iconBg: 'bg-purple-100',
    },
  ];

  const stats = [
    { label: 'Avg. Savings Found', value: '₹3,200', sub: 'per user / month' },
    { label: 'Prediction Accuracy', value: '94%', sub: 'expense forecasting' },
    { label: 'Categories', value: '8+', sub: 'auto-detected' },
  ];

  const quickActions = [
    { icon: ScanLine, label: 'Add Expense', path: '/scan', color: 'bg-[#444CE7]', textColor: 'text-white' },
    { icon: BarChart3, label: 'Analytics', path: '/analysis', color: 'bg-emerald-500', textColor: 'text-white' },
    { icon: MessageSquare, label: 'AI Advisor', path: '/chatbot', color: 'bg-purple-500', textColor: 'text-white' },
    { icon: Wallet, label: 'Savings', path: '/savings', color: 'bg-amber-500', textColor: 'text-white' },
  ];

  return (
    <div className="page-enter">
      {/* ── Hero Section ─────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#EEF0FF] via-white to-[#F0FDF4] opacity-80" />
        
        <div className="relative max-w-6xl mx-auto px-5 sm:px-6 pt-10 pb-12 sm:pt-16 sm:pb-16">
          <div className="text-center max-w-2xl mx-auto">
            <div className="badge badge-brand mb-5 inline-flex">
              <Sparkles size={12} />
              AI-Powered Finance
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4 tracking-tight">
              Your money,
              <br />
              <span className="text-[#444CE7]">understood.</span>
            </h1>

            <p className="text-gray-500 text-base sm:text-lg mb-8 leading-relaxed max-w-lg mx-auto">
              Auto-categorize expenses, predict spending, detect anomalies, and get personalized financial advice — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/scan')}
                className="btn-primary text-base px-8 py-3.5"
              >
                <ScanLine size={18} />
                Add Expense
                <ArrowRight size={15} />
              </button>
              <button
                onClick={() => navigate('/chatbot')}
                className="btn-secondary text-base px-8 py-3.5"
              >
                <MessageSquare size={18} />
                Ask AI Advisor
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Row ────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 -mt-2">
        <div className="grid grid-cols-3 gap-3 sm:gap-5">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="card p-4 sm:p-6 text-center animate-slide-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <p className="text-xl sm:text-3xl font-bold text-[#444CE7] mb-0.5">{stat.value}</p>
              <p className="text-gray-900 font-medium text-xs sm:text-sm">{stat.label}</p>
              <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 mt-8 sm:mt-12">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-5">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="card p-5 animate-slide-up group"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className={`w-11 h-11 rounded-xl ${f.iconBg} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                  <Icon size={20} className={f.color.split(' ')[1]} />
                </div>
                <h3 className="text-gray-900 font-semibold text-sm mb-1.5">{f.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Quick Actions ────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 mt-8 sm:mt-12 mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-5">Quick actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`${item.color} ${item.textColor} rounded-2xl p-5 sm:p-6 flex flex-col items-center gap-3 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]`}
              >
                <Icon size={24} strokeWidth={1.8} />
                <span className="text-sm font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
