import { useLanguage } from '../hooks/useLanguage';

interface BottomNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function BottomNavigation({ currentView, onViewChange }: BottomNavigationProps) {
  const { t } = useLanguage();

  const navItems = [
    { id: 'dashboard', icon: 'fas fa-home', label: t('dashboard') },
    { id: 'tontine', icon: 'fas fa-money-bill', label: t('tontine') },
    { id: 'market', icon: 'fas fa-chart-line', label: t('prices') },
    { id: 'weather', icon: 'fas fa-cloud-sun', label: t('weather') },
    { id: 'community', icon: 'fas fa-users', label: t('community') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40">
      <div className="flex justify-around py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex flex-col items-center py-2 px-1 transition-colors touch-target ${
              currentView === item.id
                ? 'text-farm-green'
                : 'text-gray-500 hover:text-farm-green'
            }`}
          >
            <i className={`${item.icon} text-xl mb-1`}></i>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
