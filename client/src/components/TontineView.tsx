import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../lib/api';
import { useToast } from '../hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatDistanceToNow } from 'date-fns';
import type { Tontine, TontinePayment, TontineMember } from '../types';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

// Enhanced schemas for advanced features
const createTontineSchema = z.object({
  name: z.string().min(3, 'Tontine name must be at least 3 characters'),
  monthlyContribution: z.number().min(1000, 'Minimum contribution is 1000 XAF'),
  maxMembers: z.number().min(5).max(50, 'Group size must be between 5-50 members'),
  payoutSchedule: z.enum(['monthly', 'quarterly', 'bi-annual']),
  description: z.string().optional(),
  rules: z.string().optional()
});

const joinTontineSchema = z.object({
  inviteCode: z.string().min(6, 'Please enter a valid invite code')
});

const paymentSchema = z.object({
  amount: z.number().min(1000, 'Minimum payment is 1000 XAF'),
  paymentMethod: z.enum(['mobile_money', 'bank_transfer', 'cash', 'crypto']),
  reference: z.string().optional()
});

export default function TontineView() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTontine, setSelectedTontine] = useState<Tontine | null>(null);
  const [activeTab, setActiveTab] = useState('tontines');
  const [showLeaderDashboard, setShowLeaderDashboard] = useState(false);

  // Fetch user's tontines
  const { data: tontines = [], isLoading: tontinesLoading } = useQuery({
    queryKey: ['tontines'],
    queryFn: ApiService.getTontines,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000
  });

  // Fetch tontine payments/history
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['tontine-payments', selectedTontine?.id],
    queryFn: () => selectedTontine ? ApiService.getTontinePayments(selectedTontine.id) : Promise.resolve([]),
    enabled: !!selectedTontine
  });

  // Create tontine form
  const createForm = useForm({
    resolver: zodResolver(createTontineSchema),
    defaultValues: {
      name: '',
      monthlyContribution: 5000,
      maxMembers: 10,
      payoutSchedule: 'monthly',
      description: '',
      rules: ''
    }
  });

  // Join tontine form  
  const joinForm = useForm({
    resolver: zodResolver(joinTontineSchema),
    defaultValues: {
      inviteCode: ''
    }
  });

  // Payment form
  const paymentForm = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: 'mobile_money',
      reference: ''
    }
  });

  // Create tontine mutation
  const createTontineMutation = useMutation({
    mutationFn: ApiService.createTontine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tontines'] });
      setShowCreateModal(false);
      createForm.reset();
      toast({
        title: 'Tontine Created!',
        description: 'Your tontine group has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create tontine',
        variant: 'destructive',
      });
    }
  });

  // Join tontine mutation
  const joinTontineMutation = useMutation({
    mutationFn: ApiService.joinTontineByCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tontines'] });
      setShowJoinModal(false);
      joinForm.reset();
      toast({
        title: 'Joined Successfully!',
        description: 'Welcome to the tontine group!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Join Failed',
        description: error.message || 'Failed to join tontine',
        variant: 'destructive',
      });
    }
  });

  // Create payment mutation
  const paymentMutation = useMutation({
    mutationFn: ({ tontineId, data }: { tontineId: number; data: any }) => 
      ApiService.createTontinePayment(tontineId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tontine-payments'] });
      queryClient.invalidateQueries({ queryKey: ['tontines'] });
      setShowPaymentModal(false);
      paymentForm.reset();
      toast({
        title: 'Payment Successful!',
        description: 'Your contribution has been recorded.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Payment Failed',
        description: error.message || 'Failed to process payment',
        variant: 'destructive',
      });
    }
  });

  // Create invite mutation
  const createInviteMutation = useMutation({
    mutationFn: ({ tontineId, data }: { tontineId: number, data: { maxUses?: number; expiresAt?: string } }) => 
      ApiService.createTontineInvite(tontineId, data),
    onSuccess: (invite) => {
      toast({
        title: 'Invite Created!',
        description: `Share this code: ${invite.inviteCode}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Invite Failed',
        description: error.message || 'Failed to create invite',
        variant: 'destructive',
      });
    }
  });

  // User search mutation
  const searchUsersMutation = useMutation({
    mutationFn: ApiService.searchUsers,
    onError: (error) => {
      toast({
        title: 'Search Failed',
        description: error.message || 'Failed to search users',
        variant: 'destructive',
      });
    }
  });

  // Direct invite mutation
  const directInviteMutation = useMutation({
    mutationFn: ({ tontineId, userId }: { tontineId: number; userId: number }) => 
      ApiService.inviteUserToTontine(tontineId, userId),
    onSuccess: () => {
      toast({
        title: 'User Invited!',
        description: 'The user has been invited to join the tontine.',
      });
      setShowInviteModal(false);
    },
    onError: (error) => {
      toast({
        title: 'Invite Failed',
        description: error.message || 'Failed to invite user',
        variant: 'destructive',
      });
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [inviteCode, setInviteCode] = useState('');

  const handleCreateTontine = (data: any) => {
    createTontineMutation.mutate(data);
  };

  const handleJoinTontine = (data: { inviteCode: string }) => {
    joinTontineMutation.mutate(data.inviteCode);
  };

  const handleMakePayment = (data: any) => {
    if (!selectedTontine) return;
    paymentMutation.mutate({ tontineId: selectedTontine.id, data });
  };

  const handleCreateInvite = async (tontine: Tontine) => {
    try {
      const invite = await ApiService.createTontineInvite(tontine.id, {
        maxUses: 10,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      });
      setInviteCode(invite.inviteCode);
      setSelectedTontine(tontine);
      setShowInviteModal(true);
    } catch (error: any) {
      toast({
        title: 'Invite Failed',
        description: error.message || 'Failed to create invite',
        variant: 'destructive',
      });
    }
  };

  const handleSearchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const results = await ApiService.searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleDirectInvite = (userId: number) => {
    if (!selectedTontine) return;
    directInviteMutation.mutate({ tontineId: selectedTontine.id, userId });
  };

  // Calculate advanced metrics
  const calculateTontineMetrics = (tontine: Tontine) => {
    const memberCount = tontine.members?.length || 1;
    const totalFund = memberCount * tontine.monthlyContribution;
    const isLeader = tontine.leaderId === user?.id;
    const nextPayoutDate = new Date();
    nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1);
    
    // Calculate completion percentage
    const completedPayments = payments.filter(p => p.status === 'completed').length;
    const completionPercentage = (completedPayments / memberCount) * 100;
    
    return {
      memberCount,
      totalFund,
      isLeader,
      nextPayoutDate,
      completionPercentage,
      completedPayments
    };
  };

  if (tontinesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header with Analytics */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Tontine Groups
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your savings groups and track contributions
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex space-x-4 mt-4 lg:mt-0">
            <div className="text-center">
              <div className="text-2xl font-bold text-farm-green">{tontines.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Groups</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-harvest-orange">
                {tontines.reduce((sum, t) => sum + (t.members?.length || 1), 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {tontines.reduce((sum, t) => sum + (t.members?.length || 1) * t.monthlyContribution, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Fund (XAF)</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <i className="fas fa-users mr-2"></i>
                Join Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Tontine Group</DialogTitle>
                <DialogDescription>
                  Enter the invite code provided by the tontine leader to join their group.
                </DialogDescription>
              </DialogHeader>
              <Form {...joinForm}>
                <form onSubmit={joinForm.handleSubmit(handleJoinTontine)} className="space-y-4">
                  <FormField
                    control={joinForm.control}
                    name="inviteCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invite Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter 6-digit invite code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={joinTontineMutation.isPending}
                  >
                    {joinTontineMutation.isPending ? 'Joining...' : 'Join Tontine'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <i className="fas fa-plus mr-2"></i>
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Tontine</DialogTitle>
                <DialogDescription>
                  Create a new tontine group and invite others to join. You'll be the group leader.
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(handleCreateTontine)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tontine Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Farmers Savings Group" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                
                  <FormField
                    control={createForm.control}
                    name="monthlyContribution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Contribution (XAF)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="5000"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="maxMembers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Members</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="10"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="payoutSchedule"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payout Schedule</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payout schedule" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="bi-annual">Bi-Annual</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description of the tontine" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="rules"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rules (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Group rules and guidelines" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createTontineMutation.isPending}
                  >
                    {createTontineMutation.isPending ? 'Creating...' : 'Create Tontine'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tontines">My Groups</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="tontines" className="space-y-6">
            {tontines.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <i className="fas fa-users text-gray-400 text-4xl mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Tontine Groups Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Create your first tontine group or join an existing one to start saving together.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => setShowCreateModal(true)}>
                      Create Group
                    </Button>
                    <Button variant="outline" onClick={() => setShowJoinModal(true)}>
                      Join Group
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tontines.map((tontine: Tontine) => {
                  const metrics = calculateTontineMetrics(tontine);
                  
                  return (
                    <Card key={tontine.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{tontine.name}</CardTitle>
                          <Badge variant={tontine.status === 'active' ? 'default' : 'secondary'}>
                            {tontine.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {tontine.description || 'No description available'}
                        </p>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Completion</span>
                            <span>{metrics.completionPercentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={metrics.completionPercentage} className="h-2" />
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Members</p>
                            <p className="font-semibold">{metrics.memberCount}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Monthly</p>
                            <p className="font-semibold">{tontine.monthlyContribution.toLocaleString()} XAF</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Total Fund</p>
                            <p className="font-semibold">{metrics.totalFund.toLocaleString()} XAF</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Next Payout</p>
                            <p className="font-semibold">Position {tontine.currentPayoutTurn + 1}</p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              setSelectedTontine(tontine);
                              paymentForm.setValue('amount', tontine.monthlyContribution);
                              setShowPaymentModal(true);
                            }}
                            disabled={metrics.completionPercentage >= 100}
                          >
                            <i className="fas fa-credit-card mr-1"></i>
                            Pay
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCreateInvite(tontine)}
                            disabled={createInviteMutation.isPending}
                          >
                            <i className="fas fa-share mr-1"></i>
                            Invite
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedTontine(tontine);
                              setShowDetailsModal(true);
                            }}
                          >
                            <i className="fas fa-eye mr-1"></i>
                            Details
                          </Button>
                        </div>

                        {metrics.isLeader && (
                          <Alert>
                            <i className="fas fa-crown h-4 w-4"></i>
                            <AlertDescription>
                              You are the group leader
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {/* Enhanced Transaction History */}
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-receipt text-gray-400 text-3xl mb-4"></i>
                    <p className="text-gray-600 dark:text-gray-400">No payment history yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.map((payment: TontinePayment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${
                            payment.status === 'completed' ? 'bg-green-500' : 
                            payment.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <div>
                            <p className="font-medium">{payment.amount.toLocaleString()} XAF</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {payment.paymentMethod} • {new Date(payment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                          {payment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Enhanced Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-chart-line mr-2 text-farm-green"></i>
                    Total Savings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-farm-green">
                    {tontines.reduce((sum, t) => sum + (t.members?.length || 1) * t.monthlyContribution, 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">XAF</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-users mr-2 text-harvest-orange"></i>
                    Active Groups
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-harvest-orange">
                    {tontines.filter(t => t.status === 'active').length}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Groups</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-percentage mr-2 text-blue-600"></i>
                    Avg. Completion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {tontines.length > 0 ? 
                      (tontines.reduce((sum, t) => {
                        const metrics = calculateTontineMetrics(t);
                        return sum + metrics.completionPercentage;
                      }, 0) / tontines.length).toFixed(1) : '0'}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Rate</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Enhanced Payment Modal */}
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Make Payment</DialogTitle>
              <DialogDescription>
                Pay your monthly contribution to the tontine group.
              </DialogDescription>
            </DialogHeader>
            {selectedTontine && (
              <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit(handleMakePayment)} className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tontine: {selectedTontine.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Monthly Contribution: {selectedTontine.monthlyContribution.toLocaleString()} XAF
                    </p>
                  </div>
                  
                  <FormField
                    control={paymentForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (XAF)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="5000"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={paymentForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mobile_money">Mobile Money</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="crypto">Cryptocurrency</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={paymentForm.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Transaction reference" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={paymentMutation.isPending}
                  >
                    {paymentMutation.isPending ? 'Processing...' : 'Make Payment'}
                  </Button>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>

        {/* Enhanced Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Group Details</DialogTitle>
              <DialogDescription>
                View detailed information about the tontine group and its members.
              </DialogDescription>
            </DialogHeader>
            {selectedTontine && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Group Information</h4>
                    <p><strong>Name:</strong> {selectedTontine.name}</p>
                    <p><strong>Status:</strong> {selectedTontine.status}</p>
                    <p><strong>Monthly Contribution:</strong> {selectedTontine.monthlyContribution.toLocaleString()} XAF</p>
                    <p><strong>Payout Schedule:</strong> {selectedTontine.payoutSchedule || 'Monthly'}</p>
                    <p><strong>Created:</strong> {new Date(selectedTontine.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Statistics</h4>
                    <p><strong>Members:</strong> {selectedTontine.members?.length || 1}</p>
                    <p><strong>Total Fund:</strong> {(selectedTontine.members?.length || 1) * selectedTontine.monthlyContribution} XAF</p>
                    <p><strong>Next Payout:</strong> Position {selectedTontine.currentPayoutTurn + 1}</p>
                  </div>
                </div>

                {selectedTontine.members && selectedTontine.members.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Members</h4>
                    <div className="space-y-2">
                      {selectedTontine.members.map((member: TontineMember, index: number) => (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-farm-green rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{member.user?.name || 'Unknown'}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {member.user?.phone || 'No phone'}
                              </p>
                            </div>
                          </div>
                          <Badge variant={member.userId === selectedTontine.leaderId ? 'default' : 'secondary'}>
                            {member.userId === selectedTontine.leaderId ? 'Leader' : 'Member'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Members</DialogTitle>
            <DialogDescription>
              Share the invite code or search for users to invite directly.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Invite Code Section */}
            <div className="space-y-3">
              <Label>Invite Code</Label>
              <div className="flex space-x-2">
                <Input 
                  value={inviteCode} 
                  readOnly 
                  className="font-mono text-center"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteCode);
                    toast({
                      title: 'Copied!',
                      description: 'Invite code copied to clipboard',
                    });
                  }}
                >
                  <i className="fas fa-copy"></i>
                </Button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Share this code with people you want to invite to the tontine.
              </p>
            </div>

            <Separator />

            {/* User Search Section */}
            <div className="space-y-3">
              <Label>Search Users</Label>
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearchUsers(e.target.value);
                }}
              />
              
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.phone}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleDirectInvite(user.id)}
                        disabled={directInviteMutation.isPending}
                      >
                        {directInviteMutation.isPending ? 'Inviting...' : 'Invite'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}