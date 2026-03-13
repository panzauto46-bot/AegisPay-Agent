import { LayoutDashboard, MessageSquare, Wallet, ArrowRightLeft, ShieldCheck, CalendarClock, Menu, X, Zap, BarChart3, Sparkles, LogOut } from 'lucide-react';
import type { Page } from '../types';
import { cn } from '../utils/cn';

interface MobileNavProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onLogout: () => void;
  isAuthenticated: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

const guestNavItems: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: 'landing', label: 'Landing', icon: Sparkles },
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'chat', label: 'AI Agent', icon: MessageSquare },
  { page: 'wallets', label: 'Wallets', icon: Wallet },
  { page: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
  { page: 'rules', label: 'Rules', icon: ShieldCheck },
  { page: 'recurring', label: 'Recurring', icon: CalendarClock },
  { page: 'status', label: 'Status', icon: BarChart3 },
];

const authenticatedNavItems = guestNavItems.filter((item) => item.page !== 'landing');

export default function MobileNav({
  currentPage,
  onPageChange,
  onLogout,
  isAuthenticated,
  isOpen,
  onToggle,
}: MobileNavProps) {
  const navItems = isAuthenticated ? authenticatedNavItems : guestNavItems;
  const bottomTabPages: Page[] = isAuthenticated
    ? ['dashboard', 'chat', 'wallets', 'recurring', 'status']
    : ['landing', 'dashboard', 'chat', 'recurring', 'status'];
  const bottomTabs = bottomTabPages
    .map((page) => navItems.find((item) => item.page === page))
    .filter((item): item is { page: Page; label: string; icon: React.ElementType } => Boolean(item));

  return (
    <>
      {/* Top Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-cyan-500/10 bg-dark-900/90 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-400 flex items-center justify-center">
            <Zap className="w-4 h-4 text-dark-950" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold gradient-text">AegisPay Agent</span>
        </div>
        <button onClick={onToggle} className="text-slate-400 hover:text-white transition-colors">
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 top-14 z-50 bg-black/60 backdrop-blur-sm" onClick={onToggle}>
          <div className="bg-dark-900 border-r border-cyan-500/10 w-64 h-full p-3 space-y-1" onClick={e => e.stopPropagation()}>
            {navItems.map(({ page, label, icon: Icon }) => (
              <button
                key={page}
                onClick={() => { onPageChange(page); onToggle(); }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  currentPage === page
                    ? 'bg-cyan-500/15 text-cyan-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
            {isAuthenticated && (
              <div className="pt-2 mt-2 border-t border-cyan-500/10">
                <button
                  onClick={() => { onLogout(); onToggle(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-cyan-500/10 bg-dark-900/95 backdrop-blur-xl z-40 px-2 py-1.5 flex items-center justify-around">
        {bottomTabs.map(({ page, label, icon: Icon }) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all min-w-[52px]',
              currentPage === page ? 'text-cyan-400' : 'text-slate-600'
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[9px]">{label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
