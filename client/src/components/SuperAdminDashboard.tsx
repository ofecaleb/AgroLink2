import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { 
  Users, 
  TrendingUp, 
  Settings, 
  Shield, 
  Activity, 
  BarChart3, 
  FileText, 
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Users2,
  Building2,
  MessageSquare,
  ShoppingCart,
  Globe
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { useLanguage } from '../hooks/useLanguage';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { ApiService } from '../lib/api';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    newToday: number;
  };
  tontines: {
    total: number;
    active: number;
    totalContributions: number;
  };
  automation: {
    totalRules: number;
    executionsToday: number;
    successRate: number;
    activeRuleTypes: string[];
  };
}

interface AdminNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  actionRequired: boolean;
  createdAt: string;
}

interface AutomationRule {
  id: number;
  ruleType: string;
  ruleName: string;
  description: string;
  isActive: boolean;
  priority: number;
}

interface SystemMetric {
  id: number;
  metricType: string;
  metricName: string;
  value: string;
  unit: string;
  period: string;
  createdAt: string;
}

interface SupportTicket {
  id: number;
  userId: number;
  subject: string;
  category: string;
  priority: string;
  message: string;
  status: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  // Fetch admin data
  const { data: adminStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => ApiService.getAdminStats(),
    enabled: user?.role === 'super_admin',
  });

  const { data: pendingTontines = [] } = useQuery({
    queryKey: ['admin-pending-tontines'],
    queryFn: () => ApiService.getPendingTontines(),
    enabled: user?.role === 'super_admin',
  });

  const { data: pendingPrices = [] } = useQuery({
    queryKey: ['admin-pending-prices'],
    queryFn: () => ApiService.getPendingPrices(),
    enabled: user?.role === 'super_admin',
  });

  const { data: suspendedUsers = [] } = useQuery({
    queryKey: ['admin-suspended-users'],
    queryFn: () => ApiService.getSuspendedUsers(),
    enabled: user?.role === 'super_admin',
  });

  const { data: flaggedPosts = [] } = useQuery({
    queryKey: ['admin-flagged-posts'],
    queryFn: () => ApiService.getFlaggedPosts(),
    enabled: user?.role === 'super_admin',
  });

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: () => ApiService.getAllSupportTickets(),
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (user?.role !== 'super_admin') {
      toast({
        title: "Access Denied",
        description: "You need super admin privileges to access this dashboard.",
        variant: "destructive"
      });
      return;
    }

    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Use the existing API methods instead of direct fetch calls
      const [statsRes, notificationsRes, rulesRes, metricsRes] = await Promise.all([
        ApiService.getAdminStats().catch(() => null),
        fetch('/api/admin/notifications', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }).then(res => res.ok ? res.json() : null).catch(() => null),
        fetch('/api/admin/automation/rules', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }).then(res => res.ok ? res.json() : null).catch(() => null),
        fetch('/api/admin/metrics?metricType=user_growth&period=daily', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }).then(res => res.ok ? res.json() : null).catch(() => null)
      ]);

      if (statsRes) {
        setStats(statsRes);
      }

      if (notificationsRes) {
        setNotifications(notificationsRes);
      }

      if (rulesRes) {
        setAutomationRules(rulesRes);
      }

      if (metricsRes) {
        setSystemMetrics(metricsRes);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const triggerAutomation = async (ruleType: string, entityType: string, entityId: number) => {
    try {
      const response = await fetch('/api/admin/automation/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          ruleType,
          entityType,
          entityId,
          triggerData: {}
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Automation triggered successfully.",
        });
        loadDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to trigger automation:', error);
      toast({
        title: "Error",
        description: "Failed to trigger automation.",
        variant: "destructive"
      });
    }
  };

  const generateMetrics = async () => {
    try {
      const response = await fetch('/api/admin/metrics/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "System metrics generated successfully.",
        });
        loadDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to generate metrics:', error);
      toast({
        title: "Error",
        description: "Failed to generate metrics.",
        variant: "destructive"
      });
    }
  };

  // Admin actions
  const handleTontineAction = async (tontineId: number, action: 'approve' | 'reject') => {
    try {
      await ApiService.adminAction('tontine', tontineId, action);
      // Refetch data
      window.location.reload();
    } catch (error) {
      console.error('Tontine action failed:', error);
    }
  };

  const handlePriceAction = async (priceId: number, action: 'approve' | 'reject') => {
    try {
      await ApiService.adminAction('price', priceId, action);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prices/pending'] });
      toast({
        title: `Price ${action === 'approve' ? 'approved' : 'rejected'} successfully!`,
      });
    } catch (error) {
      console.error('Price action failed:', error);
      toast({
        title: 'Failed to update price',
        variant: 'destructive',
      });
    }
  };

  const handleUserAction = async (userId: number, action: 'unsuspend' | 'ban') => {
    try {
      await ApiService.adminAction('user', userId, action);
      window.location.reload();
    } catch (error) {
      console.error('User action failed:', error);
    }
  };

  const handlePostAction = async (postId: number, action: 'approve' | 'reject') => {
    try {
      await ApiService.adminAction('post', postId, action);
      window.location.reload();
    } catch (error) {
      console.error('Post action failed:', error);
    }
  };

  if (user?.role !== 'super_admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Super Admin access required
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="gradient-farm rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              👑 Super Admin Dashboard
            </h1>
            <p className="text-green-100">
              Welcome back, {user?.name} - Manage your agricultural platform
            </p>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="bg-white/20 text-white">
              Super Admin
            </Badge>
            <div className="text-sm text-green-100 mt-2">
              System Status: <span className="text-green-300">🟢 Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-farm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {adminStats?.totalUsers || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-farm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Tontines</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {adminStats?.activeTontines || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-farm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {adminStats?.totalRevenue?.toLocaleString() || 0} CFA
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-farm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Actions</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {pendingTontines.length + pendingPrices.length + suspendedUsers.length + flaggedPosts.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tontines">Tontines</TabsTrigger>
          <TabsTrigger value="prices">Prices</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="support">Support Tickets</TabsTrigger>
          <TabsTrigger value="premium">Premium Management</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Tontines */}
            <Card className="card-farm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Pending Tontines</span>
                  <Badge variant="destructive">{pendingTontines.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingTontines.slice(0, 3).map((tontine: any) => (
                    <div key={tontine.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium">{tontine.name}</p>
                        <p className="text-sm text-gray-500">
                          {tontine.monthlyContribution} CFA • {tontine.members?.length || 0} members
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={() => handleTontineAction(tontine.id, 'approve')}>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleTontineAction(tontine.id, 'reject')}>
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pendingTontines.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No pending tontines</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pending Prices */}
            <Card className="card-farm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Pending Market Prices</span>
                  <Badge variant="destructive">{pendingPrices.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingPrices.slice(0, 3).map((price: any) => (
                    <div key={price.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium">{price.crop}</p>
                        <p className="text-sm text-gray-500">
                          {price.price} CFA/kg • {price.region}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={() => handlePriceAction(price.id, 'approve')}>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handlePriceAction(price.id, 'reject')}>
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pendingPrices.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No pending prices</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tontines Tab */}
        <TabsContent value="tontines" className="space-y-4">
          <Card className="card-farm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Tontine Management</span>
                <Badge variant="destructive">{pendingTontines.length} Pending</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingTontines.map((tontine: any) => (
                  <div key={tontine.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{tontine.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Created by: {tontine.leader?.name || 'Unknown'}
                        </p>
                      </div>
                      <Badge variant="outline">Pending Review</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Monthly Contribution</p>
                        <p className="font-semibold">{tontine.monthlyContribution?.toLocaleString()} CFA</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Members</p>
                        <p className="font-semibold">{tontine.members?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Region</p>
                        <p className="font-semibold">{tontine.region}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Created</p>
                        <p className="font-semibold">{new Date(tontine.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={() => handleTontineAction(tontine.id, 'approve')}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Tontine
                      </Button>
                      <Button variant="destructive" onClick={() => handleTontineAction(tontine.id, 'reject')}>
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Tontine
                      </Button>
                    </div>
                  </div>
                ))}
                {pendingTontines.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>No pending tontines to review</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prices Tab */}
        <TabsContent value="prices" className="space-y-4">
          <Card className="card-farm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Pending Market Prices</span>
                <Badge variant="destructive">{pendingPrices.length} Pending</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingPrices.map((price: any) => (
                  <div key={price.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{price.crop}</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Submitted by: {price.submittedBy?.name || 'Unknown'}
                        </p>
                      </div>
                      <Badge variant="outline">Pending Review</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="font-semibold">{price.price?.toLocaleString()} CFA/kg</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Region</p>
                        <p className="font-semibold">{price.region}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Unit</p>
                        <p className="font-semibold">{price.unit}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Submitted</p>
                        <p className="font-semibold">{new Date(price.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={() => handlePriceAction(price.id, 'approve')}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Price
                      </Button>
                      <Button variant="destructive" onClick={() => handlePriceAction(price.id, 'reject')}>
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Price
                      </Button>
                    </div>
                  </div>
                ))}
                {pendingPrices.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>No pending prices to review</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="card-farm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>User Management</span>
                <Badge variant="destructive">{suspendedUsers.length} Suspended</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suspendedUsers.map((user: any) => (
                  <div key={user.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {user.phone} • {user.region}
                        </p>
                      </div>
                      <Badge variant="destructive">Suspended</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Role</p>
                        <p className="font-semibold">{user.role}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Plan</p>
                        <p className="font-semibold">{user.plan}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Balance</p>
                        <p className="font-semibold">{user.balance?.toLocaleString()} CFA</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Joined</p>
                        <p className="font-semibold">{new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={() => handleUserAction(user.id, 'unsuspend')}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Unsuspend User
                      </Button>
                      <Button variant="destructive" onClick={() => handleUserAction(user.id, 'ban')}>
                        <XCircle className="w-4 h-4 mr-2" />
                        Ban User
                      </Button>
                    </div>
                  </div>
                ))}
                {suspendedUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>No suspended users</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Community Tab */}
        <TabsContent value="community" className="space-y-4">
          <Card className="card-farm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Community Moderation</span>
                <Badge variant="destructive">{flaggedPosts.length} Flagged</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flaggedPosts.map((post: any) => (
                  <div key={post.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">Post by {post.user?.name || 'Unknown'}</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {post.user?.region} • {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="destructive">Flagged</Badge>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                      <p className="text-gray-800 dark:text-gray-200">{post.content}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={() => handlePostAction(post.id, 'approve')}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Post
                      </Button>
                      <Button variant="destructive" onClick={() => handlePostAction(post.id, 'reject')}>
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Post
                      </Button>
                    </div>
                  </div>
                ))}
                {flaggedPosts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>No flagged posts to review</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-farm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Platform Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {adminStats?.totalUsers || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {adminStats?.activeTontines || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Active Tontines</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {adminStats?.totalRevenue?.toLocaleString() || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Revenue (CFA)</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {adminStats?.premiumUsers || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Premium Users</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-farm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>System Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Database</span>
                    </div>
                    <Badge variant="secondary">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>API Services</span>
                    </div>
                    <Badge variant="secondary">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Automation</span>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Storage</span>
                    </div>
                    <Badge variant="secondary">75% Used</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Support Tickets Tab */}
        <TabsContent value="support" className="space-y-4">
          <Card className="card-farm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Support Tickets</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AdminSupportTickets />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Premium Management Tab */}
        <TabsContent value="premium" className="space-y-4">
          <Card className="card-farm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Premium Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AdminPremiumManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Add AdminSupportTickets component at the end of the file
function AdminSupportTickets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['/api/admin/support/tickets'],
    queryFn: () => ApiService.getAllSupportTickets(),
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchOnWindowFocus: true,
  });
  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SupportTicket> }) => ApiService.updateSupportTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      toast({ title: 'Ticket updated successfully!' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update ticket', description: error.message, variant: 'destructive' });
    },
  });
  if (isLoading) return <div>Loading tickets...</div>;
  if (!tickets.length) return <div>No support tickets found.</div>;
  return (
    <div className="space-y-4">
      {tickets.map(ticket => (
        <Card key={ticket.id} className="mb-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{ticket.subject}</CardTitle>
                <CardDescription>From User #{ticket.userId} • {ticket.category} • {ticket.priority}</CardDescription>
              </div>
              <Badge>{ticket.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <strong>Message:</strong>
              <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 mt-1 mb-2">{ticket.message}</div>
              <strong>Admin Response:</strong>
              <Textarea
                className="w-full mt-1 mb-2"
                value={ticket.adminResponse || ''}
                onChange={e => updateTicketMutation.mutate({ id: ticket.id, data: { adminResponse: e.target.value } })}
                placeholder="Type your response..."
                rows={2}
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={() => updateTicketMutation.mutate({ id: ticket.id, data: { status: 'in_progress' } })}>
                  Mark In Progress
                </Button>
                <Button size="sm" onClick={() => updateTicketMutation.mutate({ id: ticket.id, data: { status: 'resolved' } })}>
                  Mark Resolved
                </Button>
                <Button size="sm" variant="destructive" onClick={() => updateTicketMutation.mutate({ id: ticket.id, data: { status: 'closed' } })}>
                  Close Ticket
                </Button>
              </div>
            </div>
            <div className="text-xs text-gray-500">Created: {new Date(ticket.createdAt).toLocaleString()} | Updated: {new Date(ticket.updatedAt).toLocaleString()}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Add AdminPremiumManagement component at the end of the file
function AdminPremiumManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['admin-premium-plans'],
    queryFn: () => ApiService.getPremiumPlans(),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
  const createPlanMutation = useMutation({
    mutationFn: (data: any) => ApiService.createPremiumPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-premium-plans'] });
      toast({ title: 'Premium plan created!' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create plan', description: error.message, variant: 'destructive' });
    },
  });
  const updatePlanMutation = useMutation({
    mutationFn: ({ key, data }: { key: string; data: any }) => ApiService.updatePremiumPlan(key, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-premium-plans'] });
      toast({ title: 'Premium plan updated!' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update plan', description: error.message, variant: 'destructive' });
    },
  });
  const deactivatePlanMutation = useMutation({
    mutationFn: (key: string) => ApiService.deactivatePremiumPlan(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-premium-plans'] });
      toast({ title: 'Premium plan deactivated.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to deactivate plan', description: error.message, variant: 'destructive' });
    },
  });
  // Form state for new plan
  const [newPlan, setNewPlan] = React.useState({
    name: '', displayName: '', description: '', price: '', currency: 'XAF', duration: 30, features: ''
  });
  if (isLoading) return <div>Loading premium plans...</div>;
  return (
    <div className="space-y-6">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Create New Premium Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Plan Name (e.g. premium)" value={newPlan.name} onChange={e => setNewPlan(p => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Display Name" value={newPlan.displayName} onChange={e => setNewPlan(p => ({ ...p, displayName: e.target.value }))} />
            <Input placeholder="Description" value={newPlan.description} onChange={e => setNewPlan(p => ({ ...p, description: e.target.value }))} />
            <Input placeholder="Price (CFA)" type="number" value={newPlan.price} onChange={e => setNewPlan(p => ({ ...p, price: e.target.value }))} />
            <Input placeholder="Currency" value={newPlan.currency} onChange={e => setNewPlan(p => ({ ...p, currency: e.target.value }))} />
            <Input placeholder="Duration (days)" type="number" value={newPlan.duration} onChange={e => setNewPlan(p => ({ ...p, duration: Number(e.target.value) }))} />
            <Input placeholder="Features (comma separated)" value={newPlan.features} onChange={e => setNewPlan(p => ({ ...p, features: e.target.value }))} />
          </div>
          <Button className="mt-2" onClick={() => createPlanMutation.mutate({ ...newPlan, features: newPlan.features.split(',').map(f => f.trim()) })} disabled={createPlanMutation.isPending}>
            {createPlanMutation.isPending ? 'Creating...' : 'Create Plan'}
          </Button>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {plans.map((plan: any) => (
          <Card key={plan.settingKey} className="mb-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{plan.settingValue.displayName}</CardTitle>
                <Badge>{plan.settingValue.price} {plan.settingValue.currency} / {plan.settingValue.duration}d</Badge>
              </div>
              <CardDescription>{plan.settingValue.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <strong>Features:</strong> {Array.isArray(plan.settingValue.features) ? plan.settingValue.features.join(', ') : plan.settingValue.features}
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={() => updatePlanMutation.mutate({ key: plan.settingKey, data: { ...plan.settingValue, price: plan.settingValue.price + 1000 } })}>
                  Increase Price by 1000
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deactivatePlanMutation.mutate(plan.settingKey)}>
                  Deactivate Plan
                </Button>
              </div>
              <div className="text-xs text-gray-500 mt-2">Last updated: {new Date(plan.updatedAt).toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Missing icon component
const RefreshCw = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
); 