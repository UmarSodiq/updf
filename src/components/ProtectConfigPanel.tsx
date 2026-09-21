import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, ArrowRight, Lock } from 'lucide-react';

interface ProtectConfigPanelProps {
  files: File[];
  onStart: (userPassword?: string, ownerPassword?: string) => void;
  onCancel: () => void;
}

export const ProtectConfigPanel: React.FC<ProtectConfigPanelProps> = ({ files, onStart, onCancel }) => {
  const [userPassword, setUserPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-2xl mx-auto mt-12 bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/60 overflow-hidden"
    >
      <div className="p-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-slate-700" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Lindungi PDF</h3>
        <p className="text-sm text-slate-500 mb-8 text-center max-w-md">
          Tambahkan perlindungan kata sandi ke PDF Anda. "Kata Sandi Pengguna" diperlukan untuk membuka dokumen.
        </p>

        <div className="w-full space-y-6 max-w-md">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Kata Sandi Pengguna (Wajib untuk Membuka)</label>
                <input
                    type="password"
                    placeholder="Masukkan kata sandi..."
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
                />
            </div>
            {/* Owner password could be added later if advanced options are needed, but let's keep it simple. The library supports it, so we can expose it. */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Kata Sandi Pemilik (Opsional, untuk izin)</label>
                <input
                    type="password"
                    placeholder="Masukkan kata sandi pemilik..."
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
                />
            </div>
        </div>
        
        <div className="w-full mt-10 flex flex-col sm:flex-row gap-3 max-w-md">
          <button onClick={onCancel} className="flex-1 py-4 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition-colors">Batal</button>
          <button 
            disabled={!userPassword}
            onClick={() => onStart(userPassword, ownerPassword || undefined)} 
            className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            Lindungi Dokumen
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
