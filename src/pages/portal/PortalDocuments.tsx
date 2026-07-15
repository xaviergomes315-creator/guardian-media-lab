import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import {
  FolderOpen,
  Upload,
  Download,
  Trash2,
  Search,
  Filter,
  FileText,
  File,
  Image,
  X,
  Loader2,
  Eye
} from 'lucide-react';
import { portalService } from '../../services/api';
import { PortalDocument, PORTAL_DOCUMENT_CATEGORY_LABELS, PORTAL_DOCUMENT_CATEGORY_COLORS } from '../../types';

interface OutletContext {
  portalClient: any;
}

const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function PortalDocuments() {
  const { portalClient } = useOutletContext<OutletContext>();
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: 'general' as PortalDocument['category'],
    description: '',
    file: null as File | null,
  });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });

  useEffect(() => {
    if (portalClient) loadDocuments();
  }, [portalClient, pagination.page, categoryFilter]);

  const loadDocuments = async () => {
    if (!portalClient) return;
    setLoading(true);
    try {
      const { data, count } = await portalService.documents.getAll(
        portalClient.id,
        pagination.page,
        pagination.pageSize,
        categoryFilter
      );
      setDocuments(data);
      setPagination(prev => ({ ...prev, total: count }));
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setMessage({ type: 'error', text: 'Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG' });
      return;
    }

    if (file.size > MAX_SIZE) {
      setMessage({ type: 'error', text: 'File size exceeds 10MB limit' });
      return;
    }

    setUploadForm(prev => ({ ...prev, file, name: prev.name || file.name.replace(/\.[^/.]+$/, '') }));
  };

  const handleUpload = async () => {
    if (!portalClient || !uploadForm.file || !uploadForm.name) return;

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      // In production, upload to storage first
      const documentData: Partial<PortalDocument> = {
        portal_client_id: portalClient.id,
        name: uploadForm.name,
        category: uploadForm.category,
        description: uploadForm.description,
        document_type: uploadForm.file.type,
        size: uploadForm.file.size,
        url: URL.createObjectURL(uploadForm.file), // In production, this would be the storage URL
        is_client_visible: true,
      };

      await portalService.documents.create(documentData);
      setMessage({ type: 'success', text: 'Document uploaded successfully!' });
      setShowUploadModal(false);
      setUploadForm({ name: '', category: 'general', description: '', file: null });
      loadDocuments();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload document' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await portalService.documents.delete(id);
      setMessage({ type: 'success', text: 'Document deleted successfully!' });
      setDeleteConfirm(null);
      loadDocuments();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete document' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return Image;
    if (type.includes('pdf')) return FileText;
    return File;
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-gray-400">Manage your documents and files</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-medium transition-all"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </motion.div>

      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              placeholder="Search documents..."
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-12 pr-8 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {Object.entries(PORTAL_DOCUMENT_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Documents Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No documents found</p>
            <p className="text-sm text-gray-500 mt-1">Upload your first document to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocuments.map((doc) => {
              const FileIcon = getFileIcon(doc.document_type || '');
              return (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center">
                      <FileIcon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                      {doc.url && (
                        <a
                          href={doc.url}
                          download={doc.name}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => setDeleteConfirm(doc.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-medium text-white truncate">{doc.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      PORTAL_DOCUMENT_CATEGORY_COLORS[doc.category]?.replace('bg-', 'bg-opacity-20 text-').split('-')[1]
                    }`}>
                      {PORTAL_DOCUMENT_CATEGORY_LABELS[doc.category]}
                    </span>
                    {doc.size && (
                      <span className="text-xs text-gray-500">{formatFileSize(doc.size)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Upload Modal */}
      {showUploadModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowUploadModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Upload Document</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Document Name</label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Enter document name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value as PortalDocument['category'] }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                >
                  {Object.entries(PORTAL_DOCUMENT_CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                <input
                  type="text"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Brief description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">File</label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-emerald-500/50 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {uploadForm.file ? (
                      <div className="text-emerald-400">
                        <File className="w-8 h-8 mx-auto mb-2" />
                        <p className="font-medium">{uploadForm.file.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(uploadForm.file.size)}</p>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                        <p className="font-medium">Click to upload</p>
                        <p className="text-sm">PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={!uploadForm.file || !uploadForm.name || uploading}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm"
          >
            <h3 className="text-lg font-semibold text-white mb-2">Delete Document?</h3>
            <p className="text-gray-400 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
