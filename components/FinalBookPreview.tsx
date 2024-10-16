import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, SectionType } from 'docx';
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
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: pages.flatMap((page, pageIndex) => [
            new Paragraph({
              children: [new TextRun(`Page ${pageIndex + 1}`)],
            }),
            ...page.blocks.map((block) => {
              if (block.type === 'text') {
                return new Paragraph({
                  children: [new TextRun(stripHtmlTags(block.content as string))],
                });
              } else if (block.type === 'image' && typeof block.content === 'object') {
                // TODO: Implement image handling for DOCX
                // This requires converting the base64 image to a buffer,
                // saving it temporarily, and then adding it to the document using:
                // doc.createImage(fs.readFileSync("path/to/image.png"))
                return new Paragraph({
                  children: [new TextRun('[Image Placeholder]')],
                });
              }
              return new Paragraph({
                children: [new TextRun('')],
              });
            }),
          ]),
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

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Final Book Preview ({language})</h2>
      <div ref={bookRef} className="bg-white p-4 shadow-lg mb-4 min-h-[400px]">
        {pages[currentPage].blocks.map((block, index) => (
          <div key={index} className="mb-4">
            {block.type === 'text' && (
              <p className="text-black">{stripHtmlTags(block.content as string)}</p>
            )}
            {block.type === 'image' && 
             typeof block.content === 'object' && 
             block.content !== null &&
             'b64_json' in block.content && (
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
      <div className="mt-4 space-y-2">
        <Button onClick={downloadPDF} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Download as PDF
        </Button>
        <Button onClick={downloadDOCX} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Download as DOCX
        </Button>
        <Button onClick={downloadEPUB} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Download as EPUB
        </Button>
      </div>
    </div>
  );
};

export default FinalBookPreview;
