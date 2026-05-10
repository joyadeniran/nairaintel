import { Bell, Mail, LogOut, Sun, Moon } from 'lucide-react';

interface NavigationProps {
  user: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  logout: () => void;
  setShowProfileModal: (show: boolean) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  user, 
  activeTab, 
  setActiveTab, 
  logout, 
  setShowProfileModal 
}) => {
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <nav className="sticky top-6 z-50 mx-auto max-w-7xl px-4 pointer-events-none">
      <div className="premium-card !rounded-full px-6 py-3 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('portfolio')}>
          <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center text-white font-display font-bold text-xl shadow-lg shadow-brand-green/30 group-hover:scale-110 transition-transform duration-300">
            N
          </div>
          <h1 className="text-xl font-display font-bold text-slate-800 dark:text-white tracking-tight hidden sm:block">
            naira<span className="text-brand-green">intel</span>
          </h1>
        </div>
        
        <div className="hidden md:flex items-center gap-2 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-full">
          {[
            { id: 'portfolio', label: 'Portfolio' },
            { id: 'news', label: 'Market' },
            { id: 'forum', label: 'Community' },
            { id: 'learn', label: 'Learn' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)} 
              className={`px-6 py-2 rounded-full font-display font-bold text-sm transition-all duration-500 relative ${
                activeTab === tab.id 
                  ? 'bg-brand-green text-white shadow-lg shadow-brand-green/25' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
  
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleDarkMode}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-brand-green transition-colors"
          >
            <Sun className="hidden dark:block" size={20} />
            <Moon className="block dark:hidden" size={20} />
          </button>
          <button className="p-2 text-slate-500 dark:text-slate-400 hover:text-brand-green transition-colors"><Bell size={20} /></button>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p 
                onClick={() => setShowProfileModal(true)}
                className="text-xs font-display font-bold text-slate-800 dark:text-white cursor-pointer hover:text-brand-green transition-colors leading-none"
              >
                {user.displayName || user.email?.split('@')[0]}
              </p>
              <button onClick={logout} className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 ml-auto mt-1">
                Logout
              </button>
            </div>
            <div 
              onClick={() => setShowProfileModal(true)}
              className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm cursor-pointer hover:scale-105 transition-transform"
            >
              <img src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} alt="Profile" referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
