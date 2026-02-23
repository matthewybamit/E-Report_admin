// src/pages/Dashboard.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../config/supabase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  FileText, Users, Bell, CheckCircle, Clock, AlertCircle,
  Activity, Zap, Eye, Calendar, ArrowRight, Loader2, MapPin,
  X, Phone, Mail, User, Navigation, Image as ImageIcon, Send,
  Edit3, TrendingUp, TrendingDown, Filter, Download, RefreshCw,
  ChevronRight, AlertTriangle, Shield, Package, Wrench,
  MessageSquare, UserCheck, Ambulance, Flame, Radio, BarChart2
} from 'lucide-react';

// ─── Map Config ───────────────────────────────────────────────────────────────
const QC_CENTER = [14.6760, 121.0437];
const INITIAL_ZOOM = 13;

const createCustomIcon = (color) => L.divIcon({
  className: 'custom-pin',
  html: `<div style="background-color:${color};width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;background:white;border-radius:50%;"></div></div>`,
  iconSize: [28, 40], iconAnchor: [14, 40], popupAnchor: [0, -43]
});

const redIcon    = createCustomIcon('#ef4444');
const greenIcon  = createCustomIcon('#22c55e');
const blueIcon   = createCustomIcon('#3b82f6');
const orangeIcon = createCustomIcon('#f97316');

// ─── Status / Priority Badges ─────────────────────────────────────────────────
function StatusBadge({ status }) {
  const config = {
    pending:      { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-300'  },
    'in-progress':{ bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-300'   },
    dispatched:   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-300'   },
    resolved:     { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-300'  },
    rejected:     { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-300'    },
  };
  const s = config[status] || config.pending;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold capitalize ${s.bg} ${s.text} ${s.border}`}>
      {status}
    </span>
  );
}

// ─── Full Report Modal ────────────────────────────────────────────────────────
function FullReportModal({ report, onClose, onUpdate }) {
  const [imageZoomed, setImageZoomed] = useState(false);
  if (!report) return null;

  const categoryIcons = {
    security: Shield, infrastructure: Wrench, sanitation: Package, other: AlertTriangle
  };
  const CategoryIcon = categoryIcons[report.category] || AlertTriangle;

  const handleQuickAction = async (action) => {
    try {
      const updates = {
        assign:   { status: 'in-progress' },
        resolve:  { status: 'resolved', resolved_at: new Date().toISOString() },
        reject:   { status: 'rejected' },
      }[action];
      await supabase.from('reports').update(updates).eq('id', report.id);
      onUpdate();
      alert(`Report ${action}d successfully.`);
    } catch { alert('Failed to update report.'); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden border border-slate-200">

        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <CategoryIcon className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400 font-mono">{report.report_number}</span>
            </div>
            <h2 className="text-lg font-bold text-white leading-snug">{report.title}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge status={report.status} />
              <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-bold uppercase tracking-wide ${
                report.priority === 'urgent' ? 'bg-red-50 text-red-700 border-red-300' :
                report.priority === 'high'   ? 'bg-orange-50 text-orange-700 border-orange-300' :
                'bg-slate-50 text-slate-600 border-slate-300'
              }`}>{report.priority}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[calc(92vh-180px)] overflow-y-auto">

          {/* Quick Actions */}
          {report.status === 'pending' && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />Quick Actions
                </p>
              </div>
              <div className="p-4 flex gap-2">
                <button onClick={() => handleQuickAction('assign')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors">
                  <Send className="w-3.5 h-3.5" />Assign
                </button>
                <button onClick={() => handleQuickAction('resolve')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-700 hover:bg-green-800 text-white rounded text-xs font-semibold transition-colors">
                  <CheckCircle className="w-3.5 h-3.5" />Resolve
                </button>
                <button onClick={() => handleQuickAction('reject')} className="px-3 py-2 bg-white border border-red-300 text-red-600 hover:bg-red-50 rounded text-xs font-semibold transition-colors">
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Reporter Info */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3.5 h-3.5" />Reporter Information
              </p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold mb-0.5">Name</p>
                <p className="text-sm font-semibold text-slate-800">{report.reporter_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold mb-0.5">Phone</p>
                <a href={`tel:${report.reporter_phone}`} className="text-sm font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1">
                  <Phone className="w-3 h-3" />{report.reporter_phone}
                </a>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-400 uppercase font-semibold mb-0.5">Email</p>
                <a href={`mailto:${report.reporter_email}`} className="text-sm font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1">
                  <Mail className="w-3 h-3" />{report.reporter_email}
                </a>
              </div>
            </div>
          </div>

          {/* Report Details */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />Report Details
              </p>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold mb-0.5">Category</p>
                <p className="text-sm font-semibold text-slate-800 capitalize">{report.category}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold mb-0.5">Description</p>
                <p className="text-sm text-slate-700 leading-relaxed">{report.description}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold mb-0.5">Submitted</p>
                <p className="text-sm text-slate-700 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(report.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />Location
              </p>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-sm font-semibold text-slate-800">{report.location || 'Not provided'}</p>
              {report.landmark && <p className="text-xs text-slate-500">{report.landmark}</p>}
              {report.latitude && report.longitude && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors mt-1"
                >
                  <Navigation className="w-3.5 h-3.5" />Open in Google Maps
                </a>
              )}
            </div>
          </div>

          {/* Image */}
          {report.image_url && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5" />Evidence Photo
                </p>
              </div>
              <div onClick={() => setImageZoomed(true)} className="cursor-zoom-in group overflow-hidden">
                <img src={report.image_url} alt="Report evidence" className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
          )}

          {/* Admin Notes */}
          {report.admin_notes && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" />Admin Notes
                </p>
              </div>
              <div className="p-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{report.admin_notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
            Close
          </button>
          <button
            onClick={() => { onClose(); window.open(`/reports?reportId=${report.id}`, '_blank'); }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded text-sm font-semibold transition-colors"
          >
            <Edit3 className="w-4 h-4" />Edit in Reports Page
          </button>
        </div>

        {/* Lightbox */}
        {imageZoomed && (
          <div className="fixed inset-0 z-[2100] bg-black/95 flex items-center justify-center p-4" onClick={() => setImageZoomed(false)}>
            <button className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-all" onClick={() => setImageZoomed(false)}>
              <X className="w-6 h-6" />
            </button>
            <img src={report.image_url} alt="Evidence Full View" className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl" onClick={e => e.stopPropagation()} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Full Emergency Modal ─────────────────────────────────────────────────────
function FullEmergencyModal({ emergency, onClose, onUpdate }) {
  if (!emergency) return null;

  const emergencyIcons = { Medical: Ambulance, Fire: Flame, Crime: Shield, Accident: AlertTriangle };
  const EmIcon = emergencyIcons[emergency.type] || AlertTriangle;

  const handleQuickResolve = async () => {
    try {
      await supabase.from('emergencies').update({ status: 'resolved', completed_at: new Date().toISOString() }).eq('id', emergency.id);
      onUpdate();
      alert('Emergency resolved successfully.');
    } catch { alert('Failed to resolve emergency.'); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden border border-slate-200">

        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <EmIcon className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400 font-mono">REF: {emergency.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <h2 className="text-lg font-bold text-white">{emergency.type} Emergency</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge status={emergency.status} />
              <span className="inline-flex items-center px-2 py-0.5 rounded border text-xs font-bold uppercase bg-red-50 text-red-700 border-red-300">
                {emergency.severity || 'High'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[calc(92vh-180px)] overflow-y-auto">

          {/* Quick Actions */}
          {emergency.status === 'pending' && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />Quick Actions
                </p>
              </div>
              <div className="p-4">
                <button onClick={handleQuickResolve} className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded text-xs font-semibold transition-colors">
                  <CheckCircle className="w-3.5 h-3.5" />Mark Resolved
                </button>
              </div>
            </div>
          )}

          {/* Emergency Details */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />Incident Details
              </p>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold mb-0.5">Type</p>
                <p className="text-sm font-semibold text-slate-800">{emergency.type}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold mb-0.5">Description</p>
                <p className="text-sm text-slate-700 leading-relaxed">{emergency.description}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold mb-0.5">Reported</p>
                <p className="text-sm text-slate-700 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(emergency.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />Location
              </p>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-sm font-semibold text-slate-800">{emergency.location_text || 'GPS Coordinates'}</p>
              {emergency.latitude && emergency.longitude && (
                <>
                  <p className="text-xs text-slate-400 font-mono">{emergency.latitude.toFixed(5)}, {emergency.longitude.toFixed(5)}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${emergency.latitude},${emergency.longitude}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors mt-1"
                  >
                    <Navigation className="w-3.5 h-3.5" />Open in Google Maps
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Responder Notes */}
          {emergency.responder_notes && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" />Responder Notes
                </p>
              </div>
              <div className="p-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{emergency.responder_notes}</p>
              </div>
            </div>
          )}

          {/* Evidence Photo */}
          {emergency.evidence_photo_url && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5" />Evidence Photo
                </p>
              </div>
              <img src={emergency.evidence_photo_url} alt="Emergency evidence" className="w-full h-56 object-cover" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
            Close
          </button>
          <button
            onClick={() => { onClose(); window.open('/emergency', '_blank'); }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded text-sm font-semibold transition-colors"
          >
            <Eye className="w-4 h-4" />View in Emergency Page
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Interactive Map ──────────────────────────────────────────────────────────
function InteractiveMap({ markers, selectedMarker, onMarkerClick }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef  = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    if (mapInstanceRef.current) return;
    const map = L.map(mapContainerRef.current, { zoomControl: true, attributionControl: false }).setView(QC_CENTER, INITIAL_ZOOM);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 20 }).addTo(map);
    L.control.attribution({ position: 'bottomright' }).addTo(map);
    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;
    mapInstanceRef.current  = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();
    markers.forEach(marker => {
      const lat = marker.latitude || marker.lat;
      const lng = marker.longitude || marker.lng;
      if (!lat || !lng) return;
      let icon = blueIcon;
      if (marker.type) {
        if (marker.severity === 'critical' || marker.severity === 'urgent') icon = redIcon;
        else if (marker.severity === 'high') icon = orangeIcon;
        if (marker.status === 'resolved') icon = greenIcon;
      } else {
        if (marker.priority === 'urgent') icon = redIcon;
        else if (marker.priority === 'high') icon = orangeIcon;
        if (marker.status === 'resolved') icon = greenIcon;
      }
      const lm = L.marker([lat, lng], { icon })
        .bindPopup(`<div style="font-family:sans-serif;"><strong style="font-size:13px;">${marker.title || marker.type + ' Emergency'}</strong><br/><span style="color:#64748b;font-size:11px;">${marker.location || marker.location_text || 'Quezon City'}</span></div>`);
      lm.on('click', () => onMarkerClick(marker));
      lm.addTo(markersLayerRef.current);
      if (selectedMarker?.id === marker.id) lm.openPopup();
    });
  }, [markers, selectedMarker, onMarkerClick]);

  useEffect(() => {
    if (selectedMarker && mapInstanceRef.current) {
      const lat = selectedMarker.latitude || selectedMarker.lat;
      const lng = selectedMarker.longitude || selectedMarker.lng;
      if (lat && lng) mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.5 });
    }
  }, [selectedMarker]);

  return (
    <div className="relative w-full h-full rounded overflow-hidden border border-slate-200 z-0">
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      <div className="absolute top-2 right-2 z-[500] bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded border border-slate-200 text-xs font-semibold text-slate-600 shadow-sm">
        Quezon City Live View
      </div>
    </div>
  );
}

// ─── Marker Detail Card ───────────────────────────────────────────────────────
function MarkerDetailCard({ marker, onViewFull, dataType }) {
  if (!marker) return null;
  const isEmergency = !!(dataType === 'emergency' || marker.type);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded border flex items-center justify-center flex-shrink-0 ${isEmergency ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
            {isEmergency
              ? <Ambulance className="w-4 h-4 text-red-600" />
              : <FileText className="w-4 h-4 text-slate-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm line-clamp-1">
              {isEmergency ? `${marker.type} Emergency` : marker.title}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{marker.description}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <StatusBadge status={marker.status} />
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(marker.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => onViewFull(marker)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors flex-shrink-0"
        >
          <Eye className="w-3.5 h-3.5" />View Details
        </button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const [viewingEmergency, setViewingEmergency] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [dataType, setDataType] = useState('all');
  const [stats, setStats] = useState({
    totalReports: 0, totalEmergencies: 0, activeUsers: 0,
    urgentReports: 0, urgentEmergencies: 0,
    resolvedReports: 0, resolvedEmergencies: 0,
    pendingReports: 0, pendingEmergencies: 0,
    inProgressReports: 0, dispatchedEmergencies: 0,
    todayReports: 0, todayEmergencies: 0, weekTrend: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [mapData, setMapData] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today   = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [
        { count: totalReports }, { count: urgentReports }, { count: resolvedReports },
        { count: pendingReports }, { count: inProgressReports }, { count: todayReports },
        { count: totalEmergencies }, { count: urgentEmergencies }, { count: resolvedEmergencies },
        { count: pendingEmergencies }, { count: dispatchedEmergencies }, { count: todayEmergencies },
        { count: activeUsers }, { count: lastWeekReports }
      ] = await Promise.all([
        supabase.from('reports').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('priority', 'urgent').neq('status', 'resolved'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'in-progress'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('emergencies').select('*', { count: 'exact', head: true }),
        supabase.from('emergencies').select('*', { count: 'exact', head: true }).neq('status', 'resolved'),
        supabase.from('emergencies').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
        supabase.from('emergencies').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('emergencies').select('*', { count: 'exact', head: true }).eq('status', 'dispatched'),
        supabase.from('emergencies').select('*', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('admin_users').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      ]);

      const weekTrend = lastWeekReports > 0
        ? Math.round(((todayReports - (lastWeekReports / 7)) / (lastWeekReports / 7)) * 100)
        : 0;

      setStats({
        totalReports: totalReports || 0, totalEmergencies: totalEmergencies || 0,
        urgentReports: urgentReports || 0, urgentEmergencies: urgentEmergencies || 0,
        resolvedReports: resolvedReports || 0, resolvedEmergencies: resolvedEmergencies || 0,
        pendingReports: pendingReports || 0, pendingEmergencies: pendingEmergencies || 0,
        inProgressReports: inProgressReports || 0, dispatchedEmergencies: dispatchedEmergencies || 0,
        activeUsers: activeUsers || 0,
        todayReports: todayReports || 0, todayEmergencies: todayEmergencies || 0,
        weekTrend
      });

      let activityData = [];
      if (dataType !== 'emergencies') {
        const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(4);
        activityData.push(...(data || []).map(r => ({ ...r, _type: 'report' })));
      }
      if (dataType !== 'reports') {
        const { data } = await supabase.from('emergencies').select('*').order('created_at', { ascending: false }).limit(4);
        activityData.push(...(data || []).map(e => ({ ...e, _type: 'emergency', title: e.type + ' Emergency' })));
      }
      activityData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRecentActivity(activityData.slice(0, 8));

      let mapItems = [];
      if (dataType !== 'emergencies') {
        let q = supabase.from('reports').select('*').limit(50);
        if (filterStatus !== 'all')   q = q.eq('status', filterStatus);
        if (filterPriority !== 'all') q = q.eq('priority', filterPriority);
        const { data } = await q;
        mapItems.push(...(data || []));
      }
      if (dataType !== 'reports') {
        let q = supabase.from('emergencies').select('*').limit(50);
        if (filterStatus !== 'all')   q = q.eq('status', filterStatus);
        const { data } = await q;
        mapItems.push(...(data || []));
      }
      setMapData(mapItems);

      const urgentNotifs = [];
      const { data: uR } = await supabase.from('reports').select('*').eq('priority', 'urgent').eq('status', 'pending').order('created_at', { ascending: false }).limit(3);
      urgentNotifs.push(...(uR || []).map(r => ({ ...r, _type: 'report' })));
      const { data: uE } = await supabase.from('emergencies').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(3);
      urgentNotifs.push(...(uE || []).map(e => ({ ...e, _type: 'emergency', title: e.type + ' Emergency' })));
      urgentNotifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setNotifications(urgentNotifs.slice(0, 5));

    } catch (err) { console.error('Dashboard error:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const sub = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergencies' }, fetchData)
      .subscribe();
    return () => sub.unsubscribe();
  }, [filterStatus, filterPriority, dataType]);

  useEffect(() => {
    const reportId = searchParams.get('reportId');
    if (reportId) {
      supabase.from('reports').select('*').eq('id', reportId).single()
        .then(({ data }) => { if (data) setViewingReport(data); });
    }
  }, [searchParams]);

  const handleViewItem = (item) => {
    if (item._type === 'emergency' || item.type) setViewingEmergency(item);
    else setViewingReport(item);
  };

  const pendingPercent    = stats.totalReports ? Math.round((stats.pendingReports    / stats.totalReports) * 100) : 0;
  const urgentPercent     = stats.totalReports ? Math.round((stats.urgentReports     / stats.totalReports) * 100) : 0;
  const resolvedPercent   = stats.totalReports ? Math.round((stats.resolvedReports   / stats.totalReports) * 100) : 0;
  const inProgressPercent = stats.totalReports ? Math.round((stats.inProgressReports / stats.totalReports) * 100) : 0;

  const dataTypeTabs = [
    { key: 'all',         label: 'All Data',           icon: Activity  },
    { key: 'reports',     label: 'Reports Only',        icon: FileText  },
    { key: 'emergencies', label: 'Emergencies Only',    icon: Ambulance },
  ];

  const statCards = [
    { label: 'Total Reports',     value: stats.totalReports,                              icon: FileText,    color: 'text-slate-700'  },
    { label: 'Emergencies',       value: stats.totalEmergencies,                          icon: Ambulance,   color: 'text-red-600'    },
    { label: 'Urgent / Critical', value: stats.urgentReports + stats.urgentEmergencies,   icon: Zap,         color: 'text-orange-600' },
    { label: 'Pending',           value: stats.pendingReports + stats.pendingEmergencies, icon: Clock,       color: 'text-amber-600'  },
    { label: 'Resolved',          value: stats.resolvedReports + stats.resolvedEmergencies, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Today',             value: stats.todayReports + stats.todayEmergencies,     icon: TrendingUp,  color: 'text-blue-600'   },
  ];

  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-50">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 uppercase tracking-widest font-semibold">
            <Activity className="w-3.5 h-3.5" />Operations Center
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Command Center</h1>
          <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Real-time monitoring · Quezon City
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-sm">
            <Calendar className="w-4 h-4" />Today
          </button>
        </div>
      </div>

      {/* ── Data Type Tabs ── */}
      <div className="bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm flex gap-1.5">
        {dataTypeTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setDataType(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wide transition-all ${
              dataType === key
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
              </div>
              <Icon className={`w-5 h-5 ${color} opacity-50`} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Urgent Alerts Banner ── */}
      {notifications.length > 0 && (
        <div className="bg-white border-2 border-red-300 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-red-50 border-b border-red-200 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-red-600" />
              <span className="text-xs font-bold text-red-700 uppercase tracking-widest">
                Urgent Alerts — {notifications.length} item{notifications.length > 1 ? 's' : ''} require immediate attention
              </span>
            </div>
            <button
              onClick={() => navigate(dataType === 'emergencies' ? '/emergency' : '/reports')}
              className="text-xs font-semibold text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {notifications.slice(0, 4).map(notif => (
              <div
                key={notif.id}
                onClick={() => handleViewItem(notif)}
                className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0 mt-1.5"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">
                    {notif._type === 'emergency' ? '🚨 ' : '📋 '}
                    {notif.title || notif.type + ' Emergency'}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{notif.location || notif.location_text}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(notif.created_at).toLocaleTimeString()}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Content: Map + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Map Column */}
        <div className="lg:col-span-8 space-y-4">

          {/* Map Filters */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Map Filters</span>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="dispatched">Dispatched</option>
                <option value="resolved">Resolved</option>
              </select>
              <select
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-700"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent / Critical</option>
              </select>
              <span className="text-xs text-slate-400 ml-auto">
                <strong className="text-slate-600">{mapData.length}</strong> items on map
              </span>
            </div>
          </div>

          {/* Map */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden h-[560px]">
            <InteractiveMap markers={mapData} selectedMarker={selectedMarker} onMarkerClick={setSelectedMarker} />
          </div>

          {/* Selected Marker Card */}
          {selectedMarker && (
            <MarkerDetailCard marker={selectedMarker} onViewFull={handleViewItem} dataType={dataType} />
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">

          {/* Status Distribution */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <BarChart2 className="w-3.5 h-3.5" />Status Distribution
              </p>
              <Activity className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-3.5">
              {[
                { label: 'Pending',     pct: pendingPercent,    bar: 'bg-amber-400',  text: 'text-amber-600'  },
                { label: 'Urgent',      pct: urgentPercent,     bar: 'bg-red-500',    text: 'text-red-600'    },
                { label: 'In Progress', pct: inProgressPercent, bar: 'bg-blue-500',   text: 'text-blue-600'   },
                { label: 'Resolved',    pct: resolvedPercent,   bar: 'bg-green-500',  text: 'text-green-600'  },
              ].map(({ label, pct, bar, text }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700">{label}</span>
                    <span className={`font-bold ${text}`}>{pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: `${pct}%` }} className={`h-full ${bar} rounded-full transition-all duration-500`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />Quick Navigation
            </p>
            <div className="space-y-2">
              {[
                { label: 'View All Reports',      icon: FileText,  color: 'text-slate-600',  path: '/reports'     },
                { label: 'View All Emergencies',  icon: Ambulance, color: 'text-red-600',    path: '/emergency'   },
                { label: 'Manage Responders',     icon: UserCheck, color: 'text-green-600',  path: '/responders'  },
              ].map(({ label, icon: Icon, color, path }) => (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs font-semibold text-slate-700 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${color}`} />{label}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ))}
              <button className="w-full flex items-center justify-center gap-2 p-3 bg-slate-700 hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors">
                <Download className="w-3.5 h-3.5" />Export Report (CSV)
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />Recent Activity
              </p>
              <button onClick={() => navigate('/reports')} className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 transition-colors">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="max-h-[480px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">No recent activity</div>
              ) : recentActivity.map(activity => (
                <div
                  key={activity.id}
                  onClick={() => handleViewItem(activity)}
                  className="p-4 hover:bg-slate-50 border-b border-slate-100 cursor-pointer transition-all flex gap-3 group last:border-b-0"
                >
                  <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                    activity._type === 'emergency' ? 'bg-red-500 animate-pulse' :
                    activity.priority === 'urgent' ? 'bg-red-500 animate-pulse' :
                    activity.priority === 'high'   ? 'bg-orange-500' : 'bg-blue-400'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-slate-700">
                      {activity._type === 'emergency' ? '🚨 ' : ''}
                      {activity.title || activity.type + ' Emergency'}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <StatusBadge status={activity.status} />
                      <span className="text-xs text-slate-400">
                        {new Date(activity.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0 mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {viewingReport && (
        <FullReportModal report={viewingReport} onClose={() => setViewingReport(null)} onUpdate={() => { fetchData(); setViewingReport(null); }} />
      )}
      {viewingEmergency && (
        <FullEmergencyModal emergency={viewingEmergency} onClose={() => setViewingEmergency(null)} onUpdate={() => { fetchData(); setViewingEmergency(null); }} />
      )}
    </div>
  );
}
