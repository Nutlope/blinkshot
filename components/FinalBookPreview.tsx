import React, { useState } from 'react';
import Image from 'next/image';
import TTSButton from './TTSButton';

type Block = {
  type: string;
  content: any;
};

type PageContent = {
  blocks: Block[];
};

type FinalBookPreviewProps = {
  pages: PageContent[];
  language: string;
};

const FinalBookPreview: React.FC<FinalBookPreviewProps> = ({ pages, language }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const PreviewContent = () => (
    <div style={{ 
      maxWidth: isFullScreen ? "none" : "600px", 
      margin: "0 auto", 
      backgroundColor: "#fff", 
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", 
      borderRadius: "0.5rem", 
      overflow: "hidden",
      height: isFullScreen ? "100%" : "auto"
    }}>
      <div style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>
        <button 
          onClick={toggleFullScreen}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#4B5563",
            color: "white",
            border: "none",
            borderRadius: "0.25rem",
            cursor: "pointer"
          }}
        >
          {isFullScreen ? "Exit Full Screen" : "Full Screen"}
        </button>
      </div>
      {pages.map((page, pageIndex) => (
        <div key={pageIndex} style={{ padding: "2rem", borderBottom: pageIndex < pages.length - 1 ? "1px solid #e5e7eb" : "none" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#4b5563", textAlign: "center" }}>Page {pageIndex + 1}</h3>
          {page.blocks.map((block, blockIndex) => (
            <div key={blockIndex} style={{ marginBottom: "1rem" }}>
              {block.type === "text" ? (
                <div>
                  <div dangerouslySetInnerHTML={{ __html: block.content }} style={{ 
                    lineHeight: "1.6", 
                    color: "#374151",
                    fontSize: "1rem",
                  }} />
                  <TTSButton text={block.content} language={language} />
                </div>
              ) : block.type === "image" && block.content ? (
                <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem", marginBottom: "1rem" }}>
                  <Image
                    src={`data:image/png;base64,${block.content.b64_json}`}
                    alt=""
                    width={300}
                    height={225}
                    style={{ borderRadius: "0.25rem", maxWidth: "100%", height: "auto", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" }}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ))}
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
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          zIndex: 1000,
          overflow: "auto",
          padding: "2rem"
        }}>
          <PreviewContent />
        </div>
      ) : (
        <PreviewContent />
      )}
    </>
  );
};

export default FinalBookPreview;
