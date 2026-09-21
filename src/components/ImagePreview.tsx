import React from 'react';
import { ConvertedImage } from '@/types';
import { Download } from 'lucide-react';
import { motion } from 'motion/react';
import { saveAs } from 'file-saver';

interface ImagePreviewProps {
  image: ConvertedImage;
  originalFilename: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ image, originalFilename }) => {
  const handleDownload = () => {
    const ext = image.format === 'jpeg' ? 'jpg' : image.format;
    const filename = `${originalFilename.replace(/\.pdf$/i, '')}.${ext}`;
    saveAs(image.blob, filename);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-all duration-300"
    >
      <div className="aspect-[3/4] overflow-hidden bg-slate-100 flex items-center justify-center">
        <img
          src={image.dataUrl}
          alt={`Page ${image.pageNumber}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      
      {/* Overlay controls */}
      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors duration-300 flex flex-col justify-end">
        <div className="p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-between bg-gradient-to-t from-slate-900/60 to-transparent pt-12">
          <span className="text-white font-medium drop-shadow-md">Page {image.pageNumber}</span>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center w-10 h-10 bg-white/90 hover:bg-white text-blue-600 rounded-full shadow-sm transition-transform hover:scale-110 active:scale-95"
            title="Download JPG"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
