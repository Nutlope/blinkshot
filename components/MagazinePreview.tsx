import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

type Block = {
  id: string;
  type: string;
  content: any;
  size: 'small' | 'medium' | 'large';
  textWrap: boolean;
};

type PageContent = {
  blocks: Block[];
};

type MagazinePreviewProps = {
  pages: PageContent[];
  language: string;
};

type DraggableItemProps = {
  id: string;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  children: React.ReactNode;
};

const DraggableItem: React.FC<DraggableItemProps> = ({ id, index, moveItem, children }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: 'BLOCK',
    hover(item: { id: string; index: number }, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'BLOCK',
    item: () => ({ id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1, cursor: 'move' }}>
      {children}
    </div>
  );
};

const MagazinePreview: React.FC<MagazinePreviewProps> = ({ pages, language }) => {
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [fontColor, setFontColor] = useState('#000000');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [columnCount, setColumnCount] = useState(2);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [pagesState, setPagesState] = useState(pages);

  useEffect(() => {
    setPagesState(pages.map(page => ({
      ...page,
      blocks: page.blocks.map(block => ({
        ...block,
        size: block.size || 'medium',
        textWrap: block.textWrap || false
      }))
    })));
  }, [pages]);

  const handleTTS = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        utteranceRef.current = new SpeechSynthesisUtterance(text);
        utteranceRef.current.lang = language;
        utteranceRef.current.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utteranceRef.current);
        setIsSpeaking(true);
      }
    } else {
      console.error('Text-to-speech not supported in this browser.');
    }
  };

  const moveItem = useCallback((pageIndex: number, dragIndex: number, hoverIndex: number) => {
    setPagesState((prevPages) => {
      const newPages = [...prevPages];
      const page = [...newPages[pageIndex].blocks];
      const [reorderedItem] = page.splice(dragIndex, 1);
      page.splice(hoverIndex, 0, reorderedItem);
      newPages[pageIndex] = { ...newPages[pageIndex], blocks: page };
      return newPages;
    });
  }, []);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const updateBlockSize = (pageIndex: number, blockIndex: number, size: 'small' | 'medium' | 'large') => {
    setPagesState(prevPages => {
      const newPages = [...prevPages];
      newPages[pageIndex].blocks[blockIndex].size = size;
      return newPages;
    });
  };

  const toggleTextWrap = (pageIndex: number, blockIndex: number) => {
    setPagesState(prevPages => {
      const newPages = [...prevPages];
      newPages[pageIndex].blocks[blockIndex].textWrap = !newPages[pageIndex].blocks[blockIndex].textWrap;
      return newPages;
    });
  };

  const PreviewContent = () => (
    <div style={{ 
      maxWidth: isFullScreen ? "none" : "800px", 
      margin: "0 auto", 
      backgroundColor: backgroundColor, 
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", 
      borderRadius: "0.5rem", 
      overflow: "hidden",
      height: isFullScreen ? "100%" : "auto"
    }}>
      <div style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>
        <label>
          Background Color:
          <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} />
        </label>
        <label style={{ marginLeft: "1rem" }}>
          Font Color:
          <input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} />
        </label>
        <label style={{ marginLeft: "1rem" }}>
          Columns:
          <select 
            value={columnCount} 
            onChange={(e) => setColumnCount(Number(e.target.value))}
            style={{ marginLeft: "0.5rem" }}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </label>
        {!isFullScreen && (
          <button 
            onClick={toggleFullScreen}
            style={{
              marginLeft: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#4B5563",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer"
            }}
          >
            Full Screen
          </button>
        )}
      </div>
      {pagesState.map((page, pageIndex) => (
        <div key={pageIndex} style={{ padding: "2rem", borderBottom: pageIndex < pagesState.length - 1 ? "1px solid #e5e7eb" : "none" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: fontColor, textAlign: "center" }}>Page {pageIndex + 1}</h3>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: `repeat(${columnCount}, 1fr)`, 
            gap: "1rem" 
          }}>
            {page.blocks.map((block, blockIndex) => (
              <DraggableItem 
                key={block.id} 
                id={block.id} 
                index={blockIndex}
                moveItem={(dragIndex, hoverIndex) => moveItem(pageIndex, dragIndex, hoverIndex)}
              >
                <div style={{ 
                  gridColumn: block.size === 'large' ? `span ${columnCount}` : 'span 1',
                  marginBottom: "1rem",
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {block.type === "text" ? (
                    <div>
                      <div dangerouslySetInnerHTML={{ __html: block.content }} style={{ 
                        lineHeight: "1.6", 
                        color: fontColor,
                        fontSize: "0.9rem",
                      }} />
                      <button onClick={() => handleTTS(block.content)}>
                        {isSpeaking ? "Stop" : "Read Aloud"}
                      </button>
                    </div>
                  ) : block.type === "image" && block.content ? (
                    <div style={{ 
                      float: block.textWrap ? 'left' : 'none', 
                      marginRight: block.textWrap ? '1rem' : '0',
                      marginBottom: '1rem'
                    }}>
                      <Image
                        src={`data:image/png;base64,${block.content.b64_json}`}
                        alt=""
                        width={block.size === 'small' ? 150 : block.size === 'medium' ? 300 : 600}
                        height={block.size === 'small' ? 112 : block.size === 'medium' ? 225 : 450}
                        style={{ borderRadius: "0.25rem", maxWidth: "100%", height: "auto" }}
                      />
                    </div>
                  ) : null}
                  <div>
                    <select 
                      value={block.size} 
                      onChange={(e) => updateBlockSize(pageIndex, blockIndex, e.target.value as 'small' | 'medium' | 'large')}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Full Width</option>
                    </select>
                    {block.type === 'image' && (
                      <button onClick={() => toggleTextWrap(pageIndex, blockIndex)}>
                        {block.textWrap ? 'Disable Text Wrap' : 'Enable Text Wrap'}
                      </button>
                    )}
                  </div>
                </div>
              </DraggableItem>
            ))}
          </div>
        </div>
      ))}
    </div>
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
          <button 
            onClick={toggleFullScreen}
            style={{
              position: "fixed",
              top: "1rem",
              right: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#EF4444",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
              zIndex: 1001
            }}
          >
            Exit Full Screen
          </button>
          <PreviewContent />
        </div>
      ) : (
        <PreviewContent />
      )}
    </DndProvider>
  );
};

export default MagazinePreview;