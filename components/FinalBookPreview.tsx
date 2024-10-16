import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import Image from 'next/image';

type PageContent = {
  blocks: {
    type: string;
    content: string | { b64_json: string };
  }[];
};

type FinalBookPreviewProps = {
  pages: PageContent[];
  language: string;
};

const FinalBookPreview: React.FC<FinalBookPreviewProps> = ({ pages, language }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const bookRef = useRef<HTMLDivElement>(null);

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

  const downloadBook = async () => {
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

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Final Book Preview ({language})</h2>
      <div ref={bookRef} className="bg-white p-4 shadow-lg mb-4 min-h-[400px]">
        {pages[currentPage].blocks.map((block, index) => (
          <div key={index} className="mb-4">
            {block.type === 'text' && (
              <p className="text-black">{stripHtmlTags(block.content as string)}</p>
            )}
            {block.type === 'image' && typeof block.content === 'object' && (
              <Image 
                src={`data:image/png;base64,${block.content.b64_json}`}
                alt={`Image ${index}`}
                width={300}
                height={200}
                layout="responsive"
                className="max-w-full h-auto"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center mb-4">
        <Button onClick={prevPage} disabled={currentPage === 0}>Previous Page</Button>
        <span>{currentPage + 1} / {pages.length}</span>
        <Button onClick={nextPage} disabled={currentPage === pages.length - 1}>Next Page</Button>
      </div>
      <div className="mt-4">
        <Button onClick={downloadBook} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Download Book
        </Button>
      </div>
    </div>
  );
};

export default FinalBookPreview;
