import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Tontine, TontinePayment } from '../types';

export default function TontineView() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'join'>('create');
  const [contributionAmount, setContributionAmount] = useState('');
  const [selectedTontine, setSelectedTontine] = useState<Tontine | null>(null);
  const [joinFormData, setJoinFormData] = useState({
    name: '',
    monthlyContribution: '',
    groupCode: ''
  });

  // Fetch user's tontines
  const { data: tontines = [], isLoading: tontinesLoading } = useQuery({
    queryKey: ['/api/tontines'],
    queryFn: () => ApiService.getTontines(),
  });

  // Fetch detailed tontine data for the first tontine
  const activeTontine = tontines[0];
  const { data: tontineDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['/api/tontines', activeTontine?.id],
    queryFn: () => ApiService.getTontine(activeTontine.id),
    enabled: !!activeTontine?.id,
  });

  // Fetch payments for active tontine
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/tontines', activeTontine?.id, 'payments'],
    queryFn: () => ApiService.getTontinePayments(activeTontine.id),
    enabled: !!activeTontine?.id,
  });

  // Create tontine mutation
  const createTontineMutation = useMutation({
    mutationFn: (data: { name: string; monthlyContribution: number }) => 
      ApiService.createTontine(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tontines'] });
      setShowJoinModal(false);
      setJoinFormData({ name: '', monthlyContribution: '', groupCode: '' });
      toast({
        title: 'Tontine created successfully!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create tontine',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: (data: { amount: number; paymentMethod: string }) => 
      ApiService.createTontinePayment(activeTontine.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tontines'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tontines', activeTontine?.id, 'payments'] });
      setContributionAmount('');
      toast({
        title: t('paymentSuccess'),
      });
    },
    onError: (error) => {
      toast({
        title: 'Payment failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreateTontine = () => {
    if (modalMode === 'create') {
      // Creating a new tontine
      if (!joinFormData.name || !joinFormData.monthlyContribution) {
        toast({
          title: 'Please fill in all fields',
          variant: 'destructive',
        });
        return;
      }

      createTontineMutation.mutate({
        name: joinFormData.name,
        monthlyContribution: parseInt(joinFormData.monthlyContribution)
      });
    } else {
      // Joining an existing tontine
      if (!joinFormData.groupCode) {
        toast({
          title: 'Please enter the group code',
          variant: 'destructive',
        });
        return;
      }

      // For now, show a message that join functionality is coming soon
      toast({
        title: 'Join functionality coming soon',
        description: 'Please create a new tontine for now',
      });
    }
  };

  const handlePayment = (paymentMethod: string) => {
    const amount = parseInt(contributionAmount);
    if (!amount || amount <= 0) {
      toast({
        title: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: t('paymentProcessing'),
    });

    paymentMutation.mutate({ amount, paymentMethod });
  };

  const calculateFee = (amount: number) => Math.round(amount * 0.02);
  const calculateTotal = (amount: number) => amount + calculateFee(amount);

  const currentAmount = parseInt(contributionAmount) || 0;
  const fee = calculateFee(currentAmount);
  const total = calculateTotal(currentAmount);

  if (tontinesLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!activeTontine) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="card-farm text-center py-12">
          <CardContent>
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-users text-gray-400 text-3xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              No Active Tontine
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Join or create a tontine group to start saving with your community.
            </p>
            <div className="flex space-x-3">
              <Button 
                onClick={() => {
                  setModalMode('create');
                  setShowJoinModal(true);
                }}
                className="btn-farm flex-1"
              >
                <i className="fas fa-plus mr-2"></i>
                Create Tontine
              </Button>
              <Button 
                onClick={() => {
                  setModalMode('join');
                  setShowJoinModal(true);
                }}
                variant="outline"
                className="btn-outline-farm flex-1"
              >
                <i className="fas fa-users mr-2"></i>
                Join Existing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const paidMembers = tontineDetails?.members?.filter(m => m.hasPaidCurrentMonth).length || 0;
  const totalMembers = tontineDetails?.members?.length || 0;
  const progressPercentage = totalMembers > 0 ? (paidMembers / totalMembers) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Tontine Status Card */}
      <Card className="card-farm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              <i className="fas fa-users text-farm-green mr-2"></i>
              {activeTontine.name}
            </h2>
            <span className="px-3 py-1 bg-farm-green text-white text-sm font-medium rounded-full">
              {activeTontine.status.charAt(0).toUpperCase() + activeTontine.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('monthlyContribution')}</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {activeTontine.monthlyContribution.toLocaleString()} CFA
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('nextPayout')}</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {activeTontine.nextPayoutDate ? new Date(activeTontine.nextPayoutDate).toLocaleDateString() : '15 days'}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">{t('groupProgress')}</span>
              <span className="text-sm font-medium text-gray-800 dark:text-white">
                {paidMembers}/{totalMembers} members paid
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div 
                className="bg-farm-green h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contribute Section */}
      <Card className="card-farm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-plus-circle text-farm-green mr-2"></i>
            {t('contributeTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="contribution-amount">{t('amountLabel')}</Label>
            <Input
              id="contribution-amount"
              type="number"
              placeholder="5000"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              className="input-farm text-lg"
            />
          </div>

          {/* Fee Breakdown */}
          {currentAmount > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                <i className="fas fa-calculator mr-1"></i>
                {t('feeBreakdownTitle')}
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-yellow-700 dark:text-yellow-300">{t('contribution')}</span>
                  <span className="font-medium">{currentAmount.toLocaleString()} CFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-700 dark:text-yellow-300">{t('platformFee')}</span>
                  <span className="font-medium">{fee.toLocaleString()} CFA</span>
                </div>
                <div className="flex justify-between border-t border-yellow-200 dark:border-yellow-800 pt-1">
                  <span className="text-yellow-800 dark:text-yellow-200 font-semibold">{t('total')}</span>
                  <span className="font-bold">{total.toLocaleString()} CFA</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          <div className="space-y-3">
            <Button 
              onClick={() => handlePayment('momo')}
              disabled={!currentAmount || paymentMutation.isPending}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
            >
              <i className="fas fa-mobile-alt mr-2"></i>
              {t('momoPayText')}
            </Button>
            
            <Button 
              onClick={() => handlePayment('orange_money')}
              disabled={!currentAmount || paymentMutation.isPending}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
            >
              <i className="fas fa-mobile-alt mr-2"></i>
              {t('orangePayText')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Group Members */}
      <Card className="card-farm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-users text-farm-green mr-2"></i>
            {t('groupMembersTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {detailsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {tontineDetails?.members?.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-farm-green rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {member.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-white">
                        {member.user?.name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {member.userId === activeTontine.leaderId ? 'Leader' : 'Member'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`w-3 h-3 rounded-full ${member.hasPaidCurrentMonth ? 'bg-farm-green' : 'bg-yellow-500'}`}></div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {member.hasPaidCurrentMonth ? 'Paid' : 'Pending'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Join New Tontine Buttons */}
      <div className="flex space-x-3">
        <Button 
          onClick={() => {
            setModalMode('create');
            setShowJoinModal(true);
          }}
          className="flex-1 btn-farm text-lg py-4"
        >
          <i className="fas fa-plus mr-2"></i>
          Create New Tontine
        </Button>
        <Button 
          onClick={() => {
            setModalMode('join');
            setShowJoinModal(true);
          }}
          variant="outline"
          className="flex-1 btn-outline-farm text-lg py-4"
        >
          <i className="fas fa-users mr-2"></i>
          Join Existing
        </Button>
      </div>

      {/* Join Tontine Modal */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <i className={`fas ${modalMode === 'create' ? 'fa-plus-circle' : 'fa-users'} text-farm-green mr-2`}></i>
              {modalMode === 'create' ? 'Create New Tontine' : 'Join Existing Tontine'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {modalMode === 'create' ? (
              <>
                <div>
                  <Label htmlFor="group-name">Tontine Group Name</Label>
                  <Input
                    id="group-name"
                    type="text"
                    placeholder="Bamenda Farmers United"
                    value={joinFormData.name}
                    onChange={(e) => setJoinFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input-farm"
                  />
                </div>
                
                <div>
                  <Label htmlFor="monthly-amount">Monthly Contribution Amount (CFA)</Label>
                  <Input
                    id="monthly-amount"
                    type="number"
                    placeholder="5000"
                    value={joinFormData.monthlyContribution}
                    onChange={(e) => setJoinFormData(prev => ({ ...prev, monthlyContribution: e.target.value }))}
                    className="input-farm"
                  />
                </div>
              </>
            ) : (
              <div>
                <Label htmlFor="group-code">Tontine Group Code</Label>
                <Input
                  id="group-code"
                  type="text"
                  placeholder="Enter the code shared by group leader"
                  value={joinFormData.groupCode}
                  onChange={(e) => setJoinFormData(prev => ({ ...prev, groupCode: e.target.value }))}
                  className="input-farm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ask your group leader for the invitation code
                </p>
              </div>
            )}
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                <i className="fas fa-info-circle mr-1"></i>
                {t('importantInfoTitle')}
              </h4>
              <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Monthly contributions are binding commitments</li>
                <li>• 2% platform fee applies to all transactions</li>
                <li>• Group approval may be required</li>
                <li>• Payouts follow the agreed rotation schedule</li>
              </ul>
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowJoinModal(false)}
              className="flex-1"
            >
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleCreateTontine}
              disabled={createTontineMutation.isPending}
              className="flex-1 bg-farm-green hover:bg-farm-green/90"
            >
              {createTontineMutation.isPending ? (
                <div className="loading-spinner mr-2"></div>
              ) : null}
              {modalMode === 'create' ? 'Create Tontine' : 'Join Tontine'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
