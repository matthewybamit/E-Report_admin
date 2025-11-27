// src/pages/Reports.jsx
import { useState } from 'react';
import {
  Search,
  Eye,
  Edit3,
  Trash2,
  X,
  AlertTriangle,
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
  Navigation,
  CheckCircle,
  AlertCircle,
  Loader,
  XCircle,
  Activity,
  TrendingUp,
  Wrench,
  Heart,
  Shield,
  Leaf,
} from 'lucide-react';

// Mock Reports Data
const mockReports = [
  {
    id: 'RPT-2025-001',
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@email.com',
    phone: '+63 912 345 6789',
    category: 'Infrastructure',
    title: 'Broken street light on Main Street',
    description: 'The street light near the corner has been broken for 3 days. It poses a safety risk for pedestrians at night.',
    location: 'Block 5, Main Street',
    landmark: 'Near Sari-sari store',
    images: ['https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Broken+Light'],
    submittedOn: '2025-11-15',
    status: 'pending',
    priority: 'high',
    assignedTo: '',
    adminNotes: '',
  },
  {
    id: 'RPT-2025-002',
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '+63 923 456 7890',
    category: 'Health',
    title: 'Medical assistance for elderly',
    description: 'My grandmother needs assistance with her regular check-up. She has difficulty walking.',
    location: 'Zone 3, House 12',
    landmark: 'Near basketball court',
    images: [],
    submittedOn: '2025-11-14',
    status: 'in-progress',
    priority: 'urgent',
    assignedTo: 'Barangay Health Worker - Ana Reyes',
    adminNotes: 'Scheduled for November 16, 2025 at 10:00 AM.',
  },
  {
    id: 'RPT-2025-003',
    name: 'Pedro Garcia',
    email: 'pedro.garcia@email.com',
    phone: '+63 934 567 8901',
    category: 'Safety',
    title: 'Noise complaint from construction',
    description: 'Construction work during late hours (past 10 PM) disturbs the neighborhood.',
    location: 'Block 2, Unit 5',
    landmark: 'Behind the chapel',
    images: ['https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Construction'],
    submittedOn: '2025-11-13',
    status: 'resolved',
    priority: 'low',
    assignedTo: 'Barangay Tanod',
    adminNotes: 'Resolved on November 14, 2025.',
  },
  {
    id: 'RPT-2025-004',
    name: 'Ana Lopez',
    email: 'ana.lopez@email.com',
    phone: '+63 945 678 9012',
    category: 'Environment',
    title: 'Illegal dumping of waste',
    description: 'Construction waste dumped on vacant lot. Creates foul smell and attracts pests.',
    location: 'Zone 1, Lot 8',
    landmark: 'Beside old warehouse',
    images: [
      'https://via.placeholder.com/400x300/EF4444/FFFFFF?text=Waste+Dump',
      'https://via.placeholder.com/400x300/DC2626/FFFFFF?text=Location',
    ],
    submittedOn: '2025-11-12',
    status: 'pending',
    priority: 'medium',
    assignedTo: '',
    adminNotes: '',
  },
  {
    id: 'RPT-2025-005',
    name: 'Carlos Reyes',
    email: 'carlos.reyes@email.com',
    phone: '+63 956 789 0123',
    category: 'Infrastructure',
    title: 'Large pothole on road',
    description: 'Large pothole has damaged several vehicles. Worse during rainy days.',
    location: 'Block 7, Avenue A',
    landmark: 'In front of elementary school',
    images: ['https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=Pothole'],
    submittedOn: '2025-11-11',
    status: 'rejected',
    priority: 'low',
    assignedTo: 'Public Works Officer',
    adminNotes: 'Under national jurisdiction. Forwarded to DPWH.',
  },
];

// Status Badge
function StatusBadge({ status }) {
  const config = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', icon: AlertCircle, label: 'Pending' },
    'in-progress': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: Loader, label: 'In Progress' },
    resolved: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: CheckCircle, label: 'Resolved' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: XCircle, label: 'Rejected' },
  };

  const style = config[status];
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

  const style = config[priority];

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${style.bg} ${style.text} ${style.pulse ? 'animate-pulse' : ''}`}>
      {priority.toUpperCase()}
    </span>
  );
}

// Report Card Component
function ReportCard({ report, onView, onEdit, onDelete }) {
  const getInitials = (name) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const categoryIcons = {
    Infrastructure: { icon: Wrench, color: 'blue' },
    Health: { icon: Heart, color: 'red' },
    Safety: { icon: Shield, color: 'purple' },
    Environment: { icon: Leaf, color: 'green' },
  };

  const categoryConfig = categoryIcons[report.category] || categoryIcons.Infrastructure;
  const CategoryIcon = categoryConfig.icon;

  return (
    <div className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-blue-200 overflow-hidden">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl w-12 h-12 flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0">
              {getInitials(report.name)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{report.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{report.id}</p>
            </div>
          </div>
          
          {/* Category Icon */}
          <div className={`bg-${categoryConfig.color}-100 p-2 rounded-xl`}>
            <CategoryIcon className={`w-5 h-5 text-${categoryConfig.color}-600`} />
          </div>
        </div>

        {/* Category & Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
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
            <span className="line-clamp-1">{report.location}</span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            {new Date(report.submittedOn).toLocaleDateString('en-US', {
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
        </div>
      </div>
    </div>
  );
}

// View Report Modal (Redesigned)
function ViewReportModal({ report, onClose }) {
  if (!report) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-6 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{report.title}</h2>
              <p className="text-blue-100 text-sm mt-1">{report.id}</p>
              <div className="flex items-center gap-2 mt-3">
                <StatusBadge status={report.status} />
                <PriorityBadge priority={report.priority} />
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2.5 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
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
                <p className="text-sm font-semibold text-gray-900">{report.name}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Phone</p>
                <a href={`tel:${report.phone}`} className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium">
                  <Phone className="w-3.5 h-3.5 mr-2" />
                  {report.phone}
                </a>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Email</p>
                <a href={`mailto:${report.email}`} className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium">
                  <Mail className="w-3.5 h-3.5 mr-2" />
                  {report.email}
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
                <p className="text-sm font-bold text-gray-900">{report.category}</p>
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
                <p className="text-sm font-medium text-gray-900">{report.location}</p>
              </div>
              <div>
                <p className="text-xs text-green-600 uppercase font-semibold mb-1">Landmark</p>
                <p className="text-sm text-gray-700">{report.landmark}</p>
              </div>
            </div>
          </div>

          {/* Images */}
          {report.images && report.images.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center">
                <ImageIcon className="w-4 h-4 mr-2" />
                Evidence Photos ({report.images.length})
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {report.images.map((image, i) => (
                  <img
                    key={i}
                    src={image}
                    alt={`Evidence ${i + 1}`}
                    className="w-full h-48 object-cover rounded-2xl border-2 border-gray-200 hover:border-blue-400 transition-all"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Admin Notes */}
          {(report.assignedTo || report.adminNotes) && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-6 border-2 border-purple-200">
              <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center">
                <MessageSquare className="w-4 h-4 mr-2 text-purple-600" />
                Admin Information
              </h3>
              {report.assignedTo && (
                <div className="mb-3">
                  <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Assigned To</p>
                  <p className="text-sm font-semibold text-gray-900">{report.assignedTo}</p>
                </div>
              )}
              {report.adminNotes && (
                <div>
                  <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{report.adminNotes}</p>
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
          <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg">
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit Modal (Simplified)
function EditReportModal({ report, onClose }) {
  if (!report) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Update Report</h2>
              <p className="text-sm text-gray-500 mt-1">{report.id}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Status</label>
            <select className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" defaultValue={report.status}>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Priority</label>
            <select className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" defaultValue={report.priority}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Assign To</label>
            <input
              type="text"
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              placeholder="Enter staff name or department"
              defaultValue={report.assignedTo}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Admin Notes</label>
            <textarea
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium leading-relaxed"
              rows="4"
              placeholder="Add internal notes..."
              defaultValue={report.adminNotes}
            ></textarea>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200 px-8 py-5 flex gap-3">
          <button onClick={onClose} className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold transition-all">
            Cancel
          </button>
          <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({ report, onClose }) {
  if (!report) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-2xl mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">Delete Report?</h3>
          <p className="text-gray-600 text-center mb-2">
            Are you sure you want to delete this report?
          </p>
          <p className="text-gray-900 font-bold text-center mb-8">
            {report.id}
          </p>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-5 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold transition-all">
              Cancel
            </button>
            <button className="flex-1 px-5 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold transition-all shadow-lg">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function Reports() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const handleView = (report) => {
    setSelectedReport(report);
    setViewModalOpen(true);
  };

  const handleEdit = (report) => {
    setSelectedReport(report);
    setEditModalOpen(true);
  };

  const handleDelete = (report) => {
    setSelectedReport(report);
    setDeleteModalOpen(true);
  };

  const stats = [
    { label: 'Total Reports', value: mockReports.length, icon: FileText, gradient: 'from-blue-500 to-blue-600', filter: 'All' },
    { label: 'Pending', value: mockReports.filter((r) => r.status === 'pending').length, icon: AlertCircle, gradient: 'from-yellow-500 to-amber-600', filter: 'pending' },
    { label: 'In Progress', value: mockReports.filter((r) => r.status === 'in-progress').length, icon: Loader, gradient: 'from-blue-500 to-blue-600', filter: 'in-progress' },
    { label: 'Resolved', value: mockReports.filter((r) => r.status === 'resolved').length, icon: CheckCircle, gradient: 'from-green-500 to-green-600', filter: 'resolved' },
    { label: 'Rejected', value: mockReports.filter((r) => r.status === 'rejected').length, icon: XCircle, gradient: 'from-red-500 to-red-600', filter: 'rejected' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-[1800px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Concern Reports</h1>
                <p className="text-gray-600 mt-1 font-medium">Resident Issue Management System</p>
              </div>
            </div>
          </div>

          <button className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold transition-all shadow-sm">
            <Download className="w-4 h-4" />
            <span>Export Reports</span>
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat, i) => (
            <button
              key={i}
              onClick={() => setStatusFilter(stat.filter)}
              className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all border-2 border-gray-100 hover:border-blue-200 text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`bg-gradient-to-br ${stat.gradient} p-2.5 rounded-xl shadow-lg`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input
            type="text"
            placeholder="Search reports by name, title, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-5 py-5 text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-md bg-white"
          />
        </div>

        {/* Pill Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100 space-y-5">
          {/* Status Pills */}
          <div>
            <p className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Status</p>
            <div className="flex flex-wrap gap-2">
              {['All', 'pending', 'in-progress', 'resolved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'All' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Category Pills */}
          <div>
            <p className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Category</p>
            <div className="flex flex-wrap gap-2">
              {['All', 'Infrastructure', 'Health', 'Safety', 'Environment'].map((category) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    categoryFilter === category
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Report Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      {viewModalOpen && <ViewReportModal report={selectedReport} onClose={() => setViewModalOpen(false)} />}
      {editModalOpen && <EditReportModal report={selectedReport} onClose={() => setEditModalOpen(false)} />}
      {deleteModalOpen && <DeleteConfirmModal report={selectedReport} onClose={() => setDeleteModalOpen(false)} />}
    </div>
  );
}
