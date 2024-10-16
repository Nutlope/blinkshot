import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';
import TTSButton from './TTSButton';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

type Block = {
  type: 'text' | 'image';
  content: string | { b64_json: string } | null;
  generating?: boolean;
};

type Page = {
  blocks: Block[];
};

type EditableBookPreviewProps = {
  pages: Page[];
  language: string;
  updatePageContent: (pageIndex: number, newPage: Page) => void;
  availableLanguages: string[];
};

const EditableBookPreview: React.FC<EditableBookPreviewProps> = ({ 
  pages, 
  language, 
  updatePageContent,
  availableLanguages 
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(pages.length - 1, prev + 1));
  }, [pages.length]);

  const handleTextChange = useCallback((content: string, blockIndex: number) => {
    const newBlocks = [...pages[currentPage].blocks];
    newBlocks[blockIndex] = { ...newBlocks[blockIndex], content };
    updatePageContent(currentPage, { ...pages[currentPage], blocks: newBlocks });
  }, [currentPage, pages, updatePageContent]);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
  ];

  const PreviewContent = () => (
    <div className={`mx-auto ${isFullScreen ? 'max-w-4xl' : 'max-w-2xl'}`}>
      <div style={{ 
        marginBottom: '20px', 
        display: 'flex', 
        alignItems: 'center', 
        backgroundColor: '#4CAF50', 
        padding: '10px', 
        borderRadius: '4px' 
      }}>
        <h2 style={{ 
          fontSize: isFullScreen ? '2rem' : '1.5rem', 
          fontWeight: 'bold', 
          color: 'black', 
          margin: 0,
          flexGrow: 1
        }}>
          Editable Book Preview ({language})
        </h2>
        <Button onClick={toggleFullScreen} style={{ marginLeft: '10px' }}>
          {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
          {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
        </Button>
      </div>
      <div className={`bg-white p-4 shadow-lg mb-4 ${isFullScreen ? 'min-h-[80vh]' : 'min-h-[400px]'}`}>
        {pages[currentPage].blocks.map((block, blockIndex) => (
          <div key={blockIndex} className="mb-4">
            {block.type === 'text' ? (
              <div>
                <style jsx global>{`
                  .quill {
                    background-color: white;
                  }
                  .ql-editor {
                    color: black;
                    min-height: 200px;
                  }
                `}</style>
                <ReactQuill
                  value={block.content as string}
                  onChange={(content) => handleTextChange(content, blockIndex)}
                  modules={quillModules}
                  formats={quillFormats}
                  theme="snow"
                />
                <TTSButton text={block.content as string} language={language} />
              </div>
            ) : block.type === 'image' && block.content && typeof block.content === 'object' && 'b64_json' in block.content ? (
              <Image
                src={`data:image/png;base64,${block.content.b64_json}`}
                alt={`Image ${blockIndex}`}
                width={300}
                height={200}
                layout="responsive"
                className="max-w-full h-auto"
              />
            ) : (
              <p>Image not available</p>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center mb-4">
        <Button onClick={prevPage} disabled={currentPage === 0}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous Page
        </Button>
        <span>{currentPage + 1} / {pages.length}</span>
        <Button onClick={nextPage} disabled={currentPage === pages.length - 1}>
          Next Page
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className={`p-4 ${
      isFullScreen 
        ? 'fixed inset-0 z-50 bg-gray-100 overflow-auto flex items-start justify-center' 
        : 'mx-auto'
    }`}>
      <PreviewContent />
    </div>
  );
};

export default EditableBookPreview;
