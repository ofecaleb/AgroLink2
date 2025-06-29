import { 
  users, 
  tontines, 
  tontineMembers, 
  tontinePayments, 
  marketPrices, 
  communityPosts, 
  communityComments,
  communityLikes,
  supportTickets,
  tontineInvites,
  weatherAlerts, 
  userSessions,
  type User, 
  type InsertUser,
  type Tontine,
  type InsertTontine,
  type TontineMember,
  type TontinePayment,
  type InsertTontinePayment,
  type MarketPrice,
  type InsertMarketPrice,
  type CommunityPost,
  type InsertCommunityPost,
  type CommunityComment,
  type InsertCommunityComment,
  type SupportTicket,
  type InsertSupportTicket,
  type TontineInvite,
  type InsertTontineInvite,
  type WeatherAlert,
  type UserSession
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  updateUserLastActive(id: number): Promise<void>;
  
  // Session management
  createSession(userId: number, sessionToken: string, expiresAt: Date): Promise<UserSession>;
  getSession(sessionToken: string): Promise<UserSession | undefined>;
  deleteSession(sessionToken: string): Promise<void>;
  
  // Tontine management
  createTontine(tontine: InsertTontine): Promise<Tontine>;
  getTontinesByUser(userId: number): Promise<Tontine[]>;
  getTontineWithMembers(tontineId: number): Promise<any>;
  joinTontine(tontineId: number, userId: number): Promise<TontineMember>;
  
  // Tontine invites
  createTontineInvite(invite: InsertTontineInvite): Promise<TontineInvite>;
  getTontineByInviteCode(code: string): Promise<Tontine | undefined>;
  useTontineInvite(code: string): Promise<void>;
  
  // Tontine payments
  createTontinePayment(payment: InsertTontinePayment): Promise<TontinePayment>;
  getTontinePayments(tontineId: number): Promise<TontinePayment[]>;
  updatePaymentStatus(paymentId: number, status: string, transactionId?: string): Promise<void>;
  
  // Market prices
  createMarketPrice(price: InsertMarketPrice): Promise<MarketPrice>;
  getMarketPrices(region: string): Promise<MarketPrice[]>;
  verifyMarketPrice(priceId: number, verifiedBy: number): Promise<void>;
  
  // Community posts
  createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost>;
  getCommunityPosts(region: string, limit?: number): Promise<any[]>;
  
  // Community interactions
  createCommunityComment(comment: InsertCommunityComment): Promise<CommunityComment>;
  getPostComments(postId: number): Promise<any[]>;
  likePost(postId: number, userId: number): Promise<void>;
  unlikePost(postId: number, userId: number): Promise<void>;
  
  // Support tickets
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTickets(userId: number): Promise<SupportTicket[]>;
  getAllSupportTickets(): Promise<SupportTicket[]>;
  updateSupportTicket(id: number, data: Partial<SupportTicket>): Promise<SupportTicket>;
  
  // Weather alerts
  getActiveWeatherAlerts(region: string): Promise<WeatherAlert[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserLastActive(id: number): Promise<void> {
    await db
      .update(users)
      .set({ lastActive: new Date() })
      .where(eq(users.id, id));
  }

  async createSession(userId: number, sessionToken: string, expiresAt: Date): Promise<UserSession> {
    const [session] = await db
      .insert(userSessions)
      .values({ userId, sessionToken, expiresAt })
      .returning();
    return session;
  }

  async getSession(sessionToken: string): Promise<UserSession | undefined> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.sessionToken, sessionToken));
    return session || undefined;
  }

  async deleteSession(sessionToken: string): Promise<void> {
    await db
      .delete(userSessions)
      .where(eq(userSessions.sessionToken, sessionToken));
  }

  async createTontine(insertTontine: InsertTontine): Promise<Tontine> {
    const [tontine] = await db
      .insert(tontines)
      .values(insertTontine)
      .returning();
    return tontine;
  }

  async getTontinesByUser(userId: number): Promise<Tontine[]> {
    const result = await db
      .select({
        id: tontines.id,
        name: tontines.name,
        leaderId: tontines.leaderId,
        monthlyContribution: tontines.monthlyContribution,
        totalContributions: tontines.totalContributions,
        currentPayoutTurn: tontines.currentPayoutTurn,
        nextPayoutDate: tontines.nextPayoutDate,
        status: tontines.status,
        region: tontines.region,
        createdAt: tontines.createdAt,
      })
      .from(tontines)
      .innerJoin(tontineMembers, eq(tontines.id, tontineMembers.tontineId))
      .where(eq(tontineMembers.userId, userId));
    return result;
  }

  async getTontineWithMembers(tontineId: number): Promise<any> {
    const tontineData = await db
      .select({
        tontine: tontines,
        member: tontineMembers,
        user: users
      })
      .from(tontines)
      .leftJoin(tontineMembers, eq(tontines.id, tontineMembers.tontineId))
      .leftJoin(users, eq(tontineMembers.userId, users.id))
      .where(eq(tontines.id, tontineId));

    if (tontineData.length === 0) return null;

    const tontine = tontineData[0].tontine;
    const members = tontineData
      .filter((row: { member: any; user: any }) => row.member && row.user)
      .map((row: { member: any; user: any }) => ({
        ...row.member,
        user: row.user
      }));

    return { ...tontine, members };
  }

  async joinTontine(tontineId: number, userId: number): Promise<TontineMember> {
    // Get current member count to assign payout position
    const memberCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(tontineMembers)
      .where(eq(tontineMembers.tontineId, tontineId));

    const [member] = await db
      .insert(tontineMembers)
      .values({
        tontineId,
        userId,
        payoutPosition: memberCount[0].count + 1
      })
      .returning();
    return member;
  }

  async createTontinePayment(payment: InsertTontinePayment): Promise<TontinePayment> {
    const [tontinePayment] = await db
      .insert(tontinePayments)
      .values(payment)
      .returning();
    return tontinePayment;
  }

  async getTontinePayments(tontineId: number): Promise<TontinePayment[]> {
    return await db
      .select()
      .from(tontinePayments)
      .where(eq(tontinePayments.tontineId, tontineId))
      .orderBy(desc(tontinePayments.createdAt));
  }

  async updatePaymentStatus(paymentId: number, status: string, transactionId?: string): Promise<void> {
    await db
      .update(tontinePayments)
      .set({ status, transactionId })
      .where(eq(tontinePayments.id, paymentId));
  }

  async createMarketPrice(price: InsertMarketPrice): Promise<MarketPrice> {
    const [marketPrice] = await db
      .insert(marketPrices)
      .values(price)
      .returning();
    return marketPrice;
  }

  async getMarketPrices(region: string): Promise<MarketPrice[]> {
    return await db
      .select()
      .from(marketPrices)
      .where(and(
        eq(marketPrices.region, region),
        eq(marketPrices.isVerified, true)
      ))
      .orderBy(desc(marketPrices.createdAt));
  }

  async verifyMarketPrice(priceId: number, verifiedBy: number): Promise<void> {
    await db
      .update(marketPrices)
      .set({ isVerified: true, verifiedBy })
      .where(eq(marketPrices.id, priceId));
  }

  async createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost> {
    const [communityPost] = await db
      .insert(communityPosts)
      .values(post)
      .returning();
    return communityPost;
  }

  async getCommunityPosts(region: string, limit: number = 20): Promise<any[]> {
    const postsWithCounts = await db
      .select({
        post: communityPosts,
        user: users,
        likesCount: sql<number>`(SELECT COUNT(*) FROM ${communityLikes} WHERE ${communityLikes.postId} = ${communityPosts.id})`,
        commentsCount: sql<number>`(SELECT COUNT(*) FROM ${communityComments} WHERE ${communityComments.postId} = ${communityPosts.id})`
      })
      .from(communityPosts)
      .innerJoin(users, eq(communityPosts.userId, users.id))
      .where(eq(communityPosts.region, region))
      .orderBy(desc(communityPosts.createdAt))
      .limit(limit);

    return postsWithCounts.map((row: { post: any; user: any; likesCount: number; commentsCount: number }) => ({
      post: {
        ...row.post,
        likes: row.likesCount,
        comments: row.commentsCount
      },
      user: row.user
    }));
  }

  async createTontineInvite(invite: InsertTontineInvite): Promise<TontineInvite> {
    const [tontineInvite] = await db
      .insert(tontineInvites)
      .values(invite)
      .returning();
    return tontineInvite;
  }

  async getTontineByInviteCode(code: string): Promise<Tontine | undefined> {
    const [result] = await db
      .select({ tontine: tontines })
      .from(tontineInvites)
      .innerJoin(tontines, eq(tontineInvites.tontineId, tontines.id))
      .where(and(
        eq(tontineInvites.inviteCode, code),
        eq(tontineInvites.isActive, true)
      ));
    return result?.tontine;
  }

  async useTontineInvite(code: string): Promise<void> {
    await db
      .update(tontineInvites)
      .set({ 
        currentUses: sql`${tontineInvites.currentUses} + 1`
      })
      .where(eq(tontineInvites.inviteCode, code));
  }

  async createCommunityComment(comment: InsertCommunityComment): Promise<CommunityComment> {
    const [communityComment] = await db
      .insert(communityComments)
      .values(comment)
      .returning();
    return communityComment;
  }

  async getPostComments(postId: number): Promise<any[]> {
    return await db
      .select({
        comment: communityComments,
        user: users
      })
      .from(communityComments)
      .innerJoin(users, eq(communityComments.userId, users.id))
      .where(eq(communityComments.postId, postId))
      .orderBy(desc(communityComments.createdAt));
  }

  async likePost(postId: number, userId: number): Promise<void> {
    await db
      .insert(communityLikes)
      .values({ postId, userId })
      .onConflictDoNothing();
  }

  async unlikePost(postId: number, userId: number): Promise<void> {
    await db
      .delete(communityLikes)
      .where(and(
        eq(communityLikes.postId, postId),
        eq(communityLikes.userId, userId)
      ));
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const [supportTicket] = await db
      .insert(supportTickets)
      .values(ticket)
      .returning();
    return supportTicket;
  }

  async getSupportTickets(userId: number): Promise<SupportTicket[]> {
    return await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(desc(supportTickets.createdAt));
  }

  async getAllSupportTickets(): Promise<SupportTicket[]> {
    return await db
      .select()
      .from(supportTickets)
      .orderBy(desc(supportTickets.createdAt));
  }

  async updateSupportTicket(id: number, data: Partial<SupportTicket>): Promise<SupportTicket> {
    const [ticket] = await db
      .update(supportTickets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(supportTickets.id, id))
      .returning();
    return ticket;
  }

  async getActiveWeatherAlerts(region: string): Promise<WeatherAlert[]> {
    return await db
      .select()
      .from(weatherAlerts)
      .where(and(
        eq(weatherAlerts.region, region),
        eq(weatherAlerts.isActive, true)
      ))
      .orderBy(desc(weatherAlerts.createdAt));
  }
}

export const storage = new DatabaseStorage();
