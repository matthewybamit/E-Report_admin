// src/pages/Reports.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import {
  Search,
  Eye,
  Edit3,
  Trash2,
  X,
  FileText,
  MapPin,
  Clock,
  User,
  Download,
  RefreshCw,
  Phone,
  Mail,
  Image as ImageIcon,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Loader as LoaderIcon,
  XCircle,
  TrendingUp,
  Wrench,
  Heart,
  Shield,
  Leaf,
  AlertTriangle,
  Save,
  Maximize2 // Added for the hover effect icon
} from 'lucide-react';

// Status Badge
function StatusBadge({ status }) {
  const config = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', icon: AlertCircle, label: 'Pending' },
    'in-progress': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: LoaderIcon, label: 'In Progress' },
    resolved: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: CheckCircle, label: 'Resolved' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: XCircle, label: 'Rejected' },
  };

  const style = config[status] || config.pending;
  const Icon = style.icon;

  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}>
      <Icon className="w-3.5 h-3.5 mr-1.5" />
      {style.label}
    </span>
  );
}

// Priority Badge
function PriorityBadge({ priority }) {
  const config = {
    low: { bg: 'bg-gray-500', text: 'text-white' },
    medium: { bg: 'bg-orange-500', text: 'text-white' },
    high: { bg: 'bg-red-500', text: 'text-white' },
    urgent: { bg: 'bg-red-600', text: 'text-white', pulse: true },
  };

  const style = config[priority] || config.low;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${style.bg} ${style.text} ${style.pulse ? 'animate-pulse' : ''}`}>
      {priority ? priority.toUpperCase() : 'LOW'}
    </span>
  );
}

// Report Card Component
function ReportCard({ report, onView, onEdit, onDelete, canEdit }) {
  const getInitials = (name) => {
    return name ? name.split(' ').map((n) => n[0]).join('').toUpperCase() : '??';
  };

  const categoryIcons = {
    infrastructure: { icon: Wrench, color: 'blue' },
    health: { icon: Heart, color: 'red' },
    security: { icon: Shield, color: 'purple' },
    environment: { icon: Leaf, color: 'green' },
    sanitation: { icon: AlertTriangle, color: 'yellow' },
    noise: { icon: AlertCircle, color: 'orange' },
    waste: { icon: Leaf, color: 'green' },
    streetlights: { icon: Wrench, color: 'blue' },
    other: { icon: FileText, color: 'gray' },
  };

  const categoryConfig = categoryIcons[report.category] || categoryIcons.other;
  const CategoryIcon = categoryConfig.icon;

  return (
    <div className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-blue-200 overflow-hidden">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl w-12 h-12 flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0">
              {getInitials(report.reporter_name)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{report.reporter_name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{report.report_number}</p>
            </div>
          </div>
          
          <div className={`bg-${categoryConfig.color}-100 p-2 rounded-xl`}>
            <CategoryIcon className={`w-5 h-5 text-${categoryConfig.color}-600`} />
          </div>
        </div>

        {/* Category & Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full capitalize">
            {report.category}
          </span>
          <PriorityBadge priority={report.priority} />
          <StatusBadge status={report.status} />
        </div>

        {/* Title */}
        <div>
          <h4 className="text-base font-bold text-gray-900 line-clamp-2 leading-tight">
            {report.title}
          </h4>
        </div>

        {/* Location & Date */}
        <div className="space-y-2 pt-3 border-t border-gray-100">
          <div className="flex items-start text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1">{report.location || 'No location provided'}</span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            {new Date(report.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => onView(report)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all text-sm shadow-sm"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
          
          {/* Only show Edit/Delete buttons if canEdit is true */}
          {canEdit && (
            <>
              <button
                onClick={() => onEdit(report)}
                className="p-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(report)}
                className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// View Report Modal
function ViewReportModal({ report, onClose, onEditStatus, canEdit }) {
  // State for Image Lightbox
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  if (!report) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-6 z-10">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{report.title}</h2>
                <p className="text-blue-100 text-sm mt-1">{report.report_number}</p>
                <div className="flex items-center gap-2 mt-3">
                  <StatusBadge status={report.status} />
                  <PriorityBadge priority={report.priority} />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
              

                  <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white hover:bg-white/20 p-2.5 rounded-xl transition-all"
                  >
                  <X className="w-6 h-6" />
                  </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Reporter Info */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 border-2 border-blue-200">
              <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center">
                <User className="w-4 h-4 mr-2 text-blue-600" />
                Reporter Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Name</p>
                  <p className="text-sm font-semibold text-gray-900">{report.reporter_name}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Phone</p>
                  <a href={`tel:${report.reporter_phone}`} className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium">
                    <Phone className="w-3.5 h-3.5 mr-2" />
                    {report.reporter_phone || 'N/A'}
                  </a>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Email</p>
                  <a href={`mailto:${report.reporter_email}`} className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium">
                    <Mail className="w-3.5 h-3.5 mr-2" />
                    {report.reporter_email}
                  </a>
                </div>
              </div>
            </div>

            {/* Report Details */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-6 border-2 border-gray-200">
              <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center">
                <FileText className="w-4 h-4 mr-2 text-gray-600" />
                Report Details
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Category</p>
                  <p className="text-sm font-bold text-gray-900 capitalize">{report.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{report.description}</p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-6 border-2 border-green-200">
              <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-green-600" />
                Location
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-green-600 uppercase font-semibold mb-1">Address</p>
                  <p className="text-sm font-medium text-gray-900">{report.location || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-green-600 uppercase font-semibold mb-1">Landmark</p>
                  <p className="text-sm text-gray-700">{report.landmark || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Image with Zoom Feature */}
            {report.image_url && (
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Evidence Photo
                  </div>
                  <span className="text-xs text-blue-600 font-normal flex items-center">
                    <Maximize2 className="w-3 h-3 mr-1"/> Click to enlarge
                  </span>
                </h3>
                {/* Constrained Preview Image */}
                <div 
                  onClick={() => setIsImageZoomed(true)}
                  className="relative group cursor-zoom-in overflow-hidden rounded-2xl border-2 border-gray-200 hover:border-blue-400 transition-all"
                >
                  <img
                    src={report.image_url}
                    alt="Report evidence"
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  </div>
                </div>
              </div>
            )}

            {/* Admin Notes */}
            {(report.assigned_to || report.admin_notes) && (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-6 border-2 border-purple-200">
                <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2 text-purple-600" />
                  Admin Information
                </h3>
                {report.assigned_to && (
                  <div className="mb-3">
                    <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Assigned To</p>
                    <p className="text-sm font-semibold text-gray-900">{report.assigned_to}</p>
                  </div>
                )}
                {report.admin_notes && (
                  <div>
                    <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Notes</p>
                    <p className="text-sm text-gray-700">{report.admin_notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200 px-8 py-5 flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold transition-all"
            >
              Close
            </button>
                {/* New "Update Status" Button */}
                  {canEdit && (
                      <button
                          onClick={() => onEditStatus(report)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
                      >
                          <Edit3 className="w-4 h-4" />
                          Update Status
                      </button>
                  )}
          </div>
        </div>
      </div>

      {/* Full Screen Image Lightbox (Z-Index > Modal) */}
      {isImageZoomed && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsImageZoomed(false)}
        >
          <button 
            className="absolute top-6 right-6 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all"
            onClick={() => setIsImageZoomed(false)}
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={report.image_url} 
            alt="Evidence Full View" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image itself
          />
        </div>
      )}
    </>
  );
}

// Edit Report Modal
function EditReportModal({ report, onClose, onSave }) {
  const [formData, setFormData] = useState({
    status: report.status,
    priority: report.priority,
    assigned_to: report.assigned_to || '',
    admin_notes: report.admin_notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(report.id, formData);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Edit Report</h2>
              <p className="text-blue-100 text-sm mt-1">{report.report_number}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2.5 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-8 space-y-6">
          {/* Status */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Assigned To</label>
            <input
              type="text"
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              placeholder="Enter name or department"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Admin Notes */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Admin Notes</label>
            <textarea
              value={formData.admin_notes}
              onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
              placeholder="Add notes about this report..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t-2 border-gray-200 px-8 py-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <LoaderIcon className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Reports Component
export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // PERMISSION CHECK: Allow all logged-in users to edit/delete
  // Matches your "Announcements-style" SQL policy
  const canEdit = true; 

  // Fetch reports from Supabase
  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      // alert('Failed to fetch reports'); // Optional: Silent fail is often better for UX
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('reports-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchReports();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle view report
  const handleView = (report) => {
    setSelectedReport(report);
    setViewModalOpen(true);
  };

  // Handle edit report
  const handleEdit = (report) => {
    setSelectedReport(report);
    setEditModalOpen(true);
  };

  // Handle save edit
  const handleSaveEdit = async (reportId, updates) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update(updates)
        .eq('id', reportId);

      if (error) throw error;

      alert('Report updated successfully!');
      setEditModalOpen(false);
      fetchReports();
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Failed to update report');
    }
  };
  
  // Handle delete report
  const handleDelete = async (report) => {
    if (!window.confirm(`Are you sure you want to delete report ${report.report_number}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', report.id);

      if (error) throw error;

      alert('Report deleted successfully');
      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report');
    }
  };

  // Filter reports
  const filteredReports = reports.filter((report) => {
    const matchesSearch = 
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.report_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reporter_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || report.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Stats
  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'pending').length,
    inProgress: reports.filter((r) => r.status === 'in-progress').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Reports Management</h1>
            <p className="text-gray-600 mt-2">Manage and track community reports</p>
          </div>
          <button
            onClick={fetchReports}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold">Total Reports</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold">In Progress</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.inProgress}</p>
              </div>
              <LoaderIcon className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold">Resolved</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="sanitation">Sanitation</option>
            <option value="security">Security</option>
            <option value="environment">Environment</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="noise">Noise Complaint</option>
            <option value="waste">Waste Management</option>
            <option value="streetlights">Street Lights</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoaderIcon className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-md">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No reports found</h3>
          <p className="text-gray-600">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              canEdit={canEdit} // Pass permission state down
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {viewModalOpen && (
        <ViewReportModal
          report={selectedReport}
          onClose={() => setViewModalOpen(false)}
          canEdit={canEdit}
          onEditStatus={(report) => {
            setViewModalOpen(false); // Close view modal
            handleEdit(report);      // Open edit modal
          }}
        />
      )}

      {editModalOpen && (
        <EditReportModal
          report={selectedReport}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
