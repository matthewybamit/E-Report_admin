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
  create:  { icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-100'  },
  update:  { icon: Edit,        color: 'text-blue-600',   bg: 'bg-blue-100'   },
  delete:  { icon: Trash2,      color: 'text-red-600',    bg: 'bg-red-100'    },
  view:    { icon: Eye,         color: 'text-gray-600',   bg: 'bg-gray-100'   },
  export:  { icon: Download,    color: 'text-indigo-600', bg: 'bg-indigo-100' },
  login:   { icon: LogIn,       color: 'text-emerald-600',bg: 'bg-emerald-100'},
  logout:  { icon: LogOut,      color: 'text-orange-600', bg: 'bg-orange-100' },
  deploy:  { icon: Send,        color: 'text-blue-600',   bg: 'bg-blue-100'   },
  scan:    { icon: Bot,         color: 'text-purple-600', bg: 'bg-purple-100' },
  resolve: { icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-100'  },
  dispatch:{ icon: Radio,       color: 'text-blue-600',   bg: 'bg-blue-100'   },
};

const ACTION_TYPE_CONFIG = {
  report:       { label: 'Report',       color: 'bg-blue-100 text-blue-700'    },
  emergency:    { label: 'Emergency',    color: 'bg-red-100 text-red-700'      },
  announcement: { label: 'Announcement', color: 'bg-yellow-100 text-yellow-700'},
  user:         { label: 'User',         color: 'bg-purple-100 text-purple-700'},
  responder:    { label: 'Responder',    color: 'bg-indigo-100 text-indigo-700'},
  auth:         { label: 'Auth',         color: 'bg-gray-100 text-gray-700'    },
  settings:     { label: 'Settings',     color: 'bg-orange-100 text-orange-700'},
  evidence:     { label: 'Evidence',     color: 'bg-pink-100 text-pink-700'    },
};

// ─── Severity Badge ───────────────────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const config = {
    info:     { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-200',   icon: Info          },
    warning:  { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', icon: AlertTriangle },
    critical: { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-200',    icon: Shield        },
  };
  const { bg, text, border, icon: Icon } = config[severity] || config.info;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${bg} ${text} ${border}`}>
      <Icon className="w-3 h-3 mr-1.5" />
      {severity?.charAt(0).toUpperCase() + severity?.slice(1)}
    </span>
  );
}

// ─── Action Badge ─────────────────────────────────────────────────────────────
function ActionBadge({ action }) {
  const cfg = ACTION_CONFIG[action] || ACTION_CONFIG.view;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3 mr-1.5" />
      {action?.charAt(0).toUpperCase() + action?.slice(1)}
    </span>
  );
}

// ─── Type Pill ────────────────────────────────────────────────────────────────
function TypePill({ actionType }) {
  const cfg = ACTION_TYPE_CONFIG[actionType] || { label: actionType, color: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function LogDetailModal({ log, onClose }) {
  if (!log) return null;
  const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.view;
  const ActionIcon = cfg.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Audit Log Details</h2>
              <p className="text-blue-100 text-sm mt-0.5 font-mono">{log.id?.slice(0, 8)}...</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Top row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <SeverityBadge severity={log.severity} />
              <ActionBadge action={log.action} />
              <TypePill actionType={log.action_type} />
            </div>
            <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
              <Clock className="w-4 h-4 mr-2" />
              {new Date(log.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' })}
            </div>
          </div>

          {/* Performed By */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
              <User className="w-4 h-4 mr-2 text-blue-600" />Performed By
            </h3>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {log.admin_name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Name</p>
                  <p className="text-sm font-semibold text-gray-900">{log.admin_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Email</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-blue-500" />{log.admin_email || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Role</p>
                  <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg">
                    {log.admin_role === 'system_administrator' ? 'System Administrator' :
                     log.admin_role === 'admin' ? 'Administrator' : 'Operator'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Details */}
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-5 border border-green-200">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-green-600" />Action Details
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs text-green-600 uppercase font-semibold mb-2">Action</p>
                <ActionBadge action={log.action} />
              </div>
              <div>
                <p className="text-xs text-green-600 uppercase font-semibold mb-2">Type</p>
                <TypePill actionType={log.action_type} />
              </div>
            </div>
            <div>
              <p className="text-xs text-green-600 uppercase font-semibold mb-1">Description</p>
              <p className="text-sm font-medium text-gray-900 bg-white p-3 rounded-lg border border-green-200 leading-relaxed">
                {log.description}
              </p>
            </div>
          </div>

          {/* Target Resource */}
          {(log.target_id || log.target_name) && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-5 border border-purple-200">
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-purple-600" />Target Resource
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Type</p>
                  <TypePill actionType={log.target_type} />
                </div>
                <div>
                  <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Name</p>
                  <p className="text-sm font-semibold text-gray-900">{log.target_name || 'N/A'}</p>
                </div>
              </div>
              {log.target_id && (
                <div>
                  <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Resource ID</p>
                  <p className="text-xs font-mono text-gray-600 bg-white p-2 rounded-lg border border-purple-200 break-all">{log.target_id}</p>
                </div>
              )}
            </div>
          )}

          {/* Changes */}
          {(log.old_values || log.new_values) && (
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl p-5 border border-yellow-200">
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                <Settings className="w-4 h-4 mr-2 text-yellow-600" />Changes Made
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {log.old_values && (
                  <div>
                    <p className="text-xs text-yellow-700 uppercase font-semibold mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span>Before
                    </p>
                    <pre className="text-xs bg-white p-3 rounded-lg border border-yellow-200 overflow-x-auto max-h-48 overflow-y-auto">
                      {JSON.stringify(log.old_values, null, 2)}
                    </pre>
                  </div>
                )}
                {log.new_values && (
                  <div>
                    <p className="text-xs text-yellow-700 uppercase font-semibold mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>After
                    </p>
                    <pre className="text-xs bg-white p-3 rounded-lg border border-yellow-200 overflow-x-auto max-h-48 overflow-y-auto">
                      {JSON.stringify(log.new_values, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
              <Info className="w-4 h-4 mr-2 text-gray-600" />Metadata
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-500 mb-1">Log ID</p>
                <p className="font-mono text-gray-900 break-all">{log.id}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">ISO Timestamp</p>
                <p className="font-semibold text-gray-900">{new Date(log.created_at).toISOString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <button onClick={onClose} className="w-full px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AuditLogs() {
  const [logs, setLogs]                   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedLog, setSelectedLog]     = useState(null);
  const [searchTerm, setSearchTerm]       = useState('');
  const [actionFilter, setActionFilter]   = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [typeFilter, setTypeFilter]       = useState('All');
  const [dateFrom, setDateFrom]           = useState('');
  const [dateTo, setDateTo]               = useState('');
  const [currentPage, setCurrentPage]     = useState(1);
  const [totalPages, setTotalPages]       = useState(1);
  const [totalCount, setTotalCount]       = useState(0);
  const [severityCounts, setSeverityCounts] = useState({ critical: 0, warning: 0, info: 0 });
  const itemsPerPage = 25;

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, actionFilter, severityFilter, typeFilter, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [searchTerm, actionFilter, severityFilter, typeFilter, dateFrom, dateTo, currentPage]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(
          `admin_name.ilike.%${searchTerm}%,admin_email.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,target_name.ilike.%${searchTerm}%`
        );
      }
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

      // Fetch severity counts for stats (unfiltered by severity)
      const { data: allCounts } = await supabase
        .from('audit_logs')
        .select('severity');
      if (allCounts) {
        setSeverityCounts({
          critical: allCounts.filter(l => l.severity === 'critical').length,
          warning:  allCounts.filter(l => l.severity === 'warning').length,
          info:     allCounts.filter(l => l.severity === 'info').length,
        });
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, actionFilter, severityFilter, typeFilter, dateFrom, dateTo, currentPage]);

  const exportLogs = () => {
    const headers = ['Timestamp', 'Admin', 'Email', 'Role', 'Action', 'Type', 'Description', 'Severity', 'Target Type', 'Target Name', 'Target ID'];
    const rows = logs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.admin_name || 'Unknown',
      log.admin_email || 'N/A',
      log.admin_role || 'N/A',
      log.action,
      log.action_type,
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
    if (s < 60)   return 'Just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400)return `${Math.floor(s / 3600)}h ago`;
    if (s < 604800)return `${Math.floor(s / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const hasActiveFilters = searchTerm || actionFilter !== 'All' || severityFilter !== 'All' || typeFilter !== 'All' || dateFrom || dateTo;

  const clearFilters = () => {
    setSearchTerm('');
    setActionFilter('All');
    setSeverityFilter('All');
    setTypeFilter('All');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-xl shadow">
              <Shield className="w-7 h-7 text-white" />
            </div>
            Audit Logs
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Complete history of all admin and operator actions
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-white bg-blue-600 rounded-xl hover:bg-blue-700 font-semibold transition-all shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalCount.toLocaleString()}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl"><Activity className="w-5 h-5 text-blue-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Critical</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{severityCounts.critical}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-xl"><Shield className="w-5 h-5 text-red-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Warnings</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{severityCounts.warning}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-xl"><AlertTriangle className="w-5 h-5 text-orange-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Info</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{severityCounts.info}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl"><Info className="w-5 h-5 text-blue-600" /></div>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Filter className="w-4 h-4" />Filters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search admin, description, target..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Action */}
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
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

          {/* Type */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="All">All Types</option>
            <option value="report">Report</option>
            <option value="emergency">Emergency</option>
            <option value="announcement">Announcement</option>
            <option value="user">User</option>
            <option value="responder">Responder</option>
            <option value="auth">Authentication</option>
            <option value="settings">Settings</option>
            <option value="evidence">Evidence</option>
          </select>

          {/* Severity */}
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="All">All Severity</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>

          {/* Date range */}
          <div className="flex gap-2 lg:col-span-1">
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="flex-1 px-2 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              title="From date"
            />
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="flex-1 px-2 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              title="To date"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{totalCount}</span> result{totalCount !== 1 ? 's' : ''} found
            </p>
            <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600 font-medium">Loading audit logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold">No audit logs found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or date range</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Time', 'Admin', 'Action', 'Type', 'Description', 'Severity', ''].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => {
                    const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.view;
                    const Icon = cfg.icon;
                    const isCritical = log.severity === 'critical';
                    const isWarning  = log.severity === 'warning';

                    return (
                      <tr
                        key={log.id}
                        className={`transition-colors hover:bg-gray-50 ${isCritical ? 'bg-red-50/30' : isWarning ? 'bg-orange-50/20' : ''}`}
                      >
                        {/* Time */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-sm font-semibold text-gray-900">{timeAgo(log.created_at)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>

                        {/* Admin */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {log.admin_name?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{log.admin_name || 'Unknown'}</p>
                              <p className="text-xs text-gray-400 whitespace-nowrap">{log.admin_email || 'N/A'}</p>
                            </div>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${cfg.bg} ${cfg.color} text-xs font-semibold`}>
                            <Icon className="w-3.5 h-3.5" />
                            {log.action?.charAt(0).toUpperCase() + log.action?.slice(1)}
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <TypePill actionType={log.action_type} />
                        </td>

                        {/* Description */}
                        <td className="px-5 py-4 max-w-xs">
                          <p className="text-sm text-gray-700 line-clamp-2">{log.description}</p>
                          {log.target_name && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">→ {log.target_name}</p>
                          )}
                        </td>

                        {/* Severity */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <SeverityBadge severity={log.severity} />
                        </td>

                        {/* View */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-semibold text-xs whitespace-nowrap"
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
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-gray-600">
                Showing{' '}
                <span className="font-semibold text-gray-900">{Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}</span>
                {' '}–{' '}
                <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, totalCount)}</span>
                {' '}of{' '}
                <span className="font-semibold text-gray-900">{totalCount.toLocaleString()}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-xs font-semibold disabled:opacity-40"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm">
                  {currentPage} <span className="font-normal opacity-70">/ {totalPages}</span>
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-xs font-semibold disabled:opacity-40"
                >
                  Last
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
