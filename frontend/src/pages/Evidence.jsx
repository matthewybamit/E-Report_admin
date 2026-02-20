// src/pages/Evidence.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import {
  Camera,
  Download,
  Eye,
  X,
  Search,
  Calendar,
  User,
  MapPin,
  CheckCircle,
  Maximize2,
  RefreshCw
} from 'lucide-react';

export default function Evidence() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [imageZoomed, setImageZoomed] = useState(false);

  useEffect(() => { fetchReportsWithEvidence(); }, []);
  useEffect(() => { filterReports(); }, [reports, searchQuery]);

  const fetchReportsWithEvidence = async () => {
    try {
      setLoading(true);
      // ✅ REMOVED: ai_verdict, ai_score, ai_notes from select
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('status', 'resolved')
        .not('evidence_photo_url', 'is', null)
        .order('work_completed_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching evidence:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    if (!searchQuery) { setFilteredReports(reports); return; }
    const q = searchQuery.toLowerCase();
    const filtered = reports.filter((r) =>
      r.title?.toLowerCase().includes(q) ||
      r.report_number?.toLowerCase().includes(q) ||
      r.assigned_to?.toLowerCase().includes(q)
    );
    setFilteredReports(filtered);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                Evidence Gallery
              </h1>
              <p className="text-gray-600 mt-2 font-medium">
                View all completion evidence submitted by responders
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-xl font-bold text-sm">
                {filteredReports.length} Items
              </span>
              <button
                onClick={fetchReportsWithEvidence}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by report, responder, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-semibold">No evidence found</p>
            <p className="text-gray-500 text-sm mt-2">
              Evidence photos will appear here once responders complete reports
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-200 hover:border-green-400"
              >
                {/* Evidence Photo */}
                <div
                  className="relative h-64 overflow-hidden cursor-pointer"
                  onClick={() => setSelectedReport(report)}
                >
                  <img
                    src={report.evidence_photo_url}
                    alt="Evidence"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <button className="p-2 bg-white/90 rounded-lg hover:bg-white transition-all">
                        <Eye className="w-4 h-4 text-gray-700" />
                      </button>
                      <a
                        href={report.evidence_photo_url}
                        target="_blank"
                        rel="noreferrer"
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-white/90 rounded-lg hover:bg-white transition-all"
                      >
                        <Download className="w-4 h-4 text-gray-700" />
                      </a>
                    </div>
                  </div>
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-full text-xs font-bold shadow-lg">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Resolved
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 space-y-3">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight">
                    {report.title}
                  </h3>
                  <p className="text-sm text-green-600 font-semibold">{report.report_number}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{report.assigned_to || 'Unknown'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{report.location || 'No location'}</span>
                  </div>

                  {/* ✅ REMOVED: AI Suspicion Badge — no longer shown here */}

                  <div className="flex items-center gap-2 text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(report.work_completed_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedReport(report)}
                    className="w-full mt-3 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Full Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-700 px-8 py-6 z-10 rounded-t-3xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedReport.title}</h2>
                  <p className="text-green-100 text-sm mt-1">{selectedReport.report_number}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white">
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      Resolved
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-white/80 hover:text-white hover:bg-white/20 p-2.5 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Evidence Photo */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide flex items-center">
                  <Camera className="w-4 h-4 mr-2 text-green-600" />
                  Evidence Photo
                </h3>
                <div
                  onClick={() => setImageZoomed(true)}
                  className="relative group cursor-zoom-in overflow-hidden rounded-2xl border-2 border-green-200 hover:border-green-400 transition-all"
                >
                  <img
                    src={selectedReport.evidence_photo_url}
                    alt="Evidence"
                    className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-5 h-5 text-gray-700 inline mr-2" />
                      <span className="text-sm font-semibold text-gray-700">Click to enlarge</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ REMOVED: AI Fraud Check block — belongs in Reports.jsx only */}

              {/* Responder Notes */}
              {selectedReport.responder_notes && (
                <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                  <h3 className="text-sm font-bold text-green-800 mb-2 uppercase tracking-wide">
                    Responder Notes
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedReport.responder_notes}
                  </p>
                </div>
              )}

              {/* Report Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Responder</p>
                  <p className="text-sm font-bold text-gray-900">{selectedReport.assigned_to}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Category</p>
                  <p className="text-sm font-bold text-gray-900 capitalize">{selectedReport.category}</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4">
                  <p className="text-xs text-orange-600 uppercase font-semibold mb-1">Location</p>
                  <p className="text-sm font-semibold text-gray-900 line-clamp-1">{selectedReport.location}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-xs text-green-600 uppercase font-semibold mb-1">Completed</p>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(selectedReport.work_completed_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Download Button */}
              <a
                href={selectedReport.evidence_photo_url}
                target="_blank"
                rel="noreferrer"
                download
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-all shadow-sm"
              >
                <Download className="w-5 h-5" />
                Download Evidence Photo
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Lightbox */}
      {imageZoomed && selectedReport && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setImageZoomed(false)}
        >
          <button
            className="absolute top-6 right-6 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all"
            onClick={() => setImageZoomed(false)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedReport.evidence_photo_url}
            alt="Evidence Full View"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
