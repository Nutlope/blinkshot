import React, { useState, useRef, useEffect } from 'react';
import { Plus, Book, Newspaper, Film, Presentation } from "lucide-react";

type FABProps = {
  onSelectFormat: (format: string) => void;
};

const FAB: React.FC<FABProps> = ({ onSelectFormat }) => {
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const formatMenuRef = useRef<HTMLDivElement>(null);

  const toggleFormatMenu = () => {
    setShowFormatMenu(!showFormatMenu);
  };

  const selectFormat = (format: string) => {
    onSelectFormat(format);
    setShowFormatMenu(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formatMenuRef.current && !formatMenuRef.current.contains(event.target as Node)) {
        setShowFormatMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left' as const,
    color: '#4B5563',
  };

  return (
    <div style={{ position: "fixed", bottom: "2rem", right: "2rem", zIndex: 1000 }}>
      <button 
        onClick={toggleFormatMenu}
        style={{
          width: "3.5rem",
          height: "3.5rem",
          borderRadius: "50%",
          backgroundColor: "#4B5563",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          transition: "all 0.3s ease",
        }}
      >
        <Plus size={24} />
      </button>
      {showFormatMenu && (
        <div 
          ref={formatMenuRef}
          style={{
            position: "absolute",
            bottom: "4rem",
            right: 0,
            backgroundColor: "white",
            borderRadius: "0.5rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            padding: "0.5rem",
          }}
        >
          <button onClick={() => selectFormat('book')} style={formatButtonStyle}>
            <Book size={18} style={{ marginRight: '0.5rem' }} /> Book
          </button>
          <button onClick={() => selectFormat('magazine')} style={formatButtonStyle}>
            <Newspaper size={18} style={{ marginRight: '0.5rem' }} /> Magazine
          </button>
          <button onClick={() => selectFormat('comic')} style={formatButtonStyle}>
            <Film size={18} style={{ marginRight: '0.5rem' }} /> Comic
          </button>
          <button onClick={() => selectFormat('slideshow')} style={formatButtonStyle}>
            <Presentation size={18} style={{ marginRight: '0.5rem' }} /> Slideshow
          </button>
        </div>
      )}
    </div>
  );
};

export default FAB;
