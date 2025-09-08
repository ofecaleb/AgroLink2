import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question: 'How do I create a tontine?',
    answer: 'To create a tontine, go to the Tontines section and click "Create New Tontine". Fill in the details including monthly contribution amount, number of members, and region. Once submitted, it will be reviewed by our team.',
    category: 'tontines'
  },
  {
    id: '2',
    question: 'How do I join an existing tontine?',
    answer: 'You can join a tontine by using an invite code provided by the tontine leader, or by browsing available tontines in your region and requesting to join.',
    category: 'tontines'
  },
  {
    id: '3',
    question: 'How are market prices updated?',
    answer: 'Market prices are updated by community members and verified by our team. You can submit price updates for crops in your region, and they will be reviewed for accuracy.',
    category: 'market'
  },
  {
    id: '4',
    question: 'What payment methods are accepted?',
    answer: 'We currently support mobile money transfers (MTN, Orange, Airtel) and bank transfers. More payment options will be added soon.',
    category: 'payments'
  },
  {
    id: '5',
    question: 'How do I report inappropriate content?',
    answer: 'You can report inappropriate posts or comments by clicking the three dots menu and selecting "Report". Our moderation team will review all reports.',
    category: 'community'
  },
  {
    id: '6',
    question: 'How do I update my profile information?',
    answer: 'Go to your Profile section and click "Edit Profile". You can update your personal information, profile picture, and contact details.',
    category: 'account'
  },
  {
    id: '7',
    question: 'What happens if I miss a tontine payment?',
    answer: 'Missing payments may result in penalties or removal from the tontine. Contact your tontine leader immediately if you cannot make a payment on time.',
    category: 'tontines'
  },
  {
    id: '8',
    question: 'How do I contact customer support?',
    answer: 'You can contact support through this Help & Support section, by creating a support ticket, or by calling our support line at +237 XXX XXX XXX.',
    category: 'support'
  }
];

export default function HelpSupport() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('faq');
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    message: '',
    priority: 'medium',
    category: 'general'
  });

  // Fetch user's support tickets
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => ApiService.getSupportTickets(),
    enabled: !!user,
  });

  // Create support ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: (data: any) => ApiService.createSupportTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setTicketForm({ subject: '', message: '', priority: 'medium', category: 'general' });
      toast({
        title: 'Success',
        description: 'Support ticket created successfully! We\'ll get back to you soon.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create support ticket',
        variant: 'destructive',
      });
    },
  });

  const handleCreateTicket = () => {
    if (ticketForm.subject.trim() && ticketForm.message.trim()) {
      createTicketMutation.mutate(ticketForm);
    } else {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'resolved': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'closed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Help & Support
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Get help with your AgroLink account and find answers to common questions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="contact">Contact Us</TabsTrigger>
          <TabsTrigger value="tickets">My Tickets</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-4">
                {FAQ_DATA.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg">
                    <AccordionTrigger className="px-4 py-3 text-left">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-xs">
                          {faq.category}
                        </Badge>
                        <span className="font-medium">{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {faq.answer}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Us Tab */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Support Ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <Input
                    placeholder="Brief description of your issue"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Select
                    value={ticketForm.category}
                    onValueChange={(value) => setTicketForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="tontines">Tontines</SelectItem>
                      <SelectItem value="payments">Payments</SelectItem>
                      <SelectItem value="market">Market Prices</SelectItem>
                      <SelectItem value="community">Community</SelectItem>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="account">Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <Select
                    value={ticketForm.priority}
                    onValueChange={(value) => setTicketForm(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <Textarea
                    placeholder="Describe your issue in detail..."
                    rows={6}
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>

                <Button
                  onClick={handleCreateTicket}
                  disabled={createTicketMutation.isPending}
                  className="w-full"
                >
                  {createTicketMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    'Submit Ticket'
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Other Contact Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <i className="fas fa-phone text-blue-600"></i>
                  <div>
                    <p className="font-medium">Phone Support</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">+237 XXX XXX XXX</p>
                    <p className="text-xs text-gray-500">Mon-Fri, 8AM-6PM</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <i className="fas fa-envelope text-green-600"></i>
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">support@agrolink.com</p>
                    <p className="text-xs text-gray-500">Response within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <i className="fas fa-comments text-purple-600"></i>
                  <div>
                    <p className="font-medium">Live Chat</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Available on website</p>
                    <p className="text-xs text-gray-500">Mon-Fri, 9AM-5PM</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <i className="fas fa-map-marker-alt text-red-600"></i>
                  <div>
                    <p className="font-medium">Office Address</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Douala, Cameroon</p>
                    <p className="text-xs text-gray-500">Visit by appointment</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* My Tickets Tab */}
        <TabsContent value="tickets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              {ticketsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-ticket-alt text-gray-400 text-4xl mb-4"></i>
                  <p className="text-gray-600 dark:text-gray-400">No support tickets yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket: any) => (
                    <div key={ticket.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {ticket.category} • {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {ticket.message}
                      </p>
                      {ticket.response && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-1">
                            Response from Support:
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {ticket.response}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-book text-blue-600"></i>
                  <span>User Guide</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Learn how to use AgroLink effectively with our comprehensive user guide.
                </p>
                <Button variant="outline" className="w-full">
                  <i className="fas fa-download mr-2"></i>
                  Download PDF
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-video text-green-600"></i>
                  <span>Video Tutorials</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Watch step-by-step video tutorials for all major features.
                </p>
                <Button variant="outline" className="w-full">
                  <i className="fas fa-play mr-2"></i>
                  Watch Videos
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-users text-purple-600"></i>
                  <span>Community Forum</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Connect with other users and share tips in our community forum.
                </p>
                <Button variant="outline" className="w-full">
                  <i className="fas fa-comments mr-2"></i>
                  Join Forum
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-chart-line text-orange-600"></i>
                  <span>Market Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Access market analysis and agricultural insights reports.
                </p>
                <Button variant="outline" className="w-full">
                  <i className="fas fa-chart-bar mr-2"></i>
                  View Reports
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-calendar text-red-600"></i>
                  <span>Training Events</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Attend workshops and training sessions on agricultural best practices.
                </p>
                <Button variant="outline" className="w-full">
                  <i className="fas fa-calendar-plus mr-2"></i>
                  View Events
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-phone-alt text-teal-600"></i>
                  <span>Expert Consultation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Book one-on-one sessions with agricultural experts and advisors.
                </p>
                <Button variant="outline" className="w-full">
                  <i className="fas fa-user-tie mr-2"></i>
                  Book Session
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}