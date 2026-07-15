import { supabase } from '../lib/supabase';
import {
  WhatsAppContact,
  WhatsAppGroup,
  WhatsAppTemplate,
  WhatsAppCampaign,
  WhatsAppMessage,
  WhatsAppAutoReply,
  WhatsAppContactStatus,
  MessageStatus,
  Invoice,
  InvoiceItem,
  InvoicePayment,
  TelecallerCallLog,
  TelecallerTarget,
  DailyReport,
  Lead,
  Client,
  Project,
  Task,
  Notification,
  Activity,
  Profile,
  PortalClient,
  PortalDocument,
  PortalNotification,
  PortalActivity,
  PortalITR,
  PortalTask,
  PortalDocumentCategory,
  ServiceCatalog,
  ClientService,
  ClientServiceTask,
  ClientServiceDocument,
  ClientServiceActivity,
  ServiceCategory,
  ClientServiceStatus,
  ServiceActivityType,
  SocialPost,
  SocialPostMedia,
  SocialAccount,
  SocialPlatform,
  SocialPostStatus,
  SocialMediaType,
  PortalITRStatus,
  PortalTaskStatus,
  AIPrompt,
  AITemplate,
  AIHistory,
  AISettings,
  AutoAssignmentSettings,
  LeadAssignmentQueue,
  TelecallerWithStats,
  ActivityLog,
  ActivityLogFilters,
  ActivityModule,
  ActivityAction,
  CalendarEvent,
  Meeting,
  MeetingAttendee,
  FollowUpExtended,
  CalendarFilters,
  MeetingType,
  MeetingStatus,
} from '../types';

// Profile Service
export const profileService = {
  async getAll() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Profile[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Profile | null;
  },

  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data as Profile | null;
  },

  async update(id: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as Profile;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getTeamMembers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'telecaller', 'accountant'])
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Profile[];
  },
};

// Leads Service
export const leadsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Lead[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Lead | null;
  },

  async create(lead: Partial<Lead>) {
    const { data, error } = await supabase
      .from('leads')
      .insert(lead)
      .select()
      .maybeSingle();
    if (error) throw error;

    // Log activity
    if (data) {
      await activitiesService.log({
        type: 'lead',
        description: `New lead added: ${lead.company_name}`,
        entity_type: 'lead',
        entity_id: data.id,
      });
    }

    return data as Lead;
  },

  async update(id: string, updates: Partial<Lead>) {
    const { data, error } = await supabase
      .from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as Lead;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async assignToUser(id: string, userId: string) {
    const { data, error } = await supabase
      .from('leads')
      .update({ assigned_to: userId, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as Lead;
  },

  async updateStatus(id: string, status: Lead['status']) {
    const { data, error } = await supabase
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as Lead;
  },

  async getByStatus(status: Lead['status']) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Lead[];
  },

  async getStats() {
    const { data, error } = await supabase
      .from('leads')
      .select('status, estimated_value');
    if (error) throw error;

    const stats = (data || []).reduce(
      (acc, lead) => {
        acc.total++;
        acc.totalValue += lead.estimated_value || 0;
        acc.byStatus[lead.status] = (acc.byStatus[lead.status] || 0) + 1;
        return acc;
      },
      { total: 0, totalValue: 0, byStatus: {} as Record<string, number> }
    );

    return stats;
  },
};

// Clients Service
export const clientsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Client[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Client | null;
  },

  async create(client: Partial<Client>) {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .maybeSingle();
    if (error) throw error;

    // Log activity
    if (data) {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('user_id', user?.id || '')
        .maybeSingle();

      await activityLogsService.log({
        userId: user?.id,
        userName: profileData?.full_name || 'System',
        userRole: profileData?.role,
        module: 'clients',
        action: 'Client Created',
        entityType: 'client',
        entityId: data.id,
        details: {
          client_name: client.company_name,
          contact_person: client.contact_person,
        },
      });

      await activitiesService.log({
        type: 'client',
        description: `New client added: ${client.company_name}`,
        entity_type: 'client',
        entity_id: data.id,
      });
    }

    return data as Client;
  },

  async update(id: string, updates: Partial<Client>) {
    const { data, error } = await supabase
      .from('clients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as Client;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getStats() {
    const { data, error } = await supabase
      .from('clients')
      .select('status, total_revenue');
    if (error) throw error;

    const stats = (data || []).reduce(
      (acc, client) => {
        acc.total++;
        acc.totalRevenue += client.total_revenue || 0;
        acc.byStatus[client.status] = (acc.byStatus[client.status] || 0) + 1;
        return acc;
      },
      { total: 0, totalRevenue: 0, byStatus: {} as Record<string, number> }
    );

    return stats;
  },
};

// Projects Service
export const projectsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(company_name, contact_person)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(project: Partial<Project>) {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as Project;
  },

  async update(id: string, updates: Partial<Project>) {
    const { data, error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as Project;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getByClient(clientId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Project[];
  },
};

// Tasks Service
export const tasksService = {
  async getAll() {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        project:projects(name)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Task | null;
  },

  async create(task: Partial<Task>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, user_id: user.id })
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as Task;
  },

  async update(id: string, updates: Partial<Task>) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as Task;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getAssignedTo(userId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', userId)
      .order('due_date', { ascending: true });
    if (error) throw error;
    return data as Task[];
  },

  async getByProject(projectId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Task[];
  },

  async getStats() {
    const { data, error } = await supabase
      .from('tasks')
      .select('status, priority');
    if (error) throw error;

    const stats = (data || []).reduce(
      (acc, task) => {
        acc.total++;
        acc.byStatus[task.status] = (acc.byStatus[task.status] || 0) + 1;
        acc.byPriority[task.priority] = (acc.byPriority[task.priority] || 0) + 1;
        return acc;
      },
      { total: 0, byStatus: {} as Record<string, number>, byPriority: {} as Record<string, number> }
    );

    return stats;
  },
};

// Activities Service
export const activitiesService = {
  async getAll(limit = 50) {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as Activity[];
  },

  async log(activity: Partial<Activity>) {
    const { data, error } = await supabase
      .from('activities')
      .insert(activity)
      .select()
      .maybeSingle();
    if (error) console.error('Error logging activity:', error);
    return data as Activity | null;
  },

  async getByEntity(entityType: string, entityId: string) {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Activity[];
  },
};

// Notifications Service
export const notificationsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Notification[];
  },

  async getUnread() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('read', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Notification[];
  },

  async create(notification: Partial<Notification>) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as Notification;
  },

  async markAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    if (error) throw error;
  },

  async markAllAsRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getUnreadCount() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);
    if (error) throw error;
    return count || 0;
  },
};

// Dashboard Stats Service
export const dashboardService = {
  async getStats() {
    const [
      leadsStats,
      clientsStats,
      tasksStats,
      invoiceStats,
    ] = await Promise.all([
      leadsService.getStats(),
      clientsService.getStats(),
      tasksService.getStats(),
      invoiceService.getStats(),
    ]);

    return {
      leads: leadsStats,
      clients: clientsStats,
      tasks: tasksStats,
      invoices: invoiceStats,
    };
  },
};

// WhatsApp Service - API Ready Architecture
export const whatsAppService = {
  // Contacts
  contacts: {
    async getAll(page = 1, pageSize = 20, status?: string, search?: string, groupId?: string) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: [] as WhatsAppContact[], count: 0 };

      let query = supabase
        .from('whatsapp_contacts')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,company.ilike.%${search}%`);
      }

      if (groupId) {
        query = query.contains('group_ids', [groupId]);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) {
        console.error('Error fetching contacts:', error);
        throw error;
      }
      return { data: data as WhatsAppContact[], count: count || 0 };
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as WhatsAppContact | null;
    },

    async create(contact: Partial<WhatsAppContact>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .insert({ ...contact, user_id: user.id })
        .select()
        .maybeSingle();
      if (error) {
        console.error('Error creating contact:', error);
        throw error;
      }
      return data as WhatsAppContact;
    },

    async update(id: string, updates: Partial<WhatsAppContact>) {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) {
        console.error('Error updating contact:', error);
        throw error;
      }
      return data as WhatsAppContact;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('whatsapp_contacts')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('Error deleting contact:', error);
        throw error;
      }
    },

    async importContacts(contacts: Partial<WhatsAppContact>[]) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const contactsWithUser = contacts.map(c => ({ ...c, user_id: user.id }));
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .insert(contactsWithUser)
        .select();
      if (error) {
        console.error('Error importing contacts:', error);
        throw error;
      }
      return data as WhatsAppContact[];
    },

    async exportContacts(_format: 'csv' | 'json' = 'csv') {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as WhatsAppContact[];

      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (error) throw error;
      return data as WhatsAppContact[];
    },

    async getByGroup(groupId: string) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as WhatsAppContact[];

      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .eq('user_id', user.id)
        .contains('group_ids', [groupId]);
      if (error) throw error;
      return data as WhatsAppContact[];
    },

    async getStats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { total: 0, active: 0, blocked: 0, inactive: 0 };

      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('status')
        .eq('user_id', user.id);
      if (error) throw error;

      const stats = (data || []).reduce(
        (acc, contact) => {
          acc.total += 1;
          acc[contact.status as WhatsAppContactStatus] = (acc[contact.status as WhatsAppContactStatus] || 0) + 1;
          return acc;
        },
        { total: 0, active: 0, blocked: 0, inactive: 0 } as Record<string, number>
      );

      return stats;
    },
  },

  // Groups
  groups: {
    async getAll() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as WhatsAppGroup[];

      const { data, error } = await supabase
        .from('whatsapp_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WhatsAppGroup[];
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('whatsapp_groups')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as WhatsAppGroup | null;
    },

    async create(group: Partial<WhatsAppGroup>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('whatsapp_groups')
        .insert({ ...group, user_id: user.id })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as WhatsAppGroup;
    },

    async update(id: string, updates: Partial<WhatsAppGroup>) {
      const { data, error } = await supabase
        .from('whatsapp_groups')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as WhatsAppGroup;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('whatsapp_groups')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  // Templates
  templates: {
    async getAll() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as WhatsAppTemplate[];

      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WhatsAppTemplate[];
    },

    async create(template: Partial<WhatsAppTemplate>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('whatsapp_templates')
        .insert({ ...template, user_id: user.id })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as WhatsAppTemplate;
    },

    async update(id: string, updates: Partial<WhatsAppTemplate>) {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as WhatsAppTemplate;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('whatsapp_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  // Campaigns
  campaigns: {
    async getAll(page = 1, pageSize = 10, status?: string, search?: string) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: [] as WhatsAppCampaign[], count: 0 };

      let query = supabase
        .from('whatsapp_campaigns')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data as WhatsAppCampaign[], count: count || 0 };
    },

    async getById(id: string) {
      const { data } = await supabase
        .from('whatsapp_campaigns')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      return data as WhatsAppCampaign | null;
    },

    async create(campaign: Partial<WhatsAppCampaign>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('whatsapp_campaigns')
        .insert({ ...campaign, user_id: user.id })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as WhatsAppCampaign;
    },

    async update(id: string, updates: Partial<WhatsAppCampaign>) {
      const { data, error } = await supabase
        .from('whatsapp_campaigns')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as WhatsAppCampaign;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('whatsapp_campaigns')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    async duplicate(id: string) {
      const original = await this.getById(id);
      if (!original) throw new Error('Campaign not found');

      const newCampaign = {
        name: `${original.name} (Copy)`,
        template_id: original.template_id,
        group_ids: original.group_ids,
        message_content: original.message_content,
        media_type: original.media_type,
        media_url: original.media_url,
        media_caption: original.media_caption,
        status: 'draft' as const,
        total_contacts: original.total_contacts,
      };

      return this.create(newCampaign);
    },

    async getMessages(campaignId: string, page = 1, pageSize = 50, status?: string) {
      let query = supabase
        .from('whatsapp_messages')
        .select(`
          *,
          contact:whatsapp_contacts(id, name, phone)
        `, { count: 'exact' })
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data as (WhatsAppMessage & { contact?: WhatsAppContact })[], count: count || 0 };
    },

    async getStats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          totalCampaigns: 0,
          totalContacts: 0,
          totalSent: 0,
          totalDelivered: 0,
          totalRead: 0,
          totalFailed: 0,
          totalPending: 0,
          draftCampaigns: 0,
          scheduledCampaigns: 0,
          runningCampaigns: 0,
          completedCampaigns: 0,
          monthlyCampaigns: 0,
          monthlySent: 0,
        };
      }

      const { data: campaigns, error } = await supabase
        .from('whatsapp_campaigns')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const stats = (campaigns || []).reduce(
        (acc, campaign) => {
          acc.totalCampaigns += 1;
          acc.totalContacts += campaign.total_contacts || 0;
          acc.totalSent += campaign.sent_count || 0;
          acc.totalDelivered += campaign.delivered_count || 0;
          acc.totalRead += campaign.read_count || 0;
          acc.totalFailed += campaign.failed_count || 0;
          acc.totalPending += campaign.pending_count || 0;

          if (campaign.status === 'draft') acc.draftCampaigns += 1;
          if (campaign.status === 'scheduled') acc.scheduledCampaigns += 1;
          if (campaign.status === 'running') acc.runningCampaigns += 1;
          if (campaign.status === 'completed') acc.completedCampaigns += 1;

          // Monthly stats
          const created = new Date(campaign.created_at);
          if (created.getMonth() === currentMonth && created.getFullYear() === currentYear) {
            acc.monthlyCampaigns += 1;
            acc.monthlySent += campaign.sent_count || 0;
          }

          return acc;
        },
        {
          totalCampaigns: 0,
          totalContacts: 0,
          totalSent: 0,
          totalDelivered: 0,
          totalRead: 0,
          totalFailed: 0,
          totalPending: 0,
          draftCampaigns: 0,
          scheduledCampaigns: 0,
          runningCampaigns: 0,
          completedCampaigns: 0,
          monthlyCampaigns: 0,
          monthlySent: 0,
        }
      );

      return stats;
    },
  },

  // Messages
  messages: {
    async getByCampaign(campaignId: string, page = 1, pageSize = 50, status?: string) {
      let query = supabase
        .from('whatsapp_messages')
        .select(`
          *,
          contact:whatsapp_contacts(id, name, phone)
        `, { count: 'exact' })
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data as (WhatsAppMessage & { contact?: WhatsAppContact })[], count: count || 0 };
    },

    async getStats(campaignId: string) {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('status')
        .eq('campaign_id', campaignId);
      if (error) throw error;

      const stats = (data || []).reduce(
        (acc, msg) => {
          acc.total += 1;
          acc[msg.status as MessageStatus] = (acc[msg.status as MessageStatus] || 0) + 1;
          return acc;
        },
        { total: 0, pending: 0, queued: 0, sent: 0, delivered: 0, read: 0, failed: 0 } as Record<string, number>
      );

      return stats;
    },
  },

  // Conversations (Chat Inbox)
  conversations: {
    async getAll() {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select(`
          *,
          contact:whatsapp_contacts(*)
        `)
        .order('last_message_at', { ascending: false });
      if (error) throw error;
      return data;
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select(`
          *,
          contact:whatsapp_contacts(*)
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async getMessages(conversationId: string) {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },

    async sendMessage(conversationId: string, message: any) {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ ...message, conversation_id: conversationId })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async markAsRead(conversationId: string) {
      const { error } = await supabase
        .from('whatsapp_conversations')
        .update({ unread_count: 0 })
        .eq('id', conversationId);
      if (error) throw error;
    },
  },

  // Auto Replies
  autoReplies: {
    async getAll() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as WhatsAppAutoReply[];

      const { data, error } = await supabase
        .from('whatsapp_auto_replies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WhatsAppAutoReply[];
    },

    async create(autoReply: Partial<WhatsAppAutoReply>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('whatsapp_auto_replies')
        .insert({ ...autoReply, user_id: user.id })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as WhatsAppAutoReply;
    },

    async update(id: string, updates: Partial<WhatsAppAutoReply>) {
      const { data, error } = await supabase
        .from('whatsapp_auto_replies')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as WhatsAppAutoReply;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('whatsapp_auto_replies')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },
};

// Invoice Service
export const invoiceService = {
  async getAll(page = 1, pageSize = 10, status?: string, search?: string) {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, company_name, contact_person, email, phone, gst_number, pan_number, address),
        items:invoice_items(*),
        payments:invoice_payments(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data as Invoice[], count: count || 0 };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        items:invoice_items(*),
        payments:invoice_payments(*)
      `)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Invoice | null;
  },

  async create(invoice: Partial<Invoice>, items: Partial<InvoiceItem>[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Generate invoice number
    const { data: invoiceCount } = await supabase
      .from('invoices')
      .select('invoice_number_suffix', { count: 'exact', head: false })
      .eq('user_id', user.id)
      .order('invoice_number_suffix', { ascending: false })
      .limit(1);

    const suffix = (invoiceCount?.[0]?.invoice_number_suffix || 0) + 1;
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${String(suffix).padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        ...invoice,
        invoice_number: invoiceNumber,
        invoice_number_suffix: suffix,
        user_id: user.id,
      })
      .select()
      .maybeSingle();

    if (error) throw error;

    // Insert items
    if (data && items.length > 0) {
      const itemData = items.map(item => ({
        ...item,
        invoice_id: data.id,
      }));
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemData);
      if (itemsError) throw itemsError;
    }

    // Log activity
    if (data) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('user_id', user.id)
        .maybeSingle();

      await activityLogsService.log({
        userId: user.id,
        userName: profileData?.full_name || 'System',
        userRole: profileData?.role,
        module: 'invoices',
        action: 'Invoice Created',
        entityType: 'invoice',
        entityId: data.id,
        details: {
          invoice_number: invoiceNumber,
          amount: data.amount,
          client_id: invoice.client_id,
        },
      });
    }

    return data as Invoice;
  },

  async update(id: string, updates: Partial<Invoice>, items?: Partial<InvoiceItem>[]) {
    const { data, error } = await supabase
      .from('invoices')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;

    // Update items if provided
    if (items !== undefined) {
      // Delete existing items
      await supabase.from('invoice_items').delete().eq('invoice_id', id);

      // Insert new items
      if (items.length > 0) {
        const itemData = items.map(item => ({
          ...item,
          invoice_id: id,
        }));
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemData);
        if (itemsError) throw itemsError;
      }
    }

    return data as Invoice;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async duplicate(id: string) {
    const original = await this.getById(id);
    if (!original) throw new Error('Invoice not found');

    const { items } = original;
    const newInvoice = {
      client_id: original.client_id,
      subtotal: original.subtotal,
      tax_amount: original.tax_amount,
      discount_amount: original.discount_amount,
      cgst: original.cgst,
      sgst: original.sgst,
      igst: original.igst,
      round_off: original.round_off,
      amount: original.amount,
      status: 'draft' as const,
      due_date: null,
      notes: original.notes,
      terms: original.terms,
      place_of_supply: original.place_of_supply,
      reverse_charge: original.reverse_charge,
      gst_type: original.gst_type,
    };

    return this.create(newInvoice, items?.map(i => ({
      description: i.description,
      hsn_sac: i.hsn_sac,
      quantity: i.quantity,
      rate: i.rate,
      discount: i.discount,
      tax_rate: i.tax_rate,
      amount: i.amount,
    })) || []);
  },

  async getStats() {
    const { data, error } = await supabase
      .from('invoices')
      .select('status, amount, created_at');
    if (error) throw error;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const stats = (data || []).reduce(
      (acc, inv) => {
        acc.totalAmount += inv.amount;
        acc.totalCount += 1;

        if (inv.status === 'paid') {
          acc.paidAmount += inv.amount;
          acc.paidCount += 1;
        }
        if (inv.status === 'sent' || inv.status === 'partially_paid') {
          acc.pendingAmount += inv.amount;
          acc.pendingCount += 1;
        }
        if (inv.status === 'overdue') {
          acc.overdueAmount += inv.amount;
          acc.overdueCount += 1;
        }
        if (inv.status === 'draft') {
          acc.draftCount += 1;
        }

        // Monthly revenue
        const invDate = new Date(inv.created_at);
        if (invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear && inv.status === 'paid') {
          acc.monthlyRevenue += inv.amount;
        }

        return acc;
      },
      {
        totalAmount: 0,
        totalCount: 0,
        paidAmount: 0,
        paidCount: 0,
        pendingAmount: 0,
        pendingCount: 0,
        overdueAmount: 0,
        overdueCount: 0,
        draftCount: 0,
        monthlyRevenue: 0,
      }
    );

    return stats;
  },

  async getMonthlyRevenue() {
    const { data, error } = await supabase
      .from('invoices')
      .select('amount, status, created_at, paid_date')
      .eq('status', 'paid');

    if (error) throw error;

    const monthlyData: { month: string; revenue: number; count: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleString('default', { month: 'short' });
      const month = d.getMonth();
      const year = d.getFullYear();

      const monthInvoices = (data || []).filter(inv => {
        const paidDate = inv.paid_date ? new Date(inv.paid_date) : new Date(inv.created_at);
        return paidDate.getMonth() === month && paidDate.getFullYear() === year;
      });

      monthlyData.push({
        month: monthStr,
        revenue: monthInvoices.reduce((sum, inv) => sum + inv.amount, 0),
        count: monthInvoices.length,
      });
    }

    return monthlyData;
  },

  // Payment methods
  payments: {
    async add(invoiceId: string, payment: Partial<InvoicePayment>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('invoice_payments')
        .insert({
          ...payment,
          invoice_id: invoiceId,
          user_id: user.id,
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      // Update invoice status
      const invoice = await invoiceService.getById(invoiceId);
      if (invoice) {
        const totalPaid = (invoice.payments || []).reduce((sum, p) => sum + p.amount, 0) + (payment.amount || 0);
        const newStatus = totalPaid >= invoice.amount ? 'paid' : 'partially_paid';
        await invoiceService.update(invoiceId, {
          status: newStatus,
          paid_date: newStatus === 'paid' ? new Date().toISOString() : null,
        });

        // Log activity for paid invoices
        if (newStatus === 'paid') {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('user_id', user.id)
            .maybeSingle();

          await activityLogsService.log({
            userId: user.id,
            userName: profileData?.full_name || 'System',
            userRole: profileData?.role,
            module: 'invoices',
            action: 'Invoice Paid',
            entityType: 'invoice',
            entityId: invoiceId,
            details: {
              invoice_number: invoice.invoice_number,
              amount: invoice.amount,
              payment_method: payment.payment_method,
            },
          });
        }
      }

      return data;
    },

    async delete(invoiceId: string, paymentId: string) {
      const { error } = await supabase
        .from('invoice_payments')
        .delete()
        .eq('id', paymentId);
      if (error) throw error;

      // Recalculate invoice status
      const invoice = await invoiceService.getById(invoiceId);
      if (invoice) {
        const remainingPayments = (invoice.payments || []).filter(p => p.id !== paymentId);
        const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);
        const newStatus = totalPaid >= invoice.amount ? 'paid' : totalPaid > 0 ? 'partially_paid' : 'sent';
        await invoiceService.update(invoiceId, {
          status: newStatus,
          paid_date: newStatus === 'paid' ? invoice.paid_date : null,
        });
      }
    },
  },
};

// Telecaller Service
export const telecallerService = {
  leads: {
    async getAll() {
      const { data, error } = await supabase
        .from('telecaller_leads')
        .select(`
          *,
          lead:leads(*)
        `)
        .order('priority', { ascending: true });
      if (error) throw error;
      return data;
    },

    async getAssigned(userId: string) {
      const { data, error } = await supabase
        .from('telecaller_leads')
        .select(`
          *,
          lead:leads(*)
        `)
        .eq('assigned_to', userId)
        .order('priority', { ascending: true });
      if (error) throw error;
      return data;
    },

    async updateStatus(id: string, callStatus: string) {
      // Fetch current total_calls first, then increment manually
      const { data: current } = await supabase.from('telecaller_leads').select('total_calls').eq('id', id).maybeSingle();
      const { data, error } = await supabase
        .from('telecaller_leads')
        .update({
          call_status: callStatus,
          last_call_at: new Date().toISOString(),
          total_calls: (current?.total_calls || 0) + 1,
        })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },

  calls: {
    async log(call: Partial<TelecallerCallLog>) {
      const { data, error } = await supabase
        .from('telecaller_call_logs')
        .insert(call)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async getByUser(userId: string, date?: string) {
      let query = supabase
        .from('telecaller_call_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  },

  targets: {
    async getCurrent(userId: string, type: 'daily' | 'weekly' | 'monthly') {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('telecaller_targets')
        .select('*')
        .eq('user_id', userId)
        .eq('target_type', type)
        .lte('start_date', today)
        .gte('end_date', today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async create(target: Partial<TelecallerTarget>) {
      const { data, error } = await supabase
        .from('telecaller_targets')
        .insert(target)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },

  reports: {
    async create(report: Partial<DailyReport>) {
      const { data, error } = await supabase
        .from('daily_reports')
        .insert(report)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async getByUser(userId: string, startDate?: string, endDate?: string) {
      let query = supabase
        .from('daily_reports')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async submitReview(id: string, review: string, reviewedBy: string) {
      const { data, error } = await supabase
        .from('daily_reports')
        .update({
          manager_review: review,
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },
};

// Client Portal Service
export const portalService = {
  // Portal Clients (Admin managed)
  clients: {
    async getAll(page = 1, pageSize = 10, search?: string, status?: string) {
      let query = supabase
        .from('portal_clients')
        .select(`
          *,
          client:clients(id, company_name, contact_person, email, phone, address, gst_number, pan_number)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
      }

      if (status === 'active') {
        query = query.eq('is_active', true);
      } else if (status === 'inactive') {
        query = query.eq('is_active', false);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data as PortalClient[], count: count || 0 };
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('portal_clients')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as PortalClient | null;
    },

    async getByUserId(userId: string) {
      const { data, error } = await supabase
        .from('portal_clients')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data as PortalClient | null;
    },

    async create(portalClient: Partial<PortalClient>) {
      const { data, error } = await supabase
        .from('portal_clients')
        .insert(portalClient)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as PortalClient;
    },

    async update(id: string, updates: Partial<PortalClient>) {
      const { data, error } = await supabase
        .from('portal_clients')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as PortalClient;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('portal_clients')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    async activate(id: string) {
      return this.update(id, { is_active: true });
    },

    async deactivate(id: string) {
      return this.update(id, { is_active: false });
    },

    async getStats() {
      const { data, error } = await supabase
        .from('portal_clients')
        .select('is_active');
      if (error) throw error;

      const stats = (data || []).reduce(
        (acc, client) => {
          acc.total += 1;
          if (client.is_active) acc.active += 1;
          else acc.inactive += 1;
          return acc;
        },
        { total: 0, active: 0, inactive: 0 }
      );

      return stats;
    },
  },

  // Portal Documents
  documents: {
    async getAll(portalClientId: string, page = 1, pageSize = 20, category?: string) {
      let query = supabase
        .from('portal_documents')
        .select('*', { count: 'exact' })
        .eq('portal_client_id', portalClientId)
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data as PortalDocument[], count: count || 0 };
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('portal_documents')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as PortalDocument | null;
    },

    async create(document: Partial<PortalDocument>) {
      const { data, error } = await supabase
        .from('portal_documents')
        .insert(document)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as PortalDocument;
    },

    async update(id: string, updates: Partial<PortalDocument>) {
      const { data, error } = await supabase
        .from('portal_documents')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as PortalDocument;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('portal_documents')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    async getStats(portalClientId: string) {
      const { data, error } = await supabase
        .from('portal_documents')
        .select('category')
        .eq('portal_client_id', portalClientId);
      if (error) throw error;

      const stats = (data || []).reduce(
        (acc, doc) => {
          acc.total += 1;
          acc.byCategory[doc.category as PortalDocumentCategory] = (acc.byCategory[doc.category as PortalDocumentCategory] || 0) + 1;
          return acc;
        },
        { total: 0, byCategory: {} as Record<string, number> }
      );

      return stats;
    },
  },

  // Portal Notifications
  notifications: {
    async getAll(portalClientId: string, page = 1, pageSize = 20, unreadOnly?: boolean) {
      let query = supabase
        .from('portal_notifications')
        .select('*', { count: 'exact' })
        .eq('portal_client_id', portalClientId)
        .order('created_at', { ascending: false });

      if (unreadOnly) {
        query = query.eq('read', false);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data as PortalNotification[], count: count || 0 };
    },

    async create(notification: Partial<PortalNotification>) {
      const { data, error } = await supabase
        .from('portal_notifications')
        .insert(notification)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as PortalNotification;
    },

    async markAsRead(id: string) {
      const { error } = await supabase
        .from('portal_notifications')
        .update({ read: true })
        .eq('id', id);
      if (error) throw error;
    },

    async markAllAsRead(portalClientId: string) {
      const { error } = await supabase
        .from('portal_notifications')
        .update({ read: true })
        .eq('portal_client_id', portalClientId)
        .eq('read', false);
      if (error) throw error;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('portal_notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    async getUnreadCount(portalClientId: string) {
      const { count, error } = await supabase
        .from('portal_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('portal_client_id', portalClientId)
        .eq('read', false);
      if (error) throw error;
      return count || 0;
    },
  },

  // Portal Activities
  activities: {
    async log(portalClientId: string, activity: Partial<PortalActivity>) {
      const { data, error } = await supabase
        .from('portal_activities')
        .insert({ ...activity, portal_client_id: portalClientId })
        .select()
        .maybeSingle();
      if (error) console.error('Error logging activity:', error);
      return data as PortalActivity | null;
    },

    async getByClient(portalClientId: string, limit = 50) {
      const { data, error } = await supabase
        .from('portal_activities')
        .select('*')
        .eq('portal_client_id', portalClientId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as PortalActivity[];
    },
  },

  // Portal ITR
  itr: {
    async getAll(portalClientId: string) {
      const { data, error } = await supabase
        .from('portal_itr')
        .select('*')
        .eq('portal_client_id', portalClientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PortalITR[];
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('portal_itr')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as PortalITR | null;
    },

    async create(itr: Partial<PortalITR>) {
      const { data, error } = await supabase
        .from('portal_itr')
        .insert(itr)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as PortalITR;
    },

    async update(id: string, updates: Partial<PortalITR>) {
      const { data, error } = await supabase
        .from('portal_itr')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as PortalITR;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('portal_itr')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    async getByStatus(portalClientId: string, status: PortalITRStatus) {
      const { data, error } = await supabase
        .from('portal_itr')
        .select('*')
        .eq('portal_client_id', portalClientId)
        .eq('status', status);
      if (error) throw error;
      return data as PortalITR[];
    },
  },

  // Portal Tasks
  tasks: {
    async getAll(portalClientId: string, status?: string) {
      let query = supabase
        .from('portal_tasks')
        .select('*')
        .eq('portal_client_id', portalClientId)
        .order('due_date', { ascending: true });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PortalTask[];
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('portal_tasks')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as PortalTask | null;
    },

    async create(task: Partial<PortalTask>) {
      const { data, error } = await supabase
        .from('portal_tasks')
        .insert(task)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as PortalTask;
    },

    async update(id: string, updates: Partial<PortalTask>) {
      const { data, error } = await supabase
        .from('portal_tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as PortalTask;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('portal_tasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    async complete(id: string) {
      return this.update(id, { status: 'completed', completed_at: new Date().toISOString() });
    },

    async getStats(portalClientId: string) {
      const { data, error } = await supabase
        .from('portal_tasks')
        .select('status')
        .eq('portal_client_id', portalClientId);
      if (error) throw error;

      const stats = (data || []).reduce(
        (acc, task) => {
          acc.total += 1;
          acc.byStatus[task.status as PortalTaskStatus] = (acc.byStatus[task.status as PortalTaskStatus] || 0) + 1;
          return acc;
        },
        { total: 0, byStatus: {} as Record<string, number> }
      );

      return stats;
    },
  },

  // Portal Dashboard Stats
  async getDashboardStats(portalClientId: string) {
    const [documents, notifications, tasks, itr] = await Promise.all([
      supabase.from('portal_documents').select('category').eq('portal_client_id', portalClientId),
      supabase.from('portal_notifications').select('read').eq('portal_client_id', portalClientId),
      supabase.from('portal_tasks').select('status').eq('portal_client_id', portalClientId),
      supabase.from('portal_itr').select('status').eq('portal_client_id', portalClientId),
    ]);

    const gstReturns = await supabase
      .from('gst_returns')
      .select('status')
      .eq('client_id', portalClientId);

    const invoices = await supabase
      .from('invoices')
      .select('status, amount')
      .eq('client_id', portalClientId);

    return {
      documents: {
        total: documents.data?.length || 0,
        byCategory: (documents.data || []).reduce((acc, d) => {
          acc[d.category] = (acc[d.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      notifications: {
        total: notifications.data?.length || 0,
        unread: (notifications.data || []).filter(n => !n.read).length,
      },
      tasks: {
        total: tasks.data?.length || 0,
        pending: (tasks.data || []).filter(t => t.status === 'pending').length,
      },
      itr: {
        total: itr.data?.length || 0,
        pending: (itr.data || []).filter(i => i.status === 'pending').length,
      },
      gstReturns: {
        total: gstReturns.data?.length || 0,
        pending: (gstReturns.data || []).filter(g => g.status === 'pending').length,
        filed: (gstReturns.data || []).filter(g => g.status === 'filed').length,
      },
      invoices: {
        total: invoices.data?.length || 0,
        paid: (invoices.data || []).filter(i => i.status === 'paid').length,
        pending: (invoices.data || []).filter(i => i.status === 'sent' || i.status === 'partially_paid').length,
        outstanding: (invoices.data || []).filter(i => i.status === 'sent' || i.status === 'partially_paid' || i.status === 'overdue').reduce((sum, i) => sum + (i.amount || 0), 0),
      },
    };
  },
};

// Service Catalog Service
export const serviceCatalogService = {
  async getAll(includeInactive = false) {
    let query = supabase
      .from('service_catalog')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as ServiceCatalog[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('service_catalog')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as ServiceCatalog | null;
  },

  async create(service: Partial<ServiceCatalog>) {
    const { data, error } = await supabase
      .from('service_catalog')
      .insert(service)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as ServiceCatalog;
  },

  async update(id: string, updates: Partial<ServiceCatalog>) {
    const { data, error } = await supabase
      .from('service_catalog')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as ServiceCatalog;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('service_catalog')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async toggleActive(id: string, isActive: boolean) {
    return this.update(id, { is_active: isActive });
  },

  async getByCategory(category: string) {
    const { data, error } = await supabase
      .from('service_catalog')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data as ServiceCatalog[];
  },

  async getCategories() {
    const { data, error } = await supabase
      .from('service_catalog')
      .select('category')
      .eq('is_active', true);
    if (error) throw error;
    const categories = [...new Set(data.map(s => s.category))];
    return categories as ServiceCategory[];
  },
};

// Client Services Service
export const clientServicesService = {
  async getAll(page = 1, pageSize = 20, filters?: {
    portalClientId?: string;
    clientId?: string;
    status?: string;
    category?: string;
  }) {
    let query = supabase
      .from('client_services')
      .select(`
        *,
        portal_client:portal_clients(id, full_name, email, company_name),
        service_catalog:service_catalog(id, name, category),
        client:clients(id, company_name, contact_person),
        invoice:invoices(id, invoice_number, amount, status)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.portalClientId) {
      query = query.eq('portal_client_id', filters.portalClientId);
    }
    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data as ClientService[], count: count || 0 };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('client_services')
      .select(`
        *,
        portal_client:portal_clients(id, full_name, email, company_name),
        service_catalog:service_catalog(id, name, category),
        client:clients(id, company_name, contact_person),
        invoice:invoices(id, invoice_number, amount, status)
      `)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as ClientService | null;
  },

  async getWithDetails(id: string) {
    const [service, tasks, documents, activities] = await Promise.all([
      this.getById(id),
      supabase.from('client_service_tasks').select('*').eq('client_service_id', id).order('created_at'),
      supabase.from('client_service_documents').select('*').eq('client_service_id', id).order('created_at'),
      supabase.from('client_service_activities').select('*').eq('client_service_id', id).order('created_at', { ascending: false }).limit(20),
    ]);

    return {
      ...service,
      tasks: tasks.data as ClientServiceTask[],
      documents: documents.data as ClientServiceDocument[],
      activities: activities.data as ClientServiceActivity[],
    } as ClientService;
  },

  async create(service: Partial<ClientService>) {
    const { data, error } = await supabase
      .from('client_services')
      .insert(service)
      .select()
      .maybeSingle();
    if (error) throw error;

    // Log activity
    if (data) {
      await this.logActivity(data.id, 'created', `Service "${service.name}" created`);
    }

    return data as ClientService;
  },

  async update(id: string, updates: Partial<ClientService>) {
    const { data: oldData } = await supabase
      .from('client_services')
      .select('status, progress')
      .eq('id', id)
      .maybeSingle();

    const { data, error } = await supabase
      .from('client_services')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;

    // Log status change
    if (oldData && updates.status && oldData.status !== updates.status) {
      await this.logActivity(id, 'status_change', `Status changed from ${oldData.status} to ${updates.status}`);
    }

    // Log progress change
    if (oldData && updates.progress !== undefined && oldData.progress !== updates.progress) {
      await this.logActivity(id, 'progress_update', `Progress updated from ${oldData.progress}% to ${updates.progress}%`);
    }

    return data as ClientService;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('client_services')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async logActivity(clientServiceId: string, type: ServiceActivityType, description: string, metadata?: Record<string, any>) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user?.id || '')
      .maybeSingle();

    await supabase
      .from('client_service_activities')
      .insert({
        client_service_id: clientServiceId,
        type,
        description,
        user_id: user?.id,
        user_name: profile?.full_name || 'System',
        metadata: metadata || {},
      });
  },

  // Tasks
  tasks: {
    async getAll(clientServiceId: string) {
      const { data, error } = await supabase
        .from('client_service_tasks')
        .select('*')
        .eq('client_service_id', clientServiceId)
        .order('created_at');
      if (error) throw error;
      return data as ClientServiceTask[];
    },

    async create(task: Partial<ClientServiceTask>) {
      const { data, error } = await supabase
        .from('client_service_tasks')
        .insert(task)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as ClientServiceTask;
    },

    async update(id: string, updates: Partial<ClientServiceTask>) {
      const { data, error } = await supabase
        .from('client_service_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as ClientServiceTask;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('client_service_tasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    async complete(id: string) {
      return this.update(id, { status: 'completed', completed_at: new Date().toISOString() });
    },
  },

  // Documents
  documents: {
    async getAll(clientServiceId: string) {
      const { data, error } = await supabase
        .from('client_service_documents')
        .select('*')
        .eq('client_service_id', clientServiceId)
        .order('created_at');
      if (error) throw error;
      return data as ClientServiceDocument[];
    },

    async create(document: Partial<ClientServiceDocument>) {
      const { data, error } = await supabase
        .from('client_service_documents')
        .insert(document)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as ClientServiceDocument;
    },

    async update(id: string, updates: Partial<ClientServiceDocument>) {
      const { data, error } = await supabase
        .from('client_service_documents')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as ClientServiceDocument;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('client_service_documents')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  // Activities
  activities: {
    async getAll(clientServiceId: string, limit = 20) {
      const { data, error } = await supabase
        .from('client_service_activities')
        .select('*')
        .eq('client_service_id', clientServiceId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as ClientServiceActivity[];
    },
  },

  // Stats
  async getStats(portalClientId?: string) {
    let query = supabase.from('client_services').select('status, progress');
    if (portalClientId) {
      query = query.eq('portal_client_id', portalClientId);
    }
    const { data, error } = await query;
    if (error) throw error;

    const stats = (data || []).reduce(
      (acc, service) => {
        acc.total += 1;
        acc.byStatus[service.status as ClientServiceStatus] = (acc.byStatus[service.status as ClientServiceStatus] || 0) + 1;
        acc.byProgress[service.progress <= 25 ? '0-25' : service.progress <= 50 ? '26-50' : service.progress <= 75 ? '51-75' : '76-100'] = (acc.byProgress[service.progress <= 25 ? '0-25' : service.progress <= 50 ? '26-50' : service.progress <= 75 ? '51-75' : '76-100'] || 0) + 1;
        return acc;
      },
      { total: 0, byStatus: {} as Record<string, number>, byProgress: {} as Record<string, number> }
    );

    return stats;
  },
};

// AI Assistant Service (Placeholder for future API integration)
export const aiService = {
  // Prompts
  prompts: {
    async getAll(page = 1, pageSize = 20, category?: string, search?: string, favoritesOnly?: boolean) {
      let query = supabase
        .from('ai_prompts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }

      if (favoritesOnly) {
        query = query.eq('is_favorite', true);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data as AIPrompt[], count: count || 0 };
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('ai_prompts')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as AIPrompt | null;
    },

    async create(prompt: Partial<AIPrompt>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_prompts')
        .insert({ ...prompt, user_id: user.id })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as AIPrompt;
    },

    async update(id: string, updates: Partial<AIPrompt>) {
      const { data, error } = await supabase
        .from('ai_prompts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as AIPrompt;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('ai_prompts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    async toggleFavorite(id: string) {
      const prompt = await this.getById(id);
      if (!prompt) throw new Error('Prompt not found');
      return this.update(id, { is_favorite: !prompt.is_favorite });
    },

    async incrementUsage(id: string) {
      const prompt = await this.getById(id);
      if (!prompt) throw new Error('Prompt not found');
      return this.update(id, { usage_count: (prompt.usage_count || 0) + 1 });
    },

    async getStats() {
      const { data, error } = await supabase
        .from('ai_prompts')
        .select('category, is_favorite, usage_count');
      if (error) throw error;

      const stats = (data || []).reduce(
        (acc, prompt) => {
          acc.total += 1;
          acc.totalUsage += prompt.usage_count || 0;
          if (prompt.is_favorite) acc.favorites += 1;
          acc.byCategory[prompt.category] = (acc.byCategory[prompt.category] || 0) + 1;
          return acc;
        },
        { total: 0, favorites: 0, totalUsage: 0, byCategory: {} as Record<string, number> }
      );

      return stats;
    },
  },

  // Templates
  templates: {
    async getAll(type?: string) {
      let query = supabase
        .from('ai_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (type && type !== 'all') {
        query = query.eq('template_type', type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AITemplate[];
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('ai_templates')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as AITemplate | null;
    },

    async create(template: Partial<AITemplate>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_templates')
        .insert({ ...template, user_id: user.id, is_system: false })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as AITemplate;
    },

    async update(id: string, updates: Partial<AITemplate>) {
      const { data, error } = await supabase
        .from('ai_templates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as AITemplate;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('ai_templates')
        .delete()
        .eq('id', id)
        .eq('is_system', false);
      if (error) throw error;
    },
  },

  // History
  history: {
    async getAll(page = 1, pageSize = 20, category?: string, search?: string) {
      let query = supabase
        .from('ai_history')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.or(`input_text.ilike.%${search}%,output_text.ilike.%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data as AIHistory[], count: count || 0 };
    },

    async create(history: Partial<AIHistory>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_history')
        .insert({ ...history, user_id: user.id })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as AIHistory;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('ai_history')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    async clearAll() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ai_history')
        .delete()
        .eq('user_id', user.id);
      if (error) throw error;
    },

    async getStats() {
      const { data, error } = await supabase
        .from('ai_history')
        .select('category, tokens_used, created_at');
      if (error) throw error;

      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      const stats = (data || []).reduce(
        (acc, item) => {
          acc.total += 1;
          acc.totalTokens += item.tokens_used || 0;
          acc.byCategory[item.category] = (acc.byCategory[item.category] || 0) + 1;

          const date = new Date(item.created_at);
          if (date.getMonth() === thisMonth && date.getFullYear() === thisYear) {
            acc.thisMonth += 1;
            acc.tokensThisMonth += item.tokens_used || 0;
          }

          return acc;
        },
        {
          total: 0,
          totalTokens: 0,
          thisMonth: 0,
          tokensThisMonth: 0,
          byCategory: {} as Record<string, number>
        }
      );

      return stats;
    },
  },

  // Settings
  settings: {
    async get() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return this.create({
          default_provider: 'placeholder',
          temperature: 0.7,
          max_tokens: 1000,
          language: 'en',
          auto_save_history: true,
        });
      }

      return data as AISettings;
    },

    async create(settings: Partial<AISettings>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_settings')
        .insert({ ...settings, user_id: user.id })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as AISettings;
    },

    async update(settings: Partial<AISettings>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as AISettings;
    },
  },

  // AI Generation (Gemini API Integration)
  generate: {
    async generateText(prompt: string, settings?: Partial<AISettings>): Promise<string> {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === 'your-gemini-api-key-here') {
        throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Fetch conversation history to maintain context
        const { data: historyData, error: historyError } = await supabase
          .from('ai_history')
          .select('input_text, output_text')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (historyError) {
          console.error('Error fetching conversation history:', historyError);
        }

        interface GeminiPart {
          text: string;
        }

        interface GeminiContent {
          role: 'user' | 'model';
          parts: GeminiPart[];
        }

        // Format history for Gemini API
        const contents: GeminiContent[] = [];
        if (historyData && historyData.length > 0) {
          // Reverse to make it chronological (oldest first)
          const chronological = [...historyData].reverse();
          chronological.forEach((item) => {
            contents.push({
              role: 'user',
              parts: [{ text: item.input_text }]
            });
            contents.push({
              role: 'model',
              parts: [{ text: item.output_text }]
            });
          });
        }

        // Append the current prompt
        contents.push({
          role: 'user',
          parts: [{ text: prompt }]
        });

        // Get settings parameters
        const temperature = settings?.temperature ?? 0.7;
        const maxOutputTokens = settings?.max_tokens ?? 1000;

        // Perform the API call to Gemini
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature,
                maxOutputTokens,
              }
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData?.error?.message || `HTTP error! status: ${response.status}`;
          throw new Error(`Gemini API Error: ${errorMessage}`);
        }

        const responseData = await response.json();
        const generatedText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
          throw new Error('Received empty response from Gemini API.');
        }

        // Save generated text to history
        const shouldSave = settings?.auto_save_history ?? true;
        if (shouldSave) {
          const { error: insertError } = await supabase
            .from('ai_history')
            .insert({
              user_id: user.id,
              input_text: prompt,
              output_text: generatedText,
              provider: 'google',
              model: 'gemini-1.5-flash',
              tokens_used: Math.round((prompt.length + generatedText.length) / 4), // Estimate
              category: 'general'
            });

          if (insertError) {
            console.error('Error saving generation to history:', insertError);
          }
        }

        return generatedText;
      } catch (error: any) {
        console.error('AI generation failed:', error);
        throw new Error(error.message || 'Failed to generate content using Gemini API.');
      }
    },

    async generateWithTemplate(template: AITemplate, variables: Record<string, string>, settings?: Partial<AISettings>): Promise<string> {
      let prompt = template.content;
      Object.entries(variables).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
      return this.generateText(prompt, settings);
    },
  },
};

// Auto Assignment Service
export const autoAssignmentService = {
  settings: {
    async get() {
      const { data, error } = await supabase
        .from('auto_assignment_settings')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data as AutoAssignmentSettings | null;
    },

    async update(updates: Partial<AutoAssignmentSettings>) {
      const { data: existing } = await supabase
        .from('auto_assignment_settings')
        .select('id')
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('auto_assignment_settings')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .maybeSingle();
        if (error) throw error;
        return data as AutoAssignmentSettings;
      } else {
        const { data, error } = await supabase
          .from('auto_assignment_settings')
          .insert(updates)
          .select()
          .maybeSingle();
        if (error) throw error;
        return data as AutoAssignmentSettings;
      }
    },
  },

  telecallers: {
    async getAll(): Promise<TelecallerWithStats[]> {
      const { data: telecallers, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'telecaller')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: assignments } = await supabase
        .from('telecaller_leads')
        .select('assigned_to, call_status');

      const statsMap = new Map<string, { total: number; pending: number; completed: number }>();

      (assignments || []).forEach((a) => {
        const existing = statsMap.get(a.assigned_to) || { total: 0, pending: 0, completed: 0 };
        existing.total++;
        if (a.call_status === 'pending') existing.pending++;
        if (a.call_status === 'converted' || a.call_status === 'interested') existing.completed++;
        statsMap.set(a.assigned_to, existing);
      });

      return (telecallers || []).map((t) => ({
        ...t,
        total_assigned: statsMap.get(t.user_id)?.total || 0,
        pending_leads: statsMap.get(t.user_id)?.pending || 0,
        completed_leads: statsMap.get(t.user_id)?.completed || 0,
      })) as TelecallerWithStats[];
    },

    async getActive() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'telecaller')
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data as Profile[];
    },
  },

  queue: {
    async getAll(status?: string) {
      let query = supabase
        .from('lead_assignment_queue')
        .select(`
          *,
          lead:leads(*)
        `)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LeadAssignmentQueue[];
    },

    async getPending() {
      const { data, error } = await supabase
        .from('lead_assignment_queue')
        .select(`
          *,
          lead:leads(*)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as LeadAssignmentQueue[];
    },

    async assignManually(queueId: string, telecallerId: string) {
      const { data: queueItem, error: queueError } = await supabase
        .from('lead_assignment_queue')
        .select('lead_id')
        .eq('id', queueId)
        .maybeSingle();

      if (queueError) throw queueError;
      if (!queueItem) throw new Error('Queue item not found');

      const { error: updateError } = await supabase
        .from('leads')
        .update({
          assigned_to: telecallerId,
          assigned_at: new Date().toISOString(),
          status: 'new',
          updated_at: new Date().toISOString()
        })
        .eq('id', queueItem.lead_id);

      if (updateError) throw updateError;

      const { error: queueUpdateError } = await supabase
        .from('lead_assignment_queue')
        .update({
          status: 'assigned',
          assigned_to: telecallerId,
          assigned_at: new Date().toISOString()
        })
        .eq('id', queueId);

      if (queueUpdateError) throw queueUpdateError;

      const telecaller = await profileService.getByUserId(telecallerId);
      const lead = await leadsService.getById(queueItem.lead_id);

      if (lead) {
        await activitiesService.log({
          type: 'lead_assigned',
          description: `Lead manually assigned to ${telecaller?.full_name || 'Telecaller'}`,
          entity_type: 'lead',
          entity_id: queueItem.lead_id,
          metadata: { assigned_to: telecallerId, method: 'manual' }
        });

        await notificationsService.create({
          user_id: telecallerId,
          title: 'New Lead Assigned',
          message: `A lead from ${lead.source} has been manually assigned to you: ${lead.company_name}`,
          type: 'lead',
          action_url: '/telecaller'
        });

        await supabase
          .from('telecaller_leads')
          .upsert({
            lead_id: queueItem.lead_id,
            assigned_to: telecallerId,
            call_status: 'pending',
            priority: 3
          });
      }

      return true;
    },

    async getStats() {
      const { data, error } = await supabase
        .from('lead_assignment_queue')
        .select('status');

      if (error) throw error;

      return (data || []).reduce(
        (acc, item) => {
          acc.total++;
          acc[item.status as 'pending' | 'assigned' | 'cancelled'] = (acc[item.status as 'pending' | 'assigned' | 'cancelled'] || 0) + 1;
          return acc;
        },
        { total: 0, pending: 0, assigned: 0, cancelled: 0 }
      );
    },
  },
};

// Activity Logs Service
export const activityLogsService = {
  async getAll(page = 1, pageSize = 20, filters?: ActivityLogFilters) {
    let query = supabase
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.search) {
      query = query.or(`user_name.ilike.%${filters.search}%,action.ilike.%${filters.search}%,module.ilike.%${filters.search}%`);
    }

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters?.module) {
      query = query.eq('module', filters.module);
    }

    if (filters?.action) {
      query = query.eq('action', filters.action);
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters?.date_to) {
      const endDate = new Date(filters.date_to);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endDate.toISOString());
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data as ActivityLog[], count: count || 0 };
  },

  async getRecent(limit = 10) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as ActivityLog[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as ActivityLog | null;
  },

  async log(params: {
    userId?: string;
    userName: string;
    userRole?: string;
    module: ActivityModule;
    action: ActivityAction | string;
    entityType?: string;
    entityId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    deviceInfo?: string;
  }) {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: params.userId || null,
        user_name: params.userName,
        user_role: params.userRole || null,
        module: params.module,
        action: params.action,
        entity_type: params.entityType || null,
        entity_id: params.entityId || null,
        details: params.details || {},
        ip_address: params.ipAddress || null,
        device_info: params.deviceInfo || null,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error logging activity:', error);
      return null;
    }

    return data as ActivityLog;
  },

  async getByEntity(entityType: string, entityId: string) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as ActivityLog[];
  },

  async getByUser(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as ActivityLog[];
  },

  async getStats() {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('module, action, created_at');

    if (error) throw error;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = (data || []).reduce(
      (acc, log) => {
        acc.total++;

        const logDate = new Date(log.created_at);
        if (logDate >= today) acc.today++;
        if (logDate >= thisWeek) acc.thisWeek++;
        if (logDate >= thisMonth) acc.thisMonth++;

        acc.byModule[log.module] = (acc.byModule[log.module] || 0) + 1;
        acc.byAction[log.action] = (acc.byAction[log.action] || 0) + 1;

        return acc;
      },
      {
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        byModule: {} as Record<string, number>,
        byAction: {} as Record<string, number>,
      }
    );

    return stats;
  },

  async exportCSV(filters?: ActivityLogFilters) {
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10000); // Prevent browser crash from large exports

    if (filters?.search) {
      query = query.or(`user_name.ilike.%${filters.search}%,action.ilike.%${filters.search}%,module.ilike.%${filters.search}%`);
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters?.module) {
      query = query.eq('module', filters.module);
    }
    if (filters?.action) {
      query = query.ilike('action', `%${filters.action}%`);
    }
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as ActivityLog[];
  },

  async deleteOld(days: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { error } = await supabase
      .from('activity_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) throw error;
  },
};

// Calendar Service
export const calendarService = {
  // Events
  events: {
    async getAll(filters?: CalendarFilters) {
      let query = supabase
        .from('calendar_events')
        .select(`
          *,
          lead:leads(id, company_name, contact_person, email, phone),
          client:clients(id, company_name, contact_person, email, phone),
          task:tasks(id, title, priority, status)
        `)
        .order('start_at', { ascending: true });

      if (filters?.date_from) {
        query = query.gte('start_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('start_at', filters.date_to);
      }
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters?.event_type) {
        query = query.eq('event_type', filters.event_type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CalendarEvent[];
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          lead:leads(*),
          client:clients(*),
          task:tasks(*)
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as CalendarEvent | null;
    },

    async create(event: Partial<CalendarEvent>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('calendar_events')
        .insert({ ...event, user_id: user.id })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as CalendarEvent;
    },

    async update(id: string, updates: Partial<CalendarEvent>) {
      const { data, error } = await supabase
        .from('calendar_events')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as CalendarEvent;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    async getByDateRange(start: string, end: string) {
      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          lead:leads(id, company_name, contact_person),
          client:clients(id, company_name, contact_person),
          task:tasks(id, title, priority, status)
        `)
        .gte('start_at', start)
        .lte('start_at', end)
        .order('start_at', { ascending: true });
      if (error) throw error;
      return data as CalendarEvent[];
    },

    async getToday() {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

      return this.getByDateRange(startOfDay, endOfDay);
    },

    async getUpcoming(limit = 10) {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          lead:leads(id, company_name, contact_person),
          client:clients(id, company_name, contact_person)
        `)
        .gte('start_at', now)
        .order('start_at', { ascending: true })
        .limit(limit);
      if (error) throw error;
      return data as CalendarEvent[];
    },
  },

  // Meetings
  meetings: {
    async getAll(filters?: { status?: MeetingStatus; meeting_type?: MeetingType; date_from?: string; date_to?: string }) {
      let query = supabase
        .from('meetings')
        .select(`
          *,
          lead:leads(id, company_name, contact_person),
          client:clients(id, company_name, contact_person),
          attendees:meeting_attendees(*)
        `)
        .order('start_at', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.meeting_type) {
        query = query.eq('meeting_type', filters.meeting_type);
      }
      if (filters?.date_from) {
        query = query.gte('start_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('start_at', filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Meeting[];
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          lead:leads(*),
          client:clients(*),
          attendees:meeting_attendees(*)
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Meeting | null;
    },

    async create(meeting: Partial<Meeting>, attendeeIds: string[] = []) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('meetings')
        .insert({ ...meeting, user_id: user.id, attendee_ids: attendeeIds })
        .select()
        .maybeSingle();

      if (error) throw error;

      // Create attendees
      if (data && attendeeIds.length > 0) {
        const attendeeRecords = attendeeIds.map(userId => ({
          meeting_id: data.id,
          user_id: userId,
        }));
        await supabase.from('meeting_attendees').insert(attendeeRecords);
      }

      // Also create calendar event
      await calendarService.events.create({
        title: meeting.title || 'Meeting',
        description: meeting.description,
        event_type: 'meeting',
        start_at: meeting.start_at || new Date().toISOString(),
        end_at: meeting.end_at,
        location: meeting.location,
        lead_id: meeting.lead_id,
        client_id: meeting.client_id,
      });

      return data as Meeting;
    },

    async update(id: string, updates: Partial<Meeting>) {
      const { data, error } = await supabase
        .from('meetings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as Meeting;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    async getToday() {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

      return this.getAll({ date_from: startOfDay, date_to: endOfDay });
    },

    async getUpcoming(limit = 5) {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          lead:leads(id, company_name),
          client:clients(id, company_name)
        `)
        .gte('start_at', now)
        .eq('status', 'scheduled')
        .order('start_at', { ascending: true })
        .limit(limit);
      if (error) throw error;
      return data as Meeting[];
    },

    async addNotes(id: string, notes: string, actionItems?: string[]) {
      return this.update(id, { notes, action_items: actionItems || [] });
    },

    async complete(id: string, followUpRequired?: boolean, followUpDate?: string) {
      return this.update(id, {
        status: 'completed',
        follow_up_required: followUpRequired,
        follow_up_date: followUpDate,
      });
    },
  },

  // Attendees
  attendees: {
    async getByMeeting(meetingId: string) {
      const { data, error } = await supabase
        .from('meeting_attendees')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('meeting_id', meetingId);
      if (error) throw error;
      return data as MeetingAttendee[];
    },

    async updateStatus(id: string, status: 'pending' | 'accepted' | 'declined' | 'tentative') {
      const { data, error } = await supabase
        .from('meeting_attendees')
        .update({ response_status: status })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },

  // Follow-ups
  followups: {
    async getAll(limit = 50) {
      const { data, error } = await supabase
        .from('follow_ups')
        .select(`
          *,
          lead:leads(id, company_name, contact_person, source, phone, email)
        `)
        .order('scheduled_at', { ascending: true })
        .limit(limit);
      if (error) throw error;
      return data as FollowUpExtended[];
    },

    async getToday() {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

      const { data, error } = await supabase
        .from('follow_ups')
        .select(`
          *,
          lead:leads(id, company_name, contact_person, source)
        `)
        .gte('scheduled_at', startOfDay)
        .lt('scheduled_at', endOfDay)
        .eq('completed', false)
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return data as FollowUpExtended[];
    },

    async getUpcoming(limit = 10) {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('follow_ups')
        .select(`
          *,
          lead:leads(id, company_name, contact_person)
        `)
        .gte('scheduled_at', now)
        .eq('completed', false)
        .order('scheduled_at', { ascending: true })
        .limit(limit);
      if (error) throw error;
      return data as FollowUpExtended[];
    },

    async getByLead(leadId: string) {
      const { data, error } = await supabase
        .from('follow_ups')
        .select('*')
        .eq('lead_id', leadId)
        .order('scheduled_at', { ascending: false });
      if (error) throw error;
      return data as FollowUpExtended[];
    },

    async create(followUp: Partial<FollowUpExtended>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('follow_ups')
        .insert({ ...followUp, user_id: user.id })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as FollowUpExtended;
    },

    async complete(id: string, notes?: string) {
      const { data, error } = await supabase
        .from('follow_ups')
        .update({ completed: true, notes, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as FollowUpExtended;
    },

    async reschedule(id: string, newDate: string) {
      const { data, error } = await supabase
        .from('follow_ups')
        .update({ scheduled_at: newDate, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as FollowUpExtended;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('follow_ups')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  // Dashboard Stats
  async getDashboardStats() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const [todayEvents, todayMeetings, todayFollowUps, overdueTasks] = await Promise.all([
      this.events.getByDateRange(startOfDay, endOfDay),
      this.meetings.getAll({ date_from: startOfDay, date_to: endOfDay }),
      this.followups.getToday(),
      supabase.from('tasks').select('*').lt('due_date', startOfDay).neq('status', 'completed'),
    ]);

    return {
      todayEvents: todayEvents.length,
      todayMeetings: todayMeetings.length,
      todayFollowUps: todayFollowUps.length,
      overdueTasks: overdueTasks.data?.length || 0,
      events: todayEvents,
      meetings: todayMeetings,
      followUps: todayFollowUps,
      tasks: overdueTasks.data || [],
    };
  },
};

// Social Media Service
export const socialMediaService = {
  // Posts
  posts: {
    async getAll(page = 1, pageSize = 20, filters?: {
      status?: SocialPostStatus;
      platform?: SocialPlatform;
    }) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('social_posts')
        .select(`
          *,
          media:social_post_media(*)
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.platform) {
        query = query.contains('platforms', [filters.platform]);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data as SocialPost[], count: count || 0 };
    },

    async getDrafts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as SocialPost[];

      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          media:social_post_media(*)
        `)
        .eq('status', 'draft')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) {
        console.error('Error fetching drafts:', error);
        throw error;
      }
      return (data || []) as SocialPost[];
    },

    async getScheduled() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as SocialPost[];

      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          media:social_post_media(*)
        `)
        .eq('status', 'scheduled')
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: true });
      if (error) {
        console.error('Error fetching scheduled posts:', error);
        throw error;
      }
      return (data || []) as SocialPost[];
    },

    async getPublished() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as SocialPost[];

      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          media:social_post_media(*)
        `)
        .eq('status', 'published')
        .eq('user_id', user.id)
        .order('published_at', { ascending: false });
      if (error) {
        console.error('Error fetching published posts:', error);
        throw error;
      }
      return (data || []) as SocialPost[];
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          media:social_post_media(*)
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) {
        console.error('Error fetching post:', error);
        throw error;
      }
      return data as SocialPost | null;
    },

    async create(post: {
      content: string | null;
      platforms: SocialPlatform[];
      status: SocialPostStatus;
      media_type?: SocialMediaType;
      scheduled_at?: string;
    }) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated. Please log in to create posts.');
      }

      const { data, error } = await supabase
        .from('social_posts')
        .insert({
          ...post,
          user_id: user.id,
          platforms: post.platforms as any,
          media_type: post.media_type || null,
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error creating post:', error);
        throw error;
      }
      return data as SocialPost;
    },

    async update(id: string, updates: Partial<SocialPost>) {
      const { data, error } = await supabase
        .from('social_posts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating post:', error);
        throw error;
      }
      return data as SocialPost;
    },

    async delete(id: string) {
      // Media will cascade delete
      const { error } = await supabase
        .from('social_posts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting post:', error);
        throw error;
      }
    },

    async publish(id: string) {
      // For future: integrate with actual social media APIs
      const { data, error } = await supabase
        .from('social_posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error publishing post:', error);
        throw error;
      }
      return data as SocialPost;
    },
  },

  // Media
  media: {
    async upload(file: File, postId: string): Promise<SocialPostMedia> {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${postId}/${Date.now()}.${fileExt}`;
      const isVideo = file.type.startsWith('video/');

      // Upload to storage
      let uploadError = null;
      const { error: initialError } = await supabase.storage
        .from('social-media')
        .upload(fileName, file);

      if (initialError) {
        console.warn('Initial upload failed, trying to ensure bucket exists:', initialError);
        // Try to ensure bucket exists and is public
        try {
          await supabase.storage.createBucket('social-media', { public: true });
        } catch (bucketErr) {
          console.warn('Could not create bucket:', bucketErr);
        }
        const { error: retryError } = await supabase.storage
          .from('social-media')
          .upload(fileName, file);
        uploadError = retryError;
      }

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('social-media')
        .getPublicUrl(fileName);

      // Save media record
      const { data, error } = await supabase
        .from('social_post_media')
        .insert({
          post_id: postId,
          type: isVideo ? 'video' : 'image',
          url: urlData.publicUrl,
          filename: file.name,
          size: file.size,
          mime_type: file.type,
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error saving media record:', error);
        throw error;
      }
      return data as SocialPostMedia;
    },

    async delete(id: string) {
      const { data: media, error: fetchError } = await supabase
        .from('social_post_media')
        .select('url')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (media?.url) {
        // Extract path from URL
        const url = new URL(media.url);
        const pathParts = url.pathname.split('/social-media/')[1];
        if (pathParts) {
          await supabase.storage.from('social-media').remove([pathParts]);
        }
      }

      const { error } = await supabase
        .from('social_post_media')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  // Accounts
  accounts: {
    async getAll() {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .order('platform');
      if (error) throw error;
      return data as SocialAccount[];
    },

    async connect(platform: SocialPlatform, accountName: string) {
      const { data, error } = await supabase
        .from('social_accounts')
        .update({
          is_connected: true,
          account_name: accountName,
          updated_at: new Date().toISOString(),
        })
        .eq('platform', platform)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as SocialAccount;
    },

    async disconnect(platform: SocialPlatform) {
      const { data, error } = await supabase
        .from('social_accounts')
        .update({
          is_connected: false,
          updated_at: new Date().toISOString(),
        })
        .eq('platform', platform)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as SocialAccount;
    },
  },

  // Stats
  async getStats() {
    const { data: { user } } = await supabase.auth.getUser();

    // Get accounts regardless of auth status
    const { data: accountsData, error: accountsError } = await supabase
      .from('social_accounts')
      .select('*');

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
    }

    const accounts = accountsData || [];
    const totalFollowers = accounts.reduce((sum, a) => sum + (a.followers || 0), 0);
    const connectedCount = accounts.filter(a => a.is_connected).length;

    if (!user) {
      return {
        drafts: 0,
        scheduled: 0,
        published: 0,
        totalFollowers,
        connectedAccounts: connectedCount,
        accounts: accounts as SocialAccount[],
      };
    }

    const [drafts, scheduled, published] = await Promise.all([
      supabase.from('social_posts').select('id', { count: 'exact', head: true }).eq('status', 'draft').eq('user_id', user.id),
      supabase.from('social_posts').select('id', { count: 'exact', head: true }).eq('status', 'scheduled').eq('user_id', user.id),
      supabase.from('social_posts').select('id', { count: 'exact', head: true }).eq('status', 'published').eq('user_id', user.id),
    ]);

    return {
      drafts: drafts.count || 0,
      scheduled: scheduled.count || 0,
      published: published.count || 0,
      totalFollowers,
      connectedAccounts: connectedCount,
      accounts: accounts as SocialAccount[],
    };
  },
};
