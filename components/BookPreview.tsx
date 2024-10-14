import React from 'react';
import Image from 'next/image';
import TTSButton from './TTSButton';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

type Block = {
  type: string;
  content: any;
};

type PageContent = {
  blocks: Block[];
};

type BookPreviewProps = {
  pages: PageContent[];
  language: string;
  updatePageContent: (pageIndex: number, newPage: PageContent) => void;
};

const BookPreview: React.FC<BookPreviewProps> = ({ pages, language, updatePageContent }) => {
  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#fff", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", borderRadius: "0.5rem", overflow: "hidden" }}>
      {pages.map((page, pageIndex) => (
        <div key={pageIndex} style={{ padding: "2rem", borderBottom: pageIndex < pages.length - 1 ? "1px solid #e5e7eb" : "none" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#4b5563", textAlign: "center" }}>Page {pageIndex + 1}</h3>
          {page.blocks.map((block, blockIndex) => (
            <div key={blockIndex} style={{ marginBottom: "1rem" }}>
              {block.type === "text" ? (
                <div>
                  <ReactQuill
                    value={block.content}
                    onChange={(content) => {
                      const newPage = {...page};
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
};

export default BookPreview;
