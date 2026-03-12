import { LayoutDashboard, MessageSquare, Wallet, ArrowRightLeft, ShieldCheck, CalendarClock, Menu, X, Zap, BarChart3 } from 'lucide-react';
import type { Page } from '../types';
import { cn } from '../utils/cn';

interface MobileNavProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const navItems: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'chat', label: 'AI Agent', icon: MessageSquare },
  { page: 'wallets', label: 'Wallets', icon: Wallet },
  { page: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
  { page: 'rules', label: 'Rules', icon: ShieldCheck },
  { page: 'recurring', label: 'Recurring', icon: CalendarClock },
  { page: 'status', label: 'Status', icon: BarChart3 },
];

export default function MobileNav({ currentPage, onPageChange, isOpen, onToggle }: MobileNavProps) {
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
          </div>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-cyan-500/10 bg-dark-900/95 backdrop-blur-xl z-40 px-2 py-1.5 flex items-center justify-around">
        {[navItems[0], navItems[1], navItems[4], navItems[5], navItems[6]].map(({ page, label, icon: Icon }) => (
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
