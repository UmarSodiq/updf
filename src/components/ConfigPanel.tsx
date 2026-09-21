import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, FileText, ArrowRight } from 'lucide-react';
import { ConversionOptions, ImageFormat } from '@/types';

interface ConfigPanelProps {
  file: File;
  onStart: (options: ConversionOptions) => void;
  onCancel: () => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ file, onStart, onCancel }) => {
  const [quality, setQuality] = useState<number>(0.95);
  const [scale, setScale] = useState<number>(2.0);
  const [format, setFormat] = useState<ImageFormat>('jpeg');
  const [pageRangeType, setPageRangeType] = useState<'all' | 'custom'>('all');
  const [pageRangeText, setPageRangeText] = useState<string>('');

  const handleStart = () => {
    onStart({ 
      quality, 
      scale, 
      format,
      pageRange: pageRangeType === 'all' ? '' : pageRangeText 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-2xl mx-auto mt-12 bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
    >
      <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-indigo-600" />
          <span className="font-semibold text-slate-800">{file.name}</span>
        </div>
        <span className="text-sm font-medium text-slate-500 bg-slate-200/50 px-2.5 py-1 rounded-full">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
      </div>
      <div className="p-8">
        <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
          <Settings className="w-6 h-6 text-slate-700" />
          Pengaturan Konversi
        </h3>
        <div className="space-y-8">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">Format Keluaran</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setFormat('jpeg')}
                className={`py-3.5 px-2 text-sm font-semibold border rounded-2xl transition-all ${format === 'jpeg' ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
              >
                JPEG
              </button>
              <button
                onClick={() => setFormat('png')}
                className={`py-3.5 px-2 text-sm font-semibold border rounded-2xl transition-all ${format === 'png' ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
              >
                PNG
              </button>
              <button
                onClick={() => setFormat('webp')}
                className={`py-3.5 px-2 text-sm font-semibold border rounded-2xl transition-all ${format === 'webp' ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
              >
                WEBP
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">Halaman yang Dikonversi</label>
            <div className="flex flex-col gap-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="radio" 
                  name="pageRange" 
                  checked={pageRangeType === 'all'} 
                  onChange={() => setPageRangeType('all')}
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700">Semua Halaman</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="radio" 
                  name="pageRange" 
                  checked={pageRangeType === 'custom'} 
                  onChange={() => setPageRangeType('custom')}
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700">Rentang Khusus</span>
              </label>
              {pageRangeType === 'custom' && (
                <div className="pl-7 mt-2">
                  <input 
                    type="text" 
                    placeholder="contoh 1-3, 5, 8-11"
                    value={pageRangeText}
                    onChange={(e) => setPageRangeText(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-colors shadow-sm"
                  />
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">Kualitas Gambar</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setQuality(0.5)}
                className={`py-3.5 px-2 text-sm font-medium border rounded-2xl transition-all ${quality === 0.5 ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
              >
                Rendah (Ukuran Kecil)
              </button>
              <button
                onClick={() => setQuality(0.75)}
                className={`py-3.5 px-2 text-sm font-medium border rounded-2xl transition-all ${quality === 0.75 ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
              >
                Medium (Seimbang)
              </button>
              <button
                onClick={() => setQuality(0.95)}
                className={`py-3.5 px-2 text-sm font-medium border rounded-2xl transition-all ${quality === 0.95 ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
              >
                Tinggi (Detail Terbaik)
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">Resolusi (Skala)</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setScale(1.0)}
                className={`py-3.5 px-2 text-sm font-medium border rounded-2xl transition-all flex flex-col items-center justify-center gap-1 ${scale === 1.0 ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
              >
                <span>Standar</span>
                <span className="text-xs opacity-70 font-normal">~72 DPI</span>
              </button>
              <button
                onClick={() => setScale(2.0)}
                className={`py-3.5 px-2 text-sm font-medium border rounded-2xl transition-all flex flex-col items-center justify-center gap-1 ${scale === 2.0 ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
              >
                <span>Siap Cetak</span>
                <span className="text-xs opacity-70 font-normal">~150 DPI</span>
              </button>
              <button
                onClick={() => setScale(4.0)}
                className={`py-3.5 px-2 text-sm font-medium border rounded-2xl transition-all flex flex-col items-center justify-center gap-1 ${scale === 4.0 ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
              >
                <span>Res. Tinggi</span>
                <span className="text-xs opacity-70 font-normal">~300 DPI</span>
              </button>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-4 text-slate-600 font-semibold rounded-2xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleStart}
            className="flex-[2] py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            Mulai Konversi
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
