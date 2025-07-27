import { pgTable, text, serial, integer, boolean, timestamp, json, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  email: text("email"),
  pin: text("pin").notNull(), // Hashed PIN
  password: text("password"), // Hashed password (optional, for users who prefer text passwords)
  name: text("name").notNull(),
  country: text("country").default("CM"),
  region: text("region").notNull(),
  language: text("language").default("en"),
  currency: text("currency").default("USD"),
  profilePicture: text("profile_picture"),
  plan: text("plan").default("free"), // 'free', 'premium', 'enterprise'
  role: text("role").default("user"), // 'user', 'admin', 'moderator'
  balance: integer("balance").default(0),
  premiumExpiresAt: timestamp("premium_expires_at"),
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tontines = pgTable("tontines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  leaderId: integer("leader_id").references(() => users.id),
  monthlyContribution: integer("monthly_contribution").notNull(),
  totalContributions: integer("total_contributions").default(0),
  currentPayoutTurn: integer("current_payout_turn").default(0),
  nextPayoutDate: timestamp("next_payout_date"),
  status: text("status").default("active"), // 'active', 'completed', 'suspended'
  region: text("region").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tontineMembers = pgTable("tontine_members", {
  id: serial("id").primaryKey(),
  tontineId: integer("tontine_id").references(() => tontines.id),
  userId: integer("user_id").references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  hasPaidCurrentMonth: boolean("has_paid_current_month").default(false),
  payoutPosition: integer("payout_position"),
});

export const tontinePayments = pgTable("tontine_payments", {
  id: serial("id").primaryKey(),
  tontineId: integer("tontine_id").references(() => tontines.id),
  userId: integer("user_id").references(() => users.id),
  amount: integer("amount").notNull(),
  fee: integer("fee").notNull(),
  paymentMethod: text("payment_method").notNull(), // 'momo', 'orange_money'
  status: text("status").default("pending"), // 'pending', 'completed', 'failed'
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketPrices = pgTable("market_prices", {
  id: serial("id").primaryKey(),
  crop: text("crop").notNull(),
  price: integer("price").notNull(), // Price in CFA
  unit: text("unit").default("CFA/kg"),
  region: text("region").notNull(),
  submittedBy: integer("submitted_by").references(() => users.id),
  isVerified: boolean("is_verified").default(false),
  verifiedBy: integer("verified_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityPosts = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  content: text("content").notNull(),
  region: text("region").notNull(),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const weatherAlerts = pgTable("weather_alerts", {
  id: serial("id").primaryKey(),
  region: text("region").notNull(),
  alertType: text("alert_type").notNull(), // 'rain', 'temperature', 'humidity'
  message: text("message").notNull(),
  severity: text("severity").notNull(), // 'low', 'medium', 'high'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityComments = pgTable("community_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => communityPosts.id),
  userId: integer("user_id").references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityLikes = pgTable("community_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => communityPosts.id),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").default("open"), // 'open', 'in_progress', 'resolved', 'closed'
  priority: text("priority").default("medium"), // 'low', 'medium', 'high', 'urgent'
  category: text("category").notNull(), // 'technical', 'billing', 'feature_request', 'bug_report', 'other'
  adminResponse: text("admin_response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tontineInvites = pgTable("tontine_invites", {
  id: serial("id").primaryKey(),
  tontineId: integer("tontine_id").references(() => tontines.id),
  inviteCode: text("invite_code").notNull().unique(),
  createdBy: integer("created_by").references(() => users.id),
  maxUses: integer("max_uses").default(10),
  currentUses: integer("current_uses").default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Premium subscription plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 'premium', 'enterprise'
  displayName: text("display_name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // Price in cents
  currency: text("currency").default("USD"),
  duration: integer("duration").notNull(), // Duration in days
  features: json("features"), // JSON array of feature names
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User subscriptions
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  planId: integer("plan_id").references(() => subscriptionPlans.id),
  status: text("status").default("active"), // 'active', 'cancelled', 'expired'
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  autoRenew: boolean("auto_renew").default(true),
  paymentMethod: text("payment_method"), // 'mobile_money', 'card', 'bank'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription payments
export const subscriptionPayments = pgTable("subscription_payments", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").references(() => userSubscriptions.id),
  amount: integer("amount").notNull(),
  currency: text("currency").default("USD"),
  paymentMethod: text("payment_method").notNull(),
  status: text("status").default("pending"), // 'pending', 'completed', 'failed'
  transactionId: text("transaction_id"),
  gatewayResponse: json("gateway_response"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Premium content access
export const premiumContent = pgTable("premium_content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'weather_forecast', 'market_analytics', 'farming_guide', 'expert_consultation'
  content: json("content"),
  isActive: boolean("is_active").default(true),
  requiredPlan: text("required_plan").default("premium"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User access to premium content
export const userContentAccess = pgTable("user_content_access", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  contentId: integer("content_id").references(() => premiumContent.id),
  accessedAt: timestamp("accessed_at").defaultNow(),
});

// Expert consultations
export const expertConsultations = pgTable("expert_consultations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  expertId: integer("expert_id").references(() => users.id),
  subject: text("subject").notNull(),
  description: text("description"),
  status: text("status").default("pending"), // 'pending', 'accepted', 'completed', 'cancelled'
  scheduledAt: timestamp("scheduled_at"),
  duration: integer("duration").default(30), // Duration in minutes
  price: integer("price").notNull(),
  paymentStatus: text("payment_status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Premium analytics
export const premiumAnalytics = pgTable("premium_analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(), // 'market_trends', 'weather_patterns', 'crop_performance'
  data: json("data"),
  generatedAt: timestamp("generated_at").defaultNow(),
});

// Advanced Payment & Banking System
export const userWallets = pgTable("user_wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  balance: integer("balance").default(0), // Balance in cents
  currency: text("currency").default("XAF"),
  isActive: boolean("is_active").default(true),
  lastTransactionAt: timestamp("last_transaction_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").references(() => userWallets.id),
  type: text("type").notNull(), // 'deposit', 'withdrawal', 'transfer', 'payment', 'refund'
  amount: integer("amount").notNull(), // Amount in cents
  currency: text("currency").default("XAF"),
  description: text("description"),
  reference: text("reference"), // External transaction reference
  status: text("status").default("pending"), // 'pending', 'completed', 'failed', 'cancelled'
  paymentMethod: text("payment_method"), // 'mobile_money', 'bank_transfer', 'card', 'crypto'
  fee: integer("fee").default(0),
  metadata: json("metadata"), // Additional transaction data
  createdAt: timestamp("created_at").defaultNow(),
});

export const scheduledPayments = pgTable("scheduled_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(), // 'tontine', 'bill', 'transfer', 'subscription'
  amount: integer("amount").notNull(),
  currency: text("currency").default("XAF"),
  frequency: text("frequency").notNull(), // 'once', 'daily', 'weekly', 'monthly'
  nextDueDate: timestamp("next_due_date").notNull(),
  endDate: timestamp("end_date"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  paymentMethod: text("payment_method"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Direct Trading Marketplace
export const marketplaceListings = pgTable("marketplace_listings", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  cropType: text("crop_type").notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull(), // 'kg', 'ton', 'piece', 'bundle'
  pricePerUnit: integer("price_per_unit").notNull(),
  currency: text("currency").default("XAF"),
  totalPrice: integer("total_price").notNull(),
  location: text("location").notNull(),
  images: json("images"), // Array of image URLs
  quality: text("quality").default("standard"), // 'premium', 'standard', 'basic'
  harvestDate: timestamp("harvest_date"),
  expiryDate: timestamp("expiry_date"),
  status: text("status").default("active"), // 'active', 'sold', 'expired', 'cancelled'
  views: integer("views").default(0),
  favorites: integer("favorites").default(0),
  isNegotiable: boolean("is_negotiable").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const marketplaceOrders = pgTable("marketplace_orders", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").references(() => marketplaceListings.id),
  buyerId: integer("buyer_id").references(() => users.id),
  sellerId: integer("seller_id").references(() => users.id),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  totalAmount: integer("total_amount").notNull(),
  currency: text("currency").default("XAF"),
  status: text("status").default("pending"), // 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
  paymentStatus: text("payment_status").default("pending"), // 'pending', 'paid', 'refunded'
  deliveryAddress: text("delivery_address"),
  deliveryInstructions: text("delivery_instructions"),
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  rating: integer("rating"), // 1-5 stars
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const marketplaceBids = pgTable("marketplace_bids", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").references(() => marketplaceListings.id),
  bidderId: integer("bidder_id").references(() => users.id),
  amount: integer("amount").notNull(),
  currency: text("currency").default("XAF"),
  message: text("message"),
  status: text("status").default("active"), // 'active', 'accepted', 'rejected', 'expired'
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced Community Platform
export const communityForums = pgTable("community_forums", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'crops', 'livestock', 'technology', 'finance', 'weather'
  region: text("region"),
  isPublic: boolean("is_public").default(true),
  isActive: boolean("is_active").default(true),
  memberCount: integer("member_count").default(0),
  postCount: integer("post_count").default(0),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const forumMembers = pgTable("forum_members", {
  id: serial("id").primaryKey(),
  forumId: integer("forum_id").references(() => communityForums.id),
  userId: integer("user_id").references(() => users.id),
  role: text("role").default("member"), // 'member', 'moderator', 'admin'
  joinedAt: timestamp("joined_at").defaultNow(),
  lastActive: timestamp("last_active"),
});

export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  forumId: integer("forum_id").references(() => communityForums.id),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").default("discussion"), // 'discussion', 'question', 'announcement', 'guide'
  tags: json("tags"), // Array of tags
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  isPinned: boolean("is_pinned").default(false),
  isLocked: boolean("is_locked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const forumComments = pgTable("forum_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => forumPosts.id),
  userId: integer("user_id").references(() => users.id),
  parentId: integer("parent_id"), // For nested comments - will add relation separately
  content: text("content").notNull(),
  likes: integer("likes").default(0),
  isSolution: boolean("is_solution").default(false), // For marking best answers
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const knowledgeArticles = pgTable("knowledge_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // 'farming_techniques', 'crop_management', 'pest_control', 'soil_health'
  tags: json("tags"),
  authorId: integer("author_id").references(() => users.id),
  isPublished: boolean("is_published").default(false),
  isFeatured: boolean("is_featured").default(false),
  views: integer("views").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const communityEvents = pgTable("community_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'workshop', 'meeting', 'trade_show', 'training'
  location: text("location"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isOnline: boolean("is_online").default(false),
  meetingUrl: text("meeting_url"),
  maxAttendees: integer("max_attendees"),
  currentAttendees: integer("current_attendees").default(0),
  organizerId: integer("organizer_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const eventAttendees = pgTable("event_attendees", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => communityEvents.id),
  userId: integer("user_id").references(() => users.id),
  status: text("status").default("registered"), // 'registered', 'attended', 'cancelled'
  registeredAt: timestamp("registered_at").defaultNow(),
});

// Impact Tracking & Sustainability
export const impactMetrics = pgTable("impact_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  metricType: text("metric_type").notNull(), // 'income_increase', 'financial_inclusion', 'crop_yield', 'carbon_sequestration'
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(), // 'percentage', 'currency', 'kg', 'tons_co2'
  period: text("period").notNull(), // 'daily', 'weekly', 'monthly', 'yearly'
  date: timestamp("date").notNull(),
  description: text("description"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const carbonCredits = pgTable("carbon_credits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  practice: text("practice").notNull(), // 'conservation_agriculture', 'agroforestry', 'reduced_tillage', 'cover_cropping'
  carbonSequestration: decimal("carbon_sequestration", { precision: 10, scale: 2 }).notNull(), // tons CO2
  verificationStatus: text("verification_status").default("pending"), // 'pending', 'verified', 'rejected'
  verifiedBy: integer("verified_by").references(() => users.id),
  verificationDate: timestamp("verification_date"),
  certificateUrl: text("certificate_url"),
  isSold: boolean("is_sold").default(false),
  salePrice: integer("sale_price"),
  saleDate: timestamp("sale_date"),
  buyer: text("buyer"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sustainabilityPractices = pgTable("sustainability_practices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  practice: text("practice").notNull(), // 'organic_farming', 'water_conservation', 'biodiversity', 'soil_health'
  implementationDate: timestamp("implementation_date").notNull(),
  status: text("status").default("implemented"), // 'planned', 'implemented', 'completed', 'discontinued'
  impact: text("impact"), // Description of environmental impact
  certification: text("certification"), // Certification type if applicable
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sdgTracking = pgTable("sdg_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sdgGoal: integer("sdg_goal").notNull(), // 1-17 UN SDG goals
  indicator: text("indicator").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  target: decimal("target", { precision: 10, scale: 2 }),
  unit: text("unit"),
  date: timestamp("date").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  tontinesAsLeader: many(tontines),
  tontineMembers: many(tontineMembers),
  tontinePayments: many(tontinePayments),
  marketPrices: many(marketPrices),
  communityPosts: many(communityPosts),
  communityComments: many(communityComments),
  communityLikes: many(communityLikes),
  supportTickets: many(supportTickets),
  sessions: many(userSessions),
}));

export const tontinesRelations = relations(tontines, ({ many, one }) => ({
  leader: one(users, {
    fields: [tontines.leaderId],
    references: [users.id],
  }),
  members: many(tontineMembers),
  payments: many(tontinePayments),
  invites: many(tontineInvites),
}));

export const communityPostsRelations = relations(communityPosts, ({ many, one }) => ({
  user: one(users, {
    fields: [communityPosts.userId],
    references: [users.id],
  }),
  comments: many(communityComments),
  likes: many(communityLikes),
}));

export const communityCommentsRelations = relations(communityComments, ({ one }) => ({
  post: one(communityPosts, {
    fields: [communityComments.postId],
    references: [communityPosts.id],
  }),
  user: one(users, {
    fields: [communityComments.userId],
    references: [users.id],
  }),
}));

export const communityLikesRelations = relations(communityLikes, ({ one }) => ({
  post: one(communityPosts, {
    fields: [communityLikes.postId],
    references: [communityPosts.id],
  }),
  user: one(users, {
    fields: [communityLikes.userId],
    references: [users.id],
  }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one }) => ({
  user: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
  }),
}));

export const tontineInvitesRelations = relations(tontineInvites, ({ one }) => ({
  tontine: one(tontines, {
    fields: [tontineInvites.tontineId],
    references: [tontines.id],
  }),
  creator: one(users, {
    fields: [tontineInvites.createdBy],
    references: [users.id],
  }),
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

export const tontinePaymentsRelations = relations(tontinePayments, ({ one }) => ({
  tontine: one(tontines, {
    fields: [tontinePayments.tontineId],
    references: [tontines.id],
  }),
  user: one(users, {
    fields: [tontinePayments.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastActive: true,
}).extend({
  pin: z.string().length(4).regex(/^\d+$/, "PIN must be 4 digits"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  phone: z.string().min(8, "Phone number must be at least 8 digits").max(15, "Phone number too long"),
});

export const insertTontineSchema = createInsertSchema(tontines).omit({
  id: true,
  createdAt: true,
  totalContributions: true,
  currentPayoutTurn: true,
});

export const insertMarketPriceSchema = createInsertSchema(marketPrices).omit({
  id: true,
  createdAt: true,
  isVerified: true,
  verifiedBy: true,
});

export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({
  id: true,
  createdAt: true,
  likes: true,
  comments: true,
});

export const insertTontinePaymentSchema = createInsertSchema(tontinePayments).omit({
  id: true,
  createdAt: true,
  status: true,
  transactionId: true,
});

export const insertCommunityCommentSchema = createInsertSchema(communityComments).omit({
  id: true,
  createdAt: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  adminResponse: true,
});

export const insertTontineInviteSchema = createInsertSchema(tontineInvites).omit({
  id: true,
  createdAt: true,
  currentUses: true,
});

export const insertCommunityLikeSchema = createInsertSchema(communityLikes).omit({
  id: true,
  createdAt: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Tontine = typeof tontines.$inferSelect;
export type InsertTontine = z.infer<typeof insertTontineSchema>;
export type TontineMember = typeof tontineMembers.$inferSelect;
export type TontinePayment = typeof tontinePayments.$inferSelect;
export type InsertTontinePayment = z.infer<typeof insertTontinePaymentSchema>;
export type MarketPrice = typeof marketPrices.$inferSelect;
export type InsertMarketPrice = z.infer<typeof insertMarketPriceSchema>;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type CommunityComment = typeof communityComments.$inferSelect;
export type InsertCommunityComment = z.infer<typeof insertCommunityCommentSchema>;
export type CommunityLike = typeof communityLikes.$inferSelect;
export type InsertCommunityLike = z.infer<typeof insertCommunityLikeSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type TontineInvite = typeof tontineInvites.$inferSelect;
export type InsertTontineInvite = z.infer<typeof insertTontineInviteSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;

// Premium feature types
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;
export type SubscriptionPayment = typeof subscriptionPayments.$inferSelect;
export type InsertSubscriptionPayment = typeof subscriptionPayments.$inferInsert;
export type PremiumContent = typeof premiumContent.$inferSelect;
export type InsertPremiumContent = typeof premiumContent.$inferInsert;
export type UserContentAccess = typeof userContentAccess.$inferSelect;
export type InsertUserContentAccess = typeof userContentAccess.$inferInsert;
export type ExpertConsultation = typeof expertConsultations.$inferSelect;
export type InsertExpertConsultation = typeof expertConsultations.$inferInsert;
export type PremiumAnalytics = typeof premiumAnalytics.$inferSelect;
export type InsertPremiumAnalytics = typeof premiumAnalytics.$inferInsert;

// Premium feature schemas
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionPaymentSchema = createInsertSchema(subscriptionPayments).omit({
  id: true,
  createdAt: true,
});

export const insertPremiumContentSchema = createInsertSchema(premiumContent).omit({
  id: true,
  createdAt: true,
});

export const insertUserContentAccessSchema = createInsertSchema(userContentAccess).omit({
  id: true,
  accessedAt: true,
});

export const insertExpertConsultationSchema = createInsertSchema(expertConsultations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPremiumAnalyticsSchema = createInsertSchema(premiumAnalytics).omit({
  id: true,
  generatedAt: true,
});

// New relations for advanced features
export const userWalletsRelations = relations(userWallets, ({ one, many }) => ({
  user: one(users, {
    fields: [userWallets.userId],
    references: [users.id],
  }),
  transactions: many(walletTransactions),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  wallet: one(userWallets, {
    fields: [walletTransactions.walletId],
    references: [userWallets.id],
  }),
}));

export const marketplaceListingsRelations = relations(marketplaceListings, ({ one, many }) => ({
  seller: one(users, {
    fields: [marketplaceListings.sellerId],
    references: [users.id],
  }),
  orders: many(marketplaceOrders),
  bids: many(marketplaceBids),
}));

export const marketplaceOrdersRelations = relations(marketplaceOrders, ({ one }) => ({
  listing: one(marketplaceListings, {
    fields: [marketplaceOrders.listingId],
    references: [marketplaceListings.id],
  }),
  buyer: one(users, {
    fields: [marketplaceOrders.buyerId],
    references: [users.id],
  }),
  seller: one(users, {
    fields: [marketplaceOrders.sellerId],
    references: [users.id],
  }),
}));

export const marketplaceBidsRelations = relations(marketplaceBids, ({ one }) => ({
  listing: one(marketplaceListings, {
    fields: [marketplaceBids.listingId],
    references: [marketplaceListings.id],
  }),
  bidder: one(users, {
    fields: [marketplaceBids.bidderId],
    references: [users.id],
  }),
}));

export const communityForumsRelations = relations(communityForums, ({ one, many }) => ({
  creator: one(users, {
    fields: [communityForums.createdBy],
    references: [users.id],
  }),
  members: many(forumMembers),
  posts: many(forumPosts),
}));

export const forumMembersRelations = relations(forumMembers, ({ one }) => ({
  forum: one(communityForums, {
    fields: [forumMembers.forumId],
    references: [communityForums.id],
  }),
  user: one(users, {
    fields: [forumMembers.userId],
    references: [users.id],
  }),
}));

export const forumPostsRelations = relations(forumPosts, ({ one, many }) => ({
  forum: one(communityForums, {
    fields: [forumPosts.forumId],
    references: [communityForums.id],
  }),
  user: one(users, {
    fields: [forumPosts.userId],
    references: [users.id],
  }),
  comments: many(forumComments),
}));

export const forumCommentsRelations = relations(forumComments, ({ one }) => ({
  post: one(forumPosts, {
    fields: [forumComments.postId],
    references: [forumPosts.id],
  }),
  user: one(users, {
    fields: [forumComments.userId],
    references: [users.id],
  }),
}));

export const knowledgeArticlesRelations = relations(knowledgeArticles, ({ one }) => ({
  author: one(users, {
    fields: [knowledgeArticles.authorId],
    references: [users.id],
  }),
}));

export const communityEventsRelations = relations(communityEvents, ({ one, many }) => ({
  organizer: one(users, {
    fields: [communityEvents.organizerId],
    references: [users.id],
  }),
  attendees: many(eventAttendees),
}));

export const eventAttendeesRelations = relations(eventAttendees, ({ one }) => ({
  event: one(communityEvents, {
    fields: [eventAttendees.eventId],
    references: [communityEvents.id],
  }),
  user: one(users, {
    fields: [eventAttendees.userId],
    references: [users.id],
  }),
}));

export const impactMetricsRelations = relations(impactMetrics, ({ one }) => ({
  user: one(users, {
    fields: [impactMetrics.userId],
    references: [users.id],
  }),
}));

export const carbonCreditsRelations = relations(carbonCredits, ({ one }) => ({
  user: one(users, {
    fields: [carbonCredits.userId],
    references: [users.id],
  }),
  verifier: one(users, {
    fields: [carbonCredits.verifiedBy],
    references: [users.id],
  }),
}));

export const sustainabilityPracticesRelations = relations(sustainabilityPractices, ({ one }) => ({
  user: one(users, {
    fields: [sustainabilityPractices.userId],
    references: [users.id],
  }),
}));

export const sdgTrackingRelations = relations(sdgTracking, ({ one }) => ({
  user: one(users, {
    fields: [sdgTracking.userId],
    references: [users.id],
  }),
}));

// New insert schemas
export const insertUserWalletSchema = createInsertSchema(userWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertScheduledPaymentSchema = createInsertSchema(scheduledPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarketplaceListingSchema = createInsertSchema(marketplaceListings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
  favorites: true,
});

export const insertMarketplaceOrderSchema = createInsertSchema(marketplaceOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarketplaceBidSchema = createInsertSchema(marketplaceBids).omit({
  id: true,
  createdAt: true,
});

export const insertCommunityForumSchema = createInsertSchema(communityForums).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  memberCount: true,
  postCount: true,
});

export const insertForumMemberSchema = createInsertSchema(forumMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertForumPostSchema = createInsertSchema(forumPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
  likes: true,
  comments: true,
});

export const insertForumCommentSchema = createInsertSchema(forumComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  likes: true,
});

export const insertKnowledgeArticleSchema = createInsertSchema(knowledgeArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
  rating: true,
  reviewCount: true,
});

export const insertCommunityEventSchema = createInsertSchema(communityEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentAttendees: true,
});

export const insertEventAttendeeSchema = createInsertSchema(eventAttendees).omit({
  id: true,
  registeredAt: true,
});

export const insertImpactMetricSchema = createInsertSchema(impactMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertCarbonCreditSchema = createInsertSchema(carbonCredits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSustainabilityPracticeSchema = createInsertSchema(sustainabilityPractices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSdgTrackingSchema = createInsertSchema(sdgTracking).omit({
  id: true,
  createdAt: true,
});

// New types
export type UserWallet = typeof userWallets.$inferSelect;
export type InsertUserWallet = z.infer<typeof insertUserWalletSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type ScheduledPayment = typeof scheduledPayments.$inferSelect;
export type InsertScheduledPayment = z.infer<typeof insertScheduledPaymentSchema>;

export type MarketplaceListing = typeof marketplaceListings.$inferSelect;
export type InsertMarketplaceListing = z.infer<typeof insertMarketplaceListingSchema>;
export type MarketplaceOrder = typeof marketplaceOrders.$inferSelect;
export type InsertMarketplaceOrder = z.infer<typeof insertMarketplaceOrderSchema>;
export type MarketplaceBid = typeof marketplaceBids.$inferSelect;
export type InsertMarketplaceBid = z.infer<typeof insertMarketplaceBidSchema>;

export type CommunityForum = typeof communityForums.$inferSelect;
export type InsertCommunityForum = z.infer<typeof insertCommunityForumSchema>;
export type ForumMember = typeof forumMembers.$inferSelect;
export type InsertForumMember = z.infer<typeof insertForumMemberSchema>;
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type ForumComment = typeof forumComments.$inferSelect;
export type InsertForumComment = z.infer<typeof insertForumCommentSchema>;
export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;
export type InsertKnowledgeArticle = z.infer<typeof insertKnowledgeArticleSchema>;
export type CommunityEvent = typeof communityEvents.$inferSelect;
export type InsertCommunityEvent = z.infer<typeof insertCommunityEventSchema>;
export type EventAttendee = typeof eventAttendees.$inferSelect;
export type InsertEventAttendee = z.infer<typeof insertEventAttendeeSchema>;

export type ImpactMetric = typeof impactMetrics.$inferSelect;
export type InsertImpactMetric = z.infer<typeof insertImpactMetricSchema>;
export type CarbonCredit = typeof carbonCredits.$inferSelect;
export type InsertCarbonCredit = z.infer<typeof insertCarbonCreditSchema>;
export type SustainabilityPractice = typeof sustainabilityPractices.$inferSelect;
export type InsertSustainabilityPractice = z.infer<typeof insertSustainabilityPracticeSchema>;
export type SdgTracking = typeof sdgTracking.$inferSelect;
export type InsertSdgTracking = z.infer<typeof insertSdgTrackingSchema>;

// Admin automation and management tables
export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => users.id),
  action: text("action").notNull(), // 'approve_tontine', 'reject_price', 'suspend_user', 'override_automation'
  entityType: text("entity_type").notNull(), // 'tontine', 'price', 'user', 'post', 'payment'
  entityId: integer("entity_id"),
  details: json("details"), // JSON object with action-specific details
  automationLevel: text("automation_level").default("manual"), // 'manual', 'automated', 'override'
  decisionReason: text("decision_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const automationRules = pgTable("automation_rules", {
  id: serial("id").primaryKey(),
  ruleType: text("rule_type").notNull(), // 'tontine_approval', 'price_validation', 'user_moderation', 'content_filter'
  ruleName: text("rule_name").notNull(),
  description: text("description"),
  conditions: json("conditions").notNull(), // JSON object with rule conditions
  actions: json("actions").notNull(), // JSON array of actions to take
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(1), // Higher number = higher priority
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const automationExecutions = pgTable("automation_executions", {
  id: serial("id").primaryKey(),
  ruleId: integer("rule_id").references(() => automationRules.id),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  triggerData: json("trigger_data"), // Data that triggered the rule
  actionsTaken: json("actions_taken"), // Actions that were executed
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  executionTime: integer("execution_time"), // Time in milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminNotifications = pgTable("admin_notifications", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => users.id),
  type: text("type").notNull(), // 'pending_approval', 'automation_alert', 'system_alert', 'user_report'
  title: text("title").notNull(),
  message: text("message").notNull(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  priority: text("priority").default("medium"), // 'low', 'medium', 'high', 'urgent'
  isRead: boolean("is_read").default(false),
  actionRequired: boolean("action_required").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminDashboards = pgTable("admin_dashboards", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => users.id),
  dashboardType: text("dashboard_type").notNull(), // 'super_admin', 'moderator', 'analyst'
  layout: json("layout"), // Dashboard layout configuration
  widgets: json("widgets"), // Widget configurations
  preferences: json("preferences"), // User preferences
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  metricType: text("metric_type").notNull(), // 'user_growth', 'tontine_activity', 'revenue', 'automation_efficiency'
  metricName: text("metric_name").notNull(),
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  unit: text("unit"), // 'users', 'CFA', 'percentage', 'count'
  period: text("period").notNull(), // 'daily', 'weekly', 'monthly', 'yearly'
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  metadata: json("metadata"), // Additional metric data
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminWorkflows = pgTable("admin_workflows", {
  id: serial("id").primaryKey(),
  workflowType: text("workflow_type").notNull(), // 'tontine_approval', 'price_verification', 'user_suspension'
  name: text("name").notNull(),
  description: text("description"),
  steps: json("steps").notNull(), // Array of workflow steps
  currentStep: integer("current_step").default(0),
  status: text("status").default("pending"), // 'pending', 'in_progress', 'completed', 'cancelled'
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  assignedTo: integer("assigned_to").references(() => users.id),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminReports = pgTable("admin_reports", {
  id: serial("id").primaryKey(),
  reportType: text("report_type").notNull(), // 'user_activity', 'financial_summary', 'automation_performance'
  title: text("title").notNull(),
  description: text("description"),
  parameters: json("parameters"), // Report parameters
  data: json("data"), // Report data
  format: text("format").default("json"), // 'json', 'csv', 'pdf'
  generatedBy: integer("generated_by").references(() => users.id),
  status: text("status").default("generating"), // 'generating', 'completed', 'failed'
  fileUrl: text("file_url"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: json("setting_value").notNull(),
  description: text("description"),
  category: text("category").default("general"), // 'automation', 'security', 'notifications', 'billing'
  isPublic: boolean("is_public").default(false), // Whether non-admins can read this setting
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adminApiKeys = pgTable("admin_api_keys", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(),
  permissions: json("permissions"), // Array of allowed permissions
  createdBy: integer("created_by").references(() => users.id),
  lastUsed: timestamp("last_used"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminScheduledTasks = pgTable("admin_scheduled_tasks", {
  id: serial("id").primaryKey(),
  taskName: text("task_name").notNull(),
  taskType: text("task_type").notNull(), // 'automation_rule', 'report_generation', 'data_cleanup'
  schedule: text("schedule").notNull(), // Cron expression
  parameters: json("parameters"), // Task parameters
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  status: text("status").default("active"), // 'active', 'paused', 'completed'
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adminDataExports = pgTable("admin_data_exports", {
  id: serial("id").primaryKey(),
  exportType: text("export_type").notNull(), // 'user_data', 'tontine_data', 'financial_data'
  filters: json("filters"), // Export filters
  format: text("format").default("csv"), // 'csv', 'json', 'excel'
  status: text("status").default("pending"), // 'pending', 'processing', 'completed', 'failed'
  fileUrl: text("file_url"),
  fileSize: integer("file_size"),
  recordCount: integer("record_count"),
  requestedBy: integer("requested_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Enhanced user roles and permissions
export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  roleName: text("role_name").notNull().unique(), // 'super_admin', 'admin', 'moderator', 'analyst'
  displayName: text("display_name").notNull(),
  description: text("description"),
  permissions: json("permissions").notNull(), // Array of permission strings
  isSystem: boolean("is_system").default(false), // Whether this is a system role
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  permission: text("permission").notNull(), // Permission string
  grantedBy: integer("granted_by").references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
});

// Admin automation schema validation
export const insertAdminAuditLogSchema = createInsertSchema(adminAuditLogs);
export const insertAutomationRuleSchema = createInsertSchema(automationRules);
export const insertAutomationExecutionSchema = createInsertSchema(automationExecutions);
export const insertAdminNotificationSchema = createInsertSchema(adminNotifications);
export const insertAdminDashboardSchema = createInsertSchema(adminDashboards);
export const insertSystemMetricSchema = createInsertSchema(systemMetrics);
export const insertAdminWorkflowSchema = createInsertSchema(adminWorkflows);
export const insertAdminReportSchema = createInsertSchema(adminReports);
export const insertAdminSettingSchema = createInsertSchema(adminSettings);
export const insertAdminApiKeySchema = createInsertSchema(adminApiKeys);
export const insertAdminScheduledTaskSchema = createInsertSchema(adminScheduledTasks);
export const insertAdminDataExportSchema = createInsertSchema(adminDataExports);
export const insertUserRoleSchema = createInsertSchema(userRoles);
export const insertUserPermissionSchema = createInsertSchema(userPermissions);

// Admin automation type definitions
export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type InsertAdminAuditLog = z.infer<typeof insertAdminAuditLogSchema>;
export type AutomationRule = typeof automationRules.$inferSelect;
export type InsertAutomationRule = z.infer<typeof insertAutomationRuleSchema>;
export type AutomationExecution = typeof automationExecutions.$inferSelect;
export type InsertAutomationExecution = z.infer<typeof insertAutomationExecutionSchema>;
export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;
export type AdminDashboard = typeof adminDashboards.$inferSelect;
export type InsertAdminDashboard = z.infer<typeof insertAdminDashboardSchema>;
export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = z.infer<typeof insertSystemMetricSchema>;
export type AdminWorkflow = typeof adminWorkflows.$inferSelect;
export type InsertAdminWorkflow = z.infer<typeof insertAdminWorkflowSchema>;
export type AdminReport = typeof adminReports.$inferSelect;
export type InsertAdminReport = z.infer<typeof insertAdminReportSchema>;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;
export type AdminApiKey = typeof adminApiKeys.$inferSelect;
export type InsertAdminApiKey = z.infer<typeof insertAdminApiKeySchema>;
export type AdminScheduledTask = typeof adminScheduledTasks.$inferSelect;
export type InsertAdminScheduledTask = z.infer<typeof insertAdminScheduledTaskSchema>;
export type AdminDataExport = typeof adminDataExports.$inferSelect;
export type InsertAdminDataExport = z.infer<typeof insertAdminDataExportSchema>;
export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;

// Enhanced user role types
export type UserRoleType = 'user' | 'admin' | 'super_admin' | 'moderator' | 'analyst';
export type AutomationLevel = 'manual' | 'automated' | 'override';
export type AdminActionType = 'approve_tontine' | 'reject_price' | 'suspend_user' | 'override_automation' | 'system_alert';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type WorkflowStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type ReportStatus = 'generating' | 'completed' | 'failed';
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Login schemas
export const loginSchema = z.object({
  phone: z.string().min(8, "Phone number must be at least 8 digits"),
  pin: z.string().length(4).regex(/^\d+$/, "PIN must be 4 digits").optional(),
  password: z.string().min(1, "Password is required").optional(),
}).refine((data) => data.pin || data.password, {
  message: "Either PIN or password is required",
  path: ["pin"],
});

// Password change schema
export const changePasswordSchema = z.object({
  currentPin: z.string().length(4).regex(/^\d+$/, "Current PIN must be 4 digits").optional(),
  currentPassword: z.string().min(1, "Current password is required").optional(),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.currentPin || data.currentPassword, {
  message: "Either current PIN or current password is required",
  path: ["currentPin"],
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Set password schema (for users who only have PIN)
export const setPasswordSchema = z.object({
  currentPin: z.string().length(4).regex(/^\d+$/, "PIN must be 4 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
