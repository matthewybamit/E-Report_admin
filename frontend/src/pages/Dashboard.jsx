// src/pages/Dashboard.jsx - WITH EMERGENCIES + FILTER + MINI CARD AT BOTTOM
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../config/supabase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import Lucide Icons
import {
  FileText,
  Users,
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  Activity,
  Zap,
  Eye,
  Calendar,
  ArrowRight,
  Loader2,
  MapPin,
  ExternalLink,
  X,
  Phone,
  Mail,
  User,
  Navigation,
  Image as ImageIcon,
  Send,
  Edit3,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  Shield,
  Package,
  Wrench,
  MessageSquare,
  UserCheck,
  Ambulance,
  Flame
} from 'lucide-react';

// --- MAP CONFIGURATION ---
const QC_CENTER = [14.6760, 121.0437]; 
const INITIAL_ZOOM = 13;

// --- CUSTOM MARKER ICONS ---
const createCustomIcon = (color) => L.divIcon({
  className: 'custom-pin',
  html: `
    <div style="
      background-color: ${color};
      width: 30px;
      height: 30px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 3px 5px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 10px; 
        height: 10px; 
        background: white; 
        border-radius: 50%; 
      "></div>
    </div>
  `,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -45]
});

const redIcon = createCustomIcon('#ef4444');
const greenIcon = createCustomIcon('#22c55e');
const blueIcon = createCustomIcon('#3b82f6');
const orangeIcon = createCustomIcon('#f97316');

// --- FULL REPORT VIEW MODAL ---
function FullReportModal({ report, onClose, onUpdate }) {
  const [imageZoomed, setImageZoomed] = useState(false);

  if (!report) return null;

  const handleQuickAction = async (action) => {
    try {
      let updates = {};
      switch(action) {
        case 'assign':
          updates = { status: 'in-progress' };
          break;
        case 'resolve':
          updates = { status: 'resolved', resolved_at: new Date().toISOString() };
          break;
        case 'reject':
          updates = { status: 'rejected' };
          break;
      }
      
      await supabase.from('reports').update(updates).eq('id', report.id);
      onUpdate();
      alert(`Report ${action}ed successfully!`);
    } catch (error) {
      console.error('Quick action error:', error);
      alert('Failed to update report');
    }
  };

  const categoryIcons = {
    security: Shield,
    infrastructure: Wrench,
    sanitation: Package,
    other: AlertTriangle
  };
  const CategoryIcon = categoryIcons[report.category] || AlertTriangle;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 p-2 rounded-lg">
                  <CategoryIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">{report.title}</h2>
              </div>
              <p className="text-blue-100 text-sm">{report.report_number}</p>
              <div className="flex gap-2 mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                  report.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                  report.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {report.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  report.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  report.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {report.priority}
                </span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Quick Actions */}
          {report.status === 'pending' && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border-2 border-purple-200">
              <p className="text-sm font-bold text-purple-900 mb-3">Quick Actions</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleQuickAction('assign')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm"
                >
                  <Send className="w-4 h-4" />
                  Assign to Responder
                </button>
                <button 
                  onClick={() => handleQuickAction('resolve')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Resolved
                </button>
                <button 
                  onClick={() => handleQuickAction('reject')}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold text-sm"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Reporter Info */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <User className="w-4 h-4 mr-2 text-blue-600" />
              Reporter Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-blue-600 font-semibold mb-1">NAME</p>
                <p className="font-semibold text-gray-900">{report.reporter_name}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 font-semibold mb-1">PHONE</p>
                <a href={`tel:${report.reporter_phone}`} className="text-blue-600 hover:text-blue-700 font-medium flex items-center">
                  <Phone className="w-3 h-3 mr-1" />
                  {report.reporter_phone}
                </a>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-blue-600 font-semibold mb-1">EMAIL</p>
                <a href={`mailto:${report.reporter_email}`} className="text-blue-600 hover:text-blue-700 font-medium flex items-center">
                  <Mail className="w-3 h-3 mr-1" />
                  {report.reporter_email}
                </a>
              </div>
            </div>
          </div>

          {/* Report Details */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-gray-600" />
              Report Details
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1">CATEGORY</p>
                <p className="font-semibold text-gray-900 capitalize">{report.category}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1">DESCRIPTION</p>
                <p className="text-gray-700 leading-relaxed">{report.description}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1">SUBMITTED</p>
                <p className="text-gray-700 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(report.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-green-600" />
              Location
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-green-600 font-semibold mb-1">ADDRESS</p>
                <p className="font-medium text-gray-900">{report.location || 'Not provided'}</p>
              </div>
              {report.landmark && (
                <div>
                  <p className="text-xs text-green-600 font-semibold mb-1">LANDMARK</p>
                  <p className="text-gray-700">{report.landmark}</p>
                </div>
              )}
              {report.latitude && report.longitude && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm"
                >
                  <Navigation className="w-4 h-4" />
                  Open in Google Maps
                </a>
              )}
            </div>
          </div>

          {/* Image */}
          {report.image_url && (
            <div>
              <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                <ImageIcon className="w-4 h-4 mr-2" />
                Evidence Photo
              </h3>
              <div 
                onClick={() => setImageZoomed(true)}
                className="relative group cursor-zoom-in overflow-hidden rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-all"
              >
                <img 
                  src={report.image_url} 
                  alt="Report evidence" 
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                  <div className="bg-white/90 px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <p className="text-sm font-semibold">Click to enlarge</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Notes */}
          {report.admin_notes && (
            <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2 text-purple-600" />
                Admin Notes
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{report.admin_notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold text-gray-700"
          >
            Close
          </button>
          <button 
            onClick={() => {
              onClose();
              window.open(`/reports?reportId=${report.id}`, '_blank');
            }}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
          >
            <Edit3 className="w-4 h-4" />
            Edit in Reports Page
          </button>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {imageZoomed && (
        <div 
          className="fixed inset-0 z-[2100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setImageZoomed(false)}
        >
          <button 
            className="absolute top-6 right-6 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full"
            onClick={() => setImageZoomed(false)}
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={report.image_url} 
            alt="Evidence Full View" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// --- FULL EMERGENCY VIEW MODAL ---
function FullEmergencyModal({ emergency, onClose, onUpdate }) {
  if (!emergency) return null;

  const handleQuickResolve = async () => {
    try {
      await supabase.from('emergencies').update({ 
        status: 'resolved',
        completed_at: new Date().toISOString()
      }).eq('id', emergency.id);
      onUpdate();
      alert('Emergency resolved successfully!');
    } catch (error) {
      console.error('Resolve error:', error);
      alert('Failed to resolve emergency');
    }
  };

  const emergencyIcons = {
    Medical: Ambulance,
    Fire: Flame,
    Crime: Shield,
    Accident: AlertTriangle,
  };
  const EmergencyIcon = emergencyIcons[emergency.type] || AlertTriangle;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 p-2 rounded-lg">
                  <EmergencyIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">{emergency.type} EMERGENCY</h2>
              </div>
              <p className="text-red-100 text-sm">ID: {emergency.id.slice(0, 8)}</p>
              <div className="flex gap-2 mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  emergency.status === 'resolved' ? 'bg-green-100 text-green-800' :
                  emergency.status === 'dispatched' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {emergency.status}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                  {emergency.severity || 'HIGH'}
                </span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Quick Actions */}
          {emergency.status === 'pending' && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border-2 border-red-200">
              <p className="text-sm font-bold text-red-900 mb-3">Quick Actions</p>
              <div className="flex gap-2">
                <button 
                  onClick={handleQuickResolve}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Resolved
                </button>
              </div>
            </div>
          )}

          {/* Emergency Details */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
              Emergency Details
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1">TYPE</p>
                <p className="font-semibold text-gray-900">{emergency.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1">DESCRIPTION</p>
                <p className="text-gray-700 leading-relaxed">{emergency.description}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1">REPORTED</p>
                <p className="text-gray-700 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(emergency.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-green-600" />
              Location
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-green-600 font-semibold mb-1">ADDRESS</p>
                <p className="font-medium text-gray-900">{emergency.location_text || 'GPS Coordinates'}</p>
              </div>
              {emergency.latitude && emergency.longitude && (
                <>
                  <div>
                    <p className="text-xs text-green-600 font-semibold mb-1">COORDINATES</p>
                    <p className="text-gray-700">{emergency.latitude.toFixed(5)}, {emergency.longitude.toFixed(5)}</p>
                  </div>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${emergency.latitude},${emergency.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm"
                  >
                    <Navigation className="w-4 h-4" />
                    Open in Google Maps
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Responder Notes */}
          {emergency.responder_notes && (
            <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2 text-purple-600" />
                Responder Notes
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{emergency.responder_notes}</p>
            </div>
          )}

          {/* Evidence Photo */}
          {emergency.evidence_photo_url && (
            <div>
              <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                <ImageIcon className="w-4 h-4 mr-2" />
                Evidence Photo
              </h3>
              <div className="overflow-hidden rounded-xl border-2 border-gray-200">
                <img 
                  src={emergency.evidence_photo_url} 
                  alt="Emergency evidence" 
                  className="w-full h-64 object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold text-gray-700"
          >
            Close
          </button>
          <button 
            onClick={() => {
              onClose();
              window.open(`/emergency`, '_blank');
            }}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold"
          >
            <Eye className="w-4 h-4" />
            View in Emergency Page
          </button>
        </div>
      </div>
    </div>
  );
}

// --- INTERACTIVE MAP COMPONENT ---
function InteractiveMap({ markers, selectedMarker, onMarkerClick }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
       zoomControl: true,
       attributionControl: false
    }).setView(QC_CENTER, INITIAL_ZOOM);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap, &copy; CARTO',
      maxZoom: 20
    }).addTo(map);
    
    L.control.attribution({ position: 'bottomright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    markers.forEach(marker => {
      const lat = marker.latitude || marker.lat;
      const lng = marker.longitude || marker.lng;

      if (lat && lng) {
        let icon = blueIcon;
        
        // Different icon logic for emergencies vs reports
        if (marker.type) { // Emergency
          if (marker.severity === 'critical' || marker.severity === 'urgent') icon = redIcon;
          else if (marker.severity === 'high') icon = orangeIcon;
          if (marker.status === 'resolved') icon = greenIcon;
        } else { // Report
          if (marker.priority === 'urgent') icon = redIcon;
          else if (marker.priority === 'high') icon = orangeIcon;
          if (marker.status === 'resolved') icon = greenIcon;
        }

        const leafletMarker = L.marker([lat, lng], { icon })
          .bindPopup(`
            <div style="font-family: sans-serif;">
              <strong style="font-size: 14px;">${marker.title || marker.type + ' Emergency'}</strong><br/>
              <span style="color: #666; font-size: 12px;">${marker.location || marker.location_text || 'Quezon City'}</span>
            </div>
          `);
        
        leafletMarker.on('click', () => onMarkerClick(marker));
        leafletMarker.addTo(markersLayerRef.current);
        
        if (selectedMarker?.id === marker.id) {
            leafletMarker.openPopup();
        }
      }
    });
  }, [markers, selectedMarker, onMarkerClick]);

  useEffect(() => {
    if (selectedMarker && mapInstanceRef.current) {
      const lat = selectedMarker.latitude || selectedMarker.lat;
      const lng = selectedMarker.longitude || selectedMarker.lng;
      if (lat && lng) {
        mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.5 });
      }
    }
  }, [selectedMarker]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-inner border border-gray-300 z-0">
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      <div className="absolute top-3 right-3 z-[500] bg-white/90 backdrop-blur-sm px-3 py-1 rounded-md shadow-md border border-gray-200 text-xs font-semibold text-gray-600">
         🗺️ Quezon City Live View
      </div>
    </div>
  );
}

// --- MINI DETAIL CARD (COMPACT VERSION FOR BOTTOM OF MAP) ---
function MarkerDetailCard({ marker, onViewFull, dataType }) {
  if (!marker) return null;

  const isEmergency = dataType === 'emergency' || marker.type; // Check if emergency

  return (
    <div className="bg-white rounded-xl shadow-xl border-2 border-gray-300 p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Icon + Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`p-2.5 rounded-lg flex-shrink-0 ${
            isEmergency ? 'bg-red-50 text-red-600' : 
            marker.priority === 'urgent' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
          }`}>
             {isEmergency ? <Ambulance className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base line-clamp-1">
              {isEmergency ? `${marker.type} Emergency` : marker.title}
            </h3>
            <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">
              {marker.description}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                marker.status === 'resolved' ? 'bg-green-100 text-green-700' : 
                marker.status === 'in-progress' || marker.status === 'dispatched' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {marker.status}
              </span>
              <span className="text-xs text-gray-500 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {new Date(marker.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Action Button */}
        <button 
          onClick={() => onViewFull(marker)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition-all shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap flex-shrink-0"
        >
          <Eye className="w-4 h-4" />
          <span>View Details</span>
        </button>
      </div>
    </div>
  );
}

// --- MAIN DASHBOARD ---
export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const [viewingEmergency, setViewingEmergency] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  
  // NEW: Data type filter
  const [dataType, setDataType] = useState('all'); // 'all', 'reports', 'emergencies'
  
  const [stats, setStats] = useState({
    totalReports: 0,
    totalEmergencies: 0,
    activeUsers: 0,
    urgentReports: 0,
    urgentEmergencies: 0,
    resolvedReports: 0,
    resolvedEmergencies: 0,
    pendingReports: 0,
    pendingEmergencies: 0,
    inProgressReports: 0,
    dispatchedEmergencies: 0,
    todayReports: 0,
    todayEmergencies: 0,
    weekTrend: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [mapData, setMapData] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Reports stats
      const { count: totalReports } = await supabase.from('reports').select('*', { count: 'exact', head: true });
      const { count: urgentReports } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('priority', 'urgent').neq('status', 'resolved');
      const { count: resolvedReports } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'resolved');
      const { count: pendingReports } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: inProgressReports } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'in-progress');
      const { count: todayReports } = await supabase.from('reports').select('*', { count: 'exact', head: true }).gte('created_at', today);

      // Emergencies stats
      const { count: totalEmergencies } = await supabase.from('emergencies').select('*', { count: 'exact', head: true });
      const { count: urgentEmergencies } = await supabase.from('emergencies').select('*', { count: 'exact', head: true }).neq('status', 'resolved');
      const { count: resolvedEmergencies } = await supabase.from('emergencies').select('*', { count: 'exact', head: true }).eq('status', 'resolved');
      const { count: pendingEmergencies } = await supabase.from('emergencies').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: dispatchedEmergencies } = await supabase.from('emergencies').select('*', { count: 'exact', head: true }).eq('status', 'dispatched');
      const { count: todayEmergencies } = await supabase.from('emergencies').select('*', { count: 'exact', head: true }).gte('created_at', today);

      const { count: activeUsers } = await supabase.from('admin_users').select('*', { count: 'exact', head: true });
      const { count: lastWeekReports } = await supabase.from('reports').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo);

      const weekTrend = lastWeekReports > 0 ? Math.round(((todayReports - (lastWeekReports/7)) / (lastWeekReports/7)) * 100) : 0;

      setStats({
        totalReports: totalReports || 0,
        totalEmergencies: totalEmergencies || 0,
        urgentReports: urgentReports || 0,
        urgentEmergencies: urgentEmergencies || 0,
        resolvedReports: resolvedReports || 0,
        resolvedEmergencies: resolvedEmergencies || 0,
        pendingReports: pendingReports || 0,
        pendingEmergencies: pendingEmergencies || 0,
        inProgressReports: inProgressReports || 0,
        dispatchedEmergencies: dispatchedEmergencies || 0,
        activeUsers: activeUsers || 0,
        todayReports: todayReports || 0,
        todayEmergencies: todayEmergencies || 0,
        weekTrend
      });

      // Fetch recent activity based on data type
      let activityData = [];
      if (dataType === 'reports' || dataType === 'all') {
        const { data: reportsData } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(4);
        activityData = [...activityData, ...(reportsData || []).map(r => ({ ...r, _type: 'report' }))];
      }
      if (dataType === 'emergencies' || dataType === 'all') {
        const { data: emergenciesData } = await supabase.from('emergencies').select('*').order('created_at', { ascending: false }).limit(4);
        activityData = [...activityData, ...(emergenciesData || []).map(e => ({ ...e, _type: 'emergency', title: e.type + ' Emergency' }))];
      }
      activityData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRecentActivity(activityData.slice(0, 8));

      // Map data based on filters
      let mapItems = [];
      if (dataType === 'reports' || dataType === 'all') {
        let reportQuery = supabase.from('reports').select('*').limit(50);
        if (filterStatus !== 'all') reportQuery = reportQuery.eq('status', filterStatus);
        if (filterPriority !== 'all') reportQuery = reportQuery.eq('priority', filterPriority);
        const { data: reports } = await reportQuery;
        mapItems = [...mapItems, ...(reports || [])];
      }
      if (dataType === 'emergencies' || dataType === 'all') {
        let emergencyQuery = supabase.from('emergencies').select('*').limit(50);
        if (filterStatus !== 'all') emergencyQuery = emergencyQuery.eq('status', filterStatus);
        const { data: emergencies } = await emergencyQuery;
        mapItems = [...mapItems, ...(emergencies || [])];
      }
      setMapData(mapItems);

      // Fetch urgent notifications (both reports and emergencies)
      const urgentNotifs = [];
      const { data: urgentReportsNotifs } = await supabase
        .from('reports')
        .select('*')
        .eq('priority', 'urgent')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(3);
      urgentNotifs.push(...(urgentReportsNotifs || []).map(r => ({ ...r, _type: 'report' })));
      
      const { data: urgentEmergenciesNotifs } = await supabase
        .from('emergencies')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(3);
      urgentNotifs.push(...(urgentEmergenciesNotifs || []).map(e => ({ ...e, _type: 'emergency', title: e.type + ' Emergency' })));
      
      urgentNotifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setNotifications(urgentNotifs.slice(0, 5));

    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const subscription = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergencies' }, () => fetchData())
      .subscribe();
    
    return () => subscription.unsubscribe();
  }, [filterStatus, filterPriority, dataType]);

  // Check for reportId in URL on mount
  useEffect(() => {
    const reportId = searchParams.get('reportId');
    if (reportId) {
      const loadReport = async () => {
        const { data } = await supabase.from('reports').select('*').eq('id', reportId).single();
        if (data) setViewingReport(data);
      };
      loadReport();
    }
  }, [searchParams]);

  const handleViewItem = async (item) => {
    if (item._type === 'emergency' || item.type) {
      if (typeof item === 'string') {
        const { data } = await supabase.from('emergencies').select('*').eq('id', item).single();
        if (data) setViewingEmergency(data);
      } else {
        setViewingEmergency(item);
      }
    } else {
      if (typeof item === 'string') {
        const { data } = await supabase.from('reports').select('*').eq('id', item).single();
        if (data) setViewingReport(data);
      } else {
        setViewingReport(item);
      }
    }
  };

  const pendingPercent = stats.totalReports ? Math.round((stats.pendingReports / stats.totalReports) * 100) : 0;
  const urgentPercent = stats.totalReports ? Math.round((stats.urgentReports / stats.totalReports) * 100) : 0;
  const resolvedPercent = stats.totalReports ? Math.round((stats.resolvedReports / stats.totalReports) * 100) : 0;
  const inProgressPercent = stats.totalReports ? Math.round((stats.inProgressReports / stats.totalReports) * 100) : 0;

  return (
    <div className="p-6 space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Command Center</h1>
          <p className="text-gray-600 mt-1 font-medium flex items-center">
            <Activity className="w-4 h-4 mr-2 text-green-600 animate-pulse" />
            Real-time monitoring • Quezon City
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchData}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-semibold shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-semibold shadow-sm">
            <Calendar className="w-4 h-4" />
            <span>Today</span>
          </button>
        </div>
      </div>

      {/* DATA TYPE FILTER TABS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setDataType('all')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all ${
              dataType === 'all' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            All Data
          </button>
          <button
            onClick={() => setDataType('reports')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all ${
              dataType === 'reports' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            Reports Only
          </button>
          <button
            onClick={() => setDataType('emergencies')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all ${
              dataType === 'emergencies' 
                ? 'bg-red-600 text-white shadow-md' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Ambulance className="w-4 h-4" />
            Emergencies Only
          </button>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase opacity-90">Reports</span>
          </div>
          <p className="text-4xl font-bold mb-1">{stats.totalReports}</p>
          <p className="text-xs opacity-80">Total Reports</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-2xl shadow-lg text-white animate-pulse">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Ambulance className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase opacity-90">Emergencies</span>
          </div>
          <p className="text-4xl font-bold mb-1">{stats.totalEmergencies}</p>
          <p className="text-xs opacity-80">Total Emergencies</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase opacity-90">Urgent</span>
          </div>
          <p className="text-4xl font-bold mb-1">{stats.urgentReports + stats.urgentEmergencies}</p>
          <p className="text-xs opacity-80">Needs Attention</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase opacity-90">Pending</span>
          </div>
          <p className="text-4xl font-bold mb-1">{stats.pendingReports + stats.pendingEmergencies}</p>
          <p className="text-xs opacity-80">Awaiting Action</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase opacity-90">Resolved</span>
          </div>
          <p className="text-4xl font-bold mb-1">{stats.resolvedReports + stats.resolvedEmergencies}</p>
          <p className="text-xs opacity-80">Completed</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase opacity-90">Today</span>
          </div>
          <p className="text-4xl font-bold mb-1">{stats.todayReports + stats.todayEmergencies}</p>
          <div className="flex items-center text-xs opacity-80">
            {stats.weekTrend >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            <span>{Math.abs(stats.weekTrend)}% vs last week</span>
          </div>
        </div>
      </div>

      {/* Urgent Alerts Banner */}
      {notifications.length > 0 && (
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-6 shadow-lg text-white animate-in slide-in-from-top duration-500">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl animate-pulse">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl">⚠️ Urgent Alerts</h3>
                <p className="text-sm opacity-90 mt-1">{notifications.length} items require immediate attention</p>
              </div>
            </div>
            <button onClick={() => navigate(dataType === 'emergencies' ? '/emergency' : '/reports')} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {notifications.slice(0, 4).map(notif => (
              <div 
                key={notif.id}
                onClick={() => handleViewItem(notif)}
                className="bg-white/10 hover:bg-white/20 rounded-xl p-4 cursor-pointer transition-all backdrop-blur-sm border border-white/20"
              >
                <p className="font-bold line-clamp-1 mb-1">
                  {notif._type === 'emergency' ? '🚨 ' : '📋 '}
                  {notif.title || notif.type + ' Emergency'}
                </p>
                <p className="text-sm opacity-90 line-clamp-1">{notif.location || notif.location_text}</p>
                <p className="text-xs opacity-75 mt-2">{new Date(notif.created_at).toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content: Map + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-8 space-y-4">
          {/* Map Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="font-semibold text-sm text-gray-700">Map Filters:</span>
              </div>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="dispatched">Dispatched</option>
                <option value="resolved">Resolved</option>
              </select>
              <select 
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium"
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent/Critical</option>
              </select>
              <div className="ml-auto text-sm font-semibold text-gray-600">
                Showing {mapData.length} items
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-1 h-[600px] w-full z-0">
            <InteractiveMap 
              markers={mapData} 
              selectedMarker={selectedMarker} 
              onMarkerClick={setSelectedMarker} 
            />
          </div>
          
          {/* MOVED: Selected Marker Detail Card - Now Below Map */}
          {selectedMarker && (
            <MarkerDetailCard 
              marker={selectedMarker} 
              onViewFull={handleViewItem} 
              dataType={dataType} 
            />
          )}
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status Overview */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
            <h3 className="font-bold mb-6 text-gray-900 flex items-center justify-between">
              <span>Status Distribution</span>
              <Activity className="w-5 h-5 text-blue-600" />
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold">Pending</span>
                  <span className="text-yellow-600 font-bold">{pendingPercent}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div style={{width:`${pendingPercent}%`}} className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold">Urgent</span>
                  <span className="text-red-600 font-bold">{urgentPercent}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div style={{width:`${urgentPercent}%`}} className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold">In Progress</span>
                  <span className="text-blue-600 font-bold">{inProgressPercent}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div style={{width:`${inProgressPercent}%`}} className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full transition-all duration-500"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold">Resolved</span>
                  <span className="text-green-600 font-bold">{resolvedPercent}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div style={{width:`${resolvedPercent}%`}} className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-md border-2 border-indigo-200 p-6">
            <h3 className="font-bold mb-4 text-gray-900 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-indigo-600" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/reports')}
                className="w-full flex items-center justify-between p-3 bg-white hover:bg-gray-50 rounded-xl font-semibold text-sm text-gray-700 transition-all border border-gray-200 shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  View All Reports
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => navigate('/emergency')}
                className="w-full flex items-center justify-between p-3 bg-white hover:bg-gray-50 rounded-xl font-semibold text-sm text-gray-700 transition-all border border-gray-200 shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <Ambulance className="w-4 h-4 text-red-600" />
                  View All Emergencies
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => navigate('/responders')}
                className="w-full flex items-center justify-between p-3 bg-white hover:bg-gray-50 rounded-xl font-semibold text-sm text-gray-700 transition-all border border-gray-200 shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-green-600" />
                  Manage Responders
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button 
                className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-md"
              >
                <Download className="w-4 h-4" />
                Export Report (CSV)
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-gray-600" />
                Recent Activity
              </h3>
              <button onClick={()=>navigate('/reports')} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="animate-spin w-6 h-6 text-blue-600" />
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No activity</div>
              ) : (
                recentActivity.map(activity => (
                  <div 
                    key={activity.id} 
                    onClick={() => handleViewItem(activity)}
                    className="p-4 hover:bg-blue-50 border-b border-gray-50 cursor-pointer transition-all flex gap-3 group"
                  >
                    <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                      activity._type === 'emergency' ? 'bg-red-500 animate-pulse' :
                      activity.priority === 'urgent' ? 'bg-red-500 animate-pulse' : 
                      activity.priority === 'high' ? 'bg-orange-500' : 
                      'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600">
                        {activity._type === 'emergency' ? '🚨 ' : ''}
                        {activity.title || activity.type + ' Emergency'}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          activity.status === 'resolved' ? 'bg-green-100 text-green-700' :
                          activity.status === 'in-progress' || activity.status === 'dispatched' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {activity.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-all" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {viewingReport && (
        <FullReportModal 
          report={viewingReport} 
          onClose={() => setViewingReport(null)}
          onUpdate={() => {
            fetchData();
            setViewingReport(null);
          }}
        />
      )}

      {viewingEmergency && (
        <FullEmergencyModal 
          emergency={viewingEmergency} 
          onClose={() => setViewingEmergency(null)}
          onUpdate={() => {
            fetchData();
            setViewingEmergency(null);
          }}
        />
      )}
    </div>
  );
}
