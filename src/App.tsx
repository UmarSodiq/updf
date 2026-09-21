/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Dropzone } from '@/components/Dropzone';
import { ImagePreview } from '@/components/ImagePreview';
import { ConfigPanel } from '@/components/ConfigPanel';
import { CompressConfigPanel } from '@/components/CompressConfigPanel';
import { MergeConfigPanel } from '@/components/MergeConfigPanel';
import { SplitConfigPanel } from '@/components/SplitConfigPanel';
import { RotateConfigPanel } from '@/components/RotateConfigPanel';
import { ImageToPdfConfigPanel } from '@/components/ImageToPdfConfigPanel';
import { RemovePagesConfigPanel } from '@/components/RemovePagesConfigPanel';
import { OrganizeConfigPanel } from '@/components/OrganizeConfigPanel';
import { ProtectConfigPanel } from '@/components/ProtectConfigPanel';
import { UnlockConfigPanel } from '@/components/UnlockConfigPanel';
import { PdfPreview } from '@/components/PdfPreview';
import { convertPdfToImages, downloadAllAsZip, downloadBatchPdfsAsZip, compressPdf, mergePdfs, splitPdf, rotatePdf, imagesToPdf, removePagesPdf, protectPdf, unlockPdf, organizePdf } from '@/lib/pdfUtils';
import { ConvertedImage, ProcessingState, ConversionOptions, CompressionOptions, SplitOptions, RotateOptions, RemovePagesOptions, AppMode } from '@/types';
import { translations, Language } from '@/lib/i18n';
import { 
  FileDown, 
  RefreshCw, 
  Loader2, 
  ArrowRight, 
  Minimize2, 
  Image as ImageIcon, 
  CopyPlus, 
  Scissors, 
  RotateCw, 
  FileImage, 
  FileMinus, 
  Lock, 
  Unlock, 
  GripVertical,
  Sun,
  Moon,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { saveAs } from 'file-saver';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>(null);

  // Theme & Language State with LocalStorage persistence
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('updf_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
  });

  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('updf_lang');
      if (saved === 'id' || saved === 'en') return saved;
    }
    return 'id';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('updf_theme', theme);
  }, [theme]);

  const toggleLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('updf_lang', newLang);
  };

  const t = translations[lang];

  const [files, setFiles] = useState<File[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<ConvertedImage[]>([]);
  const [resultPdfBlob, setResultPdfBlob] = useState<Blob | null>(null);
  const [batchResultsPdf, setBatchResultsPdf] = useState<{originalName: string, blob: Blob, originalSize: number}[]>([]);
  const [batchStatus, setBatchStatus] = useState<{originalName: string, status: 'pending' | 'processing' | 'success' | 'error', message?: string}[]>([]);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<ProcessingState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState<string>('');

  const handleFileSelect = useCallback((selectedFiles: File[]) => {
    const batchSupportedModes = ['merge', 'img2pdf', 'compress', 'remove', 'protect', 'unlock'];
    if (appMode && batchSupportedModes.includes(appMode)) {
      setFiles(selectedFiles);
      setFile(selectedFiles[0]);
    } else {
      setFile(selectedFiles[0]);
    }
    setImages([]);
    setResultPdfBlob(null);
    setBatchResultsPdf([]);
    setBatchStatus([]);
    setErrorMsg(null);
    setProgress(0);
    setState('configuring');
  }, [appMode]);

  const handleAppModeChange = (mode: AppMode) => {
    if (state !== 'idle' && state !== 'error' && state !== 'configuring') return;
    setAppMode(mode);
    setFile(null);
    setFiles([]);
    setImages([]);
    setResultPdfBlob(null);
    setBatchResultsPdf([]);
    setBatchStatus([]);
    setProgress(0);
    setState('idle');
    setErrorMsg(null);
  };

  const startConversion = async (options: ConversionOptions) => {
    if (!file) return;
    setState('reading');
    setProgress(0);

    try {
      const converted = await convertPdfToImages(file, options, (p, s) => {
        setProgress(p);
        setState(s);
      });
      setImages(converted);
      setState('idle');
    } catch (err: any) {
      console.error(err);
      setState('error');
      setErrorMsg(err?.message || 'An error occurred during conversion.');
    }
  };

  const startCompression = async (options: CompressionOptions) => {
    const targetFiles = files.length > 0 ? files : (file ? [file] : []);
    if (targetFiles.length === 0) return;
    setState('reading');
    setProgress(0);
    setBatchStatus(targetFiles.map(f => ({ originalName: f.name, status: 'pending' as const })));

    try {
      const results = [];
      const total = targetFiles.length;
      for (let i = 0; i < total; i++) {
        const itemFile = targetFiles[i];
        setBatchStatus(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'processing' } : s));
        try {
          const resultBlob = await compressPdf(itemFile, options, (p, s) => {
            setProgress(Math.round(((i * 100) + p) / total));
            setState(s);
          });
          results.push({originalName: itemFile.name, blob: resultBlob, originalSize: itemFile.size});
          setBatchStatus(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'success' } : s));
        } catch (err: any) {
          console.error(`Gagal memproses ${itemFile.name}:`, err);
          setBatchStatus(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'error', message: err.message } : s));
        }
      }
      if (results.length === 0) throw new Error('Semua file gagal diproses.');
      setBatchResultsPdf(results);
      if (results.length === 1) {
        setResultPdfBlob(results[0].blob);
      }
      setState('idle');
    } catch (err: any) {
      console.error(err);
      setState('error');
      setErrorMsg(err?.message || 'An error occurred during compression.');
    }
  };

  const startMerge = async (filesToMerge: File[]) => {
    if (filesToMerge.length === 0) return;
    setState('reading');
    setProgress(0);

    try {
      const resultBlob = await mergePdfs(filesToMerge, (p, s) => {
        setProgress(p);
        setState(s);
      });
      setResultPdfBlob(resultBlob);
      setState('idle');
    } catch (err: any) {
      console.error(err);
      setState('error');
      setErrorMsg(err?.message || 'An error occurred during merging.');
    }
  };

  const startSplit = async (options: SplitOptions) => {
    if (!file) return;
    setState('reading');
    setProgress(0);

    try {
      const resultBlob = await splitPdf(file, options, (p, s) => {
        setProgress(p);
        setState(s);
      });
      setResultPdfBlob(resultBlob);
      setState('idle');
    } catch (err: any) {
      console.error(err);
      setState('error');
      setErrorMsg(err?.message || 'An error occurred during splitting.');
    }
  };

  const startRotate = async (options: RotateOptions) => {
    if (!file) return;
    setState('reading');
    setProgress(0);

    try {
      const resultBlob = await rotatePdf(file, options, (p, s) => {
        setProgress(p);
        setState(s);
      });
      setResultPdfBlob(resultBlob);
      setState('idle');
    } catch (err: any) {
      console.error(err);
      setState('error');
      setErrorMsg(err?.message || 'An error occurred during rotation.');
    }
  };

  const startImageToPdf = async (filesToMerge: File[]) => {
    if (filesToMerge.length === 0) return;
    setState('reading');
    setProgress(0);

    try {
      const resultBlob = await imagesToPdf(filesToMerge, (p, s) => {
        setProgress(p);
        setState(s);
      });
      setResultPdfBlob(resultBlob);
      setState('idle');
    } catch (err: any) {
      console.error(err);
      setState('error');
      setErrorMsg(err?.message || 'An error occurred generating PDF.');
    }
  };

  const startRemovePages = async (options: RemovePagesOptions) => {
    const targetFiles = files.length > 0 ? files : (file ? [file] : []);
    if (targetFiles.length === 0) return;
    setState('reading');
    setProgress(0);
    setBatchStatus(targetFiles.map(f => ({ originalName: f.name, status: 'pending' as const })));

    try {
      const results = [];
      const total = targetFiles.length;
      for (let i = 0; i < total; i++) {
        const itemFile = targetFiles[i];
        setBatchStatus(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'processing' } : s));
        try {
          const resultBlob = await removePagesPdf(itemFile, options, (p, s) => {
            setProgress(Math.round(((i * 100) + p) / total));
            setState(s);
          });
          results.push({originalName: itemFile.name, blob: resultBlob, originalSize: itemFile.size});
          setBatchStatus(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'success' } : s));
        } catch (err: any) {
          console.error(`Gagal memproses ${itemFile.name}:`, err);
          setBatchStatus(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'error', message: err.message } : s));
        }
      }
      if (results.length === 0) throw new Error('Semua file gagal diproses.');
      setBatchResultsPdf(results);
      if (results.length === 1) {
        setResultPdfBlob(results[0].blob);
      }
      setState('idle');
    } catch (err: any) {
      console.error(err);
      setState('error');
      setErrorMsg(err?.message || 'An error occurred during page removal.');
    }
  };

  const startProtect = async (userPassword?: string, ownerPassword?: string) => {
    const targetFiles = files.length > 0 ? files : (file ? [file] : []);
    if (targetFiles.length === 0) return;
    setState('reading');
    setProgress(0);
    setBatchStatus(targetFiles.map(f => ({ originalName: f.name, status: 'pending' as const })));
    try {
      const results = [];
      const total = targetFiles.length;
      for (let i = 0; i < total; i++) {
        const itemFile = targetFiles[i];
        setBatchStatus(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'processing' } : s));
        try {
          const resultBlob = await protectPdf(itemFile, userPassword, ownerPassword, (p, s) => {
            setProgress(Math.round(((i * 100) + p) / total));
            setState(s);
          });
          results.push({originalName: itemFile.name, blob: resultBlob, originalSize: itemFile.size});
          setBatchStatus(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'success' } : s));
        } catch (err: any) {
          console.error(`Gagal memproses ${itemFile.name}:`, err);
          setBatchStatus(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'error', message: err.message } : s));
        }
      }
      if (results.length === 0) throw new Error('Semua file gagal diproses.');
      setBatchResultsPdf(results);
      if (results.length === 1) {
        setResultPdfBlob(results[0].blob);
      }
      setState('idle');
    } catch (err: any) {
      console.error(err);
      setState('error');
      setErrorMsg(err?.message || 'An error occurred during protection.');
    }
  };

  const startUnlock = async (password?: string) => {
    const targetFiles = files.length > 0 ? files : (file ? [file] : []);
    if (targetFiles.length === 0) return;
    setState('reading');
    setProgress(0);
    setBatchStatus(targetFiles.map(f => ({ originalName: f.name, status: 'pending' as const })));
    try {
      const results = [];
      const total = targetFiles.length;
      for (let i = 0; i < total; i++) {
        const itemFile = targetFiles[i];
        setBatchStatus(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'processing' } : s));
        try {
          const resultBlob = await unlockPdf(itemFile, password, (p, s) => {
            setProgress(Math.round(((i * 100) + p) / total));
            setState(s);
          });
          results.push({originalName: itemFile.name, blob: resultBlob, originalSize: itemFile.size});
          setBatchStatus(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'success' } : s));
        } catch (err: any) {
          console.error(`Gagal memproses ${itemFile.name}:`, err);
          setBatchStatus(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'error', message: err.message } : s));
        }
      }
      if (results.length === 0) throw new Error('Semua file gagal diproses.');
      setBatchResultsPdf(results);
      if (results.length === 1) {
        setResultPdfBlob(results[0].blob);
      }
      setState('idle');
    } catch (err: any) {
      console.error(err);
      setState('error');
      setErrorMsg(err?.message || 'An error occurred during unlocking. Incorrect password?');
    }
  };

  const startOrganize = async (pageOrder: number[]) => {
    if (!file) return;
    setState('reading');
    setProgress(0);
    try {
      const resultBlob = await organizePdf(file, pageOrder, (p, s) => {
        setProgress(p);
        setState(s);
      });
      setResultPdfBlob(resultBlob);
      setState('idle');
    } catch (err: any) {
      console.error(err);
      setState('error');
      setErrorMsg(err?.message || 'An error occurred organizing pages.');
    }
  };

  const handleDownloadAll = async () => {
    if (!file || images.length === 0) return;
    try {
      await downloadAllAsZip(images, file.name, (p, s) => {
        setProgress(p);
        setState(s);
      });
    } catch (err) {
      console.error('Failed to create zip', err);
    }
  };

  const handleDownloadBatchPdf = async () => {
    if (batchResultsPdf.length === 0) return;
    try {
      await downloadBatchPdfsAsZip(batchResultsPdf, appMode || 'processed', (p, s) => {
        setProgress(p);
        setState(s);
      });
    } catch (err) {
      console.error('Failed to create zip', err);
    }
  };

  const sanitizeFilename = (name: string): string => {
    return name.replace(/[\x00-\x1f\x80-\x9f\\/:*?"<>|]+/g, '_').trim();
  };

  const handleDownloadPdf = () => {
    if (!resultPdfBlob) return;
    const defaultName = file ? file.name.replace(/\.(pdf|docx?)$/i, '') : (appMode === 'img2pdf' ? 'images' : 'merged-document');
    let finalName = sanitizeFilename(outputFilename.trim());
    if (!finalName) {
      finalName = `${defaultName}-${appMode}.pdf`;
    } else if (!finalName.toLowerCase().endsWith('.pdf')) {
      finalName += '.pdf';
    }
    saveAs(resultPdfBlob, finalName);
  };

  const handleReset = () => {
    setFile(null);
    setFiles([]);
    setImages([]);
    setResultPdfBlob(null);
    setProgress(0);
    setState('idle');
    setErrorMsg(null);
    setOutputFilename('');
  };

  const isProcessing = state !== 'idle' && state !== 'error' && state !== 'configuring';

  const toolSections = [
    {
      category: t.categories.format,
      items: [
        { id: 'convert', name: t.tools.convert.name, icon: ImageIcon, desc: t.tools.convert.desc, iconColor: 'text-indigo-500', glowColor: 'group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]' },
        { id: 'img2pdf', name: t.tools.img2pdf.name, icon: FileImage, desc: t.tools.img2pdf.desc, iconColor: 'text-emerald-500', glowColor: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]' },
      ]
    },
    {
      category: t.categories.pages,
      items: [
        { id: 'merge', name: t.tools.merge.name, icon: CopyPlus, desc: t.tools.merge.desc, iconColor: 'text-blue-500', glowColor: 'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]' },
        { id: 'split', name: t.tools.split.name, icon: Scissors, desc: t.tools.split.desc, iconColor: 'text-orange-500', glowColor: 'group-hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]' },
        { id: 'rotate', name: t.tools.rotate.name, icon: RotateCw, desc: t.tools.rotate.desc, iconColor: 'text-rose-500', glowColor: 'group-hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]' },
        { id: 'remove', name: t.tools.remove.name, icon: FileMinus, desc: t.tools.remove.desc, iconColor: 'text-red-500', glowColor: 'group-hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]' },
        { id: 'organize', name: t.tools.organize.name, icon: GripVertical, desc: t.tools.organize.desc, iconColor: 'text-teal-500', glowColor: 'group-hover:shadow-[0_0_20px_rgba(20,184,166,0.3)]' },
      ]
    },
    {
      category: t.categories.optimize,
      items: [
        { id: 'compress', name: t.tools.compress.name, icon: Minimize2, desc: t.tools.compress.desc, iconColor: 'text-sky-500', glowColor: 'group-hover:shadow-[0_0_20px_rgba(14,165,233,0.3)]' },
        { id: 'protect', name: t.tools.protect.name, icon: Lock, desc: t.tools.protect.desc, iconColor: 'text-slate-600 dark:text-slate-400', glowColor: 'group-hover:shadow-[0_0_20px_rgba(71,85,105,0.3)]' },
        { id: 'unlock', name: t.tools.unlock.name, icon: Unlock, desc: t.tools.unlock.desc, iconColor: 'text-violet-500', glowColor: 'group-hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]' },
      ]
    }
  ];

  const getSuccessTitle = () => {
    switch (appMode) {
      case 'compress': return t.results.compressDone;
      case 'merge': return t.results.mergeDone;
      case 'split': return t.results.splitDone;
      case 'rotate': return t.results.rotateDone;
      case 'remove': return t.results.removeDone;
      case 'organize': return t.results.organizeDone;
      case 'protect': return t.results.protectDone;
      case 'unlock': return t.results.unlockDone;
      default: return t.results.genericDone;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-x-hidden text-slate-800 dark:text-slate-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-300">
      {/* Modern Pastel & Dark Mesh Gradient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-white/50 dark:bg-slate-950/80">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] bg-purple-100 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[10%] w-[50%] h-[50%] bg-yellow-50 dark:bg-indigo-950/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-60 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-[10%] right-[20%] w-[40%] h-[40%] bg-pink-100 dark:bg-pink-950/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[90px] opacity-50 animate-blob"></div>
      </div>

      {/* Main Content Wrapper (Above Background) */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/40 dark:bg-slate-950/40 backdrop-blur-2xl sticky top-0 z-50 py-3.5 border-b border-white/60 dark:border-slate-800/60 shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <button 
            onClick={() => {
              handleReset();
              setAppMode(null);
            }} 
            className="flex items-center gap-3 group hover:opacity-80 transition-all duration-300"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 group-hover:scale-105 transition-transform">
              <span className="text-sm tracking-tighter">U</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
              {t.brand}
            </h1>
          </button>
          
          <div className="flex items-center gap-3">
            {/* Language Switcher Pill */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200 dark:border-slate-700/80 shadow-sm">
              <button
                onClick={() => toggleLang('id')}
                className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all ${
                  lang === 'id' 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Bahasa Indonesia"
              >
                ID
              </button>
              <button
                onClick={() => toggleLang('en')}
                className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all ${
                  lang === 'en' 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="English"
              >
                EN
              </button>
            </div>

            {/* Dark Mode Toggle Button */}
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm hover:shadow transition-all"
              title={theme === 'dark' ? t.themeLight : t.themeDark}
              aria-label="Toggle Dark Mode"
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === 'dark' ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="w-4 h-4 text-amber-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="w-4 h-4 text-slate-600" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Start Over Button */}
            {appMode && (images.length > 0 || resultPdfBlob || batchResultsPdf.length > 0) && !isProcessing && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow"
              >
                <RefreshCw className="w-4 h-4" />
                {t.startOver}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Welcome & Tool Selection Area */}
        <AnimatePresence mode="wait">
          {appMode && (!file && files.length === 0) && (
            <motion.div
              key="upload-zone"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="max-w-2xl mx-auto mt-6"
            >
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-6 shadow-sm border border-indigo-100 dark:border-indigo-900/60">
                  {appMode === 'convert' && <ImageIcon className="w-8 h-8" />}
                  {appMode === 'compress' && <Minimize2 className="w-8 h-8" />}
                  {appMode === 'merge' && <CopyPlus className="w-8 h-8" />}
                  {appMode === 'split' && <Scissors className="w-8 h-8" />}
                  {appMode === 'rotate' && <RotateCw className="w-8 h-8" />}
                  {appMode === 'img2pdf' && <FileImage className="w-8 h-8" />}
                  {appMode === 'remove' && <FileMinus className="w-8 h-8" />}
                  {appMode === 'protect' && <Lock className="w-8 h-8" />}
                  {appMode === 'unlock' && <Unlock className="w-8 h-8" />}
                  {appMode === 'organize' && <GripVertical className="w-8 h-8" />}
                </div>
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mb-5 font-sans">
                  {appMode && t.tools[appMode]?.heading}
                </h2>
                <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto font-light">
                  {appMode && t.tools[appMode]?.subtitle}
                </p>
              </div>
              <Dropzone 
                onFileSelect={handleFileSelect} 
                disabled={false} 
                multiple={['merge', 'img2pdf', 'compress', 'remove', 'protect', 'unlock'].includes(appMode as string)} 
                acceptImages={appMode === 'img2pdf'}
                title={appMode ? t.tools[appMode]?.dropTitle : t.dropzone.defaultTitle}
                description={appMode ? t.tools[appMode]?.dropDesc : t.dropzone.defaultDesc}
                dropText={appMode === 'img2pdf' ? t.dropzone.dropImages : t.dropzone.dropPdf}
              />
            </motion.div>
          )}

          {/* Configuration State */}
          {(file || files.length > 0) && file && file.type === 'application/pdf' && state === 'configuring' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mb-6"
            >
              <PdfPreview file={file} files={files} defaultExpanded={true} />
            </motion.div>
          )}

          {file && state === 'configuring' && appMode === 'convert' && (
            <ConfigPanel 
              key="config-zone"
              file={file} 
              onStart={startConversion} 
              onCancel={handleReset} 
            />
          )}

          {(file || files.length > 0) && state === 'configuring' && appMode === 'compress' && (
            <CompressConfigPanel 
              key="compress-config-zone"
              files={files.length > 0 ? files : (file ? [file] : [])} 
              onStart={startCompression} 
              onCancel={handleReset} 
            />
          )}

          {files.length > 0 && state === 'configuring' && appMode === 'merge' && (
            <MergeConfigPanel 
              key="merge-config-zone"
              files={files} 
              onStart={startMerge} 
              onCancel={handleReset} 
              onFilesUpdate={setFiles}
            />
          )}

          {file && state === 'configuring' && appMode === 'split' && (
            <SplitConfigPanel 
              key="split-config-zone"
              file={file} 
              onStart={startSplit} 
              onCancel={handleReset} 
            />
          )}

          {file && state === 'configuring' && appMode === 'rotate' && (
            <RotateConfigPanel 
              key="rotate-config-zone"
              file={file} 
              onStart={startRotate} 
              onCancel={handleReset} 
            />
          )}

          {files.length > 0 && state === 'configuring' && appMode === 'img2pdf' && (
            <ImageToPdfConfigPanel 
              key="img2pdf-config-zone"
              files={files} 
              onStart={startImageToPdf} 
              onCancel={handleReset} 
              onFilesUpdate={setFiles}
            />
          )}

          {(file || files.length > 0) && state === 'configuring' && appMode === 'remove' && (
            <RemovePagesConfigPanel 
              key="remove-config-zone"
              files={files.length > 0 ? files : (file ? [file] : [])} 
              onStart={startRemovePages} 
              onCancel={handleReset} 
            />
          )}

          {file && state === 'configuring' && appMode === 'organize' && (
            <OrganizeConfigPanel 
              key="organize-config-zone"
              file={file} 
              onStart={startOrganize} 
              onCancel={handleReset} 
            />
          )}

          {(file || files.length > 0) && state === 'configuring' && appMode === 'protect' && (
            <ProtectConfigPanel 
              key="protect-config-zone"
              files={files.length > 0 ? files : (file ? [file] : [])} 
              onStart={startProtect} 
              onCancel={handleReset} 
            />
          )}

          {(file || files.length > 0) && state === 'configuring' && appMode === 'unlock' && (
            <UnlockConfigPanel 
              key="unlock-config-zone"
              files={files.length > 0 ? files : (file ? [file] : [])} 
              onStart={startUnlock} 
              onCancel={handleReset} 
            />
          )}

          {/* Processing State */}
          {(file || files.length > 0) && isProcessing && (
            <motion.div
              key="processing-zone"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto mt-24 text-center bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
            >
              <Loader2 className="w-12 h-12 text-blue-600 dark:text-indigo-400 animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
                {t.states[state] || state}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 truncate" title={file ? file.name : `${files.length} items`}>
                {file ? file.name : `${files.length} items`}
              </p>
              
              {/* Progress Bar */}
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-blue-500 dark:bg-indigo-500 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="text-right text-xs font-medium text-slate-400 dark:text-slate-500 mt-2">
                {progress}%
              </div>

              {/* Batch progress status list */}
              {files.length > 1 && batchStatus.length > 0 && (
                  <div className="mt-6 text-left border border-white/60 dark:border-slate-800 rounded-xl overflow-hidden bg-white/50 dark:bg-slate-800/50 backdrop-blur-md shadow-inner">
                    <div className="max-h-60 overflow-y-auto">
                      {batchStatus.map((status, idx) => (
                        <div key={idx} className="flex justify-between items-center px-4 py-3 border-b border-slate-100 dark:border-slate-700/60 last:border-0 text-sm">
                          <span className="truncate flex-1 pr-4 text-slate-700 dark:text-slate-200 font-medium" title={status.originalName}>{status.originalName}</span>
                          {status.status === 'pending' && <span className="text-slate-400 text-xs font-medium whitespace-nowrap">{t.states.pending}</span>}
                          {status.status === 'processing' && (
                            <span className="text-blue-500 dark:text-indigo-400 font-medium text-xs flex items-center gap-1 whitespace-nowrap">
                              <Loader2 className="w-3 h-3 animate-spin"/> {t.states.processing}
                            </span>
                          )}
                          {status.status === 'success' && <span className="text-green-500 font-medium text-xs whitespace-nowrap">{t.states.done}</span>}
                          {status.status === 'error' && <span className="text-red-500 font-medium text-xs whitespace-nowrap" title={status.message}>{t.states.failed}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
              )}
            </motion.div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <motion.div
              key="error-zone"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto mt-24 text-center bg-red-50/70 dark:bg-red-950/40 backdrop-blur-md p-8 rounded-3xl border border-red-200/50 dark:border-red-900/60 shadow-sm"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileDown className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-red-800 dark:text-red-300 mb-2">{t.states.errorTitle}</h3>
              <p className="text-red-600 dark:text-red-400 text-sm mb-6">
                {errorMsg}
              </p>
              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
              >
                {t.states.retry}
              </button>
            </motion.div>
          )}

          {/* Results Area Convert */}
          {file && appMode === 'convert' && images.length > 0 && !isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-6xl mx-auto mt-12 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-white/60 dark:border-slate-800"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <ImageIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    {t.results.convertFinished}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                    <span className="truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span>{images.length} {t.results.pages}</span>
                  </p>
                </div>
                
                <button
                  onClick={handleDownloadAll}
                  className="mt-4 sm:mt-0 px-6 py-4 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg"
                >
                  <FileDown className="w-5 h-5" />
                  {t.results.downloadZip}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                <AnimatePresence>
                  {images.map((img) => (
                    <ImagePreview 
                      key={img.id} 
                      image={img} 
                      originalFilename={file.name} 
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Results Area Compress/Merge/Split/Etc */}
          {(file || files.length > 0) && appMode !== 'convert' && (resultPdfBlob || batchResultsPdf.length > 0) && !isProcessing && (
            <motion.div
              key="compress-results-zone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-2xl mx-auto mt-12 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-white/60 dark:border-slate-800 p-8 sm:p-12 text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileDown className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
                {getSuccessTitle()}
              </h2>
              
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {batchResultsPdf.length > 1 
                    ? `${batchResultsPdf.length} items` 
                    : (file ? file.name : `${files.length} items`)}
                </span> {t.results.allFilesDone}
              </p>

              {appMode === 'compress' && batchResultsPdf.length === 1 && resultPdfBlob && (
                  <div className="flex justify-center gap-4 sm:gap-8 mb-10">
                    <div className="text-center">
                      <div className="text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">{t.results.originalSize}</div>
                      <div className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-200">{(batchResultsPdf[0].originalSize / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                    <div className="text-center">
                      <div className="text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">{t.results.newSize}</div>
                      <div className="text-xl sm:text-2xl font-semibold text-green-600 dark:text-green-400">{(resultPdfBlob.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                  </div>
              )}

              {batchResultsPdf.length > 1 ? (
                <div className="mb-6 space-y-4">
                  {batchResultsPdf.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-left py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1 flex-1 pr-4">{item.originalName}</span>
                      {appMode === 'compress' ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          <span className="line-through">{(item.originalSize / 1024 / 1024).toFixed(2)} MB</span>
                          <ArrowRight className="w-3 h-3 text-green-500" />
                          <span className="font-semibold text-green-600 dark:text-green-400">{(item.blob.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.states.done}</span>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={handleDownloadBatchPdf}
                    className="w-full mt-4 py-4 bg-blue-600 dark:bg-indigo-600 hover:bg-blue-700 dark:hover:bg-indigo-500 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-sm"
                  >
                    <FileDown className="w-6 h-6" />
                    {t.results.downloadBatch.replace('{count}', String(batchResultsPdf.length))}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6 text-left">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">{t.results.saveAs}</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={outputFilename} 
                        onChange={(e) => setOutputFilename(e.target.value)}
                        placeholder={file ? `${file.name.replace(/\.(pdf|docx?)$/i, '')}-${appMode}.pdf` : (appMode === 'img2pdf' ? `images-${appMode}.pdf` : `merged-document-${appMode}.pdf`)}
                        className="w-full px-4 py-4 pr-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 dark:text-slate-100"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm font-medium">.pdf</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleDownloadPdf}
                    className="w-full py-4 bg-blue-600 dark:bg-indigo-600 hover:bg-blue-700 dark:hover:bg-indigo-500 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-sm"
                  >
                    <FileDown className="w-6 h-6" />
                    {t.results.downloadPdf}
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className={appMode ? `mt-24 pt-16 border-t border-slate-200/60 dark:border-slate-800/60` : `mt-8`}>
          <div className="text-center sm:text-left mb-10 max-w-2xl mx-auto sm:mx-0">
            {/* 100% Privacy Guarantee Badge */}
            {!appMode && (
              <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-medium shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{t.privacyBadge}</span>
              </div>
            )}

            <h2 className={`${appMode ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl'} font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-5`}>
              {appMode ? t.moreTools : t.heroTitle}
            </h2>
            {!appMode && (
              <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                {t.heroSubtitle}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-12">
            {toolSections.map((section) => (
              <div key={section.category}>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-3">
                  {section.category}
                  <div className="h-px bg-slate-200/50 dark:bg-slate-800 flex-1 ml-4 rounded-full"></div>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {section.items.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        handleAppModeChange(tool.id as AppMode);
                      }}
                      className={`flex flex-col text-left p-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-white/60 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] hover:bg-white/60 dark:hover:bg-slate-900/70 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden ${
                        appMode === tool.id ? 'ring-2 ring-indigo-400 border-transparent shadow-lg' : ''
                      }`}
                    >
                      {/* Glass Reflection */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 dark:from-white/5 via-white/40 dark:via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-white/50 dark:bg-slate-800/60 backdrop-blur-md border border-white/80 dark:border-slate-700/80 shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:bg-white/80 dark:group-hover:bg-slate-800 ${tool.glowColor} z-10`}>
                        <tool.icon className={`w-7 h-7 ${tool.iconColor} filter drop-shadow-[0_0_8px_rgba(0,0,0,0.1)]`} strokeWidth={1.5} />
                      </div>
                      
                      <div className="z-10">
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{tool.name}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{tool.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
