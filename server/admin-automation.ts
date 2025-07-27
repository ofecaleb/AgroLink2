import { storage } from "./storage.js";
import { 
  AutomationRule, 
  AutomationExecution, 
  AdminAuditLog,
  SystemMetric,
  AdminNotification,
  User,
  Tontine,
  MarketPrice,
  CommunityPost,
  AdminActionType,
  AutomationLevel,
  NotificationPriority
} from "../shared/schema.js";

// Add Json type definition
type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

// Add SystemOverview type
interface SystemOverview {
  totalUsers: number;
  activeUsers: number;
  totalTontines: number;
  activeTontines: number;
  totalPosts: number;
  pendingPosts: number;
  totalPayments: number;
  recentPayments: any[];
  activeRules: number;
  recentExecutions: AutomationExecution[];
  activeRuleTypes: string[];
}

export class AdminAutomationEngine {
  private static instance: AdminAutomationEngine;
  private rules: Map<string, AutomationRule[]> = new Map();
  private isInitialized = false;

  private constructor() {}

  static getInstance(): AdminAutomationEngine {
    if (!AdminAutomationEngine.instance) {
      AdminAutomationEngine.instance = new AdminAutomationEngine();
    }
    return AdminAutomationEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load all active automation rules
      const rules = await storage.getActiveAutomationRules();
      this.rules.clear();
      
      for (const rule of rules) {
        if (!this.rules.has(rule.ruleType)) {
          this.rules.set(rule.ruleType, []);
        }
        this.rules.get(rule.ruleType)!.push(rule);
      }

      // Sort rules by priority (higher priority first)
      for (const [ruleType, ruleList] of this.rules) {
        ruleList.sort((a: AutomationRule, b: AutomationRule) => (b.priority || 1) - (a.priority || 1));
      }

      this.isInitialized = true;
      console.log(`[AdminAutomation] Initialized with ${rules.length} active rules`);
    } catch (error) {
      console.error('[AdminAutomation] Initialization failed:', error);
      throw error;
    }
  }

  async executeRules(ruleType: string, entityType: string, entityId: number, triggerData: any): Promise<AutomationExecution[]> {
    const executions: AutomationExecution[] = [];
    const ruleList = this.rules.get(ruleType) || [];
    
    // Sort by priority (highest first)
    ruleList.sort((a, b) => (b.priority || 1) - (a.priority || 1));

    for (const rule of ruleList) {
      if (!rule.isActive) continue;

      const startTime = Date.now();
      try {
        const conditions = rule.conditions as any[];
        const actions = rule.actions as any[];
        if (!Array.isArray(conditions)) continue;

        const isTriggered = await this.evaluateConditions(conditions, triggerData);
        if (!isTriggered) continue;

        const actionsTaken = await this.executeActions(actions, entityType, entityId, triggerData);
        
        const execution = {
          entityType,
          ruleId: rule.id,
          entityId,
          triggerData: triggerData as Json,
          actionsTaken: actionsTaken as Json,
          success: true,
          executionTime: Date.now() - startTime,
          createdAt: new Date()
        };

        const savedExecution = await storage.createAutomationExecution(execution);
        executions.push(savedExecution);

      } catch (error) {
        console.error(`Error executing rule ${rule.id}:`, error);
        
        const execution = {
          entityType,
          ruleId: rule.id,
          entityId,
          triggerData: triggerData as Json,
          actionsTaken: [] as Json,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          executionTime: Date.now() - startTime,
          createdAt: new Date()
        };

        const savedExecution = await storage.createAutomationExecution(execution);
        executions.push(savedExecution);
      }
    }

    return executions;
  }

  private async evaluateConditions(conditions: any, triggerData: any): Promise<boolean> {
    if (!conditions || typeof conditions !== 'object') {
      return true;
    }
    for (const [key, condition] of Object.entries(conditions)) {
      const value = this.getNestedValue(triggerData, key);
      if (typeof condition === 'object' && condition !== null && 'operator' in condition) {
        const op = (condition as any).operator;
        const condValue = (condition as any).value;
        if (op === 'equals' && value !== condValue) return false;
        if (op === 'not_equals' && value === condValue) return false;
        if (op === 'greater_than' && value <= condValue) return false;
        if (op === 'less_than' && value >= condValue) return false;
        if (op === 'contains' && !String(value).includes(condValue)) return false;
        if (op === 'in' && Array.isArray(condValue) && !condValue.includes(value)) return false;
      }
    }
    return true;
  }

  private async executeActions(actions: any[], entityType: string, entityId: number, triggerData: any): Promise<any[]> {
    const results = [];

    for (const action of actions) {
      try {
        let result;
        
        switch (action.type) {
          case 'approve_entity':
            result = await this.approveEntity(entityType, entityId, action.reason);
            break;
          case 'reject_entity':
            result = await this.rejectEntity(entityType, entityId, action.reason);
            break;
          case 'suspend_user':
            result = await this.suspendUser(entityId, action.duration, action.reason);
            break;
          case 'send_notification':
            result = await this.sendNotification(action.adminId, action.title, action.message, action.priority);
            break;
          case 'create_workflow':
            result = await this.createWorkflow(action.workflowType, entityType, entityId, action.steps);
            break;
          case 'update_setting':
            result = await this.updateSetting(action.key, action.value, action.description);
            break;
          case 'log_metric':
            result = await this.logMetric(action.metricType, action.metricName, action.value, action.unit);
            break;
          default:
            console.warn(`[AdminAutomation] Unknown action type: ${action.type}`);
            result = { success: false, error: 'Unknown action type' };
        }

        results.push({ action, result });
      } catch (error) {
        console.error(`[AdminAutomation] Action execution failed:`, error);
        results.push({ action, result: { success: false, error: error instanceof Error ? error.message : 'Unknown error' } });
      }
    }

    return results;
  }

  private async approveEntity(entityType: string, entityId: number, reason?: string): Promise<any> {
    switch (entityType) {
      case 'tontine':
        return await storage.updateTontine(entityId, { status: 'active' });
      case 'price':
        return await storage.updateMarketPrice(entityId, { isVerified: true });
      case 'post':
        return await storage.updateCommunityPost(entityId, {});
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  private async rejectEntity(entityType: string, entityId: number, reason?: string): Promise<any> {
    switch (entityType) {
      case 'tontine':
        return await storage.updateTontine(entityId, { status: 'rejected' });
      case 'price':
        return await storage.updateMarketPrice(entityId, { isVerified: false });
      case 'post':
        return await storage.updateCommunityPost(entityId, {});
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  private async suspendUser(userId: number, duration?: number, reason?: string): Promise<any> {
    // Remove suspensionReason if not in schema
    return await storage.updateUser(userId, {});
  }

  private async sendNotification(adminId: number, title: string, message: string, priority: NotificationPriority = 'medium'): Promise<any> {
    const notification = {
      adminId,
      type: 'automation_alert',
      title,
      message,
      priority,
      isRead: false,
      actionRequired: false,
      createdAt: new Date()
    };

    return await storage.createAdminNotification(notification);
  }

  private async createWorkflow(workflowType: string, entityType: string, entityId: number, steps: any[]): Promise<any> {
    const workflow = {
      workflowType,
      name: `${workflowType}_${entityType}_${entityId}`,
      description: `Automated workflow for ${entityType} ${entityId}`,
      steps,
      currentStep: 0,
      status: 'pending',
      entityType,
      entityId,
      startedAt: new Date(),
      createdAt: new Date()
    };

    return await storage.createAdminWorkflow(workflow);
  }

  private async updateSetting(key: string, value: any, description?: string): Promise<any> {
    const setting = {
      settingKey: key,
      settingValue: value,
      description,
      category: 'automation',
      isPublic: false,
      updatedAt: new Date()
    };

    return await storage.updateAdminSetting(key, setting);
  }

  private async logMetric(metricType: string, metricName: string, value: number, unit?: string): Promise<any> {
    const now = new Date();
    const metric = {
      metricType,
      metricName,
      value: value.toString(),
      unit,
      period: 'daily',
      periodStart: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      periodEnd: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
      metadata: {},
      createdAt: now
    };

    return await storage.createSystemMetric(metric);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private getActionTypeFromRule(ruleType: string): AdminActionType {
    const actionMap: Record<string, AdminActionType> = {
      'tontine_approval': 'approve_tontine',
      'price_validation': 'reject_price',
      'user_moderation': 'suspend_user',
      'content_filter': 'override_automation',
      'system_alert': 'system_alert'
    };
    
    return actionMap[ruleType] || 'override_automation';
  }

  async logAdminAction(
    adminId: number | null,
    action: AdminActionType,
    entityType: string,
    entityId: number,
    details: any,
    automationLevel: AutomationLevel = 'manual',
    decisionReason?: string
  ): Promise<void> {
    const auditLog = {
      adminId,
      action,
      entityType,
      entityId,
      details,
      automationLevel,
      decisionReason,
      createdAt: new Date()
    };

    await storage.createAdminAuditLog(auditLog);
  }

  // Specific automation methods for different entity types
  async processTontineApproval(tontine: Tontine): Promise<void> {
    const triggerData = {
      tontineId: tontine.id,
      leaderId: tontine.leaderId,
      monthlyContribution: tontine.monthlyContribution,
      region: tontine.region,
      memberCount: 0 // Will be updated by storage method
    };

    await this.executeRules('tontine_approval', 'tontine', tontine.id, triggerData);
  }

  async processPriceValidation(price: MarketPrice): Promise<void> {
    const triggerData = {
      priceId: price.id,
      crop: price.crop,
      price: price.price,
      region: price.region,
      submittedBy: price.submittedBy,
      isVerified: price.isVerified
    };

    await this.executeRules('price_validation', 'price', price.id, triggerData);
  }

  async processUserModeration(user: User): Promise<void> {
    const triggerData = {
      userId: user.id,
      role: user.role,
      lastActive: user.lastActive,
      region: user.region,
      plan: user.plan
    };

    await this.executeRules('user_moderation', 'user', user.id, triggerData);
  }

  async processContentFilter(post: CommunityPost): Promise<void> {
    const triggerData = {
      postId: post.id,
      content: post.content,
      userId: post.userId,
      region: post.region,
      likes: post.likes,
      comments: post.comments
    };

    await this.executeRules('content_filter', 'post', post.id, triggerData);
  }

  // System monitoring and metrics
  async generateSystemMetrics(): Promise<void> {
    try {
      // User growth metrics
      const totalUsers = await storage.getUserCount();
      const activeUsers = await storage.getActiveUserCount();
      const newUsersToday = await storage.getNewUserCount(new Date());

      await this.logMetric('user_growth', 'total_users', totalUsers, 'users');
      await this.logMetric('user_growth', 'active_users', activeUsers, 'users');
      await this.logMetric('user_growth', 'new_users_today', newUsersToday, 'users');

      // Tontine activity metrics
      const totalTontines = await storage.getTontineCount();
      const activeTontines = await storage.getActiveTontineCount();
      const totalContributions = await storage.getTotalContributions();

      await this.logMetric('tontine_activity', 'total_tontines', totalTontines, 'count');
      await this.logMetric('tontine_activity', 'active_tontines', activeTontines, 'count');
      await this.logMetric('tontine_activity', 'total_contributions', totalContributions, 'CFA');

      // Automation efficiency metrics
      const automationExecutions = await storage.getAutomationExecutionCount(new Date());
      const successfulExecutions = await storage.getSuccessfulAutomationCount(new Date());
      const efficiencyRate = automationExecutions > 0 ? (successfulExecutions / automationExecutions) * 100 : 0;

      await this.logMetric('automation_efficiency', 'executions_today', automationExecutions, 'count');
      await this.logMetric('automation_efficiency', 'success_rate', efficiencyRate, 'percentage');

    } catch (error) {
      console.error('[AdminAutomation] Failed to generate system metrics:', error);
    }
  }

  // Rule management
  async createRule(rule: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<AutomationRule> {
    // Cast conditions/actions to Json for storage
    const newRule = await storage.createAutomationRule({
      ...rule,
      conditions: rule.conditions as Json,
      actions: rule.actions as Json
    });
    await this.initialize(); // Reload rules
    return newRule;
  }

  async updateRule(ruleId: number, updates: Partial<AutomationRule>): Promise<AutomationRule> {
    const updatedRule = await storage.updateAutomationRule(ruleId, updates);
    await this.initialize(); // Reload rules
    return updatedRule;
  }

  async deleteRule(ruleId: number): Promise<void> {
    await storage.deleteAutomationRule(ruleId);
    await this.initialize(); // Reload rules
  }

  // Get automation statistics
  async getAutomationStats(): Promise<any> {
    const today = new Date();
    const executions = await storage.getAutomationExecutionCount(today);
    const successful = await storage.getSuccessfulAutomationCount(today);
    const rules = await storage.getActiveAutomationRules();

    return {
      totalRules: rules.length,
      executionsToday: executions,
      successRate: executions > 0 ? (successful / executions) * 100 : 0,
      activeRuleTypes: Array.from(new Set(rules.map(r => r.ruleType)))
    };
  }

  async getSystemOverview(): Promise<SystemOverview> {
    try {
      const [
        totalUsers,
        activeUsers,
        totalTontines,
        activeTontines,
        totalPosts,
        pendingPosts,
        totalPayments,
        recentPayments,
        rules,
        recentExecutions
      ] = await Promise.all([
        storage.getUserCount(),
        storage.getActiveUserCount(),
        storage.getTontineCount(),
        storage.getActiveTontineCount(),
        storage.getCommunityPosts('all', 1000), // Get all posts to count
        storage.getCommunityPosts('all', 1000), // Will filter for pending
        storage.getTontinePayments(0), // Get all payments to count
        storage.getTontinePayments(0), // Will filter for recent
        storage.getAutomationRules({}),
        storage.getAutomationExecutions({})
      ]);

      const pendingPostsCount = Array.isArray(pendingPosts) ? pendingPosts.filter(p => !p.isApproved).length : 0;
      const recentPaymentsData = Array.isArray(recentPayments) ? recentPayments
        .filter(p => new Date(p.createdAt || '').getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000)
        .slice(0, 10) : [];

      return {
        totalUsers,
        activeUsers,
        totalTontines,
        activeTontines,
        totalPosts: Array.isArray(totalPosts) ? totalPosts.length : 0,
        pendingPosts: pendingPostsCount,
        totalPayments: Array.isArray(totalPayments) ? totalPayments.length : 0,
        recentPayments: recentPaymentsData,
        activeRules: Array.isArray(rules) ? rules.filter(r => r.isActive).length : 0,
        recentExecutions: Array.isArray(recentExecutions) ? recentExecutions.slice(0, 10) : [],
        activeRuleTypes: Array.isArray(rules) ? Array.from(new Set(rules.map(r => r.ruleType))) : []
      };
    } catch (error) {
      console.error('Error getting system overview:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const adminAutomation = AdminAutomationEngine.getInstance(); 