import React, { useCallback, useState } from 'react';
import { UploadCloud, FileType } from 'lucide-react';
import { motion } from 'motion/react';

interface DropzoneProps {
  onFileSelect: (files: File[]) => void;
  disabled: boolean;
  multiple?: boolean;
  acceptImages?: boolean;
  acceptDocx?: boolean;
  title?: string;
  description?: string;
  dropText?: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({ 
  onFileSelect, 
  disabled, 
  multiple = false, 
  acceptImages = false, 
  acceptDocx = false,
  title = 'Select or drop your file',
  description = 'Upload a file to begin processing.',
  dropText = 'Drop your file here'
}) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const isValidType = (f: File) => {
    if (acceptDocx) return f.name.toLowerCase().endsWith('.docx') || f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (acceptImages) return f.type.startsWith('image/') || f.type === 'application/pdf';
    return f.type === 'application/pdf';
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (disabled) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const validFiles = Array.from(e.dataTransfer.files as Iterable<File>).filter(isValidType);
        if (validFiles.length > 0) {
          onFileSelect(multiple ? validFiles : [validFiles[0]]);
        } else {
          alert(`Please select a valid ${acceptDocx ? 'DOCX' : acceptImages ? 'image or PDF' : 'PDF'} file.`);
        }
      }
    },
    [onFileSelect, disabled, multiple, acceptImages, acceptDocx]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (disabled) return;

      if (e.target.files && e.target.files.length > 0) {
        const validFiles = Array.from(e.target.files as Iterable<File>).filter(isValidType);
        if (validFiles.length > 0) {
          onFileSelect(multiple ? validFiles : [validFiles[0]]);
        } else {
          alert(`Please select a valid ${acceptDocx ? 'DOCX' : acceptImages ? 'image or PDF' : 'PDF'} file.`);
        }
      }
    },
    [onFileSelect, disabled, multiple, acceptImages, acceptDocx]
  );

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative w-full overflow-hidden flex flex-col items-center justify-center p-8 sm:p-14 mt-6 sm:mt-8 border-2 border-dashed rounded-[2rem] transition-all duration-300 ${
        isDragActive
          ? 'border-indigo-400 bg-indigo-50/70 backdrop-blur-xl scale-[1.02] shadow-xl shadow-indigo-100/50'
          : 'border-slate-200 hover:border-indigo-300 bg-white/70 hover:bg-white/90 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <input
        type="file"
        accept={
          acceptDocx 
            ? ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
            : acceptImages 
              ? "image/*,application/pdf" 
              : "application/pdf"
        }
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
        onChange={handleChange}
        disabled={disabled}
        multiple={multiple}
      />
      
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>

      <motion.div 
        animate={{ y: isDragActive ? -10 : 0, scale: isDragActive ? 1.05 : 1 }}
        className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200/50 relative transform rotate-3"
      >
        <UploadCloud className={`w-8 h-8 text-white`} strokeWidth={1.5} />
        <div className="absolute -bottom-2 -right-2 bg-white rounded-lg p-1.5 shadow-md border border-slate-100 transform -rotate-3">
           <FileType className="w-4 h-4 text-indigo-600" />
        </div>
      </motion.div>
      <h3 className="text-xl font-bold text-slate-900 mb-3 z-10">
        {isDragActive ? dropText : title}
      </h3>
      <p className="text-slate-500 text-sm max-w-sm text-center z-10 font-medium">
        {description}
      </p>
    </div>
  );
};
