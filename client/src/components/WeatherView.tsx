import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import type { WeatherData, WeatherAlert } from '../types';

export default function WeatherView() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('current');

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

  // Extended forecast data with farming insights
  const forecastData = [
    {
      day: 'Today',
      condition: 'Sunny',
      icon: 'fas fa-sun text-yellow-500',
      high: 32,
      low: 22,
      rain: 0,
      humidity: 45,
      wind: 12,
      farmingAdvice: 'Perfect day for harvesting and field work'
    },
    {
      day: 'Tomorrow',
      condition: 'Light Rain',
      icon: 'fas fa-cloud-rain text-blue-500',
      high: 28,
      low: 20,
      rain: 75,
      humidity: 80,
      wind: 8,
      farmingAdvice: 'Good for newly planted crops, avoid heavy machinery'
    },
    {
      day: 'Wednesday',
      condition: 'Cloudy',
      icon: 'fas fa-cloud text-gray-500',
      high: 26,
      low: 19,
      rain: 10,
      humidity: 65,
      wind: 15,
      farmingAdvice: 'Ideal for planting and light cultivation'
    },
    {
      day: 'Thursday',
      condition: 'Heavy Rain',
      icon: 'fas fa-cloud-rain text-blue-600',
      high: 24,
      low: 18,
      rain: 90,
      humidity: 95,
      wind: 20,
      farmingAdvice: 'Stay indoors, protect livestock'
    },
    {
      day: 'Friday',
      condition: 'Partly Cloudy',
      icon: 'fas fa-cloud-sun text-yellow-400',
      high: 29,
      low: 21,
      rain: 30,
      humidity: 55,
      wind: 10,
      farmingAdvice: 'Good for outdoor activities and spraying'
    },
    {
      day: 'Saturday',
      condition: 'Sunny',
      icon: 'fas fa-sun text-yellow-500',
      high: 31,
      low: 23,
      rain: 5,
      humidity: 40,
      wind: 8,
      farmingAdvice: 'Excellent for harvesting and drying crops'
    },
    {
      day: 'Sunday',
      condition: 'Hot',
      icon: 'fas fa-thermometer-full text-red-500',
      high: 35,
      low: 25,
      rain: 0,
      humidity: 35,
      wind: 5,
      farmingAdvice: 'Ensure adequate irrigation, avoid midday work'
    }
  ];

  // Farming recommendations based on current conditions
  const farmingRecommendations = [
    {
      title: 'Irrigation Schedule',
      icon: 'fas fa-tint',
      content: 'Water crops early morning (5-7 AM) to minimize evaporation',
      priority: 'high'
    },
    {
      title: 'Pest Control',
      icon: 'fas fa-bug',
      content: 'Monitor for aphids during humid conditions',
      priority: 'medium'
    },
    {
      title: 'Harvesting',
      icon: 'fas fa-scissors',
      content: 'Optimal harvesting window: Tomorrow 6 AM - 10 AM',
      priority: 'high'
    },
    {
      title: 'Fertilizer Application',
      icon: 'fas fa-seedling',
      content: 'Apply nitrogen fertilizer before expected rain on Thursday',
      priority: 'low'
    }
  ];

  // Soil conditions data
  const soilConditions = {
    moisture: 65,
    temperature: 24,
    ph: 6.8,
    nutrients: {
      nitrogen: 75,
      phosphorus: 60,
      potassium: 80
    }
  };

  const isPremiumUser = user?.plan === 'premium';

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
          {weatherLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-48 bg-white/20" />
              <Skeleton className="h-12 w-32 bg-white/20" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {weather?.location || user?.region?.charAt(0).toUpperCase() + user?.region?.slice(1)}
                </h2>
                <div className="flex items-center space-x-4">
                  <span className="text-4xl font-bold">{weather?.temperature || 28}°C</span>
                  <div>
                    <p className="text-lg">{weather?.condition || 'Partly Cloudy'}</p>
                    <p className="text-sm opacity-90">Feels like {weather?.feelsLike || 31}°C</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <i className="fas fa-cloud-sun text-6xl opacity-80"></i>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weather Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-exclamation-triangle mr-2 text-farm-green"></i>
              Weather Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert: WeatherAlert) => (
              <Alert key={alert.id} className={`border-l-4 ${getAlertColor(alert.severity)}`}>
                <i className={`${getAlertIcon(alert.alertType)} h-4 w-4`}></i>
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>{alert.message}</span>
                    <Badge variant="outline">{alert.severity.toUpperCase()}</Badge>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Weather Details with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="current">Current</TabsTrigger>
          <TabsTrigger value="forecast">7-Day</TabsTrigger>
          <TabsTrigger value="farming">Farming</TabsTrigger>
          <TabsTrigger value="soil">Soil</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <i className="fas fa-tint text-blue-500 text-2xl mb-2"></i>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Humidity</p>
                  <p className="text-lg font-semibold">{weather?.humidity || 68}%</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <i className="fas fa-wind text-green-500 text-2xl mb-2"></i>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Wind</p>
                  <p className="text-lg font-semibold">{weather?.windSpeed || 12} km/h</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <i className="fas fa-eye text-gray-500 text-2xl mb-2"></i>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Visibility</p>
                  <p className="text-lg font-semibold">{weather?.visibility || 10} km</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <i className="fas fa-thermometer-half text-red-500 text-2xl mb-2"></i>
                  <p className="text-sm text-gray-600 dark:text-gray-400">UV Index</p>
                  <p className="text-lg font-semibold">{weather?.uvIndex || 7}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                7-Day Forecast
                {!isPremiumUser && (
                  <Badge variant="outline" className="text-purple-600">
                    <i className="fas fa-crown mr-1"></i>
                    Premium
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {forecastData.slice(0, isPremiumUser ? 7 : 3).map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 text-center">
                        <p className="font-medium">{day.day}</p>
                      </div>
                      <i className={`${day.icon} text-2xl`}></i>
                      <div>
                        <p className="font-medium">{day.condition}</p>
                        {isPremiumUser && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{day.farmingAdvice}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{day.high}° / {day.low}°</p>
                      <p className="text-sm text-blue-600">{day.rain}% rain</p>
                    </div>
                  </div>
                ))}
                {!isPremiumUser && (
                  <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                    <i className="fas fa-crown text-purple-600 text-3xl mb-3"></i>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      Unlock 7-day forecast and farming insights
                    </p>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      Upgrade to Premium
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="farming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Farming Recommendations
                {!isPremiumUser && (
                  <Badge variant="outline" className="text-purple-600">
                    <i className="fas fa-crown mr-1"></i>
                    Premium
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPremiumUser ? (
                <div className="space-y-4">
                  {farmingRecommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <i className={`${rec.icon} text-farm-green text-xl mt-1`}></i>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{rec.title}</h3>
                          <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                            {rec.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">{rec.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8">
                  <i className="fas fa-seedling text-farm-green text-4xl mb-4"></i>
                  <h3 className="text-lg font-medium mb-2">Premium Farming Insights</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Get personalized farming recommendations based on weather conditions
                  </p>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <i className="fas fa-crown mr-2"></i>
                    Upgrade to Premium
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="soil" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Soil Conditions
                {!isPremiumUser && (
                  <Badge variant="outline" className="text-purple-600">
                    <i className="fas fa-crown mr-1"></i>
                    Premium
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPremiumUser ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <i className="fas fa-thermometer-half text-red-500 text-2xl mb-2"></i>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Temperature</p>
                      <p className="text-lg font-semibold">{soilConditions.temperature}°C</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <i className="fas fa-tint text-blue-500 text-2xl mb-2"></i>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Moisture</p>
                      <p className="text-lg font-semibold">{soilConditions.moisture}%</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <i className="fas fa-flask text-green-500 text-2xl mb-2"></i>
                      <p className="text-sm text-gray-600 dark:text-gray-400">pH Level</p>
                      <p className="text-lg font-semibold">{soilConditions.ph}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-4">Nutrient Levels</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Nitrogen (N)</span>
                          <span>{soilConditions.nutrients.nitrogen}%</span>
                        </div>
                        <Progress value={soilConditions.nutrients.nitrogen} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Phosphorus (P)</span>
                          <span>{soilConditions.nutrients.phosphorus}%</span>
                        </div>
                        <Progress value={soilConditions.nutrients.phosphorus} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Potassium (K)</span>
                          <span>{soilConditions.nutrients.potassium}%</span>
                        </div>
                        <Progress value={soilConditions.nutrients.potassium} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <i className="fas fa-chart-line text-farm-green text-4xl mb-4"></i>
                  <h3 className="text-lg font-medium mb-2">Soil Analytics</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Monitor soil conditions and nutrient levels for optimal farming
                  </p>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <i className="fas fa-crown mr-2"></i>
                    Upgrade to Premium
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}