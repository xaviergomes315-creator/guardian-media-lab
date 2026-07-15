import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  FileText,
  CreditCard,
  LogIn,
  LogOut,
  Upload,
  Bell,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Calendar,
  Building2,
  FolderPlus,
  ListPlus,
  UserCheck,
  MoreHorizontal,
} from 'lucide-react';
import { activityLogsService } from '../../services/api';
import { ActivityLog, ACTIVITY_MODULE_COLORS, ACTIVITY_MODULE_LABELS } from '../../types';
import { formatDistanceToNow } from 'date-fns';

const getActivityIcon = (action: string) => {
  const iconMap: Record<string, React.ElementType> = {
    'New Lead Created': UserPlus,
    'Lead Assigned': UserCheck,
    'Lead Status Changed': RefreshCw,
    'Follow-up Added': Calendar,
    'Client Created': Building2,
    'Client Updated': Building2,
    'Invoice Created': FileText,
    'Invoice Paid': CreditCard,
    'Invoice Updated': FileText,
    'GST Record Added': FileText,
    'GST Record Filed': CheckCircle,
    'AI Generated Content': Sparkles,
    'User Login': LogIn,
    'User Logout': LogOut,
    'Document Uploaded': Upload,
    'Notification Sent': Bell,
    'Task Created': ListPlus,
    'Task Completed': CheckCircle,
    'Project Created': FolderPlus,
    'Project Updated': FolderPlus,
  };
  return iconMap[action] || MoreHorizontal;
};

const getActivityColor = (module: string) => {
  const colorMap: Record<string, string> = {
    leads: 'bg-blue-500',
    clients: 'bg-green-500',
    invoices: 'bg-yellow-500',
    gst: 'bg-purple-500',
    projects: 'bg-cyan-500',
    tasks: 'bg-orange-500',
    team: 'bg-pink-500',
    whatsapp: 'bg-emerald-500',
    portal: 'bg-indigo-500',
    ai: 'bg-violet-500',
    settings: 'bg-gray-500',
    auth: 'bg-red-500',
    documents: 'bg-amber-500',
    notifications: 'bg-teal-500',
  };
  return colorMap[module] || 'bg-gray-500';
};

interface ActivityWidgetProps {
  limit?: number;
}

export default function ActivityWidget({ limit = 8 }: ActivityWidgetProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [limit]);

  const fetchActivities = async () => {
    try {
      const data = await activityLogsService.getRecent(limit);
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/4" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/10 rounded w-3/4" />
                <div className="h-2 bg-white/5 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        <Link
          to="/dashboard/activity-logs"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          View All
        </Link>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6 text-gray-500" />
          </div>
          <p className="text-gray-400 text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.action);
            const color = getActivityColor(activity.module);

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{activity.action}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{activity.user_name}</span>
                    <span className="w-1 h-1 bg-gray-600 rounded-full" />
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${ACTIVITY_MODULE_COLORS[activity.module as keyof typeof ACTIVITY_MODULE_COLORS] || 'bg-gray-500'} text-white`}>
                  {ACTIVITY_MODULE_LABELS[activity.module as keyof typeof ACTIVITY_MODULE_LABELS] || activity.module}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
