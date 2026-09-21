import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PdfPreviewProps {
  file?: File;
  files?: File[];
  className?: string;
  defaultExpanded?: boolean;
}

export function PdfPreview({ file, files, className = "", defaultExpanded = true }: PdfPreviewProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const targetFiles = files && files.length > 0 ? files : (file ? [file] : []);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  useEffect(() => {
    setCurrentFileIndex(0);
  }, [files, file]);

  const currentFile = targetFiles[currentFileIndex];
  
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  useEffect(() => {
    if (currentFile) {
      const url = URL.createObjectURL(currentFile);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFileUrl(null);
    }
  }, [currentFile]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  useEffect(() => {
    // Reset state when file changes
    setNumPages(null);
    setPageNumber(1);
    setScale(1.0);
  }, [currentFile]);

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPage = prevPageNumber + offset;
      return Math.min(Math.max(1, newPage), numPages || 1);
    });
  };

  const changeScale = (offset: number) => {
    setScale(prevScale => Math.min(Math.max(0.5, prevScale + offset), 3.0));
  };
  
  const changeFile = (offset: number) => {
    setCurrentFileIndex(prev => {
      const newIndex = prev + offset;
      return Math.min(Math.max(0, newIndex), targetFiles.length - 1);
    });
  };

  if (!currentFile) return null;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
      <div 
        className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Maximize2 className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          <h3 className="font-medium text-slate-800">Preview Dokumen</h3>
        </div>
        <span className="text-sm text-slate-500 truncate max-w-[200px] sm:max-w-[400px]">
          {targetFiles.length > 1 ? `(${currentFileIndex + 1}/${targetFiles.length}) ${currentFile.name}` : currentFile.name}
        </span>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-slate-100/50 flex flex-col items-center">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                {targetFiles.length > 1 && (
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
                    <button
                      onClick={() => changeFile(-1)}
                      disabled={currentFileIndex <= 0}
                      className="p-1 hover:bg-slate-100 rounded-full disabled:opacity-50 transition-colors"
                      title="File Sebelumnya"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-700" />
                    </button>
                    <div className="text-sm font-medium text-slate-700 font-mono w-16 text-center truncate">
                      File
                    </div>
                    <button
                      onClick={() => changeFile(1)}
                      disabled={currentFileIndex >= targetFiles.length - 1}
                      className="p-1 hover:bg-slate-100 rounded-full disabled:opacity-50 transition-colors"
                      title="File Selanjutnya"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-700" />
                    </button>
                  </div>
                )}
                
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
                  <button
                    onClick={() => changePage(-1)}
                    disabled={pageNumber <= 1}
                    className="p-1 hover:bg-slate-100 rounded-full disabled:opacity-50 transition-colors"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-700" />
                  </button>
                  <div className="text-sm font-medium text-slate-700 font-mono w-24 text-center">
                    Hal {pageNumber} / {numPages || '--'}
                  </div>
                  <button
                    onClick={() => changePage(1)}
                    disabled={pageNumber >= (numPages || 1)}
                    className="p-1 hover:bg-slate-100 rounded-full disabled:opacity-50 transition-colors"
                    title="Halaman Selanjutnya"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-700" />
                  </button>
  
                  <div className="w-px h-6 bg-slate-200 mx-2" />
  
                  <button
                    onClick={() => changeScale(-0.25)}
                    disabled={scale <= 0.5}
                    className="p-1 hover:bg-slate-100 rounded-full disabled:opacity-50 transition-colors"
                    title="Perkecil"
                  >
                    <ZoomOut className="w-5 h-5 text-slate-700" />
                  </button>
                  <div className="text-sm font-medium text-slate-700 font-mono w-16 text-center">
                    {Math.round(scale * 100)}%
                  </div>
                  <button
                    onClick={() => changeScale(0.25)}
                    disabled={scale >= 3.0}
                    className="p-1 hover:bg-slate-100 rounded-full disabled:opacity-50 transition-colors"
                    title="Perbesar"
                  >
                    <ZoomIn className="w-5 h-5 text-slate-700" />
                  </button>
                </div>
              </div>

              {/* Document Render */}
              <div className="w-full overflow-auto flex justify-center bg-slate-200/50 rounded-xl border border-slate-200 p-2 sm:p-4 min-h-[300px]">
                {fileUrl && (
                  <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onItemClick={({ pageNumber }) => {
                      if (pageNumber) setPageNumber(pageNumber);
                    }}
                    loading={
                      <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                      </div>
                    }
                    error={
                      <div className="flex items-center justify-center py-20 text-red-500 text-sm font-medium">
                        Gagal memuat pratinjau dokumen PDF ini. Mungkin file korup atau terenkripsi.
                      </div>
                    }
                  >
                    <Page 
                      pageNumber={pageNumber} 
                      scale={scale} 
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="shadow-lg border border-slate-200 bg-white"
                    />
                  </Document>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
