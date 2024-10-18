import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import Image from 'next/image';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, IImageOptions } from 'docx';
import { Button } from "@/components/ui/button";
import { Download, Upload, Maximize, Minimize, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Select } from '@/components/ui/select';

interface Block {
  id: string;
  type: 'text' | 'image';
  content: string | { b64_json: string } | null;
  size: 'small' | 'medium' | 'large';
  column?: number;
}

interface Page {
  blocks: Block[];
  columns: number;
  backgroundImage?: string;
}

interface MagazinePreviewProps {
  pages: Page[];
  language: string;
  updatePageContent?: (pageIndex: number, newPage: Page) => void;
}

interface BackgroundImageProps {
  backgroundImage: string | undefined;
  onBackgroundImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const BackgroundImage = memo(({ backgroundImage, onBackgroundImageUpload }: BackgroundImageProps) => (
  <>
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      zIndex: 1
    }} />
    <label htmlFor="bg-image-upload" className="absolute top-2 right-2 z-20 bg-white bg-opacity-80 text-gray-800 hover:bg-opacity-100 px-3 py-2 rounded-md shadow-md cursor-pointer transition duration-300 ease-in-out flex items-center text-sm font-medium">
      <Upload size={16} className="mr-2" />
      Upload Background
      <input
        id="bg-image-upload"
        type="file"
        accept="image/*"
        onChange={onBackgroundImageUpload}
        className="hidden"
      />
    </label>
  </>
));

const MagazinePreview: React.FC<MagazinePreviewProps> = ({ pages, language, updatePageContent }) => {
  const [pagesState, setPagesState] = useState(pages);
  const [backgroundColor, setBackgroundColor] = useState('#f0f0f0');
  const [textColor, setTextColor] = useState('#333333');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const backgroundImagesRef = useRef<(string | undefined)[]>(pages.map(() => undefined));
  const [showCustomization, setShowCustomization] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedDevice, setSelectedDevice] = useState('desktop');
  const [brandColor, setBrandColor] = useState('#000000');

  useEffect(() => {
    setPagesState(pages.map(page => ({
      ...page,
      columns: page.columns || 1,
      backgroundImage: page.backgroundImage || undefined
    })));
  }, [pages]);

  const updatePageColumns = useCallback((pageIndex: number, columns: number) => {
    setPagesState(prevState => {
      const newPages = [...prevState];
      const currentPage = newPages[pageIndex];
      const newBlocks = redistributeBlocks(currentPage.blocks, columns);
      newPages[pageIndex] = { ...currentPage, columns, blocks: newBlocks };
      if (updatePageContent) {
        updatePageContent(pageIndex, newPages[pageIndex]);
      }
      return newPages;
    });
  }, [updatePageContent]);

  const redistributeBlocks = (blocks: Block[], columns: number): Block[] => {
    const newBlocks: Block[] = [];
    let columnContents: string[] = Array(columns).fill('');
    let columnHeights: number[] = Array(columns).fill(0);
    const imageHeight = 200; // Assume a standard height for images

    blocks.forEach(block => {
      if (block.type === 'text') {
        const words = (block.content as string).split(' ');
        words.forEach(word => {
          const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
          columnContents[shortestColumn] += word + ' ';
          columnHeights[shortestColumn] += 20; // Assume 20px per word
        });
      } else if (block.type === 'image') {
        const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
        newBlocks.push({
          ...block,
          size: 'small',
          column: shortestColumn
        });
        columnHeights[shortestColumn] += imageHeight;
      }
    });

    // Create new text blocks from the redistributed content
    columnContents.forEach((content, index) => {
      if (content.trim()) {
        newBlocks.push({
          id: `redistributed-text-${index}`,
          type: 'text',
          content: content.trim(),
          size: 'small',
          column: index
        });
      }
    });

    // Sort blocks by column and height
    newBlocks.sort((a, b) => {
      if (a.column === b.column) {
        return columnContents.indexOf(a.content as string) - columnContents.indexOf(b.content as string);
      }
      return (a.column || 0) - (b.column || 0);
    });

    return newBlocks;
  };

  const handleBackgroundImageUpload = useCallback((pageIndex: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPagesState(prevState => {
          const newPages = [...prevState];
          newPages[pageIndex] = { ...newPages[pageIndex], backgroundImage: reader.result as string };
          if (updatePageContent) {
            updatePageContent(pageIndex, newPages[pageIndex]);
          }
          return newPages;
        });
      };
      reader.readAsDataURL(file);
    }
  }, [updatePageContent]);

  const renderPage = useCallback((page: Page, pageIndex: number) => (
    <div key={pageIndex} className="magazine-page" style={{
      backgroundColor: backgroundColor,
      color: textColor,
      padding: '20px',
      marginBottom: '20px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      minHeight: '500px',
      overflow: 'hidden'
    }}>
      <BackgroundImage
        backgroundImage={page.backgroundImage}
        onBackgroundImageUpload={handleBackgroundImageUpload(pageIndex)}
      />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>Page {pageIndex + 1}</h2>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ marginRight: '10px' }}>
            Columns:
            <input
              type="number"
              min="1"
              max="4"
              value={page.columns}
              onChange={(e) => updatePageColumns(pageIndex, parseInt(e.target.value))}
              style={{
                marginLeft: '5px',
                padding: '5px',
                fontSize: '16px',
                width: '50px',
                backgroundColor: '#4CAF50',
                color: 'black',
                border: '1px solid #45a049',
                borderRadius: '4px'
              }}
            />
          </label>
        </div>
        <div className="magazine-grid" style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${page.columns}, 1fr)`,
          gap: '1rem',
          position: 'relative'
        }}>
          {page.blocks.map((block, blockIndex) => renderBlock(block, blockIndex, page.columns))}
        </div>
      </div>
    </div>
  ), [backgroundColor, textColor, updatePageColumns, handleBackgroundImageUpload]);

  const renderBlock = useCallback((block: Block, index: number, columns: number) => (
    <div key={block.id} style={{ 
      gridColumn: block.column !== undefined ? `${block.column + 1}` : (block.size === 'large' ? `span ${columns}` : 'auto'),
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      padding: '15px',
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      marginBottom: '1rem'
    }}>
      {block.type === 'text' ? (
        <p 
          dangerouslySetInnerHTML={{ __html: block.content as string }} 
          style={{ color: textColor, fontSize: '16px', lineHeight: '1.5' }}
        />
      ) : block.type === 'image' && block.content && typeof block.content === 'object' && 'b64_json' in block.content ? (
        <Image 
          src={`data:image/png;base64,${block.content.b64_json}`}
          alt=""
          width={300}
          height={200}
          layout="responsive"
        />
      ) : (
        <p style={{ color: textColor, fontSize: '16px', lineHeight: '1.5' }}>Image not available</p>
      )}
    </div>
  ), [textColor]);

  const downloadPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;

    pagesState.forEach((page, pageIndex) => {
      if (pageIndex > 0) pdf.addPage();

      let yOffset = margin;
      pdf.setFontSize(16);
      pdf.text(`Page ${pageIndex + 1}`, margin, yOffset);
      yOffset += 10;

      const columnWidth = contentWidth / page.columns;
      const columns: { blocks: Block[], height: number }[] = Array.from({ length: page.columns }, () => ({ blocks: [], height: 0 }));
      let currentColumn = 0;

      if (page.backgroundImage) {
        pdf.addImage(page.backgroundImage, 'JPEG', 0, 0, pageWidth, pageHeight);
        pdf.setFillColor(255, 255, 255);
        pdf.setGState(new pdf.GState({ opacity: 0.5 }));
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        pdf.setGState(new pdf.GState({ opacity: 1 }));
      }

      page.blocks.forEach((block) => {
        if (block.size === 'large') {
          columns.forEach((col, index) => {
            if (col.blocks.length > 0) {
              renderColumnToPDF(pdf, col, margin + index * columnWidth, yOffset, columnWidth);
            }
          });
          yOffset = Math.max(...columns.map(col => col.height)) + yOffset;
          yOffset = renderBlockToPDF(pdf, block, margin, yOffset, contentWidth);
          columns.forEach(col => { col.blocks = []; col.height = 0; });
          currentColumn = 0;
        } else {
          columns[currentColumn].blocks.push(block);
          currentColumn = (currentColumn + 1) % page.columns;
        }

        if (yOffset > pageHeight - margin) {
          pdf.addPage();
          yOffset = margin;
        }
      });

      columns.forEach((col, index) => {
        if (col.blocks.length > 0) {
          renderColumnToPDF(pdf, col, margin + index * columnWidth, yOffset, columnWidth);
        }
      });
    });

    pdf.save(`magazine_${language}.pdf`);
  };

  const renderColumnToPDF = (pdf: jsPDF, column: { blocks: Block[], height: number }, x: number, y: number, width: number) => {
    let yOffset = y;
    column.blocks.forEach(block => {
      yOffset = renderBlockToPDF(pdf, block, x, yOffset, width);
    });
    column.height = yOffset - y;
  };

  const renderBlockToPDF = (pdf: jsPDF, block: Block, x: number, y: number, width: number): number => {
    if (block.type === 'text') {
      const text = stripHtmlTags(block.content as string);
      pdf.setFontSize(12);
      const splitText = pdf.splitTextToSize(text, width - 5);
      pdf.text(splitText, x, y);
      return y + splitText.length * 7;
    } else if (block.type === 'image' && typeof block.content === 'object' && block.content !== null) {
      const imgHeight = (width / 170) * 100; // Maintain aspect ratio
      pdf.addImage(`data:image/png;base64,${block.content.b64_json || ''}`, 'PNG', x, y, width - 5, imgHeight);
      return y + imgHeight + 10;
    }
    return y;
  };

  const downloadDOCX = async () => {
    const doc = new Document({
      sections: pagesState.map(page => ({
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: `Page ${pagesState.indexOf(page) + 1}`, bold: true, size: 24 })],
          }),
          createPageTable(page),
        ],
      })),
    });

    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `magazine_${language}.docx`;
    link.click();
  };

  const createPageTable = (page: Page): Table => {
    const rows: TableRow[] = [];
    let currentRow: (Paragraph | Table)[] = [];

    page.blocks.forEach((block, index) => {
      if (block.size === 'large' || index % page.columns === 0) {
        if (currentRow.length > 0) {
          rows.push(new TableRow({ children: currentRow.map(cell => new TableCell({ children: [cell] })) }));
          currentRow = [];
        }
        if (block.size === 'large') {
          rows.push(new TableRow({
            children: [new TableCell({
              children: [renderBlockToDOCX(block)],
              columnSpan: page.columns,
            })],
          }));
          return;
        }
      }
      currentRow.push(renderBlockToDOCX(block));
    });

    if (currentRow.length > 0) {
      rows.push(new TableRow({ children: currentRow.map(cell => new TableCell({ children: [cell] })) }));
    }

    return new Table({
      rows,
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
    });
  };

  const renderBlockToDOCX = (block: Block): Paragraph | Table => {
    if (block.type === 'text') {
      return new Paragraph({
        children: [new TextRun(stripHtmlTags(block.content as string))],
      });
    } else if (block.type === 'image' && typeof block.content === 'object' && block.content !== null) {
      return new Paragraph({
        children: [
          new ImageRun({
            data: Buffer.from(block.content.b64_json || '', 'base64'),
            transformation: {
              width: 200,
              height: 200,
            },
          } as IImageOptions),
        ],
      });
    }
    return new Paragraph({ children: [] });
  };

  const stripHtmlTags = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const downloadEPUB = async () => {
    try {
      const response = await fetch('/api/generateEpub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pages: pagesState, language }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate EPUB');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `magazine_${language}.epub`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading EPUB:', error);
      // You might want to show an error message to the user here
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const toggleCustomization = () => {
    setShowCustomization(!showCustomization);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`magazine-preview ${isFullScreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
        <div className={`${isFullScreen ? 'h-screen overflow-auto' : ''} bg-gradient-to-br from-indigo-100 to-purple-100 p-8`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`max-w-6xl mx-auto bg-white rounded-lg shadow-2xl overflow-hidden ${isFullScreen ? 'h-full' : ''}`}
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold">Your Luxury Magazine</h1>
                <div className="flex space-x-4">
                  <Button onClick={toggleCustomization} variant="outline" className="text-white border-white hover:bg-white hover:text-indigo-600">
                    <Palette size={16} className="mr-2" />
                    Customize
                  </Button>
                  <Button onClick={toggleFullScreen} variant="outline" className="text-white border-white hover:bg-white hover:text-indigo-600">
                    {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
                    {isFullScreen ? 'Exit Immersion' : 'Immerse'}
                  </Button>
                </div>
              </div>
              {showCustomization && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white bg-opacity-10 p-4 rounded-lg mt-4"
                >
                  <h3 className="text-xl font-semibold mb-4 text-white">Customize Your Magazine</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Background Color</label>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="color" 
                          value={backgroundColor} 
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-10 h-10 rounded-full cursor-pointer"
                        />
                        <span className="text-white">{backgroundColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Text Color</label>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="color" 
                          value={textColor} 
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-10 h-10 rounded-full cursor-pointer"
                        />
                        <span className="text-white">{textColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Brand Color</label>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="color" 
                          value={brandColor} 
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="w-10 h-10 rounded-full cursor-pointer"
                        />
                        <span className="text-white">{brandColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Zoom Level</label>
                      <Slider
                        value={[zoomLevel]}
                        onValueChange={(value) => setZoomLevel(value[0])}
                        min={50}
                        max={200}
                        step={10}
                        className="w-full"
                      />
                      <span className="text-white">{zoomLevel}%</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Preview Device</label>
                      <Select
                        value={selectedDevice}
                        onValueChange={setSelectedDevice}
                        options={[
                          { value: 'desktop', label: 'Desktop' },
                          { value: 'tablet', label: 'Tablet' },
                          { value: 'mobile', label: 'Mobile' },
                        ]}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Magazine content */}
            <div className={`p-6 ${isFullScreen ? 'overflow-auto' : ''}`}>
              {pagesState.map((page, pageIndex) => (
                <motion.div
                  key={pageIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: pageIndex * 0.1 }}
                  className="mb-12 last:mb-0"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Page {pageIndex + 1}</h2>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600">Layout:</span>
                        <select
                          value={page.columns}
                          onChange={(e) => updatePageColumns(pageIndex, parseInt(e.target.value))}
                          className="form-select rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        >
                          {[1, 2, 3, 4].map((num) => (
                            <option key={num} value={num}>{num} Column{num > 1 ? 's' : ''}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                  <div 
                    className="relative rounded-lg overflow-hidden shadow-lg"
                    style={{
                      backgroundColor: backgroundColor,
                      color: textColor,
                      minHeight: '300px',
                      transform: `scale(${zoomLevel / 100})`,
                      transformOrigin: 'top left',
                      width: selectedDevice === 'mobile' ? '320px' : selectedDevice === 'tablet' ? '768px' : '100%',
                      margin: '0 auto',
                    }}
                  >
                    <BackgroundImage
                      backgroundImage={page.backgroundImage}
                      onBackgroundImageUpload={handleBackgroundImageUpload(pageIndex)}
                    />
                    <div className="relative z-10 p-6">
                      <div 
                        className={`grid gap-6`}
                        style={{ gridTemplateColumns: `repeat(${page.columns}, minmax(0, 1fr))` }}
                      >
                        {page.blocks.map((block, blockIndex) => (
                          <motion.div
                            key={block.id}
                            drag
                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                            className="bg-white bg-opacity-90 rounded-lg shadow-md p-4 cursor-move"
                          >
                            {block.type === 'text' ? (
                              <p 
                                dangerouslySetInnerHTML={{ __html: block.content as string }} 
                                style={{ 
                                  fontFamily: "'Playfair Display', serif",
                                  fontSize: block.size === 'large' ? '24px' : '16px',
                                  lineHeight: '1.6',
                                  color: textColor,
                                }}
                              />
                            ) : block.type === 'image' && block.content && typeof block.content === 'object' && 'b64_json' in block.content ? (
                              <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden shadow-lg">
                                <Image 
                                  src={`data:image/png;base64,${block.content.b64_json}`}
                                  alt={`Image ${blockIndex}`}
                                  layout="fill"
                                  objectFit="cover"
                                  className="transition-transform duration-300 hover:scale-105"
                                />
                              </div>
                            ) : (
                              <p className="text-red-500 italic">Image not available</p>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    <div 
                      className="absolute bottom-0 left-0 w-full h-2"
                      style={{ backgroundColor: brandColor }}
                    ></div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Download buttons */}
            <div className="bg-gray-100 p-6 flex justify-center space-x-4">
              {['PDF', 'DOCX', 'EPUB'].map((format) => (
                <Button
                  key={format}
                  onClick={() => format === 'PDF' ? downloadPDF() : format === 'DOCX' ? downloadDOCX() : downloadEPUB()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download as {format}
                </Button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </DndProvider>
  );
};

export default memo(MagazinePreview);