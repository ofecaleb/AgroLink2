import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../lib/api';
import { Card, CardContent } from '@/components/ui/card';
import SuperAdminDashboard from './SuperAdminDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  // If user is super admin, show super admin dashboard
  if (user?.role === 'super_admin') {
    return <SuperAdminDashboard />;
  }

  // Fetch user's tontines
  const { data: tontines = [] } = useQuery({
    queryKey: ['/api/tontines'],
    queryFn: () => ApiService.getTontines(),
  });

  // Fetch weather data
  const { data: weather } = useQuery({
    queryKey: ['/api/weather/current'],
    queryFn: () => ApiService.getCurrentWeather(user?.region),
  });

  const activeTontine = tontines[0]; // For demo, show first tontine

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Welcome Section */}
      <div className="gradient-farm rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {t('welcomeMessage', { name: user?.name || 'Farmer' })}
            </h2>
            <p className="text-green-100">{t('dashboardSubtitle')}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-green-100">{t('balance')}</div>
            <div className="text-2xl font-bold">
              {user?.balance?.toLocaleString() || '0'} CFA
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="card-farm hover:shadow-xl cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-farm-light rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-money-bill text-white text-xl"></i>
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-white">
              {t('quickTontine')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {activeTontine ? activeTontine.name : 'No active group'}
            </p>
          </CardContent>
        </Card>

        <Card className="card-farm hover:shadow-xl cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-harvest-orange rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-chart-line text-white text-xl"></i>
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-white">
              {t('quickPrices')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Updated 2 hrs ago
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weather Card */}
      <Card className="card-farm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              <i className="fas fa-cloud-sun text-farm-green mr-2"></i>
              {t('weatherTitle')}
            </h3>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {weather?.temperature || 28}°C
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {weather?.condition || 'Sunny'}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-gray-500 dark:text-gray-400">Humidity</div>
              <div className="font-semibold text-gray-800 dark:text-white">
                {weather?.humidity || 65}%
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Wind</div>
              <div className="font-semibold text-gray-800 dark:text-white">
                {weather?.windSpeed || 12} km/h
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Rain</div>
              <div className="font-semibold text-gray-800 dark:text-white">
                Tomorrow
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="card-farm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            <i className="fas fa-history text-farm-green mr-2"></i>
            {t('recentActivityTitle')}
          </h3>
          <div className="space-y-3">
            {activeTontine ? (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-8 h-8 bg-farm-green rounded-full flex items-center justify-center">
                  <i className="fas fa-plus text-white text-xs"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    Joined {activeTontine.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Monthly: {activeTontine.monthlyContribution.toLocaleString()} CFA
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <i className="fas fa-history text-4xl mb-4 opacity-30"></i>
                <p>No recent activity</p>
                <p className="text-sm">Join a tontine to get started!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
