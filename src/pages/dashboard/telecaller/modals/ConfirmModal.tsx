import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function ConfirmModal({ title, message, confirmLabel = 'Delete', danger = true, onClose, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    setLoading(true);
    try { await onConfirm(); } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
            <AlertTriangle className={`w-6 h-6 ${danger ? 'text-red-400' : 'text-blue-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-sm text-gray-400 mt-1 leading-relaxed">{message}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/10 text-gray-300 text-sm font-medium hover:bg-white/15 transition-colors">Cancel</button>
          <button onClick={handleConfirm} disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50 ${danger ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
