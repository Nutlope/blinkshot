import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import Image from 'next/image';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, IImageOptions } from 'docx';
import { Button } from "@/components/ui/button";
import { Download, Upload, Maximize, Minimize } from 'lucide-react';

interface Block {
  id: string;
  type: 'text' | 'image';
  content: string | { b64_json: string } | null;
  size: 'small' | 'medium' | 'large';
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
    <label htmlFor="bg-image-upload" style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      zIndex: 3,
      background: 'rgba(255, 255, 255, 0.7)',
      padding: '8px 12px',
      borderRadius: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      fontSize: '14px'
    }}>
      <Upload size={16} style={{ marginRight: '5px' }} />
      Upload Background
      <input
        id="bg-image-upload"
        type="file"
        accept="image/*"
        onChange={onBackgroundImageUpload}
        style={{ display: 'none' }}
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
    let currentColumn = 0;

    blocks.forEach(block => {
      if (block.size === 'large') {
        // Large blocks always span all columns
        newBlocks.push({ ...block, size: 'large' });
        currentColumn = 0;
      } else {
        newBlocks.push({ ...block, size: 'small' });
        currentColumn = (currentColumn + 1) % columns;
      }
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
          gap: '1rem'
        }}>
          {page.blocks.map((block, blockIndex) => renderBlock(block, blockIndex, page.columns))}
        </div>
      </div>
    </div>
  ), [backgroundColor, textColor, updatePageColumns, handleBackgroundImageUpload]);

  const renderBlock = useCallback((block: Block, index: number, columns: number) => (
    <div key={block.id} style={{ 
      gridColumn: block.size === 'large' ? `span ${columns}` : 'auto',
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      padding: '15px',
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
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

  const PreviewContent = () => (
    <>
      <div style={{ 
        marginBottom: '20px', 
        display: 'flex', 
        alignItems: 'center', 
        backgroundColor: '#4CAF50', 
        padding: '10px', 
        borderRadius: '4px' 
      }}>
        <label style={{ 
          marginRight: '20px', 
          display: 'flex', 
          alignItems: 'center',
          color: 'black',
          fontWeight: 'bold'
        }}>
          Background Color:
          <input 
            type="color" 
            value={backgroundColor} 
            onChange={(e) => setBackgroundColor(e.target.value)}
            style={{ 
              marginLeft: '10px',
              width: '50px',
              height: '30px',
              padding: '0',
              border: '1px solid #45a049',
              borderRadius: '4px'
            }}
          />
        </label>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center',
          color: 'black',
          fontWeight: 'bold'
        }}>
          Text Color:
          <input 
            type="color" 
            value={textColor} 
            onChange={(e) => setTextColor(e.target.value)}
            style={{ 
              marginLeft: '10px',
              width: '50px',
              height: '30px',
              padding: '0',
              border: '1px solid #45a049',
              borderRadius: '4px'
            }}
          />
        </label>
        <Button onClick={toggleFullScreen} style={{ marginLeft: 'auto' }}>
          {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
          {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
        </Button>
      </div>
      {pagesState.map(renderPage)}
      <div className="download-buttons" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <Button onClick={downloadPDF}>
          <Download size={16} style={{ marginRight: '5px' }} />
          Download PDF
        </Button>
        <Button onClick={downloadDOCX}>
          <Download size={16} style={{ marginRight: '5px' }} />
          Download DOCX
        </Button>
        <Button onClick={downloadEPUB}>
          <Download size={16} style={{ marginRight: '5px' }} />
          Download EPUB
        </Button>
      </div>
    </>
  );

  return (
    <DndProvider backend={HTML5Backend}>
      {isFullScreen ? (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          zIndex: 1000,
          overflow: "auto",
          padding: "2rem"
        }}>
          <PreviewContent />
        </div>
      ) : (
        <div className="magazine-preview" style={{ padding: '20px' }}>
          <PreviewContent />
        </div>
      )}
    </DndProvider>
  );
};

export default memo(MagazinePreview);
