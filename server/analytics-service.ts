import { supabaseAdmin, primaryDb } from './database-config.js';
import { users, tontines, marketPrices, communityPosts, supportTickets } from '../shared/schema.js';
import { eq, desc, and, gte, lte, count, avg, sum } from 'drizzle-orm';

export interface AnalyticsData {
  userMetrics: UserMetrics;
  tontineMetrics: TontineMetrics;
  marketMetrics: MarketMetrics;
  communityMetrics: CommunityMetrics;
  supportMetrics: SupportMetrics;
  timestamp: string;
}

export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  userGrowthRate: number;
  topRegions: Array<{ region: string; count: number }>;
  userRoles: Array<{ role: string; count: number }>;
}

export interface TontineMetrics {
  totalTontines: number;
  activeTontines: number;
  totalMembers: number;
  averageContribution: number;
  totalFunds: number;
  completionRate: number;
}

export interface MarketMetrics {
  totalPrices: number;
  verifiedPrices: number;
  averagePrice: number;
  topCrops: Array<{ crop: string; averagePrice: number; count: number }>;
  priceTrends: Array<{ date: string; averagePrice: number }>;
  regionalPrices: Array<{ region: string; averagePrice: number }>;
}

export interface CommunityMetrics {
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  engagementRate: number;
  topContributors: Array<{ userId: string; name: string; posts: number; likes: number }>;
  popularTopics: Array<{ topic: string; count: number }>;
}

export interface SupportMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
  ticketCategories: Array<{ category: string; count: number }>;
  satisfactionRate: number;
}

export class AnalyticsService {
  // Get comprehensive analytics
  static async getComprehensiveAnalytics(): Promise<AnalyticsData> {
    try {
      const [
        userMetrics,
        tontineMetrics,
        marketMetrics,
        communityMetrics,
        supportMetrics
      ] = await Promise.all([
        this.getUserMetrics(),
        this.getTontineMetrics(),
        this.getMarketMetrics(),
        this.getCommunityMetrics(),
        this.getSupportMetrics(),
      ]);

      return {
        userMetrics,
        tontineMetrics,
        marketMetrics,
        communityMetrics,
        supportMetrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Comprehensive analytics error:', error);
      throw error;
    }
  }

  // User analytics
  static async getUserMetrics(): Promise<UserMetrics> {
    try {
      // Get basic counts from primary database
      const totalUsers = await primaryDb.select({ count: count() }).from(users);
      const activeUsers = await primaryDb
        .select({ count: count() })
        .from(users)
        .where(eq(users.isActive, true));

      // Get detailed analytics from Supabase
      const { data: userAnalytics, error } = await supabaseAdmin
        .from('user_analytics')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Calculate growth rate
      const newUsersThisMonth = userAnalytics?.filter(
        (ua: any) => ua.action === 'user_registered'
      ).length || 0;

      const userGrowthRate = totalUsers[0]?.count ? 
        (newUsersThisMonth / totalUsers[0].count) * 100 : 0;

      // Get regional distribution
      const { data: regionalData } = await supabaseAdmin
        .from('user_analytics')
        .select('region, count')
        .eq('action', 'user_registered')
        .group('region');

      // Get role distribution
      const { data: roleData } = await supabaseAdmin
        .from('user_analytics')
        .select('role, count')
        .eq('action', 'user_registered')
        .group('role');

      return {
        totalUsers: totalUsers[0]?.count || 0,
        activeUsers: activeUsers[0]?.count || 0,
        newUsersThisMonth,
        userGrowthRate,
        topRegions: regionalData || [],
        userRoles: roleData || [],
      };
    } catch (error) {
      console.error('User metrics error:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        userGrowthRate: 0,
        topRegions: [],
        userRoles: [],
      };
    }
  }

  // Tontine analytics
  static async getTontineMetrics(): Promise<TontineMetrics> {
    try {
      // Get basic counts from primary database
      const totalTontines = await primaryDb.select({ count: count() }).from(tontines);
      const activeTontines = await primaryDb
        .select({ count: count() })
        .from(tontines)
        .where(eq(tontines.isActive, true));

      // Get detailed analytics from Supabase
      const { data: tontineAnalytics, error } = await supabaseAdmin
        .from('tontine_analytics')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Calculate metrics
      const totalMembers = tontineAnalytics?.reduce((sum: number, ta: any) => sum + (ta.member_count || 0), 0) || 0;
      const totalFunds = tontineAnalytics?.reduce((sum: number, ta: any) => sum + (ta.total_funds || 0), 0) || 0;
      const averageContribution = totalMembers > 0 ? totalFunds / totalMembers : 0;

      // Calculate completion rate
      const completedTontines = tontineAnalytics?.filter((ta: any) => ta.status === 'completed').length || 0;
      const completionRate = totalTontines[0]?.count ? (completedTontines / totalTontines[0].count) * 100 : 0;

      return {
        totalTontines: totalTontines[0]?.count || 0,
        activeTontines: activeTontines[0]?.count || 0,
        totalMembers,
        averageContribution,
        totalFunds,
        completionRate,
      };
    } catch (error) {
      console.error('Tontine metrics error:', error);
      return {
        totalTontines: 0,
        activeTontines: 0,
        totalMembers: 0,
        averageContribution: 0,
        totalFunds: 0,
        completionRate: 0,
      };
    }
  }

  // Market analytics
  static async getMarketMetrics(): Promise<MarketMetrics> {
    try {
      // Get basic counts from primary database
      const totalPrices = await primaryDb.select({ count: count() }).from(marketPrices);
      const verifiedPrices = await primaryDb
        .select({ count: count() })
        .from(marketPrices)
        .where(eq(marketPrices.isVerified, true));

      // Get detailed analytics from Supabase
      const { data: marketAnalytics, error } = await supabaseAdmin
        .from('market_analytics')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Calculate average price
      const averagePrice = marketAnalytics?.length > 0 ?
        marketAnalytics.reduce((sum: number, ma: any) => sum + (ma.price || 0), 0) / marketAnalytics.length : 0;

      // Get top crops
      const cropStats = marketAnalytics?.reduce((acc: any, ma: any) => {
        if (!acc[ma.crop]) {
          acc[ma.crop] = { total: 0, count: 0 };
        }
        acc[ma.crop].total += ma.price || 0;
        acc[ma.crop].count += 1;
        return acc;
      }, {});

      const topCrops = Object.entries(cropStats || {}).map(([crop, stats]: [string, any]) => ({
        crop,
        averagePrice: stats.count > 0 ? stats.total / stats.count : 0,
        count: stats.count,
      })).sort((a, b) => b.averagePrice - a.averagePrice).slice(0, 10);

      // Get price trends (last 7 days)
      const { data: trendData } = await supabaseAdmin
        .from('market_analytics')
        .select('created_at, price')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at');

      const priceTrends = this.calculatePriceTrends(trendData || []);

      // Get regional prices
      const { data: regionalData } = await supabaseAdmin
        .from('market_analytics')
        .select('region, price')
        .group('region');

      const regionalPrices = regionalData?.map((rd: any) => ({
        region: rd.region,
        averagePrice: rd.avg_price || 0,
      })) || [];

      return {
        totalPrices: totalPrices[0]?.count || 0,
        verifiedPrices: verifiedPrices[0]?.count || 0,
        averagePrice,
        topCrops,
        priceTrends,
        regionalPrices,
      };
    } catch (error) {
      console.error('Market metrics error:', error);
      return {
        totalPrices: 0,
        verifiedPrices: 0,
        averagePrice: 0,
        topCrops: [],
        priceTrends: [],
        regionalPrices: [],
      };
    }
  }

  // Community analytics
  static async getCommunityMetrics(): Promise<CommunityMetrics> {
    try {
      // Get basic counts from primary database
      const totalPosts = await primaryDb.select({ count: count() }).from(communityPosts);
      const totalComments = await primaryDb.select({ count: count() }).from(communityPosts);

      // Get detailed analytics from Supabase
      const { data: communityAnalytics, error } = await supabaseAdmin
        .from('community_analytics')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Calculate engagement rate
      const totalLikes = communityAnalytics?.reduce((sum: number, ca: any) => sum + (ca.likes || 0), 0) || 0;
      const engagementRate = totalPosts[0]?.count ? (totalLikes / totalPosts[0].count) : 0;

      // Get top contributors
      const { data: contributorData } = await supabaseAdmin
        .from('community_analytics')
        .select('user_id, user_name, posts, likes')
        .order('posts', { ascending: false })
        .limit(10);

      const topContributors = contributorData || [];

      // Get popular topics
      const { data: topicData } = await supabaseAdmin
        .from('community_analytics')
        .select('topic, count')
        .group('topic')
        .order('count', { ascending: false })
        .limit(10);

      const popularTopics = topicData || [];

      return {
        totalPosts: totalPosts[0]?.count || 0,
        totalComments: totalComments[0]?.count || 0,
        totalLikes,
        engagementRate,
        topContributors,
        popularTopics,
      };
    } catch (error) {
      console.error('Community metrics error:', error);
      return {
        totalPosts: 0,
        totalComments: 0,
        totalLikes: 0,
        engagementRate: 0,
        topContributors: [],
        popularTopics: [],
      };
    }
  }

  // Support analytics
  static async getSupportMetrics(): Promise<SupportMetrics> {
    try {
      // Get basic counts from primary database
      const totalTickets = await primaryDb.select({ count: count() }).from(supportTickets);
      const openTickets = await primaryDb
        .select({ count: count() })
        .from(supportTickets)
        .where(eq(supportTickets.status, 'open'));

      // Get detailed analytics from Supabase
      const { data: supportAnalytics, error } = await supabaseAdmin
        .from('support_analytics')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Calculate metrics
      const resolvedTickets = supportAnalytics?.filter((sa: any) => sa.status === 'resolved').length || 0;
      const averageResolutionTime = supportAnalytics?.length > 0 ?
        supportAnalytics.reduce((sum: number, sa: any) => sum + (sa.resolution_time || 0), 0) / supportAnalytics.length : 0;

      // Get ticket categories
      const { data: categoryData } = await supabaseAdmin
        .from('support_analytics')
        .select('category, count')
        .group('category');

      const ticketCategories = categoryData || [];

      // Calculate satisfaction rate
      const satisfiedTickets = supportAnalytics?.filter((sa: any) => sa.satisfaction_score >= 4).length || 0;
      const satisfactionRate = supportAnalytics?.length > 0 ? (satisfiedTickets / supportAnalytics.length) * 100 : 0;

      return {
        totalTickets: totalTickets[0]?.count || 0,
        openTickets: openTickets[0]?.count || 0,
        resolvedTickets,
        averageResolutionTime,
        ticketCategories,
        satisfactionRate,
      };
    } catch (error) {
      console.error('Support metrics error:', error);
      return {
        totalTickets: 0,
        openTickets: 0,
        resolvedTickets: 0,
        averageResolutionTime: 0,
        ticketCategories: [],
        satisfactionRate: 0,
      };
    }
  }

  // Calculate price trends
  private static calculatePriceTrends(data: any[]): Array<{ date: string; averagePrice: number }> {
    const dailyPrices: { [key: string]: number[] } = {};

    data.forEach((item: any) => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      if (!dailyPrices[date]) {
        dailyPrices[date] = [];
      }
      dailyPrices[date].push(item.price);
    });

    return Object.entries(dailyPrices).map(([date, prices]) => ({
      date,
      averagePrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  // Get real-time analytics
  static async getRealTimeAnalytics() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const { data: realTimeData, error } = await supabaseAdmin
        .from('real_time_analytics')
        .select('*')
        .gte('timestamp', oneHourAgo.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      return {
        activeUsers: realTimeData?.filter((rt: any) => rt.action === 'user_active').length || 0,
        newPosts: realTimeData?.filter((rt: any) => rt.action === 'post_created').length || 0,
        newPrices: realTimeData?.filter((rt: any) => rt.action === 'price_added').length || 0,
        newTickets: realTimeData?.filter((rt: any) => rt.action === 'ticket_created').length || 0,
        timestamp: now.toISOString(),
      };
    } catch (error) {
      console.error('Real-time analytics error:', error);
      return {
        activeUsers: 0,
        newPosts: 0,
        newPrices: 0,
        newTickets: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Export analytics data
  static async exportAnalyticsData(format: 'json' | 'csv' = 'json') {
    try {
      const analytics = await this.getComprehensiveAnalytics();

      if (format === 'csv') {
        return this.convertToCSV(analytics);
      }

      return analytics;
    } catch (error) {
      console.error('Export analytics error:', error);
      throw error;
    }
  }

  // Convert analytics to CSV
  private static convertToCSV(analytics: AnalyticsData): string {
    const csvLines = [
      'Metric,Value,Timestamp',
      `Total Users,${analytics.userMetrics.totalUsers},${analytics.timestamp}`,
      `Active Users,${analytics.userMetrics.activeUsers},${analytics.timestamp}`,
      `Total Tontines,${analytics.tontineMetrics.totalTontines},${analytics.timestamp}`,
      `Total Market Prices,${analytics.marketMetrics.totalPrices},${analytics.timestamp}`,
      `Total Community Posts,${analytics.communityMetrics.totalPosts},${analytics.timestamp}`,
      `Total Support Tickets,${analytics.supportMetrics.totalTickets},${analytics.timestamp}`,
    ];

    return csvLines.join('\n');
  }
} 