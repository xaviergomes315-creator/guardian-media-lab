import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type { GSTReturn } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalReturns: number;
  pendingReturns: number;
  filedReturns: number;
  overdueReturns: number;
  returnsDueThisMonth: number;
  returnsFiledThisMonth: number;
}

interface MonthlyData {
  month: string;
  filed: number;
  pending: number;
}

export default function GSTDashboardPage() {
  useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    totalReturns: 0,
    pendingReturns: 0,
    filedReturns: 0,
    overdueReturns: 0,
    returnsDueThisMonth: 0,
    returnsFiledThisMonth: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [recentReturns, setRecentReturns] = useState<GSTReturn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [clientsResult, returnsResult] = await Promise.all([
        supabase.from('gst_clients').select('*'),
        supabase.from('gst_returns').select('*, client:gst_clients(company_name)').order('created_at', { ascending: false }).limit(10),
      ]);

      const clients = clientsResult.data || [];
      const returns = returnsResult.data || [];

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const dashboardStats: DashboardStats = {
        totalClients: clients.length,
        activeClients: clients.filter((c) => c.status === 'active').length,
        totalReturns: returns.length,
        pendingReturns: returns.filter((r) => r.status === 'pending').length,
        filedReturns: returns.filter((r) => r.status === 'filed').length,
        overdueReturns: returns.filter((r) => r.status === 'overdue' || (r.status === 'pending' && new Date(r.due_date) < now)).length,
        returnsDueThisMonth: returns.filter((r) => {
          const dueDate = new Date(r.due_date);
          return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
        }).length,
        returnsFiledThisMonth: returns.filter((r) => {
          if (r.status !== 'filed' || !r.filing_date) return false;
          const filingDate = new Date(r.filing_date);
          return filingDate.getMonth() === currentMonth && filingDate.getFullYear() === currentYear;
        }).length,
      };

      setStats(dashboardStats);
      setRecentReturns(returns.slice(0, 5));

      const monthlyStats: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = d.toLocaleString('default', { month: 'short' });
        const monthReturns = returns.filter((r) => {
          const created = new Date(r.created_at);
          return created.getMonth() === d.getMonth() && created.getFullYear() === d.getFullYear();
        });
        monthlyStats.push({
          month: monthStr,
          filed: monthReturns.filter((r) => r.status === 'filed').length,
          pending: monthReturns.filter((r) => r.status !== 'filed').length,
        });
      }
      setMonthlyData(monthlyStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  const statCards = [
    {
      title: 'Total GST Clients',
      value: stats.totalClients,
      change: `${stats.activeClients} active`,
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
      trend: 'up',
    },
    {
      title: 'Returns Due',
      value: stats.pendingReturns + stats.overdueReturns,
      change: `${stats.overdueReturns} overdue`,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      trend: stats.overdueReturns > 0 ? 'down' : 'neutral',
    },
    {
      title: 'Returns Filed',
      value: stats.filedReturns,
      change: `${stats.returnsFiledThisMonth} this month`,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      trend: 'up',
    },
    {
      title: 'Overdue Returns',
      value: stats.overdueReturns,
      change: 'Immediate attention',
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      trend: stats.overdueReturns > 0 ? 'down' : 'neutral',
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-sora text-white">GST Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Manage GST compliance and filings</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400">{stat.title}</p>
                <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                  ) : stat.trend === 'down' ? (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  ) : null}
                  <span className={`text-sm ${stat.trend === 'up' ? 'text-green-500' : stat.trend === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6">Monthly Filing Summary</h3>
          <div className="space-y-4">
            {monthlyData.map((data, _index) => (
              <div key={data.month} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{data.month}</span>
                  <span className="text-white">{data.filed + data.pending} returns</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden flex">
                  <div
                    className="bg-green-500 h-full transition-all duration-500"
                    style={{ width: `${((data.filed / (data.filed + data.pending || 1)) * 100)}%` }}
                  />
                  <div
                    className="bg-yellow-500 h-full transition-all duration-500"
                    style={{ width: `${((data.pending / (data.filed + data.pending || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-6 mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-gray-400">Filed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm text-gray-400">Pending</span>
            </div>
          </div>
        </motion.div>

        {/* Recent Returns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Returns</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {loading ? (
              <p className="text-gray-400 text-center py-4">Loading...</p>
            ) : recentReturns.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No returns found</p>
            ) : (
              recentReturns.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      r.status === 'filed' ? 'bg-green-500/20 text-green-400' :
                      r.status === 'overdue' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{r.return_type}</p>
                      <p className="text-sm text-gray-400">{r.client?.company_name || 'Unknown'} - {r.filing_period}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    r.status === 'filed' ? 'bg-green-500/20 text-green-400' :
                    r.status === 'overdue' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-6">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-xl bg-white/5">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.totalClients}</p>
            <p className="text-sm text-gray-400">Total Clients</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.filedReturns}</p>
            <p className="text-sm text-gray-400">Filed Returns</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <Clock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.pendingReturns}</p>
            <p className="text-sm text-gray-400">Pending</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.overdueReturns}</p>
            <p className="text-sm text-gray-400">Overdue</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
