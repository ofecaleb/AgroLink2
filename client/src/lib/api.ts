import { supabase } from './supabase';
import type { AuthUser } from './auth';

export class ApiService {
  // User Management
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  static async updateUserProfile(updates: Partial<AuthUser>): Promise<{ user?: AuthUser; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { error: 'No authenticated user' };
      }

      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { user: data };
    } catch (error: any) {
      return { error: error.message || 'Failed to update profile' };
    }
  }

  // Tontine Management
  static async getTontines(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tontines')
        .select(`
          *,
          leader:users!tontines_leader_id_fkey(name, phone),
          members:tontine_members(
            *,
            user:users(name, phone, avatar_url)
          )
        `)
        .or(`leader_id.eq.${user.id},id.in.(${await this.getUserTontineIds(user.id)})`);

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error fetching tontines:', error);
      throw new Error(error.message || 'Failed to fetch tontines');
    }
  }

  private static async getUserTontineIds(userId: string): Promise<string> {
    const { data } = await supabase
      .from('tontine_members')
      .select('tontine_id')
      .eq('user_id', userId);

    return data?.map(m => m.tontine_id).join(',') || '';
  }

  static async createTontine(tontineData: any): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tontines')
        .insert({
          ...tontineData,
          leader_id: user.id,
          status: 'pending',
          current_members: 1,
          total_contributions: 0,
          current_payout_turn: 0
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as first member
      await supabase
        .from('tontine_members')
        .insert({
          tontine_id: data.id,
          user_id: user.id,
          payout_position: 1,
          has_paid_current_month: false,
          total_contributed: 0
        });

      return data;
    } catch (error: any) {
      console.error('Error creating tontine:', error);
      throw new Error(error.message || 'Failed to create tontine');
    }
  }

  // Market Prices
  static async getMarketPrices(region?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('market_prices')
        .select(`
          *,
          submitted_by_user:users!market_prices_submitted_by_fkey(name, phone),
          verified_by_user:users!market_prices_verified_by_fkey(name, phone)
        `)
        .order('created_at', { ascending: false });

      if (region) {
        query = query.eq('region', region);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error fetching market prices:', error);
      throw new Error(error.message || 'Failed to fetch market prices');
    }
  }

  static async createMarketPrice(priceData: any): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('market_prices')
        .insert({
          ...priceData,
          submitted_by: user.id,
          is_verified: false
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Error creating market price:', error);
      throw new Error(error.message || 'Failed to submit market price');
    }
  }

  // Community Posts
  static async getCommunityPosts(region?: string, limit?: number): Promise<any[]> {
    try {
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          user:users(id, name, phone, avatar_url, region),
          comments:community_comments(
            *,
            user:users(name, avatar_url)
          ),
          likes:community_likes(user_id)
        `)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (region) {
        query = query.eq('region', region);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error fetching community posts:', error);
      throw new Error(error.message || 'Failed to fetch community posts');
    }
  }

  static async createCommunityPost(postData: { content: string }): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const currentUser = await this.getCurrentUser();
      if (!currentUser) throw new Error('User profile not found');

      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          content: postData.content,
          region: currentUser.region,
          likes: 0,
          comments: 0,
          is_approved: true // Auto-approve for now
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Error creating community post:', error);
      throw new Error(error.message || 'Failed to create post');
    }
  }

  // Weather Data
  static async getCurrentWeather(region?: string): Promise<any> {
    try {
      // Mock weather data for now - replace with actual weather API
      return {
        temperature: 28,
        condition: 'Partly Cloudy',
        humidity: 65,
        windSpeed: 12,
        visibility: 10,
        feelsLike: 31,
        location: region || 'Your Region',
        uvIndex: 7
      };
    } catch (error: any) {
      console.error('Error fetching weather:', error);
      throw new Error(error.message || 'Failed to fetch weather data');
    }
  }

  static async getWeatherAlerts(region?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('weather_alerts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (region) {
        query = query.eq('region', region);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error fetching weather alerts:', error);
      throw new Error(error.message || 'Failed to fetch weather alerts');
    }
  }

  // Support Tickets
  static async createSupportTicket(ticketData: any): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: ticketData.subject,
          message: ticketData.message,
          category: ticketData.category,
          priority: ticketData.priority,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Error creating support ticket:', error);
      throw new Error(error.message || 'Failed to create support ticket');
    }
  }

  static async getSupportTickets(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error fetching support tickets:', error);
      throw new Error(error.message || 'Failed to fetch support tickets');
    }
  }

  // Admin Functions (for super_admin role)
  static async getAdminStats(): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      // Check if user is admin
      const currentUser = await this.getCurrentUser();
      if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
        throw new Error('Admin access required');
      }

      // Get various stats
      const [usersCount, tontinesCount, postsCount, ticketsCount] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('tontines').select('id', { count: 'exact', head: true }),
        supabase.from('community_posts').select('id', { count: 'exact', head: true }),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true })
      ]);

      return {
        totalUsers: usersCount.count || 0,
        activeTontines: tontinesCount.count || 0,
        totalPosts: postsCount.count || 0,
        totalTickets: ticketsCount.count || 0,
        totalRevenue: 0, // Calculate based on actual transactions
        premiumUsers: 0 // Calculate based on user plans
      };
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
      throw new Error(error.message || 'Failed to fetch admin stats');
    }
  }

  static async getPendingTontines(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('tontines')
        .select(`
          *,
          leader:users!tontines_leader_id_fkey(name, phone),
          members:tontine_members(
            *,
            user:users(name, phone)
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error fetching pending tontines:', error);
      throw new Error(error.message || 'Failed to fetch pending tontines');
    }
  }

  static async getPendingPrices(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('market_prices')
        .select(`
          *,
          submitted_by_user:users!market_prices_submitted_by_fkey(name, phone)
        `)
        .eq('is_verified', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error fetching pending prices:', error);
      throw new Error(error.message || 'Failed to fetch pending prices');
    }
  }

  static async getSuspendedUsers(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error fetching suspended users:', error);
      throw new Error(error.message || 'Failed to fetch suspended users');
    }
  }

  static async getFlaggedPosts(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          user:users(name, phone, region)
        `)
        .eq('is_flagged', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error fetching flagged posts:', error);
      throw new Error(error.message || 'Failed to fetch flagged posts');
    }
  }

  static async adminAction(type: string, id: number, action: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      // Check admin permissions
      const currentUser = await this.getCurrentUser();
      if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
        throw new Error('Admin access required');
      }

      let updateData: any = {};
      let tableName = '';

      switch (type) {
        case 'tontine':
          tableName = 'tontines';
          updateData = {
            status: action === 'approve' ? 'active' : 'rejected',
            ...(action === 'approve' ? { approved_by: user.id, approved_at: new Date().toISOString() } : 
                { rejected_by: user.id, rejected_at: new Date().toISOString() })
          };
          break;
        case 'price':
          tableName = 'market_prices';
          updateData = {
            is_verified: action === 'approve',
            ...(action === 'approve' ? { verified_by: user.id, verified_at: new Date().toISOString() } : {})
          };
          break;
        case 'user':
          tableName = 'users';
          updateData = {
            is_active: action === 'unsuspend'
          };
          break;
        case 'post':
          tableName = 'community_posts';
          updateData = {
            is_approved: action === 'approve',
            is_flagged: false
          };
          break;
        default:
          throw new Error('Invalid action type');
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Log admin action
      await supabase
        .from('admin_audit_logs')
        .insert({
          admin_id: user.id,
          action: `${action}_${type}`,
          entity_type: type,
          entity_id: id,
          details: { action, type, timestamp: new Date().toISOString() }
        });

    } catch (error: any) {
      console.error('Error performing admin action:', error);
      throw new Error(error.message || 'Failed to perform admin action');
    }
  }

  // Support Ticket Management (Admin)
  static async getAllSupportTickets(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const currentUser = await this.getCurrentUser();
      if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
        throw new Error('Admin access required');
      }

      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          user:users(name, phone, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error fetching all support tickets:', error);
      throw new Error(error.message || 'Failed to fetch support tickets');
    }
  }

  static async updateSupportTicket(id: number, updates: any): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('support_tickets')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          ...(updates.status === 'resolved' ? { resolved_at: new Date().toISOString() } : {})
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Error updating support ticket:', error);
      throw new Error(error.message || 'Failed to update support ticket');
    }
  }

  // Premium Plan Management
  static async getPremiumPlans(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .like('setting_key', 'premium_plan_%')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error fetching premium plans:', error);
      throw new Error(error.message || 'Failed to fetch premium plans');
    }
  }

  static async createPremiumPlan(planData: any): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('admin_settings')
        .insert({
          setting_key: `premium_plan_${planData.name}`,
          setting_value: planData,
          description: planData.description,
          category: 'premium',
          is_public: true,
          updated_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Error creating premium plan:', error);
      throw new Error(error.message || 'Failed to create premium plan');
    }
  }

  static async updatePremiumPlan(key: string, planData: any): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('admin_settings')
        .update({
          setting_value: planData,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', key)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Error updating premium plan:', error);
      throw new Error(error.message || 'Failed to update premium plan');
    }
  }

  static async deactivatePremiumPlan(key: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .delete()
        .eq('setting_key', key)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Error deactivating premium plan:', error);
      throw new Error(error.message || 'Failed to deactivate premium plan');
    }
  }
}