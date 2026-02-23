// src/pages/AdminManagement.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { logAuditAction } from '../utils/auditLogger';
import {
  Shield, Clock, CheckCircle, XCircle, Plus, X,
  Eye, EyeOff, UserCog, RefreshCw, AlertCircle, Siren,
} from 'lucide-react';

// ─── Responder type options ───────────────────────────────────────────────────
const RESPONDER_TYPES = [
  { value: 'police',   label: 'Police',           color: 'bg-blue-50 text-blue-700 border-blue-300'       },
  { value: 'fire',     label: 'Fire Brigade',      color: 'bg-orange-50 text-orange-700 border-orange-300' },
  { value: 'medical',  label: 'Medical / BHS',     color: 'bg-green-50 text-green-700 border-green-300'    },
  { value: 'disaster', label: 'Disaster Response', color: 'bg-purple-50 text-purple-700 border-purple-300' },
];

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  return (
    <div className="flex gap-1 bg-slate-100 border border-slate-200 rounded-lg p-1 w-fit">
      {[
        { id: 'admins',     label: 'Admin Users', icon: Shield },
        { id: 'responders', label: 'Responders',  icon: Siren  },
      ].map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${
            active === id
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />{label}
        </button>
      ))}
    </div>
  );
}

// ─── Create User Modal ────────────────────────────────────────────────────────
function CreateUserModal({ mode, onClose, onSuccess }) {
  const isResponder = mode === 'responder';

  const [form, setForm] = useState({
    full_name: '',
    email:     '',
    password:  '',
    role:      isResponder ? 'police' : 'operator',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.full_name || !form.email || !form.password) {
      setError('All fields are required.'); return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.'); return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await supabase.functions.invoke('create-admin-user', {
        body: {
          full_name: form.full_name,
          email:     form.email,
          password:  form.password,
          role:      form.role.toLowerCase(),
          user_type: isResponder ? 'responder' : 'admin',
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error)       throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      await logAuditAction({
        action:      isResponder ? 'create_responder' : 'create_admin',
        actionType:  'admin_management',
        description: `Created ${isResponder ? 'responder' : 'admin'}: ${form.email} (${form.role})`,
        severity:    'info',
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  const adminRoles = [
    { value: 'operator',             label: 'Operator',             desc: 'Standard access' },
    { value: 'system_administrator', label: 'System Administrator', desc: 'Full access'     },
  ];

  const options = isResponder ? RESPONDER_TYPES.map(t => ({ value: t.value, label: t.label, desc: '' })) : adminRoles;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">

        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">
              {isResponder ? 'Add Responder' : 'Create Admin User'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isResponder
                ? 'Register a new barangay responder account'
                : 'Add a new operator or system administrator'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-300 rounded flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">
              {isResponder ? 'Responder Name' : 'Full Name'}
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 transition disabled:opacity-50"
              placeholder={isResponder ? 'Alpha Unit 1' : 'Juan dela Cruz'}
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 transition disabled:opacity-50"
              placeholder={isResponder ? 'responder@barangay.gov.ph' : 'operator@barangay.gov.ph'}
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-300 rounded bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 transition disabled:opacity-50"
                placeholder="Min. 8 characters"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role / Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">
              {isResponder ? 'Responder Type' : 'Role'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {options.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, role: r.value }))}
                  className={`p-3 rounded border text-left transition-all ${
                    form.role === r.value
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className={`text-xs font-bold ${form.role === r.value ? 'text-white' : 'text-slate-900'}`}>
                    {r.label}
                  </p>
                  {r.desc && (
                    <p className={`text-xs mt-0.5 ${form.role === r.value ? 'text-slate-300' : 'text-slate-500'}`}>
                      {r.desc}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors disabled:opacity-50"
            >
              {loading
                ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>
                : <><Plus className="w-3.5 h-3.5" />{isResponder ? 'Add Responder' : 'Create Admin'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Responders Tab ───────────────────────────────────────────────────────────
function RespondersTab() {
  const [responders, setResponders] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);

  useEffect(() => { fetchResponders(); }, []);

  const fetchResponders = async () => {
    setLoading(true);
    try {
      // Step 1: fetch all responders — no join, no !inner
      const { data: responderData, error: responderError } = await supabase
        .from('responders')
        .select('*')
        .order('last_updated', { ascending: false, nullsFirst: false });

      if (responderError) throw responderError;

      if (!responderData || responderData.length === 0) {
        setResponders([]);
        return;
      }

      // Step 2: fetch matching public.users by id (left join equivalent)
      const ids = responderData.map(r => r.id);
      const { data: usersData } = await supabase
        .from('users')
        .select('id, email, account_status')
        .in('id', ids);

      // Step 3: merge user data onto each responder
      const usersMap = Object.fromEntries((usersData || []).map(u => [u.id, u]));
      setResponders(responderData.map(r => ({ ...r, user: usersMap[r.id] || null })));

    } catch (err) {
      console.error('Error fetching responders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeStyle = (type) =>
    RESPONDER_TYPES.find(t => t.value === type?.toLowerCase())?.color ||
    'bg-slate-50 text-slate-600 border-slate-300';

  const getTypeLabel = (type) =>
    RESPONDER_TYPES.find(t => t.value === type?.toLowerCase())?.label || type || '—';

  const getStatusStyle = (status) => ({
    available: 'bg-green-50 text-green-700 border-green-300',
    busy:      'bg-amber-50 text-amber-700 border-amber-300',
    offline:   'bg-slate-50 text-slate-500 border-slate-300',
  }[status] || 'bg-slate-50 text-slate-500 border-slate-300');

  const timeAgo = (date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
            <Siren className="w-3.5 h-3.5" />Registered Responders
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{responders.length} total</span>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors"
            >
              <Plus className="w-3 h-3" />Add Responder
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          </div>
        ) : responders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded flex items-center justify-center mx-auto mb-3">
              <Siren className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">No responders yet</p>
            <p className="text-xs text-slate-400 mt-1">Add the first barangay responder.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200">
                <tr>
                  {['Responder', 'Type', 'Status', 'Last Active', 'Location'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {responders.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">

                    {/* Responder Info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-700 rounded flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                          {r.user?.email
                            ? <p className="text-xs text-slate-500">{r.user.email}</p>
                            : <p className="text-xs text-amber-600 font-medium">No linked user account</p>
                          }
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider ${getTypeStyle(r.type)}`}>
                        {getTypeLabel(r.type)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold capitalize ${getStatusStyle(r.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          r.status === 'available' ? 'bg-green-500' :
                          r.status === 'busy'      ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                        {r.status || 'offline'}
                      </span>
                    </td>

                    {/* Last Active */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {timeAgo(r.last_updated)}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {r.current_lat && r.current_lng
                        ? `${r.current_lat.toFixed(4)}, ${r.current_lng.toFixed(4)}`
                        : <span className="text-slate-400">No GPS data</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <CreateUserModal
          mode="responder"
          onClose={() => setShowModal(false)}
          onSuccess={fetchResponders}
        />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminManagement() {
  const [tab, setTab]                         = useState('admins');
  const [admins, setAdmins]                   = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading]     = useState(null);

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAdmins(data || []);
    } catch (err) { console.error('Error fetching admins:', err); }
    finally { setLoading(false); }
  };

  const toggleActive = async (admin) => {
    setActionLoading(admin.id);
    try {
      const newStatus = !admin.is_active;
      const { error } = await supabase
        .from('admin_users').update({ is_active: newStatus }).eq('id', admin.id);
      if (error) throw error;
      await logAuditAction({
        action:      newStatus ? 'activate_admin' : 'deactivate_admin',
        actionType:  'admin_management',
        description: `${newStatus ? 'Activated' : 'Deactivated'} admin: ${admin.email}`,
        severity:    'info',
      });
      fetchAdmins();
    } catch (err) { console.error('Error toggling status:', err); }
    finally { setActionLoading(null); }
  };

  const timeAgo = (date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const sysAdmins = admins.filter(a => a.role === 'system_administrator');
  const operators = admins.filter(a => a.role === 'operator');

  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-50">

      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 uppercase tracking-widest font-semibold">
            <UserCog className="w-3.5 h-3.5" />Admin Management
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage administrator accounts and responders</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAdmins}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
          </button>
          {tab === 'admins' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />New Admin
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <TabBar active={tab} onChange={setTab} />

      {tab === 'admins' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Admins',  value: admins.length,                          color: 'text-slate-700' },
              { label: 'System Admins', value: sysAdmins.length,                       color: 'text-amber-600' },
              { label: 'Operators',     value: operators.length,                        color: 'text-blue-600'  },
              { label: 'Active',        value: admins.filter(a => a.is_active).length,  color: 'text-green-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Admins Table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />All Administrators
              </p>
              <span className="text-xs text-slate-400">{admins.length} total</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">No admin users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-200">
                    <tr>
                      {['Admin', 'Role', 'Status', 'Last Login', 'Created', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {admins.map(admin => (
                      <tr key={admin.id} className="hover:bg-slate-50 transition-colors">

                        {/* Admin Info */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-700 rounded flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {admin.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{admin.full_name}</p>
                              <p className="text-xs text-slate-500">{admin.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider ${
                            admin.role === 'system_administrator'
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : 'bg-slate-50 text-slate-600 border-slate-300'
                          }`}>
                            <Shield className="w-3 h-3" />
                            {admin.role === 'system_administrator' ? 'System Admin' : 'Operator'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          {admin.is_active
                            ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-semibold bg-green-50 text-green-700 border-green-300"><CheckCircle className="w-3 h-3" />Active</span>
                            : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-semibold bg-red-50 text-red-700 border-red-300"><XCircle className="w-3 h-3" />Inactive</span>
                          }
                        </td>

                        {/* Last Login */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />{timeAgo(admin.last_login)}
                          </div>
                        </td>

                        {/* Created */}
                        <td className="px-5 py-4 text-xs text-slate-500">
                          {new Date(admin.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <button
                            onClick={() => toggleActive(admin)}
                            disabled={actionLoading === admin.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold transition-all disabled:opacity-50 ${
                              admin.is_active
                                ? 'bg-white border-red-300 text-red-600 hover:bg-red-50'
                                : 'bg-white border-green-300 text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {actionLoading === admin.id
                              ? <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                              : admin.is_active
                                ? <><XCircle className="w-3.5 h-3.5" />Deactivate</>
                                : <><CheckCircle className="w-3.5 h-3.5" />Activate</>
                            }
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <RespondersTab />
      )}

      {showCreateModal && (
        <CreateUserModal
          mode="admin"
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchAdmins}
        />
      )}
    </div>
  );
}
