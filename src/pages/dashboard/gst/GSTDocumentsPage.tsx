import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Search,
  Download,
  FileText,
  Trash2,
  Eye,
  X,
  File,
  Image,
  FileArchive,
  Building2,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { GSTDocument, GSTClient } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';

export default function GSTDocumentsPage() {
  const [documents, setDocuments] = useState<GSTDocument[]>([]);
  const [clients, setClients] = useState<GSTClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<GSTDocument | null>(null);
  const [showDocDetails, setShowDocDetails] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState<GSTDocument | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    name: '',
    client_id: '',
    document_type: '',
    description: '',
    url: '',
  });
  const [toast, setToast] = useState<string | null>(null);
  const { profile } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docsRes, clientsRes] = await Promise.all([
        supabase.from('gst_documents').select('*, client:gst_clients(id, company_name)').order('created_at', { ascending: false }),
        supabase.from('gst_clients').select('id, company_name').order('company_name'),
      ]);

      if (docsRes.error) throw docsRes.error;
      if (clientsRes.error) throw clientsRes.error;

      setDocuments(docsRes.data as GSTDocument[] || []);
      setClients((clientsRes.data as GSTClient[]) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Error loading documents');
    }
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!uploadData.name.trim() || !uploadData.url.trim()) {
      showToast('Document name and URL are required');
      return;
    }

    const { error } = await supabase.from('gst_documents').insert([
      {
        ...uploadData,
        user_id: profile?.user_id,
        client_id: uploadData.client_id || null,
      },
    ]);

    if (error) {
      showToast('Error uploading document');
    } else {
      showToast('Document uploaded successfully');
      fetchData();
      setShowUploadModal(false);
      setUploadData({ name: '', client_id: '', document_type: '', description: '', url: '' });
    }
  };

  const handleDelete = async () => {
    if (!docToDelete) return;

    const { error } = await supabase.from('gst_documents').delete().eq('id', docToDelete.id);

    if (error) {
      showToast('Error deleting document');
    } else {
      showToast('Document deleted successfully');
      fetchData();
      setShowDeleteModal(false);
      setDocToDelete(null);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.client?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_type?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getFileIcon = (type?: string | null) => {
    if (!type) return File;
    const t = type.toLowerCase();
    if (t.includes('pdf')) return FileText;
    if (t.includes('image') || t.includes('png') || t.includes('jpg') || t.includes('jpeg')) return Image;
    if (t.includes('zip') || t.includes('rar')) return FileArchive;
    return File;
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();
  const formatSize = (bytes?: number | null) => {
    if (bytes === null || bytes === undefined) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-sora text-white">GST Documents</h1>
          <p className="text-gray-400">Upload and manage GST related documents</p>
        </div>
        <button onClick={() => setShowUploadModal(true)} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-400">Loading documents...</div>
        ) : filteredDocuments.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">No documents found. Upload your first document!</div>
        ) : (
          filteredDocuments.map((doc, index) => {
            const FileIcon = getFileIcon(doc.document_type);
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-6 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <FileIcon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{doc.name}</h3>
                    <p className="text-sm text-gray-400 truncate">{doc.document_type || 'Unknown type'}</p>
                  </div>
                </div>

                {doc.client && (
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-400 truncate">{doc.client.company_name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{formatDate(doc.created_at)}</span>
                  <span>{formatSize(doc.size)}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button
                    onClick={() => { setSelectedDoc(doc); setShowDocDetails(true); }}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {doc.url && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-blue-400"
                      title="Open Document"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setDocToDelete(doc); setShowDeleteModal(true); }}
                    className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-gray-400 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUploadModal(false)}>
            <motion.div className="glass-card p-6 max-w-lg w-full" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Upload Document</h3>
                <button onClick={() => setShowUploadModal(false)} className="p-2 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleUpload(); }}>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Document Name *</label>
                  <input type="text" value={uploadData.name} onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500" placeholder="Document name" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Document URL *</label>
                  <input type="url" value={uploadData.url} onChange={(e) => setUploadData({ ...uploadData, url: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500" placeholder="https://example.com/document.pdf" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Client</label>
                    <select value={uploadData.client_id} onChange={(e) => setUploadData({ ...uploadData, client_id: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500">
                      <option value="" className="bg-gray-900">Select Client (Optional)</option>
                      {clients.map((c) => (<option key={c.id} value={c.id} className="bg-gray-900">{c.company_name}</option>))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Document Type</label>
                    <input type="text" value={uploadData.document_type} onChange={(e) => setUploadData({ ...uploadData, document_type: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500" placeholder="e.g., PDF, Image, Excel" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea value={uploadData.description} onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none" rows={3} />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 btn-secondary">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary">Upload</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Details */}
      <AnimatePresence>
        {showDocDetails && selectedDoc && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDocDetails(false)}>
            <motion.div className="glass-card p-6 max-w-lg w-full" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedDoc.name}</h3>
                    <p className="text-sm text-gray-400">{selectedDoc.document_type || 'Unknown type'}</p>
                  </div>
                </div>
                <button onClick={() => setShowDocDetails(false)} className="p-2 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              <div className="space-y-4">
                {selectedDoc.client && (
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2 text-gray-400 mb-2"><Building2 className="w-4 h-4" /><span className="text-sm">Client</span></div>
                    <p className="text-white">{selectedDoc.client.company_name}</p>
                  </div>
                )}

                {selectedDoc.description && (
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-sm text-gray-400 mb-1">Description</p>
                    <p className="text-white">{selectedDoc.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-sm text-gray-400 mb-1">Added On</p>
                    <p className="text-white">{formatDate(selectedDoc.created_at)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-sm text-gray-400 mb-1">Size</p>
                    <p className="text-white">{formatSize(selectedDoc.size)}</p>
                  </div>
                </div>

                {selectedDoc.url && (
                  <a href={selectedDoc.url} target="_blank" rel="noopener noreferrer" className="block w-full text-center py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
                    Open Document
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteModal && docToDelete && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteModal(false)}>
            <motion.div className="glass-card p-6 max-w-md w-full" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0"><Trash2 className="w-6 h-6 text-red-400" /></div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Document</h3>
                  <p className="text-sm text-gray-400">{docToDelete.name}</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6">Are you sure you want to delete this document? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 btn-secondary">Cancel</button>
                <button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 px-8 rounded-xl transition-all">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium shadow-lg">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
