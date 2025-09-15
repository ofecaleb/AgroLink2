import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SuperAdminDashboard from './SuperAdminDashboard';
import { TrendingUp, Users, MapPin, Calendar, DollarSign, Activity } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  // If user is super admin, show super admin dashboard
  if (user?.role === 'super_admin') {
    return <SuperAdminDashboard />;
  }

  // Fetch user's tontines
  const { data: tontines = [], isLoading: tontinesLoading } = useQuery({
    queryKey: ['tontines'],
    queryFn: () => ApiService.getTontines(),
    staleTime: 30000,
    refetchInterval: 60000
  });

  // Fetch weather data
  const { data: weather } = useQuery({
    queryKey: ['weather-current', user?.region],
    queryFn: () => ApiService.getCurrentWeather(user?.region),
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000
  });

  // Fetch recent community posts
  const { data: recentPosts = [] } = useQuery({
    queryKey: ['community-posts-recent', user?.region],
    queryFn: () => ApiService.getCommunityPosts(user?.region, 3),
    staleTime: 60000,
    refetchInterval: 120000
  });

  const activeTontine = tontines.find((t: any) => t.status === 'active');
  const totalSavings = tontines.reduce((sum: number, t: any) => sum + (t.total_contributions || 0), 0);
  const totalGroups = tontines.length;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Welcome back, {user?.name?.split(' ')[0] || 'Farmer'}! 👋
            </h2>
            <p className="text-green-100 mb-4">Your farming community is growing strong</p>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{user?.region?.charAt(0).toUpperCase() + user?.region?.slice(1)}, {user?.country}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Member since {new Date(user?.created_at || '').getFullYear()}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-green-100 mb-1">Account Balance</div>
            <div className="text-3xl font-bold">
              {user?.balance?.toLocaleString() || '0'} {user?.currency || 'XAF'}
            </div>
            <Badge variant="secondary" className="mt-2 bg-white/20 text-white border-white/30">
              {user?.plan?.charAt(0).toUpperCase() + user?.plan?.slice(1)} Plan
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {totalGroups}
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400">Tontine Groups</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {totalSavings.toLocaleString()}
            </div>
            <p className="text-sm text-green-600 dark:text-green-400">Total Savings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {weather?.temperature || 28}°
            </div>
            <p className="text-sm text-orange-600 dark:text-orange-400">Temperature</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {recentPosts.length}
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-400">Recent Posts</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Tontine */}
      {activeTontine && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
                <Users className="w-6 h-6 mr-2 text-green-600" />
                Active Tontine: {activeTontine.name}
              </h3>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Active
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Contribution</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {activeTontine.monthly_contribution?.toLocaleString()} {user?.currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Members</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {activeTontine.current_members}/{activeTontine.max_members}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Fund</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {activeTontine.total_contributions?.toLocaleString()} {user?.currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Next Payout</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  Position {activeTontine.current_payout_turn + 1}
                </p>
              </div>
            </div>
            <Button className="w-full md:w-auto bg-green-600 hover:bg-green-700">
              <DollarSign className="w-4 h-4 mr-2" />
              Make Payment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Weather Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
              <i className="fas fa-cloud-sun text-blue-600 mr-2 text-2xl"></i>
              Today's Weather
            </h3>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-800 dark:text-white">
                {weather?.temperature || 28}°C
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {weather?.condition || 'Partly Cloudy'}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-gray-600 dark:text-gray-400">Humidity</div>
              <div className="font-semibold text-gray-800 dark:text-white">
                {weather?.humidity || 65}%
              </div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Wind</div>
              <div className="font-semibold text-gray-800 dark:text-white">
                {weather?.windSpeed || 12} km/h
              </div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">UV Index</div>
              <div className="font-semibold text-gray-800 dark:text-white">
                {weather?.uvIndex || 7}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <Activity className="w-6 h-6 mr-2 text-green-600" />
            Recent Community Activity
          </h3>
          <div className="space-y-4">
            {recentPosts.length > 0 ? (
              recentPosts.map((post: any) => (
                <div key={post.id} className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    {post.user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium text-gray-800 dark:text-white">
                        {post.user?.name || 'Anonymous Farmer'}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {post.region}
                      </Badge>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>{post.likes} likes</span>
                      <span>{post.comments} comments</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Activity className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">No recent activity</p>
                <p className="text-sm">Join the community conversation to see updates here!</p>
                <Button className="mt-4" onClick={() => window.location.href = '/?view=community'}>
                  Visit Community
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/?view=tontine'}>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              Manage Tontines
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {activeTontine ? `Active: ${activeTontine.name}` : 'Join or create a savings group'}
            </p>
            <Button className="w-full">
              {activeTontine ? 'View Details' : 'Get Started'}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/?view=market'}>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              Market Prices
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Check latest crop prices and submit updates
            </p>
            <Button variant="outline" className="w-full">
              View Prices
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Account Status */}
      {!user?.is_verified && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-white"></i>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Account Verification Pending
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Please verify your email address to access all features and ensure account security.
                </p>
              </div>
              <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-800 hover:bg-yellow-100">
                Verify Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}