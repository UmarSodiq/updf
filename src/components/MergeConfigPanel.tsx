import React, { useRef, useState } from 'react';
import { motion, Reorder } from 'motion/react';
import { Settings, FileText, ArrowRight, Trash2, GripVertical, Plus, UploadCloud } from 'lucide-react';
import { Language, translations } from '@/lib/i18n';

interface MergeConfigPanelProps {
  files: File[];
  onStart: (files: File[]) => void;
  onCancel: () => void;
  onFilesUpdate: (files: File[]) => void;
  lang?: Language;
}

export const MergeConfigPanel: React.FC<MergeConfigPanelProps> = ({ 
  files, 
  onStart, 
  onCancel, 
  onFilesUpdate,
  lang = 'id'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const t = translations[lang]?.tools.merge || translations.id.tools.merge;
  const tCommon = translations[lang]?.common || translations.id.common;

  const totalSizeMB = files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024;

  const removeFile = (idxToRemove: number) => {
    const newFiles = files.filter((_, i) => i !== idxToRemove);
    if (newFiles.length === 0) {
      onCancel();
    } else {
      onFilesUpdate(newFiles);
    }
  };

  const addFiles = (newFilesList: FileList | File[]) => {
    const validFiles = Array.from(newFilesList).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    if (validFiles.length > 0) {
      onFilesUpdate([...files, ...validFiles]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-2xl mx-auto mt-12 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-white/60 dark:border-slate-800 overflow-hidden"
    >
      {/* Summary Header */}
      <div className="px-8 py-5 border-b border-white/40 dark:border-slate-800 flex items-center justify-between bg-white/40 dark:bg-slate-800/40">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            {files.length} {t.selectedFiles}
          </span>
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {totalSizeMB.toFixed(2)} MB {t.totalSize}
        </span>
      </div>

      <div className="p-8">
        {/* Title and Top Quick Add Button */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {t.panelTitle}
          </h3>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800/80 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            {t.addMore}
          </button>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {t.panelDesc}
        </p>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="application/pdf,.pdf"
          onChange={handleFileInputChange}
          className="hidden"
          id="merge-add-file-input"
        />

        {/* Reorderable File List */}
        <Reorder.Group 
          axis="y" 
          values={files} 
          onReorder={onFilesUpdate} 
          className="space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-2"
        >
          {files.map((file, idx) => (
            <Reorder.Item 
              key={`${file.name}-${file.size}-${file.lastModified || idx}-${idx}`} 
              value={file} 
              className="flex items-center gap-4 p-4 border border-slate-200/80 dark:border-slate-800 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 hover:bg-slate-100/90 dark:hover:bg-slate-800 transition-colors cursor-grab active:cursor-grabbing shadow-xs"
            >
              <GripVertical className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="flex-1 overflow-hidden pointer-events-none">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{file.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button 
                type="button"
                onPointerDown={(e) => e.stopPropagation()} 
                onClick={() => removeFile(idx)} 
                title={lang === 'id' ? 'Hapus file' : 'Remove file'}
                className="w-8 h-8 flex items-center justify-center text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg shrink-0 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {/* Prominent Add File Dropzone / Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full py-3.5 px-4 mb-8 border-2 border-dashed rounded-2xl flex items-center justify-center gap-2.5 font-medium text-sm transition-all duration-200 cursor-pointer ${
            isDragging
              ? 'border-blue-500 bg-blue-50/90 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 scale-[1.01]'
              : 'border-slate-300/90 dark:border-slate-700/90 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        >
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            {isDragging ? <UploadCloud className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </div>
          <span className="font-semibold">{t.addFile}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">({t.dropOrClick})</span>
        </button>
        
        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            type="button"
            onClick={onCancel} 
            className="flex-1 py-4 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {tCommon.cancel}
          </button>
          <button 
            type="button"
            onClick={() => onStart(files)} 
            className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {t.btnMerge.replace('{count}', files.length.toString())}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
