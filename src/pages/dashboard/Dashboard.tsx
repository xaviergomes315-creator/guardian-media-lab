import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, TrendingUp, DollarSign, CheckSquare,
  Folder, Calendar, ArrowUp, ArrowDown, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import ActivityWidget from '../../components/dashboard/ActivityWidget';
import { supabase } from '../../lib/supabase';

const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'rgba(0,0,0,0.85)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#fff',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface DashboardStats {
  totalLeads: number;
  leadChange: string;
  activeClients: number;
  clientChange: string;
  monthlyRevenue: number;
  revenueChange: string;
  pendingTasks: number;
  activeProjects: number;
  todayMeetings: number;
}

interface Meeting {
  id: string;
  title: string;
  time: string;
  client: string;
}

interface ChartPoint { month: string; [key: string]: string | number }

export default function Dashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0, leadChange: '+0', activeClients: 0, clientChange: '+0',
    monthlyRevenue: 0, revenueChange: '+0', pendingTasks: 0,
    activeProjects: 0, todayMeetings: 0,
  });
  const [revenueData, setRevenueData] = useState<ChartPoint[]>([]);
  const [leadsData, setLeadsData] = useState<ChartPoint[]>([]);
  const [clientGrowthData, setClientGrowthData] = useState<ChartPoint[]>([]);
  const [leadStatusData, setLeadStatusData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const now = new Date();
      const thisMonth = now.toISOString().slice(0, 7);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);
      const todayStart = now.toISOString().slice(0, 10) + 'T00:00:00';
      const todayEnd   = now.toISOString().slice(0, 10) + 'T23:59:59';

      const [
        { count: totalLeads },
        { count: lastMonthLeads },
        { count: activeClients },
        { count: lastMonthClients },
        { count: pendingTasks },
        { count: activeProjects },
        { count: todayMeetings },
        { data: invoicesThisMonth },
        { data: invoicesLastMonth },
        { data: leadsByStatus },
        { data: recentInvoices },
        { data: recentLeads },
        { data: recentClients },
        { data: todayEvents },
      ] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', lastMonth + '-01').lt('created_at', thisMonth + '-01'),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'active').gte('created_at', lastMonth + '-01').lt('created_at', thisMonth + '-01'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).in('status', ['pending', 'in_progress']),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('calendar_events').select('*', { count: 'exact', head: true }).gte('start_at', todayStart).lte('start_at', todayEnd),
        supabase.from('invoices').select('amount').gte('created_at', thisMonth + '-01').in('status', ['paid', 'partial']),
        supabase.from('invoices').select('amount').gte('created_at', lastMonth + '-01').lt('created_at', thisMonth + '-01').in('status', ['paid', 'partial']),
        supabase.from('leads').select('status'),
        supabase.from('invoices').select('created_at, amount').gte('created_at', new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()).order('created_at'),
        supabase.from('leads').select('created_at').gte('created_at', new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()).order('created_at'),
        supabase.from('clients').select('created_at').gte('created_at', new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()).order('created_at'),
        supabase.from('calendar_events').select('id, title, start_at, description').gte('start_at', todayStart).lte('start_at', todayEnd).order('start_at').limit(3),
      ]);

      const thisMonthRev = (invoicesThisMonth || []).reduce((s: number, i: { amount: number }) => s + (i.amount || 0), 0);
      const lastMonthRev = (invoicesLastMonth || []).reduce((s: number, i: { amount: number }) => s + (i.amount || 0), 0);
      const revChange = lastMonthRev > 0 ? Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100) : 0;
      const leadChange = lastMonthLeads && lastMonthLeads > 0 ? Math.round((((totalLeads || 0) - lastMonthLeads) / lastMonthLeads) * 100) : 0;
      const clientChange = lastMonthClients && lastMonthClients > 0 ? Math.round((((activeClients || 0) - lastMonthClients) / lastMonthClients) * 100) : 0;

      setStats({
        totalLeads: totalLeads || 0,
        leadChange: (leadChange >= 0 ? '+' : '') + leadChange + '%',
        activeClients: activeClients || 0,
        clientChange: (clientChange >= 0 ? '+' : '') + clientChange + '%',
        monthlyRevenue: thisMonthRev,
        revenueChange: (revChange >= 0 ? '+' : '') + revChange + '%',
        pendingTasks: pendingTasks || 0,
        activeProjects: activeProjects || 0,
        todayMeetings: todayMeetings || 0,
      });

      // Build 6-month revenue chart
      const revenueByMonth: Record<string, number> = {};
      (recentInvoices || []).forEach((inv: { created_at: string; amount: number }) => {
        const m = inv.created_at.slice(0, 7);
        revenueByMonth[m] = (revenueByMonth[m] || 0) + (inv.amount || 0);
      });
      const revChart: ChartPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toISOString().slice(0, 7);
        revChart.push({ month: MONTHS[d.getMonth()], revenue: revenueByMonth[key] || 0 });
      }
      setRevenueData(revChart);

      // Build 6-month leads chart
      const leadsByMonth: Record<string, number> = {};
      (recentLeads || []).forEach((l: { created_at: string }) => {
        const m = l.created_at.slice(0, 7);
        leadsByMonth[m] = (leadsByMonth[m] || 0) + 1;
      });
      const leadsChart: ChartPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toISOString().slice(0, 7);
        leadsChart.push({ month: MONTHS[d.getMonth()], leads: leadsByMonth[key] || 0 });
      }
      setLeadsData(leadsChart);

      // Build 6-month client chart
      const clientsByMonth: Record<string, number> = {};
      (recentClients || []).forEach((c: { created_at: string }) => {
        const m = c.created_at.slice(0, 7);
        clientsByMonth[m] = (clientsByMonth[m] || 0) + 1;
      });
      const clientChart: ChartPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toISOString().slice(0, 7);
        clientChart.push({ month: MONTHS[d.getMonth()], clients: clientsByMonth[key] || 0 });
      }
      setClientGrowthData(clientChart);

      // Lead status pie
      const statusCounts: Record<string, number> = {};
      (leadsByStatus || []).forEach((l: { status: string }) => {
        statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
      });
      const STATUS_COLORS: Record<string, string> = { new: '#3b82f6', contacted: '#eab308', interested: '#a855f7', won: '#22c55e', closed: '#22c55e', lost: '#ef4444', follow_up: '#f97316' };
      setLeadStatusData(
        Object.entries(statusCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
          value, color: STATUS_COLORS[name] || '#6b7280',
        }))
      );

      // Meetings
      setMeetings(
        (todayEvents || []).map((e: { id: string; title: string; start_at: string; description: string | null }) => ({
          id: e.id, title: e.title,
          time: new Date(e.start_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          client: e.description || 'Internal',
        }))
      );
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set error state for user feedback
      setStats(prev => ({ ...prev }));
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { label: 'Total Leads', value: stats.totalLeads.toLocaleString(), change: stats.leadChange, up: !stats.leadChange.startsWith('-'), icon: Users, color: 'from-blue-500 to-cyan-500' },
    { label: 'Active Clients', value: stats.activeClients.toLocaleString(), change: stats.clientChange, up: !stats.clientChange.startsWith('-'), icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
    { label: 'Monthly Revenue', value: '₹' + stats.monthlyRevenue.toLocaleString('en-IN'), change: stats.revenueChange, up: !stats.revenueChange.startsWith('-'), icon: DollarSign, color: 'from-purple-500 to-pink-500' },
    { label: 'Pending Tasks', value: stats.pendingTasks.toLocaleString(), change: '', up: false, icon: CheckSquare, color: 'from-orange-500 to-red-500' },
    { label: 'Active Projects', value: stats.activeProjects.toLocaleString(), change: '', up: true, icon: Folder, color: 'from-indigo-500 to-violet-500' },
    { label: "Today's Meetings", value: stats.todayMeetings.toLocaleString(), change: '', up: true, icon: Calendar, color: 'from-rose-500 to-red-500' },
  ];

  return (
    <div className="space-y-4 md:space-y-6 max-w-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold font-sora">
            Welcome back, <span className="gradient-text">{profile?.full_name?.split(' ')[0] || 'User'}</span>!
          </h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">Here's what's happening with your business today.</p>
        </div>
        <button onClick={loadDashboard} disabled={loading}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0 mt-1">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
        {statCards.map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.05 }} className="glass-card p-3 md:p-5">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              {stat.change && (
                <span className={`text-xs md:text-sm font-medium flex items-center gap-1 ${stat.up ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {stat.change}
                </span>
              )}
            </div>
            {loading
              ? <div className="h-7 w-16 rounded-lg bg-white/10 animate-pulse mb-1" />
              : <p className="text-lg md:text-2xl font-bold text-white">{stat.value}</p>
            }
            <p className="text-xs md:text-sm text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <motion.div className="glass-card p-4 md:p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6">Revenue Overview (6 months)</h3>
          <div className="h-48 md:h-64">
            {loading ? <div className="h-full rounded-xl bg-white/5 animate-pulse" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: any) => ['₹' + Number(v).toLocaleString('en-IN'), 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <motion.div className="glass-card p-4 md:p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
          <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6">New Leads (6 months)</h3>
          <div className="h-48 md:h-64">
            {loading ? <div className="h-full rounded-xl bg-white/5 animate-pulse" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="leads" fill="rgba(59,130,246,0.7)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <motion.div className="glass-card p-4 md:p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6">Client Growth</h3>
          <div className="h-36 md:h-48">
            {loading ? <div className="h-full rounded-xl bg-white/5 animate-pulse" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={clientGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="clients" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <motion.div className="glass-card p-4 md:p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}>
          <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6">Lead Status</h3>
          {loading ? <div className="h-36 md:h-48 rounded-xl bg-white/5 animate-pulse" /> : leadStatusData.length === 0 ? (
            <div className="h-36 md:h-48 flex items-center justify-center text-gray-500 text-sm">No lead data</div>
          ) : (
            <>
              <div className="h-36 md:h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={leadStatusData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                      {leadStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 md:mt-4 flex flex-wrap justify-center gap-2 md:gap-3">
                {leadStatusData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-xs text-gray-400">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>

        <motion.div className="glass-card p-4 md:p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold text-white">Today's Meetings</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}</div>
          ) : meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="w-10 h-10 text-gray-600 mb-2" />
              <p className="text-gray-500 text-sm">No meetings today</p>
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {meetings.map((meeting) => (
                <div key={meeting.id} className="p-2.5 md:p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white text-sm md:text-base">{meeting.title}</p>
                    <span className="text-xs text-blue-400 font-medium">{meeting.time}</span>
                  </div>
                  <p className="text-xs md:text-sm text-gray-400 mt-1">{meeting.client}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Activity Timeline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.45 }}>
        <ActivityWidget />
      </motion.div>
    </div>
  );
}
