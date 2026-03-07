// src/pages/Services.jsx
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { logAuditAction } from '../utils/auditLogger';
import {
  FileText, Search, Filter, RefreshCw, X, CheckCircle,
  Clock, XCircle, Eye, Edit3, ChevronDown, Users,
  Loader, AlertTriangle, Building2, Flame, CreditCard,
  ShieldCheck, Banknote,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const SERVICE_TYPES = [
  { id: 'barangay_id',           label: 'Barangay ID',               icon: CreditCard,  color: 'bg-blue-50 text-blue-700 border-blue-300'     },
  { id: 'barangay_clearance',    label: 'Barangay Clearance',        icon: ShieldCheck, color: 'bg-green-50 text-green-700 border-green-300'   },
  { id: 'certificate_indigency', label: 'Certificate of Indigency',  icon: Banknote,    color: 'bg-pink-50 text-pink-700 border-pink-300'      },
  { id: 'business_clearance',    label: 'Business Clearance',        icon: Building2,   color: 'bg-teal-50 text-teal-700 border-teal-300'      },
  { id: 'permit_to_roast',       label: 'Permit to Roast',           icon: Flame,       color: 'bg-orange-50 text-orange-700 border-orange-300'},
];

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: 'bg-slate-50 text-slate-600 border-slate-300',   dot: 'bg-slate-400',  icon: Clock        },
  processing: { label: 'Processing', color: 'bg-amber-50 text-amber-700 border-amber-300',   dot: 'bg-amber-500',  icon: Loader       },
  approved:   { label: 'Approved',   color: 'bg-green-50 text-green-700 border-green-300',   dot: 'bg-green-500',  icon: CheckCircle  },
  rejected:   { label: 'Rejected',   color: 'bg-red-50 text-red-700 border-red-300',         dot: 'bg-red-500',    icon: XCircle      },
};

const FIELD_LABELS = {
  full_name:         'Full Name',
  address:           'Address',
  date_of_birth:     'Date of Birth',
  place_of_birth:    'Place of Birth',
  gender:            'Gender',
  civil_status:      'Civil Status',
  contact_number:    'Contact Number',
  date_of_residency: 'Date of Residency',
  residency_status:  'Residency Status',
  purpose:           'Purpose',
  age:               'Age',
  assistance_type:   'Type of Assistance',
  business_name:     'Business Name',
  business_address:  'Business Address',
  business_type:     'Application Type',
  items_to_roast:    'Items to Roast',
};

const SERVICE_FIELDS = {
  barangay_id:           ['full_name','address','date_of_birth','place_of_birth','gender','civil_status','contact_number','date_of_residency','purpose'],
  barangay_clearance:    ['full_name','address','date_of_birth','place_of_birth','gender','civil_status','contact_number','date_of_residency','residency_status','purpose'],
  certificate_indigency: ['full_name','address','age','gender','contact_number','purpose','assistance_type'],
  business_clearance:    ['full_name','contact_number','business_name','business_address','business_type','purpose'],
  permit_to_roast:       ['full_name','contact_number','business_name','business_address','items_to_roast','purpose'],
};

// ─── Helper: generate control number ─────────────────────────────────────────
function generateControlNumber(serviceType) {
  const prefix = {
    barangay_id:           'BID',
    barangay_clearance:    'BCL',
    certificate_indigency: 'COI',
    business_clearance:    'BCB',
    permit_to_roast:       'PTR',
  }[serviceType] || 'SRV';
  const now  = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `${prefix}-${yyyy}${mm}${dd}-${rand}`;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold capitalize tracking-wide ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Service Type Badge ───────────────────────────────────────────────────────
function ServiceTypeBadge({ serviceType }) {
  const cfg = SERVICE_TYPES.find(s => s.id === serviceType);
  if (!cfg) return <span className="text-xs text-slate-500">{serviceType}</span>;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold ${cfg.color}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

// ─── View / Process Modal ─────────────────────────────────────────────────────
function RequestModal({ request, onClose, onSave, saving }) {
  const [status,      setStatus]      = useState(request.status);
  const [adminNotes,  setAdminNotes]  = useState(request.admin_notes || '');
  const [processedBy, setProcessedBy] = useState(request.processed_by || '');

  if (!request) return null;

  const fields = SERVICE_FIELDS[request.service_type] || [];

  const handleSave = () => {
    onSave(request.id, {
      status,
      admin_notes:  adminNotes,
      processed_by: processedBy,
      processed_at: status !== 'pending' ? new Date().toISOString() : null,
      control_number:
        (status === 'approved' && !request.control_number)
          ? generateControlNumber(request.service_type)
          : request.control_number,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden border border-slate-200 flex flex-col">

        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-400 font-mono">
                {request.control_number || 'Pending Control No.'}
              </span>
            </div>
            <h2 className="text-base font-bold text-white">{request.service_title}</h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <StatusBadge status={request.status} />
              <ServiceTypeBadge serviceType={request.service_type} />
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Applicant Details */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />Applicant Information
              </p>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              {fields.map(field => {
                const val = request[field];
                if (!val && val !== 0) return null;
                return (
                  <div key={field}>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">
                      {FIELD_LABELS[field] || field}
                    </p>
                    <p className="text-sm text-slate-800 font-medium">{val}</p>
                  </div>
                );
              })}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Date Filed</p>
                <p className="text-sm text-slate-800 font-medium">
                  {new Date(request.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Processing Panel */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5" />Process Request
              </p>
            </div>
            <div className="p-4 space-y-4">

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">
                  Update Status
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(STATUS_CONFIG).map(([val, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={val}
                        onClick={() => setStatus(val)}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded border-2 text-xs font-semibold transition-all ${
                          status === val
                            ? 'border-slate-700 bg-slate-700 text-white'
                            : 'border-slate-200 text-slate-600 hover:border-slate-400 bg-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Processed By */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">
                  Processed By
                </label>
                <input
                  type="text"
                  value={processedBy}
                  onChange={e => setProcessedBy(e.target.value)}
                  placeholder="Enter officer name..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">
                  Admin Notes / Remarks
                </label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Add notes for the applicant..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                />
              </div>

              {/* Auto control number notice */}
              {status === 'approved' && !request.control_number && (
                <div className="bg-green-50 border border-green-200 rounded p-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                  <p className="text-xs text-green-800 font-medium">
                    A control number will be automatically generated upon saving.
                  </p>
                </div>
              )}

              {request.control_number && (
                <div className="bg-slate-50 border border-slate-200 rounded p-3">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-0.5">Control Number</p>
                  <p className="text-sm font-bold text-green-700 font-mono">{request.control_number}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded transition-colors disabled:opacity-50">
            {saving
              ? <><Loader className="w-4 h-4 animate-spin" />Saving...</>
              : <><CheckCircle className="w-4 h-4" />Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Services() {
  const [requests,       setRequests]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [selectedReq,    setSelectedReq]    = useState(null);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [typeFilter,     setTypeFilter]     = useState('all');
  const [showTypeFilter, setShowTypeFilter] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*, users(full_name, email, avatar_url)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('fetchRequests error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-service-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, payload => {
        if (payload.eventType === 'INSERT') {
          fetchRequests();
        } else if (payload.eventType === 'UPDATE') {
          setRequests(prev => prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r));
          setSelectedReq(prev => prev?.id === payload.new.id ? { ...prev, ...payload.new } : prev);
        } else if (payload.eventType === 'DELETE') {
          setRequests(prev => prev.filter(r => r.id !== payload.old.id));
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchRequests]);

  const handleSave = async (requestId, updates) => {
    setSaving(true);
    try {
      const original = requests.find(r => r.id === requestId);
      const { error } = await supabase
        .from('service_requests')
        .update(updates)
        .eq('id', requestId);
      if (error) throw error;

      try {
        await logAuditAction({
          action:      'update',
          actionType:  'service_request',
          description: `Updated service request (${original?.service_title}) status to "${updates.status}"${updates.control_number ? `. Control No: ${updates.control_number}` : ''}.`,
          severity:    updates.status === 'rejected' ? 'warning' : 'info',
          targetId:    requestId,
          targetType:  'service_request',
          targetName:  original?.service_title,
          oldValues:   { status: original?.status },
          newValues:   { status: updates.status, control_number: updates.control_number },
        });
      } catch (auditErr) {
        console.error('Audit log failed:', auditErr);
      }

      setSelectedReq(null);
      fetchRequests();
    } catch (err) {
      console.error('handleSave error:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Filtered list ──
  const filtered = requests.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q
      || r.full_name?.toLowerCase().includes(q)
      || r.service_title?.toLowerCase().includes(q)
      || r.control_number?.toLowerCase().includes(q)
      || r.contact_number?.includes(q)
      || r.users?.email?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchType   = typeFilter   === 'all' || r.service_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  // ── Stats ──
  const stats = {
    total:      requests.length,
    pending:    requests.filter(r => r.status === 'pending').length,
    processing: requests.filter(r => r.status === 'processing').length,
    approved:   requests.filter(r => r.status === 'approved').length,
    rejected:   requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 uppercase tracking-widest font-semibold">
            <FileText className="w-3.5 h-3.5" />Document Management
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Barangay Services</h1>
          <p className="text-sm text-slate-500 mt-0.5">Review, process, and approve citizen document requests</p>
        </div>
        <button onClick={fetchRequests} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total',      value: stats.total,      color: 'text-slate-700', border: 'border-l-slate-400'  },
          { label: 'Pending',    value: stats.pending,    color: 'text-slate-600', border: 'border-l-slate-400'  },
          { label: 'Processing', value: stats.processing, color: 'text-amber-600', border: 'border-l-amber-500'  },
          { label: 'Approved',   value: stats.approved,   color: 'text-green-600', border: 'border-l-green-500'  },
          { label: 'Rejected',   value: stats.rejected,   color: 'text-red-600',   border: 'border-l-red-500'    },
        ].map(({ label, value, color, border }) => (
          <div key={label} className={`bg-white border border-slate-200 border-l-4 ${border} rounded-lg p-4 shadow-sm`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, control number, contact, or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-800"
            />
          </div>

          {/* Status Filter */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-700">
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
              <option key={val} value={val}>{cfg.label}</option>
            ))}
          </select>

          {/* Service Type Filter */}
          <div className="relative">
            <button
              onClick={() => setShowTypeFilter(p => !p)}
              className="flex items-center gap-2 px-3 py-2.5 border border-slate-300 rounded text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors min-w-[160px] justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-slate-400" />
                {typeFilter === 'all' ? 'All Types' : SERVICE_TYPES.find(s => s.id === typeFilter)?.label}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            {showTypeFilter && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 w-56 py-1">
                <button onClick={() => { setTypeFilter('all'); setShowTypeFilter(false); }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${typeFilter === 'all' ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                  All Types
                </button>
                {SERVICE_TYPES.map(s => {
                  const Icon = s.icon;
                  return (
                    <button key={s.id} onClick={() => { setTypeFilter(s.id); setShowTypeFilter(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 ${typeFilter === s.id ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                      <Icon className="w-3.5 h-3.5 text-slate-400" />{s.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Clear */}
          {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all') && (
            <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); setTypeFilter('all'); }}
              className="px-3 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 border border-slate-300 rounded hover:bg-slate-200 transition-colors flex items-center gap-1.5">
              <X className="w-3.5 h-3.5" />Clear
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400">
          Showing <strong className="text-slate-600">{filtered.length}</strong> of <strong className="text-slate-600">{requests.length}</strong> requests
        </p>
      </div>

      {/* ── Status Tab Pills ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'pending', 'processing', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors capitalize border ${
              statusFilter === s
                ? 'bg-slate-700 text-white border-slate-700'
                : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
            }`}>
            {s === 'all' ? `All (${stats.total})` : `${STATUS_CONFIG[s]?.label} (${stats[s] ?? 0})`}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-7 h-7 animate-spin text-slate-400" />
          <span className="ml-3 text-slate-500 font-medium">Loading requests...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-lg">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">No requests found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Date Filed', 'Applicant', 'Service Type', 'Details', 'Status', 'Control No.', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">

                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs text-slate-800 font-medium">
                        {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(req.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>

                    {/* Applicant */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-800">{req.full_name}</p>
                      <p className="text-xs text-slate-400">{req.contact_number}</p>
                      {req.users?.email && (
                        <p className="text-xs text-slate-400 truncate max-w-[160px]">{req.users.email}</p>
                      )}
                    </td>

                    {/* Service Type */}
                    <td className="px-4 py-3">
                      <ServiceTypeBadge serviceType={req.service_type} />
                    </td>

                    {/* Details */}
                    <td className="px-4 py-3 max-w-[200px]">
                      {req.purpose && (
                        <p className="text-xs text-slate-600 truncate" title={req.purpose}>
                          📋 {req.purpose}
                        </p>
                      )}
                      {req.business_name && (
                        <p className="text-xs text-slate-600 truncate">🏪 {req.business_name}</p>
                      )}
                      {req.assistance_type && (
                        <p className="text-xs text-slate-600 truncate">💊 {req.assistance_type}</p>
                      )}
                      {req.items_to_roast && (
                        <p className="text-xs text-slate-600 truncate">🍖 {req.items_to_roast}</p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={req.status} />
                      {req.processed_by && (
                        <p className="text-xs text-slate-400 mt-1">by {req.processed_by}</p>
                      )}
                    </td>

                    {/* Control Number */}
                    <td className="px-4 py-3">
                      {req.control_number
                        ? <span className="text-xs font-bold text-green-700 font-mono bg-green-50 border border-green-200 px-2 py-1 rounded">{req.control_number}</span>
                        : <span className="text-xs text-slate-400">—</span>
                      }
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setSelectedReq(req)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors">
                          <Eye className="w-3.5 h-3.5" />Process
                        </button>
                        {req.status === 'pending' && (
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Awaiting action" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Request Modal ── */}
      {selectedReq && (
        <RequestModal
          request={selectedReq}
          onClose={() => setSelectedReq(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}
