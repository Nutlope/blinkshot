import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import TTSButton from './TTSButton';
import { Maximize, Minimize, Edit } from 'lucide-react';
import ImageEditor from './ImageEditor';
import { 
  Roboto, 
  Playfair_Display, 
  Dancing_Script, 
  Oswald, 
  Bebas_Neue, 
  Montserrat,
  Open_Sans,
  Lato,
  Nunito,
  Source_Sans_3,
  Merriweather,
  PT_Sans,
  Noto_Sans,
  Noto_Serif,
} from 'next/font/google';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

type Block = {
  type: string;
  content: any;
  width?: number;
  height?: number;
  font?: string;
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

const roboto = Roboto({ subsets: ['latin'], weight: ['400', '700'] });
const playfair = Playfair_Display({ subsets: ['latin'] });
const dancingScript = Dancing_Script({ subsets: ['latin'] });
const oswald = Oswald({ subsets: ['latin'] });
const bebasNeue = Bebas_Neue({ subsets: ['latin'], weight: '400' });
const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '700'] });
const openSans = Open_Sans({ subsets: ['latin'] });
const lato = Lato({ subsets: ['latin'], weight: ['400', '700'] });
const nunito = Nunito({ subsets: ['latin'] });
const sourceSans3 = Source_Sans_3({ subsets: ['latin'], weight: ['400', '700'] });
const merriweather = Merriweather({ subsets: ['latin'], weight: ['400', '700'] });
const ptSans = PT_Sans({ subsets: ['latin'], weight: ['400', '700'] });
const notoSans = Noto_Sans({ subsets: ['latin'], weight: ['400', '700'] });
const notoSerif = Noto_Serif({ subsets: ['latin'], weight: ['400', '700'] });

const fonts = [
  { name: 'Arial (Default)', value: 'Arial, sans-serif' },
  { name: 'Roboto', value: roboto.style.fontFamily },
  { name: 'Open Sans', value: openSans.style.fontFamily },
  { name: 'Lato', value: lato.style.fontFamily },
  { name: 'Nunito', value: nunito.style.fontFamily },
  { name: 'Source Sans 3', value: sourceSans3.style.fontFamily },
  { name: 'Montserrat', value: montserrat.style.fontFamily },
  { name: 'PT Sans', value: ptSans.style.fontFamily },
  { name: 'Playfair Display', value: playfair.style.fontFamily },
  { name: 'Merriweather', value: merriweather.style.fontFamily },
  { name: 'Dancing Script', value: dancingScript.style.fontFamily },
  { name: 'Oswald', value: oswald.style.fontFamily },
  { name: 'Bebas Neue', value: bebasNeue.style.fontFamily },
  { name: 'Noto Sans', value: notoSans.style.fontFamily },
  { name: 'Noto Serif', value: notoSerif.style.fontFamily },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Courier New', value: 'Courier New, monospace' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
];

const EditableBookPreview: React.FC<EditableBookPreviewProps> = ({ 
  pages, 
  language, 
  updatePageContent,
  availableLanguages
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [editingImage, setEditingImage] = useState<{ pageIndex: number, blockIndex: number } | null>(null);
  const [isImageEditorFullScreen, setIsImageEditorFullScreen] = useState(false);
  const quillRefs = useRef<any[]>([]);

  const handleImageResize = (pageIndex: number, blockIndex: number, size: { width: number, height: number }) => {
    const newPages = [...pages];
    newPages[pageIndex].blocks[blockIndex].width = size.width;
    newPages[pageIndex].blocks[blockIndex].height = size.height;
    updatePageContent(pageIndex, newPages[pageIndex]);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const toggleImageEditorFullScreen = () => {
    setIsImageEditorFullScreen(!isImageEditorFullScreen);
  };

  const handleImageEdit = (pageIndex: number, blockIndex: number) => {
    setEditingImage({ pageIndex, blockIndex });
    setIsImageEditorFullScreen(true);
  };

  const handleImageSave = (pageIndex: number, blockIndex: number, editedImageUrl: string) => {
    const newPages = [...pages];
    newPages[pageIndex].blocks[blockIndex].content = { b64_json: editedImageUrl.split(',')[1] };
    // Reset the width and height when saving the edited image
    delete newPages[pageIndex].blocks[blockIndex].width;
    delete newPages[pageIndex].blocks[blockIndex].height;
    updatePageContent(pageIndex, newPages[pageIndex]);
    setEditingImage(null);
    setIsImageEditorFullScreen(false);
  };

  const handleImageEditCancel = () => {
    setEditingImage(null);
    setIsImageEditorFullScreen(false);
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'font': fonts.map(font => font.name) }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'script',
    'indent',
    'direction',
    'size',
    'font',
    'color', 'background',
    'align',
  ];

  const renderBlock = (block: Block, pageIndex: number, blockIndex: number) => {
    switch (block.type) {
      case "text":
        return (
          <div key={blockIndex} style={{ marginBottom: "1rem" }}>
            {block.content ? (
              <>
                <div className="flex items-center space-x-2 mb-2">
                  <label className="w-20 text-sm font-medium text-black">Font:</label>
                  <select
                    value={fonts.find(f => f.value === block.font)?.name || fonts[0].name}
                    onChange={(e) => {
                      const selectedFont = fonts.find(f => f.name === e.target.value);
                      if (selectedFont) {
                        const newPage = {...pages[pageIndex]};
                        newPage.blocks[blockIndex].font = selectedFont.value;
                        updatePageContent(pageIndex, newPage);
                      }
                    }}
                    className="flex-grow px-2 py-1 border rounded"
                  >
                    {fonts.map(font => (
                      <option 
                        key={font.name} 
                        value={font.name} 
                        style={{ fontFamily: font.value }}
                      >
                        {font.name}
                      </option>
                    ))}
                  </select>
                </div>
                <ReactQuill
                  ref={(el) => {
                    if (el) {
                      quillRefs.current[`${pageIndex}-${blockIndex}`] = el.getEditor();
                    }
                  }}
                  value={block.content}
                  onChange={(content) => {
                    const newPage = {...pages[pageIndex]};
                    newPage.blocks[blockIndex].content = content;
                    updatePageContent(pageIndex, newPage);
                  }}
                  modules={modules}
                  formats={formats}
                  style={{
                    fontFamily: block.font || fonts[0].value,
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    padding: '0.5rem',
                    marginBottom: '0.5rem'
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
          <div key={blockIndex} style={{ marginBottom: "1rem", position: "relative" }}>
            {editingImage && editingImage.pageIndex === pageIndex && editingImage.blockIndex === blockIndex ? (
              <div style={{
                position: isImageEditorFullScreen ? 'fixed' : 'relative',
                top: isImageEditorFullScreen ? 0 : 'auto',
                left: isImageEditorFullScreen ? 0 : 'auto',
                width: isImageEditorFullScreen ? '100vw' : '100%',
                height: isImageEditorFullScreen ? '100vh' : 'auto',
                zIndex: isImageEditorFullScreen ? 1000 : 'auto',
                backgroundColor: 'white',
                padding: '1rem',
              }}>
                <button 
                  onClick={toggleImageEditorFullScreen}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    zIndex: 1001,
                    backgroundColor: '#4B5563',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    padding: '0.5rem',
                    cursor: 'pointer',
                  }}
                >
                  {isImageEditorFullScreen ? <Minimize size={24} /> : <Maximize size={24} />}
                </button>
                <ImageEditor
                  imageUrl={block.content && block.content.b64_json ? `data:image/png;base64,${block.content.b64_json}` : ''}
                  onSave={(editedImageUrl) => handleImageSave(pageIndex, blockIndex, editedImageUrl)}
                  onCancel={handleImageEditCancel}
                />
              </div>
            ) : (
              <>
                <div style={{ width: block.width || 300, height: block.height || 225, position: 'relative' }}>
                  {block.content && block.content.b64_json ? (
                    <Image
                      src={`data:image/png;base64,${block.content.b64_json}`}
                      alt=""
                      layout="fill"
                      objectFit="contain"
                      style={{ borderRadius: "0.25rem", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" }}
                    />
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      height: '100%', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      backgroundColor: '#f3f4f6',
                      color: '#9CA3AF',
                      fontStyle: 'italic'
                    }}>
                      No image available
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => handleImageEdit(pageIndex, blockIndex)}
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Edit size={16} style={{ marginRight: '0.25rem' }} /> Edit Image
                </button>
              </>
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
        <h2 style={{ margin: 0 }}>Editable Book Preview ({language})</h2>
        <button 
          onClick={toggleFullScreen}
          style={{
            backgroundColor: '#4B5563',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            padding: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            zIndex: 11,
          }}
        >
          {isFullScreen ? <Minimize size={24} /> : <Maximize size={24} />}
        </button>
      </div>
      <div style={{ padding: "1rem", height: isFullScreen ? "calc(100% - 60px)" : "auto", overflowY: "auto" }}>
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
