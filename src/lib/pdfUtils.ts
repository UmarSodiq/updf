import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}
import { ConvertedImage, ProcessingState, ConversionOptions, CompressionOptions, SplitOptions, RotateOptions, RemovePagesOptions } from '@/types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import * as pdfLib from 'pdf-lib';
import { PDFDocument, PDFDict, PDFRef, PDFString, PDFHexString, PDFName, PDFArray, degrees, rgb, StandardFonts, PDFNumber } from 'pdf-lib';
import { outlinePdfFactory } from '@lillallol/outline-pdf';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import { decryptPDF } from '@pdfsmaller/pdf-decrypt';

interface Bookmark {
  title: string;
  pageIndex: number;
  children: Bookmark[];
}

function extractBookmarks(pdfDoc: PDFDocument): Bookmark[] {
  const bookmarks: Bookmark[] = [];
  const outlinesRef = pdfDoc.catalog.get(PDFName.of('Outlines'));
  if (!outlinesRef) return bookmarks;
  
  const outlines = pdfDoc.context.lookup(outlinesRef);
  if (!(outlines instanceof PDFDict)) return bookmarks;
  
  const pages = pdfDoc.getPages();
  const pageRefs = pages.map(p => p.ref.toString());
  
  function walk(currentRef: any): Bookmark[] {
    const result: Bookmark[] = [];
    let ref = currentRef;
    while (ref && ref instanceof PDFRef) {
      const item = pdfDoc.context.lookup(ref);
      if (!(item instanceof PDFDict)) break;
      
      const titleObj = item.get(PDFName.of('Title'));
      let title = 'Untitled';
      if (titleObj instanceof PDFString || titleObj instanceof PDFHexString) {
        title = titleObj.decodeText();
      }
      
      let destPageRefStr = null;
      
      const destObj = item.lookup(PDFName.of('Dest'));
      if (destObj instanceof PDFArray) {
        const destRef = destObj.get(0);
        if (destRef instanceof PDFRef) {
          destPageRefStr = destRef.toString();
        }
      } else {
        const aObj = item.lookup(PDFName.of('A'));
        if (aObj instanceof PDFDict && aObj.get(PDFName.of('S')) === PDFName.of('GoTo')) {
          const dObj = aObj.lookup(PDFName.of('D'));
          if (dObj instanceof PDFArray) {
            const destRef = dObj.get(0);
            if (destRef instanceof PDFRef) {
              destPageRefStr = destRef.toString();
            }
          }
        }
      }
      
      let pageIndex = 0;
      if (destPageRefStr) {
        const idx = pageRefs.indexOf(destPageRefStr);
        if (idx !== -1) {
          pageIndex = idx;
        }
      }
      
      const firstChildRef = item.get(PDFName.of('First'));
      const children = firstChildRef ? walk(firstChildRef) : [];
      
      result.push({ title, pageIndex, children });
      
      ref = item.get(PDFName.of('Next'));
    }
    return result;
  }
  
  return walk(outlines.get(PDFName.of('First')));
}

function addOutlines(pdfDoc: PDFDocument, bookmarks: Bookmark[]) {
  if (bookmarks.length === 0) return;
  const context = pdfDoc.context;
  const pages = pdfDoc.getPages();
  
  function createItems(bms: Bookmark[], parentRef: PDFRef) {
    const itemRefs = bms.map(() => context.nextRef());
    let totalCount = 0;
    
    const items = bms.map((bm, i) => {
      const isFirst = i === 0;
      const isLast = i === bms.length - 1;
      
      const pageIndex = Math.min(Math.max(0, bm.pageIndex), pages.length - 1);
      
      const itemDict = context.obj({
        Title: PDFHexString.fromText(bm.title),
        Parent: parentRef,
        Dest: [pages[pageIndex].ref, PDFName.of('XYZ'), null, null, null],
        ...(isFirst ? {} : { Prev: itemRefs[i - 1] }),
        ...(isLast ? {} : { Next: itemRefs[i + 1] })
      });
      
      let childCount = 0;
      if (bm.children && bm.children.length > 0) {
        const result = createItems(bm.children, itemRefs[i]);
        itemDict.set(PDFName.of('First'), result.firstRef);
        itemDict.set(PDFName.of('Last'), result.lastRef);
        itemDict.set(PDFName.of('Count'), PDFNumber.of(result.count));
        childCount = result.count;
      }
      
      totalCount += 1 + childCount;
      return itemDict;
    });
    
    items.forEach((item, i) => {
      context.assign(itemRefs[i], item);
    });
    
    return { firstRef: itemRefs[0], lastRef: itemRefs[bms.length - 1], count: totalCount };
  }
  
  const outlinesDictRef = context.nextRef();
  const { firstRef, lastRef, count } = createItems(bookmarks, outlinesDictRef);
  
  const outlinesDict = context.obj({
    Type: 'Outlines',
    First: firstRef,
    Last: lastRef,
    Count: PDFNumber.of(count)
  });
  
  context.assign(outlinesDictRef, outlinesDict);
  pdfDoc.catalog.set(PDFName.of('Outlines'), outlinesDictRef);
}

const outlinePdf = outlinePdfFactory(pdfLib);

export const parsePageRange = (rangeText: string, maxPages: number): Set<number> => {
  const pages = new Set<number>();
  if (!rangeText.trim()) {
    for (let i = 1; i <= maxPages; i++) pages.add(i);
    return pages;
  }

  const parts = rangeText.split(',');
  for (const part of parts) {
    const bounds = part.trim().split('-');
    if (bounds.length === 1) {
      const p = parseInt(bounds[0]);
      if (!isNaN(p) && p >= 1 && p <= maxPages) pages.add(p);
    } else if (bounds.length === 2) {
      const start = parseInt(bounds[0]);
      const end = parseInt(bounds[1]);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(maxPages, end); i++) {
          pages.add(i);
        }
      }
    }
  }
  if (pages.size === 0) for (let i = 1; i <= maxPages; i++) pages.add(i);
  return pages;
};

export const convertPdfToImages = async (
  file: File,
  options: ConversionOptions,
  onProgress: (progress: number, state: ProcessingState) => void
): Promise<ConvertedImage[]> => {
  onProgress(5, 'reading');

  const arrayBuffer = await file.arrayBuffer();
  
  onProgress(10, 'converting');
  const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdfDocument.numPages;
  const convertedImages: ConvertedImage[] = [];

  const pagesToRender = Array.from(parsePageRange(options.pageRange, numPages)).sort((a,b) => a-b);
  const totalRenderCount = pagesToRender.length;
  let currentRenderIdx = 0;

  for (const i of pagesToRender) {
    const page = await pdfDocument.getPage(i);
    const viewport = page.getViewport({ scale: options.scale }); // Use configured resolution

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context not available');

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext: any = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    // Convert canvas to Blob
    const mimeType = `image/${options.format}`;
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, mimeType, options.quality); // Use configured quality
    });

    if (!blob) throw new Error(`Failed to create Blob for page ${i}`);

    const dataUrl = canvas.toDataURL(mimeType, options.quality); // Use configured quality

    convertedImages.push({
      id: crypto.randomUUID(),
      pageNumber: i,
      dataUrl,
      blob,
      format: options.format,
    });

    currentRenderIdx++;
    const progress = 10 + Math.floor((currentRenderIdx / totalRenderCount) * 80);
    onProgress(progress, 'converting');
  }

  return convertedImages;
};

export const downloadAllAsZip = async (images: ConvertedImage[], originalFilename: string, onProgress: (progress: number, state: ProcessingState) => void) => {
  onProgress(95, 'zipping');
  
  const zip = new JSZip();
  const folderName = originalFilename.replace(/\.pdf$/i, '');
  const imgFolder = zip.folder(folderName);

  if (!imgFolder) throw new Error('Failed to create ZIP folder');

  images.forEach((img) => {
    const ext = img.format === 'jpeg' ? 'jpg' : img.format;
    const fileName = `${folderName}-page-${img.pageNumber.toString().padStart(3, '0')}.${ext}`;
    imgFolder.file(fileName, img.blob);
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    // Optionally update zipping progress here
  });

  saveAs(zipBlob, `${folderName}.zip`);
  
  onProgress(100, 'idle');
};

export const downloadBatchPdfsAsZip = async (results: {originalName: string, blob: Blob, originalSize: number}[], batchPrefix: string, onProgress: (progress: number, state: ProcessingState) => void) => {
  onProgress(95, 'zipping');
  
  const zip = new JSZip();
  results.forEach((item) => {
    const name = item.originalName.replace(/\.pdf$/i, '');
    const fileName = `${name}-${batchPrefix}.pdf`;
    zip.file(fileName, item.blob);
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    // zipping progress
  });
  
  saveAs(zipBlob, `batch-${batchPrefix}.zip`);
  onProgress(100, 'idle');
};

export const compressPdf = async (
  file: File,
  options: CompressionOptions,
  onProgress: (progress: number, state: ProcessingState) => void
): Promise<Blob> => {
  onProgress(5, 'reading');

  const arrayBuffer = await file.arrayBuffer();
  const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
  const numPages = pdfDocument.numPages;
  
  const pdfDocForBookmarks = await PDFDocument.load(arrayBuffer.slice(0));
  
  onProgress(10, 'compressing');
  
  const newPdf = await PDFDocument.create();

  // quality mapping
  let quality = 0.5;
  if (options.mode === 'percentage') {
    quality = Math.max(0.1, Math.min(0.95, (options.percentage || 50) / 100));
  } else if (options.mode === 'targetSize') {
    const targetMB = options.targetSizeMB || 1;
    const originalMB = file.size / 1024 / 1024;
    const ratio = originalMB > 0 ? targetMB / originalMB : 1;
    quality = Math.max(0.1, Math.min(0.95, ratio));
  }
  
  let scale = 1.5;
  if (options.resolution === 'low') scale = 1.0; // 72 DPI
  if (options.resolution === 'medium') scale = 1.5; // ~108 DPI
  if (options.resolution === 'high') scale = 2.5; // ~180 DPI
  if (options.resolution === 'original') scale = 4.16; // ~300 DPI (Sangat Tajam)

  const pagesToCompress = options.pageRange 
    ? parsePageRange(options.pageRange, numPages) 
    : new Set(Array.from({length: numPages}, (_, i) => i + 1));

  for (let i = 1; i <= numPages; i++) {
    if (pagesToCompress.has(i)) {
      const page = await pdfDocument.getPage(i);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas 2D context not available');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext: any = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const byteString = atob(dataUrl.split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let j = 0; j < byteString.length; j++) {
        ia[j] = byteString.charCodeAt(j);
      }

      const jpegImage = await newPdf.embedJpg(ab);
      const newPage = newPdf.addPage([viewport.width, viewport.height]);
      
      newPage.drawImage(jpegImage, {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height,
      });
    } else {
      const [copiedPage] = await newPdf.copyPages(pdfDocForBookmarks, [i - 1]);
      newPdf.addPage(copiedPage);
    }

    const progress = 10 + Math.floor((i / numPages) * 85);
    onProgress(progress, 'compressing');
  }

  let pdfBytes = await newPdf.save();
  

  onProgress(100, 'idle');
  
  return new Blob([pdfBytes], { type: 'application/pdf' });
};

export const mergePdfs = async (
  files: File[],
  onProgress: (progress: number, state: ProcessingState) => void
): Promise<Blob> => {
  onProgress(10, 'merging');
  const mergedPdf = await PDFDocument.create();

  let count = 0;
  let totalPageCount = 0;
  const allBookmarks: Bookmark[] = [];

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    
    const originalBookmarks = extractBookmarks(pdf);
    const shiftBookmarks = (bms: Bookmark[], offset: number): Bookmark[] => bms.map(bm => ({ title: bm.title, pageIndex: bm.pageIndex + offset, children: shiftBookmarks(bm.children, offset) }));
    allBookmarks.push({ title: file.name.replace(/\.[^/.]+$/, ""), pageIndex: totalPageCount, children: shiftBookmarks(originalBookmarks, totalPageCount) });

    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
    totalPageCount += copiedPages.length;
    
    count++;
    onProgress(10 + Math.floor((count / files.length) * 80), 'merging');
  }

  addOutlines(mergedPdf, allBookmarks);

  const mergedPdfBytes = await mergedPdf.save();
  onProgress(90, 'merging');
  
  onProgress(100, 'idle');
  
  return new Blob([mergedPdfBytes], { type: 'application/pdf' });
};

export const splitPdf = async (
  file: File,
  options: SplitOptions,
  onProgress: (progress: number, state: ProcessingState) => void
): Promise<Blob> => {
  onProgress(10, 'splitting');
  const arrayBuffer = await file.arrayBuffer();
  const pdfToSplit = await PDFDocument.load(arrayBuffer);
  const numPages = pdfToSplit.getPageCount();
  
  const pagesToExtract = Array.from(parsePageRange(options.pageRange, numPages)).map(p => p - 1).sort((a,b) => a-b);
  
  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(pdfToSplit, pagesToExtract);
  copiedPages.forEach((page) => newPdf.addPage(page));
  
  const newPdfBytes = await newPdf.save();
  onProgress(100, 'idle');
  return new Blob([newPdfBytes], { type: 'application/pdf' });
};

export const rotatePdf = async (
  file: File,
  options: RotateOptions,
  onProgress: (progress: number, state: ProcessingState) => void
): Promise<Blob> => {
  onProgress(10, 'rotating');
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  
  const pages = pdfDoc.getPages();
  pages.forEach((page) => {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees(currentRotation + options.degrees));
  });

  const pdfBytes = await pdfDoc.save();
  onProgress(100, 'idle');
  return new Blob([pdfBytes], { type: 'application/pdf' });
};

export const imagesToPdf = async (
  files: File[],
  onProgress: (progress: number, state: ProcessingState) => void
): Promise<Blob> => {
  onProgress(10, 'generating');
  const pdfDoc = await PDFDocument.create();

  let count = 0;
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    
    let img;
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      img = await pdfDoc.embedJpg(arrayBuffer);
    } else if (file.type === 'image/png') {
      img = await pdfDoc.embedPng(arrayBuffer);
    } else {
      continue;
    }
    
    const page = pdfDoc.addPage([img.width, img.height]);
    page.drawImage(img, {
      x: 0,
      y: 0,
      width: img.width,
      height: img.height,
    });

    count++;
    onProgress(10 + Math.floor((count / files.length) * 80), 'generating');
  }

  const pdfBytes = await pdfDoc.save();
  onProgress(100, 'idle');
  return new Blob([pdfBytes], { type: 'application/pdf' });
};

export const removePagesPdf = async (
  file: File,
  options: RemovePagesOptions,
  onProgress: (progress: number, state: ProcessingState) => void
): Promise<Blob> => {
  onProgress(10, 'removing');
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const numPages = pdfDoc.getPageCount();
  
  const pagesToRemove = Array.from(parsePageRange(options.pageRange, numPages)).map(p => p - 1).sort((a,b) => b-a);
  
  pagesToRemove.forEach(index => {
    if (index >= 0 && index < numPages) {
       pdfDoc.removePage(index);
    }
  });

  const pdfBytes = await pdfDoc.save();
  onProgress(100, 'idle');
  return new Blob([pdfBytes], { type: 'application/pdf' });
};



export const protectPdf = async (
  file: File,
  userPassword?: string,
  ownerPassword?: string,
  onProgress?: (progress: number, state: ProcessingState) => void
): Promise<Blob> => {
  if (onProgress) onProgress(10, 'reading');
  const arrayBuffer = await file.arrayBuffer();
  
  if (onProgress) onProgress(50, 'protecting');
  // AES-256 by default. If we only specify userPassword, it uses userPassword
  const encrypted = await encryptPDF(new Uint8Array(arrayBuffer), userPassword || '', {
    ownerPassword: ownerPassword,
    allowPrinting: true,
    allowModifying: false,
    allowCopying: false,
    allowAnnotating: false,
    allowFillingForms: false,
    allowExtraction: true,
    allowAssembly: false,
    allowHighQualityPrint: true,
  });

  if (onProgress) onProgress(100, 'idle');
  return new Blob([encrypted], { type: 'application/pdf' });
};

export const unlockPdf = async (
  file: File,
  password?: string,
  onProgress?: (progress: number, state: ProcessingState) => void
): Promise<Blob> => {
  if (onProgress) onProgress(10, 'reading');
  const arrayBuffer = await file.arrayBuffer();
  
  if (onProgress) onProgress(50, 'unlocking');
  
  const decryptedBytes = await decryptPDF(new Uint8Array(arrayBuffer), password || '');
  
  if (onProgress) onProgress(100, 'idle');
  return new Blob([decryptedBytes], { type: 'application/pdf' });
};

export const organizePdf = async (
  file: File,
  pageOrder: number[], // 1-based page indices
  onProgress: (progress: number, state: ProcessingState) => void
): Promise<Blob> => {
  onProgress(10, 'reading');
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  onProgress(50, 'organizing');
  const newPdf = await PDFDocument.create();
  // copy pages
  const indices = pageOrder.map(n => n - 1);
  const copiedPages = await newPdf.copyPages(pdfDoc, indices);
  copiedPages.forEach(p => newPdf.addPage(p));

  onProgress(80, 'generating');
  const savedBytes = await newPdf.save();

  onProgress(100, 'idle');
  return new Blob([savedBytes], { type: 'application/pdf' });
};


