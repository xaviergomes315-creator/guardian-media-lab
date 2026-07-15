import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Building2,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Eye,
  X,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  FileText,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { ProjectStatus, Client, Profile, Project } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';

const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: 'bg-yellow-500',
  active: 'bg-green-500',
  on_hold: 'bg-orange-500',
  completed: 'bg-blue-500',
  cancelled: 'bg-red-500',
};

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const statusOptions: ProjectStatus[] = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [, setTeam] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newProject, setNewProject] = useState({
    name: '',
    client_id: '',
    description: '',
    status: 'planning' as ProjectStatus,
    budget: 0,
    start_date: '',
    end_date: '',
    team_members: [] as string[],
    user_id: '',
  });

  useEffect(() => {
    fetchProjects();
    fetchClients();
    fetchTeam();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(id, company_name, contact_person, email),
        tasks(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('*');
    if (data) setClients(data);
  };

  const fetchTeam = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .in('role', ['admin', 'accountant']);
    if (data) setTeam(data);
  };

  const handleAddProject = async () => {
    // Clear previous messages
    setError(null);
    setSuccess(null);

    // Validation
    if (!newProject.name.trim()) {
      setError('Project name is required');
      return;
    }

    setSaving(true);

    try {
      // Prepare project data
      const projectData = {
        name: newProject.name.trim(),
        client_id: newProject.client_id || null,
        description: newProject.description || null,
        status: newProject.status,
        budget: newProject.budget || 0,
        start_date: newProject.start_date || null,
        end_date: newProject.end_date || null,
        user_id: user?.id, // Set user_id to current user
      };

      const { error: insertError } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .maybeSingle();

      if (insertError) {
        console.error('Error adding project:', insertError);
        setError(insertError.message || 'Failed to create project');
        return;
      }

      // Success
      setSuccess('Project created successfully!');
      setShowAddModal(false);
      setNewProject({
        name: '',
        client_id: '',
        description: '',
        status: 'planning',
        budget: 0,
        start_date: '',
        end_date: '',
        team_members: [],
        user_id: '',
      });

      // Refresh projects list
      await fetchProjects();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      console.error('Error adding project:', err);
      const message = err instanceof Error ? err.message : 'Failed to create project';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;

    // Clear previous messages
    setError(null);
    setSuccess(null);

    // Validation
    if (!selectedProject.name?.trim()) {
      setError('Project name is required');
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          name: selectedProject.name.trim(),
          client_id: selectedProject.client_id || null,
          description: selectedProject.description || null,
          status: selectedProject.status,
          budget: selectedProject.budget || 0,
          start_date: selectedProject.start_date || null,
          end_date: selectedProject.end_date || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedProject.id);

      if (updateError) {
        console.error('Error updating project:', updateError);
        setError(updateError.message || 'Failed to update project');
        return;
      }

      setSuccess('Project updated successfully!');
      setShowEditModal(false);
      setSelectedProject(null);
      await fetchProjects();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      console.error('Error updating project:', err);
      const message = err instanceof Error ? err.message : 'Failed to update project';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (projectId: string, status: ProjectStatus) => {
    const { error } = await supabase
      .from('projects')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', projectId);
    if (error) {
      console.error('Error updating status:', error);
    } else {
      fetchProjects();
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error: deleteError } = await supabase.from('projects').delete().eq('id', projectId);
      if (deleteError) {
        console.error('Error deleting project:', deleteError);
        setError(deleteError.message || 'Failed to delete project');
        return;
      }
      setSuccess('Project deleted successfully!');
      await fetchProjects();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      console.error('Error deleting project:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete project';
      setError(message);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-sora text-white">Project Management</h1>
          <p className="text-gray-400">Manage and track your projects from start to finish</p>
        </div>
        <button onClick={() => { setShowAddModal(true); setError(null); }} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Success Toast */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400"
        >
          <CheckCircle className="w-5 h-5" />
          {success}
        </motion.div>
      )}

      {/* Error Toast */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400"
        >
          <AlertCircle className="w-5 h-5" />
          {error}
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statusOptions.map((status) => {
          const count = projects.filter((p) => p.status === status).length;
          return (
            <div key={status} className="glass-card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${PROJECT_STATUS_COLORS[status]} flex items-center justify-center`}>
                {status === 'active' ? (
                  <Play className="w-5 h-5 text-white" />
                ) : status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : status === 'on_hold' ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <FileText className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="text-xs text-gray-400">{PROJECT_STATUS_LABELS[status]}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
          className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 min-w-[180px]"
        >
          <option value="all" className="bg-gray-900">All Status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status} className="bg-gray-900">
              {PROJECT_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      {/* Projects Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-400">Loading projects...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            No projects found. Create your first project!
          </div>
        ) : (
          filteredProjects.map((project, index) => {
            const daysLeft = getDaysRemaining(project.end_date);
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-6 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white line-clamp-1">{project.name}</h3>
                      <p className="text-sm text-gray-400">{project.client?.company_name || 'No client'}</p>
                    </div>
                  </div>
                  <select
                    value={project.status}
                    onChange={(e) => handleUpdateStatus(project.id, e.target.value as ProjectStatus)}
                    className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${PROJECT_STATUS_COLORS[project.status]} text-white`}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status} className="bg-gray-900">
                        {PROJECT_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>

                {project.description && (
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{project.description}</p>
                )}

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white">
                      {project.tasks && project.tasks.length > 0
                        ? Math.round((project.tasks.filter((t: { status: string }) => t.status === 'completed').length / project.tasks.length) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      style={{
                        width: `${project.tasks && project.tasks.length > 0
                          ? Math.round((project.tasks.filter((t: { status: string }) => t.status === 'completed').length / project.tasks.length) * 100)
                          : 0}%`
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex items-center gap-1 text-gray-400">
                    <DollarSign className="w-4 h-4" />
                    <span>${project.budget?.toLocaleString() || 0}</span>
                  </div>
                  {daysLeft !== null && (
                    <div className={`flex items-center gap-1 ${daysLeft < 0 ? 'text-red-400' : daysLeft < 7 ? 'text-yellow-400' : 'text-gray-400'}`}>
                      <Clock className="w-4 h-4" />
                      <span>{daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="text-xs text-gray-500">
                    {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'No start date'}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedProject(project);
                        setShowDetails(true);
                      }}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProject(project);
                        setShowEditModal(true);
                      }}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add Project Modal */}
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
              className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Create New Project</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Error Display in Modal */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAddProject(); }}>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Website Redesign"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Client</label>
                  <select
                    value={newProject.client_id}
                    onChange={(e) => setNewProject({ ...newProject, client_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="" className="bg-gray-900">Select Client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id} className="bg-gray-900">
                        {client.company_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder="Project description..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={newProject.status}
                      onChange={(e) => setNewProject({ ...newProject, status: e.target.value as ProjectStatus })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status} className="bg-gray-900">
                          {PROJECT_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Budget</label>
                    <input
                      type="number"
                      value={newProject.budget}
                      onChange={(e) => setNewProject({ ...newProject, budget: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      placeholder="50000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={newProject.start_date}
                      onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                    <input
                      type="date"
                      value={newProject.end_date}
                      onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    disabled={saving}
                    className="flex-1 btn-secondary disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddProject}
                    disabled={saving || !newProject.name.trim()}
                    className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Project'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Project Modal */}
      <AnimatePresence>
        {showEditModal && selectedProject && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Edit Project</h3>
                <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Project Name *</label>
                  <input
                    type="text"
                    value={selectedProject.name}
                    onChange={(e) => setSelectedProject({ ...selectedProject, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Client</label>
                  <select
                    value={selectedProject.client_id || ''}
                    onChange={(e) => setSelectedProject({ ...selectedProject, client_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="" className="bg-gray-900">Select Client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id} className="bg-gray-900">
                        {client.company_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={selectedProject.description || ''}
                    onChange={(e) => setSelectedProject({ ...selectedProject, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={selectedProject.status}
                      onChange={(e) => setSelectedProject({ ...selectedProject, status: e.target.value as ProjectStatus })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status} className="bg-gray-900">
                          {PROJECT_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Budget</label>
                    <input
                      type="number"
                      value={selectedProject.budget}
                      onChange={(e) => setSelectedProject({ ...selectedProject, budget: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={selectedProject.start_date || ''}
                      onChange={(e) => setSelectedProject({ ...selectedProject, start_date: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                    <input
                      type="date"
                      value={selectedProject.end_date || ''}
                      onChange={(e) => setSelectedProject({ ...selectedProject, end_date: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    disabled={saving}
                    className="flex-1 btn-secondary disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateProject}
                    disabled={saving || !selectedProject.name?.trim()}
                    className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Details Modal */}
      <AnimatePresence>
        {showDetails && selectedProject && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              className="glass-card p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white">{selectedProject.name}</h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-xs font-medium ${PROJECT_STATUS_COLORS[selectedProject.status]} text-white`}>
                    {PROJECT_STATUS_LABELS[selectedProject.status]}
                  </span>
                </div>
                <button onClick={() => setShowDetails(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  {selectedProject.client && (
                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Building2 className="w-4 h-4" />
                        <span className="text-sm">Client</span>
                      </div>
                      <p className="text-white font-medium">{selectedProject.client.company_name}</p>
                      <p className="text-sm text-gray-400">{selectedProject.client.contact_person}</p>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">Budget</span>
                    </div>
                    <p className="text-2xl font-bold text-white">${selectedProject.budget?.toLocaleString() || 0}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Timeline</span>
                    </div>
                    <p className="text-white">
                      {selectedProject.start_date ? new Date(selectedProject.start_date).toLocaleDateString() : 'TBD'} - {selectedProject.end_date ? new Date(selectedProject.end_date).toLocaleDateString() : 'TBD'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Tasks</span>
                    </div>
                    <p className="text-white">{selectedProject.tasks?.length || 0} tasks</p>
                  </div>
                </div>
              </div>

              {selectedProject.description && (
                <div className="p-4 rounded-xl bg-white/5 mb-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
                  <p className="text-white">{selectedProject.description}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => navigate('/dashboard/tasks')}
                  className="flex-1 btn-secondary flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  View Tasks
                </button>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setShowEditModal(true);
                  }}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Project
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
