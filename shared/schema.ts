import { pgTable, serial, text, integer, decimal, boolean, timestamp, jsonb, varchar, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  email: varchar('email', { length: 255 }),
  pin: text('pin'),
  password: text('password'),
  passwordHash: text('password_hash'),
  pinHash: text('pin_hash'),
  name: varchar('name', { length: 255 }).notNull(),
  country: varchar('country', { length: 10 }).notNull().default('CM'),
  region: varchar('region', { length: 100 }).notNull(),
  language: varchar('language', { length: 10 }).notNull().default('en'),
  currency: varchar('currency', { length: 10 }).notNull().default('XAF'),
  profilePicture: text('profile_picture'),
  plan: varchar('plan', { length: 50 }).notNull().default('free'),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  balance: decimal('balance', { precision: 15, scale: 2 }).notNull().default('0'),
  isActive: boolean('is_active').notNull().default(true),
  requiresPin: boolean('requires_pin').notNull().default(false),
  lastActive: timestamp('last_active').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// User sessions table
export const userSessions = pgTable('user_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: text('session_token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  lastUsed: timestamp('last_used').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Tontines table
export const tontines = pgTable('tontines', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  leaderId: integer('leader_id').notNull().references(() => users.id),
  monthlyContribution: decimal('monthly_contribution', { precision: 15, scale: 2 }).notNull(),
  maxMembers: integer('max_members').notNull().default(10),
  payoutSchedule: varchar('payout_schedule', { length: 50 }).notNull().default('monthly'),
  description: text('description'),
  rules: text('rules'),
  totalContributions: decimal('total_contributions', { precision: 15, scale: 2 }).notNull().default('0'),
  currentPayoutTurn: integer('current_payout_turn').notNull().default(0),
  nextPayoutDate: timestamp('next_payout_date'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  region: varchar('region', { length: 100 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  rejectedBy: integer('rejected_by').references(() => users.id),
  rejectedAt: timestamp('rejected_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Tontine members table
export const tontineMembers = pgTable('tontine_members', {
  id: serial('id').primaryKey(),
  tontineId: integer('tontine_id').notNull().references(() => tontines.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
  payoutPosition: integer('payout_position').notNull(),
  hasPaidCurrentMonth: boolean('has_paid_current_month').notNull().default(false),
  totalContributed: decimal('total_contributed', { precision: 15, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Tontine payments table
export const tontinePayments = pgTable('tontine_payments', {
  id: serial('id').primaryKey(),
  tontineId: integer('tontine_id').notNull().references(() => tontines.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  fee: decimal('fee', { precision: 15, scale: 2 }).notNull().default('0'),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  transactionId: varchar('transaction_id', { length: 255 }),
  reference: varchar('reference', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Tontine invites table
export const tontineInvites = pgTable('tontine_invites', {
  id: serial('id').primaryKey(),
  tontineId: integer('tontine_id').notNull().references(() => tontines.id, { onDelete: 'cascade' }),
  inviteCode: varchar('invite_code', { length: 10 }).notNull().unique(),
  createdBy: integer('created_by').notNull().references(() => users.id),
  maxUses: integer('max_uses').notNull().default(10),
  currentUses: integer('current_uses').notNull().default(0),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Market prices table
export const marketPrices = pgTable('market_prices', {
  id: serial('id').primaryKey(),
  crop: varchar('crop', { length: 100 }).notNull(),
  price: decimal('price', { precision: 15, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 50 }).notNull().default('kg'),
  region: varchar('region', { length: 100 }).notNull(),
  submittedBy: integer('submitted_by').notNull().references(() => users.id),
  isVerified: boolean('is_verified').notNull().default(false),
  verifiedBy: integer('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Community posts table
export const communityPosts = pgTable('community_posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  region: varchar('region', { length: 100 }).notNull(),
  likes: integer('likes').notNull().default(0),
  comments: integer('comments').notNull().default(0),
  isApproved: boolean('is_approved').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Community comments table
export const communityComments = pgTable('community_comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Community likes table
export const communityLikes = pgTable('community_likes', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Weather alerts table
export const weatherAlerts = pgTable('weather_alerts', {
  id: serial('id').primaryKey(),
  region: varchar('region', { length: 100 }).notNull(),
  alertType: varchar('alert_type', { length: 50 }).notNull(),
  message: text('message').notNull(),
  severity: varchar('severity', { length: 20 }).notNull().default('medium'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
});

// Support tickets table
export const supportTickets = pgTable('support_tickets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subject: varchar('subject', { length: 255 }).notNull(),
  message: text('message').notNull(),
  category: varchar('category', { length: 50 }).notNull().default('general'),
  priority: varchar('priority', { length: 20 }).notNull().default('medium'),
  status: varchar('status', { length: 50 }).notNull().default('open'),
  adminResponse: text('admin_response'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// User subscriptions table
export const userSubscriptions = pgTable('user_subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  planType: varchar('plan_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  startDate: timestamp('start_date').notNull().defaultNow(),
  endDate: timestamp('end_date'),
  autoRenew: boolean('auto_renew').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Subscription payments table
export const subscriptionPayments = pgTable('subscription_payments', {
  id: serial('id').primaryKey(),
  subscriptionId: integer('subscription_id').notNull().references(() => userSubscriptions.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('XAF'),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  transactionId: varchar('transaction_id', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// User content access table
export const userContentAccess = pgTable('user_content_access', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  contentType: varchar('content_type', { length: 50 }).notNull(),
  contentId: integer('content_id').notNull(),
  accessLevel: varchar('access_level', { length: 50 }).notNull().default('read'),
  grantedAt: timestamp('granted_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
});

// Advanced features tables
export const userWallets = pgTable('user_wallets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  balance: decimal('balance', { precision: 15, scale: 2 }).notNull().default('0'),
  currency: varchar('currency', { length: 10 }).notNull().default('XAF'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const walletTransactions = pgTable('wallet_transactions', {
  id: serial('id').primaryKey(),
  walletId: integer('wallet_id').notNull().references(() => userWallets.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  description: text('description'),
  reference: varchar('reference', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('completed'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const scheduledPayments = pgTable('scheduled_payments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tontineId: integer('tontine_id').references(() => tontines.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  frequency: varchar('frequency', { length: 50 }).notNull(),
  nextPaymentDate: timestamp('next_payment_date').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const marketplaceListings = pgTable('marketplace_listings', {
  id: serial('id').primaryKey(),
  sellerId: integer('seller_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  crop: varchar('crop', { length: 100 }).notNull(),
  quantity: decimal('quantity', { precision: 15, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 50 }).notNull().default('kg'),
  pricePerUnit: decimal('price_per_unit', { precision: 15, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 15, scale: 2 }).notNull(),
  region: varchar('region', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  views: integer('views').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const marketplaceOrders = pgTable('marketplace_orders', {
  id: serial('id').primaryKey(),
  listingId: integer('listing_id').notNull().references(() => marketplaceListings.id, { onDelete: 'cascade' }),
  buyerId: integer('buyer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  quantity: decimal('quantity', { precision: 15, scale: 2 }).notNull(),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const marketplaceBids = pgTable('marketplace_bids', {
  id: serial('id').primaryKey(),
  listingId: integer('listing_id').notNull().references(() => marketplaceListings.id, { onDelete: 'cascade' }),
  bidderId: integer('bidder_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  bidAmount: decimal('bid_amount', { precision: 15, scale: 2 }).notNull(),
  quantity: decimal('quantity', { precision: 15, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const communityForums = pgTable('community_forums', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  region: varchar('region', { length: 100 }),
  isPublic: boolean('is_public').notNull().default(true),
  memberCount: integer('member_count').notNull().default(0),
  postCount: integer('post_count').notNull().default(0),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const forumMembers = pgTable('forum_members', {
  id: serial('id').primaryKey(),
  forumId: integer('forum_id').notNull().references(() => communityForums.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull().default('member'),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const forumPosts = pgTable('forum_posts', {
  id: serial('id').primaryKey(),
  forumId: integer('forum_id').notNull().references(() => communityForums.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  isPinned: boolean('is_pinned').notNull().default(false),
  likes: integer('likes').notNull().default(0),
  replies: integer('replies').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const forumComments = pgTable('forum_comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => forumPosts.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const knowledgeArticles = pgTable('knowledge_articles', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  tags: jsonb('tags'),
  authorId: integer('author_id').notNull().references(() => users.id),
  isPublished: boolean('is_published').notNull().default(false),
  views: integer('views').notNull().default(0),
  likes: integer('likes').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const communityEvents = pgTable('community_events', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  region: varchar('region', { length: 100 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  location: varchar('location', { length: 255 }),
  maxAttendees: integer('max_attendees'),
  currentAttendees: integer('current_attendees').notNull().default(0),
  organizerId: integer('organizer_id').notNull().references(() => users.id),
  isPublic: boolean('is_public').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const eventAttendees = pgTable('event_attendees', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull().references(() => communityEvents.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull().default('registered'),
  registeredAt: timestamp('registered_at').notNull().defaultNow(),
});

export const impactMetrics = pgTable('impact_metrics', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  metricType: varchar('metric_type', { length: 100 }).notNull(),
  value: decimal('value', { precision: 15, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 50 }).notNull(),
  period: varchar('period', { length: 50 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const carbonCredits = pgTable('carbon_credits', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  credits: decimal('credits', { precision: 15, scale: 2 }).notNull(),
  source: varchar('source', { length: 100 }).notNull(),
  verificationStatus: varchar('verification_status', { length: 50 }).notNull().default('pending'),
  issuedAt: timestamp('issued_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
});

export const sustainabilityPractices = pgTable('sustainability_practices', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  practiceType: varchar('practice_type', { length: 100 }).notNull(),
  description: text('description'),
  impact: jsonb('impact'),
  verificationStatus: varchar('verification_status', { length: 50 }).notNull().default('self_reported'),
  implementedAt: timestamp('implemented_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const sdgTracking = pgTable('sdg_tracking', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sdgGoal: integer('sdg_goal').notNull(),
  indicator: varchar('indicator', { length: 255 }).notNull(),
  value: decimal('value', { precision: 15, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 50 }).notNull(),
  reportingPeriod: varchar('reporting_period', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Admin automation tables
export const adminAuditLogs = pgTable('admin_audit_logs', {
  id: serial('id').primaryKey(),
  adminId: integer('admin_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: integer('entity_id').notNull(),
  details: jsonb('details'),
  automationLevel: varchar('automation_level', { length: 50 }).notNull().default('manual'),
  decisionReason: text('decision_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const automationRules = pgTable('automation_rules', {
  id: serial('id').primaryKey(),
  ruleType: varchar('rule_type', { length: 100 }).notNull(),
  ruleName: varchar('rule_name', { length: 255 }).notNull(),
  description: text('description'),
  conditions: jsonb('conditions').notNull(),
  actions: jsonb('actions').notNull(),
  priority: integer('priority').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const automationExecutions = pgTable('automation_executions', {
  id: serial('id').primaryKey(),
  ruleId: integer('rule_id').notNull().references(() => automationRules.id, { onDelete: 'cascade' }),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: integer('entity_id').notNull(),
  triggerData: jsonb('trigger_data'),
  actionsTaken: jsonb('actions_taken'),
  success: boolean('success').notNull(),
  errorMessage: text('error_message'),
  executionTime: integer('execution_time'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const adminNotifications = pgTable('admin_notifications', {
  id: serial('id').primaryKey(),
  adminId: integer('admin_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  severity: varchar('severity', { length: 20 }).notNull().default('medium'),
  data: jsonb('data'),
  isRead: boolean('is_read').notNull().default(false),
  actionRequired: boolean('action_required').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const adminDashboards = pgTable('admin_dashboards', {
  id: serial('id').primaryKey(),
  adminId: integer('admin_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dashboardType: varchar('dashboard_type', { length: 100 }).notNull(),
  configuration: jsonb('configuration').notNull(),
  layout: jsonb('layout'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const systemMetrics = pgTable('system_metrics', {
  id: serial('id').primaryKey(),
  metricType: varchar('metric_type', { length: 100 }).notNull(),
  metricName: varchar('metric_name', { length: 255 }).notNull(),
  value: varchar('value', { length: 255 }).notNull(),
  unit: varchar('unit', { length: 50 }),
  period: varchar('period', { length: 50 }).notNull(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const adminWorkflows = pgTable('admin_workflows', {
  id: serial('id').primaryKey(),
  workflowType: varchar('workflow_type', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  steps: jsonb('steps').notNull(),
  currentStep: integer('current_step').notNull().default(0),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: integer('entity_id'),
  assignedTo: integer('assigned_to').references(() => users.id),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const adminReports = pgTable('admin_reports', {
  id: serial('id').primaryKey(),
  reportType: varchar('report_type', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  parameters: jsonb('parameters'),
  data: jsonb('data'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  generatedBy: integer('generated_by').notNull().references(() => users.id),
  generatedAt: timestamp('generated_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const adminSettings = pgTable('admin_settings', {
  id: serial('id').primaryKey(),
  settingKey: varchar('setting_key', { length: 255 }).notNull().unique(),
  settingValue: jsonb('setting_value').notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull().default('general'),
  isPublic: boolean('is_public').notNull().default(false),
  updatedBy: integer('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const adminApiKeys = pgTable('admin_api_keys', {
  id: serial('id').primaryKey(),
  keyName: varchar('key_name', { length: 255 }).notNull(),
  keyHash: text('key_hash').notNull(),
  permissions: jsonb('permissions').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  lastUsed: timestamp('last_used'),
  expiresAt: timestamp('expires_at'),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const adminScheduledTasks = pgTable('admin_scheduled_tasks', {
  id: serial('id').primaryKey(),
  taskType: varchar('task_type', { length: 100 }).notNull(),
  taskName: varchar('task_name', { length: 255 }).notNull(),
  description: text('description'),
  schedule: varchar('schedule', { length: 100 }).notNull(),
  parameters: jsonb('parameters'),
  isActive: boolean('is_active').notNull().default(true),
  lastRun: timestamp('last_run'),
  nextRun: timestamp('next_run'),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const adminDataExports = pgTable('admin_data_exports', {
  id: serial('id').primaryKey(),
  exportType: varchar('export_type', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  parameters: jsonb('parameters'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  filePath: text('file_path'),
  fileSize: integer('file_size'),
  recordCount: integer('record_count'),
  requestedBy: integer('requested_by').notNull().references(() => users.id),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const userRoles = pgTable('user_roles', {
  id: serial('id').primaryKey(),
  roleName: varchar('role_name', { length: 100 }).notNull().unique(),
  description: text('description'),
  permissions: jsonb('permissions').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const userPermissions = pgTable('user_permissions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  permission: varchar('permission', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }),
  grantedBy: integer('granted_by').references(() => users.id),
  grantedAt: timestamp('granted_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  tontines: many(tontines),
  tontineMembers: many(tontineMembers),
  tontinePayments: many(tontinePayments),
  marketPrices: many(marketPrices),
  communityPosts: many(communityPosts),
  communityComments: many(communityComments),
  communityLikes: many(communityLikes),
  supportTickets: many(supportTickets),
  userSessions: many(userSessions),
}));

export const tontinesRelations = relations(tontines, ({ one, many }) => ({
  leader: one(users, {
    fields: [tontines.leaderId],
    references: [users.id],
  }),
  members: many(tontineMembers),
  payments: many(tontinePayments),
  invites: many(tontineInvites),
}));

export const tontineMembersRelations = relations(tontineMembers, ({ one }) => ({
  tontine: one(tontines, {
    fields: [tontineMembers.tontineId],
    references: [tontines.id],
  }),
  user: one(users, {
    fields: [tontineMembers.userId],
    references: [users.id],
  }),
}));

export const communityPostsRelations = relations(communityPosts, ({ one, many }) => ({
  user: one(users, {
    fields: [communityPosts.userId],
    references: [users.id],
  }),
  comments: many(communityComments),
  likes: many(communityLikes),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Tontine = typeof tontines.$inferSelect;
export type InsertTontine = typeof tontines.$inferInsert;
export type TontineMember = typeof tontineMembers.$inferSelect;
export type InsertTontineMember = typeof tontineMembers.$inferInsert;
export type TontinePayment = typeof tontinePayments.$inferSelect;
export type InsertTontinePayment = typeof tontinePayments.$inferInsert;
export type TontineInvite = typeof tontineInvites.$inferSelect;
export type InsertTontineInvite = typeof tontineInvites.$inferInsert;
export type MarketPrice = typeof marketPrices.$inferSelect;
export type InsertMarketPrice = typeof marketPrices.$inferInsert;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = typeof communityPosts.$inferInsert;
export type CommunityComment = typeof communityComments.$inferSelect;
export type InsertCommunityComment = typeof communityComments.$inferInsert;
export type CommunityLike = typeof communityLikes.$inferSelect;
export type InsertCommunityLike = typeof communityLikes.$inferInsert;
export type WeatherAlert = typeof weatherAlerts.$inferSelect;
export type InsertWeatherAlert = typeof weatherAlerts.$inferInsert;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

// Advanced feature types
export type UserWallet = typeof userWallets.$inferSelect;
export type InsertUserWallet = typeof userWallets.$inferInsert;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = typeof walletTransactions.$inferInsert;
export type ScheduledPayment = typeof scheduledPayments.$inferSelect;
export type InsertScheduledPayment = typeof scheduledPayments.$inferInsert;
export type MarketplaceListing = typeof marketplaceListings.$inferSelect;
export type InsertMarketplaceListing = typeof marketplaceListings.$inferInsert;
export type MarketplaceOrder = typeof marketplaceOrders.$inferSelect;
export type InsertMarketplaceOrder = typeof marketplaceOrders.$inferInsert;
export type MarketplaceBid = typeof marketplaceBids.$inferSelect;
export type InsertMarketplaceBid = typeof marketplaceBids.$inferInsert;
export type CommunityForum = typeof communityForums.$inferSelect;
export type InsertCommunityForum = typeof communityForums.$inferInsert;
export type ForumMember = typeof forumMembers.$inferSelect;
export type InsertForumMember = typeof forumMembers.$inferInsert;
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = typeof forumPosts.$inferInsert;
export type ForumComment = typeof forumComments.$inferSelect;
export type InsertForumComment = typeof forumComments.$inferInsert;
export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;
export type InsertKnowledgeArticle = typeof knowledgeArticles.$inferInsert;
export type CommunityEvent = typeof communityEvents.$inferSelect;
export type InsertCommunityEvent = typeof communityEvents.$inferInsert;
export type EventAttendee = typeof eventAttendees.$inferSelect;
export type InsertEventAttendee = typeof eventAttendees.$inferInsert;
export type ImpactMetric = typeof impactMetrics.$inferSelect;
export type InsertImpactMetric = typeof impactMetrics.$inferInsert;
export type CarbonCredit = typeof carbonCredits.$inferSelect;
export type InsertCarbonCredit = typeof carbonCredits.$inferInsert;
export type SustainabilityPractice = typeof sustainabilityPractices.$inferSelect;
export type InsertSustainabilityPractice = typeof sustainabilityPractices.$inferInsert;
export type SdgTracking = typeof sdgTracking.$inferSelect;
export type InsertSdgTracking = typeof sdgTracking.$inferInsert;

// Admin automation types
export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type InsertAdminAuditLog = typeof adminAuditLogs.$inferInsert;
export type AutomationRule = typeof automationRules.$inferSelect;
export type InsertAutomationRule = typeof automationRules.$inferInsert;
export type AutomationExecution = typeof automationExecutions.$inferSelect;
export type InsertAutomationExecution = typeof automationExecutions.$inferInsert;
export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = typeof adminNotifications.$inferInsert;
export type AdminDashboard = typeof adminDashboards.$inferSelect;
export type InsertAdminDashboard = typeof adminDashboards.$inferInsert;
export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = typeof systemMetrics.$inferInsert;
export type AdminWorkflow = typeof adminWorkflows.$inferSelect;
export type InsertAdminWorkflow = typeof adminWorkflows.$inferInsert;
export type AdminReport = typeof adminReports.$inferSelect;
export type InsertAdminReport = typeof adminReports.$inferInsert;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = typeof adminSettings.$inferInsert;
export type AdminApiKey = typeof adminApiKeys.$inferSelect;
export type InsertAdminApiKey = typeof adminApiKeys.$inferInsert;
export type AdminScheduledTask = typeof adminScheduledTasks.$inferSelect;
export type InsertAdminScheduledTask = typeof adminScheduledTasks.$inferInsert;
export type AdminDataExport = typeof adminDataExports.$inferSelect;
export type InsertAdminDataExport = typeof adminDataExports.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;
export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = typeof userPermissions.$inferInsert;

// Enum types
export type AdminActionType = 
  | 'approve_tontine'
  | 'reject_tontine'
  | 'approve_price'
  | 'reject_price'
  | 'suspend_user'
  | 'unsuspend_user'
  | 'approve_post'
  | 'reject_post'
  | 'system_alert'
  | 'override_automation';

export type AutomationLevel = 'manual' | 'semi_automated' | 'fully_automated';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';