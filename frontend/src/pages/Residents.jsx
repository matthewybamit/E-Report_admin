// src/pages/Residents.jsx
import { useState, useEffect } from 'react';
import {
  Search, Eye, X, ChevronLeft, ChevronRight, AlertTriangle,
  User, Download, RefreshCw, Phone, Mail, MapPin, Calendar,
  CheckCircle, Shield, Ban, Flag, Clock, Loader2,
} from 'lucide-react';
import { supabase } from '../config/supabase';

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const styles = {
    active:    { classes: 'bg-green-50 text-green-700 border-green-300',   icon: CheckCircle },
    flagged:   { classes: 'bg-amber-50 text-amber-700 border-amber-300',   icon: Flag        },
    suspended: { classes: 'bg-red-50 text-red-700 border-red-300',         icon: Ban         },
  };
  const { classes, icon: Icon } = styles[status] || styles.active;
  const labels = { active: 'Active', flagged: 'Flagged', suspended: 'Suspended' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider ${classes}`}>
      <Icon className="w-3 h-3" />
      {labels[status] || status}
    </span>
  );
}

// ─── Verified Badge ───────────────────────────────────────────────────────────
function VerifiedBadge({ verified }) {
  if (!verified) return (
    <span className="inline-flex items-center px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider bg-slate-50 text-slate-500 border-slate-300">
      Unverified
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border-blue-300">
      <Shield className="w-3 h-3" />Verified
    </span>
  );
}

// ─── View Resident Modal ──────────────────────────────────────────────────────
function ViewResidentModal({ resident, onClose, onUpdate }) {
  if (!resident) return null;
  const [loading, setLoading] = useState(false);

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const accountAge = Math.floor((new Date() - new Date(resident.created_at)) / (1000 * 60 * 60 * 24));

  const updateStatus = async (newStatus) => {
    const confirmMessages = {
      flagged:   'Flag this account for review?',
      suspended: 'Suspend this account? User will lose access to emergency features.',
      active:    'Restore this account to active status?',
    };
    if (!confirm(confirmMessages[newStatus])) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ account_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', resident.id);
      if (error) throw error;
      alert(`Account ${newStatus === 'active' ? 'activated' : newStatus} successfully!`);
      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to update account status');
    } finally {
      setLoading(false);
    }
  };

  const verifyUser = async () => {
    if (!confirm('Verify this user? This will add a trust badge to their account.')) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_verified: true, updated_at: new Date().toISOString() })
        .eq('id', resident.id);
      if (error) throw error;
      alert('User verified successfully!');
      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to verify user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">

        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Resident Profile</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{resident.id?.slice(0, 8)}...</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={resident.account_status || 'active'} />
            <VerifiedBadge verified={resident.is_verified} />
            <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded">
              <Calendar className="w-3.5 h-3.5" />
              Registered: {new Date(resident.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded">
              <Clock className="w-3.5 h-3.5" />
              {accountAge} days old
            </span>
          </div>

          {/* Alert banners */}
          {!resident.is_verified && resident.account_status === 'active' && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">Unverified Account — Full Access</p>
                <p className="text-xs text-amber-700 mt-0.5">This user has full emergency reporting access. Verify identity to add trust badge.</p>
              </div>
            </div>
          )}
          {resident.account_status === 'flagged' && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3.5">
              <Flag className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">Account Flagged for Review</p>
                <p className="text-xs text-amber-700 mt-0.5">Review recent activity before taking action.</p>
              </div>
            </div>
          )}
          {resident.account_status === 'suspended' && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3.5">
              <Ban className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-900 uppercase tracking-wide">Account Suspended</p>
                <p className="text-xs text-red-700 mt-0.5">This user cannot access emergency features.</p>
              </div>
            </div>
          )}

          {/* Personal Information */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Personal Information</p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Full Name</p>
                <p className="text-sm font-semibold text-slate-900">
                  {resident.full_name || `${resident.first_name || ''} ${resident.last_name || ''}`.trim() || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Date of Birth</p>
                <p className="text-sm font-semibold text-slate-900">
                  {resident.date_of_birth ? new Date(resident.date_of_birth).toLocaleDateString() : 'N/A'}
                </p>
                {resident.date_of_birth && (
                  <p className="text-xs text-slate-400 mt-0.5">{calculateAge(resident.date_of_birth)} years old</p>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Gender</p>
                <p className="text-sm font-semibold text-slate-900">{resident.gender || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Account Type</p>
                <p className="text-sm font-semibold text-slate-900">{resident.account_type || 'resident'}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Contact Information</p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Email</p>
                <a href={`mailto:${resident.email}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1.5 font-medium">
                  <Mail className="w-3.5 h-3.5" />{resident.email || 'N/A'}
                </a>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Phone</p>
                <a href={`tel:${resident.phone}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5" />{resident.phone || 'N/A'}
                </a>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Address Information</p>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Full Address</p>
                <p className="text-sm text-slate-800">{resident.address || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Purok</p>
                  <p className="text-sm font-semibold text-slate-900">{resident.purok || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Barangay</p>
                  <p className="text-sm font-semibold text-slate-900">{resident.barangay || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex gap-2 flex-wrap">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          {!resident.is_verified && resident.account_status !== 'suspended' && (
            <button
              onClick={verifyUser}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
              Verify Identity
            </button>
          )}
          {resident.account_status === 'active' && (
            <button
              onClick={() => updateStatus('flagged')}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded transition-colors disabled:opacity-50"
            >
              <Flag className="w-3.5 h-3.5" />Flag Account
            </button>
          )}
          {(resident.account_status === 'active' || resident.account_status === 'flagged') && (
            <button
              onClick={() => updateStatus('suspended')}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
            >
              <Ban className="w-3.5 h-3.5" />Suspend
            </button>
          )}
          {(resident.account_status === 'suspended' || resident.account_status === 'flagged') && (
            <button
              onClick={() => updateStatus('active')}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />Restore Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Residents() {
  const [residents, setResidents]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedResident, setSelectedResident] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm]     = useState('');
  const [purokFilter, setPurokFilter]   = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage]   = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [stats, setStats] = useState({ total: 0, active: 0, flagged: 0, verified: 0 });
  const itemsPerPage = 10;

  const fetchResidents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('account_type', 'resident')
        .order('created_at', { ascending: false });

      if (searchTerm) query = query.or(`full_name.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      if (purokFilter !== 'All')  query = query.eq('purok', purokFilter);
      if (statusFilter !== 'All') query = query.eq('account_status', statusFilter);

      const from = (currentPage - 1) * itemsPerPage;
      query = query.range(from, from + itemsPerPage - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      setResidents(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (err) {
      console.error(err);
      alert('Failed to load residents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResidents(); }, [searchTerm, purokFilter, statusFilter, currentPage]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await supabase
          .from('users')
          .select('account_status, is_verified')
          .eq('account_type', 'resident');
        if (data) {
          setStats({
            total:    data.length,
            active:   data.filter(r => r.account_status === 'active').length,
            flagged:  data.filter(r => r.account_status === 'flagged').length,
            verified: data.filter(r => r.is_verified).length,
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, [residents]);

  const exportToCSV = () => {
    const headers = ['ID','Name','Email','Phone','Address','Purok','Status','Verified','Registered'];
    const csvData = residents.map(r => [
      r.id, r.full_name || `${r.first_name || ''} ${r.last_name || ''}`,
      r.email, r.phone || '', r.address || '', r.purok || '',
      r.account_status || 'active', r.is_verified ? 'Yes' : 'No',
      new Date(r.created_at).toLocaleDateString(),
    ]);
    const csv  = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `residents_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const clearFilters = () => {
    setSearchTerm(''); setPurokFilter('All'); setStatusFilter('All'); setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 uppercase tracking-widest font-semibold">
            <User className="w-3.5 h-3.5" />Residents
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Residents Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monitor registered residents and verify identities</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchResidents}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
          </button>
          <button
            onClick={exportToCSV}
            disabled={residents.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />Export CSV
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Residents',    value: stats.total,    color: 'text-slate-700' },
          { label: 'Active Accounts',    value: stats.active,   color: 'text-green-600' },
          { label: 'Flagged for Review', value: stats.flagged,  color: 'text-amber-600' },
          { label: 'Verified Residents', value: stats.verified, color: 'text-blue-600'  },
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
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Filters</p>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <select value={purokFilter} onChange={e => setPurokFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
            <option value="All">All Purok</option>
            <option value="Purok 1">Purok 1</option>
            <option value="Purok 2">Purok 2</option>
            <option value="Purok 3">Purok 3</option>
            <option value="Purok 4">Purok 4</option>
            <option value="Purok 5">Purok 5</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="flagged">Flagged</option>
            <option value="suspended">Suspended</option>
          </select>
          <button onClick={clearFilters}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors">
            <RefreshCw className="w-4 h-4" />Clear
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
            <User className="w-3.5 h-3.5" />Registered Residents
          </p>
          <span className="text-xs text-slate-400">{stats.total.toLocaleString()} total</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          </div>
        ) : residents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded flex items-center justify-center mx-auto mb-3">
              <User className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">No residents found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200">
                  <tr>
                    {['Name', 'Contact', 'Address', 'Registered', 'Status', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {residents.map((resident) => {
                    const fullName = resident.full_name || `${resident.first_name || ''} ${resident.last_name || ''}`.trim() || 'Unknown';
                    const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                    return (
                      <tr key={resident.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-700 rounded flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{fullName}</p>
                              <p className="text-xs text-slate-400">{resident.gender || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-800 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400" />{resident.email}
                          </p>
                          {resident.phone && (
                            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                              <Phone className="w-3 h-3" />{resident.phone}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          <div className="flex items-start gap-1 text-sm text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                            <span className="truncate">{resident.address || 'N/A'}</span>
                          </div>
                          {resident.purok && (
                            <p className="text-xs text-slate-400 mt-0.5 ml-5">{resident.purok}</p>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">
                          {new Date(resident.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5">
                            <StatusBadge status={resident.account_status || 'active'} />
                            <VerifiedBadge verified={resident.is_verified} />
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <button
                            onClick={() => { setSelectedResident(resident); setViewModalOpen(true); }}
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
                <span className="font-semibold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span>
                {' '}–{' '}
                <span className="font-semibold text-slate-900">{Math.min(currentPage * itemsPerPage, stats.total)}</span>
                {' '}of{' '}
                <span className="font-semibold text-slate-900">{stats.total}</span>
              </p>
              <div className="flex items-center gap-1.5">
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
              </div>
            </div>
          </>
        )}
      </div>

      {viewModalOpen && (
        <ViewResidentModal
          resident={selectedResident}
          onClose={() => setViewModalOpen(false)}
          onUpdate={fetchResidents}
        />
      )}
    </div>
  );
}
