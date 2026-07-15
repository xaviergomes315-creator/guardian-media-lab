import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Calendar,
  Edit,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  Circle,
  AlertTriangle,
  User,
  Flag,
  FileText,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { tasksService } from '../../../services/api';
import { TaskStatus, TaskPriority, Project, Profile } from '../../../types';

const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'bg-yellow-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'text-gray-400 bg-gray-400/10',
  medium: 'text-blue-400 bg-blue-400/10',
  high: 'text-orange-400 bg-orange-400/10',
  urgent: 'text-red-400 bg-red-400/10',
};

const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const statusOptions: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];
const priorityOptions: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage] = useState(10);
  const [toast, setToast] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const [newTask, setNewTask] = useState({
    title: '',
    project_id: '',
    assigned_to: '',
    description: '',
    status: 'pending' as TaskStatus,
    priority: 'medium' as TaskPriority,
    due_date: '',
  });

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchTeam();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        project:projects(id, name)
      `)
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('id, name').order('name');
    if (data) setProjects(data as Project[]);
  };

  const fetchTeam = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .in('role', ['admin', 'telecaller', 'accountant']);
    if (data) setTeam(data);
  };

  const getAssignedUser = (task: any) => {
    if (!task.assigned_to) return null;
    return team.find(member => member.user_id === task.assigned_to) || null;
  };

  const handleAddTask = async () => {
    try {
      await tasksService.create({
        title: newTask.title,
        description: newTask.description || null,
        priority: newTask.priority,
        due_date: newTask.due_date || null,
        status: newTask.status,
        project_id: newTask.project_id || null,
        assigned_to: newTask.assigned_to || null,
      });
      showToast('Task created successfully');
      fetchTasks();
      setShowAddModal(false);
      setNewTask({
        title: '',
        project_id: '',
        assigned_to: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: '',
      });
    } catch (error: unknown) {
      console.error('Error adding task:', error);
      const message = error instanceof Error ? error.message : 'Failed to create task';
      showToast(message);
    }
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;
    try {
      await tasksService.update(selectedTask.id, {
        title: selectedTask.title,
        description: selectedTask.description || null,
        priority: selectedTask.priority,
        due_date: selectedTask.due_date || null,
        status: selectedTask.status,
        project_id: selectedTask.project_id || null,
        assigned_to: selectedTask.assigned_to || null,
      });
      showToast('Task updated successfully');
      fetchTasks();
      setShowEditModal(false);
      setSelectedTask(null);
    } catch (error: unknown) {
      console.error('Error updating task:', error);
      const message = error instanceof Error ? error.message : 'Failed to update task';
      showToast(message);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: TaskStatus) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', taskId);
    if (error) {
      console.error('Error updating status:', error);
    } else {
      fetchTasks();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await tasksService.delete(taskId);
      showToast('Task deleted successfully');
      fetchTasks();
      setTaskToDelete(null);
    } catch (error: unknown) {
      console.error('Error deleting task:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete task';
      showToast(message);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesUser = userFilter === 'all' || task.assigned_to === userFilter;
    let matchesDate = true;
    if (dateFilter !== 'all' && task.due_date) {
      const due = new Date(task.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      if (dateFilter === 'today') matchesDate = due >= today && due < tomorrow;
      else if (dateFilter === 'tomorrow') {
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);
        matchesDate = due >= tomorrow && due < dayAfter;
      } else if (dateFilter === 'this_week') matchesDate = due >= today && due <= weekEnd;
      else if (dateFilter === 'overdue') matchesDate = due < today && task.status !== 'completed';
    } else if (dateFilter === 'overdue') {
      matchesDate = task.due_date ? new Date(task.due_date) < new Date() && task.status !== 'completed' : false;
    }
    return matchesSearch && matchesStatus && matchesPriority && matchesUser && matchesDate;
  });

  // Pagination
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  const getDueDateStatus = (dueDate: string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'overdue';
    if (diff === 0) return 'today';
    if (diff <= 2) return 'soon';
    return 'normal';
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-sora text-white">Task Management</h1>
          <p className="text-sm text-gray-400">Manage and track your tasks efficiently</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statusOptions.map((status) => {
          const count = tasks.filter((t) => t.status === status).length;
          return (
            <div
              key={status}
              className="glass-card p-3 md:p-4 flex items-center gap-2 md:gap-3 cursor-pointer hover:bg-white/5"
              onClick={() => setStatusFilter(status === statusFilter ? 'all' : status)}
            >
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${TASK_STATUS_COLORS[status]} flex items-center justify-center`}>
                {status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
                ) : (
                  <Circle className="w-4 h-4 md:w-5 md:h-5 text-white" />
                )}
              </div>
              <div>
                <p className="text-lg md:text-2xl font-bold text-white">{count}</p>
                <p className="text-xs text-gray-400">{TASK_STATUS_LABELS[status]}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white min-w-[120px]"
          >
            <option value="all" className="bg-gray-900">All Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status} className="bg-gray-900">
                {TASK_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white min-w-[120px]"
          >
            <option value="all" className="bg-gray-900">All Priority</option>
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority} className="bg-gray-900">
                {TASK_PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white min-w-[120px]"
          >
            <option value="all" className="bg-gray-900">All Users</option>
            {team.map((member) => (
              <option key={member.user_id} value={member.user_id} className="bg-gray-900">
                {member.full_name}
              </option>
            ))}
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white min-w-[120px]"
          >
            <option value="all" className="bg-gray-900">All Dates</option>
            <option value="today" className="bg-gray-900">Today</option>
            <option value="tomorrow" className="bg-gray-900">Tomorrow</option>
            <option value="this_week" className="bg-gray-900">This Week</option>
            <option value="overdue" className="bg-gray-900">Overdue</option>
          </select>
          {(userFilter !== 'all' || dateFilter !== 'all') && (
            <button
              onClick={() => { setUserFilter('all'); setDateFilter('all'); }}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white text-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Task</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Project</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Assigned To</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Priority</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Due Date</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    Loading tasks...
                  </td>
                </tr>
              ) : currentTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No tasks found. Create your first task!
                  </td>
                </tr>
              ) : (
                currentTasks.map((task) => {
                  const dueDateStatus = getDueDateStatus(task.due_date);
                  return (
                    <motion.tr
                      key={task.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleUpdateStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                            className={`w-5 h-5 rounded border flex-shrink-0 ${
                              task.status === 'completed'
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-500 hover:border-white'
                            }`}
                          >
                            {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </button>
                          <div>
                            <p className={`font-medium ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-white'}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-gray-500 truncate max-w-xs">{task.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {task.project ? (
                          <span className="px-2 py-1 rounded-lg text-xs bg-purple-500/20 text-purple-400">
                            {task.project.name}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">No project</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getAssignedUser(task) ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs text-white font-medium">
                              {getAssignedUser(task)?.full_name?.[0] || getAssignedUser(task)?.email?.[0]?.toUpperCase()}
                            </div>
                            <span className="text-sm text-white">{getAssignedUser(task)?.full_name || getAssignedUser(task)?.email}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${TASK_PRIORITY_COLORS[task.priority as TaskPriority]}`}>
                          {TASK_PRIORITY_LABELS[task.priority as TaskPriority]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={task.status}
                          onChange={(e) => handleUpdateStatus(task.id, e.target.value as TaskStatus)}
                          className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${TASK_STATUS_COLORS[task.status as TaskStatus]} text-white`}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status} className="bg-gray-900">
                              {TASK_STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {task.due_date ? (
                          <div className={`flex items-center gap-1 text-sm ${
                            dueDateStatus === 'overdue' ? 'text-red-400' :
                            dueDateStatus === 'today' ? 'text-yellow-400' :
                            dueDateStatus === 'soon' ? 'text-orange-400' : 'text-gray-400'
                          }`}>
                            {dueDateStatus === 'overdue' && <AlertTriangle className="w-4 h-4" />}
                            <span>{new Date(task.due_date).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">No due date</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setShowDetails(true);
                            }}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setShowEditModal(true);
                            }}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setTaskToDelete(task)}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-red-500/20 transition-colors text-gray-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
                  </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing {indexOfFirstTask + 1} to {Math.min(indexOfLastTask, filteredTasks.length)} of {filteredTasks.length} tasks
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg bg-white/5 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg ${
                    currentPage === page ? 'bg-blue-600 text-white' : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg bg-white/5 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              className="glass-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Create New Task</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Task Title *</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Design homepage mockup"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder="Task description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Project</label>
                  <select
                    value={newTask.project_id}
                    onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="" className="bg-gray-900">No Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id} className="bg-gray-900">
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Assign To</label>
                  <select
                    value={newTask.assigned_to}
                    onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="" className="bg-gray-900">Unassigned</option>
                    {team.map((member) => (
                      <option key={member.user_id} value={member.user_id} className="bg-gray-900">
                        {member.full_name || member.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={newTask.status}
                      onChange={(e) => setNewTask({ ...newTask, status: e.target.value as TaskStatus })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status} className="bg-gray-900">
                          {TASK_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    >
                      {priorityOptions.map((priority) => (
                        <option key={priority} value={priority} className="bg-gray-900">
                          {TASK_PRIORITY_LABELS[priority]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="flex-1 btn-primary"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Task Modal */}
      <AnimatePresence>
        {showEditModal && selectedTask && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              className="glass-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Edit Task</h3>
                <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Task Title *</label>
                  <input
                    type="text"
                    value={selectedTask.title}
                    onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={selectedTask.description || ''}
                    onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Project</label>
                  <select
                    value={selectedTask.project_id || ''}
                    onChange={(e) => setSelectedTask({ ...selectedTask, project_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="" className="bg-gray-900">No Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id} className="bg-gray-900">
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Assign To</label>
                  <select
                    value={selectedTask.assigned_to || ''}
                    onChange={(e) => setSelectedTask({ ...selectedTask, assigned_to: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="" className="bg-gray-900">Unassigned</option>
                    {team.map((member) => (
                      <option key={member.user_id} value={member.user_id} className="bg-gray-900">
                        {member.full_name || member.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={selectedTask.status}
                      onChange={(e) => setSelectedTask({ ...selectedTask, status: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status} className="bg-gray-900">
                          {TASK_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                    <select
                      value={selectedTask.priority}
                      onChange={(e) => setSelectedTask({ ...selectedTask, priority: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    >
                      {priorityOptions.map((priority) => (
                        <option key={priority} value={priority} className="bg-gray-900">
                          {TASK_PRIORITY_LABELS[priority]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={selectedTask.due_date || ''}
                    onChange={(e) => setSelectedTask({ ...selectedTask, due_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateTask}
                    className="flex-1 btn-primary"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Details Modal */}
      <AnimatePresence>
        {showDetails && selectedTask && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              className="glass-card p-6 max-w-2xl w-full"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${TASK_STATUS_COLORS[selectedTask.status as TaskStatus]} flex items-center justify-center`}>
                    {selectedTask.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <Circle className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedTask.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${TASK_PRIORITY_COLORS[selectedTask.priority as TaskPriority]}`}>
                        {TASK_PRIORITY_LABELS[selectedTask.priority as TaskPriority]}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${TASK_STATUS_COLORS[selectedTask.status as TaskStatus]} text-white`}>
                        {TASK_STATUS_LABELS[selectedTask.status as TaskStatus]}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowDetails(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  {selectedTask.project && (
                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">Project</span>
                      </div>
                      <p className="text-white font-medium">{selectedTask.project.name}</p>
                    </div>
                  )}

                  {getAssignedUser(selectedTask) && (
                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <User className="w-4 h-4" />
                        <span className="text-sm">Assigned To</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm text-white font-medium">
                          {getAssignedUser(selectedTask)?.full_name?.[0] || getAssignedUser(selectedTask)?.email?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-white">{getAssignedUser(selectedTask)?.full_name || getAssignedUser(selectedTask)?.email}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Flag className="w-4 h-4" />
                      <span className="text-sm">Priority</span>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${TASK_PRIORITY_COLORS[selectedTask.priority as TaskPriority]}`}>
                      {TASK_PRIORITY_LABELS[selectedTask.priority as TaskPriority]}
                    </span>
                  </div>

                  {selectedTask.due_date && (
                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Due Date</span>
                      </div>
                      <p className="text-white">{new Date(selectedTask.due_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedTask.description && (
                <div className="p-4 rounded-xl bg-white/5 mb-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
                  <p className="text-white">{selectedTask.description}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setShowEditModal(true);
                  }}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Task
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {taskToDelete && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setTaskToDelete(null)}
          >
            <motion.div
              className="glass-card p-6 max-w-md w-full"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Task</h3>
                  <p className="text-sm text-gray-400">{taskToDelete.title}</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setTaskToDelete(null)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteTask(taskToDelete.id)}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                >
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
            className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
