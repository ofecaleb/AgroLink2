import { 
  users, 
  tontines, 
  tontineMembers, 
  tontinePayments, 
  marketPrices, 
  communityPosts, 
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
  type WeatherAlert,
  type UserSession
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
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
      .filter(row => row.member && row.user)
      .map(row => ({
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
    return await db
      .select({
        post: communityPosts,
        user: users
      })
      .from(communityPosts)
      .innerJoin(users, eq(communityPosts.userId, users.id))
      .where(eq(communityPosts.region, region))
      .orderBy(desc(communityPosts.createdAt))
      .limit(limit);
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
