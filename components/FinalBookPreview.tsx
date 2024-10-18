import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, ImageRun, IImageOptions } from 'docx';
import { Button } from "@/components/ui/button";
import { Download, Maximize, Minimize, ChevronLeft, ChevronRight, Palette, Type, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

type PageContent = {
  blocks: {
    type: string;
    content: string | { b64_json: string } | null;
  }[];
};

type FinalBookPreviewProps = {
  pages: PageContent[];
  language: string;
};

const themes = {
  classic: { bg: 'bg-amber-100', text: 'text-amber-900', accent: 'bg-amber-600' },
  modern: { bg: 'bg-gray-200', text: 'text-gray-900', accent: 'bg-blue-600' },
  fantasy: { bg: 'bg-purple-200', text: 'text-purple-900', accent: 'bg-purple-600' },
  scifi: { bg: 'bg-slate-800', text: 'text-slate-100', accent: 'bg-cyan-400' },
  romance: { bg: 'bg-pink-200', text: 'text-pink-900', accent: 'bg-pink-500' },
  mystery: { bg: 'bg-gray-900', text: 'text-gray-100', accent: 'bg-red-600', buttonText: 'text-white' },
};

const fonts = {
  serif: 'font-serif',
  sans: 'font-sans',
  mono: 'font-mono',
  cursive: 'font-cursive',
};

const FinalBookPreview: React.FC<FinalBookPreviewProps> = ({ pages, language }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [theme, setTheme] = useState('classic');
  const [font, setFont] = useState('serif');
  const [showCustomization, setShowCustomization] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowCustomization(true);
    const timer = setTimeout(() => setShowCustomization(false), 2000);
    return () => clearTimeout(timer);
  }, [currentPage]);

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, pages.length - 1));
  };

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  const stripHtmlTags = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const downloadPDF = async () => {
    const pdf = new jsPDF();
    let yOffset = 20;

    pages.forEach((page, pageIndex) => {
      if (pageIndex > 0) {
        pdf.addPage();
        yOffset = 20;
      }

      pdf.setFontSize(16);
      pdf.text(`Page ${pageIndex + 1}`, 20, yOffset);
      yOffset += 10;

      page.blocks.forEach((block) => {
        if (block.type === 'text') {
          const text = stripHtmlTags(block.content as string);
          pdf.setFontSize(12);
          const splitText = pdf.splitTextToSize(text, 170);
          pdf.text(splitText, 20, yOffset);
          yOffset += 7 * splitText.length;
        } else if (block.type === 'image' && typeof block.content === 'object') {
          try {
            pdf.addImage(`data:image/png;base64,${block.content.b64_json}`, 'PNG', 20, yOffset, 170, 100);
            yOffset += 110;
          } catch (error) {
            console.error('Error adding image to PDF:', error);
          }
        }

        if (yOffset > 280) {
          pdf.addPage();
          yOffset = 20;
        }
      });
    });

    pdf.save(`book_${language}.pdf`);
  };

  const downloadDOCX = async () => {
    const children = await Promise.all(pages.flatMap(async (page, pageIndex) => {
      const pageChildren = [
        new Paragraph({
          children: [new TextRun({ text: `Page ${pageIndex + 1}`, bold: true, size: 24 })],
        }),
      ];

      for (const block of page.blocks) {
        if (block.type === 'text') {
          pageChildren.push(
            new Paragraph({
              children: [new TextRun(stripHtmlTags(block.content as string))],
            })
          );
        } else if (block.type === 'image' && typeof block.content === 'object') {
          try {
            const base64Data = (block.content as { b64_json: string }).b64_json.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            pageChildren.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: buffer,
                    transformation: {
                      width: 500,
                      height: 300,
                    },
                  } as IImageOptions),
                ],
              })
            );
          } catch (error) {
            console.error('Error adding image to DOCX:', error);
            pageChildren.push(
              new Paragraph({
                children: [new TextRun('[Image Placeholder]')],
              })
            );
          }
        }
      }

      return pageChildren;
    }));

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: children.flat(),
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `book_${language}.docx`;
    link.click();
  };

  const downloadEPUB = async () => {
    try {
      const response = await fetch('/api/generateEpub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pages, language }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate EPUB');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `book_${language}.epub`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading EPUB:', error);
    }
  };

  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);
  const toggleCustomization = () => setShowCustomization(!showCustomization);

  const PreviewContent = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`mx-auto ${isFullScreen ? 'max-w-4xl' : 'max-w-2xl'}`}
    >
      <div className={`relative mb-8 overflow-hidden rounded-lg shadow-2xl ${themes[theme].accent}`}>
        <div className="relative z-10 flex items-center justify-between p-6">
          <h2 className={`text-3xl font-bold ${theme === 'mystery' ? 'text-white' : themes[theme].text}`}>
            Your Story Comes to Life
          </h2>
          <div className="flex space-x-2">
            <Button onClick={toggleCustomization} variant="outline" className={`${theme === 'mystery' ? 'text-white' : themes[theme].text} border-current hover:bg-opacity-20`}>
              <Palette size={16} className="mr-2" />
              Customize
            </Button>
            <Button onClick={toggleFullScreen} variant="outline" className={`${theme === 'mystery' ? 'text-white' : themes[theme].text} border-current hover:bg-opacity-20`}>
              {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
              {isFullScreen ? 'Exit Immersion' : 'Immerse'}
            </Button>
          </div>
        </div>
      </div>

      {showCustomization && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 p-4 bg-white rounded-lg shadow-md"
        >
          <h3 className="text-lg font-semibold mb-2 text-gray-800">Customize Your Book</h3>
          <div className="flex flex-wrap gap-2">
            {Object.keys(themes).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-3 py-1 rounded ${
                  theme === t ? 'ring-2 ring-blue-500' : ''
                } ${themes[t].bg} ${t === 'mystery' ? themes[t].buttonText : themes[t].text} border border-gray-300 relative overflow-hidden`}
              >
                <span className="relative z-10 font-medium">{t.charAt(0).toUpperCase() + t.slice(1)}</span>
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.keys(fonts).map((f) => (
              <button
                key={f}
                onClick={() => setFont(f)}
                className={`px-3 py-1 rounded ${
                  font === f ? 'ring-2 ring-blue-500' : ''
                } ${fonts[f]} bg-gray-100 text-gray-800 border border-gray-300`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        ref={bookRef}
        className={`${themes[theme].bg} ${themes[theme].text} ${fonts[font]} p-8 rounded-lg shadow-2xl mb-8 ${isFullScreen ? 'min-h-[80vh]' : 'min-h-[60vh]'} relative overflow-hidden`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            {pages[currentPage].blocks.map((block, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="mb-6"
              >
                {block.type === 'text' && (
                  <p className={`text-lg leading-relaxed ${themes[theme].text}`}>
                    {stripHtmlTags(block.content as string)}
                  </p>
                )}
                {block.type === 'image' && block.content && typeof block.content === 'object' && 'b64_json' in block.content ? (
                  <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden shadow-lg">
                    <Image 
                      src={`data:image/png;base64,${block.content.b64_json}`}
                      alt={`Illustration ${index + 1}`}
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                ) : block.type === 'image' ? (
                  <p className="text-red-500 italic">Image not available</p>
                ) : null}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <div className="flex justify-between items-center mb-8">
        <Button onClick={prevPage} disabled={currentPage === 0} className={`flex items-center space-x-2 ${themes[theme].accent} text-white`}>
          <ChevronLeft size={20} />
          <span>Previous</span>
        </Button>
        <span className={`text-xl font-semibold ${themes[theme].text}`}>{currentPage + 1} / {pages.length}</span>
        <Button onClick={nextPage} disabled={currentPage === pages.length - 1} className={`flex items-center space-x-2 ${themes[theme].accent} text-white`}>
          <span>Next</span>
          <ChevronRight size={20} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['PDF', 'DOCX', 'EPUB'].map((format) => (
          <Button
            key={format}
            onClick={() => format === 'PDF' ? downloadPDF() : format === 'DOCX' ? downloadDOCX() : downloadEPUB()}
            className={`w-full ${themes[theme].accent} text-white font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105`}
          >
            <Download className="w-5 h-5 mr-2" />
            Download as {format}
          </Button>
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className={`p-4 ${
      isFullScreen 
        ? 'fixed inset-0 z-50 bg-opacity-90 overflow-auto flex items-start justify-center' 
        : 'mx-auto'
    } ${themes[theme].bg}`}>
      <PreviewContent />
    </div>
  );
};

export default FinalBookPreview;
