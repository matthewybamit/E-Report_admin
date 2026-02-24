// src/pages/AuditLogs.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  Search, Download, RefreshCw, Shield, AlertTriangle, Info,
  Clock, User, Activity, Eye, X, ChevronLeft, ChevronRight,
  FileText, Settings, LogOut, LogIn, Trash2, Edit, CheckCircle,
  Mail, Bot, Bell, Radio, Send, MapPin, Filter,
} from 'lucide-react';
import { supabase } from '../config/supabase';

// ─── Action config ────────────────────────────────────────────────────────────
const ACTION_CONFIG = {
  create:  { icon: CheckCircle, color: 'text-green-700',  bg: 'bg-green-50 border-green-300'   },
  update:  { icon: Edit,        color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-300'     },
  delete:  { icon: Trash2,      color: 'text-red-700',    bg: 'bg-red-50 border-red-300'       },
  view:    { icon: Eye,         color: 'text-slate-600',  bg: 'bg-slate-50 border-slate-300'   },
  export:  { icon: Download,    color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-300' },
  login:   { icon: LogIn,       color: 'text-emerald-700',bg: 'bg-emerald-50 border-emerald-300'},
  logout:  { icon: LogOut,      color: 'text-orange-700', bg: 'bg-orange-50 border-orange-300' },
  deploy:  { icon: Send,        color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-300'     },
  scan:    { icon: Bot,         color: 'text-purple-700', bg: 'bg-purple-50 border-purple-300' },
  resolve: { icon: CheckCircle, color: 'text-green-700',  bg: 'bg-green-50 border-green-300'   },
  dispatch:{ icon: Radio,       color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-300'     },
};

const ACTION_TYPE_CONFIG = {
  report:           { label: 'Report',         color: 'bg-blue-50 text-blue-700 border-blue-300'       },
  emergency:        { label: 'Emergency',       color: 'bg-red-50 text-red-700 border-red-300'          },
  announcement:     { label: 'Announcement',    color: 'bg-amber-50 text-amber-700 border-amber-300'    },
  user:             { label: 'User',            color: 'bg-purple-50 text-purple-700 border-purple-300' },
  admin_management: { label: 'Admin Mgmt',      color: 'bg-slate-50 text-slate-700 border-slate-300'    },
  responder:        { label: 'Responder',       color: 'bg-indigo-50 text-indigo-700 border-indigo-300' },
  auth:             { label: 'Auth',            color: 'bg-slate-50 text-slate-600 border-slate-300'    },
  settings:         { label: 'Settings',        color: 'bg-orange-50 text-orange-700 border-orange-300' },
  evidence:         { label: 'Evidence',        color: 'bg-pink-50 text-pink-700 border-pink-300'       },
};

// ─── Severity Badge ───────────────────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const config = {
    info:     { classes: 'bg-blue-50 text-blue-700 border-blue-300',     icon: Info          },
    warning:  { classes: 'bg-amber-50 text-amber-700 border-amber-300',  icon: AlertTriangle },
    critical: { classes: 'bg-red-50 text-red-700 border-red-300',        icon: Shield        },
  };
  const { classes, icon: Icon } = config[severity] || config.info;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider ${classes}`}>
      <Icon className="w-3 h-3" />
      {severity?.charAt(0).toUpperCase() + severity?.slice(1)}
    </span>
  );
}

// ─── Action Badge ─────────────────────────────────────────────────────────────
function ActionBadge({ action }) {
  const cfg = ACTION_CONFIG[action] || ACTION_CONFIG.view;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {action?.charAt(0).toUpperCase() + action?.slice(1)}
    </span>
  );
}

// ─── Type Pill ────────────────────────────────────────────────────────────────
function TypePill({ actionType }) {
  const cfg = ACTION_TYPE_CONFIG[actionType] || { label: actionType, color: 'bg-slate-50 text-slate-600 border-slate-300' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function LogDetailModal({ log, onClose }) {
  if (!log) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">

        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Audit Log Details</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{log.id?.slice(0, 8)}...</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityBadge severity={log.severity} />
            <ActionBadge action={log.action} />
            <TypePill actionType={log.action_type} />
            <span className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded">
              <Clock className="w-3.5 h-3.5" />
              {new Date(log.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' })}
            </span>
          </div>

          {/* Performed By */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Performed By</p>
            </div>
            <div className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-700 rounded flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {log.admin_name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="grid grid-cols-3 gap-4 flex-1">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Name</p>
                  <p className="text-sm font-semibold text-slate-900">{log.admin_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Email</p>
                  <p className="text-xs text-slate-700 font-medium">{log.admin_email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Role</p>
                  <span className="inline-flex items-center px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border-amber-300">
                    {log.admin_role === 'system_administrator' ? 'System Admin' :
                     log.admin_role === 'admin' ? 'Admin' : 'Operator'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Details */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Action Details</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Action</p>
                  <ActionBadge action={log.action} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Type</p>
                  <TypePill actionType={log.action_type} />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description</p>
                <p className="text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded p-3 leading-relaxed">
                  {log.description}
                </p>
              </div>
            </div>
          </div>

          {/* Target Resource */}
          {(log.target_id || log.target_name) && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Target Resource</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Type</p>
                    <TypePill actionType={log.target_type} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Name</p>
                    <p className="text-sm font-semibold text-slate-900">{log.target_name || 'N/A'}</p>
                  </div>
                </div>
                {log.target_id && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Resource ID</p>
                    <p className="text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded p-2 break-all">{log.target_id}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Changes */}
          {(log.old_values || log.new_values) && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Changes Made</p>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {log.old_values && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-red-500 rounded-full inline-block" />Before
                    </p>
                    <pre className="text-xs bg-slate-50 border border-slate-200 rounded p-3 overflow-x-auto max-h-40 overflow-y-auto">
                      {JSON.stringify(log.old_values, null, 2)}
                    </pre>
                  </div>
                )}
                {log.new_values && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />After
                    </p>
                    <pre className="text-xs bg-slate-50 border border-slate-200 rounded p-3 overflow-x-auto max-h-40 overflow-y-auto">
                      {JSON.stringify(log.new_values, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Metadata</p>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Log ID</p>
                <p className="font-mono text-slate-700 break-all">{log.id}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">ISO Timestamp</p>
                <p className="font-semibold text-slate-700">{new Date(log.created_at).toISOString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AuditLogs() {
  const [logs, setLogs]                     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [selectedLog, setSelectedLog]       = useState(null);
  const [searchTerm, setSearchTerm]         = useState('');
  const [actionFilter, setActionFilter]     = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [typeFilter, setTypeFilter]         = useState('All');
  const [dateFrom, setDateFrom]             = useState('');
  const [dateTo, setDateTo]                 = useState('');
  const [currentPage, setCurrentPage]       = useState(1);
  const [totalPages, setTotalPages]         = useState(1);
  const [totalCount, setTotalCount]         = useState(0);
  const [severityCounts, setSeverityCounts] = useState({ critical: 0, warning: 0, info: 0 });
  const itemsPerPage = 25;

  useEffect(() => { setCurrentPage(1); }, [searchTerm, actionFilter, severityFilter, typeFilter, dateFrom, dateTo]);
  useEffect(() => { fetchLogs(); }, [searchTerm, actionFilter, severityFilter, typeFilter, dateFrom, dateTo, currentPage]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (searchTerm) query = query.or(`admin_name.ilike.%${searchTerm}%,admin_email.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,target_name.ilike.%${searchTerm}%`);
      if (actionFilter   !== 'All') query = query.eq('action',      actionFilter);
      if (severityFilter !== 'All') query = query.eq('severity',    severityFilter);
      if (typeFilter     !== 'All') query = query.eq('action_type', typeFilter);
      if (dateFrom) query = query.gte('created_at', new Date(dateFrom).toISOString());
      if (dateTo)   query = query.lte('created_at', new Date(dateTo + 'T23:59:59').toISOString());

      const from = (currentPage - 1) * itemsPerPage;
      query = query.range(from, from + itemsPerPage - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      setLogs(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));

      const { data: allCounts } = await supabase.from('audit_logs').select('severity');
      if (allCounts) {
        setSeverityCounts({
          critical: allCounts.filter(l => l.severity === 'critical').length,
          warning:  allCounts.filter(l => l.severity === 'warning').length,
          info:     allCounts.filter(l => l.severity === 'info').length,
        });
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, actionFilter, severityFilter, typeFilter, dateFrom, dateTo, currentPage]);

  const exportLogs = () => {
    const headers = ['Timestamp','Admin','Email','Role','Action','Type','Description','Severity','Target Type','Target Name','Target ID'];
    const rows = logs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.admin_name || 'Unknown',
      log.admin_email || 'N/A',
      log.admin_role  || 'N/A',
      log.action, log.action_type,
      `"${(log.description || '').replace(/"/g, '""')}"`,
      log.severity,
      log.target_type || 'N/A',
      log.target_name || 'N/A',
      log.target_id   || 'N/A',
    ]);
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60)     return 'Just now';
    if (s < 3600)   return `${Math.floor(s / 60)}m ago`;
    if (s < 86400)  return `${Math.floor(s / 3600)}h ago`;
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const hasActiveFilters = searchTerm || actionFilter !== 'All' || severityFilter !== 'All' || typeFilter !== 'All' || dateFrom || dateTo;

  const clearFilters = () => {
    setSearchTerm(''); setActionFilter('All'); setSeverityFilter('All');
    setTypeFilter('All'); setDateFrom(''); setDateTo(''); setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 uppercase tracking-widest font-semibold">
            <Shield className="w-3.5 h-3.5" />Audit Logs
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity History</h1>
          <p className="text-sm text-slate-500 mt-0.5">Complete history of all admin and operator actions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
          </button>
          <button
            onClick={exportLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />Export CSV
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Logs', value: totalCount.toLocaleString(), color: 'text-slate-700' },
          { label: 'Critical',   value: severityCounts.critical,     color: 'text-red-600'   },
          { label: 'Warnings',   value: severityCounts.warning,      color: 'text-amber-600' },
          { label: 'Info',       value: severityCounts.info,         color: 'text-blue-600'  },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Filters</p>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search admin, description, target..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
            <option value="All">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="view">View</option>
            <option value="export">Export</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="deploy">Deploy</option>
            <option value="scan">AI Scan</option>
            <option value="resolve">Resolve</option>
            <option value="dispatch">Dispatch</option>
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
            <option value="All">All Types</option>
            <option value="report">Report</option>
            <option value="emergency">Emergency</option>
            <option value="announcement">Announcement</option>
            <option value="user">User</option>
            <option value="admin_management">Admin Mgmt</option>
            <option value="responder">Responder</option>
            <option value="auth">Authentication</option>
            <option value="settings">Settings</option>
            <option value="evidence">Evidence</option>
          </select>
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
            <option value="All">All Severity</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <div className="flex gap-2">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date"
              className="flex-1 px-2 py-2.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-slate-400" />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} title="To date"
              className="flex-1 px-2 py-2.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-slate-400" />
          </div>
        </div>
        {hasActiveFilters && (
          <div className="flex items-center justify-between px-4 pb-3 border-t border-slate-100 pt-3">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{totalCount}</span> result{totalCount !== 1 ? 's' : ''} found
            </p>
            <button onClick={clearFilters} className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline">
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" />Log Entries
          </p>
          <span className="text-xs text-slate-400">{totalCount.toLocaleString()} total</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">No audit logs found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or date range</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200">
                  <tr>
                    {['Time', 'Admin', 'Action', 'Type', 'Description', 'Severity', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => {
                    const cfg  = ACTION_CONFIG[log.action] || ACTION_CONFIG.view;
                    const Icon = cfg.icon;
                    return (
                      <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${
                        log.severity === 'critical' ? 'bg-red-50/40' :
                        log.severity === 'warning'  ? 'bg-amber-50/30' : ''
                      }`}>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-sm font-semibold text-slate-900">{timeAgo(log.created_at)}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {log.admin_name?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900 whitespace-nowrap">{log.admin_name || 'Unknown'}</p>
                              <p className="text-xs text-slate-400 whitespace-nowrap">{log.admin_email || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <ActionBadge action={log.action} />
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <TypePill actionType={log.action_type} />
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          <p className="text-sm text-slate-700 line-clamp-2">{log.description}</p>
                          {log.target_name && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate">→ {log.target_name}</p>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <SeverityBadge severity={log.severity} />
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold bg-white border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between flex-wrap gap-3">
              <p className="text-xs text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-900">{Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}</span>
                {' '}–{' '}
                <span className="font-semibold text-slate-900">{Math.min(currentPage * itemsPerPage, totalCount)}</span>
                {' '}of{' '}
                <span className="font-semibold text-slate-900">{totalCount.toLocaleString()}</span>
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40">
                  First
                </button>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="p-1.5 text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1.5 bg-slate-800 text-white rounded text-xs font-semibold">
                  {currentPage} <span className="opacity-60">/ {totalPages}</span>
                </span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="p-1.5 text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40">
                  Last
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
