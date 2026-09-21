import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, FileText, ArrowRight } from 'lucide-react';
import { SplitOptions } from '@/types';

interface SplitConfigPanelProps {
  file: File;
  onStart: (options: SplitOptions) => void;
  onCancel: () => void;
}

export const SplitConfigPanel: React.FC<SplitConfigPanelProps> = ({ file, onStart, onCancel }) => {
  const [pageRangeText, setPageRangeText] = useState<string>('');
  
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
          <span className="font-semibold text-slate-800">{file.name}</span>
        </div>
      </div>
      <div className="p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Pengaturan Pemisahan / Ekstrak
        </h3>
        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">Halaman yang Diekstrak</label>
            <input 
              type="text" 
              placeholder="contoh 1-3, 5, 8-11"
              value={pageRangeText}
              onChange={(e) => setPageRangeText(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm font-medium text-slate-800"
            />
            <p className="text-xs text-slate-500 mt-2">Biarkan kosong untuk memisahkan setiap halaman menjadi file independen atau mengekstrak semuanya. Gunakan koma dan tanda hubung untuk rentang tertentu.</p>
          </div>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button onClick={onCancel} className="flex-1 py-4 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition-colors">Batal</button>
          <button onClick={() => onStart({ pageRange: pageRangeText })} className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
            Pisah PDF
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
