import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  Building2,
  Calendar,
  Edit,
  Trash2,
  Eye,
  FileText,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  Bell,
  MessageCircle,
  Star,
  Bookmark,
  Save,
  Users,
  CheckSquare,
  Square,
  Heart,
  History,
  ChevronDown,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Lead, LeadStatus, LEAD_STATUS_COLORS, LEAD_STATUS_LABELS, FollowUp, Profile } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';

const statusOptions: LeadStatus[] = ['new', 'contacted', 'follow_up', 'interested', 'proposal_sent', 'won', 'lost'];
const LEADS_STORAGE_KEY = 'crm_leads_settings';
const MAX_RECENT_SEARCHES = 10;

interface SavedFilter {
  id: string;
  name: string;
  search: string;
  status: LeadStatus | 'all';
  source: string;
  dateFrom: string;
  dateTo: string;
  isDefault: boolean;
  createdAt: string;
}

interface LeadSettings {
  savedFilters: SavedFilter[];
  recentSearches: string[];
  favoriteLeadIds: string[];
}

const defaultSettings: LeadSettings = {
  savedFilters: [],
  recentSearches: [],
  favoriteLeadIds: [],
};

const loadSettings = (): LeadSettings => {
  try {
    const saved = localStorage.getItem(LEADS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

const saveSettings = (settings: LeadSettings) => {
  localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(settings));
};

export default function LeadsPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [team, setTeam] = useState<Profile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [leadsPerPage] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [exportToast, setExportToast] = useState<string | null>(null);

  // New state for enhanced features
  const [settings, setSettings] = useState<LeadSettings>(loadSettings);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showSaveFilterModal, setShowSaveFilterModal] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAssignTo, setBulkAssignTo] = useState('');
  const [bulkStatus, setBulkStatus] = useState<LeadStatus | ''>('');
  const [quickActionLead, setQuickActionLead] = useState<Lead | null>(null);

  const [newLead, setNewLead] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    source: 'website',
    status: 'new' as LeadStatus,
    estimated_value: 0,
    notes: '',
    assigned_to: '',
  });

  const [newFollowUp, setNewFollowUp] = useState({
    type: 'call' as FollowUp['type'],
    notes: '',
    scheduled_at: '',
  });

  // Load default filter on mount
  useEffect(() => {
    const defaultFilter = settings.savedFilters.find(f => f.isDefault);
    if (defaultFilter) {
      setSearchQuery(defaultFilter.search);
      setStatusFilter(defaultFilter.status);
      setSourceFilter(defaultFilter.source);
      setDateFromFilter(defaultFilter.dateFrom);
      setDateToFilter(defaultFilter.dateTo);
    }
    fetchLeads();
    fetchTeam();
  }, []);

  useEffect(() => {
    if (selectedLead && showLeadDetails) {
      fetchFollowUps(selectedLead.id);
    }
  }, [selectedLead, showLeadDetails]);

  // Update settings in localStorage
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Track recent searches
  useEffect(() => {
    if (searchQuery.trim() && !settings.recentSearches.includes(searchQuery.trim())) {
      setSettings(prev => ({
        ...prev,
        recentSearches: [searchQuery.trim(), ...prev.recentSearches.slice(0, MAX_RECENT_SEARCHES - 1)],
      }));
    }
  }, [searchQuery]);

  // Show bulk actions when leads are selected
  useEffect(() => {
    setShowBulkActions(selectedLeads.size > 0);
  }, [selectedLeads]);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  };

  const fetchTeam = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .in('role', ['admin', 'telecaller', 'accountant']);
    if (data) setTeam(data);
  };

  const fetchFollowUps = async (leadId: string) => {
    const { data } = await supabase
      .from('follow_ups')
      .select('*')
      .eq('lead_id', leadId)
      .order('scheduled_at', { ascending: true });
    if (data) setFollowUps(data);
  };

  // Filter logic with all filters applied
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
      const matchesDateFrom = !dateFromFilter || new Date(lead.created_at) >= new Date(dateFromFilter);
      const matchesDateTo = !dateToFilter || new Date(lead.created_at) <= new Date(dateToFilter);

      return matchesSearch && matchesStatus && matchesSource && matchesDateFrom && matchesDateTo;
    });
  }, [leads, searchQuery, statusFilter, sourceFilter, dateFromFilter, dateToFilter]);

  // Get unique sources for filter dropdown
  const uniqueSources = useMemo(() => {
    const sources = new Set(leads.map(l => l.source));
    return Array.from(sources);
  }, [leads]);

  const handleAddLead = async () => {
    setFormError(null);
    setFormSuccess(null);

    if (!newLead.company_name.trim()) {
      setFormError('Company name is required');
      return;
    }
    if (!newLead.contact_person.trim()) {
      setFormError('Contact person is required');
      return;
    }
    if (!newLead.email.trim()) {
      setFormError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newLead.email)) {
      setFormError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const insertData = {
        company_name: newLead.company_name.trim(),
        contact_person: newLead.contact_person.trim(),
        email: newLead.email.trim(),
        phone: newLead.phone || null,
        source: newLead.source,
        status: newLead.status,
        estimated_value: newLead.estimated_value || 0,
        notes: newLead.notes || null,
        assigned_to: newLead.assigned_to || null,
      };

      const { data, error } = await supabase
        .from('leads')
        .insert([insertData])
        .select();

      if (error) {
        setFormError(error.message || 'Failed to add lead. Please try again.');
      } else {
        setFormSuccess('Lead added successfully!');
        if (data && data[0]) {
          setLeads((prevLeads) => [data[0] as Lead, ...prevLeads]);
        }
        setNewLead({
          company_name: '',
          contact_person: '',
          email: '',
          phone: '',
          source: 'website',
          status: 'new',
          estimated_value: 0,
          notes: '',
          assigned_to: '',
        });
        setTimeout(() => {
          setShowAddModal(false);
          setFormSuccess(null);
        }, 1000);
        fetchLeads();
      }
    } catch (err) {
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditLead = async () => {
    if (!selectedLead) return;
    const { error } = await supabase
      .from('leads')
      .update({
        company_name: selectedLead.company_name,
        contact_person: selectedLead.contact_person,
        email: selectedLead.email,
        phone: selectedLead.phone,
        source: selectedLead.source,
        status: selectedLead.status,
        estimated_value: selectedLead.estimated_value,
        notes: selectedLead.notes,
        assigned_to: selectedLead.assigned_to,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedLead.id);

    if (error) {
      console.error('Error updating lead:', error);
    } else {
      fetchLeads();
      setShowEditModal(false);
      setSelectedLead(null);
    }
  };

  const handleAddFollowUp = async () => {
    if (!selectedLead) return;
    const { error } = await supabase.from('follow_ups').insert([{
      ...newFollowUp,
      lead_id: selectedLead.id,
    }]);

    if (error) {
      console.error('Error adding follow-up:', error);
    } else {
      fetchFollowUps(selectedLead.id);
      setShowFollowUpModal(false);
      setNewFollowUp({ type: 'call', notes: '', scheduled_at: '' });
    }
  };

  const handleCompleteFollowUp = async (followUpId: string) => {
    const { error } = await supabase
      .from('follow_ups')
      .update({ completed: true })
      .eq('id', followUpId);

    if (error) {
      console.error('Error completing follow-up:', error);
    } else if (selectedLead) {
      fetchFollowUps(selectedLead.id);
    }
  };

  const handleUpdateStatus = async (leadId: string, status: LeadStatus) => {
    const { error } = await supabase.from('leads').update({ status }).eq('id', leadId);
    if (error) {
      console.error('Error updating status:', error);
    } else {
      fetchLeads();
    }
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete) return;
    const { error } = await supabase.from('leads').delete().eq('id', leadToDelete.id);
    if (error) {
      console.error('Error deleting lead:', error);
    } else {
      setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id));
      setLeadToDelete(null);
      setDeleteSuccess('Lead deleted successfully.');
      setTimeout(() => setDeleteSuccess(null), 3000);
    }
  };

  // Favorites
  const toggleFavorite = (leadId: string) => {
    setSettings(prev => {
      const isFav = prev.favoriteLeadIds.includes(leadId);
      return {
        ...prev,
        favoriteLeadIds: isFav
          ? prev.favoriteLeadIds.filter(id => id !== leadId)
          : [...prev.favoriteLeadIds, leadId],
      };
    });
  };

  const isFavorite = (leadId: string) => settings.favoriteLeadIds.includes(leadId);

  // Save Filter
  const handleSaveFilter = () => {
    if (!newFilterName.trim()) return;

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: newFilterName.trim(),
      search: searchQuery,
      status: statusFilter,
      source: sourceFilter,
      dateFrom: dateFromFilter,
      dateTo: dateToFilter,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    setSettings(prev => ({
      ...prev,
      savedFilters: [...prev.savedFilters, newFilter],
    }));

    setNewFilterName('');
    setShowSaveFilterModal(false);
    setExportToast('Filter saved successfully!');
    setTimeout(() => setExportToast(null), 3000);
  };

  const applySavedFilter = (filter: SavedFilter) => {
    setSearchQuery(filter.search);
    setStatusFilter(filter.status);
    setSourceFilter(filter.source);
    setDateFromFilter(filter.dateFrom);
    setDateToFilter(filter.dateTo);
    setShowFiltersPanel(false);
  };

  const deleteSavedFilter = (filterId: string) => {
    setSettings(prev => ({
      ...prev,
      savedFilters: prev.savedFilters.filter(f => f.id !== filterId),
    }));
  };

  const setDefaultFilter = (filterId: string) => {
    setSettings(prev => ({
      ...prev,
      savedFilters: prev.savedFilters.map(f => ({
        ...f,
        isDefault: f.id === filterId,
      })),
    }));
  };

  // Quick Actions
  const handleQuickAction = (action: string, lead: Lead) => {
    switch (action) {
      case 'call':
        window.open(`tel:${lead.phone}`);
        break;
      case 'whatsapp': {
        const phone = lead.phone?.replace(/\D/g, '');
        window.open(`https://wa.me/${phone}`, '_blank');
        break;
      }
      case 'email':
        window.open(`mailto:${lead.email}?subject=Follow up from Guardian Media Lab`);
        break;
      case 'followup':
        setSelectedLead(lead);
        setShowFollowUpModal(true);
        break;
      case 'convert':
        handleConvertToClient(lead);
        break;
      case 'invoice':
        navigate('/dashboard/invoices', { state: { leadId: lead.id, clientName: lead.company_name } });
        break;
    }
    setQuickActionLead(null);
  };

  const handleConvertToClient = async (lead: Lead) => {
    try {
      const clientData = {
        company_name: lead.company_name,
        contact_person: lead.contact_person,
        email: lead.email,
        phone: lead.phone || null,
        gst_number: null,
        address: null,
        status: 'active' as const,
        notes: lead.notes || null,
        user_id: profile?.id,
      };

      const { data: _data, error } = await supabase.from('clients').insert([clientData]).select();

      if (error) {
        setExportToast('Failed to convert lead to client');
      } else {
        // Update lead status to won
        await supabase.from('leads').update({ status: 'won' }).eq('id', lead.id);
        setExportToast('Lead converted to client successfully!');
        fetchLeads();
      }
    } catch (err) {
      setExportToast('Error converting lead to client');
    }
    setTimeout(() => setExportToast(null), 3000);
  };

  // Bulk Actions
  const handleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const handleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const handleBulkAssign = async () => {
    if (!bulkAssignTo || selectedLeads.size === 0) return;

    const { error } = await supabase
      .from('leads')
      .update({ assigned_to: bulkAssignTo })
      .in('id', Array.from(selectedLeads));

    if (error) {
      setExportToast('Failed to assign leads');
    } else {
      setExportToast(`Assigned ${selectedLeads.size} leads successfully!`);
      setSelectedLeads(new Set());
      setBulkAssignTo('');
      fetchLeads();
    }
    setTimeout(() => setExportToast(null), 3000);
  };

  const handleBulkStatusChange = async () => {
    if (!bulkStatus || selectedLeads.size === 0) return;

    const { error } = await supabase
      .from('leads')
      .update({ status: bulkStatus })
      .in('id', Array.from(selectedLeads));

    if (error) {
      setExportToast('Failed to update status');
    } else {
      setExportToast(`Updated ${selectedLeads.size} leads successfully!`);
      setSelectedLeads(new Set());
      setBulkStatus('');
      fetchLeads();
    }
    setTimeout(() => setExportToast(null), 3000);
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedLeads.size} leads?`)) return;

    const { error } = await supabase
      .from('leads')
      .delete()
      .in('id', Array.from(selectedLeads));

    if (error) {
      setExportToast('Failed to delete leads');
    } else {
      setExportToast(`Deleted ${selectedLeads.size} leads successfully!`);
      setSelectedLeads(new Set());
      fetchLeads();
    }
    setTimeout(() => setExportToast(null), 3000);
  };

  const handleBulkExport = () => {
    if (selectedLeads.size === 0) return;

    const selectedLeadsData = leads.filter(l => selectedLeads.has(l.id));
    exportLeads(selectedLeadsData);
  };

  const escapeCsvValue = (value: string | number | null | undefined): string => {
    const str = value == null ? '' : String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportLeads = (leadsToExport: Lead[]) => {
    if (leadsToExport.length === 0) {
      setExportToast('No data available to export.');
      setTimeout(() => setExportToast(null), 3000);
      return;
    }

    const headers = [
      'Company Name',
      'Contact Person',
      'Email',
      'Phone',
      'Source',
      'Status',
      'Estimated Value',
      'Notes',
      'Created Date',
    ];

    const rows = leadsToExport.map((l) => [
      escapeCsvValue(l.company_name),
      escapeCsvValue(l.contact_person),
      escapeCsvValue(l.email),
      escapeCsvValue(l.phone),
      escapeCsvValue(l.source),
      escapeCsvValue(l.status),
      escapeCsvValue(l.estimated_value),
      escapeCsvValue(l.notes),
      escapeCsvValue(new Date(l.created_at).toLocaleDateString('en-CA')),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportToast('Leads exported successfully.');
    setTimeout(() => setExportToast(null), 3000);
  };

  const handleExport = () => exportLeads(filteredLeads);

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSourceFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
  };

  // Pagination
  const indexOfLastLead = currentPage * leadsPerPage;
  const indexOfFirstLead = indexOfLastLead - leadsPerPage;
  const currentLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead);
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (sourceFilter !== 'all') count++;
    if (dateFromFilter) count++;
    if (dateToFilter) count++;
    if (searchQuery) count++;
    return count;
  }, [statusFilter, sourceFilter, dateFromFilter, dateToFilter, searchQuery]);

  return (
    <div className="space-y-4 md:space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-sora text-white">Lead Management</h1>
          <p className="text-sm text-gray-400">Manage and track your leads through the sales pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          {showBulkActions && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30">
              <span className="text-sm text-blue-400">{selectedLeads.size} selected</span>
              <button onClick={() => setSelectedLeads(new Set())} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search with Recent Searches */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowRecentSearches(true)}
            onBlur={() => setTimeout(() => setShowRecentSearches(false), 200)}
            placeholder="Search leads..."
            className="w-full pl-12 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {/* Recent Searches Dropdown */}
          {showRecentSearches && settings.recentSearches.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 glass-card rounded-xl overflow-hidden z-50">
              <div className="p-2 text-xs text-gray-500 border-b border-white/10 flex items-center gap-2">
                <History className="w-3 h-3" />
                Recent Searches
              </div>
              {settings.recentSearches.slice(0, 5).map((search, idx) => (
                <button
                  key={idx}
                  onMouseDown={() => setSearchQuery(search)}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                >
                  <Clock className="w-3 h-3 text-gray-500" />
                  {search}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Saved Filters */}
          {settings.savedFilters.length > 0 && (
            <div className="relative">
              <select
                onChange={(e) => {
                  const filter = settings.savedFilters.find(f => f.id === e.target.value);
                  if (filter) applySavedFilter(filter);
                }}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white pr-10"
                defaultValue=""
              >
                <option value="" className="bg-gray-900" disabled>Saved Filters</option>
                {settings.savedFilters.map((filter) => (
                  <option key={filter.id} value={filter.id} className="bg-gray-900">
                    {filter.name} {filter.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white min-w-[120px]"
          >
            <option value="all" className="bg-gray-900">All Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status} className="bg-gray-900">
                {LEAD_STATUS_LABELS[status]}
              </option>
            ))}
          </select>

          {/* More Filters Toggle */}
          <button
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`btn-secondary flex items-center gap-2 ${showFiltersPanel ? 'bg-blue-600/20 border-blue-500/50' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <button onClick={handleExport} className="btn-secondary flex items-center justify-center gap-2 px-4">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFiltersPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Source</label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                >
                  <option value="all" className="bg-gray-900">All Sources</option>
                  {uniqueSources.map((source) => (
                    <option key={source} value={source} className="bg-gray-900">{source}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={() => setShowSaveFilterModal(true)}
                  className="flex-1 btn-secondary text-sm flex items-center justify-center gap-1"
                >
                  <Save className="w-3 h-3" />
                  Save Filter
                </button>
                <button
                  onClick={clearAllFilters}
                  className="flex-1 btn-secondary text-sm"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Saved Filters List */}
            {settings.savedFilters.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-gray-400 mb-2">Saved Filters</p>
                <div className="flex flex-wrap gap-2">
                  {settings.savedFilters.map((filter) => (
                    <div
                      key={filter.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
                    >
                      <button
                        onClick={() => applySavedFilter(filter)}
                        className="text-sm text-gray-300 hover:text-white"
                      >
                        {filter.name}
                      </button>
                      {filter.isDefault && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                      <button
                        onClick={() => setDefaultFilter(filter.id)}
                        className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-yellow-400"
                        title="Set as default"
                      >
                        <Bookmark className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteSavedFilter(filter.id)}
                        className="p-1 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400"
                        title="Delete filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {showBulkActions && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-3 flex items-center gap-3 flex-wrap"
          >
            <span className="text-sm text-gray-400">
              <CheckSquare className="w-4 h-4 inline mr-1" />
              {selectedLeads.size} leads selected
            </span>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <select
                value={bulkAssignTo}
                onChange={(e) => setBulkAssignTo(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
              >
                <option value="" className="bg-gray-900">Assign to...</option>
                {team.map((member) => (
                  <option key={member.user_id} value={member.user_id} className="bg-gray-900">
                    {member.full_name}
                  </option>
                ))}
              </select>
              {bulkAssignTo && (
                <button onClick={handleBulkAssign} className="btn-primary text-sm py-1.5">
                  Assign
                </button>
              )}
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as LeadStatus)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
              >
                <option value="" className="bg-gray-900">Change status...</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status} className="bg-gray-900">
                    {LEAD_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              {bulkStatus && (
                <button onClick={handleBulkStatusChange} className="btn-primary text-sm py-1.5">
                  Update
                </button>
              )}
              <button onClick={handleBulkExport} className="btn-secondary text-sm py-1.5 flex items-center gap-1">
                <Download className="w-3 h-3" />
                Export
              </button>
              <button onClick={handleBulkDelete} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leads Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[700px] px-4 sm:px-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 w-10">
                    <button
                      onClick={handleSelectAll}
                      className="p-1 rounded hover:bg-white/10"
                    >
                      {selectedLeads.size === filteredLeads.length && filteredLeads.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-400">Company</th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-400">Contact</th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-400">Status</th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-400 hidden sm:table-cell">Value</th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-400 hidden md:table-cell">Created</th>
                  <th className="text-right px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 sm:px-6 py-12 text-center text-gray-400">
                      Loading leads...
                    </td>
                  </tr>
                ) : currentLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 sm:px-6 py-12 text-center text-gray-400">
                      No leads found. Add your first lead!
                    </td>
                  </tr>
                ) : (
                  currentLeads.map((lead) => {
                    const isFav = isFavorite(lead.id);
                    const isSelected = selectedLeads.has(lead.id);

                    return (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`border-b border-white/5 hover:bg-white/5 transition-colors ${isSelected ? 'bg-blue-500/10' : ''}`}
                      >
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <button
                            onClick={() => handleSelectLead(lead.id)}
                            className="p-1 rounded hover:bg-white/10"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-400" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <p className="font-medium text-white text-sm sm:text-base truncate">{lead.company_name}</p>
                                <button
                                  onClick={() => toggleFavorite(lead.id)}
                                  className="p-0.5 hover:scale-110 transition-transform"
                                >
                                  <Star className={`w-3 h-3 ${isFav ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                                </button>
                              </div>
                              <p className="text-xs text-gray-500">{lead.source}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div>
                            <p className="font-medium text-white text-sm sm:text-base">{lead.contact_person}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[100px] sm:max-w-none">{lead.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <select
                            value={lead.status}
                            onChange={(e) => handleUpdateStatus(lead.id, e.target.value as LeadStatus)}
                            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium border-0 cursor-pointer ${LEAD_STATUS_COLORS[lead.status]} text-white`}
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status} className="bg-gray-900">
                                {LEAD_STATUS_LABELS[status]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                          <p className="font-medium text-white">${lead.estimated_value.toLocaleString()}</p>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                          <p className="text-sm text-gray-400">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            {/* Quick Actions Button */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuickActionLead(quickActionLead?.id === lead.id ? null : lead);
                                }}
                                className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              {/* Quick Actions Dropdown */}
                              <AnimatePresence>
                                {quickActionLead?.id === lead.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-1 w-48 glass-card rounded-xl overflow-hidden z-50"
                                  >
                                    <div className="p-1">
                                      <button
                                        onClick={() => handleQuickAction('call', lead)}
                                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 rounded-lg flex items-center gap-2"
                                      >
                                        <Phone className="w-4 h-4 text-green-400" />
                                        Call Client
                                      </button>
                                      <button
                                        onClick={() => handleQuickAction('whatsapp', lead)}
                                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 rounded-lg flex items-center gap-2"
                                      >
                                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                                        WhatsApp Client
                                      </button>
                                      <button
                                        onClick={() => handleQuickAction('email', lead)}
                                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 rounded-lg flex items-center gap-2"
                                      >
                                        <Mail className="w-4 h-4 text-blue-400" />
                                        Send Email
                                      </button>
                                      <button
                                        onClick={() => handleQuickAction('followup', lead)}
                                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 rounded-lg flex items-center gap-2"
                                      >
                                        <Calendar className="w-4 h-4 text-purple-400" />
                                        Create Follow-up
                                      </button>
                                      <div className="h-px bg-white/10 my-1" />
                                      <button
                                        onClick={() => handleQuickAction('convert', lead)}
                                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 rounded-lg flex items-center gap-2"
                                      >
                                        <Users className="w-4 h-4 text-cyan-400" />
                                        Convert to Client
                                      </button>
                                      <button
                                        onClick={() => handleQuickAction('invoice', lead)}
                                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 rounded-lg flex items-center gap-2"
                                      >
                                        <FileText className="w-4 h-4 text-orange-400" />
                                        Generate Invoice
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setShowLeadDetails(true);
                              }}
                              className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setShowEditModal(true);
                              }}
                              className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setLeadToDelete(lead)}
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
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing {indexOfFirstLead + 1} to {Math.min(indexOfLastLead, filteredLeads.length)} of {filteredLeads.length} leads
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg bg-white/5 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg ${
                      currentPage === page ? 'bg-blue-600 text-white' : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg bg-white/5 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Favorites Sidebar Widget */}
      {settings.favoriteLeadIds.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              Favorite Leads ({settings.favoriteLeadIds.length})
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {leads.filter(l => settings.favoriteLeadIds.includes(l.id)).slice(0, 5).map((lead) => (
              <button
                key={lead.id}
                onClick={() => {
                  setSelectedLead(lead);
                  setShowLeadDetails(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2"
              >
                <Building2 className="w-3 h-3" />
                {lead.company_name}
              </button>
            ))}
            {settings.favoriteLeadIds.length > 5 && (
              <span className="px-3 py-1.5 text-xs text-gray-500">
                +{settings.favoriteLeadIds.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Save Filter Modal */}
      <AnimatePresence>
        {showSaveFilterModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSaveFilterModal(false)}
          >
            <motion.div
              className="glass-card p-6 max-w-md w-full"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Save className="w-5 h-5" />
                  Save Filter
                </h3>
                <button onClick={() => setShowSaveFilterModal(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Filter Name</label>
                <input
                  type="text"
                  value={newFilterName}
                  onChange={(e) => setNewFilterName(e.target.value)}
                  placeholder="e.g., New leads this month"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-white/5 mb-4">
                <p className="text-xs text-gray-400 mb-2">Current filters:</p>
                <div className="flex flex-wrap gap-1">
                  {statusFilter !== 'all' && (
                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs">
                      Status: {LEAD_STATUS_LABELS[statusFilter]}
                    </span>
                  )}
                  {sourceFilter !== 'all' && (
                    <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs">
                      Source: {sourceFilter}
                    </span>
                  )}
                  {dateFromFilter && (
                    <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs">
                      From: {dateFromFilter}
                    </span>
                  )}
                  {dateToFilter && (
                    <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-400 text-xs">
                      To: {dateToFilter}
                    </span>
                  )}
                  {searchQuery && (
                    <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 text-xs">
                      Search: {searchQuery}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowSaveFilterModal(false)} className="flex-1 btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={handleSaveFilter}
                  disabled={!newFilterName.trim()}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  Save Filter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Lead Modal */}
      <AnimatePresence>
        {showEditModal && selectedLead && (
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
                <h3 className="text-xl font-semibold text-white">Edit Lead</h3>
                <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company Name *</label>
                  <input
                    type="text"
                    value={selectedLead.company_name}
                    onChange={(e) => setSelectedLead({ ...selectedLead, company_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Contact Person *</label>
                  <input
                    type="text"
                    value={selectedLead.contact_person}
                    onChange={(e) => setSelectedLead({ ...selectedLead, contact_person: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                    <input
                      type="email"
                      value={selectedLead.email}
                      onChange={(e) => setSelectedLead({ ...selectedLead, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={selectedLead.phone || ''}
                      onChange={(e) => setSelectedLead({ ...selectedLead, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Source</label>
                    <select
                      value={selectedLead.source}
                      onChange={(e) => setSelectedLead({ ...selectedLead, source: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="website" className="bg-gray-900">Website</option>
                      <option value="referral" className="bg-gray-900">Referral</option>
                      <option value="social" className="bg-gray-900">Social Media</option>
                      <option value="ads" className="bg-gray-900">Paid Ads</option>
                      <option value="other" className="bg-gray-900">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={selectedLead.status}
                      onChange={(e) => setSelectedLead({ ...selectedLead, status: e.target.value as LeadStatus })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status} className="bg-gray-900">
                          {LEAD_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Estimated Value</label>
                    <input
                      type="number"
                      value={selectedLead.estimated_value}
                      onChange={(e) => setSelectedLead({ ...selectedLead, estimated_value: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Assign To</label>
                    <select
                      value={selectedLead.assigned_to || ''}
                      onChange={(e) => setSelectedLead({ ...selectedLead, assigned_to: e.target.value })}
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                  <textarea
                    value={selectedLead.notes || ''}
                    onChange={(e) => setSelectedLead({ ...selectedLead, notes: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
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
                    onClick={handleEditLead}
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

      {/* Follow-up Modal */}
      <AnimatePresence>
        {showFollowUpModal && selectedLead && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFollowUpModal(false)}
          >
            <motion.div
              className="glass-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Schedule Follow-up</h3>
                <button onClick={() => setShowFollowUpModal(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <select
                    value={newFollowUp.type}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, type: e.target.value as FollowUp['type'] })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="call" className="bg-gray-900">Call</option>
                    <option value="email" className="bg-gray-900">Email</option>
                    <option value="meeting" className="bg-gray-900">Meeting</option>
                    <option value="other" className="bg-gray-900">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    value={newFollowUp.scheduled_at}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, scheduled_at: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                  <textarea
                    value={newFollowUp.notes}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, notes: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder="Follow-up notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowFollowUpModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddFollowUp}
                    className="flex-1 btn-primary"
                  >
                    Schedule Follow-up
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Lead Modal */}
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
                <h3 className="text-xl font-semibold text-white">Add New Lead</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {formSuccess && (
                <div className="mb-4 p-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm">
                  {formSuccess}
                </div>
              )}

              {formError && (
                <div className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                  {formError}
                </div>
              )}

              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company Name *</label>
                  <input
                    type="text"
                    value={newLead.company_name}
                    onChange={(e) => setNewLead({ ...newLead, company_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Company Inc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Contact Person *</label>
                  <input
                    type="text"
                    value={newLead.contact_person}
                    onChange={(e) => setNewLead({ ...newLead, contact_person: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    placeholder="John Doe"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                    <input
                      type="email"
                      value={newLead.email}
                      onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      placeholder="john@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={newLead.phone}
                      onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      placeholder="+1 234 567 890"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Source</label>
                    <select
                      value={newLead.source}
                      onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="website" className="bg-gray-900">Website</option>
                      <option value="referral" className="bg-gray-900">Referral</option>
                      <option value="social" className="bg-gray-900">Social Media</option>
                      <option value="ads" className="bg-gray-900">Paid Ads</option>
                      <option value="other" className="bg-gray-900">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={newLead.status}
                      onChange={(e) => setNewLead({ ...newLead, status: e.target.value as LeadStatus })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status} className="bg-gray-900">
                          {LEAD_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Estimated Value</label>
                  <input
                    type="number"
                    value={newLead.estimated_value}
                    onChange={(e) => setNewLead({ ...newLead, estimated_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                  <textarea
                    value={newLead.notes}
                    onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setFormError(null);
                      setFormSuccess(null);
                    }}
                    className="flex-1 btn-secondary"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleAddLead}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Lead'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lead Details Modal */}
      <AnimatePresence>
        {showLeadDetails && selectedLead && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLeadDetails(false)}
          >
            <motion.div
              className="glass-card p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold text-white">Lead Details</h3>
                  <button
                    onClick={() => toggleFavorite(selectedLead.id)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star className={`w-5 h-5 ${isFavorite(selectedLead.id) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`} />
                  </button>
                </div>
                <button onClick={() => setShowLeadDetails(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Company</p>
                    <p className="font-medium text-white text-lg">{selectedLead.company_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Contact Person</p>
                    <p className="text-white">{selectedLead.contact_person}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Email</p>
                      <a href={`mailto:${selectedLead.email}`} className="text-blue-400 hover:underline">
                        {selectedLead.email}
                      </a>
                    </div>
                  </div>
                  {selectedLead.phone && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Phone</p>
                      <a href={`tel:${selectedLead.phone}`} className="text-blue-400 hover:underline">
                        {selectedLead.phone}
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${LEAD_STATUS_COLORS[selectedLead.status]} text-white`}>
                      {LEAD_STATUS_LABELS[selectedLead.status]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Estimated Value</p>
                    <p className="text-2xl font-bold text-white">${selectedLead.estimated_value.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Source</p>
                    <p className="text-white capitalize">{selectedLead.source}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Created</p>
                    <p className="text-white">{new Date(selectedLead.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {selectedLead.notes && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-sm text-gray-400 mb-2">Notes</p>
                  <p className="text-white">{selectedLead.notes}</p>
                </div>
              )}

              {/* Follow-ups */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Follow-ups
                  </h4>
                  <button
                    onClick={() => {
                      fetchFollowUps(selectedLead.id);
                      setShowFollowUpModal(true);
                    }}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    + Add Follow-up
                  </button>
                </div>
                {followUps.length === 0 ? (
                  <p className="text-gray-400 text-sm">No follow-ups scheduled. Click "Add Follow-up" to create one.</p>
                ) : (
                  <div className="space-y-3">
                    {followUps.map((followUp) => (
                      <div
                        key={followUp.id}
                        className={`p-4 rounded-xl ${followUp.completed ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/5 border border-white/10'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${followUp.completed ? 'bg-green-500' : 'bg-blue-500'}`}>
                              {followUp.type === 'call' && <Phone className="w-4 h-4 text-white" />}
                              {followUp.type === 'email' && <Mail className="w-4 h-4 text-white" />}
                              {followUp.type === 'meeting' && <Calendar className="w-4 h-4 text-white" />}
                              {followUp.type === 'other' && <FileText className="w-4 h-4 text-white" />}
                            </div>
                            <div>
                              <p className="font-medium text-white capitalize">{followUp.type}</p>
                              {followUp.scheduled_at && (
                                <p className="text-xs text-gray-400">
                                  {new Date(followUp.scheduled_at).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                          {!followUp.completed && (
                            <button
                              onClick={() => handleCompleteFollowUp(followUp.id)}
                              className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30"
                            >
                              Mark Complete
                            </button>
                          )}
                        </div>
                        {followUp.notes && (
                          <p className="mt-2 text-sm text-gray-400">{followUp.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/10">
                <a
                  href={`tel:${selectedLead.phone}`}
                  className="flex-1 btn-secondary flex items-center justify-center gap-2 min-w-[100px]"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </a>
                <button
                  onClick={() => {
                    const phone = selectedLead.phone?.replace(/\D/g, '');
                    window.open(`https://wa.me/${phone}`, '_blank');
                  }}
                  className="flex-1 btn-secondary flex items-center justify-center gap-2 min-w-[100px]"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </button>
                <a
                  href={`mailto:${selectedLead.email}`}
                  className="flex-1 btn-secondary flex items-center justify-center gap-2 min-w-[100px]"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </a>
                <button
                  onClick={() => setShowFollowUpModal(true)}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 min-w-[100px]"
                >
                  <FileText className="w-4 h-4" />
                  Follow-up
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <AnimatePresence>
        {exportToast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium shadow-lg"
          >
            {exportToast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-green-500 text-white text-sm font-medium shadow-lg"
          >
            {deleteSuccess}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {leadToDelete && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLeadToDelete(null)}
          >
            <motion.div
              className="glass-card p-6 max-w-md w-full"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Lead</h3>
                  <p className="text-sm text-gray-400">{leadToDelete.company_name}</p>
                </div>
              </div>

              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this lead? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setLeadToDelete(null)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteLead}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close quick actions */}
      {quickActionLead && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setQuickActionLead(null)}
        />
      )}
    </div>
  );
}
