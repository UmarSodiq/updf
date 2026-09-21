import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, FileText, ArrowRight, RotateCw } from 'lucide-react';
import { RotateOptions } from '@/types';

interface RotateConfigPanelProps {
  file: File;
  onStart: (options: RotateOptions) => void;
  onCancel: () => void;
}

export const RotateConfigPanel: React.FC<RotateConfigPanelProps> = ({ file, onStart, onCancel }) => {
  const [degrees, setDegrees] = useState<number>(90);

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
          Pengaturan Rotasi
        </h3>
        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">Sudut Putaran</label>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setDegrees(90)}
                className={`flex-1 py-4 flex flex-col items-center gap-2 border rounded-xl font-medium transition-all ${degrees === 90 ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <RotateCw className="w-6 h-6" style={{ transform: 'rotate(90deg)' }} />
                90° Kanan
              </button>
              <button
                onClick={() => setDegrees(180)}
                className={`flex-1 py-4 flex flex-col items-center gap-2 border rounded-xl font-medium transition-all ${degrees === 180 ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <RotateCw className="w-6 h-6" style={{ transform: 'rotate(180deg)' }} />
                180° Balik
              </button>
              <button
                onClick={() => setDegrees(270)}
                className={`flex-1 py-4 flex flex-col items-center gap-2 border rounded-xl font-medium transition-all ${degrees === 270 ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <RotateCw className="w-6 h-6" style={{ transform: 'rotate(270deg)' }} />
                90° Kiri
              </button>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button onClick={onCancel} className="flex-1 py-4 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition-colors">Batal</button>
          <button onClick={() => onStart({ degrees })} className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
            Putar PDF
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
