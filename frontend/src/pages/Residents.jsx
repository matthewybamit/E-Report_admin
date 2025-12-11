// src/pages/Residents.jsx
import { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  User,
  Download,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle,
  Shield,
  Ban,
  Flag,
  Activity,
  Clock,
  Loader2,
} from 'lucide-react';
import { supabase } from '../config/supabase';


// Status Badge
function StatusBadge({ status }) {
  const styles = {
    active: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
      icon: CheckCircle,
    },
    flagged: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-200',
      icon: Flag,
    },
    suspended: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      icon: Ban,
    },
  };

  const labels = {
    active: 'Active',
    flagged: 'Flagged',
    suspended: 'Suspended',
  };

  const config = styles[status] || styles.active;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      <Icon className="w-3 h-3 mr-1.5" />
      {labels[status] || status}
    </span>
  );
}


// Verified Badge
function VerifiedBadge({ verified }) {
  if (!verified) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
        Unverified
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700">
      <Shield className="w-3 h-3 mr-1" />
      Verified
    </span>
  );
}


// View Resident Modal
function ViewResidentModal({ resident, onClose, onUpdate }) {
  if (!resident) return null;

  const [loading, setLoading] = useState(false);

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const accountAge = Math.floor((new Date() - new Date(resident.created_at)) / (1000 * 60 * 60 * 24));

  // Update resident status
  const updateStatus = async (newStatus) => {
    const confirmMessages = {
      flagged: 'Flag this account for review?',
      suspended: 'Suspend this account? User will lose access to emergency features.',
      active: 'Restore this account to active status?',
    };

    if (!confirm(confirmMessages[newStatus])) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          account_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', resident.id);

      if (error) throw error;

      alert(`Account ${newStatus === 'active' ? 'activated' : newStatus} successfully!`);
      onUpdate(); // Refresh data
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update account status');
    } finally {
      setLoading(false);
    }
  };

  // Verify user
  const verifyUser = async () => {
    if (!confirm('Verify this user? This will add a trust badge to their account.')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          is_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', resident.id);

      if (error) throw error;

      alert('User verified successfully!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error verifying user:', error);
      alert('Failed to verify user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Resident Profile</h2>
              <p className="text-blue-100 text-sm mt-0.5">{resident.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status & Verification */}
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={resident.account_status || 'active'} />
            <VerifiedBadge verified={resident.is_verified} />
            <div className="flex items-center text-sm bg-gray-100 px-3 py-1.5 rounded-lg">
              <Calendar className="w-4 h-4 mr-2 text-gray-500" />
              Registered: {new Date(resident.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center text-sm bg-blue-100 px-3 py-1.5 rounded-lg">
              <Clock className="w-4 h-4 mr-2 text-blue-600" />
              {accountAge} days old
            </div>
          </div>

          {/* Warnings */}
          {!resident.is_verified && resident.account_status === 'active' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-900">Unverified Account - Full Access</p>
                <p className="text-xs text-yellow-700 mt-1">
                  This user has full emergency reporting access. Verify identity to add trust badge.
                </p>
              </div>
            </div>
          )}

          {resident.account_status === 'flagged' && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start space-x-3">
              <Flag className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-900">Account Flagged for Review</p>
                <p className="text-xs text-orange-700 mt-1">
                  Review recent activity before taking action.
                </p>
              </div>
            </div>
          )}

          {resident.account_status === 'suspended' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
              <Ban className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">Account Suspended</p>
                <p className="text-xs text-red-700 mt-1">
                  This user cannot access emergency features.
                </p>
              </div>
            </div>
          )}

          {/* Personal Information */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
              <User className="w-4 h-4 mr-2 text-blue-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Full Name</p>
                <p className="text-sm font-semibold text-gray-900">
                  {resident.full_name || `${resident.first_name || ''} ${resident.last_name || ''}`.trim() || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Date of Birth</p>
                <p className="text-sm font-semibold text-gray-900">
                  {resident.date_of_birth ? new Date(resident.date_of_birth).toLocaleDateString() : 'N/A'}
                </p>
                {resident.date_of_birth && (
                  <p className="text-xs text-gray-500 mt-1">{calculateAge(resident.date_of_birth)} years old</p>
                )}
              </div>
              <div>
                <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Gender</p>
                <p className="text-sm font-semibold text-gray-900">{resident.gender || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Account Type</p>
                <p className="text-sm font-semibold text-gray-900">{resident.account_type || 'resident'}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-5 border border-green-200">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
              <Phone className="w-4 h-4 mr-2 text-green-600" />
              Contact Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-green-600 uppercase font-semibold mb-1">Email</p>
                <a href={`mailto:${resident.email}`} className="text-sm text-green-600 hover:text-green-700 flex items-center font-medium">
                  <Mail className="w-3 h-3 mr-2" />
                  {resident.email || 'N/A'}
                </a>
              </div>
              <div>
                <p className="text-xs text-green-600 uppercase font-semibold mb-1">Phone</p>
                <a href={`tel:${resident.phone}`} className="text-sm text-green-600 hover:text-green-700 flex items-center font-medium">
                  <Phone className="w-3 h-3 mr-2" />
                  {resident.phone || 'N/A'}
                </a>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-5 border border-purple-200">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-purple-600" />
              Address Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Full Address</p>
                <p className="text-sm font-medium text-gray-900">{resident.address || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Purok</p>
                  <p className="text-sm font-semibold text-gray-900">{resident.purok || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Barangay</p>
                  <p className="text-sm font-semibold text-gray-900">{resident.barangay || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Admin Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <div className="flex gap-3 flex-wrap">
            <button 
              onClick={onClose} 
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
              disabled={loading}
            >
              Close
            </button>
            
            {/* Verify if Not Verified */}
            {!resident.is_verified && resident.account_status !== 'suspended' && (
              <button 
                onClick={verifyUser}
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                <span>Verify Identity</span>
              </button>
            )}
            
            {/* Flag if Active */}
            {resident.account_status === 'active' && (
              <button 
                onClick={() => updateStatus('flagged')}
                disabled={loading}
                className="px-4 py-2 flex items-center space-x-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                <Flag className="w-4 h-4" />
                <span>Flag Account</span>
              </button>
            )}
            
            {/* Suspend if Active or Flagged */}
            {(resident.account_status === 'active' || resident.account_status === 'flagged') && (
              <button 
                onClick={() => updateStatus('suspended')}
                disabled={loading}
                className="px-4 py-2 flex items-center space-x-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                <Ban className="w-4 h-4" />
                <span>Suspend</span>
              </button>
            )}
            
            {/* Restore if Suspended or Flagged */}
            {(resident.account_status === 'suspended' || resident.account_status === 'flagged') && (
              <button 
                onClick={() => updateStatus('active')}
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Restore Account</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// Main Component
export default function Residents() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResident, setSelectedResident] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [purokFilter, setPurokFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Fetch residents from Supabase
  const fetchResidents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('account_type', 'resident')
        .order('created_at', { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      if (purokFilter !== 'All') {
        query = query.eq('purok', purokFilter);
      }

      if (statusFilter !== 'All') {
        query = query.eq('account_status', statusFilter);
      }

      // Pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setResidents(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching residents:', error);
      alert('Failed to load residents');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchResidents();
  }, [searchTerm, purokFilter, statusFilter, currentPage]);

  // Stats calculation
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    flagged: 0,
    verified: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: total } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('account_type', 'resident');

        const { count: active } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('account_type', 'resident')
          .eq('account_status', 'active');

        const { count: flagged } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('account_type', 'resident')
          .eq('account_status', 'flagged');

        const { count: verified } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('account_type', 'resident')
          .eq('is_verified', true);

        setStats({
          total: total || 0,
          active: active || 0,
          flagged: flagged || 0,
          verified: verified || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [residents]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Address', 'Purok', 'Status', 'Verified', 'Registered'];
    const csvData = residents.map(r => [
      r.id,
      r.full_name || `${r.first_name || ''} ${r.last_name || ''}`,
      r.email,
      r.phone || '',
      r.address || '',
      r.purok || '',
      r.account_status || 'active',
      r.is_verified ? 'Yes' : 'No',
      new Date(r.created_at).toLocaleDateString(),
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `residents_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleView = (resident) => {
    setSelectedResident(resident);
    setViewModalOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPurokFilter('All');
    setStatusFilter('All');
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <User className="w-8 h-8 text-blue-600 mr-3" />
            Residents Directory
          </h1>
          <p className="text-gray-600 mt-1 font-medium">Monitor registered residents and verify identities</p>
        </div>
        <button 
          onClick={exportToCSV}
          disabled={residents.length === 0}
          className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-all hover:shadow-sm disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>Export List</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Residents', value: stats.total, icon: User, color: 'blue' },
          { label: 'Active Accounts', value: stats.active, icon: CheckCircle, color: 'green' },
          { label: 'Flagged for Review', value: stats.flagged, icon: Flag, color: 'orange' },
          { label: 'Verified Residents', value: stats.verified, icon: Shield, color: 'purple' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`bg-${stat.color}-100 p-3 rounded-xl`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <select
              value={purokFilter}
              onChange={(e) => setPurokFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Purok</option>
              <option value="Purok 1">Purok 1</option>
              <option value="Purok 2">Purok 2</option>
              <option value="Purok 3">Purok 3</option>
              <option value="Purok 4">Purok 4</option>
              <option value="Purok 5">Purok 5</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="flagged">Flagged</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div>
            <button
              onClick={clearFilters}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading residents...</span>
          </div>
        ) : residents.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No residents found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Registered</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {residents.map((resident) => {
                    const fullName = resident.full_name || `${resident.first_name || ''} ${resident.last_name || ''}`.trim() || 'Unknown';
                    const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                    return (
                      <tr key={resident.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{fullName}</p>
                              <p className="text-xs text-gray-500">{resident.gender || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm text-gray-900 flex items-center">
                              <Mail className="w-3 h-3 mr-1 text-gray-400" />
                              {resident.email}
                            </p>
                            {resident.phone && (
                              <p className="text-xs text-gray-500 flex items-center mt-1">
                                <Phone className="w-3 h-3 mr-1 text-gray-400" />
                                {resident.phone}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start text-sm text-gray-600 max-w-xs">
                            <MapPin className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0 mt-0.5" />
                            <span className="truncate">{resident.address || 'N/A'}</span>
                          </div>
                          {resident.purok && (
                            <p className="text-xs text-gray-500 mt-1">{resident.purok}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(resident.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            <StatusBadge status={resident.account_status || 'active'} />
                            <VerifiedBadge verified={resident.is_verified} />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button 
                            onClick={() => handleView(resident)} 
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
                <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, residents.length)}</span> of{' '}
                <span className="font-semibold text-gray-900">{stats.total}</span> results
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">{currentPage}</span>
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

      {/* Modal */}
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
