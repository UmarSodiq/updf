import React, { useState, useEffect } from 'react';
import { motion, Reorder } from 'motion/react';
import { Settings, ArrowRight, Loader2, GripVertical } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface OrganizeConfigPanelProps {
  file: File;
  onStart: (pageOrder: number[]) => void;
  onCancel: () => void;
}

export const OrganizeConfigPanel: React.FC<OrganizeConfigPanelProps> = ({ file, onStart, onCancel }) => {
  const [thumbnails, setThumbnails] = useState<{ id: string; pageNumber: number; dataUrl: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const generateThumbnails = async () => {
      setLoading(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        const thumbs = [];

        for (let i = 1; i <= numPages; i++) {
          if (!active) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.3 }); // Small thumbnail
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) continue;
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({ canvasContext: context, viewport } as any).promise;
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
          thumbs.push({ id: `page-${i}`, pageNumber: i, dataUrl });
        }
        if (active) setThumbnails(thumbs);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    generateThumbnails();
    return () => { active = false; };
  }, [file]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-4xl mx-auto mt-12 bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/60 overflow-hidden"
    >
      <div className="p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Susun Halaman
        </h3>
        <p className="text-sm text-slate-500 mb-6 flex-1">
          Seret dan lepas thumbnail untuk mengatur ulang halaman dokumen PDF Anda.
        </p>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-blue-600">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-600">Membuat thumbnail...</p>
          </div>
        ) : (
          <Reorder.Group 
            axis="x" 
            values={thumbnails} 
            onReorder={setThumbnails} 
            className="flex flex-wrap gap-4 mb-8 justify-center max-h-[400px] overflow-y-auto p-4 bg-slate-50 rounded-xl"
            layoutScroll
          >
            {thumbnails.map((thumb) => (
              <Reorder.Item 
                key={thumb.id} 
                value={thumb} 
                className="relative bg-white border-2 border-transparent hover:border-blue-400 focus:border-blue-500 rounded-lg shadow-sm cursor-grab active:cursor-grabbing p-1 transition-colors flex flex-col items-center"
              >
                <div className="absolute top-2 left-2 bg-black/40 text-white rounded p-1 backdrop-blur-sm shadow-sm pointer-events-none">
                    <GripVertical className="w-4 h-4" />
                </div>
                <img src={thumb.dataUrl} alt={`Halaman ${thumb.pageNumber}`} className="w-32 h-auto object-contain border border-slate-200 object-top bg-white pointer-events-none" />
                <div className="absolute bottom-2 right-2 bg-black/60 font-semibold text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                  {thumb.pageNumber}
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
        
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button onClick={onCancel} className="flex-1 py-4 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition-colors">Batal</button>
          <button 
            disabled={loading || thumbnails.length === 0}
            onClick={() => onStart(thumbnails.map(t => t.pageNumber))} 
            className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            Terapkan Perubahan
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
