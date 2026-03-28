import { Link, useLocation } from 'react-router-dom';
import { Home, ScanLine, BarChart3, MessageSquare, Wallet } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/scan', label: 'Add', icon: ScanLine },
  { path: '/analysis', label: 'Analytics', icon: BarChart3 },
  { path: '/chatbot', label: 'Advisor', icon: MessageSquare },
  { path: '/savings', label: 'Savings', icon: Wallet },
];

export default function Navigation() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* ── DESKTOP TOP NAV ─────────────────────── */}
      <nav className="hidden md:block sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#444CE7] flex items-center justify-center shadow-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">FinanceAI</span>
            </Link>

            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      active
                        ? 'bg-[#EEF0FF] text-[#444CE7]'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* ── MOBILE TOP HEADER ──────────────────── */}
      <header className="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center justify-between px-5 h-14">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#444CE7] flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-base font-bold text-gray-900">FinanceAI</span>
          </Link>
          <div className="text-xs text-gray-400 font-medium">
            {navItems.find(i => isActive(i.path))?.label || 'Home'}
          </div>
        </div>
      </header>

      {/* ── MOBILE BOTTOM TAB BAR ──────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-100 safe-bottom">
        <div className="flex items-center justify-around px-2 pt-2 pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const isCenter = item.path === '/scan';

            if (isCenter) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center -mt-5"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 ${
                    active
                      ? 'bg-[#444CE7] shadow-[#444CE7]/30'
                      : 'bg-[#444CE7] shadow-[#444CE7]/20'
                  }`}>
                    <Icon size={20} className="text-white" strokeWidth={2} />
                  </div>
                  <span className={`text-[10px] mt-1 font-medium ${
                    active ? 'text-[#444CE7]' : 'text-gray-400'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-0.5 py-1 min-w-[3.5rem]"
              >
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                  active ? 'bg-[#EEF0FF]' : ''
                }`}>
                  <Icon
                    size={20}
                    className={`transition-colors duration-200 ${
                      active ? 'text-[#444CE7]' : 'text-gray-400'
                    }`}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                </div>
                <span className={`text-[10px] font-medium transition-colors duration-200 ${
                  active ? 'text-[#444CE7]' : 'text-gray-400'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
