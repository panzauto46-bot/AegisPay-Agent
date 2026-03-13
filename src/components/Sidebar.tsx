import { LayoutDashboard, MessageSquare, Wallet, ArrowRightLeft, ShieldCheck, CalendarClock, ChevronLeft, ChevronRight, Zap, BarChart3, Sparkles, LogOut } from 'lucide-react';
import type { Page } from '../types';
import { cn } from '../utils/cn';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onLogout: () => void;
  collapsed: boolean;
  onToggle: () => void;
  unreadMessages: number;
}

const navItems: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: 'landing', label: 'Landing', icon: Sparkles },
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'chat', label: 'AI Agent', icon: MessageSquare },
  { page: 'wallets', label: 'Wallets', icon: Wallet },
  { page: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
  { page: 'rules', label: 'Spending Rules', icon: ShieldCheck },
  { page: 'recurring', label: 'Recurring', icon: CalendarClock },
  { page: 'status', label: 'Project Status', icon: BarChart3 },
];

export default function Sidebar({ currentPage, onPageChange, onLogout, collapsed, onToggle, unreadMessages }: SidebarProps) {
  return (
    <aside className={cn(
      'h-screen flex flex-col border-r border-cyan-500/10 bg-dark-900/80 backdrop-blur-xl transition-all duration-300 relative z-50',
      collapsed ? 'w-[72px]' : 'w-[260px]'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-cyan-500/10 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-400 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
          <Zap className="w-5 h-5 text-dark-950" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-bold gradient-text whitespace-nowrap">AegisPay</h1>
            <p className="text-[10px] text-slate-500 whitespace-nowrap">AI Wallet Agent</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ page, label, icon: Icon }) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group',
              currentPage === page
                ? 'bg-gradient-to-r from-cyan-500/15 to-teal-500/10 text-cyan-400 shadow-lg shadow-cyan-500/5'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            )}
          >
            {currentPage === page && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gradient-to-b from-cyan-400 to-teal-400 rounded-full" />
            )}
            <Icon className={cn('w-5 h-5 shrink-0', currentPage === page ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300')} />
            {!collapsed && <span className="whitespace-nowrap">{label}</span>}
            {page === 'chat' && unreadMessages > 0 && (
              <span className={cn(
                'bg-cyan-500 text-dark-950 text-[10px] font-bold rounded-full flex items-center justify-center shrink-0',
                collapsed ? 'w-4 h-4 absolute -top-0.5 -right-0.5' : 'w-5 h-5 ml-auto'
              )}>
                {unreadMessages}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-cyan-500/10 shrink-0">
        <button
          onClick={onLogout}
          className="mb-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors text-sm"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
