// src/pages/EmergencyEvidence.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import {
  Camera,
  Upload,
  Eye,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
  Image as ImageIcon,
  MapPin,
  Clock,
  User,
  Download,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Maximize2,
  AlertTriangle,
  Shield,
  Heart,
  Flame
} from 'lucide-react';

// Emergency Type Icons
function EmergencyIcon({ type }) {
  const icons = {
    Medical: { icon: Heart, color: 'text-red-600', bg: 'bg-red-100' },
    Fire: { icon: Flame, color: 'text-orange-600', bg: 'bg-orange-100' },
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

// Upload Modal Component
function UploadEvidenceModal({ emergency, onClose, onSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [notes, setNotes] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('❌ Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('❌ File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('⚠️ Please select a photo first');
      return;
    }

    setUploading(true);

    try {
      // 1. Upload image to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${emergency.id}-${Date.now()}.${fileExt}`;
      const filePath = `emergency-evidence/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('evidence')
        .getPublicUrl(filePath);

      // 3. Update emergency with evidence photo URL
      const { error: updateError } = await supabase
        .from('emergencies')
        .update({
          evidence_photo_url: publicUrl,
          responder_notes: notes || null,
          completed_at: new Date().toISOString()
        })
        .eq('id', emergency.id);

      if (updateError) throw updateError;

      alert('✅ Evidence uploaded successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Failed to upload evidence: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-8 py-6 rounded-t-3xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Camera className="w-6 h-6" />
                Upload Evidence Photo
              </h2>
              <p className="text-green-100 text-sm mt-1">Emergency ID: {emergency.id.slice(0, 8)}</p>
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
        <div className="p-8 space-y-6">
          {/* Emergency Info */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-200">
            <div className="flex items-center gap-4 mb-3">
              <EmergencyIcon type={emergency.type} />
              <div>
                <p className="font-bold text-gray-900 text-lg">{emergency.type} Emergency</p>
                <p className="text-sm text-gray-600">{emergency.location_text}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 bg-white/50 p-3 rounded-lg">
              {emergency.description}
            </p>
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              📷 Evidence Photo *
            </label>
            
            {!previewUrl ? (
              <label className="flex flex-col items-center justify-center w-full h-64 border-4 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-16 h-16 text-gray-400 group-hover:text-green-600 mb-4 transition-colors" />
                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    <span className="text-green-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </label>
            ) : (
              <div className="relative group">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-2xl border-4 border-green-300"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <label className="absolute bottom-3 left-3 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg cursor-pointer hover:bg-white transition-all shadow-lg">
                  <Camera className="w-4 h-4" />
                  <span className="text-sm font-semibold">Change Photo</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              📝 Responder Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any completion notes or observations..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 border-2 border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-yellow-900 mb-1">Important</p>
                <ul className="text-yellow-800 space-y-1 list-disc list-inside">
                  <li>Photo must clearly show the resolved situation</li>
                  <li>Include visible landmarks or identifiers</li>
                  <li>Ensure good lighting and clarity</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t-2 border-gray-200 px-8 py-5 flex gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold text-gray-700 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {uploading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Evidence
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// View Evidence Modal
function ViewEvidenceModal({ emergency, onClose, onDelete }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('⚠️ Are you sure you want to delete this evidence photo?')) return;

    setDeleting(true);
    try {
      // Extract file path from URL
      const urlParts = emergency.evidence_photo_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `emergency-evidence/${fileName}`;

      // Delete from storage
      await supabase.storage.from('evidence').remove([filePath]);

      // Update database
      await supabase
        .from('emergencies')
        .update({ evidence_photo_url: null })
        .eq('id', emergency.id);

      alert('✅ Evidence deleted');
      onDelete();
      onClose();
    } catch (error) {
      console.error('Delete error:', error);
      alert('❌ Failed to delete evidence');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 rounded-t-3xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-6 h-6" />
                  Evidence Photo
                </h2>
                <p className="text-blue-100 text-sm mt-1">Emergency ID: {emergency.id.slice(0, 8)}</p>
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
          <div className="p-8 space-y-6">
            {/* Emergency Info */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-gray-200">
              <div className="flex items-center gap-4 mb-3">
                <EmergencyIcon type={emergency.type} />
                <div>
                  <p className="font-bold text-gray-900 text-lg">{emergency.type} Emergency</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {emergency.location_text}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(emergency.completed_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-700">Evidence Photo</h3>
                <button
                  onClick={() => setIsZoomed(true)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  <Maximize2 className="w-4 h-4" />
                  View Full Size
                </button>
              </div>
              <img
                src={emergency.evidence_photo_url}
                alt="Evidence"
                className="w-full h-96 object-cover rounded-2xl border-2 border-gray-200 cursor-zoom-in hover:border-blue-400 transition-all"
                onClick={() => setIsZoomed(true)}
              />
            </div>

            {/* Responder Notes */}
            {emergency.responder_notes && (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border-2 border-purple-200">
                <h3 className="text-sm font-bold text-purple-900 mb-2 uppercase">Responder Notes</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{emergency.responder_notes}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t-2 border-gray-200 px-8 py-5 flex gap-3 rounded-b-3xl">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold text-gray-700 transition-all"
            >
              Close
            </button>
            <a
              href={emergency.evidence_photo_url}
              download
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold transition-all disabled:opacity-50"
            >
              {deleting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Zoomed Image */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <button
            className="absolute top-6 right-6 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full"
            onClick={() => setIsZoomed(false)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={emergency.evidence_photo_url}
            alt="Evidence Full View"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

// Main Component
export default function EmergencyEvidence() {
  const [emergencies, setEmergencies] = useState([]);
  const [filteredEmergencies, setFilteredEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState(null);

  useEffect(() => {
    fetchEmergencies();

    const channel = supabase
      .channel('emergency-evidence-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergencies' }, () => {
        fetchEmergencies();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    filterData();
  }, [emergencies, searchQuery, filterType]);

  const fetchEmergencies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('emergencies')
        .select('*')
        .eq('status', 'resolved')
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setEmergencies(data || []);
    } catch (error) {
      console.error('Error fetching emergencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = emergencies;

    if (searchQuery) {
      filtered = filtered.filter(
        (e) =>
          e.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.location_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((e) => e.type === filterType);
    }

    setFilteredEmergencies(filtered);
  };

  const handleUpload = (emergency) => {
    setSelectedEmergency(emergency);
    setUploadModalOpen(true);
  };

  const handleView = (emergency) => {
    setSelectedEmergency(emergency);
    setViewModalOpen(true);
  };

  const stats = {
    total: emergencies.length,
    withEvidence: emergencies.filter((e) => e.evidence_photo_url).length,
    withoutEvidence: emergencies.filter((e) => !e.evidence_photo_url).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Camera className="w-10 h-10 text-green-600" />
              Emergency Evidence
            </h1>
            <p className="text-gray-600 mt-2 font-medium">
              Upload and manage emergency completion photos
            </p>
          </div>
          <button
            onClick={fetchEmergencies}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-semibold uppercase">Total Resolved</p>
                <p className="text-4xl font-bold mt-2">{stats.total}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-semibold uppercase">With Evidence</p>
                <p className="text-4xl font-bold mt-2">{stats.withEvidence}</p>
              </div>
              <Camera className="w-12 h-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-semibold uppercase">Missing Evidence</p>
                <p className="text-4xl font-bold mt-2">{stats.withoutEvidence}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search emergencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all font-semibold"
            >
              <option value="all">All Types</option>
              <option value="Medical">Medical</option>
              <option value="Fire">Fire</option>
              <option value="Crime">Crime</option>
              <option value="Accident">Accident</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-12 h-12 text-green-600 animate-spin" />
          </div>
        ) : filteredEmergencies.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-md">
            <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-semibold">No resolved emergencies found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmergencies.map((emergency) => (
              <div
                key={emergency.id}
                className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-green-300 overflow-hidden"
              >
                {/* Image or Placeholder */}
                {emergency.evidence_photo_url ? (
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    <img
                      src={emergency.evidence_photo_url}
                      alt="Evidence"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Has Evidence
                    </div>
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 font-semibold">No Evidence Yet</p>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <EmergencyIcon type={emergency.type} />
                    <div>
                      <p className="font-bold text-gray-900">{emergency.type} Emergency</p>
                      <p className="text-xs text-gray-500">ID: {emergency.id.slice(0, 8)}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{emergency.location_text}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs">
                        {new Date(emergency.completed_at || emergency.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    {emergency.evidence_photo_url ? (
                      <button
                        onClick={() => handleView(emergency)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpload(emergency)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        Upload
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {uploadModalOpen && selectedEmergency && (
        <UploadEvidenceModal
          emergency={selectedEmergency}
          onClose={() => {
            setUploadModalOpen(false);
            setSelectedEmergency(null);
          }}
          onSuccess={fetchEmergencies}
        />
      )}

      {viewModalOpen && selectedEmergency && (
        <ViewEvidenceModal
          emergency={selectedEmergency}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedEmergency(null);
          }}
          onDelete={fetchEmergencies}
        />
      )}
    </div>
  );
}
