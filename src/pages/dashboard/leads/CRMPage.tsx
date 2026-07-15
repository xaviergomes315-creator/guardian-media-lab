import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  TrendingUp,
  Clock,
  Phone,
  Mail,
  Calendar,
  ArrowUp,
  DollarSign,
  StickyNote,
  CheckSquare,
  Activity,
  Bell,
  Plus,
  Trash2,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Lead, LeadStatus, LEAD_STATUS_COLORS, LEAD_STATUS_LABELS } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';

interface Note {
  id: string;
  content: string;
  created_at: string;
  entity_id: string | null;
  metadata: { lead_name?: string } | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  created_at: string;
}

interface TimelineEntry {
  id: string;
  user_name: string;
  module: string;
  action: string;
  entity_type: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface Reminder {
  id: string;
  lead_id: string | null;
  notes: string | null;
  scheduled_at: string;
  type: string | null;
  completed: boolean;
}

export default function CRMPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeadsToday: 0,
    conversionRate: 0,
    pipelineValue: 0,
  });
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [leadsByStatus, setLeadsByStatus] = useState<{ status: LeadStatus; count: number; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // New feature state
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);

  // Form state
  const [newNote, setNewNote] = useState('');
  const [noteLeadId, setNoteLeadId] = useState('');
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium', due_date: '' });
  const [showTaskForm, setShowTaskForm] = useState(false);

  useEffect(() => {
    fetchCRMData();
    fetchNotes();
    fetchTasks();
    fetchTimeline();
    fetchReminders();
  }, []);

  const fetchCRMData = async () => {
    setLoading(true);

    // Fetch leads
    const { data: leads } = await supabase.from('leads').select('*');

    if (leads) {
      setAllLeads(leads);
      // Calculate stats
      const today = new Date().toDateString();
      const newLeadsToday = leads.filter(
        (l) => new Date(l.created_at).toDateString() === today
      ).length;

      const wonLeads = leads.filter((l) => l.status === 'won');
      const conversionRate = leads.length > 0
        ? Math.round((wonLeads.length / leads.length) * 100)
        : 0;

      const pipelineValue = leads
        .filter((l) => !['won', 'lost'].includes(l.status))
        .reduce((sum, l) => sum + (l.estimated_value || 0), 0);

      setStats({
        totalLeads: leads.length,
        newLeadsToday,
        conversionRate,
        pipelineValue,
      });

      // Recent leads
      setRecentLeads(leads.slice(0, 5));

      // Leads by status
      const statusCounts = Object.keys(LEAD_STATUS_LABELS).map((status) => {
        const statusLeads = leads.filter((l) => l.status === status);
        return {
          status: status as LeadStatus,
          count: statusLeads.length,
          value: statusLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0),
        };
      });
      setLeadsByStatus(statusCounts);
    }

    setLoading(false);
  };

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('type', 'note')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching notes:', error);
      return;
    }
    setNotes((data as Note[]) || []);
  };

  const fetchTasks = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching tasks:', error);
      return;
    }
    setTasks((data as Task[]) || []);
  };

  const fetchTimeline = async () => {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15);

    if (error) {
      console.error('Error fetching timeline:', error);
      return;
    }
    setTimeline((data as TimelineEntry[]) || []);
  };

  const fetchReminders = async () => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('follow_ups')
      .select('*')
      .eq('completed', false)
      .gt('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error fetching reminders:', error);
      return;
    }
    setReminders((data as Reminder[]) || []);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !user?.id) return;

    const lead = allLeads.find((l) => l.id === noteLeadId);
    const { error } = await supabase.from('activities').insert({
      user_id: user.id,
      type: 'note',
      description: newNote.trim(),
      entity_type: noteLeadId ? 'lead' : null,
      entity_id: noteLeadId || null,
      metadata: lead ? { lead_name: lead.company_name } : null,
    });

    if (error) {
      console.error('Error adding note:', error);
      return;
    }

    setNewNote('');
    setNoteLeadId('');
    fetchNotes();
  };

  const handleDeleteNote = async (noteId: string) => {
    const { error } = await supabase.from('activities').delete().eq('id', noteId);
    if (error) {
      console.error('Error deleting note:', error);
      return;
    }
    fetchNotes();
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim() || !user?.id) return;

    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: newTask.title.trim(),
      priority: newTask.priority,
      due_date: newTask.due_date || null,
      status: 'pending',
    });

    if (error) {
      console.error('Error adding task:', error);
      return;
    }

    setNewTask({ title: '', priority: 'medium', due_date: '' });
    setShowTaskForm(false);
    fetchTasks();
  };

  const handleToggleTask = async (taskId: string, currentStatus: string | null) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      return;
    }
    fetchTasks();
  };

  const crmStats = [
    { label: 'Total Leads', value: stats.totalLeads, icon: Users, color: 'from-blue-500 to-cyan-500', change: '+12%' },
    { label: 'New Today', value: stats.newLeadsToday, icon: UserPlus, color: 'from-green-500 to-emerald-500', change: '+5' },
    { label: 'Conversion Rate', value: `${stats.conversionRate}%`, icon: TrendingUp, color: 'from-purple-500 to-pink-500', change: '+2.3%' },
    { label: 'Pipeline Value', value: `$${(stats.pipelineValue / 1000).toFixed(0)}K`, icon: DollarSign, color: 'from-orange-500 to-red-500', change: '+8.5%' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-sona text-white">CRM Dashboard</h1>
          <p className="text-gray-400">Overview of your customer relationship management</p>
        </div>
        <button onClick={() => navigate('/dashboard/leads')} className="btn-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Manage Leads
        </button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {crmStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm text-green-400 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" />
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Pipeline by Status */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-lg font-semibold text-white mb-6">Sales Pipeline</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {leadsByStatus.map((item, _index) => (
            <div
              key={item.status}
              className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className={`w-3 h-3 rounded-full ${LEAD_STATUS_COLORS[item.status]} mb-3`} />
              <p className="text-sm text-gray-400">{LEAD_STATUS_LABELS[item.status]}</p>
              <p className="text-2xl font-bold text-white mt-1">{item.count}</p>
              <p className="text-xs text-gray-500 mt-1">
                ${item.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Leads & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Leads</h3>
            <button
              onClick={() => navigate('/dashboard/leads')}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {loading ? (
              <p className="text-gray-400">Loading...</p>
            ) : recentLeads.length === 0 ? (
              <p className="text-gray-400">No leads yet</p>
            ) : (
              recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => navigate('/dashboard/leads')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {lead.company_name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{lead.company_name}</p>
                      <p className="text-xs text-gray-400">{lead.contact_person}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${LEAD_STATUS_COLORS[lead.status]} text-white`}>
                      {LEAD_STATUS_LABELS[lead.status]}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      ${lead.estimated_value.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <h3 className="text-lg font-semibold text-white mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/dashboard/leads')}
              className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
            >
              <Phone className="w-6 h-6 text-blue-400 mb-3" />
              <p className="font-medium text-white">Log Call</p>
              <p className="text-xs text-gray-400 mt-1">Record call history</p>
            </button>
            <button
              onClick={() => navigate('/dashboard/leads')}
              className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
            >
              <Mail className="w-6 h-6 text-green-400 mb-3" />
              <p className="font-medium text-white">Send Email</p>
              <p className="text-xs text-gray-400 mt-1">Contact leads</p>
            </button>
            <button
              onClick={() => navigate('/dashboard/leads')}
              className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
            >
              <Calendar className="w-6 h-6 text-purple-400 mb-3" />
              <p className="font-medium text-white">Schedule</p>
              <p className="text-xs text-gray-400 mt-1">Book meetings</p>
            </button>
            <button
              onClick={() => navigate('/dashboard/leads')}
              className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
            >
              <Clock className="w-6 h-6 text-orange-400 mb-3" />
              <p className="font-medium text-white">Follow-up</p>
              <p className="text-xs text-gray-400 mt-1">Set reminders</p>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Notes & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes Section */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-yellow-400" />
              Notes
            </h3>
          </div>

          {/* Add Note Form */}
          <div className="space-y-3 mb-4">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write a note..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none text-sm"
            />
            <div className="flex gap-2">
              <select
                value={noteLeadId}
                onChange={(e) => setNoteLeadId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
              >
                <option value="" className="bg-gray-900">No lead linked</option>
                {allLeads.map((lead) => (
                  <option key={lead.id} value={lead.id} className="bg-gray-900">{lead.company_name}</option>
                ))}
              </select>
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {notes.length === 0 ? (
              <p className="text-gray-400 text-center py-4 text-sm">No notes yet</p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="p-3 rounded-lg bg-white/5 group">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-200 flex-1">{note.content}</p>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {note.metadata?.lead_name && (
                      <span className="text-xs text-blue-400">{note.metadata.lead_name}</span>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Tasks Section */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-green-400" />
              My Tasks
            </h3>
            <button
              onClick={() => setShowTaskForm(!showTaskForm)}
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>

          {/* Add Task Form */}
          {showTaskForm && (
            <div className="space-y-3 mb-4 p-3 rounded-lg bg-white/5">
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Task title..."
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 text-sm"
              />
              <div className="flex gap-2">
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                >
                  <option value="low" className="bg-gray-900">Low Priority</option>
                  <option value="medium" className="bg-gray-900">Medium Priority</option>
                  <option value="high" className="bg-gray-900">High Priority</option>
                  <option value="urgent" className="bg-gray-900">Urgent</option>
                </select>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                />
                <button
                  onClick={handleAddTask}
                  disabled={!newTask.title.trim()}
                  className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Tasks List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tasks.length === 0 ? (
              <p className="text-gray-400 text-center py-4 text-sm">No tasks yet</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <button
                    onClick={() => handleToggleTask(task.id, task.status)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                      task.status === 'completed'
                        ? 'bg-green-500 border-green-500'
                        : 'border-white/20 hover:border-green-400'
                    }`}
                  >
                    {task.status === 'completed' && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-white'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.priority && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                          task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {task.priority}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="text-xs text-gray-500">{task.due_date}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Timeline & Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Section */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-purple-400" />
            Activity Timeline
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {timeline.length === 0 ? (
              <p className="text-gray-400 text-center py-4 text-sm">No recent activity</p>
            ) : (
              timeline.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">
                      <span className="font-medium">{entry.user_name}</span>{' '}
                      <span className="text-gray-400">{entry.action}</span>{' '}
                      {entry.module && <span className="text-gray-500">on {entry.module}</span>}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(entry.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Reminders Section */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-orange-400" />
            Upcoming Reminders
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {reminders.length === 0 ? (
              <p className="text-gray-400 text-center py-4 text-sm">No upcoming reminders</p>
            ) : (
              reminders.map((reminder) => {
                const lead = allLeads.find((l) => l.id === reminder.lead_id);
                const reminderDate = new Date(reminder.scheduled_at);
                const now = new Date();
                const hoursUntil = Math.round((reminderDate.getTime() - now.getTime()) / (1000 * 60 * 60));
                return (
                  <div key={reminder.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      hoursUntil <= 24 ? 'bg-red-400' : 'bg-orange-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">
                        {reminder.notes || (lead ? lead.company_name : 'Follow-up')}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {lead && (
                          <span className="text-xs text-blue-400">{lead.company_name}</span>
                        )}
                        {reminder.type && (
                          <span className="text-xs text-gray-500 capitalize">{reminder.type}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {reminderDate.toLocaleString()}
                        {hoursUntil <= 24 && (
                          <span className="text-red-400 ml-1">({hoursUntil}h left)</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
