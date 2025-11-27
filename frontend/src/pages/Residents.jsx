// src/pages/Residents.jsx
import { useState } from 'react';
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
} from 'lucide-react';

// Mock Residents Data - Emergency System (All Active by Default)
const mockResidents = [
  {
    id: 'USR-2025-001',
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    email: 'juan.delacruz@email.com',
    phone: '+63 912 345 6789',
    dateOfBirth: '1985-05-15',
    gender: 'Male',
    address: 'Block 5, Main Street, Zone 2',
    purok: 'Purok 2',
    barangay: 'Barangay Central',
    city: 'Quezon City',
    zipCode: '1100',
    emergencyContactName: 'Maria Dela Cruz',
    emergencyContactPhone: '+63 923 456 7890',
    registeredOn: '2025-11-10T14:30:00',
    status: 'active',
    verified: true,
    accountType: 'resident',
    submissionsCount: 12,
  },
  {
    id: 'USR-2025-002',
    firstName: 'Maria',
    lastName: 'Santos',
    email: 'maria.santos@email.com',
    phone: '+63 923 456 7891',
    dateOfBirth: '1990-08-22',
    gender: 'Female',
    address: 'Zone 3, House 12, Purok 3',
    purok: 'Purok 3',
    barangay: 'Barangay Central',
    city: 'Quezon City',
    zipCode: '1100',
    emergencyContactName: 'Pedro Santos',
    emergencyContactPhone: '+63 934 567 8902',
    registeredOn: '2025-11-08T09:15:00',
    status: 'active',
    verified: true,
    accountType: 'resident',
    submissionsCount: 5,
  },
  {
    id: 'USR-2025-003',
    firstName: 'Pedro',
    lastName: 'Garcia',
    email: 'pedro.garcia@email.com',
    phone: '+63 934 567 8903',
    dateOfBirth: '1978-03-10',
    gender: 'Male',
    address: 'Block 2, Unit 5, Zone 1',
    purok: 'Purok 1',
    barangay: 'Barangay Central',
    city: 'Quezon City',
    zipCode: '1100',
    emergencyContactName: 'Ana Garcia',
    emergencyContactPhone: '+63 945 678 9013',
    registeredOn: '2025-11-05T16:45:00',
    status: 'active',
    verified: false,
    accountType: 'resident',
    submissionsCount: 2,
  },
  {
    id: 'USR-2025-004',
    firstName: 'Ana',
    lastName: 'Lopez',
    email: 'ana.lopez@email.com',
    phone: '+63 945 678 9014',
    dateOfBirth: '1995-12-05',
    gender: 'Female',
    address: 'Zone 1, Lot 8, Purok 5',
    purok: 'Purok 5',
    barangay: 'Barangay Central',
    city: 'Quezon City',
    zipCode: '1100',
    emergencyContactName: 'Carlos Lopez',
    emergencyContactPhone: '+63 956 789 0124',
    registeredOn: '2025-11-01T11:20:00',
    status: 'flagged',
    verified: false,
    accountType: 'resident',
    submissionsCount: 8,
  },
  {
    id: 'USR-2025-005',
    firstName: 'Carlos',
    lastName: 'Reyes',
    email: 'carlos.reyes@email.com',
    phone: '+63 956 789 0125',
    dateOfBirth: '1982-07-18',
    gender: 'Male',
    address: 'Zone 4, Avenue A, House 15',
    purok: 'Purok 4',
    barangay: 'Barangay Central',
    city: 'Quezon City',
    zipCode: '1100',
    emergencyContactName: 'Rosa Reyes',
    emergencyContactPhone: '+63 967 890 1235',
    registeredOn: '2025-10-28T08:30:00',
    status: 'suspended',
    verified: true,
    accountType: 'resident',
    submissionsCount: 15,
  },
];

// Status Badge (Updated for Emergency System)
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

  const config = styles[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      <Icon className="w-3 h-3 mr-1.5" />
      {labels[status]}
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
function ViewResidentModal({ resident, onClose }) {
  if (!resident) return null;

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const accountAge = Math.floor((new Date() - new Date(resident.registeredOn)) / (1000 * 60 * 60 * 24));

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
          {/* Status & Verification & Trust Score */}
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={resident.status} />
            <VerifiedBadge verified={resident.verified} />
            <div className="flex items-center text-sm bg-gray-100 px-3 py-1.5 rounded-lg">
              <Calendar className="w-4 h-4 mr-2 text-gray-500" />
              Registered: {new Date(resident.registeredOn).toLocaleDateString()}
            </div>
            <div className="flex items-center text-sm bg-purple-100 px-3 py-1.5 rounded-lg">
              <Activity className="w-4 h-4 mr-2 text-purple-600" />
              {resident.submissionsCount} Submissions
            </div>
            <div className="flex items-center text-sm bg-blue-100 px-3 py-1.5 rounded-lg">
              <Clock className="w-4 h-4 mr-2 text-blue-600" />
              {accountAge} days old
            </div>
          </div>

          {/* Emergency System Notice */}
          {!resident.verified && resident.status === 'active' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-900">Unverified Account - Full Access</p>
                <p className="text-xs text-yellow-700 mt-1">
                  This user has full emergency reporting access. Verify identity to add trust badge and unlock additional benefits.
                </p>
              </div>
            </div>
          )}

          {/* Flagged Warning */}
          {resident.status === 'flagged' && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start space-x-3">
              <Flag className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-900">Account Flagged for Review</p>
                <p className="text-xs text-orange-700 mt-1">
                  Suspicious activity detected. Review recent submissions and verify identity before taking action.
                </p>
              </div>
            </div>
          )}

          {/* Personal Information (Read-Only) */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
              <User className="w-4 h-4 mr-2 text-blue-600" />
              Personal Information (Read-Only)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-blue-600 uppercase font-semibold mb-1">First Name</p>
                <p className="text-sm font-semibold text-gray-900">{resident.firstName}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Last Name</p>
                <p className="text-sm font-semibold text-gray-900">{resident.lastName}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Date of Birth</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(resident.dateOfBirth).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-1">{calculateAge(resident.dateOfBirth)} years old</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Gender</p>
                <p className="text-sm font-semibold text-gray-900">{resident.gender}</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <p className="text-xs text-blue-800">
                <Shield className="w-3 h-3 inline mr-1" />
                Personal details can only be changed by the resident via mobile app.
              </p>
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
                  {resident.email}
                </a>
              </div>
              <div>
                <p className="text-xs text-green-600 uppercase font-semibold mb-1">Phone</p>
                <a href={`tel:${resident.phone}`} className="text-sm text-green-600 hover:text-green-700 flex items-center font-medium">
                  <Phone className="w-3 h-3 mr-2" />
                  {resident.phone}
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
                <p className="text-sm font-medium text-gray-900">{resident.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Purok</p>
                  <p className="text-sm font-semibold text-gray-900">{resident.purok}</p>
                </div>
                <div>
                  <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Barangay</p>
                  <p className="text-sm font-semibold text-gray-900">{resident.barangay}</p>
                </div>
                <div>
                  <p className="text-xs text-purple-600 uppercase font-semibold mb-1">City</p>
                  <p className="text-sm font-semibold text-gray-900">{resident.city}</p>
                </div>
                <div>
                  <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Zip Code</p>
                  <p className="text-sm font-semibold text-gray-900">{resident.zipCode}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-5 border border-orange-200">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
              Emergency Contact
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-orange-600 uppercase font-semibold mb-1">Contact Name</p>
                <p className="text-sm font-semibold text-gray-900">{resident.emergencyContactName}</p>
              </div>
              <div>
                <p className="text-xs text-orange-600 uppercase font-semibold mb-1">Contact Phone</p>
                <a href={`tel:${resident.emergencyContactPhone}`} className="text-sm text-orange-600 hover:text-orange-700 flex items-center font-medium">
                  <Phone className="w-3 h-3 mr-2" />
                  {resident.emergencyContactPhone}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Admin Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors">
              Close
            </button>
            
            {/* Verify if Not Verified */}
            {!resident.verified && resident.status === 'active' && (
              <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm">
                <Shield className="w-4 h-4" />
                <span>Verify Identity</span>
              </button>
            )}
            
            {/* Flag if Active */}
            {resident.status === 'active' && (
              <button className="px-4 py-2 flex items-center space-x-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold transition-colors shadow-sm">
                <Flag className="w-4 h-4" />
                <span>Flag Account</span>
              </button>
            )}
            
            {/* Suspend if Active or Flagged */}
            {(resident.status === 'active' || resident.status === 'flagged') && (
              <button className="px-4 py-2 flex items-center space-x-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors shadow-sm">
                <Ban className="w-4 h-4" />
                <span>Suspend</span>
              </button>
            )}
            
            {/* Unsuspend if Suspended */}
            {resident.status === 'suspended' && (
              <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors shadow-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Unsuspend Account</span>
              </button>
            )}

            {/* Unflag if Flagged */}
            {resident.status === 'flagged' && (
              <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors shadow-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Clear Flag</span>
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
  const [selectedResident, setSelectedResident] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [purokFilter, setPurokFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const handleView = (resident) => {
    setSelectedResident(resident);
    setViewModalOpen(true);
  };

  const stats = {
    total: mockResidents.length,
    active: mockResidents.filter(r => r.status === 'active').length,
    flagged: mockResidents.filter(r => r.status === 'flagged').length,
    verified: mockResidents.filter(r => r.verified).length,
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
        <button className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-all hover:shadow-sm">
          <Download className="w-4 h-4" />
          <span>Export List</span>
        </button>
      </div>

      {/* Emergency System Banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start space-x-3">
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-green-900">Instant Access Emergency System</p>
          <p className="text-xs text-green-700 mt-1">
            All new registrations get immediate access to emergency reporting. Verification adds trust badges and benefits but doesn't block critical features.
          </p>
        </div>
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
                placeholder="Search by name, email, or ID..."
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
              onClick={() => {
                setSearchTerm('');
                setPurokFilter('All');
                setStatusFilter('All');
              }}
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Address</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Registered</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockResidents.map((resident) => (
                <tr key={resident.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">{resident.id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                        {resident.firstName.charAt(0)}{resident.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{resident.firstName} {resident.lastName}</p>
                        <p className="text-xs text-gray-500">{resident.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-gray-900 flex items-center">
                        <Mail className="w-3 h-3 mr-1 text-gray-400" />
                        {resident.email}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <Phone className="w-3 h-3 mr-1 text-gray-400" />
                        {resident.phone}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start text-sm text-gray-600 max-w-xs">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="truncate">{resident.address}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{resident.purok}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(resident.registeredOn).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      <StatusBadge status={resident.status} />
                      <VerifiedBadge verified={resident.verified} />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleView(resident)} 
                      className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-semibold text-sm"
                      title="View Profile"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">1-5</span> of <span className="font-semibold text-gray-900">5</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">1</button>
            <button className="px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {viewModalOpen && <ViewResidentModal resident={selectedResident} onClose={() => setViewModalOpen(false)} />}
    </div>
  );
}
