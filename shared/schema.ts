import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  pin: text("pin").notNull(), // Hashed PIN
  name: text("name").notNull(),
  region: text("region").notNull(),
  plan: text("plan").default("free"), // 'free' or 'premium'
  role: text("role").default("user"), // 'user' or 'admin'
  balance: integer("balance").default(0),
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
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

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  tontinesAsLeader: many(tontines),
  tontineMembers: many(tontineMembers),
  tontinePayments: many(tontinePayments),
  marketPrices: many(marketPrices),
  communityPosts: many(communityPosts),
  sessions: many(userSessions),
}));

export const tontinesRelations = relations(tontines, ({ many, one }) => ({
  leader: one(users, {
    fields: [tontines.leaderId],
    references: [users.id],
  }),
  members: many(tontineMembers),
  payments: many(tontinePayments),
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
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
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
export type WeatherAlert = typeof weatherAlerts.$inferSelect;
export type UserSession = typeof userSessions.$inferSelect;
