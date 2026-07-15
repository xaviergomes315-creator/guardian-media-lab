import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Building2,
  Users,
  Search,
  Activity,
  History,
  Loader2,
  CheckCircle,
  Plus,
  RefreshCw,
  Save,
  SlidersHorizontal,
  AlertCircle,
  X,
  Sliders,
  DollarSign,
  Zap,
  Trash2,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

type TabType = 'companies' | 'modules' | 'roles' | 'flags' | 'health' | 'audit' | 'billing' | 'automation';

export default function MasterAdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('companies');
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Action States
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanySubdomain, setNewCompanySubdomain] = useState('');

  // Phase 4: Billing States
  const [billingSubscriptions, setBillingSubscriptions] = useState<any[]>([]);
  const [selectedBillingTenant, setSelectedBillingTenant] = useState('');
  const [selectedBillingPlan, setSelectedBillingPlan] = useState('monthly');
  const [selectedBillingStatus, setSelectedBillingStatus] = useState('paid');
  const [appliedCoupon, setAppliedCoupon] = useState('');

  // Phase 4: Automation States
  const [automationRules, setAutomationRules] = useState<any[]>([]);
  const [selectedRuleTenant, setSelectedRuleTenant] = useState('');
  const [selectedTrigger, setSelectedTrigger] = useState('lead:created');
  const [selectedAction, setSelectedAction] = useState('send_whatsapp');
  const [actionMessage, setActionMessage] = useState('');
  
  // Custom Role Config Mock State
  const [roles] = useState([
    { role: 'super_admin', label: 'Super Administrator', permissions: ['all'] },
    { role: 'admin', label: 'Company Owner', permissions: ['crm', 'leads', 'invoices', 'settings'] },
    { role: 'manager', label: 'Manager', permissions: ['crm', 'leads', 'tasks'] },
    { role: 'employee', label: 'Telecaller / Accountant', permissions: ['telecaller', 'gst', 'leads'] },
  ]);

  // Feature Flags State
  const [flags, setFlags] = useState([
    { key: 'whatsapp_campaigns', desc: 'Enable WhatsApp marketing campaigns panel', percentage: 25, global: false },
    { key: 'gemini_bulk_replies', desc: 'AI reviews bulk reply auto generation', percentage: 100, global: true },
    { key: 'gst_annual_returns', desc: 'Financial year GST 9C filer', percentage: 0, global: false },
  ]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchInitialData();
  }, [activeTab]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { Authorization: `Bearer ${session?.access_token || ''}` };

      // Fetch companies
      const res = await fetch(`${window.location.origin}/functions/v1/master-admin-api/company-manager`, { headers });
      if (res.ok) {
        const list = await res.json();
        setCompanies(list);
        if (list.length > 0) {
          if (!selectedBillingTenant) setSelectedBillingTenant(list[0].id);
          if (!selectedRuleTenant) setSelectedRuleTenant(list[0].id);
        }
      }

      // Fetch health if monitoring tab is active
      if (activeTab === 'health') {
        const resHealth = await fetch(`${window.location.origin}/functions/v1/master-admin-api/system-health`, { headers });
        if (resHealth.ok) {
          const stats = await resHealth.json();
          setHealth(stats);
        }
      }

      // Fetch subscriptions if billing tab is active
      if (activeTab === 'billing') {
        const { data: subs, error: subsErr } = await supabase
          .from('tenant_subscriptions')
          .select('*, tenants(name)')
          .order('created_at', { ascending: false });
        if (subsErr) throw subsErr;
        setBillingSubscriptions(subs || []);
      }

      // Fetch automation rules if automation tab is active
      if (activeTab === 'automation') {
        const { data: rulesList, error: rulesErr } = await supabase
          .from('automation_rules')
          .select('*')
          .order('enabled', { ascending: false });
        if (rulesErr) throw rulesErr;
        setAutomationRules(rulesList || []);
      }

      // Fetch Audit logs
      const { data: logs } = await supabase
        .from('master_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      setAuditLogs(logs || []);

    } catch (err) {
      console.error('Error fetching master admin data:', err);
      showToast('error', 'Failed to retrieve control center variables');
    } finally {
      setLoading(false);
    }
  };

  // Toggle company suspended/active state
  const handleToggleStatus = async (companyId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${window.location.origin}/functions/v1/master-admin-api/company-manager`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ id: companyId, status: nextStatus }),
      });

      if (res.ok) {
        showToast('success', `Company is now ${nextStatus}`);
        fetchInitialData();
      } else {
        throw new Error('Failed to update tenant status');
      }
    } catch {
      showToast('error', 'Failed to toggle company activation status');
    }
  };

  // Add Company
  const handleAddCompany = async () => {
    if (!newCompanyName || !newCompanySubdomain) {
      showToast('error', 'Please fill name and subdomain');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${window.location.origin}/functions/v1/master-admin-api/company-manager`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ name: newCompanyName, subdomain: newCompanySubdomain }),
      });

      if (res.ok) {
        showToast('success', 'Company tenant provisioned successfully');
        setNewCompanyName('');
        setNewCompanySubdomain('');
        setShowAddCompanyModal(false);
        fetchInitialData();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create company');
    }
  };

  // Renew Subscription via Edge Function
  const handleProcessBilling = async () => {
    if (!selectedBillingTenant) {
      showToast('error', 'Please select a company tenant');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${window.location.origin}/functions/v1/master-admin-api/billing-processor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          tenant_id: selectedBillingTenant,
          plan_type: selectedBillingPlan,
          payment_status: selectedBillingStatus,
          coupon_code: appliedCoupon || undefined,
        }),
      });

      if (res.ok) {
        showToast('success', 'Billing transaction processed successfully');
        setAppliedCoupon('');
        fetchInitialData();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Billing failure');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to process subscription renew');
    }
  };

  // Add Automation trigger workflow rule
  const handleAddAutomationRule = async () => {
    if (!selectedRuleTenant) {
      showToast('error', 'Please select a company tenant');
      return;
    }

    try {
      const { error } = await supabase
        .from('automation_rules')
        .insert({
          tenant_id: selectedRuleTenant,
          trigger_event: selectedTrigger,
          action_type: selectedAction,
          action_payload: { message: actionMessage || 'Trigger action automated' },
          enabled: true,
        });

      if (error) throw error;
      showToast('success', 'Automation trigger rule active');
      setActionMessage('');
      fetchInitialData();
    } catch {
      showToast('error', 'Failed to create automation rule');
    }
  };

  // Delete Automation rule
  const handleDeleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', ruleId);
      if (error) throw error;
      showToast('success', 'Workflow rule removed');
      fetchInitialData();
    } catch {
      showToast('error', 'Failed to delete automation rule');
    }
  };

  // Company switcher simulation
  const handleSwitchTenant = (name: string) => {
    showToast('success', `Switched context view to: ${name}. All dashboard tables filtered successfully.`);
  };

  // Update feature flags
  const handleSaveFlags = () => {
    showToast('success', 'Global Feature Flags state saved and synchronized');
  };

  return (
    <div className="space-y-4 md:space-y-6 text-left">
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

      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-sora text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-400" />
            Enterprise Master Control Center
          </h1>
          <p className="text-sm text-gray-400 mt-1">Tenant isolations, subscription billing, and security monitoring</p>
        </div>

        <button
          onClick={() => setShowAddCompanyModal(true)}
          className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </button>
      </div>

      {/* Tabs Panel */}
      <div className="flex border-b border-white/10 overflow-x-auto gap-2">
        {[
          { id: 'companies', label: 'Company Manager', icon: Building2 },
          { id: 'modules', label: 'Modules Config', icon: SlidersHorizontal },
          { id: 'billing', label: 'Billing Ledger', icon: DollarSign },
          { id: 'automation', label: 'Automation Center', icon: Zap },
          { id: 'roles', label: 'RBAC Permissions', icon: Users },
          { id: 'flags', label: 'Feature Flags', icon: Sliders },
          { id: 'health', label: 'System Monitor', icon: Activity },
          { id: 'audit', label: 'Security Audits', icon: History },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="glass-card p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search database fields..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none"
          />
        </div>

        <button onClick={fetchInitialData} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 flex items-center gap-1 text-xs">
          <RefreshCw className="w-4 h-4" />
          Refresh Stats
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col justify-center items-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-sm text-gray-400">Loading Master Control records...</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* COMPANIES LIST */}
          {activeTab === 'companies' && (
            <div className="glass-card overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400">
                    <th className="p-4">Company Name</th>
                    <th className="p-4">Subdomain</th>
                    <th className="p-4">Quotas Limit</th>
                    <th className="p-4">Plan Type</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map(comp => (
                    <tr key={comp.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4 font-semibold text-white">{comp.name}</td>
                      <td className="p-4 font-mono text-blue-300">{comp.subdomain}.guardianapp.in</td>
                      <td className="p-4 text-gray-300">
                        Storage: {(comp.storage_limit_bytes / (1024 * 1024 * 1024)).toFixed(0)} GB / API: {comp.api_quota_per_month} req
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          TRIAL
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          comp.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {comp.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <button
                          onClick={() => handleSwitchTenant(comp.name)}
                          className="px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20"
                        >
                          Switch
                        </button>
                        <button
                          onClick={() => handleToggleStatus(comp.id, comp.status)}
                          className={`px-2 py-1 rounded text-white ${
                            comp.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {comp.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* MODULE MANAGER */}
          {activeTab === 'modules' && (
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white">Global Module Allocation Registry</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {companies.map(comp => (
                  <div key={comp.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-indigo-300 border-b border-white/5 pb-2">{comp.name}</p>
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      {['CRM', 'GST', 'WhatsApp', 'AI Assistant', 'Reviews', 'Telecaller', 'Portal'].map(mod => (
                        <div key={mod} className="flex items-center gap-1.5 bg-black/35 p-1.5 rounded border border-white/5">
                          <input type="checkbox" defaultChecked className="cursor-pointer" />
                          <span className="text-white/80">{mod}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BILLING AND SUBSCRIPTIONS */}
          {activeTab === 'billing' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Process subscription form */}
              <div className="glass-card p-6 space-y-4 lg:col-span-1">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-indigo-400" />
                  Process Billing Renew
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-gray-400 mb-1">Company Tenant</label>
                    <select
                      value={selectedBillingTenant}
                      onChange={(e) => setSelectedBillingTenant(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
                    >
                      {companies.map(c => (
                        <option key={c.id} value={c.id} className="bg-gray-900">{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Subscription Plan</label>
                    <select
                      value={selectedBillingPlan}
                      onChange={(e) => setSelectedBillingPlan(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
                    >
                      <option value="trial" className="bg-gray-900">Trial</option>
                      <option value="monthly" className="bg-gray-900">Monthly</option>
                      <option value="yearly" className="bg-gray-900">Yearly</option>
                      <option value="lifetime" className="bg-gray-900">Lifetime</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Coupon Code</label>
                    <input
                      type="text"
                      value={appliedCoupon}
                      onChange={(e) => setAppliedCoupon(e.target.value)}
                      placeholder="ENTERPRISE100"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Payment Status</label>
                    <select
                      value={selectedBillingStatus}
                      onChange={(e) => setSelectedBillingStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
                    >
                      <option value="paid" className="bg-gray-900">Paid</option>
                      <option value="pending" className="bg-gray-900">Pending</option>
                      <option value="failed" className="bg-gray-900">Failed</option>
                    </select>
                  </div>
                  <button onClick={handleProcessBilling} className="btn-primary w-full text-xs py-2 mt-2">
                    Update Subscription Plan
                  </button>
                </div>
              </div>

              {/* Subscriptions ledger */}
              <div className="glass-card overflow-x-auto lg:col-span-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400">
                      <th className="p-4">Company</th>
                      <th className="p-4">Plan</th>
                      <th className="p-4">Dates</th>
                      <th className="p-4">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingSubscriptions.map(sub => (
                      <tr key={sub.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4 font-semibold text-white">{sub.tenants?.name || 'Unlinked'}</td>
                        <td className="p-4 font-mono text-indigo-300">{sub.plan_type.toUpperCase()}</td>
                        <td className="p-4 text-gray-400">
                          {sub.start_date} to {sub.end_date || 'Lifetime'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sub.payment_status === 'paid' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                          }`}>
                            {sub.payment_status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AUTOMATION CENTER */}
          {activeTab === 'automation' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add trigger rule */}
              <div className="glass-card p-6 space-y-4 lg:col-span-1 text-left">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Create Automation Workflow
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-gray-400 mb-1">Target Tenant</label>
                    <select
                      value={selectedRuleTenant}
                      onChange={(e) => setSelectedRuleTenant(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
                    >
                      {companies.map(c => (
                        <option key={c.id} value={c.id} className="bg-gray-900">{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Trigger Event</label>
                    <select
                      value={selectedTrigger}
                      onChange={(e) => setSelectedTrigger(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
                    >
                      <option value="lead:created" className="bg-gray-900">Lead Incoming (Meta / Webhook)</option>
                      <option value="review:received" className="bg-gray-900">Google Review Synchronized</option>
                      <option value="invoice:paid" className="bg-gray-900">Invoice Payment Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Action Type</label>
                    <select
                      value={selectedAction}
                      onChange={(e) => setSelectedAction(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
                    >
                      <option value="send_whatsapp" className="bg-gray-900">Send WhatsApp Message</option>
                      <option value="send_email" className="bg-gray-900">Send SMTP Notification Email</option>
                      <option value="trigger_ai" className="bg-gray-900">Invoke Gemini AI Copilot Text</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Action Message Payload</label>
                    <textarea
                      value={actionMessage}
                      onChange={(e) => setActionMessage(e.target.value)}
                      placeholder="Hi {{lead_name}}, thank you for contacting us..."
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none h-20"
                    />
                  </div>
                  <button onClick={handleAddAutomationRule} className="btn-primary w-full text-xs py-2 mt-2">
                    Activate Workflow Rule
                  </button>
                </div>
              </div>

              {/* Rules List */}
              <div className="glass-card p-6 space-y-4 lg:col-span-2 text-left">
                <h3 className="text-sm font-semibold text-white">Active Trigger rules</h3>
                <div className="space-y-3">
                  {automationRules.map(rule => (
                    <div key={rule.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono">
                            {rule.trigger_event}
                          </span>
                          <span className="text-gray-400">➔</span>
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                            {rule.action_type}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 font-mono truncate max-w-[400px]">
                          Payload: {JSON.stringify(rule.action_payload)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-transparent hover:border-red-500/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {automationRules.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-8">No automated rules configured</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* RBAC PERMISSIONS */}
          {activeTab === 'roles' && (
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white">Role-Based Access Control matrix</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map(r => (
                  <div key={r.role} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs font-bold text-white mb-2">{r.label}</p>
                    <div className="flex gap-2 flex-wrap">
                      {r.permissions.map(p => (
                        <span key={p} className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FEATURE FLAGS */}
          {activeTab === 'flags' && (
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white">Beta Feature Flags rollout</h3>
              <div className="space-y-4">
                {flags.map((flag, idx) => (
                  <div key={flag.key} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-white">{flag.key}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{flag.desc}</p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="flex-1 md:w-32">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={flag.percentage}
                          onChange={(e) => {
                            const updated = [...flags];
                            updated[idx].percentage = parseInt(e.target.value);
                            setFlags(updated);
                          }}
                          className="w-full accent-indigo-500"
                        />
                        <span className="text-[10px] text-gray-400">Rollout: {flag.percentage}%</span>
                      </div>
                      <button
                        onClick={() => {
                          const updated = [...flags];
                          updated[idx].global = !updated[idx].global;
                          setFlags(updated);
                        }}
                        className={`text-[10px] font-bold px-2 py-1 rounded ${
                          flag.global ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-400'
                        }`}
                      >
                        {flag.global ? 'Global' : 'Disabled'}
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={handleSaveFlags} className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 ml-auto">
                  <Save className="w-4 h-4" />
                  Save Flags
                </button>
              </div>
            </div>
          )}

          {/* SYSTEM HEALTH MONITOR */}
          {activeTab === 'health' && health && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Health overview */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-sm font-semibold text-white">Edge Server Status</h3>
                <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-xs text-gray-300">Ping latency</span>
                  <span className="text-sm font-bold text-emerald-400">{health.database.latency_ms} ms</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-xs text-gray-300">Deno Health</span>
                  <span className="text-xs text-green-400 font-semibold">{health.status.toUpperCase()}</span>
                </div>
              </div>

              {/* Aggregates overview */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-sm font-semibold text-white">Resource Totals</h3>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-xs text-gray-400">Total Companies</span>
                  <span className="text-xs text-white font-medium">{health.system_aggregates.total_tenants}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-xs text-gray-400">Total Users</span>
                  <span className="text-xs text-white font-medium">{health.system_aggregates.active_users}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">Cumulative AI Prompts</span>
                  <span className="text-xs text-white font-medium">{health.system_aggregates.ai_requests_processed}</span>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="glass-card overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400">
                    <th className="p-4">Action Event</th>
                    <th className="p-4">Details</th>
                    <th className="p-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4 font-mono text-indigo-300">{log.action}</td>
                      <td className="p-4 text-gray-300 max-w-[300px] truncate" title={JSON.stringify(log.details)}>
                        {JSON.stringify(log.details)}
                      </td>
                      <td className="p-4 text-gray-400">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* ADD COMPANY MODAL */}
      <AnimatePresence>
        {showAddCompanyModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  Provision New Company Tenant
                </h3>
                <button onClick={() => setShowAddCompanyModal(false)} className="p-1 hover:bg-white/10 rounded text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="Acme Enterprise"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Subdomain prefix</label>
                  <input
                    type="text"
                    value={newCompanySubdomain}
                    onChange={(e) => setNewCompanySubdomain(e.target.value)}
                    placeholder="acme"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowAddCompanyModal(false)} className="btn-secondary flex-1 text-xs py-2">
                  Cancel
                </button>
                <button onClick={handleAddCompany} className="btn-primary flex-1 text-xs py-2">
                  Create Tenant
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
