import React from 'react';
import { Bell, Sun, Moon, Briefcase, Newspaper, Users, BookOpen } from 'lucide-react';

interface NavigationProps {
  user: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  logout: () => void;
  setShowProfileModal: (show: boolean) => void;
}

const TABS = [
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'news', label: 'Market', icon: Newspaper },
  { id: 'forum', label: 'Community', icon: Users },
  { id: 'learn', label: 'Learn', icon: BookOpen },
] as const;

export const Navigation: React.FC<NavigationProps> = ({
  user,
  activeTab,
  setActiveTab,
  logout,
  setShowProfileModal
}) => {
  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {
      /* localStorage unavailable (private mode) — theme resets next load */
    }
  };

  return (
    <>
      <nav className="sticky top-0 md:top-6 z-50 mx-auto max-w-7xl px-4 pt-2 md:pt-0 pointer-events-none">
        <div className="premium-card !rounded-2xl md:!rounded-full px-4 md:px-6 py-2.5 md:py-3 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('portfolio')}>
            <div className="w-9 h-9 md:w-10 md:h-10 bg-brand-green rounded-xl flex items-center justify-center text-white font-display font-bold text-lg md:text-xl shadow-lg shadow-brand-green/30 group-hover:scale-110 transition-transform duration-300">
              N
            </div>
            <h1 className="text-lg md:text-xl font-display font-bold text-slate-800 dark:text-white tracking-tight hidden sm:block">
              naira<span className="text-brand-green">intel</span>
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-full">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 rounded-full font-display font-bold text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-brand-green text-white shadow-lg shadow-brand-green/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-brand-green transition-colors"
            >
              <Sun className="hidden dark:block" size={18} />
              <Moon className="block dark:hidden" size={18} />
            </button>
            <button className="hidden sm:block p-2 text-slate-500 dark:text-slate-400 hover:text-brand-green transition-colors"><Bell size={18} /></button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p
                  onClick={() => setShowProfileModal(true)}
                  className="text-xs font-display font-bold text-slate-800 dark:text-white cursor-pointer hover:text-brand-green transition-colors leading-none"
                >
                  {user.displayName || user.email?.split('@')[0]}
                </p>
                <button onClick={logout} className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 ml-auto mt-1">
                  Sign out
                </button>
              </div>
              <div
                onClick={() => setShowProfileModal(true)}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm cursor-pointer hover:scale-105 transition-transform"
              >
                <img src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} alt="Profile" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-brand-green'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] font-display font-bold ${isActive ? 'text-brand-green' : ''}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
