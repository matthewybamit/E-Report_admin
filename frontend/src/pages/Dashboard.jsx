// src/pages/Dashboard.jsx
import { useState } from 'react';
import {
  FileText,
  Users,
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  TrendingUp,
  Activity,
  Zap,
  Eye,
  Filter,
  Calendar,
  ArrowRight,
  Navigation,
} from 'lucide-react';

// Mock Map Data
const mapMarkers = [
  {
    id: 1,
    type: 'emergency',
    lat: 14.5995,
    lng: 120.9842,
    title: 'Medical Emergency',
    desc: 'Elderly person needs assistance',
    location: 'Zone 3, House 12',
    status: 'active',
    priority: 'urgent',
    time: '5 min ago',
  },
  {
    id: 2,
    type: 'report',
    lat: 14.6000,
    lng: 120.9850,
    title: 'Broken Street Light',
    desc: 'Main Street lighting issue',
    location: 'Block 5, Main St',
    status: 'pending',
    priority: 'medium',
    time: '2 hours ago',
  },
  {
    id: 3,
    type: 'emergency',
    lat: 14.5990,
    lng: 120.9835,
    title: 'Fire Alert',
    desc: 'Smoke reported near market',
    location: 'Block 2, Near Market',
    status: 'responding',
    priority: 'critical',
    time: '8 min ago',
  },
  {
    id: 4,
    type: 'report',
    lat: 14.6005,
    lng: 120.9845,
    title: 'Illegal Dumping',
    desc: 'Waste pile at vacant lot',
    location: 'Zone 1, Lot 8',
    status: 'pending',
    priority: 'low',
    time: '1 day ago',
  },
  {
    id: 5,
    type: 'resolved',
    lat: 14.5985,
    lng: 120.9838,
    title: 'Pothole Fixed',
    desc: 'Road repair completed',
    location: 'Block 7, Avenue A',
    status: 'resolved',
    priority: 'medium',
    time: '3 hours ago',
  },
];

// Interactive Map Component
function InteractiveMap({ markers, onMarkerClick, selectedMarker }) {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl overflow-hidden border-2 border-blue-200">
      {/* Map Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-10 grid-rows-10 h-full w-full">
          {[...Array(100)].map((_, i) => (
            <div key={i} className="border border-blue-300"></div>
          ))}
        </div>
      </div>

      {/* Map Label */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2.5 rounded-xl shadow-lg border border-gray-200 z-10">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-bold text-gray-800">Barangay Central</span>
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-gray-200 z-10">
        <p className="text-xs font-bold text-gray-700 mb-2">Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
            <span className="text-xs text-gray-600">Emergency</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
            <span className="text-xs text-gray-600">Report</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
            <span className="text-xs text-gray-600">Resolved</span>
          </div>
        </div>
      </div>

      {/* Markers */}
      <div className="relative w-full h-full">
        {markers.map((marker, index) => {
          const positions = [
            { top: '15%', left: '25%' },
            { top: '35%', left: '65%' },
            { top: '55%', left: '30%' },
            { top: '40%', left: '80%' },
            { top: '70%', left: '55%' },
          ];

          const markerColor =
            marker.type === 'emergency' ? 'bg-red-500 shadow-red-500/50' :
            marker.type === 'resolved' ? 'bg-green-500 shadow-green-500/50' :
            'bg-yellow-500 shadow-yellow-500/50';

          const isSelected = selectedMarker?.id === marker.id;

          return (
            <div
              key={marker.id}
              className="absolute cursor-pointer group z-20"
              style={positions[index]}
              onClick={() => onMarkerClick(marker)}
            >
              {/* Pulse for emergencies */}
              {marker.type === 'emergency' && (
                <div className="absolute inset-0 -m-3">
                  <div className="w-10 h-10 bg-red-400 rounded-full animate-ping opacity-40"></div>
                </div>
              )}

              {/* Marker */}
              <div className={`relative transform transition-all duration-200 ${isSelected ? 'scale-125 z-30' : 'scale-100 hover:scale-110'}`}>
                <div className={`w-7 h-7 ${markerColor} rounded-full border-3 border-white shadow-xl flex items-center justify-center relative z-10`}>
                  {marker.type === 'emergency' && (
                    <Bell className="w-4 h-4 text-white" />
                  )}
                  {marker.type === 'report' && (
                    <AlertCircle className="w-4 h-4 text-white" />
                  )}
                  {marker.type === 'resolved' && (
                    <CheckCircle className="w-4 h-4 text-white" />
                  )}
                </div>
                {/* Pin tail */}
                <div className={`w-0 h-0 border-l-[7px] border-r-[7px] border-t-[10px] ${
                  marker.type === 'emergency' ? 'border-t-red-500' :
                  marker.type === 'resolved' ? 'border-t-green-500' :
                  'border-t-yellow-500'
                } border-l-transparent border-r-transparent absolute left-1/2 -translate-x-1/2 -bottom-2.5`}></div>
              </div>

              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-30">
                <div className="bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs whitespace-nowrap max-w-xs">
                  <p className="font-bold">{marker.title}</p>
                  <p className="text-gray-300 mt-1">{marker.location}</p>
                  <p className="text-gray-400 mt-1 text-[10px]">{marker.time}</p>
                </div>
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-t-gray-900 border-l-transparent border-r-transparent absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-10">
        <button className="bg-white hover:bg-gray-50 p-2.5 rounded-lg shadow-lg border border-gray-200 transition-all hover:shadow-xl">
          <span className="text-gray-700 font-bold text-lg leading-none">+</span>
        </button>
        <button className="bg-white hover:bg-gray-50 p-2.5 rounded-lg shadow-lg border border-gray-200 transition-all hover:shadow-xl">
          <span className="text-gray-700 font-bold text-lg leading-none">−</span>
        </button>
      </div>
    </div>
  );
}

// Marker Detail Card
function MarkerDetailCard({ marker }) {
  if (!marker) return null;

  const statusConfig = {
    active: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    responding: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    resolved: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  };

  const priorityConfig = {
    critical: 'bg-red-500 text-white',
    urgent: 'bg-orange-500 text-white',
    high: 'bg-yellow-500 text-gray-900',
    medium: 'bg-blue-500 text-white',
    low: 'bg-gray-500 text-white',
  };

  const config = statusConfig[marker.status];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl ${
            marker.type === 'emergency' ? 'bg-red-100' :
            marker.type === 'resolved' ? 'bg-green-100' :
            'bg-yellow-100'
          }`}>
            {marker.type === 'emergency' && <Bell className="w-5 h-5 text-red-600" />}
            {marker.type === 'resolved' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {marker.type === 'report' && <FileText className="w-5 h-5 text-yellow-600" />}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{marker.title}</h3>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {marker.time}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-700 leading-relaxed">{marker.desc}</p>

        <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-2.5 rounded-lg">
          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
          {marker.location}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
            {marker.status.charAt(0).toUpperCase() + marker.status.slice(1)}
          </span>
          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${priorityConfig[marker.priority]}`}>
            {marker.priority.toUpperCase()}
          </span>
        </div>

        <button className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all shadow-md hover:shadow-lg">
          <Eye className="w-4 h-4" />
          <span>View Full Details</span>
        </button>
      </div>
    </div>
  );
}

// Main Dashboard
export default function Dashboard() {
  const [selectedMarker, setSelectedMarker] = useState(null);

  const stats = [
    {
      title: 'Total Reports',
      value: '156',
      change: '+12%',
      trend: 'up',
      icon: FileText,
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      iconBg: 'bg-blue-500',
    },
    {
      title: 'Active Users',
      value: '1,234',
      change: '+8%',
      trend: 'up',
      icon: Users,
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      iconBg: 'bg-green-500',
    },
    {
      title: 'Active Emergencies',
      value: '3',
      change: 'Critical',
      trend: 'critical',
      icon: Bell,
      bgColor: 'bg-gradient-to-br from-red-50 to-red-100',
      iconBg: 'bg-red-500',
    },
    {
      title: 'Resolved Today',
      value: '24',
      change: '+15%',
      trend: 'up',
      icon: CheckCircle,
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      iconBg: 'bg-purple-500',
    },
  ];

  const recentActivity = [
    { id: 1, type: 'report', title: 'New concern reported', desc: 'Broken streetlight on Main St.', time: '5 min ago', status: 'pending' },
    { id: 2, type: 'emergency', title: 'Emergency alert', desc: 'Medical assistance needed', time: '12 min ago', status: 'urgent' },
    { id: 3, type: 'resolved', title: 'Issue resolved', desc: 'Garbage collection completed', time: '1 hour ago', status: 'resolved' },
    { id: 4, type: 'user', title: 'New user registered', desc: 'John Doe joined', time: '2 hours ago', status: 'info' },
    { id: 5, type: 'report', title: 'Safety concern', desc: 'Noise complaint filed', time: '3 hours ago', status: 'pending' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Command Center</h1>
          <p className="text-gray-600 mt-1 font-medium flex items-center">
            <Activity className="w-4 h-4 mr-2 text-green-600 animate-pulse" />
            Real-time monitoring • Last updated just now
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-all shadow-sm hover:shadow-md">
            <Calendar className="w-4 h-4" />
            <span>Today</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-all shadow-sm hover:shadow-md">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`${stat.bgColor} rounded-2xl shadow-md border-2 border-white p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.iconBg} p-3 rounded-xl shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              {stat.trend === 'critical' ? (
                <span className="flex items-center text-xs font-bold text-red-600 bg-white px-2.5 py-1 rounded-full animate-pulse shadow-sm">
                  <Zap className="w-3 h-3 mr-1" />
                  {stat.change}
                </span>
              ) : (
                <span className="flex items-center text-xs font-semibold text-green-600 bg-white px-2.5 py-1 rounded-full shadow-sm">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {stat.change}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">{stat.title}</p>
              <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid: Map + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Section - Takes 8 columns */}
        <div className="lg:col-span-8 space-y-6">
          {/* Map Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                Live Location Monitor
              </h2>
              <div className="flex items-center space-x-2 text-sm bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-semibold">Live</span>
              </div>
            </div>

            <div className="h-[500px]">
              <InteractiveMap
                markers={mapMarkers}
                onMarkerClick={setSelectedMarker}
                selectedMarker={selectedMarker}
              />
            </div>
          </div>

          {/* Selected Marker Details */}
          {selectedMarker && (
            <MarkerDetailCard marker={selectedMarker} />
          )}
        </div>

        {/* Right Sidebar - Takes 4 columns */}
        <div className="lg:col-span-4 space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center transition-colors">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3.5 rounded-xl hover:bg-gray-50 transition-all cursor-pointer border border-transparent hover:border-gray-200 hover:shadow-sm"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                      activity.status === 'urgent' ? 'bg-red-100' :
                      activity.status === 'resolved' ? 'bg-green-100' :
                      activity.status === 'pending' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}
                  >
                    {activity.type === 'report' && <FileText className="w-5 h-5 text-yellow-600" />}
                    {activity.type === 'emergency' && <Bell className="w-5 h-5 text-red-600" />}
                    {activity.type === 'resolved' && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {activity.type === 'user' && <Users className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm">{activity.title}</h3>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">{activity.desc}</p>
                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-purple-600" />
              Report Status
            </h3>
            <div className="space-y-5">
              {[
                { label: 'Pending', value: 45, color: 'bg-yellow-500', bgLight: 'bg-yellow-50' },
                { label: 'In Progress', value: 67, color: 'bg-blue-500', bgLight: 'bg-blue-50' },
                { label: 'Resolved', value: 88, color: 'bg-green-500', bgLight: 'bg-green-50' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                    <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${item.bgLight}`} style={{ color: item.color.replace('bg-', '').replace('-500', '-600') }}>
                      {item.value}%
                    </span>
                  </div>
                  <div className={`w-full ${item.bgLight} rounded-full h-3 overflow-hidden`}>
                    <div
                      className={`${item.color} h-3 rounded-full transition-all duration-700 shadow-sm`}
                      style={{ width: `${item.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 rounded-2xl shadow-2xl p-6 text-white">
            <h3 className="font-bold mb-5 flex items-center text-lg">
              <Zap className="w-5 h-5 mr-2" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              {[
                { icon: '📢', label: 'Create Announcement' },
                { icon: '👥', label: 'Add New User' },
                { icon: '📊', label: 'Generate Report' },
              ].map((action) => (
                <button
                  key={action.label}
                  className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm py-3.5 px-4 rounded-xl text-sm font-semibold transition-all text-left flex items-center shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <span className="text-xl mr-3">{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
