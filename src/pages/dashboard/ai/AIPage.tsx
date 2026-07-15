import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Sparkles,
  BookOpen,
  FileText,
  History,
  Settings,
  Search,
  Plus,
  Star,
  Edit,
  Trash2,
  Copy,
  X,
  Save,
  Zap,
  TrendingUp,
  Clock,
  Hash,
  Mail,
  MessageSquare,
  Target,
  Globe,
  PenTool,
  FileCheck,
  Briefcase,
  Receipt,
  Send,
  Loader2,
} from 'lucide-react';
import { aiService } from '../../../services/api';
import {
  AIPrompt,
  AITemplate,
  AIHistory,
  AISettings,
  AIPromptCategory,
  AITemplateType,
  AIProvider,
  AI_PROMPT_CATEGORY_COLORS,
  AI_PROMPT_CATEGORY_LABELS,
  AI_TEMPLATE_TYPE_COLORS,
  AI_TEMPLATE_TYPE_LABELS,
} from '../../../types';

type TabType = 'dashboard' | 'prompts' | 'templates' | 'history' | 'settings';

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Bot },
  { id: 'prompts', label: 'Prompt Library', icon: BookOpen },
  { id: 'templates', label: 'AI Templates', icon: FileText },
  { id: 'history', label: 'AI History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const promptCategories: { id: AIPromptCategory; label: string; icon: React.ElementType }[] = [
  { id: 'marketing', label: 'Marketing', icon: TrendingUp },
  { id: 'sales', label: 'Sales', icon: Target },
  { id: 'gst', label: 'GST', icon: FileCheck },
  { id: 'income_tax', label: 'Income Tax', icon: Receipt },
  { id: 'legal', label: 'Legal', icon: Briefcase },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'social_media', label: 'Social Media', icon: Globe },
  { id: 'general', label: 'General', icon: Sparkles },
];

const templateTypes: { id: AITemplateType; label: string; icon: React.ElementType }[] = [
  { id: 'social_post', label: 'Social Post', icon: Hash },
  { id: 'facebook_ad', label: 'Facebook Ad', icon: Target },
  { id: 'google_ad', label: 'Google Ad', icon: Search },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { id: 'sales_proposal', label: 'Sales Proposal', icon: Briefcase },
  { id: 'gst_reply', label: 'GST Reply', icon: FileCheck },
  { id: 'legal_notice', label: 'Legal Notice', icon: PenTool },
  { id: 'blog', label: 'Blog', icon: FileText },
  { id: 'invoice_description', label: 'Invoice Description', icon: Receipt },
];

export default function AIPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Prompts state
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [selectedPromptCategory, setSelectedPromptCategory] = useState<AIPromptCategory | 'all'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [promptModal, setPromptModal] = useState<{ open: boolean; prompt?: AIPrompt }>({ open: false });

  // Templates state
  const [templates, setTemplates] = useState<AITemplate[]>([]);
  const [selectedTemplateType, setSelectedTemplateType] = useState<AITemplateType | 'all'>('all');
  const [templateModal, setTemplateModal] = useState<{ open: boolean; template?: AITemplate }>({ open: false });

  // History state
  const [history, setHistory] = useState<AIHistory[]>([]);
  const [selectedHistoryCategory, setSelectedHistoryCategory] = useState<AIPromptCategory | 'all'>('all');

  // Settings state
  const [settings, setSettings] = useState<AISettings | null>(null);

  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    totalPrompts: 0,
    favoritePrompts: 0,
    totalGenerations: 0,
    templatesUsed: 0,
  });

  useEffect(() => {
    if (activeTab === 'prompts') loadPrompts();
    if (activeTab === 'templates') loadTemplates();
    if (activeTab === 'history') loadHistory();
    if (activeTab === 'settings') loadSettings();
    if (activeTab === 'dashboard') loadDashboardData();
  }, [activeTab, selectedPromptCategory, selectedTemplateType, selectedHistoryCategory, showFavoritesOnly, searchQuery]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [promptsData, templatesData, historyData] = await Promise.all([
        aiService.prompts.getAll(1, 100),
        aiService.templates.getAll(),
        aiService.history.getAll(1, 100),
      ]);
      setPrompts(promptsData.data);
      setTemplates(templatesData);
      setHistory(historyData.data);
      setDashboardStats({
        totalPrompts: promptsData.data.length,
        favoritePrompts: promptsData.data.filter(p => p.is_favorite).length,
        totalGenerations: historyData.data.length,
        templatesUsed: templatesData.length,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const category = selectedPromptCategory === 'all' ? undefined : selectedPromptCategory;
      const data = await aiService.prompts.getAll(1, 50, category, searchQuery, showFavoritesOnly);
      setPrompts(data.data);
    } catch (error) {
      console.error('Error loading prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const type = selectedTemplateType === 'all' ? undefined : selectedTemplateType;
      const data = await aiService.templates.getAll(type);
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const category = selectedHistoryCategory === 'all' ? undefined : selectedHistoryCategory;
      const data = await aiService.history.getAll(1, 50, category, searchQuery);
      setHistory(data.data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await aiService.settings.get();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrompt = async (promptData: Partial<AIPrompt>) => {
    try {
      if (promptModal.prompt?.id) {
        await aiService.prompts.update(promptModal.prompt.id, promptData);
      } else {
        await aiService.prompts.create(promptData as Omit<AIPrompt, 'id' | 'user_id' | 'created_at' | 'updated_at'>);
      }
      setPromptModal({ open: false });
      loadPrompts();
    } catch (error) {
      console.error('Error saving prompt:', error);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    try {
      await aiService.prompts.delete(id);
      loadPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
    }
  };

  const handleToggleFavorite = async (id: string, _current: boolean) => {
    try {
      await aiService.prompts.toggleFavorite(id);
      loadPrompts();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleSaveTemplate = async (templateData: Partial<AITemplate>) => {
    try {
      if (templateModal.template?.id) {
        await aiService.templates.update(templateModal.template.id, templateData);
      } else {
        await aiService.templates.create(templateData as Omit<AITemplate, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_system'>);
      }
      setTemplateModal({ open: false });
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await aiService.templates.delete(id);
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this history item?')) return;
    try {
      await aiService.history.delete(id);
      loadHistory();
    } catch (error) {
      console.error('Error deleting history:', error);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all history? This cannot be undone.')) return;
    try {
      await aiService.history.clearAll();
      loadHistory();
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const handleSaveSettings = async (settingsData: Partial<AISettings>) => {
    try {
      await aiService.settings.update(settingsData);
      loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-full">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Assistant</h1>
          <p className="page-description">Generate content, manage prompts, and automate your workflow</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Saved Prompts', value: dashboardStats.totalPrompts, icon: BookOpen, color: 'from-blue-500 to-blue-600' },
                { label: 'Favorites', value: dashboardStats.favoritePrompts, icon: Star, color: 'from-yellow-500 to-orange-500' },
                { label: 'Generations', value: dashboardStats.totalGenerations, icon: Sparkles, color: 'from-purple-500 to-pink-500' },
                { label: 'Templates Used', value: dashboardStats.templatesUsed, icon: FileText, color: 'from-emerald-500 to-teal-500' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{stat.label}</p>
                      <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {promptCategories.slice(0, 8).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveTab('prompts');
                      setSelectedPromptCategory(cat.id);
                    }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                  >
                    <cat.icon className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-gray-300">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Prompts */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Recent Prompts
                </h3>
                <button
                  onClick={() => setActiveTab('prompts')}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  View All
                </button>
              </div>
              {prompts.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No prompts yet</p>
                  <button
                    onClick={() => {
                      setActiveTab('prompts');
                      setPromptModal({ open: true });
                    }}
                    className="mt-3 text-purple-400 hover:text-purple-300 text-sm"
                  >
                    Create your first prompt
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {prompts.slice(0, 5).map((prompt) => (
                    <div
                      key={prompt.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${AI_PROMPT_CATEGORY_COLORS[prompt.category]}`} />
                        <div>
                          <p className="text-sm font-medium text-white">{prompt.title}</p>
                          <p className="text-xs text-gray-500">{AI_PROMPT_CATEGORY_LABELS[prompt.category]}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {prompt.is_favorite && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                        <span className="text-xs text-gray-500">{formatDate(prompt.updated_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Generations */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-400" />
                  Recent Generations
                </h3>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  View All
                </button>
              </div>
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No generations yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <p className="text-sm text-gray-300 line-clamp-2">{item.input_text}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">{formatDate(item.created_at)}</span>
                        {item.tokens_used && (
                          <span className="text-xs text-purple-400">{item.tokens_used} tokens</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Prompt Library Tab */}
        {activeTab === 'prompts' && (
          <motion.div
            key="prompts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search prompts..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedPromptCategory}
                  onChange={(e) => setSelectedPromptCategory(e.target.value as AIPromptCategory | 'all')}
                  className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 focus:outline-none focus:border-purple-500"
                >
                  <option value="all">All Categories</option>
                  {promptCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`p-2.5 rounded-lg border transition-all ${
                    showFavoritesOnly
                      ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <Star className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPromptModal({ open: true })}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-500 hover:to-blue-500 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  New Prompt
                </button>
              </div>
            </div>

            {/* Prompts Grid */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : prompts.length === 0 ? (
              <div className="text-center py-16 glass-card">
                <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No prompts found</h3>
                <p className="text-gray-400 mb-4">Create your first prompt to get started</p>
                <button
                  onClick={() => setPromptModal({ open: true })}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Prompt
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prompts.map((prompt, index) => (
                  <motion.div
                    key={prompt.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-5 hover:border-purple-500/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${AI_PROMPT_CATEGORY_COLORS[prompt.category]}`} />
                        <span className="text-xs text-gray-400">{AI_PROMPT_CATEGORY_LABELS[prompt.category]}</span>
                      </div>
                      <button
                        onClick={() => handleToggleFavorite(prompt.id, prompt.is_favorite)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Star className={`w-4 h-4 ${prompt.is_favorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`} />
                      </button>
                    </div>
                    <h4 className="text-white font-medium mb-2 line-clamp-1">{prompt.title}</h4>
                    <p className="text-sm text-gray-400 line-clamp-3 mb-4">{prompt.content}</p>
                    {prompt.tags && prompt.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {prompt.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-400">{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <span className="text-xs text-gray-500">{formatDate(prompt.updated_at)}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPromptModal({ open: true, prompt })}
                          className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePrompt(prompt.id)}
                          className="p-1.5 rounded bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => navigator.clipboard.writeText(prompt.content)}
                          className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="flex items-center gap-3">
              <select
                value={selectedTemplateType}
                onChange={(e) => setSelectedTemplateType(e.target.value as AITemplateType | 'all')}
                className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Types</option>
                {templateTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
              <button
                onClick={() => setTemplateModal({ open: true })}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-500 hover:to-blue-500 transition-all"
              >
                <Plus className="w-4 h-4" />
                New Template
              </button>
            </div>

            {/* Templates Grid */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-16 glass-card">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No templates found</h3>
                <p className="text-gray-400">Create your first template to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`glass-card p-5 ${template.is_system ? 'border-purple-500/30' : ''} group`}
                  >
                    {template.is_system && (
                      <div className="flex items-center gap-1 text-xs text-purple-400 mb-2">
                        <Sparkles className="w-3 h-3" />
                        System Template
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${AI_TEMPLATE_TYPE_COLORS[template.template_type]}`} />
                      <span className="text-xs text-gray-400">{AI_TEMPLATE_TYPE_LABELS[template.template_type]}</span>
                    </div>
                    <h4 className="text-white font-medium mb-2">{template.name}</h4>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">{template.description || template.content}</p>
                    {template.variables && template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {template.variables.map((v, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">{`{{${v}}}`}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-end pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTemplateModal({ open: true, template })}
                          className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {!template.is_system && (
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-1.5 rounded bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => navigator.clipboard.writeText(template.content)}
                          className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search history..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <select
                value={selectedHistoryCategory}
                onChange={(e) => setSelectedHistoryCategory(e.target.value as AIPromptCategory | 'all')}
                className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Categories</option>
                {promptCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>

            {/* History List */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-16 glass-card">
                <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No history found</h3>
                <p className="text-gray-400">Your AI generations will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {item.category && (
                          <>
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${AI_PROMPT_CATEGORY_COLORS[item.category as AIPromptCategory]}`} />
                            <span className="text-xs text-gray-400">{AI_PROMPT_CATEGORY_LABELS[item.category as AIPromptCategory]}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {item.tokens_used && (
                          <span className="text-xs text-purple-400">{item.tokens_used} tokens</span>
                        )}
                        <span className="text-xs text-gray-500">{formatDate(item.created_at)}</span>
                        <button
                          onClick={() => handleDeleteHistory(item.id)}
                          className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Send className="w-3 h-3" />
                          Input
                        </p>
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <p className="text-sm text-gray-300">{item.input_text}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Output
                        </p>
                        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                          <p className="text-sm text-gray-300">{item.output_text}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end mt-3 gap-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(item.output_text)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-400 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Output
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : settings && (
              <div className="max-w-2xl mx-auto">
                <SettingsForm settings={settings} onSave={handleSaveSettings} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt Modal */}
      <PromptModal
        isOpen={promptModal.open}
        prompt={promptModal.prompt}
        onClose={() => setPromptModal({ open: false })}
        onSave={handleSavePrompt}
      />

      {/* Template Modal */}
      <TemplateModal
        isOpen={templateModal.open}
        template={templateModal.template}
        onClose={() => setTemplateModal({ open: false })}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}

// Settings Form Component
function SettingsForm({ settings, onSave }: { settings: AISettings; onSave: (data: Partial<AISettings>) => void }) {
  const [formData, setFormData] = useState<AISettings>(settings);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
        <Settings className="w-5 h-5 text-purple-400" />
        AI Settings
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Default AI Provider</label>
        <select
          value={formData.default_provider}
          onChange={(e) => setFormData({ ...formData, default_provider: e.target.value as AIProvider })}
          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
        >
          <option value="placeholder">Not Connected (Placeholder)</option>
          <option value="openai">OpenAI (GPT-4)</option>
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="google">Google (Gemini)</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">External AI providers not connected yet. Configure in backend.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Temperature: {formData.temperature}</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={formData.temperature}
            onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
            className="w-full accent-purple-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Precise</span>
            <span>Creative</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Max Tokens</label>
          <input
            type="number"
            min="100"
            max="4000"
            value={formData.max_tokens}
            onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
          <select
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="en-hi">Hinglish</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Auto Save History</label>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, auto_save_history: !formData.auto_save_history })}
            className={`w-full px-4 py-3 rounded-lg border transition-colors ${
              formData.auto_save_history
                ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                : 'bg-white/5 border-white/10 text-gray-400'
            }`}
          >
            {formData.auto_save_history ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Settings
      </button>
    </form>
  );
}

// Prompt Modal Component
function PromptModal({
  isOpen,
  prompt,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  prompt?: AIPrompt;
  onClose: () => void;
  onSave: (data: Partial<AIPrompt>) => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general' as AIPromptCategory,
    tags: [] as string[],
    variables: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prompt) {
      setFormData({
        title: prompt.title,
        content: prompt.content,
        category: prompt.category,
        tags: prompt.tags || [],
        variables: prompt.variables || [],
      });
    } else {
      setFormData({ title: '', content: '', category: 'general', tags: [], variables: [] });
    }
  }, [prompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
    onClose();
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg mx-4 glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {prompt ? 'Edit Prompt' : 'New Prompt'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as AIPromptCategory })}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
            >
              {promptCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                placeholder="Add tag..."
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20"
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300">
                    {tag}
                    <button type="button" onClick={() => setFormData({ ...formData, tags: formData.tags.filter((_, idx) => idx !== i) })}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {prompt ? 'Update Prompt' : 'Create Prompt'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// Template Modal Component
function TemplateModal({
  isOpen,
  template,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  template?: AITemplate;
  onClose: () => void;
  onSave: (data: Partial<AITemplate>) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    template_type: 'social_post' as AITemplateType,
    content: '',
    description: '',
    variables: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        template_type: template.template_type,
        content: template.content,
        description: template.description || '',
        variables: template.variables || [],
      });
    } else {
      setFormData({ name: '', template_type: 'social_post', content: '', description: '', variables: [] });
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg mx-4 glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {template ? 'Edit Template' : 'New Template'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Template Type</label>
            <select
              value={formData.template_type}
              onChange={(e) => setFormData({ ...formData, template_type: e.target.value as AITemplateType })}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
            >
              {templateTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Template Content</label>
            <p className="text-xs text-gray-500 mb-1">Use {'{{variable}}'} for dynamic placeholders</p>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500 resize-none font-mono"
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {template ? 'Update Template' : 'Create Template'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
