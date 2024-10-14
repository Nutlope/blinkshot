import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Panel = {
  type: 'image' | 'text';
  content: string;
  size: 'small' | 'medium' | 'large';
  speechBubble?: boolean;
};

type ComicPage = {
  panels: Panel[];
};

type ComicPreviewProps = {
  pages: ComicPage[];
};

const ComicPreview: React.FC<ComicPreviewProps> = ({ pages }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [fontColor, setFontColor] = useState('#000000');

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % pages.length);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + pages.length) % pages.length);
  };

  const renderPanel = (panel: Panel, index: number) => {
    const panelStyle: React.CSSProperties = {
      border: '2px solid black',
      padding: '10px',
      margin: '5px',
      gridColumn: panel.size === 'large' ? 'span 2' : 'span 1',
      gridRow: panel.size === 'large' ? 'span 2' : 'span 1',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: backgroundColor,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    };

    const contentStyle: React.CSSProperties = panel.speechBubble
      ? {
          background: 'white',
          border: '2px solid black',
          borderRadius: '20px',
          padding: '10px',
          maxWidth: '90%',
          fontFamily: 'Comic Sans MS, cursive',
          fontSize: '14px',
          position: 'relative',
          zIndex: 1,
          color: fontColor,
        }
      : {
          fontFamily: 'Comic Sans MS, cursive',
          fontSize: '14px',
          textAlign: 'center',
          padding: '10px',
          maxWidth: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '5px',
          color: fontColor,
        };

    return (
      <div key={index} style={panelStyle}>
        {panel.type === 'image' ? (
          <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '200px' }}>
            <Image
              src={panel.content}
              alt={`Panel ${index}`}
              layout="fill"
              objectFit="cover"
            />
          </div>
        ) : (
          <div style={contentStyle} dangerouslySetInnerHTML={{ __html: panel.content }} />
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#f0f0f0', padding: '20px', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>
          Background Color:
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            style={{ marginLeft: '5px' }}
          />
        </label>
        <label>
          Font Color:
          <input
            type="color"
            value={fontColor}
            onChange={(e) => setFontColor(e.target.value)}
            style={{ marginLeft: '5px' }}
          />
        </label>
      </div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '10px', 
        padding: '20px',
        backgroundColor: backgroundColor,
        border: '2px solid #000',
        borderRadius: '5px',
        boxShadow: '0 0 15px rgba(0,0,0,0.2)',
      }}>
        {pages[currentPage].panels.map(renderPanel)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', marginTop: '20px' }}>
        <button onClick={prevPage} style={buttonStyle}>
          <ChevronLeft /> Previous Page
        </button>
        <span style={{ fontFamily: 'Comic Sans MS, cursive', fontSize: '18px', alignSelf: 'center', color: fontColor }}>
          Page {currentPage + 1} of {pages.length}
        </span>
        <button onClick={nextPage} style={buttonStyle}>
          Next Page <ChevronRight />
        </button>
      </div>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 15px',
  backgroundColor: '#4a4a4a',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontFamily: 'Comic Sans MS, cursive',
  fontSize: '16px',
  transition: 'background-color 0.3s',
};

export default ComicPreview;
