// src/pages/Evidence.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import {
  Camera, Download, Eye, X, Search, Calendar,
  User, MapPin, CheckCircle, Maximize2, RefreshCw,
  FileText, Clock, Images
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
    setFilteredReports(reports.filter(r =>
      r.title?.toLowerCase().includes(q) ||
      r.report_number?.toLowerCase().includes(q) ||
      r.assigned_to?.toLowerCase().includes(q)
    ));
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-50">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 uppercase tracking-widest font-semibold">
            <Camera className="w-3.5 h-3.5" />Completion Evidence
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Evidence Gallery</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Completion photos submitted by responders upon resolution of filed reports
          </p>
        </div>
        <button
          onClick={fetchReportsWithEvidence}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Total Evidence',    value: reports.length,          icon: Images    },
          { label: 'Filtered Results',  value: filteredReports.length,  icon: Search    },
          { label: 'Resolved Reports',  value: reports.length,          icon: CheckCircle },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-bold text-slate-700 mt-1">{value}</p>
              </div>
              <Icon className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Search / Filter Bar ── */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by report title, number, or assigned responder..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Showing <strong className="text-slate-600">{filteredReports.length}</strong> of{' '}
          <strong className="text-slate-600">{reports.length}</strong> evidence records
        </p>
      </div>

      {/* ── Gallery Grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white border border-slate-200 rounded-lg">
          <div className="w-7 h-7 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin"></div>
          <span className="ml-3 text-sm text-slate-500 font-medium">Loading evidence records...</span>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-lg">
          <Camera className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">No evidence records found</p>
          <p className="text-sm text-slate-400 mt-1">
            Evidence photos appear here once responders complete and resolve reports
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredReports.map(report => (
            <div
              key={report.id}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-all group"
            >
              {/* Photo */}
              <div
                className="relative h-52 overflow-hidden cursor-pointer bg-slate-100"
                onClick={() => setSelectedReport(report)}
              >
                <img
                  src={report.evidence_photo_url}
                  alt="Completion Evidence"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end justify-between p-3 opacity-0 group-hover:opacity-100">
                  <button className="p-1.5 bg-white/90 rounded text-slate-700 hover:bg-white transition-all">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={report.evidence_photo_url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    onClick={e => e.stopPropagation()}
                    className="p-1.5 bg-white/90 rounded text-slate-700 hover:bg-white transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
                {/* Resolved Badge */}
                <div className="absolute top-2.5 right-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 border border-green-300 rounded text-xs font-semibold">
                    <CheckCircle className="w-3 h-3" />Resolved
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-2.5">
                <div>
                  <p className="text-xs text-slate-400 font-mono">{report.report_number}</p>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug mt-0.5">
                    {report.title}
                  </h3>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-medium">{report.assigned_to || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{report.location || 'No location recorded'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 pt-1 border-t border-slate-100">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {report.work_completed_at
                        ? new Date(report.work_completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Date unavailable'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedReport(report)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-700 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors mt-1"
                >
                  <Eye className="w-3.5 h-3.5" />View Full Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-slate-200">

            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-800 px-6 py-4 z-10 rounded-t-lg flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-400 font-mono">{selectedReport.report_number}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-slate-400 uppercase tracking-wide">{selectedReport.category}</span>
                </div>
                <h2 className="text-lg font-bold text-white leading-snug">{selectedReport.title}</h2>
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 border border-green-400 rounded text-xs font-semibold">
                    <CheckCircle className="w-3 h-3" />Resolved
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-white p-2 rounded transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Evidence Photo */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                    <Camera className="w-3.5 h-3.5" />Completion Evidence
                  </p>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Maximize2 className="w-3 h-3" />Click to enlarge
                  </span>
                </div>
                <div
                  onClick={() => setImageZoomed(true)}
                  className="relative group cursor-zoom-in overflow-hidden"
                >
                  <img
                    src={selectedReport.evidence_photo_url}
                    alt="Completion Evidence"
                    className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <div className="bg-white/90 px-4 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                        <Maximize2 className="w-3.5 h-3.5" />Click to enlarge
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Responder Notes */}
              {selectedReport.responder_notes && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" />Responder Field Notes
                    </p>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {selectedReport.responder_notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Resolution Details */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5" />Resolution Details
                  </p>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  {[
                    { label: 'Assigned Responder', value: selectedReport.assigned_to || 'Unknown' },
                    { label: 'Classification',     value: selectedReport.category,      capitalize: true },
                    { label: 'Location',           value: selectedReport.location || 'Not recorded', full: true },
                    {
                      label: 'Date Completed',
                      value: selectedReport.work_completed_at
                        ? new Date(selectedReport.work_completed_at).toLocaleDateString('en-US', {
                            month: 'long', day: 'numeric', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })
                        : 'Not recorded'
                    },
                    {
                      label: 'Date Filed',
                      value: new Date(selectedReport.created_at).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric'
                      })
                    },
                  ].map(({ label, value, capitalize, full }) => (
                    <div key={label} className={full ? 'col-span-2' : ''}>
                      <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">{label}</p>
                      <p className={`text-sm font-semibold text-slate-800 ${capitalize ? 'capitalize' : ''}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Download */}
              <a
                href={selectedReport.evidence_photo_url}
                target="_blank"
                rel="noreferrer"
                download
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded transition-colors"
              >
                <Download className="w-4 h-4" />Download Evidence Photo
              </a>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 rounded-b-lg">
              <button
                onClick={() => setSelectedReport(null)}
                className="w-full py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Zoom Lightbox ── */}
      {imageZoomed && selectedReport && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setImageZoomed(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-all"
            onClick={() => setImageZoomed(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedReport.evidence_photo_url}
            alt="Evidence Full View"
            className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
