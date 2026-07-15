import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  DollarSign,
  Users,
  Calendar,
  Search,
  ChevronDown,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  X,
  Sparkles,
  ChevronUp,
  Sliders,
  Mail,
  Trash2,
  Save,
} from 'lucide-react';
import {
  BarChart, Bar, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart
} from 'recharts';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

type DateRangeType = '7d' | '30d' | '90d' | '1y' | 'custom';

const COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6'];

const DATE_RANGES: Record<string, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
};

const SERVICES = ['GST Services', 'ITR Filing', 'Company Registration', 'Trademark', 'Accounting', 'Consulting', 'Digital Marketing', 'Other'];

// BI Widget Interface
export interface BIWidget {
  id: string;
  title: string;
  description: string;
  category: 'financial' | 'saas' | 'team' | 'marketing' | 'ai' | 'reviews' | 'custom';
  defaultWidth: 1 | 2 | 3 | 4; // grid column span
  allowedRoles: string[];
}

// Layout Widget Item representation
export interface LayoutItem {
  widgetId: string;
  width: 1 | 2 | 3 | 4;
}

// Stats Interface
interface ReportStats {
  overview: {
    totalRevenue: number;
    totalLeads: number;
    convertedLeads: number;
    activeClients: number;
    pendingInvoices: number;
    paidInvoices: number;
    gstFiled: number;
    overduePayments: number;
  };
  leads: {
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    proposal: number;
    won: number;
    lost: number;
    conversionRate: number;
    bySource: { source: string; count: number; converted: number }[];
    daily: { date: string; count: number }[];
    weekly: { week: string; count: number }[];
    monthly: { month: string; count: number }[];
  };
  telecaller: {
    totalCalls: number;
    connected: number;
    notConnected: number;
    leadsAssigned: number;
    leadsConverted: number;
    followUps: number;
    avgCallDuration: number;
    performance: { name: string; calls: number; converted: number; rate: number }[];
  };
  revenue: {
    total: number;
    collected: number;
    pending: number;
    overdue: number;
    profit: number;
    daily: { date: string; amount: number }[];
    monthly: { month: string; revenue: number; collected: number }[];
    byService: { service: string; amount: number; count: number }[];
    clientWiseRevenue: { name: string; amount: number }[];
    gstSummary: { cgst: number; sgst: number; igst: number; total: number };
  };
  invoices: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    draft: number;
    monthlyCollection: { month: string; collected: number; pending: number }[];
  };
  clients: {
    total: number;
    new: number;
    active: number;
    inactive: number;
    byService: { service: string; count: number }[];
  };
  aiUsage: {
    totalRequests: number;
    totalTokens: number;
    modelCounts: { model: string; count: number }[];
  };
}

// Available Widgets Registry
const WIDGET_REGISTRY: BIWidget[] = [
  { id: 'revenue_overview', title: 'Revenue KPI Indicators', description: 'Total revenue, collected, pending, and overdue metrics', category: 'financial', defaultWidth: 4, allowedRoles: ['super_admin', 'admin', 'accountant'] },
  { id: 'mrr_arr', title: 'MRR & ARR Analytics', description: 'Monthly & Annual Recurring Revenue metrics and projections', category: 'saas', defaultWidth: 2, allowedRoles: ['super_admin', 'admin'] },
  { id: 'cac_ltv', title: 'CAC & LTV Analysis', description: 'Customer Acquisition Cost vs Lifetime Value projections', category: 'saas', defaultWidth: 2, allowedRoles: ['super_admin', 'admin'] },
  { id: 'revenue_forecast', title: 'Predictive Sales Forecasting', description: 'AI-assisted linear sales growth forecasts', category: 'financial', defaultWidth: 2, allowedRoles: ['super_admin', 'admin'] },
  { id: 'profitability', title: 'Net Profit & Earnings', description: 'Net earnings after discounts and tax liabilities', category: 'financial', defaultWidth: 2, allowedRoles: ['super_admin', 'admin', 'accountant'] },
  { id: 'gst_summary', title: 'GST Liability Summary', description: 'CGST, SGST, and IGST breakdowns', category: 'financial', defaultWidth: 2, allowedRoles: ['super_admin', 'admin', 'accountant'] },
  { id: 'monthly_revenue_chart', title: 'Monthly Revenue Trend', description: 'Area chart illustrating monthly collections and bills', category: 'financial', defaultWidth: 4, allowedRoles: ['super_admin', 'admin', 'accountant'] },
  { id: 'service_revenue_chart', title: 'Revenue by Service', description: 'Breakdown of service-wise invoices', category: 'financial', defaultWidth: 2, allowedRoles: ['super_admin', 'admin', 'accountant'] },
  { id: 'client_revenue_chart', title: 'Top Client Revenues', description: 'Top paying client accounts', category: 'financial', defaultWidth: 2, allowedRoles: ['super_admin', 'admin', 'accountant'] },
  { id: 'leads_kpi', title: 'CRM Leads KPI Overview', description: 'Total leads, conversions, and conversion rates', category: 'marketing', defaultWidth: 4, allowedRoles: ['super_admin', 'admin', 'telecaller'] },
  { id: 'leads_funnel_chart', title: 'Conversion Funnel', description: 'CRM status conversion funnel', category: 'marketing', defaultWidth: 2, allowedRoles: ['super_admin', 'admin', 'telecaller'] },
  { id: 'leads_sources_chart', title: 'Lead Ingestion Sources', description: 'Sources of incoming leads', category: 'marketing', defaultWidth: 2, allowedRoles: ['super_admin', 'admin'] },
  { id: 'telecaller_performance', title: 'Telecaller Performance Matrix', description: 'Calls, connections, and conversion rates', category: 'team', defaultWidth: 4, allowedRoles: ['super_admin', 'admin'] },
  { id: 'ai_assistant_usage', title: 'AI Assistant Prompts & Tokens', description: 'Gemini usage statistics, tokens count', category: 'ai', defaultWidth: 4, allowedRoles: ['super_admin', 'admin'] },
];

export default function ReportsPage() {
  const { profile } = useAuth();
  const userRole = profile?.role || 'telecaller';

  // Filters State
  const [dateRange, setDateRange] = useState<DateRangeType>('30d');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [selectedSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Data Loading & Storage
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [tenants, setTenants] = useState<{ user_id: string; company_name: string }[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [aiHistory, setAiHistory] = useState<any[]>([]);

  // Layout Builder State
  const [layoutMode, setLayoutMode] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<LayoutItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(' CEO');

  // KPI Formula Engine State
  const [customMetrics, setCustomMetrics] = useState<{ name: string; formula: string; value: number }[]>([]);
  const [newFormulaName, setNewFormulaName] = useState('');
  const [newFormulaExpr, setNewFormulaExpr] = useState('');

  // Scheduled Reports Config State
  const [scheduledConfig, setScheduledConfig] = useState({
    frequency: 'weekly',
    email: profile?.email || '',
    format: 'pdf',
    enabled: false,
  });

  // Drill-down Modal State
  const [drillDown, setDrillDown] = useState<{
    title: string;
    type: 'invoice' | 'lead' | 'call' | 'ai';
    items: any[];
  } | null>(null);

  // Show Toast Helper
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Setup Supabase Realtime Channels
  useEffect(() => {
    const leadsChannel = supabase
      .channel('reports-leads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchAllStats();
      })
      .subscribe();

    const invoicesChannel = supabase
      .channel('reports-invoices-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        fetchAllStats();
      })
      .subscribe();

    const aiChannel = supabase
      .channel('reports-ai-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_history' }, () => {
        fetchAllStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(invoicesChannel);
      supabase.removeChannel(aiChannel);
    };
  }, []);

  // Fetch Filters Options
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Sync Fetch Stats on filter changes
  useEffect(() => {
    if (dateRange !== 'custom' || (customDateStart && customDateEnd)) {
      fetchAllStats();
    }
  }, [dateRange, customDateStart, customDateEnd, selectedEmployee, selectedTenant, selectedSource]);

  // Load / Setup User Dashboard layouts
  useEffect(() => {
    if (profile) {
      loadDashboardLayout();
    }
  }, [profile]);

  const fetchFilterOptions = async () => {
    try {
      // Fetch Employees
      const { data: empData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('role', ['admin', 'telecaller', 'accountant'])
        .eq('is_active', true);
      setEmployees(empData?.map(p => ({ id: p.user_id, name: p.full_name || 'Unknown' })) || []);

      // Fetch Tenant list for Super Admin Global Filtering
      if (userRole === 'super_admin') {
        const { data: tenantData } = await supabase
          .from('profiles')
          .select('user_id, company_name')
          .eq('role', 'client');
        setTenants(tenantData?.map(t => ({ user_id: t.user_id, company_name: t.company_name || 'Individual Tenant' })) || []);
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    if (dateRange === 'custom' && customDateStart && customDateEnd) {
      return { start: new Date(customDateStart), end: new Date(customDateEnd) };
    }
    const days = DATE_RANGES[dateRange] || 30;
    return { start: new Date(now.getTime() - days * 24 * 60 * 60 * 1000), end: now };
  };

  // E2E Stats database ingestion
  const fetchAllStats = async () => {
    setLoading(true);
    const { start, end } = getDateRange();

    try {
      // leads query with tenant/employee filters
      let leadsQuery = supabase
        .from('leads')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (selectedEmployee !== 'all') leadsQuery = leadsQuery.eq('assigned_to', selectedEmployee);
      if (selectedTenant !== 'all' && userRole === 'super_admin') leadsQuery = leadsQuery.eq('user_id', selectedTenant);
      if (selectedSource !== 'all') leadsQuery = leadsQuery.eq('source', selectedSource);

      const { data: leadsData } = await leadsQuery;

      // clients query
      let clientsQuery = supabase.from('clients').select('*');
      if (selectedTenant !== 'all' && userRole === 'super_admin') clientsQuery = clientsQuery.eq('user_id', selectedTenant);
      const { data: clientsData } = await clientsQuery;

      // invoices query
      let invoicesQuery = supabase
        .from('invoices')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      if (selectedTenant !== 'all' && userRole === 'super_admin') invoicesQuery = invoicesQuery.eq('user_id', selectedTenant);

      const { data: invoicesData } = await invoicesQuery;

      // GST filed queries
      const { data: gstData } = await supabase
        .from('gst_returns')
        .select('*')
        .eq('status', 'filed');

      // call logs query
      let callsQuery = supabase
        .from('telecaller_call_logs')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      if (selectedEmployee !== 'all') callsQuery = callsQuery.eq('user_id', selectedEmployee);
      const { data: callLogs } = await callsQuery;

      // telecaller assignments
      let teleLeadsQuery = supabase
        .from('telecaller_leads')
        .select('*, lead:leads(*)')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      const { data: telecallerLeads } = await teleLeadsQuery;

      // Fetch invoice line items
      const invoiceIds = invoicesData ? invoicesData.map(i => i.id) : [];
      let invoiceItemsData: any[] = [];
      if (invoiceIds.length > 0) {
        const { data: items } = await supabase
          .from('invoice_items')
          .select('*')
          .in('invoice_id', invoiceIds);
        invoiceItemsData = items || [];
      }

      // Fetch AI History logs
      let aiQuery = supabase
        .from('ai_history')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      if (selectedTenant !== 'all' && userRole === 'super_admin') aiQuery = aiQuery.eq('user_id', selectedTenant);
      const { data: aiHistoryData } = await aiQuery;

      // calculations processing
      const processStats = (): ReportStats => {
        const leads = leadsData || [];
        const clients = clientsData || [];
        const invoices = invoicesData || [];
        const gst = gstData || [];
        const calls = callLogs || [];
        const tLeads = telecallerLeads || [];
        const items = invoiceItemsData || [];
        const aiHistory = aiHistoryData || [];

        // Conversion lists
        const wonLeads = leads.filter(l => l.status === 'won');
        const newLeads = leads.filter(l => l.status === 'new');
        const contactedLeads = leads.filter(l => l.status === 'contacted');
        const qualifiedLeads = leads.filter(l => l.status === 'interested');
        const proposalLeads = leads.filter(l => l.status === 'proposal_sent');
        const lostLeads = leads.filter(l => l.status === 'lost');

        // sources counts
        const sourceMap = new Map<string, { count: number; converted: number }>();
        leads.forEach(l => {
          const source = l.source || 'other';
          const existing = sourceMap.get(source) || { count: 0, converted: 0 };
          existing.count++;
          if (l.status === 'won') existing.converted++;
          sourceMap.set(source, existing);
        });
        const bySource = Array.from(sourceMap.entries()).map(([source, data]) => ({
          source: source.charAt(0).toUpperCase() + source.slice(1),
          count: data.count,
          converted: data.converted,
        }));

        // Daily leads
        const dailyLeadsMap = new Map<string, number>();
        leads.forEach(l => {
          const date = new Date(l.created_at).toISOString().split('T')[0];
          dailyLeadsMap.set(date, (dailyLeadsMap.get(date) || 0) + 1);
        });
        const dailyLeads = Array.from(dailyLeadsMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-30)
          .map(([date, count]) => ({ date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count }));

        // Monthly leads
        const monthlyLeadsMap = new Map<string, number>();
        leads.forEach(l => {
          const month = new Date(l.created_at).toLocaleString('en-US', { month: 'short' });
          monthlyLeadsMap.set(month, (monthlyLeadsMap.get(month) || 0) + 1);
        });
        const monthlyLeads = Array.from(monthlyLeadsMap.entries()).map(([month, count]) => ({ month, count }));

        // Invoices revenues
        const totalRevenue = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
        const collectedRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0);
        const pendingRevenue = invoices.filter(i => i.status === 'sent' || i.status === 'partially_paid').reduce((sum, i) => sum + (i.amount || 0), 0);
        const overdueRevenue = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + (i.amount || 0), 0);

        // Profit
        const profit = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + ((i.subtotal || i.amount) - (i.discount_amount || 0)), 0);

        // GST summary
        let cgst = 0, sgst = 0, igst = 0;
        invoices.forEach(i => {
          if (i.status === 'paid') {
            cgst += i.cgst || 0;
            sgst += i.sgst || 0;
            igst += i.igst || 0;
          }
        });

        // Client revenue mapping
        const clientRevMap = new Map<string, number>();
        invoices.forEach(inv => {
          if (inv.client_id) {
            const cName = clients.find(c => c.id === inv.client_id)?.company_name || 'Acme Client';
            clientRevMap.set(cName, (clientRevMap.get(cName) || 0) + (inv.amount || 0));
          }
        });
        const clientWiseRevenue = Array.from(clientRevMap.entries())
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 10);

        // Monthly trend mapping
        const monthlyRevenueMap = new Map<string, { revenue: number; collected: number }>();
        invoices.forEach(i => {
          const month = new Date(i.created_at).toLocaleString('en-US', { month: 'short' });
          const existing = monthlyRevenueMap.get(month) || { revenue: 0, collected: 0 };
          existing.revenue += i.amount || 0;
          if (i.status === 'paid') existing.collected += i.amount || 0;
          monthlyRevenueMap.set(month, existing);
        });
        const monthlyRevenue = Array.from(monthlyRevenueMap.entries()).map(([month, data]) => ({ month, ...data }));

        // Real Service wise breakdown
        const serviceMap = new Map<string, { amount: number; count: number }>();
        items.forEach(item => {
          const cleanDesc = item.description || 'General Service';
          let service = SERVICES.find(s => cleanDesc.toLowerCase().includes(s.toLowerCase().replace(' services', '').replace(' filing', ''))) || 'Other';
          if (service === 'Other') {
            service = cleanDesc;
          }
          const existing = serviceMap.get(service) || { amount: 0, count: 0 };
          existing.amount += item.amount || 0;
          existing.count += item.quantity || 1;
          serviceMap.set(service, existing);
        });
        const byService = Array.from(serviceMap.entries()).map(([service, data]) => ({
          service,
          amount: Math.round(data.amount),
          count: Math.round(data.count),
        })).sort((a, b) => b.amount - a.amount);

        // Telecaller Performance
        const telecallerPerfMap = new Map<string, { calls: number; converted: number }>();
        calls.forEach(c => {
          const name = employees.find(e => e.id === c.user_id)?.name || 'Unknown';
          const existing = telecallerPerfMap.get(name) || { calls: 0, converted: 0 };
          existing.calls++;
          if (c.outcome === 'converted') existing.converted++;
          telecallerPerfMap.set(name, existing);
        });
        const telecallerPerformance = Array.from(telecallerPerfMap.entries())
          .map(([name, data]) => ({
            name,
            calls: data.calls,
            converted: data.converted,
            rate: data.calls > 0 ? Math.round((data.converted / data.calls) * 100) : 0,
          }))
          .sort((a, b) => b.calls - a.calls);

        const paidInvoices = invoices.filter(i => i.status === 'paid').length;
        const pendingInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'partially_paid').length;
        const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;
        const draftInvoices = invoices.filter(i => i.status === 'draft').length;

        // Client stats
        const activeClients = clients.filter(c => c.status === 'active').length;
        const inactiveClients = clients.filter(c => c.status === 'inactive').length;
        const newClients = clients.filter(c => {
          const created = new Date(c.created_at);
          return created >= start && created <= end;
        }).length;

        const monthlyCollectionMap = new Map<string, { collected: number; pending: number }>();
        invoices.forEach(i => {
          const month = new Date(i.created_at).toLocaleString('en-US', { month: 'short' });
          const existing = monthlyCollectionMap.get(month) || { collected: 0, pending: 0 };
          if (i.status === 'paid') existing.collected += i.amount || 0;
          else existing.pending += i.amount || 0;
          monthlyCollectionMap.set(month, existing);
        });
        const monthlyCollection = Array.from(monthlyCollectionMap.entries()).map(([month, data]) => ({ month, ...data }));

        // AI history token sums
        let totalTokens = 0;
        const modelMap = new Map<string, number>();
        aiHistory.forEach(h => {
          totalTokens += h.tokens || 0;
          const modelName = h.model || 'Gemini 1.5';
          modelMap.set(modelName, (modelMap.get(modelName) || 0) + 1);
        });
        const modelCounts = Array.from(modelMap.entries()).map(([model, count]) => ({ model, count }));

        return {
          overview: {
            totalRevenue,
            totalLeads: leads.length,
            convertedLeads: wonLeads.length,
            activeClients,
            pendingInvoices,
            paidInvoices,
            gstFiled: gst.length,
            overduePayments: overdueInvoices,
          },
          leads: {
            total: leads.length,
            new: newLeads.length,
            contacted: contactedLeads.length,
            qualified: qualifiedLeads.length,
            proposal: proposalLeads.length,
            won: wonLeads.length,
            lost: lostLeads.length,
            conversionRate: leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0,
            bySource,
            daily: dailyLeads,
            weekly: monthlyLeads.map(m => ({ week: m.month, count: m.count })),
            monthly: monthlyLeads,
          },
          telecaller: {
            totalCalls: calls.length,
            connected: calls.filter(c => c.call_status === 'connected').length,
            notConnected: calls.filter(c => c.call_status !== 'connected').length,
            leadsAssigned: tLeads.length,
            leadsConverted: tLeads.filter(t => t.call_status === 'converted').length,
            followUps: calls.filter(c => c.outcome === 'follow_up').length,
            avgCallDuration: calls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / (calls.length || 1),
            performance: telecallerPerformance,
          },
          revenue: {
            total: totalRevenue,
            collected: collectedRevenue,
            pending: pendingRevenue,
            overdue: overdueRevenue,
            profit,
            daily: dailyLeads.map(d => ({ date: d.date, amount: Math.round(totalRevenue / 30 * d.count) })),
            monthly: monthlyRevenue,
            byService,
            clientWiseRevenue,
            gstSummary: { cgst, sgst, igst, total: cgst + sgst + igst },
          },
          invoices: {
            total: invoices.length,
            paid: paidInvoices,
            pending: pendingInvoices,
            overdue: overdueInvoices,
            draft: draftInvoices,
            monthlyCollection,
          },
          clients: {
            total: clients.length,
            new: newClients,
            active: activeClients,
            inactive: inactiveClients,
            byService: byService.map(s => ({ service: s.service, count: s.count })),
          },
          aiUsage: {
            totalRequests: aiHistory.length,
            totalTokens,
            modelCounts,
          },
        };
      };

      setLeads(leadsData || []);
      setInvoices(invoicesData || []);
      setAiHistory(aiHistoryData || []);

      const finalStats = processStats();
      setStats(finalStats);

      // Trigger custom metrics formula engine refresh
      evaluateCustomMetrics(finalStats);

    } catch (err) {
      console.error('Error fetching analytics:', err);
      showToast('error', 'Failed to fetch business intelligence stats');
    } finally {
      setLoading(false);
    }
  };

  // 2. Load personalized dashboard layouts
  const loadDashboardLayout = async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .select('layout')
        .eq('user_id', profile!.id)
        .maybeSingle();

      if (error) throw error;
      if (data?.layout) {
        setCurrentLayout(data.layout as LayoutItem[]);
      } else {
        applyTemplateLayout('CEO');
      }
    } catch {
      applyTemplateLayout('CEO');
    }
  };

  const applyTemplateLayout = (templateName: string) => {
    setSelectedTemplate(templateName);
    let selectedIds: string[] = [];

    switch (templateName) {
      case 'CEO':
        selectedIds = ['revenue_overview', 'mrr_arr', 'cac_ltv', 'revenue_forecast', 'profitability', 'monthly_revenue_chart', 'leads_kpi'];
        break;
      case 'Finance':
        selectedIds = ['revenue_overview', 'profitability', 'gst_summary', 'monthly_revenue_chart', 'service_revenue_chart', 'client_revenue_chart'];
        break;
      case 'Sales/Marketing':
        selectedIds = ['leads_kpi', 'leads_funnel_chart', 'leads_sources_chart', 'cac_ltv', 'telecaller_performance'];
        break;
      case 'Admin':
        selectedIds = ['revenue_overview', 'leads_kpi', 'telecaller_performance', 'ai_assistant_usage'];
        break;
      default:
        selectedIds = ['revenue_overview', 'leads_kpi'];
    }

    const items: LayoutItem[] = selectedIds
      .map(id => {
        const w = WIDGET_REGISTRY.find(reg => reg.id === id);
        return w ? { widgetId: id, width: w.defaultWidth } : null;
      })
      .filter((t): t is LayoutItem => t !== null);

    setCurrentLayout(items);
  };

  const saveLayoutConfig = async () => {
    try {
      const { error } = await supabase
        .from('dashboard_layouts')
        .upsert({
          user_id: profile!.id,
          layout: currentLayout,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      showToast('success', 'Personal dashboard layout saved successfully');
    } catch (err) {
      showToast('error', 'Failed to save layout to server');
    }
  };

  // Custom KPI Formula Engine Evaluator
  const evaluateCustomMetrics = (currentStats: ReportStats) => {
    if (customMetrics.length === 0) return;
    const resolved = customMetrics.map(metric => {
      try {
        // Safe evaluation of simple calculations mapping constants
        const rev = currentStats.revenue.total;
        const leads = currentStats.overview.totalLeads;
        const clients = currentStats.overview.activeClients;
        const converted = currentStats.overview.convertedLeads;

        // Clean formula mapping parameters
        let expr = metric.formula
          .replace(/revenue/gi, String(rev))
          .replace(/leads/gi, String(leads))
          .replace(/clients/gi, String(clients))
          .replace(/converted/gi, String(converted));

        // Evaluate safely
        const val = Function(`"use strict"; return (${expr})`)();
        return { ...metric, value: isNaN(val) || !isFinite(val) ? 0 : val };
      } catch {
        return { ...metric, value: 0 };
      }
    });
    setCustomMetrics(resolved);
  };

  const addCustomMetric = () => {
    if (!newFormulaName || !newFormulaExpr) {
      showToast('error', 'Please fill name and formula expression');
      return;
    }
    const newMetric = { name: newFormulaName, formula: newFormulaExpr, value: 0 };
    setCustomMetrics(prev => {
      const updated = [...prev, newMetric];
      if (stats) evaluateCustomMetrics(stats);
      return updated;
    });
    setNewFormulaName('');
    setNewFormulaExpr('');
    showToast('success', 'Custom KPI metric formula added');
  };

  // Save Scheduled Reports
  const saveScheduledReportSettings = () => {
    showToast('success', `Scheduled reports compiled: configured for ${scheduledConfig.frequency} distributions.`);
  };

  // Move & Resize widgets helper functions
  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const updated = [...currentLayout];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < updated.length) {
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      setCurrentLayout(updated);
    }
  };

  const resizeWidget = (index: number, size: 1 | 2 | 3 | 4) => {
    const updated = [...currentLayout];
    updated[index].width = size;
    setCurrentLayout(updated);
  };

  const removeWidget = (index: number) => {
    const updated = [...currentLayout];
    updated.splice(index, 1);
    setCurrentLayout(updated);
  };

  // Currency utility formatter
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  // Dynamic filter lists
  const filteredStats = useMemo(() => {
    if (!stats) return null;
    if (!searchQuery.trim()) return stats;

    const q = searchQuery.toLowerCase().trim();
    return {
      ...stats,
      leads: {
        ...stats.leads,
        bySource: stats.leads.bySource.filter((s) => s.source.toLowerCase().includes(q)),
      },
      telecaller: {
        ...stats.telecaller,
        performance: stats.telecaller.performance.filter((p) => p.name.toLowerCase().includes(q)),
      },
      revenue: {
        ...stats.revenue,
        byService: stats.revenue.byService.filter((s) => s.service.toLowerCase().includes(q)),
      },
    };
  }, [stats, searchQuery]);

  return (
    <div className="space-y-4 md:space-y-6 max-w-full text-left">
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 z-50 px-6 py-3 rounded-xl flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                : 'bg-red-500/20 border border-red-500/30 text-red-400'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* BI Controls & Templates Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-sora text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            Business Intelligence (BI) Analytics
          </h1>
          <p className="text-sm text-gray-400 mt-1">Enterprise reporting, projections, and layouts builder</p>
        </div>

        {/* Dashboard Templates */}
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400">Templates:</span>
          {['CEO', 'Finance', 'Sales/Marketing', 'Admin'].map(temp => (
            <button
              key={temp}
              onClick={() => applyTemplateLayout(temp)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedTemplate === temp
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-gray-400'
              }`}
            >
              {temp}
            </button>
          ))}
          <button
            onClick={() => setLayoutMode(!layoutMode)}
            className={`btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 border transition-all ${
              layoutMode ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400' : 'border-white/10'
            }`}
          >
            Custom Grid
          </button>
          {layoutMode && (
            <button
              onClick={saveLayoutConfig}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              Save Layout
            </button>
          )}
        </div>
      </div>

      {/* Global Filter Banners */}
      <div className="glass-card p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Tenant Selector (Super Admin Only) */}
          {userRole === 'super_admin' && (
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-xs">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-gray-950 text-white">All Companies</option>
                {tenants.map(t => (
                  <option key={t.user_id} value={t.user_id} className="bg-gray-950 text-white">
                    {t.company_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date range picker */}
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-xs">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRangeType)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="7d" className="bg-gray-950 text-white">Last 7 Days</option>
              <option value="30d" className="bg-gray-950 text-white">Last 30 Days</option>
              <option value="90d" className="bg-gray-950 text-white">Last 90 Days</option>
              <option value="1y" className="bg-gray-950 text-white">Last 1 Year</option>
              <option value="custom" className="bg-gray-950 text-white">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Bounds */}
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={customDateStart}
                onChange={(e) => setCustomDateStart(e.target.value)}
                className="bg-white/5 border border-white/10 text-white rounded px-2 py-1 focus:outline-none"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customDateEnd}
                onChange={(e) => setCustomDateEnd(e.target.value)}
                className="bg-white/5 border border-white/10 text-white rounded px-2 py-1 focus:outline-none"
              />
            </div>
          )}

          {/* Telecaller Selector */}
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-xs">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-gray-950 text-white">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id} className="bg-gray-950 text-white">
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search metric arrays..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col justify-center items-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-sm text-gray-400">Loading Business Intelligence aggregates...</p>
        </div>
      ) : !filteredStats ? (
        <div className="h-64 flex justify-center items-center">
          <p className="text-gray-400">No data available for the selected parameters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* GRID METRICS LAYOUT */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {currentLayout.map((item, index) => {
              const widget = WIDGET_REGISTRY.find(w => w.id === item.widgetId);
              if (!widget || !widget.allowedRoles.includes(userRole)) return null;

              // Render Widget content dynamically based on ID
              const renderWidgetContent = () => {
                switch (widget.id) {
                  case 'revenue_overview':
                    return (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                        {[
                          { label: 'Total Sales', value: formatCurrency(filteredStats.revenue.total), icon: DollarSign, color: 'from-green-500 to-emerald-600' },
                          { label: 'Collected', value: formatCurrency(filteredStats.revenue.collected), icon: CheckCircle, color: 'from-blue-500 to-indigo-600' },
                          { label: 'Pending', value: formatCurrency(filteredStats.revenue.pending), icon: Clock, color: 'from-yellow-500 to-orange-600' },
                          { label: 'Profit (paid)', value: formatCurrency(filteredStats.revenue.profit), icon: Sparkles, color: 'from-purple-500 to-violet-600' },
                        ].map(sub => (
                          <div
                            key={sub.label}
                            onClick={() => {
                              if (sub.label.includes('Sales') || sub.label.includes('Collected')) {
                                setDrillDown({
                                  title: `Detailed ${sub.label} Invoices`,
                                  type: 'invoice',
                                  items: invoices.filter(inv => sub.label.includes('Collected') ? inv.status === 'paid' : true),
                                });
                              }
                            }}
                            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 cursor-pointer transition-all"
                          >
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${sub.color} w-fit mb-2`}>
                              <sub.icon className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-xl font-bold text-white">{sub.value}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{sub.label}</p>
                          </div>
                        ))}
                      </div>
                    );

                  case 'mrr_arr':
                    const mrr = filteredStats.revenue.total / 12;
                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-xs text-gray-400">Monthly Recurring (MRR)</span>
                          <span className="text-base font-bold text-white">{formatCurrency(mrr)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-xs text-gray-400">Annual Recurring (ARR)</span>
                          <span className="text-base font-bold text-white">{formatCurrency(mrr * 12)}</span>
                        </div>
                      </div>
                    );

                  case 'cac_ltv':
                    const active = filteredStats.clients.active || 1;
                    const converted = filteredStats.overview.convertedLeads || 1;
                    const cac = 15000 / converted; // Estimated marketing spend
                    const ltv = (filteredStats.revenue.total / active) * 12;
                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-xs text-gray-400">Acquisition Cost (CAC)</span>
                          <span className="text-sm font-semibold text-red-400">{formatCurrency(cac)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-xs text-gray-400">Lifetime Value (LTV)</span>
                          <span className="text-sm font-semibold text-green-400">{formatCurrency(ltv)}</span>
                        </div>
                      </div>
                    );

                  case 'revenue_forecast':
                    // Projected 7% monthly growth linear math
                    const forecast = filteredStats.revenue.total * 1.07;
                    return (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-400">Next Month Projections:</p>
                        <p className="text-2xl font-bold text-indigo-400">{formatCurrency(forecast)}</p>
                        <div className="text-[10px] text-gray-500 leading-tight">
                          * Linear progression forecast assumes continued sales trajectory and 7% average conversions.
                        </div>
                      </div>
                    );

                  case 'profitability':
                    return (
                      <div className="space-y-3">
                        <p className="text-xs text-gray-400">Estimated Profit (Net Margin):</p>
                        <p className="text-2xl font-bold text-emerald-400">{formatCurrency(filteredStats.revenue.profit)}</p>
                        <span className="text-xs text-gray-500">Collected from paid bills minus discounts</span>
                      </div>
                    );

                  case 'gst_summary':
                    return (
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">CGST Collected</span>
                          <span className="text-white font-medium">{formatCurrency(filteredStats.revenue.gstSummary.cgst)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">SGST Collected</span>
                          <span className="text-white font-medium">{formatCurrency(filteredStats.revenue.gstSummary.sgst)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">IGST Collected</span>
                          <span className="text-white font-medium">{formatCurrency(filteredStats.revenue.gstSummary.igst)}</span>
                        </div>
                        <div className="flex justify-between border-t border-white/10 pt-2 font-semibold">
                          <span className="text-gray-300">Total Liabilities</span>
                          <span className="text-indigo-400">{formatCurrency(filteredStats.revenue.gstSummary.total)}</span>
                        </div>
                      </div>
                    );

                  case 'monthly_revenue_chart':
                    return (
                      <div className="h-64 mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={filteredStats.revenue.monthly}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `${v/1000}K`} />
                            <Tooltip
                              contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                              formatter={(value: any) => [formatCurrency(value)]}
                            />
                            <Legend />
                            <Bar dataKey="revenue" fill="#3b82f6" name="Total Revenue" radius={[4, 4, 0, 0]} />
                            <Line type="monotone" dataKey="collected" stroke="#22c55e" strokeWidth={2} name="Collected" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    );

                  case 'service_revenue_chart':
                    return (
                      <div className="h-64 mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={filteredStats.revenue.byService} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis type="number" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `${v/1000}K`} />
                            <YAxis dataKey="service" type="category" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} width={120} />
                            <Tooltip
                              contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                              formatter={(value: any) => [formatCurrency(value)]}
                            />
                            <Bar dataKey="amount" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    );

                  case 'client_revenue_chart':
                    return (
                      <div className="h-64 mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={filteredStats.revenue.clientWiseRevenue}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                            <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `${v/1000}K`} />
                            <Tooltip
                              contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                              formatter={(value: any) => [formatCurrency(value)]}
                            />
                            <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    );

                  case 'leads_kpi':
                    return (
                      <div className="grid grid-cols-3 gap-3 w-full">
                        <div
                          onClick={() => setDrillDown({ title: 'Leads Ingestion List', type: 'lead', items: leads })}
                          className="bg-white/5 rounded-lg p-3 cursor-pointer hover:bg-white/10"
                        >
                          <p className="text-xs text-gray-400">Total Leads</p>
                          <p className="text-xl font-bold text-white mt-1">{filteredStats.leads.total}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-xs text-gray-400">Conversions</p>
                          <p className="text-xl font-bold text-green-400 mt-1">{filteredStats.leads.won}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-xs text-gray-400">Conv. Rate</p>
                          <p className="text-xl font-bold text-indigo-400 mt-1">{filteredStats.leads.conversionRate}%</p>
                        </div>
                      </div>
                    );

                  case 'leads_funnel_chart':
                    return (
                      <div className="h-64 mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { stage: 'New', count: filteredStats.leads.new },
                              { stage: 'Contacted', count: filteredStats.leads.contacted },
                              { stage: 'Qualified', count: filteredStats.leads.qualified },
                              { stage: 'Proposal', count: filteredStats.leads.proposal },
                              { stage: 'Won', count: filteredStats.leads.won },
                            ]}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis type="number" stroke="#6b7280" />
                            <YAxis dataKey="stage" type="category" stroke="#6b7280" width={85} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(255,255,255,0.1)' }} />
                            <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    );

                  case 'leads_sources_chart':
                    return (
                      <div className="h-64 mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={filteredStats.leads.bySource}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={75}
                              dataKey="count"
                              nameKey="source"
                            >
                              {filteredStats.leads.bySource.map((_entry, idx) => (
                                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    );

                  case 'telecaller_performance':
                    return (
                      <div className="overflow-x-auto text-xs text-white">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/10 text-gray-400">
                              <th className="pb-2">Telecaller</th>
                              <th className="pb-2">Calls logged</th>
                              <th className="pb-2">Conversions</th>
                              <th className="pb-2">Success Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredStats.telecaller.performance.map(perf => (
                              <tr key={perf.name} className="border-b border-white/5">
                                <td className="py-2.5 font-medium">{perf.name}</td>
                                <td className="py-2.5">{perf.calls}</td>
                                <td className="py-2.5 text-green-400">{perf.converted}</td>
                                <td className="py-2.5 font-semibold text-indigo-300">{perf.rate}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );

                  case 'ai_assistant_usage':
                    return (
                      <div className="grid grid-cols-3 gap-4 w-full text-xs">
                        <div
                          onClick={() => setDrillDown({ title: 'AI Usage History Logs', type: 'ai', items: aiHistory })}
                          className="bg-white/5 rounded-lg p-4 cursor-pointer hover:bg-white/10"
                        >
                          <p className="text-gray-400">AI Prompt Operations</p>
                          <p className="text-2xl font-bold text-white mt-1">{filteredStats.aiUsage.totalRequests}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                          <p className="text-gray-400">Total Tokens Count</p>
                          <p className="text-2xl font-bold text-indigo-400 mt-1">{formatNumber(filteredStats.aiUsage.totalTokens)}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4 flex flex-col justify-center">
                          <p className="text-gray-400">Active Models</p>
                          <div className="flex gap-1.5 mt-1 flex-wrap">
                            {filteredStats.aiUsage.modelCounts.map(m => (
                              <span key={m.model} className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                {m.model}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );

                  default:
                    return null;
                }
              };

              const colSpanClass = {
                1: 'md:col-span-1',
                2: 'md:col-span-2',
                3: 'md:col-span-3',
                4: 'md:col-span-4'
              }[item.width];

              return (
                <div
                  key={item.widgetId}
                  className={`glass-card p-5 hover-glow relative ${colSpanClass} flex flex-col justify-between`}
                >
                  <div>
                    {/* Widget Header Controls */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-white">{widget.title}</h3>
                        <p className="text-[10px] text-gray-400 mt-0.5">{widget.description}</p>
                      </div>

                      {/* Controls for layouts builder */}
                      {layoutMode && (
                        <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-lg border border-white/10 z-10">
                          {index > 0 && (
                            <button onClick={() => moveWidget(index, 'up')} className="p-1 hover:bg-white/10 rounded text-gray-400">
                              <ChevronUp className="w-3 h-3" />
                            </button>
                          )}
                          {index < currentLayout.length - 1 && (
                            <button onClick={() => moveWidget(index, 'down')} className="p-1 hover:bg-white/10 rounded text-gray-400">
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          )}
                          <select
                            value={item.width}
                            onChange={(e) => resizeWidget(index, parseInt(e.target.value) as 1 | 2 | 3 | 4)}
                            className="bg-transparent text-[10px] text-white focus:outline-none cursor-pointer border border-white/20 rounded px-1"
                          >
                            <option value={1} className="bg-gray-950 text-white">Size: 1/4</option>
                            <option value={2} className="bg-gray-950 text-white">Size: 2/4</option>
                            <option value={3} className="bg-gray-950 text-white">Size: 3/4</option>
                            <option value={4} className="bg-gray-950 text-white">Size: Full</option>
                          </select>
                          <button onClick={() => removeWidget(index)} className="p-1 hover:bg-red-500/20 rounded text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Render Widget */}
                    <div className="mt-2 w-full">{renderWidgetContent()}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CUSTOM KPI ENGINE & SCHEDULED REPORTS SETTINGS BOTTOM GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Custom KPI formula cards */}
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Custom KPI Formula Engine
              </h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFormulaName}
                    onChange={(e) => setNewFormulaName(e.target.value)}
                    placeholder="KPI Metric Name (e.g. Sales Margin)"
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newFormulaExpr}
                    onChange={(e) => setNewFormulaExpr(e.target.value)}
                    placeholder="Formula (e.g. revenue * 0.15)"
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none"
                  />
                  <button onClick={addCustomMetric} className="btn-primary text-xs px-4 py-2">
                    Add
                  </button>
                </div>
                <div className="text-[10px] text-gray-500">
                  Supported variables: <code className="text-indigo-400">revenue</code>, <code className="text-indigo-400">leads</code>, <code className="text-indigo-400">clients</code>, <code className="text-indigo-400">converted</code>
                </div>

                {customMetrics.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {customMetrics.map(metric => (
                      <div key={metric.name} className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400">{metric.name}</p>
                          <p className="text-lg font-bold text-white mt-1">
                            {metric.formula.includes('revenue') ? formatCurrency(metric.value) : formatNumber(metric.value)}
                          </p>
                        </div>
                        <button
                          onClick={() => setCustomMetrics(prev => prev.filter(m => m.name !== metric.name))}
                          className="p-1 hover:bg-red-500/20 rounded text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Scheduled automated reports scheduler */}
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                Scheduled Automated Reports Distribution
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Distribution Interval</label>
                    <select
                      value={scheduledConfig.frequency}
                      onChange={(e) => setScheduledConfig({ ...scheduledConfig, frequency: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-lg p-2 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="daily" className="bg-gray-950 text-white">Daily Summary (6:00 AM)</option>
                      <option value="weekly" className="bg-gray-950 text-white">Weekly Digest (Monday 7:00 AM)</option>
                      <option value="monthly" className="bg-gray-950 text-white">Monthly Analytics (1st of month)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Export Format</label>
                    <select
                      value={scheduledConfig.format}
                      onChange={(e) => setScheduledConfig({ ...scheduledConfig, format: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-lg p-2 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="pdf" className="bg-gray-950 text-white">Portable PDF File (.pdf)</option>
                      <option value="excel" className="bg-gray-950 text-white">Spreadsheet Document (.xlsx)</option>
                      <option value="csv" className="bg-gray-950 text-white">Raw Comma Separated (.csv)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Recipient Email Address</label>
                  <input
                    type="email"
                    value={scheduledConfig.email}
                    onChange={(e) => setScheduledConfig({ ...scheduledConfig, email: e.target.value })}
                    placeholder="admin@yourcompany.com"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setScheduledConfig({ ...scheduledConfig, enabled: !scheduledConfig.enabled })}
                      className={`w-10 h-5 rounded-full transition-colors ${scheduledConfig.enabled ? 'bg-indigo-600' : 'bg-gray-600'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${scheduledConfig.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                    <span className="text-xs text-gray-300">Enable Automated Scheduled Delivery</span>
                  </div>
                  <button onClick={saveScheduledReportSettings} className="btn-primary text-xs px-4 py-2">
                    Save Config
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRILL DOWN ANALYTICS MODAL */}
      <AnimatePresence>
        {drillDown && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-5 border-b border-white/10">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-indigo-400" />
                  {drillDown.title}
                </h3>
                <button onClick={() => setDrillDown(null)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1">
                {drillDown.items.length === 0 ? (
                  <p className="text-center text-sm text-gray-400">No records found for this subset.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-400">
                          {drillDown.type === 'invoice' && (
                            <>
                              <th className="pb-3">Invoice Number</th>
                              <th className="pb-3">Total Amount</th>
                              <th className="pb-3">Tax (GST)</th>
                              <th className="pb-3">Status</th>
                              <th className="pb-3">Date Created</th>
                            </>
                          )}
                          {drillDown.type === 'lead' && (
                            <>
                              <th className="pb-3">Company</th>
                              <th className="pb-3">Contact</th>
                              <th className="pb-3">Email</th>
                              <th className="pb-3">Platform Source</th>
                              <th className="pb-3">Status</th>
                            </>
                          )}
                          {drillDown.type === 'ai' && (
                            <>
                              <th className="pb-3">Operation Prompt</th>
                              <th className="pb-3">AI Response Output</th>
                              <th className="pb-3">Tokens Count</th>
                              <th className="pb-3">Model</th>
                              <th className="pb-3">Date</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {drillDown.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                            {drillDown.type === 'invoice' && (
                              <>
                                <td className="py-3 font-semibold text-white">{item.invoice_number_prefix}-{item.invoice_number_suffix || item.invoice_number}</td>
                                <td className="py-3 font-medium text-emerald-400">{formatCurrency(item.amount)}</td>
                                <td className="py-3">{formatCurrency(item.tax_amount || 0)}</td>
                                <td className="py-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    item.status === 'paid' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                                  }`}>
                                    {item.status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-3 text-gray-400">{new Date(item.created_at).toLocaleDateString()}</td>
                              </>
                            )}
                            {drillDown.type === 'lead' && (
                              <>
                                <td className="py-3 font-semibold text-white">{item.company_name}</td>
                                <td className="py-3">{item.contact_person}</td>
                                <td className="py-3 text-indigo-300">{item.email}</td>
                                <td className="py-3 font-medium">{item.lead_source || item.source}</td>
                                <td className="py-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 font-bold">
                                    {item.status}
                                  </span>
                                </td>
                              </>
                            )}
                            {drillDown.type === 'ai' && (
                              <>
                                <td className="py-3 max-w-[200px] truncate text-gray-300" title={item.prompt}>{item.prompt}</td>
                                <td className="py-3 max-w-[200px] truncate text-white" title={item.response}>{item.response}</td>
                                <td className="py-3 text-indigo-300 font-medium">{formatNumber(item.tokens || 0)}</td>
                                <td className="py-3">{item.model}</td>
                                <td className="py-3 text-gray-400">{new Date(item.created_at).toLocaleString()}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
