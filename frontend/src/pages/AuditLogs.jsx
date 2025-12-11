import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Shield,
  AlertTriangle,
  Info,
  Clock,
  User,
  Activity,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Settings,
  Bell,
  LogOut,
  LogIn,
  Trash2,
  Edit,
  CheckCircle,
  Calendar,
  MapPin,
  Mail,
} from 'lucide-react';
import { supabase } from '../config/supabase';

// Action Icon Map
const ActionIcons = {
  create: CheckCircle,
  update: Edit,
  delete: Trash2,
  view: Eye,
  export: Download,
  login: LogIn,
  logout: LogOut,
};

// Severity Badge Component
function SeverityBadge({ severity }) {
  const config = {
    info: { 
      bg: 'bg-blue-100', 
      text: 'text-blue-800', 
      icon: Info,
      border: 'border-blue-200'
    },
    warning: { 
      bg: 'bg-orange-100', 
      text: 'text-orange-800', 
      icon: AlertTriangle,
      border: 'border-orange-200'
    },
    critical: { 
      bg: 'bg-red-100', 
      text: 'text-red-800', 
      icon: Shield,
      border: 'border-red-200'
    },
  };

  const { bg, text, icon: Icon, border } = config[severity] || config.info;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${bg} ${text} ${border}`}>
      <Icon className="w-3 h-3 mr-1.5" />
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

// Log Detail Modal Component
function LogDetailModal({ log, onClose }) {
  if (!log) return null;

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
              <p className="text-blue-100 text-sm mt-0.5 font-mono">{log.id.slice(0, 8)}...</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Header Info */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <SeverityBadge severity={log.severity} />
            <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
              <Clock className="w-4 h-4 mr-2" />
              {new Date(log.created_at).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'medium'
              })}
            </div>
          </div>

          {/* Admin Info */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
              <User className="w-4 h-4 mr-2 text-blue-600" />
              Performed By
            </h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4 flex-shrink-0">
                  {log.admin_name?.charAt(0) || 'A'}
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Name</p>
                      <p className="text-sm font-semibold text-gray-900">{log.admin_name || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Email</p>
                      <p className="text-sm font-semibold text-gray-900 flex items-center">
                        <Mail className="w-3 h-3 mr-1 text-blue-500" />
                        {log.admin_email || 'N/A'}
                      </p>
                    </div>
                  </div>
                  {log.admin_role && (
                    <div className="mt-3">
                      <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Role</p>
                      <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg">
                        {log.admin_role === 'system_administrator' ? 'System Administrator' : 'Operator'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Info */}
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-5 border border-green-200">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-green-600" />
              Action Details
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-green-600 uppercase font-semibold mb-1">Action</p>
                  <div className="flex items-center">
                    {ActionIcons[log.action] && (
                      <div className="bg-green-100 p-1.5 rounded-lg mr-2">
                        {(() => {
                          const Icon = ActionIcons[log.action];
                          return <Icon className="w-4 h-4 text-green-600" />;
                        })()}
                      </div>
                    )}
                    <p className="text-sm font-semibold text-gray-900 capitalize">{log.action}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-green-600 uppercase font-semibold mb-1">Type</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{log.action_type}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-green-600 uppercase font-semibold mb-1">Description</p>
                <p className="text-sm font-medium text-gray-900 bg-white p-3 rounded-lg border border-green-200">
                  {log.description}
                </p>
              </div>
            </div>
          </div>

          {/* Target Info */}
          {log.target_id && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-5 border border-purple-200">
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-purple-600" />
                Target Resource
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Type</p>
                    <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg capitalize">
                      {log.target_type}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Name</p>
                    <p className="text-sm font-semibold text-gray-900">{log.target_name || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Resource ID</p>
                  <p className="text-xs font-mono text-gray-600 bg-white p-2 rounded-lg border border-purple-200 break-all">
                    {log.target_id}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Changes */}
          {(log.old_values || log.new_values) && (
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl p-5 border border-yellow-200">
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                <Settings className="w-4 h-4 mr-2 text-yellow-600" />
                Changes Made
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {log.old_values && (
                  <div>
                    <p className="text-xs text-yellow-600 uppercase font-semibold mb-2 flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Old Values
                    </p>
                    <pre className="text-xs bg-white p-3 rounded-lg border border-yellow-200 overflow-x-auto max-h-40 overflow-y-auto">
                      {JSON.stringify(log.old_values, null, 2)}
                    </pre>
                  </div>
                )}
                {log.new_values && (
                  <div>
                    <p className="text-xs text-yellow-600 uppercase font-semibold mb-2 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      New Values
                    </p>
                    <pre className="text-xs bg-white p-3 rounded-lg border border-yellow-200 overflow-x-auto max-h-40 overflow-y-auto">
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
              <Info className="w-4 h-4 mr-2 text-gray-600" />
              Metadata
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-500 mb-1">Log ID</p>
                <p className="font-mono text-gray-900 break-all">{log.id}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Timestamp</p>
                <p className="font-semibold text-gray-900">
                  {new Date(log.created_at).toISOString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <button 
            onClick={onClose} 
            className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [actionTypeFilter, setActionTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchLogs();
  }, [searchTerm, actionFilter, severityFilter, actionTypeFilter, currentPage]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // ✅ DIRECT QUERY WITH RLS (NO FUNCTION)
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply search filter
      if (searchTerm) {
        query = query.or(`admin_name.ilike.%${searchTerm}%,admin_email.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // Apply action filter
      if (actionFilter !== 'All') {
        query = query.eq('action', actionFilter);
      }

      // Apply severity filter
      if (severityFilter !== 'All') {
        query = query.eq('severity', severityFilter);
      }

      // Apply action type filter
      if (actionTypeFilter !== 'All') {
        query = query.eq('action_type', actionTypeFilter);
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setLogs(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      alert(`Failed to load audit logs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = () => {
    const headers = ['Timestamp', 'Admin', 'Email', 'Role', 'Action', 'Type', 'Description', 'Severity', 'Target'];
    const csvData = logs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.admin_name || 'Unknown',
      log.admin_email || 'N/A',
      log.admin_role || 'N/A',
      log.action,
      log.action_type,
      log.description.replace(/,/g, ';'),
      log.severity,
      log.target_name || log.target_id || 'N/A',
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    return new Date(date).toLocaleDateString();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActionFilter('All');
    setSeverityFilter('All');
    setActionTypeFilter('All');
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <Shield className="w-8 h-8 text-blue-600 mr-3" />
            Audit Logs
          </h1>
          <p className="text-gray-600 mt-1 font-medium">
            Track all admin actions and system changes
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-all hover:shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={exportLogs}
            disabled={logs.length === 0}
            className="flex items-center space-x-2 px-4 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-semibold transition-all hover:shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {logs.filter(l => l.severity === 'critical').length}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-xl">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">Warnings</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {logs.filter(l => l.severity === 'warning').length}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">Info</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {logs.filter(l => l.severity === 'info').length}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Info className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by admin, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="view">View</option>
              <option value="export">Export</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </select>
          </div>

          <div>
            <select
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Types</option>
              <option value="user">User</option>
              <option value="report">Report</option>
              <option value="emergency">Emergency</option>
              <option value="announcement">Announcement</option>
              <option value="auth">Authentication</option>
              <option value="settings">Settings</option>
            </select>
          </div>

          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Severity</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        
        {(searchTerm || actionFilter !== 'All' || severityFilter !== 'All' || actionTypeFilter !== 'All') && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{totalCount}</span> results found
            </p>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading audit logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold">No audit logs found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Admin</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => {
                    const ActionIcon = ActionIcons[log.action] || Activity;

                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 mr-2 text-gray-400" />
                            <div>
                              <p className="font-semibold text-gray-900">{timeAgo(log.created_at)}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(log.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-xs mr-3">
                              {log.admin_name?.charAt(0) || 'A'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{log.admin_name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{log.admin_email || 'N/A'}</p>
                              {log.admin_role && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                  {log.admin_role === 'system_administrator' ? 'Admin' : 'Operator'}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-gray-100 p-2 rounded-lg mr-2">
                              <ActionIcon className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 capitalize">{log.action}</p>
                              <p className="text-xs text-gray-500 capitalize">{log.action_type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900 line-clamp-2 max-w-md">{log.description}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <SeverityBadge severity={log.severity} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button 
                            onClick={() => setSelectedLog(log)} 
                            className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-semibold text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of{' '}
                <span className="font-semibold text-gray-900">{totalCount}</span> results
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">
                  {currentPage}
                </span>
                <span className="text-sm text-gray-600">of {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <LogDetailModal 
          log={selectedLog} 
          onClose={() => setSelectedLog(null)} 
        />
      )}
    </div>
  );
}
