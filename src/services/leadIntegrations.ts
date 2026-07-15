import { supabase } from '../lib/supabase';
import {
  Lead,
  LeadIntegration,
  LeadImportLog,
  LeadSourceType,
  LeadSyncStatus,
} from '../types';

export const LEAD_PLATFORMS: {
  id: LeadSourceType;
  label: string;
  description: string;
  icon: string;
  color: string;
}[] = [
  { id: 'website_form', label: 'Website Forms', description: 'Embeddable form / website lead capture', icon: 'Globe', color: 'blue' },
  { id: 'facebook_lead_ads', label: 'Facebook Lead Ads', description: 'Meta Lead Ads webhook integration', icon: 'Facebook', color: 'sky' },
  { id: 'google_lead_form', label: 'Google Lead Forms', description: 'Google Ads lead form extensions', icon: 'Chrome', color: 'amber' },
  { id: 'justdial', label: 'Justdial', description: 'Justdial lead API / email forwarding', icon: 'Phone', color: 'emerald' },
  { id: 'indiamart', label: 'IndiaMART', description: 'IndiaMART buylead API', icon: 'ShoppingBag', color: 'orange' },
  { id: 'whatsapp', label: 'WhatsApp', description: 'WhatsApp Business lead capture', icon: 'MessageCircle', color: 'green' },
  { id: 'email', label: 'Email', description: 'Parse inbound email leads', icon: 'Mail', color: 'cyan' },
  { id: 'api_webhook', label: 'API / Webhook', description: 'Generic webhook endpoint for any source', icon: 'Webhook', color: 'violet' },
  { id: 'manual_import', label: 'Manual Import (CSV)', description: 'Bulk upload leads from CSV file', icon: 'Upload', color: 'slate' },
];

export const LEAD_SOURCE_LABELS: Record<LeadSourceType, string> = {
  website_form: 'Website Form',
  facebook_lead_ads: 'Facebook Lead Ads',
  google_lead_form: 'Google Lead Form',
  justdial: 'Justdial',
  indiamart: 'IndiaMART',
  whatsapp: 'WhatsApp',
  email: 'Email',
  api_webhook: 'API / Webhook',
  manual_import: 'Manual Import',
};

export const LEAD_SOURCE_COLORS: Record<LeadSourceType, string> = {
  website_form: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  facebook_lead_ads: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  google_lead_form: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  justdial: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  indiamart: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  whatsapp: 'bg-green-500/20 text-green-300 border-green-500/30',
  email: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  api_webhook: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  manual_import: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

export const SYNC_STATUS_LABELS: Record<LeadSyncStatus, string> = {
  pending: 'Pending',
  synced: 'Synced',
  failed: 'Failed',
  duplicate: 'Duplicate',
};

export const SYNC_STATUS_COLORS: Record<LeadSyncStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  synced: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  failed: 'bg-red-500/20 text-red-300 border-red-500/30',
  duplicate: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

export interface UniversalLead extends Lead {
  assigned_telecaller_name?: string | null;
}

export interface CSVImportResult {
  totalRows: number;
  imported: number;
  duplicates: number;
  failed: number;
  errors: string[];
}

export const leadIntegrationService = {
  async getIntegrations(): Promise<LeadIntegration[]> {
    const { data, error } = await supabase
      .from('lead_integrations')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []) as LeadIntegration[];
  },

  async getIntegrationByPlatform(platform: LeadSourceType): Promise<LeadIntegration | null> {
    const { data, error } = await supabase
      .from('lead_integrations')
      .select('*')
      .eq('platform', platform)
      .maybeSingle();
    if (error) throw error;
    return (data as LeadIntegration) || null;
  },

  async connectIntegration(platform: LeadSourceType, connectionName: string, config: Record<string, unknown> = {}): Promise<LeadIntegration> {
    const { data: existing } = await supabase
      .from('lead_integrations')
      .select('id, config')
      .eq('platform', platform)
      .maybeSingle();

    const existingConfig = (existing?.config as Record<string, unknown>) || {};
    const apiToken = existingConfig.api_token || `gt_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    const finalConfig = { ...existingConfig, ...config, api_token: apiToken };

    if (existing) {
      const { data, error } = await supabase
        .from('lead_integrations')
        .update({
          is_connected: true,
          connection_name: connectionName,
          config: finalConfig,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data as LeadIntegration;
    }

    const { data, error } = await supabase
      .from('lead_integrations')
      .insert({
        platform,
        connection_name: connectionName,
        is_connected: true,
        config: finalConfig,
        status: 'active',
      })
      .select()
      .single();
    if (error) throw error;
    return data as LeadIntegration;
  },

  async disconnectIntegration(id: string): Promise<void> {
    const { error } = await supabase
      .from('lead_integrations')
      .update({ is_connected: false, status: 'paused', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async syncIntegration(id: string): Promise<LeadIntegration> {
    const { data, error } = await supabase
      .from('lead_integrations')
      .update({ last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as LeadIntegration;
  },

  async getUniversalLeads(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    sourceFilter?: LeadSourceType | 'all';
    statusFilter?: string | 'all';
    sortBy?: string;
  } = {}): Promise<{ leads: UniversalLead[]; total: number }> {
    const { page = 1, pageSize = 10, search = '', sourceFilter = 'all', statusFilter = 'all', sortBy = 'imported_at' } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('leads')
      .select('*, assigned_telecaller_name:profiles!leads_assigned_to_fkey(full_name)', { count: 'exact' })
      .not('lead_source', 'is', null);

    if (search) {
      query = query.or(`company_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,campaign_name.ilike.%${search}%`);
    }
    if (sourceFilter !== 'all') {
      query = query.eq('lead_source', sourceFilter);
    }
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    query = query.order(sortBy, { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const leads = (data || []).map((row) => ({
      ...row,
      assigned_telecaller_name: (row as { assigned_telecaller_name?: { full_name: string } | null })?.assigned_telecaller_name?.full_name ?? null,
    })) as UniversalLead[];

    return { leads, total: count || 0 };
  },

  async getImportLogs(limit = 20): Promise<LeadImportLog[]> {
    const { data, error } = await supabase
      .from('lead_import_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []) as LeadImportLog[];
  },

  async importCSVLeads(
    rows: Array<{
      company_name: string;
      contact_person: string;
      email: string;
      phone: string;
      campaign_name?: string;
      website_name?: string;
      external_lead_id?: string;
    }>,
    platform: LeadSourceType = 'manual_import'
  ): Promise<CSVImportResult> {
    const result: CSVImportResult = { totalRows: rows.length, imported: 0, duplicates: 0, failed: 0, errors: [] };

    for (const row of rows) {
      try {
        const insertPayload = {
          company_name: row.company_name || 'Unknown',
          contact_person: row.contact_person || 'Unknown',
          email: row.email || `unknown_${Date.now()}@import.local`,
          phone: row.phone || null,
          source: platform,
          status: 'new',
          lead_source: platform,
          platform,
          campaign_name: row.campaign_name || null,
          website_name: row.website_name || null,
          external_lead_id: row.external_lead_id || null,
          sync_status: 'synced' as LeadSyncStatus,
          imported_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('leads').insert(insertPayload);
        if (error) {
          if (error.code === '23505') {
            result.duplicates++;
          } else {
            result.failed++;
            result.errors.push(`Row "${row.contact_person}": ${error.message}`);
          }
        } else {
          result.imported++;
        }
      } catch (err) {
        result.failed++;
        result.errors.push(`Row "${row.contact_person}": ${(err as Error).message}`);
      }
    }

    await supabase.from('lead_import_logs').insert({
      platform,
      total_rows: result.totalRows,
      imported_count: result.imported,
      duplicate_count: result.duplicates,
      failed_count: result.failed,
      status: result.failed > 0 ? (result.imported > 0 ? 'partial' : 'failed') : 'completed',
    });

    const integration = await this.getIntegrationByPlatform(platform);
    if (integration) {
      await supabase
        .from('lead_integrations')
        .update({
          total_leads_imported: (integration.total_leads_imported || 0) + result.imported,
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', integration.id);
    }

    return result;
  },

  async assignTelecaller(leadId: string, telecallerId: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .update({ assigned_to: telecallerId, updated_at: new Date().toISOString() })
      .eq('id', leadId);
    if (error) throw error;
  },

  async updateLeadStatus(leadId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', leadId);
    if (error) throw error;
  },
};

export function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] || '').trim();
    });
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
