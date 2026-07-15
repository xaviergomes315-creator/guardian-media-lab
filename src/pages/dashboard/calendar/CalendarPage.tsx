import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Users,
  MapPin,
  CheckSquare,
  AlertCircle,
  X,
  Edit,
  Trash2,
  Filter,
  Search,
  LayoutGrid,
  List,
  CalendarDays,
  CalendarRange,
  CheckCircle,
  Target,
  Briefcase,
  Phone,
  User,
  StickyNote,
  BellRing,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  addWeeks,
  subMonths,
  subWeeks,
  isSameMonth,
  isSameDay,
  parseISO,
  isToday,
  setHours,
  setMinutes,
  isPast,
} from 'date-fns';
import { calendarService, tasksService, profileService, leadsService } from '../../../services/api';
import {
  CalendarEvent,
  Meeting,
  FollowUpExtended,
  Task,
  Profile,
  Lead,
  CalendarViewType,
  EventType,
  MeetingType,
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
  MEETING_TYPE_LABELS,
  EVENT_COLORS,
} from '../../../types';

const VIEW_OPTIONS: { value: CalendarViewType; label: string; icon: React.ElementType }[] = [
  { value: 'month', label: 'Month', icon: CalendarDays },
  { value: 'week', label: 'Week', icon: CalendarRange },
  { value: 'day', label: 'Day', icon: LayoutGrid },
  { value: 'agenda', label: 'Agenda', icon: List },
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const DATE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'this_week', label: 'This Week' },
  { value: 'overdue', label: 'Overdue' },
];

interface FormData {
  title: string;
  description: string;
  event_type: EventType;
  start_at: string;
  end_at: string;
  all_day: boolean;
  location: string;
  color: string;
  lead_id: string;
  client_id: string;
  reminder_minutes: number;
  meeting_type: MeetingType;
  attendees: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string;
  // Follow-up fields
  client_name: string;
  lead_source: string;
  follow_up_date: string;
  follow_up_time: string;
  assigned_telecaller: string;
  // Meeting fields
  notes: string;
  agenda: string;
  assigned_user: string;
}

const initialFormData: FormData = {
  title: '',
  description: '',
  event_type: 'event',
  start_at: new Date().toISOString(),
  end_at: '',
  all_day: false,
  location: '',
  color: 'blue',
  lead_id: '',
  client_id: '',
  reminder_minutes: 15,
  meeting_type: 'general',
  attendees: [],
  priority: 'medium',
  due_date: '',
  client_name: '',
  lead_source: '',
  follow_up_date: format(new Date(), 'yyyy-MM-dd'),
  follow_up_time: '10:00',
  assigned_telecaller: '',
  notes: '',
  agenda: '',
  assigned_user: '',
};

export default function CalendarPage() {
  const [view, setView] = useState<CalendarViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpExtended[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [telecallers, setTelecallers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | Meeting | FollowUpExtended | Task | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [createType, setCreateType] = useState<'event' | 'meeting' | 'followup' | 'task'>('event');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, [currentDate, view]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const safeDate = new Date(currentDate);
      const start =
        view === 'month'
          ? startOfMonth(safeDate).toISOString()
          : view === 'week'
            ? startOfWeek(safeDate).toISOString()
            : view === 'day'
              ? new Date(new Date(safeDate).setHours(0, 0, 0, 0)).toISOString()
              : subMonths(new Date(), 1).toISOString();
      const end =
        view === 'month'
          ? endOfMonth(safeDate).toISOString()
          : view === 'week'
            ? endOfWeek(safeDate).toISOString()
            : view === 'day'
              ? new Date(new Date(safeDate).setHours(23, 59, 59, 999)).toISOString()
              : addMonths(new Date(), 2).toISOString();

      const [eventsData, meetingsData, followUpsData, tasksData] = await Promise.all([
        calendarService.events.getByDateRange(start, end),
        calendarService.meetings.getAll({ date_from: start, date_to: end }),
        calendarService.followups.getAll(100),
        tasksService.getAll(),
      ]);

      setEvents(eventsData);
      setMeetings(meetingsData);
      setFollowUps(followUpsData);
      setTasks(tasksData as Task[]);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      showToast('error', 'Failed to load calendar');
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const [teamData, leadsData, telecallerData] = await Promise.all([
        profileService.getTeamMembers(),
        leadsService.getAll(),
        profileService.getAll(),
      ]);
      setUsers(teamData);
      setLeads(leadsData);
      setTelecallers(telecallerData.filter((u) => u.role === 'telecaller' || u.role === 'admin'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const navigatePrev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else if (view === 'day') setCurrentDate(addDays(currentDate, -1));
  };

  const navigateNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else if (view === 'day') setCurrentDate(addDays(currentDate, 1));
  };

  const navigateToday = () => setCurrentDate(new Date());

  const handleCreate = async () => {
    try {
      if (!formData.title.trim()) {
        showToast('error', 'Title is required');
        return;
      }
      if (createType === 'event') {
        await calendarService.events.create({
          title: formData.title,
          description: formData.description,
          event_type: formData.event_type,
          start_at: formData.start_at,
          end_at: formData.end_at || null,
          all_day: formData.all_day,
          location: formData.location,
          color: formData.color,
          reminder_minutes: formData.reminder_minutes,
        });
        showToast('success', 'Event created');
      } else if (createType === 'meeting') {
        const attendeeList = formData.assigned_user
          ? [formData.assigned_user, ...formData.attendees.filter((a) => a !== formData.assigned_user)]
          : formData.attendees;
        await calendarService.meetings.create(
          {
            title: formData.title,
            description: formData.description,
            meeting_type: formData.meeting_type,
            start_at: formData.start_at,
            end_at: formData.end_at || null,
            location: formData.location,
            notes: formData.notes,
            agenda: formData.agenda,
          },
          attendeeList,
        );
        showToast('success', 'Meeting scheduled');
      } else if (createType === 'followup') {
        const scheduledAt = new Date(`${formData.follow_up_date}T${formData.follow_up_time}:00`).toISOString();
        await calendarService.followups.create({
          lead_id: formData.lead_id || null,
          scheduled_at: scheduledAt,
          type: 'call',
          notes: formData.description,
          client_name: formData.client_name,
          lead_source: formData.lead_source,
          follow_up_time: formData.follow_up_time,
          assigned_telecaller: formData.assigned_telecaller || null,
        } as Partial<FollowUpExtended>);
        showToast('success', 'Follow-up scheduled');
      } else if (createType === 'task') {
        await tasksService.create({
          title: formData.title,
          description: formData.description || null,
          priority: formData.priority,
          due_date: formData.due_date || null,
          status: 'pending',
        });
        showToast('success', 'Task created');
      }
      setShowCreateModal(false);
      resetForm();
      await fetchData();
    } catch (error: unknown) {
      console.error('Create error:', error);
      const message = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Failed to create');
      showToast('error', message);
    }
  };

  const handleEdit = async () => {
    if (!selectedEvent) return;
    if (!formData.title.trim()) {
      showToast('error', 'Title is required');
      return;
    }
    try {
      if ('event_type' in selectedEvent) {
        await calendarService.events.update(selectedEvent.id, {
          title: formData.title,
          description: formData.description,
          start_at: formData.start_at,
          end_at: formData.end_at || null,
          location: formData.location,
          color: formData.color,
          reminder_minutes: formData.reminder_minutes,
        });
        showToast('success', 'Event updated');
      } else if ('meeting_type' in selectedEvent) {
        await calendarService.meetings.update(selectedEvent.id, {
          title: formData.title,
          description: formData.description,
          meeting_type: formData.meeting_type,
          start_at: formData.start_at,
          end_at: formData.end_at || null,
          location: formData.location,
          notes: formData.notes,
          agenda: formData.agenda,
        });
        showToast('success', 'Meeting updated');
      } else if ('lead_id' in selectedEvent && 'scheduled_at' in selectedEvent) {
        const scheduledAt = new Date(`${formData.follow_up_date}T${formData.follow_up_time}:00`).toISOString();
        await calendarService.followups.reschedule(selectedEvent.id, scheduledAt);
        showToast('success', 'Follow-up updated');
      } else if ('priority' in selectedEvent) {
        await tasksService.update(selectedEvent.id, {
          title: formData.title,
          description: formData.description || null,
          priority: formData.priority,
          due_date: formData.due_date || null,
        });
        showToast('success', 'Task updated');
      }
      setShowEditModal(false);
      setSelectedEvent(null);
      resetForm();
      await fetchData();
    } catch (error: unknown) {
      console.error('Edit error:', error);
      const message = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Failed to update');
      showToast('error', message);
    }
  };

  const openEditModal = (item: CalendarEvent | Meeting | FollowUpExtended | Task) => {
    setSelectedEvent(item);
    if ('event_type' in item) {
      const ev = item as CalendarEvent;
      setFormData({
        ...initialFormData,
        title: ev.title,
        description: ev.description || '',
        event_type: ev.event_type,
        start_at: ev.start_at,
        end_at: ev.end_at || '',
        all_day: ev.all_day,
        location: ev.location || '',
        color: ev.color,
        reminder_minutes: ev.reminder_minutes || 15,
      });
    } else if ('meeting_type' in item) {
      const mtg = item as Meeting;
      setFormData({
        ...initialFormData,
        title: mtg.title,
        description: mtg.description || '',
        meeting_type: mtg.meeting_type,
        start_at: mtg.start_at,
        end_at: mtg.end_at || '',
        location: mtg.location || '',
        notes: mtg.notes || '',
        agenda: mtg.agenda || '',
        attendees: mtg.attendee_ids || [],
      });
    } else if ('lead_id' in item && 'scheduled_at' in item) {
      const fu = item as FollowUpExtended;
      const dt = fu.scheduled_at ? new Date(fu.scheduled_at) : new Date();
      setFormData({
        ...initialFormData,
        title: fu.client_name || '',
        description: fu.notes || '',
        client_name: fu.client_name || '',
        lead_source: fu.lead_source || '',
        follow_up_date: format(dt, 'yyyy-MM-dd'),
        follow_up_time: format(dt, 'HH:mm'),
        assigned_telecaller: fu.assigned_telecaller || '',
        lead_id: fu.lead_id,
      });
    } else if ('priority' in item) {
      const tk = item as Task;
      setFormData({
        ...initialFormData,
        title: tk.title,
        description: tk.description || '',
        priority: tk.priority,
        due_date: tk.due_date ? format(new Date(tk.due_date), 'yyyy-MM-dd') : '',
      });
    }
    setShowEventModal(false);
    setShowEditModal(true);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    try {
      if ('event_type' in selectedEvent) {
        await calendarService.events.delete(selectedEvent.id);
      } else if ('meeting_type' in selectedEvent) {
        await calendarService.meetings.delete(selectedEvent.id);
      } else if ('lead_id' in selectedEvent && 'scheduled_at' in selectedEvent) {
        await calendarService.followups.delete(selectedEvent.id);
      } else if ('priority' in selectedEvent) {
        await tasksService.delete(selectedEvent.id);
      }
      showToast('success', 'Deleted successfully');
      setShowEventModal(false);
      setSelectedEvent(null);
      await fetchData();
    } catch (error: unknown) {
      console.error('Delete error:', error);
      const message = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Failed to delete');
      showToast('error', message);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await tasksService.update(taskId, { status: 'completed' });
      showToast('success', 'Task completed');
      setShowEventModal(false);
      setSelectedEvent(null);
      await fetchData();
    } catch (error: unknown) {
      console.error('Complete task error:', error);
      const message = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Failed to update task');
      showToast('error', message);
    }
  };

  const handleCompleteFollowUp = async (followUpId: string) => {
    try {
      await calendarService.followups.complete(followUpId);
      showToast('success', 'Follow-up completed');
      setShowEventModal(false);
      setSelectedEvent(null);
      await fetchData();
    } catch (error: unknown) {
      console.error('Complete follow-up error:', error);
      const message = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Failed to complete follow-up');
      showToast('error', message);
    }
  };

  const resetForm = () => {
    setFormData({
      ...initialFormData,
      start_at: new Date().toISOString(),
      follow_up_date: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  // Filter data
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterType !== 'all' && event.event_type !== filterType) return false;
      if (filterStatus !== 'all' && event.status !== filterStatus) return false;
      if (filterUser !== 'all' && event.user_id !== filterUser) return false;
      if (filterDate !== 'all') {
        const eventDate = parseISO(event.start_at);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = addDays(today, 1);
        const weekEnd = endOfWeek(today);
        if (filterDate === 'today' && !isSameDay(eventDate, today)) return false;
        if (filterDate === 'tomorrow' && !isSameDay(eventDate, tomorrow)) return false;
        if (filterDate === 'this_week' && (eventDate < today || eventDate > weekEnd)) return false;
        if (filterDate === 'overdue' && eventDate >= today) return false;
      }
      return true;
    });
  }, [events, searchQuery, filterType, filterStatus, filterUser, filterDate]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterDate !== 'all' && task.due_date) {
        const taskDate = new Date(task.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = addDays(today, 1);
        const weekEnd = endOfWeek(today);
        if (filterDate === 'today' && !isSameDay(taskDate, today)) return false;
        if (filterDate === 'tomorrow' && !isSameDay(taskDate, tomorrow)) return false;
        if (filterDate === 'this_week' && (taskDate < today || taskDate > weekEnd)) return false;
        if (filterDate === 'overdue' && (taskDate >= today || task.status === 'completed')) return false;
      }
      return true;
    });
  }, [tasks, filterPriority, filterStatus, searchQuery, filterDate]);

  // Calendar calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [calendarStart, calendarEnd]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const getEventsForDay = useCallback(
    (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return filteredEvents.filter((event) => format(parseISO(event.start_at), 'yyyy-MM-dd') === dateStr);
    },
    [filteredEvents],
  );

  const getMeetingsForDay = useCallback(
    (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return meetings.filter((meeting) => format(parseISO(meeting.start_at), 'yyyy-MM-dd') === dateStr);
    },
    [meetings],
  );

  const getFollowUpsForDay = useCallback(
    (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return followUps.filter((fup) => {
        if (!fup.scheduled_at) return false;
        return format(parseISO(fup.scheduled_at), 'yyyy-MM-dd') === dateStr && !fup.completed;
      });
    },
    [followUps],
  );

  const getTasksForDay = useCallback(
    (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return filteredTasks.filter((task) => {
        if (!task.due_date) return false;
        return format(new Date(task.due_date), 'yyyy-MM-dd') === dateStr && task.status !== 'completed';
      });
    },
    [filteredTasks],
  );

  // Dashboard widgets
  const todayStats = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const todayEvents = filteredEvents.filter((e) => format(parseISO(e.start_at), 'yyyy-MM-dd') === todayStr);
    const todayMeetings = meetings.filter((m) => format(parseISO(m.start_at), 'yyyy-MM-dd') === todayStr);
    const todayFollowUps = followUps.filter(
      (f) => f.scheduled_at && format(parseISO(f.scheduled_at), 'yyyy-MM-dd') === todayStr && !f.completed,
    );
    const todayTasks = tasks.filter((t) => {
      if (!t.due_date || t.status === 'completed') return false;
      return format(new Date(t.due_date), 'yyyy-MM-dd') === todayStr;
    });
    const overdueTasks = tasks.filter((t) => t.due_date && new Date(t.due_date) < today && t.status !== 'completed');
    const upcomingMeetings = meetings.filter((m) => parseISO(m.start_at) > today && m.status === 'scheduled');

    return {
      todayEvents: todayEvents.length,
      todayMeetings: todayMeetings.length,
      todayFollowUps: todayFollowUps.length,
      todayTasks: todayTasks.length,
      overdueTasks: overdueTasks.length,
      upcomingMeetings: upcomingMeetings.length,
      events: todayEvents,
      meetings: todayMeetings,
      followUps: todayFollowUps,
      tasks: todayTasks,
      overdue: overdueTasks,
    };
  }, [filteredEvents, meetings, followUps, tasks]);

  const renderEventBadge = (event: CalendarEvent) => (
    <button
      key={event.id}
      onClick={() => {
        setSelectedEvent(event);
        setShowEventModal(true);
      }}
      className={`w-full text-left px-2 py-1 rounded text-xs truncate mb-1 hover:opacity-80 transition-opacity ${EVENT_TYPE_COLORS[event.event_type]} text-white`}
    >
      {event.title}
    </button>
  );

  const renderMeetingBadge = (meeting: Meeting) => (
    <button
      key={meeting.id}
      onClick={() => {
        setSelectedEvent(meeting);
        setShowEventModal(true);
      }}
      className="w-full text-left px-2 py-1 rounded text-xs truncate mb-1 bg-purple-500 text-white hover:opacity-80 transition-opacity"
    >
      {meeting.title}
    </button>
  );

  const renderFollowUpBadge = (followUp: FollowUpExtended) => (
    <button
      key={followUp.id}
      onClick={() => {
        setSelectedEvent(followUp);
        setShowEventModal(true);
      }}
      className="w-full text-left px-2 py-1 rounded text-xs truncate mb-1 bg-green-500 text-white hover:opacity-80 transition-opacity"
    >
      Follow-up: {followUp.lead?.company_name || followUp.client_name || 'Lead'}
    </button>
  );

  const renderTaskBadge = (task: Task) => (
    <button
      key={task.id}
      onClick={() => {
        setSelectedEvent(task);
        setShowEventModal(true);
      }}
      className={`w-full text-left px-2 py-1 rounded text-xs truncate mb-1 ${
        task.priority === 'urgent'
          ? 'bg-red-500'
          : task.priority === 'high'
            ? 'bg-orange-500'
            : 'bg-cyan-500'
      } text-white hover:opacity-80 transition-opacity`}
    >
      {task.title}
    </button>
  );

  const isItemOverdue = (item: CalendarEvent | Meeting | FollowUpExtended | Task): boolean => {
    if ('start_at' in item && item.start_at) return isPast(parseISO(item.start_at));
    if ('scheduled_at' in item && item.scheduled_at) return isPast(parseISO(item.scheduled_at));
    if ('due_date' in item && item.due_date) return isPast(new Date(item.due_date));
    return false;
  };

  return (
    <div className="space-y-4">
      {/* Dashboard Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{todayStats.todayTasks}</p>
              <p className="text-xs text-gray-400">Today's Tasks</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{todayStats.upcomingMeetings}</p>
              <p className="text-xs text-gray-400">Upcoming Meetings</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{todayStats.todayFollowUps}</p>
              <p className="text-xs text-gray-400">Today's Follow-ups</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{todayStats.overdueTasks}</p>
              <p className="text-xs text-gray-400">Overdue Tasks</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={navigatePrev}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={navigateToday}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500"
            >
              Today
            </button>
            <button
              onClick={navigateNext}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-xl font-bold text-white">
            {view === 'month' && format(currentDate, 'MMMM yyyy')}
            {view === 'week' && `Week of ${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}`}
            {view === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
            {view === 'agenda' && 'Agenda View'}
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 w-40"
            />
          </div>

          {/* Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-blue-600/20 border-blue-500/50' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          {/* View Toggle */}
          <div className="flex p-1 bg-white/5 rounded-lg">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setView(opt.value)}
                className={`p-2 rounded flex items-center gap-1.5 text-sm transition-colors ${
                  view === opt.value ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <opt.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            ))}
          </div>

          {/* Create Button */}
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-4 overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
              >
                <option value="all" className="bg-gray-900">
                  All Users
                </option>
                {users.map((u) => (
                  <option key={u.user_id} value={u.user_id} className="bg-gray-900">
                    {u.full_name}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
              >
                <option value="all" className="bg-gray-900">
                  All Status
                </option>
                <option value="scheduled" className="bg-gray-900">
                  Scheduled
                </option>
                <option value="completed" className="bg-gray-900">
                  Completed
                </option>
                <option value="cancelled" className="bg-gray-900">
                  Cancelled
                </option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-gray-900">
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
              >
                {DATE_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-gray-900">
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
              >
                <option value="all" className="bg-gray-900">
                  All Types
                </option>
                <option value="event" className="bg-gray-900">
                  Event
                </option>
                <option value="meeting" className="bg-gray-900">
                  Meeting
                </option>
                <option value="follow_up" className="bg-gray-900">
                  Follow-up
                </option>
                <option value="reminder" className="bg-gray-900">
                  Reminder
                </option>
                <option value="task" className="bg-gray-900">
                  Task
                </option>
              </select>
            </div>
            <div className="mt-3">
              <button
                onClick={() => {
                  setFilterUser('all');
                  setFilterType('all');
                  setFilterStatus('all');
                  setFilterPriority('all');
                  setFilterDate('all');
                  setSearchQuery('');
                }}
                className="btn-secondary text-sm"
              >
                Clear Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar Views */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : view === 'month' ? (
          /* Month View */
          <div className="grid grid-cols-7">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="p-3 text-center text-xs font-medium text-gray-400 border-b border-white/10"
              >
                {day}
              </div>
            ))}
            {calendarDays.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              const dayMeetings = getMeetingsForDay(day);
              const dayFollowUps = getFollowUpsForDay(day);
              const dayTasks = getTasksForDay(day);
              const totalItems = dayEvents.length + dayMeetings.length + dayFollowUps.length + dayTasks.length;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentDate(day);
                    setView('day');
                  }}
                  className={`min-h-[100px] p-2 border-b border-r border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${
                    !isSameMonth(day, currentDate) ? 'bg-white/5' : ''
                  } ${isToday(day) ? 'bg-blue-500/10' : ''}`}
                >
                  <div
                    className={`text-sm font-medium mb-1 ${
                      isToday(day)
                        ? 'text-blue-400'
                        : isSameMonth(day, currentDate)
                          ? 'text-white'
                          : 'text-gray-600'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5 overflow-y-auto max-h-[80px]">
                    {dayEvents.slice(0, 3).map(renderEventBadge)}
                    {dayMeetings.slice(0, 2).map(renderMeetingBadge)}
                    {dayFollowUps.slice(0, 2).map(renderFollowUpBadge)}
                    {dayTasks.slice(0, 2).map(renderTaskBadge)}
                    {totalItems > 5 && (
                      <span className="text-xs text-gray-500">+{totalItems - 5} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : view === 'week' ? (
          /* Week View */
          <div className="flex flex-col">
            <div className="grid grid-cols-8 border-b border-white/10">
              <div className="p-3 text-xs text-gray-500"></div>
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`p-3 text-center border-l border-white/10 ${isToday(day) ? 'bg-blue-500/10' : ''}`}
                >
                  <div className="text-xs text-gray-400">{format(day, 'EEE')}</div>
                  <div className={`text-lg font-medium ${isToday(day) ? 'text-blue-400' : 'text-white'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {[...Array(24)].map((_, hour) => (
                <div key={hour} className="grid grid-cols-8 border-b border-white/5">
                  <div className="p-2 text-xs text-gray-500 text-right">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </div>
                  {weekDays.map((day) => {
                    const dayDate = setHours(setMinutes(day, 0), hour);
                    const hourEvents = events.filter((e) => {
                      const eventDate = parseISO(e.start_at);
                      return isSameDay(eventDate, dayDate) && eventDate.getHours() === hour;
                    });
                    const hourMeetings = meetings.filter((m) => {
                      const meetingDate = parseISO(m.start_at);
                      return isSameDay(meetingDate, dayDate) && meetingDate.getHours() === hour;
                    });
                    return (
                      <div
                        key={day.toISOString() + hour}
                        className="min-h-[60px] p-1 border-l border-white/5 hover:bg-white/5 cursor-pointer"
                        onClick={() => {
                          setCurrentDate(dayDate);
                          resetForm();
                          setFormData((prev) => ({ ...prev, start_at: dayDate.toISOString() }));
                          setShowCreateModal(true);
                        }}
                      >
                        {hourEvents.map(renderEventBadge)}
                        {hourMeetings.map(renderMeetingBadge)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : view === 'day' ? (
          /* Day View */
          <div className="flex flex-col">
            <div className="p-4 border-b border-white/10 text-center">
              <div className="text-lg font-medium text-white">{format(currentDate, 'EEEE')}</div>
              <div className="text-2xl font-bold text-blue-400">{format(currentDate, 'MMMM d, yyyy')}</div>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {[...Array(24)].map((_, hour) => {
                const slotDate = setHours(setMinutes(currentDate, 0), hour);
                const slotEvents = getEventsForDay(currentDate).filter(
                  (e) => parseISO(e.start_at).getHours() === hour,
                );
                const slotMeetings = getMeetingsForDay(currentDate).filter(
                  (m) => parseISO(m.start_at).getHours() === hour,
                );
                const slotFollowUps = getFollowUpsForDay(currentDate).filter(
                  (f) => f.scheduled_at && parseISO(f.scheduled_at).getHours() === hour,
                );

                return (
                  <div key={hour} className="flex border-b border-white/5">
                    <div className="w-20 p-3 text-sm text-gray-500 text-right flex-shrink-0">
                      {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                    </div>
                    <div
                      className="flex-1 min-h-[60px] p-2 hover:bg-white/5 cursor-pointer"
                      onClick={() => {
                        resetForm();
                        setFormData((prev) => ({ ...prev, start_at: slotDate.toISOString() }));
                        setShowCreateModal(true);
                      }}
                    >
                      <div className="flex flex-wrap gap-2">
                        {slotEvents.map(renderEventBadge)}
                        {slotMeetings.map(renderMeetingBadge)}
                        {slotFollowUps.map(renderFollowUpBadge)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Agenda View */
          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
            {(() => {
              const allItems: { date: Date; item: CalendarEvent | Meeting | FollowUpExtended | Task; type: string }[] =
                [];

              filteredEvents.forEach((e) => allItems.push({ date: parseISO(e.start_at), item: e, type: 'event' }));
              meetings.forEach((m) => allItems.push({ date: parseISO(m.start_at), item: m, type: 'meeting' }));
              followUps
                .filter((f) => !f.completed && f.scheduled_at)
                .forEach((f) => allItems.push({ date: parseISO(f.scheduled_at!), item: f, type: 'followup' }));
              filteredTasks
                .filter((t) => t.due_date && t.status !== 'completed')
                .forEach((t) => allItems.push({ date: new Date(t.due_date!), item: t, type: 'task' }));

              const sortedItems = allItems.sort((a, b) => a.date.getTime() - b.date.getTime());

              if (sortedItems.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-20">
                    <CalendarIcon className="w-12 h-12 text-gray-600 mb-3" />
                    <p className="text-gray-400">No upcoming items</p>
                  </div>
                );
              }

              return sortedItems.map(({ date, item, type }) => {
                const itemId = 'id' in item ? item.id : '';
                const itemTitle = 'title' in item ? item.title : ('client_name' in item ? item.client_name : '');
                const itemLocation = 'location' in item ? item.location : undefined;
                return (
                  <div
                    key={`${type}-${itemId}`}
                    onClick={() => {
                      setSelectedEvent(item);
                      setShowEventModal(true);
                    }}
                    className="flex items-center gap-4 p-4 hover:bg-white/5 cursor-pointer"
                  >
                    <div className="w-16 text-center flex-shrink-0">
                      <div className="text-xs text-gray-500">{format(date, 'MMM')}</div>
                      <div className="text-xl font-bold text-white">{format(date, 'd')}</div>
                      <div className="text-xs text-gray-500">{format(date, 'EEE')}</div>
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        type === 'event'
                          ? EVENT_TYPE_COLORS[(item as CalendarEvent).event_type]
                          : type === 'meeting'
                            ? 'bg-purple-500'
                            : type === 'followup'
                              ? 'bg-green-500'
                              : 'bg-cyan-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{itemTitle}</p>
                      <p className="text-xs text-gray-400">
                        {format(date, 'h:mm a')}
                        {itemLocation && ` • ${itemLocation}`}
                      </p>
                    </div>
                  <div className="text-xs text-gray-500">
                    {type === 'event' ? 'Event' : type === 'meeting' ? 'Meeting' : type === 'followup' ? 'Follow-up' : 'Task'}
                  </div>
                </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              className="glass-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Create New</h3>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Type Selection */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { type: 'event', label: 'Event', icon: CalendarIcon },
                  { type: 'meeting', label: 'Meeting', icon: Users },
                  { type: 'followup', label: 'Follow-up', icon: Phone },
                  { type: 'task', label: 'Task', icon: CheckSquare },
                ].map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => setCreateType(opt.type as 'event' | 'meeting' | 'followup' | 'task')}
                    className={`p-3 rounded-lg flex flex-col items-center gap-1 border transition-colors ${
                      createType === opt.type
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <opt.icon className="w-5 h-5" />
                    <span className="text-xs">{opt.label}</span>
                  </button>
                ))}
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {createType !== 'followup' && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Enter title..."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    {createType === 'followup' ? 'Notes' : 'Description'}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder="Add details..."
                  />
                </div>

                {createType === 'followup' && (
                  <>
                    {/* Lead Follow-up Calendar Fields */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Client Name *</label>
                      <input
                        type="text"
                        value={formData.client_name}
                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Client name..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Lead Source</label>
                        <select
                          value={formData.lead_source}
                          onChange={(e) => setFormData({ ...formData, lead_source: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="" className="bg-gray-900">
                            Select source
                          </option>
                          <option value="website" className="bg-gray-900">
                            Website
                          </option>
                          <option value="referral" className="bg-gray-900">
                            Referral
                          </option>
                          <option value="social_media" className="bg-gray-900">
                            Social Media
                          </option>
                          <option value="cold_call" className="bg-gray-900">
                            Cold Call
                          </option>
                          <option value="email" className="bg-gray-900">
                            Email
                          </option>
                          <option value="event" className="bg-gray-900">
                            Event
                          </option>
                          <option value="other" className="bg-gray-900">
                            Other
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Link to Lead</label>
                        <select
                          value={formData.lead_id}
                          onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="" className="bg-gray-900">
                            No linked lead
                          </option>
                          {leads.map((l) => (
                            <option key={l.id} value={l.id} className="bg-gray-900">
                              {l.company_name} - {l.contact_person}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Follow-up Date *</label>
                        <input
                          type="date"
                          value={formData.follow_up_date}
                          onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Follow-up Time *</label>
                        <input
                          type="time"
                          value={formData.follow_up_time}
                          onChange={(e) => setFormData({ ...formData, follow_up_time: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Assigned Telecaller</label>
                      <select
                        value={formData.assigned_telecaller}
                        onChange={(e) => setFormData({ ...formData, assigned_telecaller: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="" className="bg-gray-900">
                          Unassigned
                        </option>
                        {telecallers.map((t) => (
                          <option key={t.user_id} value={t.user_id} className="bg-gray-900">
                            {t.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {(createType === 'event' || createType === 'meeting') && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Start Date & Time</label>
                        <input
                          type="datetime-local"
                          value={formData.start_at.slice(0, 16)}
                          onChange={(e) =>
                            setFormData({ ...formData, start_at: new Date(e.target.value).toISOString() })
                          }
                          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">End Date & Time</label>
                        <input
                          type="datetime-local"
                          value={formData.end_at ? formData.end_at.slice(0, 16) : ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              end_at: e.target.value ? new Date(e.target.value).toISOString() : '',
                            })
                          }
                          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Meeting location or link..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Reminder (minutes before)</label>
                      <select
                        value={formData.reminder_minutes}
                        onChange={(e) => setFormData({ ...formData, reminder_minutes: parseInt(e.target.value) })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value={0} className="bg-gray-900">
                          No reminder
                        </option>
                        <option value={5} className="bg-gray-900">
                          5 minutes
                        </option>
                        <option value={10} className="bg-gray-900">
                          10 minutes
                        </option>
                        <option value={15} className="bg-gray-900">
                          15 minutes
                        </option>
                        <option value={30} className="bg-gray-900">
                          30 minutes
                        </option>
                        <option value={60} className="bg-gray-900">
                          1 hour
                        </option>
                        <option value={120} className="bg-gray-900">
                          2 hours
                        </option>
                        <option value={1440} className="bg-gray-900">
                          1 day
                        </option>
                      </select>
                    </div>

                    {createType === 'event' && (
                      <>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Event Type</label>
                          <select
                            value={formData.event_type}
                            onChange={(e) => setFormData({ ...formData, event_type: e.target.value as EventType })}
                            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="event" className="bg-gray-900">
                              Event
                            </option>
                            <option value="reminder" className="bg-gray-900">
                              Reminder
                            </option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Color</label>
                          <div className="flex gap-2">
                            {EVENT_COLORS.map((c) => (
                              <button
                                key={c.value}
                                onClick={() => setFormData({ ...formData, color: c.value })}
                                className={`w-8 h-8 rounded-lg ${c.class} ${formData.color === c.value ? 'ring-2 ring-white' : ''}`}
                              />
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {createType === 'meeting' && (
                      <>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Meeting Type</label>
                          <select
                            value={formData.meeting_type}
                            onChange={(e) => setFormData({ ...formData, meeting_type: e.target.value as MeetingType })}
                            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="general" className="bg-gray-900">
                              General
                            </option>
                            <option value="client" className="bg-gray-900">
                              Client
                            </option>
                            <option value="team" className="bg-gray-900">
                              Team
                            </option>
                            <option value="lead" className="bg-gray-900">
                              Lead
                            </option>
                            <option value="follow_up" className="bg-gray-900">
                              Follow-up
                            </option>
                            <option value="review" className="bg-gray-900">
                              Review
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Assigned User</label>
                          <select
                            value={formData.assigned_user}
                            onChange={(e) => setFormData({ ...formData, assigned_user: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="" className="bg-gray-900">
                              No assigned user
                            </option>
                            {users.map((u) => (
                              <option key={u.user_id} value={u.user_id} className="bg-gray-900">
                                {u.full_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Additional Attendees</label>
                          <select
                            multiple
                            value={formData.attendees}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                attendees: Array.from(e.target.selectedOptions, (o) => o.value),
                              })
                            }
                            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 h-24"
                          >
                            {users.map((u) => (
                              <option key={u.user_id} value={u.user_id} className="bg-gray-900">
                                {u.full_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Agenda</label>
                          <textarea
                            value={formData.agenda}
                            onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                            rows={2}
                            placeholder="Meeting agenda..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Notes</label>
                          <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                            rows={2}
                            placeholder="Meeting notes..."
                          />
                        </div>
                      </>
                    )}
                  </>
                )}

                {createType === 'task' && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="low" className="bg-gray-900">
                          Low
                        </option>
                        <option value="medium" className="bg-gray-900">
                          Medium
                        </option>
                        <option value="high" className="bg-gray-900">
                          High
                        </option>
                        <option value="urgent" className="bg-gray-900">
                          Urgent
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowCreateModal(false)} className="flex-1 btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={
                    createType === 'followup' ? !formData.client_name : !formData.title
                  }
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && selectedEvent && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowEditModal(false);
              setSelectedEvent(null);
            }}
          >
            <motion.div
              className="glass-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Edit</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEvent(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                {'lead_id' in selectedEvent && 'scheduled_at' in selectedEvent ? (
                  <>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Client Name *</label>
                      <input
                        type="text"
                        value={formData.client_name}
                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Lead Source</label>
                      <select
                        value={formData.lead_source}
                        onChange={(e) => setFormData({ ...formData, lead_source: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="" className="bg-gray-900">
                          Select source
                        </option>
                        <option value="website" className="bg-gray-900">
                          Website
                        </option>
                        <option value="referral" className="bg-gray-900">
                          Referral
                        </option>
                        <option value="social_media" className="bg-gray-900">
                          Social Media
                        </option>
                        <option value="cold_call" className="bg-gray-900">
                          Cold Call
                        </option>
                        <option value="email" className="bg-gray-900">
                          Email
                        </option>
                        <option value="event" className="bg-gray-900">
                          Event
                        </option>
                        <option value="other" className="bg-gray-900">
                          Other
                        </option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Follow-up Date *</label>
                        <input
                          type="date"
                          value={formData.follow_up_date}
                          onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Follow-up Time *</label>
                        <input
                          type="time"
                          value={formData.follow_up_time}
                          onChange={(e) => setFormData({ ...formData, follow_up_time: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Assigned Telecaller</label>
                      <select
                        value={formData.assigned_telecaller}
                        onChange={(e) => setFormData({ ...formData, assigned_telecaller: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="" className="bg-gray-900">
                          Unassigned
                        </option>
                        {telecallers.map((t) => (
                          <option key={t.user_id} value={t.user_id} className="bg-gray-900">
                            {t.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Notes</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                        rows={3}
                      />
                    </div>
                  </>
                ) : 'priority' in selectedEvent ? (
                  <>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="low" className="bg-gray-900">
                          Low
                        </option>
                        <option value="medium" className="bg-gray-900">
                          Medium
                        </option>
                        <option value="high" className="bg-gray-900">
                          High
                        </option>
                        <option value="urgent" className="bg-gray-900">
                          Urgent
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Start Date & Time</label>
                        <input
                          type="datetime-local"
                          value={formData.start_at.slice(0, 16)}
                          onChange={(e) =>
                            setFormData({ ...formData, start_at: new Date(e.target.value).toISOString() })
                          }
                          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">End Date & Time</label>
                        <input
                          type="datetime-local"
                          value={formData.end_at ? formData.end_at.slice(0, 16) : ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              end_at: e.target.value ? new Date(e.target.value).toISOString() : '',
                            })
                          }
                          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Reminder (minutes before)</label>
                      <select
                        value={formData.reminder_minutes}
                        onChange={(e) => setFormData({ ...formData, reminder_minutes: parseInt(e.target.value) })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value={0} className="bg-gray-900">
                          No reminder
                        </option>
                        <option value={5} className="bg-gray-900">
                          5 minutes
                        </option>
                        <option value={10} className="bg-gray-900">
                          10 minutes
                        </option>
                        <option value={15} className="bg-gray-900">
                          15 minutes
                        </option>
                        <option value={30} className="bg-gray-900">
                          30 minutes
                        </option>
                        <option value={60} className="bg-gray-900">
                          1 hour
                        </option>
                        <option value={120} className="bg-gray-900">
                          2 hours
                        </option>
                        <option value={1440} className="bg-gray-900">
                          1 day
                        </option>
                      </select>
                    </div>
                    {'meeting_type' in selectedEvent && (
                      <>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Meeting Type</label>
                          <select
                            value={formData.meeting_type}
                            onChange={(e) =>
                              setFormData({ ...formData, meeting_type: e.target.value as MeetingType })
                            }
                            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="general" className="bg-gray-900">
                              General
                            </option>
                            <option value="client" className="bg-gray-900">
                              Client
                            </option>
                            <option value="team" className="bg-gray-900">
                              Team
                            </option>
                            <option value="lead" className="bg-gray-900">
                              Lead
                            </option>
                            <option value="follow_up" className="bg-gray-900">
                              Follow-up
                            </option>
                            <option value="review" className="bg-gray-900">
                              Review
                            </option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Agenda</label>
                          <textarea
                            value={formData.agenda}
                            onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Notes</label>
                          <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                            rows={2}
                          />
                        </div>
                      </>
                    )}
                    {'event_type' in selectedEvent && (
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Color</label>
                        <div className="flex gap-2">
                          {EVENT_COLORS.map((c) => (
                            <button
                              key={c.value}
                              onClick={() => setFormData({ ...formData, color: c.value })}
                              className={`w-8 h-8 rounded-lg ${c.class} ${formData.color === c.value ? 'ring-2 ring-white' : ''}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEvent(null);
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button onClick={handleEdit} className="flex-1 btn-primary">
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Details Modal */}
      <AnimatePresence>
        {showEventModal && selectedEvent && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEventModal(false)}
          >
            <motion.div
              className="glass-card p-6 max-w-md w-full"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {('title' in selectedEvent ? selectedEvent.title : 'client_name' in selectedEvent ? selectedEvent.client_name : 'Details')}
                </h3>
                <button onClick={() => setShowEventModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Type Badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs text-white ${
                      'event_type' in selectedEvent
                        ? EVENT_TYPE_COLORS[selectedEvent.event_type]
                        : 'meeting_type' in selectedEvent
                          ? 'bg-purple-500'
                          : 'lead_id' in selectedEvent && 'scheduled_at' in selectedEvent
                            ? 'bg-green-500'
                            : 'bg-cyan-500'
                    }`}
                  >
                    {'event_type' in selectedEvent
                      ? EVENT_TYPE_LABELS[selectedEvent.event_type]
                      : 'meeting_type' in selectedEvent
                        ? 'Meeting'
                        : 'lead_id' in selectedEvent && 'scheduled_at' in selectedEvent
                          ? 'Follow-up'
                          : 'Task'}
                  </span>
                  {isItemOverdue(selectedEvent) &&
                    !('status' in selectedEvent && selectedEvent.status === 'completed') &&
                    !('completed' in selectedEvent && selectedEvent.completed) && (
                      <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Overdue
                      </span>
                    )}
                </div>

                {/* Date/Time */}
                {'start_at' in selectedEvent && selectedEvent.start_at && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Clock className="w-4 h-4 text-gray-500" />
                    {format(parseISO(selectedEvent.start_at), 'PPp')}
                  </div>
                )}

                {/* Scheduled At for Follow-ups */}
                {'scheduled_at' in selectedEvent && selectedEvent.scheduled_at && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Clock className="w-4 h-4 text-gray-500" />
                    {format(parseISO(selectedEvent.scheduled_at), 'PPp')}
                  </div>
                )}

                {/* Due Date for Tasks */}
                {'due_date' in selectedEvent && selectedEvent.due_date && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                    Due: {format(new Date(selectedEvent.due_date), 'PPP')}
                  </div>
                )}

                {/* Priority for Tasks */}
                {'priority' in selectedEvent && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Target className="w-4 h-4 text-gray-500" />
                    Priority: <span className="capitalize">{selectedEvent.priority}</span>
                  </div>
                )}

                {/* Status for Tasks */}
                {'status' in selectedEvent && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-gray-500" />
                    Status: <span className="capitalize">{('status' in selectedEvent ? selectedEvent.status : '').replace('_', ' ')}</span>
                  </div>
                )}

                {/* Location */}
                {'location' in selectedEvent && selectedEvent.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    {selectedEvent.location}
                  </div>
                )}

                {/* Meeting Type */}
                {'meeting_type' in selectedEvent && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Users className="w-4 h-4 text-gray-500" />
                    {MEETING_TYPE_LABELS[selectedEvent.meeting_type]}
                  </div>
                )}

                {/* Reminder */}
                {'reminder_minutes' in selectedEvent && selectedEvent.reminder_minutes && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <BellRing className="w-4 h-4 text-gray-500" />
                    Reminder: {selectedEvent.reminder_minutes} min before
                  </div>
                )}

                {/* Follow-up specific fields */}
                {'client_name' in selectedEvent && selectedEvent.client_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <User className="w-4 h-4 text-gray-500" />
                    Client: {selectedEvent.client_name}
                  </div>
                )}
                {'lead_source' in selectedEvent && selectedEvent.lead_source && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                    Source: <span className="capitalize">{selectedEvent.lead_source.replace('_', ' ')}</span>
                  </div>
                )}
                {'assigned_telecaller' in selectedEvent && selectedEvent.assigned_telecaller && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Phone className="w-4 h-4 text-gray-500" />
                    Telecaller: {telecallers.find((t) => t.user_id === ('assigned_telecaller' in selectedEvent ? selectedEvent.assigned_telecaller : ''))?.full_name || 'Assigned'}
                  </div>
                )}

                {/* Meeting notes */}
                {'notes' in selectedEvent && selectedEvent.notes && (
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <StickyNote className="w-4 h-4" />
                      <span className="text-xs">Notes</span>
                    </div>
                    <p className="text-sm text-gray-300">{selectedEvent.notes}</p>
                  </div>
                )}

                {/* Meeting agenda */}
                {'agenda' in selectedEvent && selectedEvent.agenda && (
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <List className="w-4 h-4" />
                      <span className="text-xs">Agenda</span>
                    </div>
                    <p className="text-sm text-gray-300">{selectedEvent.agenda}</p>
                  </div>
                )}

                {/* Description/Notes */}
                {'description' in selectedEvent && selectedEvent.description && (
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-sm text-gray-300">{selectedEvent.description}</p>
                  </div>
                )}

                {/* Lead/Client Info */}
                {'lead_id' in selectedEvent && selectedEvent.lead_id && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                    Lead: {('lead' in selectedEvent && selectedEvent.lead ? selectedEvent.lead.company_name : 'Unknown')}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-6">
                {'lead_id' in selectedEvent && 'completed' in selectedEvent && !selectedEvent.completed && (
                  <button
                    onClick={() => handleCompleteFollowUp(selectedEvent.id)}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Complete
                  </button>
                )}
                {'status' in selectedEvent && selectedEvent.status !== 'completed' && 'priority' in selectedEvent && (
                  <button
                    onClick={() => handleCompleteTask(selectedEvent.id)}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Complete
                  </button>
                )}
                <button
                  onClick={() => openEditModal(selectedEvent)}
                  className="px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleDeleteEvent}
                  className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg text-white text-sm font-medium shadow-lg ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
