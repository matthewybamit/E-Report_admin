// src/pages/Dashboard.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import L from 'leaflet'; // Import Leaflet directly
import 'leaflet/dist/leaflet.css'; // Import CSS

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
  ExternalLink
} from 'lucide-react';

// --- MAP CONFIGURATION ---
// Center of Quezon City
const QC_CENTER = [14.6760, 121.0437]; 
const INITIAL_ZOOM = 13;

// --- CUSTOM MARKER ICONS (Pure Leaflet) ---
const createCustomIcon = (color) => L.divIcon({
  className: 'custom-pin', // We will add a small style for this below
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
  iconAnchor: [15, 42], // Tip of the pin
  popupAnchor: [0, -45]
});

const redIcon = createCustomIcon('#ef4444');   // Urgent
const greenIcon = createCustomIcon('#22c55e'); // Resolved
const blueIcon = createCustomIcon('#3b82f6');  // Normal

// --- INTERACTIVE MAP COMPONENT (Pure Leaflet Version) ---
function InteractiveMap({ markers, selectedMarker, onMarkerClick }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  // 1. Initialize Map
  useEffect(() => {
    if (mapInstanceRef.current) return; // Map already initialized

    // Create Map Instance
    const map = L.map(mapContainerRef.current, {
       zoomControl: false, // We'll move zoom control or hide it for clean UI
       attributionControl: false
    }).setView(QC_CENTER, INITIAL_ZOOM);

    // Add Tile Layer (This gives the "Google Maps" structure look)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap, &copy; CARTO',
      maxZoom: 20
    }).addTo(map);
    
    // Add Attribution manually to bottom right to keep it legal but clean
    L.control.attribution({ position: 'bottomright' }).addTo(map);

    // Layer Group for Markers (so we can clear them easily)
    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;
    mapInstanceRef.current = map;

    // Cleanup on unmount
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Handle Markers Update
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    markers.forEach(marker => {
      const lat = marker.latitude || marker.lat;
      const lng = marker.longitude || marker.lng;

      if (lat && lng) {
        let icon = blueIcon;
        if (marker.priority === 'urgent') icon = redIcon;
        if (marker.status === 'resolved') icon = greenIcon;

        const leafletMarker = L.marker([lat, lng], { icon })
          .bindPopup(`
            <div style="font-family: sans-serif;">
              <strong style="font-size: 14px;">${marker.title}</strong><br/>
              <span style="color: #666; font-size: 12px;">${marker.location || 'Quezon City'}</span>
            </div>
          `);
        
        leafletMarker.on('click', () => onMarkerClick(marker));
        leafletMarker.addTo(markersLayerRef.current);
        
        // If this is the selected marker, open its popup immediately
        if (selectedMarker?.id === marker.id) {
            leafletMarker.openPopup();
        }
      }
    });
  }, [markers, selectedMarker, onMarkerClick]);

  // 3. Fly to Selected Marker
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
      {/* Map Container Div */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Floating Label */}
      <div className="absolute top-3 right-3 z-[500] bg-white/90 backdrop-blur-sm px-3 py-1 rounded-md shadow-md border border-gray-200 text-xs font-semibold text-gray-600">
         Quezon City Live View
      </div>
    </div>
  );
}

// --- Detail Card Component ---
function MarkerDetailCard({ marker, onViewFull }) {
  if (!marker) return null;

  const lat = marker.latitude || marker.lat;
  const lng = marker.longitude || marker.lng;
  const googleMapsUrl = lat && lng 
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(marker.location + " Quezon City")}`;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl ${marker.priority === 'urgent' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
             {marker.priority === 'urgent' ? <AlertCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{marker.title}</h3>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {new Date(marker.created_at).toLocaleDateString()} • {new Date(marker.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{marker.description}</p>
        </div>

        <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 text-red-500" />
                <span className="truncate font-medium">{marker.location || "No address provided"}</span>
            </div>
            <a 
                href={googleMapsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline pl-6 font-medium transition-colors"
            >
                <ExternalLink className="w-3 h-3 mr-1" />
                Open in Google Maps
            </a>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-2">
           <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase border ${
              marker.status === 'resolved' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
           }`}>
              {marker.status}
           </span>
        </div>

        <button 
            onClick={() => onViewFull(marker.id)}
            className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Eye className="w-4 h-4" />
          <span>View Full Report</span>
        </button>
      </div>
    </div>
  );
}

// --- Main Dashboard Component ---
export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState(null);
  
  // Real Data State
  const [stats, setStats] = useState({
    totalReports: 0,
    activeUsers: 0,
    urgentReports: 0,
    resolvedReports: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [mapData, setMapData] = useState([]);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const { count: totalReports } = await supabase.from('reports').select('*', { count: 'exact', head: true });
            const { count: urgentReports } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('priority', 'urgent').neq('status', 'resolved');
            const { count: resolvedReports } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'resolved');
            const { count: activeUsers } = await supabase.from('admin_users').select('*', { count: 'exact', head: true });

            setStats({
                totalReports: totalReports || 0,
                urgentReports: urgentReports || 0,
                resolvedReports: resolvedReports || 0,
                activeUsers: activeUsers || 0
            });

            const { data: activityData } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(5);
            setRecentActivity(activityData || []);

            const { data: mapItems } = await supabase.from('reports').select('*').neq('status', 'resolved').limit(50);
            setMapData(mapItems || []);
        } catch (error) {
            console.error("Error loading dashboard:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
    
    const subscription = supabase.channel('dashboard-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => fetchData()).subscribe();
    return () => subscription.unsubscribe();
  }, []);

  const handleNavigateToReports = (id) => navigate(id ? `/reports?reportId=${id}` : '/reports');

  const pendingPercent = stats.totalReports ? Math.round(((stats.totalReports - stats.resolvedReports - stats.urgentReports) / stats.totalReports) * 100) : 0;
  const urgentPercent = stats.totalReports ? Math.round((stats.urgentReports / stats.totalReports) * 100) : 0;
  const resolvedPercent = stats.totalReports ? Math.round((stats.resolvedReports / stats.totalReports) * 100) : 0;

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
        <button className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-semibold shadow-sm">
           <Calendar className="w-4 h-4" /> <span>Today</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between mb-4"><div className="bg-blue-50 p-3 rounded-xl"><FileText className="text-blue-600"/></div><span className="text-gray-500 font-bold text-xs uppercase">Total</span></div>
            <p className="text-3xl font-bold">{stats.totalReports}</p>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between mb-4"><div className="bg-red-50 p-3 rounded-xl"><AlertCircle className="text-red-600"/></div><span className="text-red-500 font-bold text-xs uppercase animate-pulse">Urgent</span></div>
            <p className="text-3xl font-bold">{stats.urgentReports}</p>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between mb-4"><div className="bg-green-50 p-3 rounded-xl"><Users className="text-green-600"/></div><span className="text-gray-500 font-bold text-xs uppercase">Users</span></div>
            <p className="text-3xl font-bold">{stats.activeUsers}</p>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between mb-4"><div className="bg-purple-50 p-3 rounded-xl"><CheckCircle className="text-purple-600"/></div><span className="text-gray-500 font-bold text-xs uppercase">Resolved</span></div>
            <p className="text-3xl font-bold">{stats.resolvedReports}</p>
         </div>
      </div>

      {/* Main Content: Map + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-1 h-[600px] w-full z-0">
              <InteractiveMap 
                markers={mapData} 
                selectedMarker={selectedMarker} 
                onMarkerClick={setSelectedMarker} 
              />
          </div>
          
          {selectedMarker && (
             <div className="fixed bottom-6 right-6 w-96 z-[1100] lg:static lg:w-full lg:z-0">
                <MarkerDetailCard marker={selectedMarker} onViewFull={handleNavigateToReports} />
             </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status Overview */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
            <h3 className="font-bold mb-6 text-gray-900">Status Overview</h3>
            <div className="space-y-4">
               <div><div className="flex justify-between text-sm mb-1"><span>Pending</span><span className="text-blue-600">{pendingPercent}%</span></div><div className="h-2 bg-gray-100 rounded-full"><div style={{width:`${pendingPercent}%`}} className="h-full bg-blue-500 rounded-full"></div></div></div>
               <div><div className="flex justify-between text-sm mb-1"><span>Urgent</span><span className="text-red-600">{urgentPercent}%</span></div><div className="h-2 bg-gray-100 rounded-full"><div style={{width:`${urgentPercent}%`}} className="h-full bg-red-500 rounded-full"></div></div></div>
               <div><div className="flex justify-between text-sm mb-1"><span>Resolved</span><span className="text-green-600">{resolvedPercent}%</span></div><div className="h-2 bg-gray-100 rounded-full"><div style={{width:`${resolvedPercent}%`}} className="h-full bg-green-500 rounded-full"></div></div></div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
             <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between">
                <h3 className="font-bold text-gray-900">Recent Activity</h3>
                <button onClick={()=>navigate('/reports')} className="text-xs text-blue-600 font-bold hover:underline">View All</button>
             </div>
             <div className="max-h-[400px] overflow-y-auto">
                {loading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin"/></div> : 
                 recentActivity.length === 0 ? <div className="p-8 text-center text-gray-500">No activity</div> :
                 recentActivity.map(activity => (
                    <div key={activity.id} onClick={()=>handleNavigateToReports(activity.id)} className="p-4 hover:bg-gray-50 border-b border-gray-50 cursor-pointer flex gap-3">
                       <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${activity.priority === 'urgent' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                       <div>
                          <p className="text-sm font-bold text-gray-900 line-clamp-1">{activity.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{activity.description}</p>
                       </div>
                    </div>
                 ))
                }
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
