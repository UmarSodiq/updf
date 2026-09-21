import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, ArrowRight, Unlock } from 'lucide-react';

interface UnlockConfigPanelProps {
  files: File[];
  onStart: (password?: string) => void;
  onCancel: () => void;
}

export const UnlockConfigPanel: React.FC<UnlockConfigPanelProps> = ({ files, onStart, onCancel }) => {
  const [password, setPassword] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-2xl mx-auto mt-12 bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/60 overflow-hidden"
    >
      <div className="p-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <Unlock className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Buka Kunci PDF</h3>
        <p className="text-sm text-slate-500 mb-8 text-center max-w-md">
          Hapus perlindungan kata sandi dari dokumen PDF. Anda memerlukan kata sandi asli untuk membuka kuncinya.
        </p>

        <div className="w-full max-w-md">
            <label className="block text-sm font-medium text-slate-700 mb-2">Kata Sandi Asli</label>
            <input
                type="password"
                placeholder="Masukkan kata sandi..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800"
            />
        </div>
        
        <div className="w-full mt-10 flex flex-col sm:flex-row gap-3 max-w-md">
          <button onClick={onCancel} className="flex-1 py-4 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition-colors">Batal</button>
          <button 
            disabled={!password}
            onClick={() => onStart(password)} 
            className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            Hapus Perlindungan
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
