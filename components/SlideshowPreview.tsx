import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Smartphone, Tablet, Monitor, X } from 'lucide-react';

type Block = {
  type: string;
  content: any;
};

type PageContent = {
  blocks: Block[];
};

type SlideshowPreviewProps = {
  pages: PageContent[];
};

type DeviceType = 'mobile' | 'tablet' | 'desktop';

const SlideshowPreview: React.FC<SlideshowPreviewProps> = ({ pages }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [isFullScreen, setIsFullScreen] = useState(false);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % pages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + pages.length) % pages.length);
  };

  const getDeviceDimensions = () => {
    switch (deviceType) {
      case 'mobile':
        return { width: 375, height: 667 };
      case 'tablet':
        return { width: 768, height: 1024 };
      case 'desktop':
      default:
        return { width: 1280, height: 720 };
    }
  };

  const { width, height } = getDeviceDimensions();

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const renderSlide = () => (
    <div style={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#4b5563", textAlign: "center" }}>
        Slide {currentSlide + 1} of {pages.length}
      </h3>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: 'calc(100% - 4rem)',
        width: '100%',
        overflow: 'hidden',
      }}>
        {pages[currentSlide].blocks.map((block, blockIndex) => (
          <div key={blockIndex} style={{ marginBottom: "1rem", maxWidth: '100%', maxHeight: '80%' }}>
            {block.type === "text" ? (
              <div 
                dangerouslySetInnerHTML={{ __html: block.content }}
                style={{ 
                  lineHeight: "1.6", 
                  color: "#374151",
                  fontSize: deviceType === 'mobile' ? "0.875rem" : "1rem",
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 10,
                  WebkitBoxOrient: 'vertical',
                }}
              />
            ) : block.type === "image" && block.content ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: '100%' }}>
                <Image
                  src={`data:image/png;base64,${block.content.b64_json}`}
                  alt=""
                  width={deviceType === 'mobile' ? 300 : 400}
                  height={deviceType === 'mobile' ? 225 : 300}
                  style={{ 
                    borderRadius: "0.25rem", 
                    maxWidth: '100%', 
                    maxHeight: '100%', 
                    width: 'auto', 
                    height: 'auto', 
                    objectFit: 'contain',
                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" 
                  }}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );

  const PreviewContent = () => (
    <div style={{ 
      width: isFullScreen ? '100%' : `${width}px`, 
      height: isFullScreen ? '100%' : `${height}px`, 
      margin: "0 auto", 
      backgroundColor: "#fff", 
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", 
      borderRadius: isFullScreen ? "0" : "0.5rem", 
      overflow: "hidden",
      position: "relative",
    }}>
      {renderSlide()}
      <button 
        onClick={prevSlide} 
        style={{
          position: "absolute",
          top: "50%",
          left: "1rem",
          transform: "translateY(-50%)",
          backgroundColor: "rgba(0,0,0,0.5)",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        <ChevronLeft size={24} />
      </button>
      <button 
        onClick={nextSlide}
        style={{
          position: "absolute",
          top: "50%",
          right: "1rem",
          transform: "translateY(-50%)",
          backgroundColor: "rgba(0,0,0,0.5)",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        <ChevronRight size={24} />
      </button>
      {isFullScreen && (
        <button 
          onClick={toggleFullScreen}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            backgroundColor: "rgba(0,0,0,0.5)",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <X size={24} />
        </button>
      )}
    </div>
  );

  return (
    <div style={{ 
      maxWidth: "100%", 
      margin: "0 auto", 
      backgroundColor: "#f3f4f6", 
      borderRadius: "0.5rem", 
      overflow: "hidden",
      padding: "2rem",
    }}>
      {!isFullScreen && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: '1rem',
          gap: '1rem'
        }}>
          <button onClick={() => setDeviceType('mobile')} style={{ background: deviceType === 'mobile' ? '#4B5563' : '#9CA3AF', color: 'white', border: 'none', borderRadius: '0.25rem', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Smartphone size={16} /> Mobile
          </button>
          <button onClick={() => setDeviceType('tablet')} style={{ background: deviceType === 'tablet' ? '#4B5563' : '#9CA3AF', color: 'white', border: 'none', borderRadius: '0.25rem', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tablet size={16} /> Tablet
          </button>
          <button onClick={() => setDeviceType('desktop')} style={{ background: deviceType === 'desktop' ? '#4B5563' : '#9CA3AF', color: 'white', border: 'none', borderRadius: '0.25rem', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Monitor size={16} /> Desktop
          </button>
          <button 
            onClick={toggleFullScreen}
            style={{
              background: '#4B5563',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              padding: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Full Screen
          </button>
        </div>
      )}
      {isFullScreen ? (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <PreviewContent />
        </div>
      ) : (
        <PreviewContent />
      )}
    </div>
  );
};

export default SlideshowPreview;
