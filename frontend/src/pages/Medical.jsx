// src/pages/Medical.jsx
import { useState } from 'react';
import {
  Search,
  X,
  Heart,
  MapPin,
  Clock,
  User,
  Download,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  Pill,
  Stethoscope,
  Activity,
  CheckCircle,
  AlertCircle,
  Loader,
  Eye,
  Edit3,
  MoreVertical,
  ChevronRight,
  FileText,
  Plus,
  Zap,
  UserCheck,
  Users,
  AlertTriangle,
} from 'lucide-react';

// Mock Medical Requests Data
const mockMedicalRequests = [
  {
    id: 'MED-2025-001',
    patientName: 'Maria Santos',
    age: 67,
    contactPerson: 'Juan Santos (Son)',
    email: 'juan.santos@email.com',
    phone: '+63 912 345 6789',
    requestType: 'Home Check-up',
    medicalConcern: 'High Blood Pressure Monitoring',
    description: 'My mother needs regular blood pressure monitoring. She has difficulty walking to the health center.',
    location: 'Zone 3, House 12, Purok 2',
    landmark: 'Near basketball court',
    preferredDate: '2025-11-18',
    preferredTime: '10:00 AM',
    urgency: 'medium',
    submittedOn: '2025-11-15T14:30:00',
    status: 'pending',
    assignedTo: '',
    appointmentDate: '',
    adminNotes: '',
  },
  {
    id: 'MED-2025-002',
    patientName: 'Lola Remedios Cruz',
    age: 82,
    contactPerson: 'Ana Cruz (Granddaughter)',
    email: 'ana.cruz@email.com',
    phone: '+63 923 456 7890',
    requestType: 'Medication Assistance',
    medicalConcern: 'Diabetes Medication Refill',
    description: 'Need assistance getting diabetes medication. Unable to go to pharmacy due to mobility issues.',
    location: 'Block 5, Street 3, House 45',
    landmark: 'Beside the chapel',
    preferredDate: '2025-11-17',
    preferredTime: '2:00 PM',
    urgency: 'high',
    submittedOn: '2025-11-14T09:15:00',
    status: 'scheduled',
    assignedTo: 'Barangay Health Worker - Rosa Martinez',
    appointmentDate: '2025-11-17T14:00:00',
    adminNotes: 'Medication delivery scheduled for November 17, 2025.',
  },
  {
    id: 'MED-2025-003',
    patientName: 'Pedro Garcia',
    age: 45,
    contactPerson: 'Self',
    email: 'pedro.garcia@email.com',
    phone: '+63 934 567 8901',
    requestType: 'Vaccination',
    medicalConcern: 'Flu Vaccination Request',
    description: 'Requesting flu vaccination for this season. Have comorbidities (hypertension).',
    location: 'Zone 1, Lot 8, Corner Lot',
    landmark: 'Near sari-sari store',
    preferredDate: '2025-11-20',
    preferredTime: 'Any time',
    urgency: 'low',
    submittedOn: '2025-11-13T16:45:00',
    status: 'completed',
    assignedTo: 'Barangay Health Worker - Ana Reyes',
    appointmentDate: '2025-11-14T10:00:00',
    adminNotes: 'Vaccination completed on November 14, 2025.',
  },
  {
    id: 'MED-2025-004',
    patientName: 'Baby Angel Lopez',
    age: 3,
    contactPerson: 'Rosa Lopez (Mother)',
    email: 'rosa.lopez@email.com',
    phone: '+63 945 678 9012',
    requestType: 'Immunization',
    medicalConcern: 'MMR Vaccine',
    description: 'Need to complete immunization schedule for my 3-year-old daughter.',
    location: 'Block 2, Unit 5',
    landmark: 'Behind elementary school',
    preferredDate: '2025-11-19',
    preferredTime: '9:00 AM',
    urgency: 'medium',
    submittedOn: '2025-11-12T11:20:00',
    status: 'scheduled',
    assignedTo: 'Barangay Health Worker - Ana Reyes',
    appointmentDate: '2025-11-19T09:00:00',
    adminNotes: 'Scheduled for November 19, 2025 at 9:00 AM.',
  },
  {
    id: 'MED-2025-005',
    patientName: 'Carlos Reyes',
    age: 55,
    contactPerson: 'Self',
    email: 'carlos.reyes@email.com',
    phone: '+63 956 789 0123',
    requestType: 'Medical Consultation',
    medicalConcern: 'Persistent Cough and Fever',
    description: 'Have been experiencing cough and low-grade fever for 3 days. Need medical consultation.',
    location: 'Zone 4, Avenue A, House 15',
    landmark: 'Near highway',
    preferredDate: '2025-11-16',
    preferredTime: 'ASAP',
    urgency: 'urgent',
    submittedOn: '2025-11-15T08:30:00',
    status: 'in-progress',
    assignedTo: 'Barangay Health Worker - Rosa Martinez',
    appointmentDate: '2025-11-16T10:00:00',
    adminNotes: 'Home visit scheduled for today at 10:00 AM.',
  },
];

// Time ago helper
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

// Urgency Badge
function UrgencyBadge({ urgency }) {
  const config = {
    low: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', icon: Activity },
    medium: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', icon: AlertCircle },
    high: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', icon: AlertTriangle },
    urgent: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600', icon: Zap, pulse: true },
  };

  const style = config[urgency];
  const Icon = style.icon;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${style.bg} ${style.text} ${style.border} ${
        style.pulse ? 'animate-pulse' : ''
      }`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {urgency.toUpperCase()}
    </span>
  );
}

// Status Badge
function StatusBadge({ status }) {
  const config = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', icon: AlertCircle, label: 'Pending' },
    scheduled: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: Calendar, label: 'Scheduled' },
    'in-progress': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', icon: Loader, label: 'In Progress' },
    completed: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: CheckCircle, label: 'Completed' },
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

// Medical Request Card
function MedicalCard({ request, onClick }) {
  const getInitials = (name) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  return (
    <div
      onClick={() => onClick(request)}
      className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-green-200 cursor-pointer overflow-hidden"
    >
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl w-14 h-14 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
            {getInitials(request.patientName)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-green-600 transition-colors">
              {request.patientName}
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">
              {request.age} years • {request.contactPerson}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <UrgencyBadge urgency={request.urgency} />
              <StatusBadge status={request.status} />
            </div>
          </div>

          {/* Time */}
          <div className="text-right flex-shrink-0">
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              {timeAgo(request.submittedOn)}
            </div>
          </div>
        </div>

        {/* Request Info */}
        <div className="space-y-2 pt-3 border-t border-gray-100">
          <div className="flex items-center text-sm">
            <Stethoscope className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
            <span className="font-semibold text-gray-900">{request.requestType}</span>
          </div>
          <div className="flex items-start text-sm">
            <Heart className="w-4 h-4 mr-2 text-red-500 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 line-clamp-1">{request.medicalConcern}</span>
          </div>
          {request.location && (
            <div className="flex items-start text-sm">
              <MapPin className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-600 text-xs line-clamp-1">{request.location}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            {new Date(request.preferredDate).toLocaleDateString()}
          </div>
          <button className="flex items-center text-sm font-bold text-green-600 hover:text-green-700 transition-colors">
            View Details
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Slide-in Panel
function ViewMedicalPanel({ request, onClose }) {
  if (!request) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-300">
      <div
        className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 px-8 py-6 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{request.patientName}</h2>
              <p className="text-green-100 text-sm mt-1">{request.id}</p>
              <div className="flex items-center gap-2 mt-3">
                <UrgencyBadge urgency={request.urgency} />
                <StatusBadge status={request.status} />
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
          {/* Patient Info */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 border-2 border-blue-200">
            <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center">
              <User className="w-4 h-4 mr-2 text-blue-600" />
              Patient Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Age</p>
                <p className="text-sm font-semibold text-gray-900">{request.age} years old</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Contact Person</p>
                <p className="text-sm font-semibold text-gray-900">{request.contactPerson}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Phone</p>
                <a
                  href={`tel:${request.phone}`}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium"
                >
                  <Phone className="w-3.5 h-3.5 mr-2" />
                  {request.phone}
                </a>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Email</p>
                <a
                  href={`mailto:${request.email}`}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium"
                >
                  <Mail className="w-3.5 h-3.5 mr-2" />
                  {request.email}
                </a>
              </div>
            </div>
          </div>

          {/* Medical Details */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
            <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center">
              <Stethoscope className="w-4 h-4 mr-2 text-green-600" />
              Medical Request Details
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-green-600 uppercase font-semibold mb-1">Request Type</p>
                <p className="text-sm font-bold text-gray-900 flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-green-600" />
                  {request.requestType}
                </p>
              </div>
              <div>
                <p className="text-xs text-green-600 uppercase font-semibold mb-1">Medical Concern</p>
                <p className="text-base font-bold text-gray-900">{request.medicalConcern}</p>
              </div>
              <div>
                <p className="text-xs text-green-600 uppercase font-semibold mb-1">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed">{request.description}</p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
            <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-gray-600" />
              Location
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Address</p>
                <p className="text-sm font-medium text-gray-900">{request.location}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Landmark</p>
                <p className="text-sm text-gray-700">{request.landmark}</p>
              </div>
              {/* Map Placeholder */}
              <div className="bg-gray-200 rounded-xl h-40 flex items-center justify-center mt-4">
                <MapPin className="w-12 h-12 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-6 border-2 border-purple-200">
            <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-purple-600" />
              Preferred Schedule
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Date</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(request.preferredDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Time</p>
                <p className="text-sm font-semibold text-gray-900">{request.preferredTime}</p>
              </div>
            </div>
          </div>

          {/* Admin Info */}
          {(request.assignedTo || request.adminNotes || request.appointmentDate) && (
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl p-6 border-2 border-indigo-200">
              <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center">
                <FileText className="w-4 h-4 mr-2 text-indigo-600" />
                Assignment & Notes
              </h3>
              <div className="space-y-3">
                {request.assignedTo && (
                  <div>
                    <p className="text-xs text-indigo-600 uppercase font-semibold mb-1">Assigned To</p>
                    <p className="text-sm font-semibold text-gray-900">{request.assignedTo}</p>
                  </div>
                )}
                {request.appointmentDate && (
                  <div>
                    <p className="text-xs text-indigo-600 uppercase font-semibold mb-1">Appointment</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(request.appointmentDate).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
                {request.adminNotes && (
                  <div>
                    <p className="text-xs text-indigo-600 uppercase font-semibold mb-1">Notes</p>
                    <p className="text-sm text-gray-700">{request.adminNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200 px-8 py-5 flex gap-3">
          <button
            onClick={onClose}
            className="px-5 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold transition-all"
          >
            Close
          </button>
          {request.status === 'pending' && (
            <button className="flex-1 px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold transition-all shadow-lg">
              Schedule Appointment
            </button>
          )}
          {request.status === 'scheduled' && (
            <button className="flex-1 px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 font-bold transition-all shadow-lg">
              Mark In Progress
            </button>
          )}
          {request.status === 'in-progress' && (
            <button className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-bold transition-all shadow-lg">
              Mark Completed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function Medical() {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setPanelOpen(true);
  };

  const stats = [
    { label: 'Total Requests', value: mockMedicalRequests.length, icon: Heart, gradient: 'from-green-500 to-emerald-600', filter: 'All' },
    { label: 'Pending', value: mockMedicalRequests.filter((r) => r.status === 'pending').length, icon: AlertCircle, gradient: 'from-yellow-500 to-amber-600', filter: 'pending' },
    { label: 'Scheduled', value: mockMedicalRequests.filter((r) => r.status === 'scheduled').length, icon: Calendar, gradient: 'from-blue-500 to-blue-600', filter: 'scheduled' },
    { label: 'In Progress', value: mockMedicalRequests.filter((r) => r.status === 'in-progress').length, icon: Loader, gradient: 'from-purple-500 to-purple-600', filter: 'in-progress' },
    { label: 'Completed', value: mockMedicalRequests.filter((r) => r.status === 'completed').length, icon: CheckCircle, gradient: 'from-green-500 to-green-600', filter: 'completed' },
    { label: 'Urgent', value: mockMedicalRequests.filter((r) => r.urgency === 'urgent').length, icon: Zap, gradient: 'from-red-500 to-red-600', filter: 'urgent' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-[1800px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-4 rounded-2xl shadow-lg">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Medical Assistance</h1>
                <p className="text-gray-600 mt-1 font-medium">Health Request Management System</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold transition-all shadow-sm">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold transition-all shadow-lg">
              <Plus className="w-4 h-4" />
              <span>New Request</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat, i) => (
            <button
              key={i}
              onClick={() => setStatusFilter(stat.filter)}
              className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all border-2 border-gray-100 hover:border-green-200 text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`bg-gradient-to-br ${stat.gradient} p-2.5 rounded-xl shadow-lg`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-bold"
            >
              <option value="All">All Types</option>
              <option value="Home Check-up">Home Check-up</option>
              <option value="Medication Assistance">Medication</option>
              <option value="Vaccination">Vaccination</option>
              <option value="Immunization">Immunization</option>
              <option value="Medical Consultation">Consultation</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-bold"
            >
              <option value="All">All Status</option>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            {/* Urgency Chips */}
            <div className="flex gap-2">
              {['all', 'low', 'medium', 'high', 'urgent'].map((level) => (
                <button
                  key={level}
                  onClick={() => setUrgencyFilter(level)}
                  className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                    urgencyFilter === level
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Medical Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockMedicalRequests.map((request) => (
            <MedicalCard key={request.id} request={request} onClick={handleViewRequest} />
          ))}
        </div>
      </div>

      {/* Slide-in Panel */}
      {panelOpen && <ViewMedicalPanel request={selectedRequest} onClose={() => setPanelOpen(false)} />}
    </div>
  );
}
