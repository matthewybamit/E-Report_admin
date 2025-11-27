// src/pages/Emergency.jsx
import { useState } from 'react';
import {
  AlertTriangle,
  Phone,
  MapPin,
  Clock,
  User,
  X,
  CheckCircle,
  XCircle,
  Navigation,
  Ambulance,
  Flame,          // ← Changed from Fire
  Shield,
  Heart,
  Zap,
  MessageSquare,
  Eye,
  ArrowRight,
  RefreshCw,
  Filter,
} from 'lucide-react';

// Mock Emergency Data
const mockEmergencies = [
  {
    id: 'EMG-2025-001',
    type: 'Medical',
    severity: 'critical',
    reporter: 'Maria Santos',
    phone: '+63 912 345 6789',
    location: 'Zone 3, House 12, Barangay Central',
    coordinates: { lat: 14.5995, lng: 120.9842 },
    description: 'Elderly person having difficulty breathing, needs immediate medical attention',
    reportedAt: '2025-11-16T16:35:00',
    status: 'active',
    respondedBy: null,
    estimatedTime: '5 mins',
  },
  {
    id: 'EMG-2025-002',
    type: 'Fire',
    severity: 'urgent',
    reporter: 'Juan Dela Cruz',
    phone: '+63 923 456 7890',
    location: 'Block 5, Main Street, Near Market',
    coordinates: { lat: 14.6000, lng: 120.9850 },
    description: 'Small fire at residential area, smoke visible from neighbors',
    reportedAt: '2025-11-16T16:28:00',
    status: 'responding',
    respondedBy: 'Fire Station Alpha',
    estimatedTime: '3 mins',
  },
  {
    id: 'EMG-2025-003',
    type: 'Crime',
    severity: 'high',
    reporter: 'Pedro Garcia',
    phone: '+63 934 567 8901',
    location: 'Block 2, Unit 5, Corner Lot',
    coordinates: { lat: 14.5990, lng: 120.9835 },
    description: 'Suspicious activity reported, possible break-in attempt',
    reportedAt: '2025-11-16T16:15:00',
    status: 'active',
    respondedBy: null,
    estimatedTime: '8 mins',
  },
  {
    id: 'EMG-2025-004',
    type: 'Accident',
    severity: 'medium',
    reporter: 'Ana Lopez',
    phone: '+63 945 678 9012',
    location: 'Zone 1, Highway Junction',
    coordinates: { lat: 14.6005, lng: 120.9845 },
    description: 'Vehicle collision, minor injuries reported',
    reportedAt: '2025-11-16T16:10:00',
    status: 'resolved',
    respondedBy: 'Ambulance Unit 2',
    resolvedAt: '2025-11-16T16:40:00',
  },
  {
    id: 'EMG-2025-005',
    type: 'Medical',
    severity: 'high',
    reporter: 'Carlos Reyes',
    phone: '+63 956 789 0123',
    location: 'Block 7, Avenue A, House 15',
    coordinates: { lat: 14.5985, lng: 120.9838 },
    description: 'Person collapsed, appears unconscious',
    reportedAt: '2025-11-16T15:55:00',
    status: 'responding',
    respondedBy: 'Ambulance Unit 1',
    estimatedTime: '2 mins',
  },
];

// Severity Badge Component
function SeverityBadge({ severity }) {
  const styles = {
    critical: 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50',
    urgent: 'bg-red-600 text-white shadow-md',
    high: 'bg-orange-500 text-white shadow-sm',
    medium: 'bg-yellow-500 text-white shadow-sm',
    low: 'bg-blue-500 text-white shadow-sm',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${styles[severity]}`}>
      {severity === 'critical' && <Zap className="w-3 h-3 mr-1" />}
      {severity}
    </span>
  );
}

// Status Badge Component
function StatusBadge({ status }) {
  const styles = {
    active: 'bg-red-100 text-red-800 border-red-200',
    responding: 'bg-blue-100 text-blue-800 border-blue-200',
    resolved: 'bg-green-100 text-green-800 border-green-200',
  };

  const labels = {
    active: 'Active',
    responding: 'Responding',
    resolved: 'Resolved',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
        status === 'active' ? 'bg-red-500 animate-pulse' :
        status === 'responding' ? 'bg-blue-500 animate-pulse' :
        'bg-green-500'
      }`}></span>
      {labels[status]}
    </span>
  );
}

// Emergency Type Icon
// Emergency Type Icon (around line 120-135)
function EmergencyIcon({ type }) {
  const icons = {
    Medical: { icon: Ambulance, color: 'text-red-600', bg: 'bg-red-100' },
    Fire: { icon: Flame, color: 'text-orange-600', bg: 'bg-orange-100' },  // ← Changed
    Crime: { icon: Shield, color: 'text-purple-600', bg: 'bg-purple-100' },
    Accident: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  };

  const { icon: Icon, color, bg } = icons[type] || icons.Medical;

  return (
    <div className={`p-3 rounded-xl ${bg}`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
  );
}


// Emergency Detail Modal
function EmergencyDetailModal({ emergency, onClose }) {
  if (!emergency) return null;

  const timeAgo = (date) => {
    const minutes = Math.floor((new Date() - new Date(date)) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="sticky top-0 bg-linear-to-r from-red-600 to-red-700 px-6 py-5 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Emergency Alert</h2>
              <p className="text-red-100 text-sm mt-0.5">{emergency.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Status & Severity */}
          <div className="flex items-center gap-3 flex-wrap">
            <SeverityBadge severity={emergency.severity} />
            <StatusBadge status={emergency.status} />
            <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
              <Clock className="w-4 h-4 mr-2" />
              {timeAgo(emergency.reportedAt)}
            </div>
          </div>

          {/* Emergency Type */}
          <div className="bg-linear-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center space-x-4">
              <EmergencyIcon type={emergency.type} />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Emergency Type</p>
                <p className="text-lg font-bold text-gray-900">{emergency.type} Emergency</p>
              </div>
            </div>
          </div>

          {/* Reporter Information */}
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
              <User className="w-4 h-4 mr-2 text-blue-600" />
              Reporter Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Name</p>
                <p className="text-sm font-semibold text-gray-900">{emergency.reporter}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Contact</p>
                <a href={`tel:${emergency.phone}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center">
                  <Phone className="w-3 h-3 mr-1" />
                  {emergency.phone}
                </a>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-green-50 rounded-xl p-5 border border-green-100">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-green-600" />
              Location
            </h3>
            <p className="text-sm font-medium text-gray-900 mb-3">{emergency.location}</p>
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors shadow-sm">
                <Navigation className="w-4 h-4" />
                <span>Get Directions</span>
              </button>
              <button className="px-4 py-2.5 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 font-semibold transition-colors">
                View Map
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-gray-600" />
              Emergency Description
            </h3>
            <p className="text-sm text-gray-900 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-200">
              {emergency.description}
            </p>
          </div>

          {/* Response Info */}
          {emergency.respondedBy && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 uppercase tracking-wide font-semibold mb-1">Responding Unit</p>
                  <p className="text-sm font-bold text-gray-900">{emergency.respondedBy}</p>
                </div>
                {emergency.estimatedTime && (
                  <div className="bg-blue-100 px-4 py-2 rounded-lg">
                    <p className="text-xs text-blue-600 font-semibold">ETA</p>
                    <p className="text-lg font-bold text-blue-700">{emergency.estimatedTime}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 rounded-b-2xl">
          {emergency.status === 'active' && (
            <>
              <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Dispatch Response Team</span>
              </button>
              <button className="px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors">
                <Phone className="w-4 h-4" />
              </button>
            </>
          )}
          {emergency.status === 'responding' && (
            <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors shadow-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Mark as Resolved</span>
            </button>
          )}
          {emergency.status === 'resolved' && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Emergency Page
export default function Emergency() {
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterSeverity, setFilterSeverity] = useState('All');

  const handleView = (emergency) => {
    setSelectedEmergency(emergency);
    setModalOpen(true);
  };

  const activeCount = mockEmergencies.filter(e => e.status === 'active').length;
  const respondingCount = mockEmergencies.filter(e => e.status === 'responding').length;
  const criticalCount = mockEmergencies.filter(e => e.severity === 'critical').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header Section with Alert */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
              Emergency Management
            </h1>
            <p className="text-gray-600 mt-1 font-medium">Monitor and respond to active emergency alerts</p>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-all hover:shadow-sm">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Critical Alert Banner */}
        {criticalCount > 0 && (
          <div className="bg-linear-to-r from-red-600 to-red-700 rounded-xl p-5 shadow-lg shadow-red-500/30 animate-pulse">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-lg">Critical Emergency Alert!</p>
                  <p className="text-red-100 text-sm">{criticalCount} critical emergency requiring immediate attention</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6" />
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-linear-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-600 uppercase tracking-wide">Active Emergencies</p>
              <p className="text-4xl font-bold text-red-700 mt-2">{activeCount}</p>
              <p className="text-xs text-red-600 mt-1">Awaiting response</p>
            </div>
            <div className="bg-red-200 p-4 rounded-xl">
              <AlertTriangle className="w-8 h-8 text-red-700" />
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Responding</p>
              <p className="text-4xl font-bold text-blue-700 mt-2">{respondingCount}</p>
              <p className="text-xs text-blue-600 mt-1">Teams dispatched</p>
            </div>
            <div className="bg-blue-200 p-4 rounded-xl">
              <Ambulance className="w-8 h-8 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">Resolved Today</p>
              <p className="text-4xl font-bold text-green-700 mt-2">12</p>
              <p className="text-xs text-green-600 mt-1">Successfully handled</p>
            </div>
            <div className="bg-green-200 p-4 rounded-xl">
              <CheckCircle className="w-8 h-8 text-green-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Filters:</span>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="responding">Responding</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Severity</option>
            <option value="critical">Critical</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>
        </div>
      </div>

      {/* Emergency Cards */}
      <div className="space-y-4">
        {mockEmergencies.map((emergency) => (
          <div
            key={emergency.id}
            className={`bg-white rounded-xl border-2 shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden ${
              emergency.severity === 'critical' ? 'border-red-500' :
              emergency.severity === 'urgent' ? 'border-orange-500' :
              'border-gray-200'
            }`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4 flex-1">
                  <EmergencyIcon type={emergency.type} />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{emergency.type} Emergency</h3>
                      <SeverityBadge severity={emergency.severity} />
                      <StatusBadge status={emergency.status} />
                    </div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">ID: {emergency.id}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{emergency.description}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Reporter:</span>
                  <span className="font-semibold text-gray-900">{emergency.reporter}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{emergency.location}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{new Date(emergency.reportedAt).toLocaleTimeString()}</span>
                </div>
              </div>

              {emergency.respondedBy && (
                <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-blue-900">
                      Responding: {emergency.respondedBy}
                    </span>
                    {emergency.estimatedTime && (
                      <span className="text-sm font-bold text-blue-700">ETA: {emergency.estimatedTime}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleView(emergency)}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-semibold transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>
                <a
                  href={`tel:${emergency.phone}`}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors shadow-sm"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <button className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm">
                  <Navigation className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <EmergencyDetailModal
          emergency={selectedEmergency}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
