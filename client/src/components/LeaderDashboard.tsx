import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { ApiService } from '../lib/api';
import type { Tontine, TontinePayment, TontineMember } from '../types';

interface LeaderDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeaderDashboard({ isOpen, onClose }: LeaderDashboardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTontine, setSelectedTontine] = useState<Tontine | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // Fetch tontines where user is leader
  const { data: leaderTontines = [], isLoading } = useQuery({
    queryKey: ['leader-tontines'],
    queryFn: async () => {
      const allTontines = await ApiService.getTontines();
      return allTontines.filter((t: Tontine) => t.leaderId === user?.id);
    },
    enabled: !!user
  });

  // Fetch payments for selected tontine
  const { data: tontinePayments = [] } = useQuery({
    queryKey: ['tontine-payments', selectedTontine?.id],
    queryFn: () => selectedTontine ? ApiService.getTontinePayments(selectedTontine.id) : Promise.resolve([]),
    enabled: !!selectedTontine
  });

  // Mutations
  const payoutMutation = useMutation({
    mutationFn: async (tontineId: number) => {
      // This would integrate with payment gateways
      toast({
        title: 'Payout Initiated',
        description: 'Processing payout for all members...',
      });
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leader-tontines'] });
      setShowPayoutModal(false);
    }
  });

  const approveMemberMutation = useMutation({
    mutationFn: async ({ tontineId, memberId }: { tontineId: number; memberId: number }) => {
      // Approve member logic
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leader-tontines'] });
      toast({
        title: 'Member Approved',
        description: 'Member has been approved successfully.',
      });
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ tontineId, memberId }: { tontineId: number; memberId: number }) => {
      // Remove member logic
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leader-tontines'] });
      toast({
        title: 'Member Removed',
        description: 'Member has been removed from the group.',
      });
    }
  });

  // Calculate metrics
  const calculateMetrics = (tontine: Tontine) => {
    const memberCount = tontine.members?.length || 1;
    const totalFund = memberCount * tontine.monthlyContribution;
    const completedPayments = tontinePayments.filter((p: TontinePayment) => p.status === 'completed').length;
    const completionPercentage = (completedPayments / memberCount) * 100;
    const pendingPayments = memberCount - completedPayments;
    
    return {
      memberCount,
      totalFund,
      completedPayments,
      pendingPayments,
      completionPercentage
    };
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Leader Dashboard</DialogTitle>
            <DialogDescription>
              Manage your tontine groups and monitor member activities.
            </DialogDescription>
          </DialogHeader>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <i className="fas fa-crown mr-2 text-harvest-orange"></i>
            Leader Dashboard
          </DialogTitle>
          <DialogDescription>
            Manage your tontine groups and monitor member activities.
          </DialogDescription>
        </DialogHeader>

        {leaderTontines.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-crown text-gray-400 text-4xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Groups to Manage
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You need to create a tontine group to access the leader dashboard.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-farm-green">{leaderTontines.length}</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Groups Led</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-harvest-orange">
                    {leaderTontines.reduce((sum, t) => sum + (t.members?.length || 1), 0)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {leaderTontines.reduce((sum, t) => sum + (t.members?.length || 1) * t.monthlyContribution, 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Funds (XAF)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {leaderTontines.filter(t => t.status === 'active').length}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Groups</p>
                </CardContent>
              </Card>
            </div>

            {/* Group Management */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {leaderTontines.map((tontine: Tontine) => {
                  const metrics = calculateMetrics(tontine);
                  
                  return (
                    <Card key={tontine.id} className="border-l-4 border-l-harvest-orange">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center">
                            <i className="fas fa-users mr-2"></i>
                            {tontine.name}
                          </CardTitle>
                          <Badge variant={tontine.status === 'active' ? 'default' : 'secondary'}>
                            {tontine.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Members</p>
                            <p className="font-semibold">{metrics.memberCount}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Fund</p>
                            <p className="font-semibold">{metrics.totalFund.toLocaleString()} XAF</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                            <p className="font-semibold text-green-600">{metrics.completedPayments}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                            <p className="font-semibold text-orange-600">{metrics.pendingPayments}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Payment Completion</span>
                            <span>{metrics.completionPercentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={metrics.completionPercentage} className="h-2" />
                        </div>

                        <Separator />

                        <div className="flex space-x-2">
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedTontine(tontine);
                              setShowMemberModal(true);
                            }}
                          >
                            <i className="fas fa-users mr-1"></i>
                            Manage Members
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedTontine(tontine);
                              setShowPayoutModal(true);
                            }}
                            disabled={metrics.completionPercentage < 100}
                          >
                            <i className="fas fa-money-bill-wave mr-1"></i>
                            Initiate Payout
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedTontine(tontine);
                            }}
                          >
                            <i className="fas fa-chart-bar mr-1"></i>
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>

              <TabsContent value="members" className="space-y-4">
                {selectedTontine ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Members - {selectedTontine.name}</h3>
                      <Button 
                        size="sm"
                        onClick={() => setShowMemberModal(true)}
                      >
                        <i className="fas fa-user-plus mr-1"></i>
                        Add Member
                      </Button>
                    </div>
                    
                    {selectedTontine.members && selectedTontine.members.length > 0 ? (
                      <div className="space-y-3">
                        {selectedTontine.members.map((member: TontineMember) => (
                          <Card key={member.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-farm-green rounded-full flex items-center justify-center text-white font-bold">
                                    {member.user?.name?.charAt(0) || 'U'}
                                  </div>
                                  <div>
                                    <p className="font-medium">{member.user?.name || 'Unknown'}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {member.user?.phone || 'No phone'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant={member.userId === selectedTontine.leaderId ? 'default' : 'secondary'}>
                                    {member.userId === selectedTontine.leaderId ? 'Leader' : 'Member'}
                                  </Badge>
                                  {member.userId !== selectedTontine.leaderId && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => removeMemberMutation.mutate({
                                        tontineId: selectedTontine.id,
                                        memberId: member.id
                                      })}
                                    >
                                      <i className="fas fa-user-times"></i>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <i className="fas fa-users text-gray-400 text-3xl mb-4"></i>
                        <p className="text-gray-600 dark:text-gray-400">No members yet</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-hand-pointer text-gray-400 text-3xl mb-4"></i>
                    <p className="text-gray-600 dark:text-gray-400">Select a group to view members</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payments" className="space-y-4">
                {selectedTontine ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Payment History - {selectedTontine.name}</h3>
                    
                    {tontinePayments.length > 0 ? (
                      <div className="space-y-3">
                        {tontinePayments.map((payment: TontinePayment) => (
                          <Card key={payment.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
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
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <i className="fas fa-receipt text-gray-400 text-3xl mb-4"></i>
                        <p className="text-gray-600 dark:text-gray-400">No payment history yet</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-hand-pointer text-gray-400 text-3xl mb-4"></i>
                    <p className="text-gray-600 dark:text-gray-400">Select a group to view payments</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Payout Modal */}
        <Dialog open={showPayoutModal} onOpenChange={setShowPayoutModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Initiate Payout</DialogTitle>
              <DialogDescription>
                Process payout for all members of {selectedTontine?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <i className="fas fa-info-circle h-4 w-4"></i>
                <AlertDescription>
                  This will distribute the total fund of {(selectedTontine?.members?.length || 1) * (selectedTontine?.monthlyContribution || 0)} XAF 
                  among all members according to the payout schedule.
                </AlertDescription>
              </Alert>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={() => payoutMutation.mutate(selectedTontine?.id || 0)}
                  disabled={payoutMutation.isPending}
                  className="flex-1"
                >
                  {payoutMutation.isPending ? 'Processing...' : 'Confirm Payout'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Member Management Modal */}
        <Dialog open={showMemberModal} onOpenChange={setShowMemberModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Members</DialogTitle>
              <DialogDescription>
                Add, remove, or approve members for {selectedTontine?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Member management features will be implemented here, including:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Add new members by phone number</li>
                <li>• Approve pending member requests</li>
                <li>• Remove inactive members</li>
                <li>• Set member roles and permissions</li>
              </ul>
              <Button 
                variant="outline" 
                onClick={() => setShowMemberModal(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
} 