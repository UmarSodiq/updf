import React from 'react';
import { motion, Reorder } from 'motion/react';
import { Settings, Image as ImageIcon, ArrowRight, Trash2, GripVertical } from 'lucide-react';

interface ImageToPdfConfigPanelProps {
  files: File[];
  onStart: (files: File[]) => void;
  onCancel: () => void;
  onFilesUpdate: (files: File[]) => void;
}

export const ImageToPdfConfigPanel: React.FC<ImageToPdfConfigPanelProps> = ({ files, onStart, onCancel, onFilesUpdate }) => {
  const removeFile = (idxToRem: number) => {
    const newFiles = files.filter((_, i) => i !== idxToRem);
    if (newFiles.length === 0) {
      onCancel();
    } else {
      onFilesUpdate(newFiles);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-2xl mx-auto mt-12 bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/60 overflow-hidden"
    >
      <div className="p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Pengaturan Gambar ke PDF
        </h3>
        <p className="text-sm text-slate-500 mb-6 flex-1">
          Seret dan lepas untuk mengatur ulang gambar sesuai keinginan Anda. Setiap gambar akan ditempatkan di halamannya sendiri.
        </p>

        <Reorder.Group 
            axis="y" 
            values={files} 
            onReorder={onFilesUpdate} 
            className="space-y-3 mb-8 max-h-[300px] overflow-y-auto pr-2"
        >
            {files.map((file, idx) => (
                <Reorder.Item 
                    key={file.name + idx} 
                    value={file} 
                    className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50 cursor-grab active:cursor-grabbing"
                >
                    <GripVertical className="w-5 h-5 text-slate-400 shrink-0" />
                    <ImageIcon className="w-6 h-6 text-blue-600 shrink-0" />
                    <div className="flex-1 overflow-hidden pointer-events-none">
                        <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button 
                        onPointerDown={(e) => e.stopPropagation()} 
                        onClick={() => removeFile(idx)} 
                        className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg shrink-0 cursor-pointer"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </Reorder.Item>
            ))}
        </Reorder.Group>
        
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button onClick={onCancel} className="flex-1 py-4 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition-colors">Batal</button>
          <button onClick={() => onStart(files)} className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
            Buat PDF dari {files.length} Gambar
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
