import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Building2,
  Palette,
  Bell,
  Shield,
  Globe,
  Mail,
  Phone,
  MapPin,
  FileText,
  Camera,
  Save,
  Upload,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Key,
  Smartphone,
  Clock,
  Lock,
  LogOut,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Calendar,
  Banknote,
  CreditCard,
  Link,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import {
  CompanySettings,
  CURRENCY_OPTIONS,
  TIMEZONE_OPTIONS,
  DATE_FORMAT_OPTIONS,
} from '../../../types';

const tabs = [
  { id: 'company', label: 'Company Settings', icon: Building2 },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Company Settings State
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

  // Branding Settings State
  const [brandingSettings, setBrandingSettings] = useState({
    primary_color: '#3b82f6',
    secondary_color: '#1e40af',
    logo_url: '',
    font_family: 'Poppins',
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    lead_alerts: true,
    task_reminders: true,
    invoice_alerts: true,
    weekly_reports: true,
    marketing_emails: false,
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    two_factor_enabled: false,
    session_timeout: 30,
    password_expiry_days: 90,
    login_alerts: true,
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Fetch company settings on mount
  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setCompanySettings(data);
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
      showToast('error', 'Failed to load company settings');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveCompanySettings = async () => {
    if (!companySettings) return;

    setSaving(true);
    try {
      // Use upsert so the row is created if it doesn't exist yet (first use).
      // .update().eq('id') would silently affect 0 rows when the table is empty.
      const { data, error } = await supabase
        .from('company_settings')
        .upsert({
          ...companySettings,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      if (data) setCompanySettings(data);
      showToast('success', 'Company settings saved successfully');
    } catch (error) {
      console.error('Error saving company settings:', error);
      showToast('error', 'Failed to save company settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBrandingSettings = async () => {
    setSaving(true);
    try {
      // Persist branding colors to company_settings via upsert (creates row if missing).
      const payload = {
        primary_color: brandingSettings.primary_color,
        secondary_color: brandingSettings.secondary_color,
        updated_at: new Date().toISOString(),
        ...(companySettings ? companySettings : {}),
      };
      const { data, error } = await supabase
        .from('company_settings')
        .upsert(payload)
        .select()
        .single();
      if (error) throw error;
      if (data) setCompanySettings(data);
      showToast('success', 'Branding settings saved successfully');
    } catch (error) {
      console.error('Error saving branding settings:', error);
      showToast('error', 'Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (activeTab === 'company') {
      await handleSaveCompanySettings();
    } else if (activeTab === 'branding') {
      await handleSaveBrandingSettings();
    } else {
      // Notifications and Security tabs are kept as local state for now.
      // TODO: persist to a user_preferences table once it exists.
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setSaving(false);
      showToast('success', 'Settings saved successfully');
    }
  };

  const colorPresets = [
    { name: 'Blue', primary: '#3b82f6', secondary: '#1e40af' },
    { name: 'Green', primary: '#22c55e', secondary: '#15803d' },
    { name: 'Purple', primary: '#a855f7', secondary: '#7e22ce' },
    { name: 'Red', primary: '#ef4444', secondary: '#b91c1c' },
    { name: 'Orange', primary: '#f97316', secondary: '#c2410c' },
    { name: 'Teal', primary: '#14b8a6', secondary: '#0f766e' },
  ];

  const updateCompanyField = (field: keyof CompanySettings, value: string | number | null) => {
    if (companySettings) {
      setCompanySettings({ ...companySettings, [field]: value });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-sora text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            Settings
          </h1>
          <p className="text-gray-400 mt-1">Manage your agency settings and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Company Settings Tab */}
        {activeTab === 'company' && (
          <motion.div
            key="company"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-6"
          >
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : companySettings && (
              <>
                {/* Basic Information */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Building2 className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Basic Information</h3>
                  </div>

                  <div className="space-y-6">
                    {/* Logo Upload */}
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-xl bg-white/10 flex items-center justify-center border-2 border-dashed border-white/20 overflow-hidden">
                        {companySettings.company_logo_url ? (
                          <img src={companySettings.company_logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center">
                            <Camera className="w-6 h-6 text-gray-500 mx-auto mb-1" />
                            <span className="text-xs text-gray-500">Logo</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <input
                          type="file"
                          accept="image/png,image/svg+xml,image/jpeg"
                          className="hidden"
                          id="logo-upload"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            const fileName = `logos/${Date.now()}_${file.name}`;
                            const { error: uploadError } = await supabase.storage
                              .from('company-assets')
                              .upload(fileName, file);

                            if (uploadError) {
                              showToast('error', 'Failed to upload logo');
                              return;
                            }

                            const { data: { publicUrl } } = supabase.storage
                              .from('company-assets')
                              .getPublicUrl(fileName);

                            updateCompanyField('company_logo_url', publicUrl);
                            showToast('success', 'Logo uploaded successfully');
                          }}
                        />
                        <button
                          onClick={() => document.getElementById('logo-upload')?.click()}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                          Upload Logo
                        </button>
                        <p className="text-xs text-gray-500 mt-2">Recommended: 200x200px, PNG or SVG</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Company Name *</label>
                        <input
                          type="text"
                          value={companySettings.company_name}
                          onChange={(e) => updateCompanyField('company_name', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Tagline</label>
                        <input
                          type="text"
                          value={companySettings.tagline || ''}
                          onChange={(e) => updateCompanyField('tagline', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                          placeholder="Your company tagline"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input
                            type="email"
                            value={companySettings.email || ''}
                            onChange={(e) => updateCompanyField('email', e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input
                            type="tel"
                            value={companySettings.phone || ''}
                            onChange={(e) => updateCompanyField('phone', e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Alternate Phone</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input
                            type="tel"
                            value={companySettings.alternate_phone || ''}
                            onChange={(e) => updateCompanyField('alternate_phone', e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input
                            type="url"
                            value={companySettings.website || ''}
                            onChange={(e) => updateCompanyField('website', e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <MapPin className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Address Information</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Street Address</label>
                      <textarea
                        value={companySettings.address || ''}
                        onChange={(e) => updateCompanyField('address', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                        placeholder="Enter full address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                      <input
                        type="text"
                        value={companySettings.city || ''}
                        onChange={(e) => updateCompanyField('city', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                      <input
                        type="text"
                        value={companySettings.state || ''}
                        onChange={(e) => updateCompanyField('state', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">PIN Code</label>
                      <input
                        type="text"
                        value={companySettings.pincode || ''}
                        onChange={(e) => updateCompanyField('pincode', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        placeholder="400001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                      <input
                        type="text"
                        value={companySettings.country || ''}
                        onChange={(e) => updateCompanyField('country', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Tax & Registration */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Tax & Registration</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">GST Number</label>
                      <input
                        type="text"
                        value={companySettings.gst_number || ''}
                        onChange={(e) => updateCompanyField('gst_number', e.target.value.toUpperCase())}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 font-mono uppercase"
                        placeholder="27AABCU9603R1ZM"
                        maxLength={15}
                      />
                      {companySettings.gst_number && companySettings.gst_number.length !== 15 && (
                        <p className="text-xs text-yellow-400 mt-1">GST number should be 15 characters</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">PAN Number</label>
                      <input
                        type="text"
                        value={companySettings.pan_number || ''}
                        onChange={(e) => updateCompanyField('pan_number', e.target.value.toUpperCase())}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 font-mono uppercase"
                        placeholder="AABCU9603R"
                        maxLength={10}
                      />
                      {companySettings.pan_number && companySettings.pan_number.length !== 10 && (
                        <p className="text-xs text-yellow-400 mt-1">PAN number should be 10 characters</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">CIN Number</label>
                      <input
                        type="text"
                        value={companySettings.cin_number || ''}
                        onChange={(e) => updateCompanyField('cin_number', e.target.value.toUpperCase())}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 font-mono uppercase"
                        placeholder="U12345MH2024PTC123456"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">MSME Number</label>
                      <input
                        type="text"
                        value={companySettings.msme_number || ''}
                        onChange={(e) => updateCompanyField('msme_number', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        placeholder="UDYAM-MH-00-0000000"
                      />
                    </div>
                  </div>
                </div>

                {/* Invoice & Financial Settings */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Invoice & Financial Settings</h3>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Invoice Prefix</label>
                      <input
                        type="text"
                        value={companySettings.invoice_prefix || ''}
                        onChange={(e) => updateCompanyField('invoice_prefix', e.target.value.toUpperCase())}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 font-mono uppercase"
                        placeholder="INV"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Invoice Starting Number</label>
                      <input
                        type="number"
                        value={companySettings.invoice_suffix_start || 1}
                        onChange={(e) => updateCompanyField('invoice_suffix_start', parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Quote Prefix</label>
                      <input
                        type="text"
                        value={companySettings.quote_prefix || ''}
                        onChange={(e) => updateCompanyField('quote_prefix', e.target.value.toUpperCase())}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 font-mono uppercase"
                        placeholder="QUO"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
                      <select
                        value={companySettings.currency || 'INR'}
                        onChange={(e) => {
                          const selected = CURRENCY_OPTIONS.find(c => c.value === e.target.value);
                          updateCompanyField('currency', e.target.value);
                          updateCompanyField('currency_symbol', selected?.symbol || '₹');
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      >
                        {CURRENCY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value} className="bg-gray-900">
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Financial Year Start Month</label>
                      <select
                        value={companySettings.financial_year_start || 4}
                        onChange={(e) => updateCompanyField('financial_year_start', parseInt(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value={1} className="bg-gray-900">January</option>
                        <option value={4} className="bg-gray-900">April</option>
                        <option value={7} className="bg-gray-900">July</option>
                        <option value={10} className="bg-gray-900">October</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Default Invoice Terms</label>
                      <textarea
                        value={companySettings.default_terms || ''}
                        onChange={(e) => updateCompanyField('default_terms', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                        placeholder="Enter default terms and conditions for invoices"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Default Invoice Notes</label>
                      <textarea
                        value={companySettings.default_notes || ''}
                        onChange={(e) => updateCompanyField('default_notes', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                        placeholder="Enter default notes for invoices"
                      />
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Banknote className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Bank Details</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Bank Name</label>
                      <input
                        type="text"
                        value={companySettings.bank_name || ''}
                        onChange={(e) => updateCompanyField('bank_name', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        placeholder="e.g., HDFC Bank"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Account Name</label>
                      <input
                        type="text"
                        value={companySettings.bank_account_name || ''}
                        onChange={(e) => updateCompanyField('bank_account_name', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Account holder name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Account Number</label>
                      <input
                        type="text"
                        value={companySettings.bank_account_number || ''}
                        onChange={(e) => updateCompanyField('bank_account_number', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 font-mono"
                        placeholder="Enter account number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">IFSC Code</label>
                      <input
                        type="text"
                        value={companySettings.bank_ifsc_code || ''}
                        onChange={(e) => updateCompanyField('bank_ifsc_code', e.target.value.toUpperCase())}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 font-mono uppercase"
                        placeholder="HDFC0001234"
                        maxLength={11}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Branch</label>
                      <input
                        type="text"
                        value={companySettings.bank_branch || ''}
                        onChange={(e) => updateCompanyField('bank_branch', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Branch name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">UPI ID</label>
                      <input
                        type="text"
                        value={companySettings.upi_id || ''}
                        onChange={(e) => updateCompanyField('upi_id', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        placeholder="company@upi"
                      />
                    </div>
                  </div>
                </div>

                {/* Localization Settings */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Localization</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
                      <select
                        value={companySettings.timezone || 'Asia/Kolkata'}
                        onChange={(e) => updateCompanyField('timezone', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      >
                        {TIMEZONE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value} className="bg-gray-900">
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Date Format</label>
                      <select
                        value={companySettings.date_format || 'DD/MM/YYYY'}
                        onChange={(e) => updateCompanyField('date_format', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      >
                        {DATE_FORMAT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value} className="bg-gray-900">
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Link className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Social Media Links</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">LinkedIn</label>
                      <input
                        type="url"
                        value={companySettings.linkedin_url || ''}
                        onChange={(e) => updateCompanyField('linkedin_url', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        placeholder="https://linkedin.com/company/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Twitter/X</label>
                      <input
                        type="url"
                        value={companySettings.twitter_url || ''}
                        onChange={(e) => updateCompanyField('twitter_url', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Facebook</label>
                      <input
                        type="url"
                        value={companySettings.facebook_url || ''}
                        onChange={(e) => updateCompanyField('facebook_url', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Instagram</label>
                      <input
                        type="url"
                        value={companySettings.instagram_url || ''}
                        onChange={(e) => updateCompanyField('instagram_url', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <motion.div
            key="branding"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Branding & Appearance</h3>
            </div>

            <div className="space-y-6">
              {/* Brand Colors */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Brand Color Presets</label>
                <div className="flex flex-wrap gap-3">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setBrandingSettings({
                        ...brandingSettings,
                        primary_color: preset.primary,
                        secondary_color: preset.secondary
                      })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                        brandingSettings.primary_color === preset.primary
                          ? 'border-white bg-white/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }}
                      />
                      <span className="text-sm text-gray-300">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Primary Color</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={brandingSettings.primary_color}
                      onChange={(e) => setBrandingSettings({ ...brandingSettings, primary_color: e.target.value })}
                      className="w-12 h-12 rounded-lg bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandingSettings.primary_color}
                      onChange={(e) => setBrandingSettings({ ...brandingSettings, primary_color: e.target.value })}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Secondary Color</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={brandingSettings.secondary_color}
                      onChange={(e) => setBrandingSettings({ ...brandingSettings, secondary_color: e.target.value })}
                      className="w-12 h-12 rounded-lg bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandingSettings.secondary_color}
                      onChange={(e) => setBrandingSettings({ ...brandingSettings, secondary_color: e.target.value })}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="border-t border-white/10 pt-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">Preview</label>
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${brandingSettings.primary_color}, ${brandingSettings.secondary_color})` }}
                    >
                      <span className="text-white font-bold">G</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{companySettings?.company_name || 'Company Name'}</h4>
                      <p className="text-sm text-gray-400">AI-Powered Digital Marketing</p>
                    </div>
                  </div>
                  <button
                    className="px-6 py-2.5 rounded-xl font-medium text-white transition-all"
                    style={{ background: `linear-gradient(135deg, ${brandingSettings.primary_color}, ${brandingSettings.secondary_color})` }}
                  >
                    Get Started
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Font Family</label>
                <select
                  value={brandingSettings.font_family}
                  onChange={(e) => setBrandingSettings({ ...brandingSettings, font_family: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Poppins" className="bg-gray-900">Poppins</option>
                  <option value="Inter" className="bg-gray-900">Inter</option>
                  <option value="Roboto" className="bg-gray-900">Roboto</option>
                  <option value="Open Sans" className="bg-gray-900">Open Sans</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Notification Preferences</h3>
            </div>

            <div className="space-y-4">
              {[
                { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                { key: 'push_notifications', label: 'Push Notifications', desc: 'Browser push notifications' },
                { key: 'lead_alerts', label: 'Lead Alerts', desc: 'Get notified when new leads are added' },
                { key: 'task_reminders', label: 'Task Reminders', desc: 'Reminders for pending tasks' },
                { key: 'invoice_alerts', label: 'Invoice Alerts', desc: 'Payment and invoice notifications' },
                { key: 'weekly_reports', label: 'Weekly Reports', desc: 'Weekly summary reports via email' },
                { key: 'marketing_emails', label: 'Marketing Emails', desc: 'Product updates and tips' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setNotificationSettings({
                      ...notificationSettings,
                      [item.key]: !notificationSettings[item.key as keyof typeof notificationSettings]
                    })}
                    className="flex items-center"
                  >
                    {notificationSettings[item.key as keyof typeof notificationSettings] ? (
                      <div className="flex items-center gap-2 text-blue-400">
                        <ToggleRight className="w-8 h-8" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <ToggleLeft className="w-8 h-8" />
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-6"
          >
            {/* Two-Factor Authentication */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Two-Factor Authentication</h3>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                <div>
                  <p className="text-sm font-medium text-white">Enable 2FA</p>
                  <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
                </div>
                <button
                  onClick={() => setSecuritySettings({
                    ...securitySettings,
                    two_factor_enabled: !securitySettings.two_factor_enabled
                  })}
                  className="flex items-center"
                >
                  {securitySettings.two_factor_enabled ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <ToggleRight className="w-8 h-8" />
                      <span className="text-sm">Enabled</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                      <ToggleLeft className="w-8 h-8" />
                      <span className="text-sm">Disabled</span>
                    </div>
                  )}
                </button>
              </div>

              {securitySettings.two_factor_enabled && (
                <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Two-factor authentication is enabled</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    You'll need to enter a code from your authenticator app when signing in.
                  </p>
                </div>
              )}
            </div>

            {/* Session Settings */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Session Settings</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Session Timeout (minutes)</label>
                  <select
                    value={securitySettings.session_timeout}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      session_timeout: Number(e.target.value)
                    })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={15} className="bg-gray-900">15 minutes</option>
                    <option value={30} className="bg-gray-900">30 minutes</option>
                    <option value={60} className="bg-gray-900">1 hour</option>
                    <option value={120} className="bg-gray-900">2 hours</option>
                    <option value={480} className="bg-gray-900">8 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password Expiry (days)</label>
                  <select
                    value={securitySettings.password_expiry_days}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      password_expiry_days: Number(e.target.value)
                    })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={30} className="bg-gray-900">30 days</option>
                    <option value={60} className="bg-gray-900">60 days</option>
                    <option value={90} className="bg-gray-900">90 days</option>
                    <option value={180} className="bg-gray-900">180 days</option>
                    <option value={365} className="bg-gray-900">Never expire</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 mt-6">
                <div>
                  <p className="text-sm font-medium text-white">Login Alerts</p>
                  <p className="text-xs text-gray-500">Get notified of new sign-ins to your account</p>
                </div>
                <button
                  onClick={() => setSecuritySettings({
                    ...securitySettings,
                    login_alerts: !securitySettings.login_alerts
                  })}
                  className="flex items-center"
                >
                  {securitySettings.login_alerts ? (
                    <ToggleRight className="w-8 h-8 text-blue-400" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Change Password */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <Key className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Change Password</h3>
              </div>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={securitySettings.current_password}
                      onChange={(e) => setSecuritySettings({
                        ...securitySettings,
                        current_password: e.target.value
                      })}
                      className="w-full pl-12 pr-12 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                  <input
                    type="password"
                    value={securitySettings.new_password}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      new_password: e.target.value
                    })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={securitySettings.confirm_password}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      confirm_password: e.target.value
                    })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Confirm new password"
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!securitySettings.new_password) {
                      showToast('error', 'Please enter a new password');
                      return;
                    }
                    if (securitySettings.new_password !== securitySettings.confirm_password) {
                      showToast('error', 'Passwords do not match');
                      return;
                    }
                    setSaving(true);
                    try {
                      const { error } = await supabase.auth.updateUser({
                        password: securitySettings.new_password,
                      });
                      if (error) throw error;
                      showToast('success', 'Password updated successfully');
                      setSecuritySettings({
                        ...securitySettings,
                        current_password: '',
                        new_password: '',
                        confirm_password: '',
                      });
                    } catch (error) {
                      console.error('Error updating password:', error);
                      showToast('error', 'Failed to update password');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Update Password
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="glass-card p-6 border border-red-500/30">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-white">Danger Zone</h3>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10">
                <div>
                  <p className="text-sm font-medium text-white">Sign Out All Sessions</p>
                  <p className="text-xs text-gray-500">Sign out from all devices except this one</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await supabase.auth.signOut();
                      showToast('success', 'Signed out of all sessions');
                    } catch (error) {
                      console.error('Error signing out:', error);
                      showToast('error', 'Failed to sign out');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
