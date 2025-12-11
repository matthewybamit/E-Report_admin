// src/pages/Reports.jsx - COMPLETE VERSION WITH EMBEDDED LIVE MAP TRACKING
// INSTALL: npm install react-leaflet leaflet
// ADD TO index.html <head>: <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../config/supabase';
import Groq from 'groq-sdk';
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
  RefreshCw,
  Phone,
  Mail,
  Image as ImageIcon,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Loader as LoaderIcon,
  XCircle,
  Wrench,
  Heart,
  Shield,
  Leaf,
  AlertTriangle,
  Save,
  Maximize2,
  Send,
  Bot,
  Loader,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Bell,
  Navigation,
  Radio
} from 'lucide-react';

// ========== NEW: Import Leaflet for Live Map ==========
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for responder (blue) and destination (red)
const responderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to recenter map when responder moves
function MapUpdater({ responderLocation, reportLocation }) {
  const map = useMap();

  useEffect(() => {
    if (responderLocation && reportLocation) {
      const bounds = L.latLngBounds(
        [responderLocation.lat, responderLocation.lng],
        [reportLocation.lat, reportLocation.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [responderLocation, reportLocation, map]);

  return null;
}
// ========== END NEW IMPORTS ==========

// Initialize Groq (FIXED: Using environment variable)
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});
// Keep ALL your existing helper functions exactly as they are
async function analyzeReportWithAI(reportData) {
  const { category, title, description, location } = reportData;

  const prompt = `You are an AI assistant for a community reporting system. Analyze this report and provide:
1. Priority level (low, medium, high, urgent)
2. Severity assessment (1-10)
3. Recommended response time (in hours)
4. Suggested actions (brief list, max 3 items)
5. Best responder type (Medical, Fire, Police, Public Works, Environmental)

Report Details:
- Category: ${category}
- Title: ${title}
- Description: ${description}
- Location: ${location}

Respond in valid JSON format:
{
  "priority": "medium",
  "severity": 7,
  "responseTime": 2,
  "suggestedActions": ["Action 1", "Action 2"],
  "responderType": "Police",
  "reasoning": "Brief 1-sentence explanation"
}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return null;
  } catch (error) {
    console.error('Groq AI Error:', error);
    return null;
  }
}

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

function ResponderStatusBadge({ status, reportStatus }) {
  // ✅ FIXED: Don't show responder status if report is resolved
  if (reportStatus === 'resolved' || !status) return null;
  
  const config = {
    dispatched: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Send, label: 'Dispatched' },
    assigned: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Send, label: 'Assigned' },
    en_route: { bg: 'bg-orange-100', text: 'text-orange-800', icon: Navigation, label: 'En Route' },
    on_scene: { bg: 'bg-green-100', text: 'text-green-800', icon: MapPin, label: 'On Scene' },
    completing: { bg: 'bg-purple-100', text: 'text-purple-800', icon: CheckCircle, label: 'Completing' },
  };
  const style = config[status] || config.dispatched;
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${style.bg} ${style.text}`}>
      <Icon className="w-3.5 h-3.5 mr-1.5" />
      {style.label}
    </span>
  );
}


function PriorityBadge({ priority, aiSuggested }) {
  const config = {
    low: { bg: 'bg-gray-500', text: 'text-white' },
    medium: { bg: 'bg-orange-500', text: 'text-white' },
    high: { bg: 'bg-red-500', text: 'text-white' },
    urgent: { bg: 'bg-red-600', text: 'text-white', pulse: true },
  };

  const style = config[priority] || config.low;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${style.bg} ${style.text} ${style.pulse ? 'animate-pulse' : ''} ${aiSuggested ? 'ring-2 ring-purple-400 ring-offset-1' : ''}`}>
      {aiSuggested && <Sparkles className="w-3 h-3 mr-1" />}
      {priority ? priority.toUpperCase() : 'LOW'}
    </span>
  );
}

function AIInsightsInline({ insights, onAccept, onReject, accepting }) {
  if (!insights) return null;

  const severityColor = insights.severity >= 8 ? 'text-red-600' : insights.severity >= 5 ? 'text-orange-600' : 'text-green-600';

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border-2 border-purple-200 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 grid grid-cols-4 gap-3">
          <div className="bg-white/70 rounded-lg p-2 text-center">
            <p className="text-xs text-purple-600 font-semibold uppercase">Priority</p>
            <p className="text-lg font-bold text-purple-900 capitalize">{insights.priority}</p>
          </div>
          <div className="bg-white/70 rounded-lg p-2 text-center">
            <p className="text-xs text-purple-600 font-semibold uppercase">Severity</p>
            <p className={`text-lg font-bold ${severityColor}`}>{insights.severity}/10</p>
          </div>
          <div className="bg-white/70 rounded-lg p-2 text-center">
            <p className="text-xs text-purple-600 font-semibold uppercase">Response</p>
            <p className="text-lg font-bold text-purple-900">{insights.responseTime}h</p>
          </div>
          <div className="bg-white/70 rounded-lg p-2 text-center">
            <p className="text-xs text-purple-600 font-semibold uppercase">Type</p>
            <p className="text-sm font-bold text-purple-900">{insights.responderType}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onAccept}
            disabled={accepting}
            className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-all disabled:opacity-50 whitespace-nowrap"
          >
            <ThumbsUp className="w-4 h-4" />
            {accepting ? 'Applying...' : 'Accept AI'}
          </button>
          <button
            onClick={onReject}
            className="flex items-center gap-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold text-sm transition-all whitespace-nowrap"
          >
            <ThumbsDown className="w-4 h-4" />
            Reject
          </button>
        </div>
      </div>

      <div className="mt-3 bg-white/70 rounded-lg p-3">
        <p className="text-xs text-purple-600 font-semibold uppercase mb-1">AI Reasoning</p>
        <p className="text-sm text-purple-900">{insights.reasoning}</p>
      </div>

      <div className="mt-2 bg-white/70 rounded-lg p-3">
        <p className="text-xs text-purple-600 font-semibold uppercase mb-2">Suggested Actions</p>
        <div className="space-y-1">
          {insights.suggestedActions.map((action, idx) => (
            <div key={idx} className="text-sm text-purple-900 flex items-start">
              <CheckCircle className="w-3.5 h-3.5 mr-2 text-purple-500 mt-0.5 flex-shrink-0" />
              {action}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== MODIFIED: TrackResponderModal with EMBEDDED LIVE MAP ==========
function TrackResponderModal({ report, responder, onClose }) {
  const [responderLocation, setResponderLocation] = useState(null);
  const [responderStatus, setResponderStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    if (!responder) return;

    fetchResponderLocation();

    // Subscribe to real-time location updates
    const channel = supabase
      .channel('responder-tracking-' + responder.id)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'responders', 
          filter: 'id=eq.' + responder.id 
        }, 
        (payload) => {
          if (payload.new.current_lat && payload.new.current_lng) {
            setResponderLocation({
              lat: payload.new.current_lat,
              lng: payload.new.current_lng
            });
            calculateDistance(
              payload.new.current_lat,
              payload.new.current_lng,
              report.latitude,
              report.longitude
            );
          }
        }
      )
      .subscribe();

    // Subscribe to status updates
    const jobChannel = supabase
      .channel('job-status-' + report.id)
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reports',
          filter: 'id=eq.' + report.id
        },
        (payload) => {
          setResponderStatus(payload.new.responder_status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(jobChannel);
    };
  }, [responder, report]);

  const fetchResponderLocation = async () => {
    try {
      const { data, error } = await supabase
        .from('responders')
        .select('current_lat, current_lng')
        .eq('id', responder.id)
        .single();

      if (data && data.current_lat && data.current_lng) {
        const loc = {
          lat: data.current_lat,
          lng: data.current_lng
        };
        setResponderLocation(loc);
        calculateDistance(data.current_lat, data.current_lng, report.latitude, report.longitude);
      }

      // Fetch current status
      const { data: job } = await supabase
        .from('reports')
        .select('responder_status')
        .eq('id', report.id)
        .single();
      if (job) setResponderStatus(job.responder_status);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching responder location:', error);
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const dist = (R * c).toFixed(2);
    setDistance(dist);
  };

  const getStatusLabel = (status) => {
    const labels = {
      assigned: 'Assigned',
      en_route: 'En Route',
      on_scene: 'On Scene',
      completing: 'Completing'
    };
    return labels[status] || 'Unknown';
  };

  if (!responder) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Radio className="w-6 h-6 animate-pulse" />
                Live Responder Tracking
              </h2>
              <p className="text-blue-100 text-sm mt-1">{responder.name} - {responder.type}</p>
              <div className="mt-3">
                {responderStatus && <ResponderStatusBadge status={responderStatus} />}
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
        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
                  <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Status</p>
                  <p className="text-lg font-bold text-blue-900 capitalize">
                    {responderStatus ? getStatusLabel(responderStatus) : 'Unknown'}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
                  <p className="text-xs text-green-600 font-semibold uppercase mb-1">Distance</p>
                  <p className="text-lg font-bold text-green-900">
                    {distance ? distance + ' km' : 'Calculating...'}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200">
                  <p className="text-xs text-orange-600 font-semibold uppercase mb-1">Location</p>
                  <p className="text-lg font-bold text-orange-900">
                    {responderLocation ? '🟢 Live' : '⚪ Offline'}
                  </p>
                </div>
              </div>

              {/* ========== NEW: EMBEDDED LIVE MAP ========== */}
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden border-2 border-gray-300 h-96">
                {responderLocation && report.latitude && report.longitude ? (
                  <MapContainer
                    center={[responderLocation.lat, responderLocation.lng]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    className="rounded-2xl"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Responder Marker (Blue) */}
                    <Marker 
                      position={[responderLocation.lat, responderLocation.lng]}
                      icon={responderIcon}
                    >
                      <Popup>
                        <div className="text-center">
                          <strong className="text-blue-600">{responder.name}</strong>
                          <p className="text-xs text-gray-600">Current Location</p>
                          <p className="text-xs font-mono text-gray-700">
                            {responderLocation.lat.toFixed(5)}, {responderLocation.lng.toFixed(5)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Destination Marker (Red) */}
                    <Marker 
                      position={[report.latitude, report.longitude]}
                      icon={destinationIcon}
                    >
                      <Popup>
                        <div className="text-center">
                          <strong className="text-red-600">Destination</strong>
                          <p className="text-xs text-gray-600">{report.title}</p>
                          <p className="text-xs font-mono text-gray-700">
                            {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Route Line */}
                    <Polyline 
                      positions={[
                        [responderLocation.lat, responderLocation.lng],
                        [report.latitude, report.longitude]
                      ]}
                      pathOptions={{ color: '#3B82F6', weight: 4, dashArray: '10, 10' }}
                    />

                    {/* Auto-fit bounds */}
                    <MapUpdater 
                      responderLocation={responderLocation} 
                      reportLocation={{ lat: report.latitude, lng: report.longitude }} 
                    />
                  </MapContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-semibold">Location Not Available</p>
                      <p className="text-sm text-gray-500 mt-2">Responder may be offline or not broadcasting location</p>
                    </div>
                  </div>
                )}
              </div>
              {/* ========== END NEW MAP ========== */}

              {/* Location Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-xs text-blue-600 font-semibold uppercase mb-2">Responder Location</p>
                  {responderLocation ? (
                    <>
                      <p className="text-sm text-gray-700 font-mono">
                        📍 {responderLocation.lat.toFixed(5)}, {responderLocation.lng.toFixed(5)}
                      </p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${responderLocation.lat},${responderLocation.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2 font-semibold"
                      >
                        <MapPin className="w-3 h-3" />
                        Open in Google Maps
                      </a>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Not available</p>
                  )}
                </div>

                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <p className="text-xs text-green-600 font-semibold uppercase mb-2">Destination</p>
                  <p className="text-sm text-gray-700 font-mono">
                    📍 {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 mt-2 font-semibold"
                  >
                    <MapPin className="w-3 h-3" />
                    Open in Google Maps
                  </a>
                </div>
              </div>

              {/* Get Directions Button */}
              {responderLocation && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${responderLocation.lat},${responderLocation.lng}&destination=${report.latitude},${report.longitude}&travelmode=driving`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"
                  >
                    <Navigation className="w-5 h-5" />
                    Get Turn-by-Turn Directions in Google Maps
                  </a>
                </div>
              )}

              {/* Status Timeline */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200">
                <h3 className="text-sm font-bold text-purple-900 uppercase mb-4">Response Timeline</h3>
                <div className="space-y-3">
                  {['assigned', 'en_route', 'on_scene', 'completing'].map((status, idx) => {
                    const statusList = ['assigned', 'en_route', 'on_scene', 'completing'];
                    const currentIndex = statusList.indexOf(responderStatus);
                    const isActive = responderStatus === status;
                    const isPast = currentIndex > idx;

                    return (
                      <div key={status} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isActive ? 'bg-blue-600 text-white' : isPast ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                          {isPast ? '✓' : idx + 1}
                        </div>
                        <p className={`text-sm font-semibold ${isActive ? 'text-blue-900' : isPast ? 'text-green-900' : 'text-gray-500'}`}>
                          {getStatusLabel(status)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Update Indicator */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm font-bold text-green-900">Live Tracking Active</p>
                  </div>
                  <p className="text-xs text-green-600">Updates every 10 seconds</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t-2 border-gray-200 px-8 py-5">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"
          >
            Close Tracking
          </button>
        </div>
      </div>
    </div>
  );
}
// Deploy Responder Modal with AI Suggestion
function DeployResponderModal({ report, responders, onClose, onDeploy, aiSuggestedType }) {
  if (!report) return null;

  const available = responders.filter(r => r.status === 'available');
  const suggestedResponder = available.find(r => r.type === aiSuggestedType);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-8 py-6 rounded-t-3xl">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Send className="w-6 h-6" />
            Deploy Responder
          </h2>
          <p className="text-green-100 text-sm mt-1">{report.report_number}</p>
          {aiSuggestedType && (
            <div className="mt-2 flex items-center gap-2 text-green-100 text-sm">
              <Sparkles className="w-4 h-4" />
              AI recommends: {aiSuggestedType}
            </div>
          )}
        </div>

        <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
          {available.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-gray-600 font-semibold">No available responders</p>
              <p className="text-sm text-gray-500 mt-1">All units are currently busy</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Select a responder to dispatch to <span className="font-bold">{report.location}</span>
              </p>
              {available.map((responder) => {
                const isAISuggested = responder.id === suggestedResponder?.id;
                return (
                  <button
                    key={responder.id}
                    onClick={() => onDeploy(responder.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all group ${
                      isAISuggested
                        ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-300 ring-2 ring-purple-400'
                        : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                        isAISuggested ? 'bg-purple-600' : 'bg-green-600'
                      }`}>
                        {responder.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{responder.name}</p>
                          {isAISuggested && (
                            <span className="flex items-center gap-1 text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                              <Sparkles className="w-3 h-3" />
                              AI Pick
                            </span>
                          )}
                        </div>
                        <p className={`text-xs font-semibold ${isAISuggested ? 'text-purple-600' : 'text-green-600'}`}>
                          {responder.type} Unit
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        isAISuggested ? 'bg-purple-600 text-white' : 'bg-green-600 text-white'
                      }`}>
                        Available
                      </span>
                      <Send className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${
                        isAISuggested ? 'text-purple-600' : 'text-green-600'
                      }`} />
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 rounded-b-3xl">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold text-gray-700 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Report Card Component with AI Indicator + TRACKING BUTTON
function ReportCard({ report, onView, onEdit, onDelete, canEdit, aiInsights, onQuickAcceptAI, acceptingAI, onTrackResponder }) {
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

  const hasAISuggestion = aiInsights && aiInsights.priority !== report.priority;
  const isUrgent = report.priority === 'urgent' || (aiInsights && aiInsights.priority === 'urgent');
  const isInProgress = report.status === 'in-progress';

  return (
    <div className={`group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border-2 overflow-hidden ${
      isUrgent ? 'border-red-300 ring-2 ring-red-200 animate-pulse' : 
      hasAISuggestion ? 'border-purple-300' : 
      'border-gray-100 hover:border-blue-200'
    }`}>
      {/* Urgent Banner */}
      {isUrgent && (
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white text-sm font-bold">
            <Zap className="w-4 h-4" />
            URGENT PRIORITY
          </div>
          <Bell className="w-4 h-4 text-white animate-bounce" />
        </div>
      )}

      {/* AI Suggestion Banner */}
      {hasAISuggestion && !isUrgent && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white text-sm font-bold">
            <Sparkles className="w-4 h-4" />
            AI Suggests: {aiInsights.priority.toUpperCase()} Priority
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAcceptAI(report.id);
            }}
            disabled={acceptingAI}
            className="px-3 py-1 bg-white text-purple-600 rounded-lg text-xs font-bold hover:bg-purple-50 transition-all disabled:opacity-50"
          >
            {acceptingAI ? 'Applying...' : 'Quick Accept'}
          </button>
        </div>
      )}

      {/* NEW: In Progress Banner with Track Button */}
      {isInProgress && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white text-sm font-bold">
            <Radio className="w-4 h-4 animate-pulse" />
            RESPONDER DEPLOYED
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTrackResponder(report);
            }}
            className="px-3 py-1 bg-white text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all flex items-center gap-1"
          >
            <Navigation className="w-3 h-3" />
            Track Live
          </button>
        </div>
      )}

      <div className="p-6 space-y-4">
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

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full capitalize">
            {report.category}
          </span>
          <PriorityBadge priority={report.priority} aiSuggested={hasAISuggestion} />
          <StatusBadge status={report.status} />
          {report.responder_status && <ResponderStatusBadge status={report.responder_status} />}
        </div>

        <div>
          <h4 className="text-base font-bold text-gray-900 line-clamp-2 leading-tight">
            {report.title}
          </h4>
        </div>

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

        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => onView(report)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all text-sm shadow-sm"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>

          {canEdit && (
            <>
              <button
                onClick={() => onEdit(report)}
                className="p-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                title="Edit"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(report)}
                className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                title="Delete"
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

// View Report Modal (keeping all your features)
function ViewReportModal({ report, onClose, onEditStatus, canEdit, onAIAnalysis, onDeployResponder, analyzingAI, aiInsights, onAcceptAI, acceptingAI, onRejectAI }) {
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  if (!report) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-6 z-10 rounded-t-3xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{report.title}</h2>
                <p className="text-blue-100 text-sm mt-1">{report.report_number}</p>

                  <div className="flex items-center gap-2 mt-3">
                    <StatusBadge status={report.status} />
                    <PriorityBadge priority={report.priority} aiSuggested={aiInsights && aiInsights.priority !== report.priority} />
                    {report.responder_status && report.status !== 'resolved' && (
                      <ResponderStatusBadge status={report.responder_status} reportStatus={report.status} />
                    )}
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

          <div className="p-8 space-y-6">
            {/* AI Analysis Section */}
            {!aiInsights && canEdit && report.status === 'pending' && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-600 p-3 rounded-xl">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-purple-900">AI Analysis Available</h3>
                      <p className="text-sm text-purple-700 mt-1">Let AI analyze this report and suggest priority & actions</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onAIAnalysis(report)}
                    disabled={analyzingAI}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {analyzingAI ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Run AI Analysis
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* AI Insights Display */}
            {aiInsights && (
              <AIInsightsInline
                insights={aiInsights}
                onAccept={() => onAcceptAI(report.id)}
                onReject={onRejectAI}
                accepting={acceptingAI}
              />
            )}

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
                {report.latitude && report.longitude && (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm transition-all"
                  >
                    <MapPin className="w-4 h-4" />
                    View on Google Maps
                  </a>
                )}
              </div>
            </div>

            {/* Image */}
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
                <div 
                  onClick={() => setIsImageZoomed(true)}
                  className="relative group cursor-zoom-in overflow-hidden rounded-2xl border-2 border-gray-200 hover:border-blue-400 transition-all"
                >
                  <img
                    src={report.image_url}
                    alt="Report evidence"
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
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
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.admin_notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200 px-8 py-5 flex gap-3 flex-wrap rounded-b-3xl">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold transition-all"
            >
              Close
            </button>

            {canEdit && report.status === 'pending' && (
              <>
                <button
                  onClick={() => onDeployResponder(report)}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm transition-all"
                >
                  <Send className="w-4 h-4" />
                  Deploy Responder
                </button>

                <button
                  onClick={() => onEditStatus(report)}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  Update Status
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
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
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

// Edit Report Modal (keeping your existing one)
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
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 rounded-t-3xl">
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

        <div className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Assigned To</label>
            <input
              type="text"
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              placeholder="Enter assignee name"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Admin Notes</label>
            <textarea
              value={formData.admin_notes}
              onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
              placeholder="Add internal notes..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
            />
          </div>
        </div>

        <div className="bg-gray-50 border-t-2 border-gray-200 px-8 py-5 flex gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Component (ALL YOUR EXISTING FEATURES + TRACKING)
export default function Reports() {
  const [reports, setReports] = useState([]);
  const [responders, setResponders] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [editingReport, setEditingReport] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [aiInsightsMap, setAiInsightsMap] = useState({});
  const [acceptingAI, setAcceptingAI] = useState(false);
  const [autoAnalyzing, setAutoAnalyzing] = useState(false);

  // NEW: Tracking modal state
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingReport, setTrackingReport] = useState(null);
  const [trackingResponder, setTrackingResponder] = useState(null);

  useEffect(() => {
    fetchReports();
    fetchResponders();
    checkUserRole();

    const channel = supabase
      .channel('reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          autoAnalyzeNewReport(payload.new);
        }
        fetchReports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchQuery, statusFilter, priorityFilter]);

  useEffect(() => {
    if (reports.length > 0 && (userRole === 'admin' || userRole === 'operator')) {
      autoAnalyzePendingReports();
    }
  }, [reports.length, userRole]);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUserRole(user?.user_metadata?.role || 'admin');
    } catch (error) {
      console.error('Error checking user role:', error);
      setUserRole('admin');
    }
  };

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
    } finally {
      setLoading(false);
    }
  };

  const fetchResponders = async () => {
    try {
      const { data } = await supabase.from('responders').select('*');
      setResponders(data || []);
    } catch (error) {
      console.error('Error fetching responders:', error);
    }
  };

  const filterReports = () => {
    let filtered = reports;

    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.report_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.reporter_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((r) => r.priority === priorityFilter);
    }

    setFilteredReports(filtered);
  };

  const autoAnalyzePendingReports = async () => {
    const pendingReports = reports.filter(r => r.status === 'pending' && !aiInsightsMap[r.id]);

    if (pendingReports.length === 0) return;

    setAutoAnalyzing(true);

    const reportsToAnalyze = pendingReports.slice(0, 5);

    for (const report of reportsToAnalyze) {
      const insights = await analyzeReportWithAI({
        category: report.category,
        title: report.title,
        description: report.description,
        location: report.location,
      });

      if (insights) {
        setAiInsightsMap(prev => ({
          ...prev,
          [report.id]: insights
        }));
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setAutoAnalyzing(false);
  };

  const autoAnalyzeNewReport = async (report) => {
    if (report.status !== 'pending') return;

    const insights = await analyzeReportWithAI({
      category: report.category,
      title: report.title,
      description: report.description,
      location: report.location,
    });

    if (insights) {
      setAiInsightsMap(prev => ({
        ...prev,
        [report.id]: insights
      }));
    }
  };

  const handleAIAnalysis = async (report) => {
    setAnalyzingAI(true);
    try {
      const insights = await analyzeReportWithAI({
        category: report.category,
        title: report.title,
        description: report.description,
        location: report.location,
      });

      if (insights) {
        setAiInsightsMap(prev => ({
          ...prev,
          [report.id]: insights
        }));
      } else {
        alert('❌ AI analysis failed. Please try again.');
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      alert('❌ AI analysis failed. Please try again.');
    } finally {
      setAnalyzingAI(false);
    }
  };

  const handleAcceptAI = async (reportId) => {
    const insights = aiInsightsMap[reportId];
    if (!insights) return;

    setAcceptingAI(true);
    try {
      await supabase
        .from('reports')
        .update({
          priority: insights.priority,
          admin_notes: `[AI Analysis - Accepted by Operator]\nReasoning: ${insights.reasoning}\nSuggested Actions: ${insights.suggestedActions.join(', ')}\nSeverity: ${insights.severity}/10\nRecommended Response: ${insights.responseTime}h`
        })
        .eq('id', reportId);

      alert('✅ AI recommendations applied successfully!');

      setAiInsightsMap(prev => {
        const newMap = { ...prev };
        delete newMap[reportId];
        return newMap;
      });

      fetchReports();
    } catch (error) {
      console.error('Error accepting AI:', error);
      alert('❌ Failed to apply AI recommendations');
    } finally {
      setAcceptingAI(false);
    }
  };

  const handleRejectAI = (reportId) => {
    setAiInsightsMap(prev => {
      const newMap = { ...prev };
      delete newMap[reportId];
      return newMap;
    });
  };

  // NEW: Handle track responder
  const handleTrackResponder = async (report) => {
    if (!report.assigned_to) {
      alert('⚠️ No responder assigned to this report');
      return;
    }

    try {
      const responder = responders.find(r => r.name === report.assigned_to);
      if (!responder) {
        alert('⚠️ Responder not found');
        return;
      }

      setTrackingReport(report);
      setTrackingResponder(responder);
      setTrackingModalOpen(true);
    } catch (error) {
      console.error('Error opening tracking modal:', error);
      alert('❌ Failed to open tracking');
    }
  };

  const handleDeployResponder = (report) => {
    const available = responders.filter(r => r.status === 'available');

    if (available.length === 0) {
      alert('⚠️ No available responders at the moment.');
      return;
    }

    setSelectedReport(report);
    setDeployModalOpen(true);
  };

  const confirmDeployment = async (responderId) => {
    try {
      const responder = responders.find(r => r.id === responderId);

      await supabase
        .from('reports')
        .update({
          status: 'in-progress',
          assigned_to: responder.name,
          responder_status: 'assigned'
        })
        .eq('id', selectedReport.id);

      await supabase
        .from('responders')
        .update({ status: 'busy' })
        .eq('id', responderId);

      alert(`✅ ${responder.name} has been dispatched!`);
      setDeployModalOpen(false);
      setSelectedReport(null);
      fetchReports();
      fetchResponders();
    } catch (error) {
      console.error('Deployment error:', error);
      alert('❌ Failed to deploy responder');
    }
  };

  const handleSaveEdit = async (reportId, updates) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update(updates)
        .eq('id', reportId);

      if (error) throw error;

      alert('✅ Report updated successfully!');
      setEditingReport(null);
      fetchReports();
    } catch (error) {
      console.error('Error updating report:', error);
      alert('❌ Failed to update report');
    }
  };

  const handleDelete = async (report) => {
    if (!window.confirm(`Delete report ${report.report_number}?`)) return;

    try {
      const { error } = await supabase.from('reports').delete().eq('id', report.id);
      if (error) throw error;
      alert('✅ Report deleted');
      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('❌ Failed to delete report');
    }
  };

  const canEdit = userRole === 'admin' || userRole === 'operator';

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'pending').length,
    inProgress: reports.filter((r) => r.status === 'in-progress').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
    urgent: reports.filter((r) => r.priority === 'urgent').length,
    aiSuggestions: Object.keys(aiInsightsMap).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-10 h-10 text-blue-600" />
              Reports Management
            </h1>
            <p className="text-gray-600 mt-2 font-medium flex items-center gap-2">
              Monitor and manage community reports with AI assistance & real-time tracking
              {autoAnalyzing && (
                <span className="flex items-center gap-1 text-purple-600 text-sm">
                  <Loader className="w-3 h-3 animate-spin" />
                  Auto-analyzing...
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => {
              fetchReports();
              autoAnalyzePendingReports();
            }}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats (ALL 6 STATS INCLUDING AI INSIGHTS) */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-semibold uppercase tracking-wide">Total</p>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-xs font-semibold uppercase tracking-wide">Pending</p>
                <p className="text-3xl font-bold mt-1">{stats.pending}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-yellow-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-semibold uppercase tracking-wide">In Progress</p>
                <p className="text-3xl font-bold mt-1">{stats.inProgress}</p>
              </div>
              <LoaderIcon className="w-10 h-10 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-semibold uppercase tracking-wide">Resolved</p>
                <p className="text-3xl font-bold mt-1">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white shadow-lg animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-xs font-semibold uppercase tracking-wide">Urgent</p>
                <p className="text-3xl font-bold mt-1">{stats.urgent}</p>
              </div>
              <Zap className="w-10 h-10 text-red-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs font-semibold uppercase tracking-wide">AI Insights</p>
                <p className="text-3xl font-bold mt-1">{stats.aiSuggestions}</p>
              </div>
              <Sparkles className="w-10 h-10 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Reports Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-md">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-semibold">No reports found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onView={(r) => setSelectedReport(r)}
                onEdit={setEditingReport}
                onDelete={handleDelete}
                canEdit={canEdit}
                aiInsights={aiInsightsMap[report.id]}
                onQuickAcceptAI={handleAcceptAI}
                acceptingAI={acceptingAI}
                onTrackResponder={handleTrackResponder}
              />
            ))}
          </div>
        )}
      </div>

      {/* ALL MODALS */}
      {selectedReport && (
        <ViewReportModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onEditStatus={setEditingReport}
          canEdit={canEdit}
          onAIAnalysis={handleAIAnalysis}
          onDeployResponder={handleDeployResponder}
          analyzingAI={analyzingAI}
          aiInsights={aiInsightsMap[selectedReport.id]}
          onAcceptAI={handleAcceptAI}
          acceptingAI={acceptingAI}
          onRejectAI={() => handleRejectAI(selectedReport.id)}
        />
      )}

      {editingReport && (
        <EditReportModal
          report={editingReport}
          onClose={() => setEditingReport(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deployModalOpen && selectedReport && (
        <DeployResponderModal
          report={selectedReport}
          responders={responders}
          onClose={() => setDeployModalOpen(false)}
          onDeploy={confirmDeployment}
          aiSuggestedType={aiInsightsMap[selectedReport.id]?.responderType}
        />
      )}

      {/* NEW: Tracking Modal */}
      {trackingModalOpen && trackingReport && trackingResponder && (
        <TrackResponderModal
          report={trackingReport}
          responder={trackingResponder}
          onClose={() => {
            setTrackingModalOpen(false);
            setTrackingReport(null);
            setTrackingResponder(null);
          }}
        />
      )}
    </div>
  );
} 