import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, ImageRun, IImageOptions } from 'docx';
import { Button } from "@/components/ui/button";
import { Download, Maximize, Minimize, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

type Block = {
  type: 'text' | 'image';
  content: string | { b64_json: string } | null;
};

type PageContent = {
  blocks: Block[];
};

type FinalBookPreviewProps = {
  pages: PageContent[];
  language: string;
};

const FinalBookPreview: React.FC<FinalBookPreviewProps> = ({ pages, language }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(pages.length - 1, prev + 1));
  };

  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);

  const downloadPDF = () => {
    // Implement PDF download logic here
    console.log('Downloading PDF...');
  };

  const downloadDOCX = () => {
    // Implement DOCX download logic here
    console.log('Downloading DOCX...');
  };

  const downloadEPUB = () => {
    // Implement EPUB download logic here
    console.log('Downloading EPUB...');
  };

  return (
    <div className={`p-4 ${isFullScreen ? 'fixed inset-0 z-50 bg-white overflow-auto' : ''}`}>
      <div className={`mx-auto ${isFullScreen ? 'max-w-4xl' : 'max-w-2xl'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-black">Final Book Preview ({language})</h2>
          <Button onClick={toggleFullScreen} variant="outline">
            {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
            {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
          </Button>
        </div>
        
        <div ref={bookRef} className="bg-white p-8 rounded-lg shadow-lg mb-4 min-h-[400px] border border-gray-200">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {pages.length > 0 && pages[currentPage]?.blocks.map((block, index) => (
                <div key={index} className="mb-4">
                  {block.type === 'text' && (
                    <p className="text-black text-lg leading-relaxed">{block.content as string}</p>
                  )}
                  {block.type === 'image' && block.content && typeof block.content === 'object' && 'b64_json' in block.content && (
                    <div className="relative w-full h-64 md:h-96">
                      <Image 
                        src={`data:image/png;base64,${block.content.b64_json}`}
                        alt={`Image ${index}`}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-lg"
                      />
                    </div>
                  )}
                </div>
              ))}
              {pages.length === 0 && (
                <p className="text-gray-500 text-center">No content available. Start writing to see your book preview!</p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <Button onClick={prevPage} disabled={currentPage === 0} variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous Page
          </Button>
          <span className="text-black">{currentPage + 1} / {pages.length}</span>
          <Button onClick={nextPage} disabled={currentPage === pages.length - 1} variant="outline">
            Next Page
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        
        <div className="flex justify-center space-x-4">
          <Button onClick={downloadPDF} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download as PDF
          </Button>
          <Button onClick={downloadDOCX} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download as DOCX
          </Button>
          <Button onClick={downloadEPUB} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download as EPUB
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FinalBookPreview;
