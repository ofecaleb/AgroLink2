import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { WeatherData, WeatherAlert } from '../types';

export default function WeatherView() {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Fetch current weather
  const { data: weather, isLoading: weatherLoading } = useQuery({
    queryKey: ['/api/weather/current', user?.region],
    queryFn: () => ApiService.getCurrentWeather(user?.region),
  });

  // Fetch weather alerts
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/weather/alerts', user?.region],
    queryFn: () => ApiService.getWeatherAlerts(user?.region),
  });

  // Mock forecast data (in real app, this would come from API)
  const forecastData = [
    {
      day: 'Today',
      condition: 'Sunny',
      icon: 'fas fa-sun text-yellow-500',
      high: 32,
      low: 22,
      rain: 0
    },
    {
      day: 'Tomorrow',
      condition: 'Light Rain',
      icon: 'fas fa-cloud-rain text-blue-500',
      high: 28,
      low: 20,
      rain: 75
    },
    {
      day: 'Wednesday',
      condition: 'Cloudy',
      icon: 'fas fa-cloud text-gray-500',
      high: 26,
      low: 19,
      rain: 10
    },
    {
      day: 'Thursday',
      condition: 'Partly Cloudy',
      icon: 'fas fa-cloud-sun text-yellow-400',
      high: 30,
      low: 21,
      rain: 5
    },
    {
      day: 'Friday',
      condition: 'Sunny',
      icon: 'fas fa-sun text-yellow-500',
      high: 33,
      low: 23,
      rain: 0
    }
  ];

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 dark:bg-red-900/20 border-red-400 text-red-800 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 text-yellow-800 dark:text-yellow-200';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-800 dark:text-blue-200';
    }
  };

  const getAlertIcon = (alertType: string) => {
    const icons: Record<string, string> = {
      'rain': 'fas fa-cloud-rain',
      'temperature': 'fas fa-thermometer-half',
      'humidity': 'fas fa-tint',
      'wind': 'fas fa-wind'
    };
    return icons[alertType] || 'fas fa-exclamation-triangle';
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Current Weather */}
      <Card className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                <i className="fas fa-cloud-sun mr-2"></i>
                {t('currentWeatherLocation', { location: user?.region?.charAt(0).toUpperCase() + user?.region?.slice(1) || 'Bamenda' })}
              </h2>
              <p className="text-blue-100">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              {weatherLoading ? (
                <Skeleton className="h-12 w-20 bg-white/20" />
              ) : (
                <>
                  <div className="text-4xl font-bold">{weather?.temperature || 28}°C</div>
                  <div className="text-blue-100">{weather?.condition || 'Partly Cloudy'}</div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weather Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="card-farm text-center">
          <CardContent className="p-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2">
              <i className="fas fa-tint text-blue-600 dark:text-blue-400"></i>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Humidity</div>
            <div className="text-lg font-bold text-gray-800 dark:text-white">
              {weather?.humidity || 65}%
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-farm text-center">
          <CardContent className="p-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-2">
              <i className="fas fa-wind text-green-600 dark:text-green-400"></i>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Wind</div>
            <div className="text-lg font-bold text-gray-800 dark:text-white">
              {weather?.windSpeed || 12} km/h
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-farm text-center">
          <CardContent className="p-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-2">
              <i className="fas fa-eye text-purple-600 dark:text-purple-400"></i>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Visibility</div>
            <div className="text-lg font-bold text-gray-800 dark:text-white">
              {weather?.visibility || 10} km
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-farm text-center">
          <CardContent className="p-4">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-2">
              <i className="fas fa-thermometer-half text-yellow-600 dark:text-yellow-400"></i>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Feels Like</div>
            <div className="text-lg font-bold text-gray-800 dark:text-white">
              {weather?.feelsLike || 32}°C
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5-Day Forecast */}
      <Card className="card-farm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-calendar-week text-farm-green mr-2"></i>
            {t('forecastTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {forecastData.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <i className={day.icon}></i>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-white">{day.day}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{day.condition}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-800 dark:text-white">{day.high}°/{day.low}°</div>
                  <div className={`text-sm ${day.rain > 50 ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>
                    {day.rain}% rain
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Farming Alerts */}
      <Card className="card-farm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-exclamation-triangle text-harvest-orange mr-2"></i>
            {t('farmingAlertsTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <i className="fas fa-check-circle text-4xl mb-4 opacity-30"></i>
              <p>No active alerts for your region</p>
              <p className="text-sm">Weather conditions are normal</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert: WeatherAlert) => (
                <div 
                  key={alert.id} 
                  className={`flex items-start space-x-3 p-4 border-l-4 rounded-r-lg ${getAlertColor(alert.severity)}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    alert.severity === 'high' ? 'bg-red-400' : 
                    alert.severity === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                  }`}>
                    <i className={`${getAlertIcon(alert.alertType)} text-white text-xs`}></i>
                  </div>
                  <div>
                    <div className="font-medium capitalize">{alert.alertType} Alert</div>
                    <div className="text-sm">{alert.message}</div>
                    <div className="text-xs mt-1">
                      {new Date(alert.createdAt).toLocaleDateString()} • Severity: {alert.severity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
