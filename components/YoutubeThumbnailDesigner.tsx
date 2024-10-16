import React, { useState, useRef, useEffect } from 'react';
import { Edit, Type, Save, Eraser, X, Circle, Square, Image as ImageIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

type YoutubeThumbnailDesignerProps = {
  initialContent: { text: string; images: string[] } | null;
  onSave: (thumbnailUrl: string) => void;
  onCancel: () => void;
};

const YoutubeThumbnailDesigner: React.FC<YoutubeThumbnailDesignerProps> = ({ initialContent, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'draw' | 'text' | 'erase' | 'banner' | 'circle'>('draw');
  const [text, setText] = useState(initialContent?.text || '');
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(20);
  const [bannerColor, setBannerColor] = useState('#ff0000');
  const [bannerOrientation, setBannerOrientation] = useState<'vertical' | 'horizontal'>('horizontal');
  const [circlePosition, setCirclePosition] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [images, setImages] = useState<string[]>(initialContent?.images || []);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');

  useEffect(() => {
    initCanvas();
  }, []);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Always set to recommended YouTube thumbnail size
    canvas.width = 1280;
    canvas.height = 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    switch (mode) {
      case 'text':
        setTextPosition({ x, y });
        break;
      case 'circle':
        setCirclePosition({ x, y });
        drawCircle(x, y);
        break;
      case 'banner':
        drawBanner(x, y);
        break;
    }
  };

  const drawCircle = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.arc(x, y, 50, 0, 2 * Math.PI);
    ctx.fillStyle = bannerColor;
    ctx.fill();
  };

  const drawBanner = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.fillStyle = bannerColor;
    if (bannerOrientation === 'horizontal') {
      ctx.fillRect(0, y - 25, canvas.width, 50);
    } else {
      ctx.fillRect(x - 25, 0, 50, canvas.height);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode !== 'draw') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = drawColor;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.beginPath();
  };

  const addText = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = textColor;
    ctx.fillText(text, textPosition.x, textPosition.y);
  };

  const generateText = async () => {
    setIsGeneratingText(true);
    try {
      const response = await fetch("/api/generateText", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Generate a catchy YouTube thumbnail title" }),
      });
      if (!response.ok) throw new Error("Failed to generate text");
      const data = await response.json();
      setText(data.text);
    } catch (error) {
      console.error("Error generating text:", error);
    } finally {
      setIsGeneratingText(false);
    }
  };

  const generateImage = async () => {
    setIsGeneratingImage(true);
    try {
      const response = await fetch("/api/generateImages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: imagePrompt, 
          iterativeMode: false,
          width: 1280,  // Specify the width
          height: 720  // Specify the height
        }),
      });
      if (!response.ok) throw new Error("Failed to generate image");
      const data = await response.json();
      
      if (data.b64_json) {
        const imageUrl = `data:image/png;base64,${data.b64_json}`;
        setGeneratedImage(imageUrl);
        addImageToCanvas(imageUrl);
      } else {
        console.error("Unexpected response format:", data);
        throw new Error("Unexpected response format from image generation API");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      // You might want to set an error state here and display it to the user
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const addImageToCanvas = (imageUrl: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const img = new Image();
    img.onload = () => {
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the image to fit the canvas
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width / 2) - (img.width / 2) * scale;
      const y = (canvas.height / 2) - (img.height / 2) * scale;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    };
    img.src = imageUrl;
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  const downloadThumbnail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert the canvas to a data URL
    const dataUrl = canvas.toDataURL('image/png');

    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'youtube-thumbnail.png';

    // Programmatically click the anchor to trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow-md">
      <div className="mb-4 space-x-2 flex justify-between">
        <div>
          <Button onClick={() => setMode('draw')} variant={mode === 'draw' ? 'default' : 'outline'}>
            <Edit size={16} /> Draw
          </Button>
          <Button onClick={() => setMode('text')} variant={mode === 'text' ? 'default' : 'outline'}>
            <Type size={16} /> Text
          </Button>
          <Button onClick={() => setMode('erase')} variant={mode === 'erase' ? 'default' : 'outline'}>
            <Eraser size={16} /> Erase
          </Button>
          <Button onClick={() => setMode('banner')} variant={mode === 'banner' ? 'default' : 'outline'}>
            <Square size={16} /> Banner
          </Button>
          <Button onClick={() => setMode('circle')} variant={mode === 'circle' ? 'default' : 'outline'}>
            <Circle size={16} /> Circle
          </Button>
        </div>
        <div>
          <Button onClick={onCancel} variant="destructive">
            <X size={16} /> Cancel
          </Button>
          <Button onClick={handleSave} variant="default">
            <Save size={16} /> Save
          </Button>
        </div>
        <Button onClick={generateText} disabled={isGeneratingText}>
          {isGeneratingText ? 'Generating...' : 'Generate Text'}
        </Button>
        <Button onClick={downloadThumbnail}>
          <Download className="w-5 h-5 mr-2" />
          Download Thumbnail
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="border border-gray-300 rounded-lg max-w-full h-auto mb-4"
      />
      <div className="space-y-4">
        {mode === 'text' && (
          <>
            <div className="flex items-center space-x-2">
              <label className="w-20 text-sm font-medium text-black">Text:</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-grow px-2 py-1 border rounded"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="w-20 text-sm font-medium text-black">Color:</label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-20"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="w-20 text-sm font-medium text-black">Font Size:</label>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                min={10}
                max={100}
                className="w-20 px-2 py-1 border rounded"
              />
            </div>
            <Button onClick={addText}>Add Text</Button>
          </>
        )}
        {(mode === 'draw' || mode === 'erase') && (
          <div className="flex items-center space-x-2">
            <label className="w-20 text-sm font-medium text-black">Brush Size:</label>
            <input
              type="range"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              min={1}
              max={50}
              className="w-full"
            />
            <span>{brushSize}px</span>
          </div>
        )}
        {mode === 'draw' && (
          <div className="flex items-center space-x-2">
            <label className="w-20 text-sm font-medium text-black">Draw Color:</label>
            <input
              type="color"
              value={drawColor}
              onChange={(e) => setDrawColor(e.target.value)}
              className="w-20"
            />
          </div>
        )}
        {(mode === 'banner' || mode === 'circle') && (
          <>
            <div className="flex items-center space-x-2">
              <label className="w-20 text-sm font-medium text-black">Color:</label>
              <input
                type="color"
                value={bannerColor}
                onChange={(e) => setBannerColor(e.target.value)}
                className="w-20"
              />
            </div>
            {mode === 'banner' && (
              <div className="flex items-center space-x-2">
                <label className="w-20 text-sm font-medium text-black">Orientation:</label>
                <select
                  value={bannerOrientation}
                  onChange={(e) => setBannerOrientation(e.target.value as 'vertical' | 'horizontal')}
                  className="flex-grow px-2 py-1 border rounded"
                >
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                </select>
              </div>
            )}
          </>
        )}
        <div className="flex items-center space-x-2">
          <label className="w-20 text-sm font-medium text-black">Image Prompt:</label>
          <input
            type="text"
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            className="flex-grow px-2 py-1 border rounded"
          />
          <Button onClick={generateImage} disabled={isGeneratingImage}>
            {isGeneratingImage ? 'Generating...' : 'Generate Image'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default YoutubeThumbnailDesigner;
