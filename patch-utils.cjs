const fs = require('fs');
let code = fs.readFileSync('src/lib/pdfUtils.ts', 'utf8');

const helpers = `
interface Bookmark {
  title: string;
  pageIndex: number;
  children: Bookmark[];
}

function extractBookmarks(pdfDoc: pdfLib.PDFDocument): Bookmark[] {
  const bookmarks: Bookmark[] = [];
  const outlinesRef = pdfDoc.catalog.get(pdfLib.PDFName.of('Outlines'));
  if (!outlinesRef) return bookmarks;
  
  const outlines = pdfDoc.context.lookup(outlinesRef);
  if (!(outlines instanceof pdfLib.PDFDict)) return bookmarks;
  
  const pages = pdfDoc.getPages();
  const pageRefs = pages.map(p => p.ref.toString());
  
  function walk(currentRef: any): Bookmark[] {
    const result: Bookmark[] = [];
    let ref = currentRef;
    while (ref && ref instanceof pdfLib.PDFRef) {
      const item = pdfDoc.context.lookup(ref);
      if (!(item instanceof pdfLib.PDFDict)) break;
      
      const titleObj = item.get(pdfLib.PDFName.of('Title'));
      let title = 'Untitled';
      if (titleObj instanceof pdfLib.PDFString || titleObj instanceof pdfLib.PDFHexString) {
        title = titleObj.decodeText();
      }
      
      let destPageRefStr = null;
      
      const destObj = item.lookup(pdfLib.PDFName.of('Dest'));
      if (destObj instanceof pdfLib.PDFArray) {
        const destRef = destObj.get(0);
        if (destRef instanceof pdfLib.PDFRef) {
          destPageRefStr = destRef.toString();
        }
      } else {
        const aObj = item.lookup(pdfLib.PDFName.of('A'));
        if (aObj instanceof pdfLib.PDFDict && aObj.get(pdfLib.PDFName.of('S')) === pdfLib.PDFName.of('GoTo')) {
          const dObj = aObj.lookup(pdfLib.PDFName.of('D'));
          if (dObj instanceof pdfLib.PDFArray) {
            const destRef = dObj.get(0);
            if (destRef instanceof pdfLib.PDFRef) {
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
      
      const firstChildRef = item.get(pdfLib.PDFName.of('First'));
      const children = firstChildRef ? walk(firstChildRef) : [];
      
      result.push({ title, pageIndex, children });
      
      ref = item.get(pdfLib.PDFName.of('Next'));
    }
    return result;
  }
  
  return walk(outlines.get(pdfLib.PDFName.of('First')));
}

function addOutlines(pdfDoc: pdfLib.PDFDocument, bookmarks: Bookmark[]) {
  if (bookmarks.length === 0) return;
  const context = pdfDoc.context;
  const pages = pdfDoc.getPages();
  
  function createItems(bms: Bookmark[], parentRef: pdfLib.PDFRef) {
    const itemRefs = bms.map(() => context.nextRef());
    let totalCount = 0;
    
    const items = bms.map((bm, i) => {
      const isFirst = i === 0;
      const isLast = i === bms.length - 1;
      
      const pageIndex = Math.min(Math.max(0, bm.pageIndex), pages.length - 1);
      
      const itemDict = context.obj({
        Title: pdfLib.PDFHexString.fromText(bm.title),
        Parent: parentRef,
        Dest: [pages[pageIndex].ref, pdfLib.PDFName.of('XYZ'), null, null, null],
        ...(isFirst ? {} : { Prev: itemRefs[i - 1] }),
        ...(isLast ? {} : { Next: itemRefs[i + 1] })
      });
      
      let childCount = 0;
      if (bm.children && bm.children.length > 0) {
        const result = createItems(bm.children, itemRefs[i]);
        itemDict.set(pdfLib.PDFName.of('First'), result.firstRef);
        itemDict.set(pdfLib.PDFName.of('Last'), result.lastRef);
        itemDict.set(pdfLib.PDFName.of('Count'), pdfLib.PDFNumber.of(result.count));
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
    Count: pdfLib.PDFNumber.of(count)
  });
  
  context.assign(outlinesDictRef, outlinesDict);
  pdfDoc.catalog.set(pdfLib.PDFName.of('Outlines'), outlinesDictRef);
}

`;

code = code.replace("export const parsePageRange", helpers + "export const parsePageRange");

const mergeOld = `export const mergePdfs = async (
  files: File[],
  onProgress: (progress: number, state: ProcessingState) => void
): Promise<Blob> => {
  onProgress(10, 'merging');
  const mergedPdf = await PDFDocument.create();

  let count = 0;
  let totalPageCount = 0;

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    

    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
    totalPageCount += copiedPages.length;
    
    count++;
    onProgress(10 + Math.floor((count / files.length) * 80), 'merging');
  }

  const pdfBytes = await mergedPdf.save();
  onProgress(100, 'idle');
  
  return new Blob([pdfBytes], { type: 'application/pdf' });
};`;

const mergeNew = `export const mergePdfs = async (
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
    
    const shiftBookmarks = (bms: Bookmark[], offset: number): Bookmark[] => {
      return bms.map(bm => ({
        title: bm.title,
        pageIndex: bm.pageIndex + offset,
        children: shiftBookmarks(bm.children, offset)
      }));
    };
    
    const shiftedBookmarks = shiftBookmarks(originalBookmarks, totalPageCount);
    
    allBookmarks.push({
      title: file.name.replace(/\\.[^/.]+$/, ""),
      pageIndex: totalPageCount,
      children: shiftedBookmarks
    });

    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
    totalPageCount += copiedPages.length;
    
    count++;
    onProgress(10 + Math.floor((count / files.length) * 80), 'merging');
  }
  
  addOutlines(mergedPdf, allBookmarks);

  const pdfBytes = await mergedPdf.save();
  onProgress(100, 'idle');
  
  return new Blob([pdfBytes], { type: 'application/pdf' });
};`;

if (!code.includes(mergeOld)) {
  console.error("Could not find original mergePdfs");
} else {
  code = code.replace(mergeOld, mergeNew);
  fs.writeFileSync('src/lib/pdfUtils.ts', code);
  console.log("Patched successfully");
}
