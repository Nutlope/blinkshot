import React, { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import TTSButton from './TTSButton';
import { ResizableBox } from 'react-resizable';
import { Maximize, Minimize } from 'lucide-react';
import 'react-resizable/css/styles.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

type Block = {
  type: string;
  content: any;
  width?: number;
  height?: number;
};

type PageContent = {
  blocks: Block[];
};

type EditableBookPreviewProps = {
  pages: PageContent[];
  language: string;
  updatePageContent: (pageIndex: number, newPage: PageContent) => void;
  availableLanguages: string[];
};

const EditableBookPreview: React.FC<EditableBookPreviewProps> = ({ 
  pages, 
  language, 
  updatePageContent,
  availableLanguages
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleImageResize = (pageIndex: number, blockIndex: number, size: { width: number, height: number }) => {
    const newPages = [...pages];
    newPages[pageIndex].blocks[blockIndex].width = size.width;
    newPages[pageIndex].blocks[blockIndex].height = size.height;
    updatePageContent(pageIndex, newPages[pageIndex]);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const renderBlock = (block: Block, pageIndex: number, blockIndex: number) => {
    switch (block.type) {
      case "text":
        return (
          <div key={blockIndex} style={{ marginBottom: "1rem" }}>
            {block.content ? (
              <>
                <ReactQuill
                  value={block.content}
                  onChange={(content) => {
                    const newPage = {...pages[pageIndex]};
                    newPage.blocks[blockIndex].content = content;
                    updatePageContent(pageIndex, newPage);
                  }}
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['clean']
                    ]
                  }}
                  style={{ 
                    height: "auto", 
                    marginBottom: "1rem",
                    color: "#374151",
                    fontSize: "1rem",
                  }}
                />
                <TTSButton 
                  text={block.content} 
                  language={language} 
                  availableLanguages={availableLanguages}
                />
              </>
            ) : (
              <div style={{ color: "#9CA3AF", fontStyle: "italic" }}>Empty text block</div>
            )}
          </div>
        );
      case "image":
        return (
          <div key={blockIndex} style={{ marginBottom: "1rem" }}>
            {block.content ? (
              <ResizableBox
                width={block.width || 300}
                height={block.height || 225}
                onResize={(e, { size }) => {
                  e.preventDefault();
                  handleImageResize(pageIndex, blockIndex, size);
                }}
                minConstraints={[100, 75]}
                maxConstraints={[600, 450]}
                resizeHandles={['se']}
                draggableOpts={{ 
                  preventDefault: true, 
                  stopPropagation: true 
                }}
              >
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <Image
                    src={`data:image/png;base64,${block.content.b64_json}`}
                    alt=""
                    layout="fill"
                    objectFit="contain"
                    style={{ borderRadius: "0.25rem", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" }}
                  />
                </div>
              </ResizableBox>
            ) : (
              <div style={{ width: '100%', height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6', color: "#9CA3AF", fontStyle: "italic" }}>
                Empty image block
              </div>
            )}
          </div>
        );
      case "video":
        return (
          <div key={blockIndex} style={{ marginBottom: "1rem" }}>
            {block.content ? (
              <video 
                src={block.content} 
                controls 
                style={{ maxWidth: "100%", borderRadius: "0.25rem" }}
              />
            ) : (
              <div style={{ width: '100%', height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6', color: "#9CA3AF", fontStyle: "italic" }}>
                Empty video block
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const PreviewContent = () => (
    <div style={{ 
      maxWidth: isFullScreen ? "none" : "600px", 
      margin: "0 auto", 
      backgroundColor: "#fff", 
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", 
      borderRadius: "0.5rem", 
      overflow: "hidden",
      height: isFullScreen ? "100%" : "auto",
      position: "relative",
    }}>
      <div style={{ 
        padding: "1rem", 
        borderBottom: "1px solid #e5e7eb", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        position: "sticky",
        top: 0,
        backgroundColor: "#fff",
        zIndex: 10,
      }}>
        <h2 style={{ margin: 0 }}>Editable Book Preview</h2>
        <button 
          onClick={toggleFullScreen}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            zIndex: 11,
          }}
        >
          {isFullScreen ? <Minimize size={24} /> : <Maximize size={24} />}
        </button>
      </div>
      <div style={{ padding: "1rem" }}>
        {pages.map((page, pageIndex) => (
          <div key={pageIndex} style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#4b5563", textAlign: "center" }}>Page {pageIndex + 1}</h3>
            {page.blocks.map((block, blockIndex) => (
              <div key={blockIndex} style={{ marginBottom: "1rem" }}>
                {renderBlock(block, pageIndex, blockIndex)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {isFullScreen ? (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          zIndex: 1000,
          overflow: "auto",
        }}>
          <PreviewContent />
        </div>
      ) : (
        <PreviewContent />
      )}
    </>
  );
};

export default EditableBookPreview;
