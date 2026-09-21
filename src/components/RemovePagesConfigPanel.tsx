import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, FileText, ArrowRight, FileMinus } from 'lucide-react';
import { RemovePagesOptions } from '@/types';

interface RemovePagesConfigPanelProps {
  files: File[];
  onStart: (options: RemovePagesOptions) => void;
  onCancel: () => void;
}

export const RemovePagesConfigPanel: React.FC<RemovePagesConfigPanelProps> = ({ files, onStart, onCancel }) => {
  const [pageRange, setPageRange] = useState<string>('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-2xl mx-auto mt-12 bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/60 overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-slate-800">
            {files.length === 1 ? files[0].name : `${files.length} dokumen dipilih`}
          </span>
        </div>
      </div>
      <div className="p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Pengaturan Hapus Halaman
        </h3>
        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">Halaman yang Dihapus</label>
            <input
              type="text"
              value={pageRange}
              onChange={(e) => setPageRange(e.target.value)}
              placeholder="contoh 1-5, 8, 11-13"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            <p className="text-xs text-slate-500 mt-2 font-medium">Masukkan nomor halaman atau rentang yang dipisahkan dengan koma.</p>
          </div>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button onClick={onCancel} className="flex-1 py-4 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition-colors">Batal</button>
          <button onClick={() => onStart({ pageRange })} disabled={!pageRange.trim()} className="flex-[2] py-4 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            <FileMinus className="w-5 h-5" />
            Hapus Halaman
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
