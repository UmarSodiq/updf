import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, FileText, ArrowRight } from 'lucide-react';
import { CompressionOptions, CompressionMode } from '@/types';

interface CompressConfigPanelProps {
  files: File[];
  onStart: (options: CompressionOptions) => void;
  onCancel: () => void;
}

export const CompressConfigPanel: React.FC<CompressConfigPanelProps> = ({ files, onStart, onCancel }) => {
  const [mode, setMode] = useState<CompressionMode>('percentage');
  const [compressLevel, setCompressLevel] = useState<number>(50); // 1-100%
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const [targetSizeMB, setTargetSizeMB] = useState<number>(Number((totalSize / 1024 / 1024 * 0.5).toFixed(2)));
  const [resolution, setResolution] = useState<'low' | 'medium' | 'high' | 'original'>('high');
  const [pageRange, setPageRange] = useState<string>('');

  const handleStart = () => {
    onStart({ 
      mode, 
      percentage: compressLevel,
      targetSizeMB,
      resolution,
      pageRange
    });
  };

  const fileMB = totalSize / 1024 / 1024;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-2xl mx-auto mt-12 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-white/60 dark:border-slate-800 overflow-hidden"
    >
      <div className="px-8 py-5 border-b border-white/40 dark:border-slate-800 flex items-center justify-between bg-white/40 dark:bg-slate-800/40">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            {files.length === 1 ? files[0].name : `${files.length} dokumen dipilih`}
          </span>
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">{fileMB.toFixed(2)} MB total</span>
      </div>

      <div className="p-8">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Pengaturan Kompresi
        </h3>

        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">Mode Kompresi</label>
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setMode('percentage')}
                className={`flex-1 py-3 px-4 border rounded-xl font-semibold transition-all ${mode === 'percentage' ? 'border-slate-900 bg-slate-900 text-white dark:border-indigo-600 dark:bg-indigo-600 shadow-sm' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                Persentase
              </button>
              <button
                onClick={() => setMode('targetSize')}
                className={`flex-1 py-3 px-4 border rounded-xl font-semibold transition-all ${mode === 'targetSize' ? 'border-slate-900 bg-slate-900 text-white dark:border-indigo-600 dark:bg-indigo-600 shadow-sm' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                Target Ukuran
              </button>
            </div>

            {mode === 'percentage' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                <div className="flex justify-between items-end mb-3">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tingkat Kualitas</label>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{compressLevel}%</span>
                </div>
                <div className="px-1">
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    step="5"
                    value={compressLevel}
                    onChange={(e) => setCompressLevel(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>Kompresi Maks</span>
                    <span>Seimbang</span>
                    <span>Kualitas Tinggi</span>
                  </div>
                </div>
              </motion.div>
            )}

            {mode === 'targetSize' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                <div className="mb-3">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Target Ukuran (MB)</label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Masukkan ukuran maksimum yang diinginkan untuk file keluaran.</p>
                </div>
                <div className="relative max-w-xs">
                  <input 
                    type="number" 
                    min="0.1" 
                    max={fileMB.toFixed(2)} 
                    step="0.1"
                    value={targetSizeMB}
                    onChange={(e) => setTargetSizeMB(Number(e.target.value))}
                    className="w-full pl-4 pr-12 py-3 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-lg font-medium text-slate-800 dark:text-slate-100"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-slate-400">
                    MB
                  </div>
                </div>
              </motion.div>
            )}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Rentang Halaman (Opsional)</label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 block">Pisahkan dengan koma (misal: 1, 3-5). Kosongkan untuk kompres semua halaman.</p>
              <input 
                type="text" 
                placeholder="Contoh: 1, 3-5, 8"
                value={pageRange}
                onChange={e => setPageRange(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-800 dark:text-slate-100 text-sm"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">Resolusi Gambar (Pengaruh ke ketajaman teks)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => setResolution('low')}
                  className={`py-2 px-3 text-sm rounded-xl border font-medium transition-all ${resolution === 'low' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  Rendah (Buram)
                </button>
                <button
                  onClick={() => setResolution('medium')}
                  className={`py-2 px-3 text-sm rounded-xl border font-medium transition-all ${resolution === 'medium' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  Sedang
                </button>
                <button
                  onClick={() => setResolution('high')}
                  className={`py-2 px-3 text-sm rounded-xl border font-medium transition-all ${resolution === 'high' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  Tinggi
                </button>
                <button
                  onClick={() => setResolution('original')}
                  className={`py-2 px-3 text-sm rounded-xl border font-medium transition-all ${resolution === 'original' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  Asli (Besar)
                </button>
              </div>
            </div>

            <p className="text-sm mt-6 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 p-4 rounded-xl border border-yellow-200 dark:border-yellow-900/60 leading-relaxed">
              <strong className="block mb-1">Catatan Penting:</strong>
              Alat ini memproses PDF 100% lokal di browser Anda untuk keamanan privasi, sehingga ia bekerja dengan mengonversi halaman menjadi gambar efisien yang kemudian dijahit kembali. 
              Oleh karena itu, teks tidak dapat diblok lagi, namun <b>bookmark daftar isi akan diupayakan tetap utuh</b>.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-4 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
          >
            Batal
          </button>
          <button
            onClick={handleStart}
            className="flex-[2] py-4 bg-blue-600 dark:bg-indigo-600 text-white font-bold rounded-2xl shadow-sm hover:bg-blue-700 dark:hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2"
          >
            Kompresi PDF
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
