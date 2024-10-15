import React, { useRef, useEffect, useState } from 'react';
import { Edit, Type, Save, Eraser, X } from 'lucide-react';
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
  Source_Sans_3,  // Changed from Source_Sans_Pro to Source_Sans_3
  Merriweather,
  PT_Sans,
  Noto_Sans,
  Noto_Serif,
} from 'next/font/google';

const roboto = Roboto({ subsets: ['latin'], weight: ['400', '700'] });
const playfair = Playfair_Display({ subsets: ['latin'] });
const dancingScript = Dancing_Script({ subsets: ['latin'] });
const oswald = Oswald({ subsets: ['latin'] });
const bebasNeue = Bebas_Neue({ subsets: ['latin'], weight: '400' });
const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '700'] });
const openSans = Open_Sans({ subsets: ['latin'] });
const lato = Lato({ subsets: ['latin'], weight: ['400', '700'] });
const nunito = Nunito({ subsets: ['latin'] });
const sourceSans3 = Source_Sans_3({ subsets: ['latin'], weight: ['400', '700'] });  // Updated variable name and font
const merriweather = Merriweather({ subsets: ['latin'], weight: ['400', '700'] });
const ptSans = PT_Sans({ subsets: ['latin'], weight: ['400', '700'] });
const notoSans = Noto_Sans({ subsets: ['latin'], weight: ['400', '700'] });
const notoSerif = Noto_Serif({ subsets: ['latin'], weight: ['400', '700'] });

type ImageEditorProps = {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onCancel: () => void;
};

const fonts = [
  { name: 'Default (Arial)', font: 'Arial, sans-serif' },
  { name: 'Roboto', font: roboto },
  { name: 'Open Sans', font: openSans },
  { name: 'Lato', font: lato },
  { name: 'Nunito', font: nunito },
  { name: 'Source Sans 3', font: sourceSans3 },
  { name: 'Montserrat', font: montserrat },
  { name: 'PT Sans', font: ptSans },
  { name: 'Playfair Display', font: playfair },
  { name: 'Merriweather', font: merriweather },
  { name: 'Dancing Script', font: dancingScript },
  { name: 'Oswald', font: oswald },
  { name: 'Bebas Neue', font: bebasNeue },
  { name: 'Noto Sans (Arial-like)', font: notoSans },
  { name: 'Noto Serif (Times New Roman-like)', font: notoSerif },
  { name: 'Carlito (Calibri-like)', font: 'Carlito, sans-serif' },
  { name: 'Liberation Sans (Arial-like)', font: 'Liberation Sans, sans-serif' },
  { name: 'Liberation Serif (Times New Roman-like)', font: 'Liberation Serif, serif' },
  { name: 'BLINKBOLD', font: 'custom' },
];

const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(20);
  const [selectedFont, setSelectedFont] = useState(fonts[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#000000');
  const [mode, setMode] = useState<'draw' | 'text' | 'erase'>('draw');
  const [brushSize, setBrushSize] = useState(5);
  const [isUppercase, setIsUppercase] = useState(false);

  useEffect(() => {
    loadImage();
  }, [imageUrl]);

  useEffect(() => {
    drawCanvas();
  }, [text, textPosition, textColor, fontSize, selectedFont, mode]);

  const loadImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas and redraw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    img.src = imageUrl;
    ctx.drawImage(img, 0, 0);

    // Draw text with outline for better visibility
    if (mode === 'text' && text) {
      if (selectedFont.name === 'BLINKBOLD') {
        drawBlinkBoldText(ctx, isUppercase ? text.toUpperCase() : text, textPosition.x, textPosition.y, fontSize, textColor);
      } else {
        const fontFamily = typeof selectedFont.font === 'string' 
          ? selectedFont.font.split(',')[0].trim() 
          : selectedFont.font.style.fontFamily;
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const lines = text.split('\n');
        const lineHeight = fontSize * 1.2;

        lines.forEach((line, index) => {
          const y = textPosition.y + index * lineHeight;
          const displayText = isUppercase ? line.toUpperCase() : line;

          // Draw text outline
          ctx.strokeStyle = 'black';
          ctx.lineWidth = fontSize / 10;
          ctx.strokeText(displayText, textPosition.x, y);

          // Draw text fill
          ctx.fillStyle = textColor;
          ctx.fillText(displayText, textPosition.x, y);
        });
      }
    }
  };

  const drawBlinkBoldText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fontSize: number, color: string) => {
    const lineHeight = fontSize * 1.2;
    const lines = text.split('\n');

    ctx.fillStyle = color;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = fontSize / 15;

    lines.forEach((line, lineIndex) => {
      const chars = line.toUpperCase().split('');
      let currentX = x;

      chars.forEach((char) => {
        const charWidth = fontSize * 0.8;
        const charHeight = fontSize;

        // Draw the character
        ctx.beginPath();
        
        switch (char) {
          case 'A':
            ctx.moveTo(currentX, y + charHeight + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth / 2, y + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + charHeight + lineIndex * lineHeight);
            ctx.moveTo(currentX + charWidth * 0.25, y + charHeight * 0.6 + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth * 0.75, y + charHeight * 0.6 + lineIndex * lineHeight);
            break;
          case 'B':
            ctx.moveTo(currentX, y + lineIndex * lineHeight);
            ctx.lineTo(currentX, y + charHeight + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth * 0.8, y + charHeight * 0.5 + lineIndex * lineHeight);
            ctx.lineTo(currentX, y + charHeight * 0.5 + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + charHeight * 0.5 + lineIndex * lineHeight);
            break;
          case 'C':
            ctx.arc(currentX + charWidth / 2, y + charHeight / 2 + lineIndex * lineHeight, charWidth / 2, 0.2 * Math.PI, 1.8 * Math.PI);
            break;
          case 'D':
            ctx.moveTo(currentX, y + lineIndex * lineHeight);
            ctx.lineTo(currentX, y + charHeight + lineIndex * lineHeight);
            ctx.bezierCurveTo(currentX + charWidth, y + charHeight + lineIndex * lineHeight, currentX + charWidth, y + lineIndex * lineHeight, currentX, y + lineIndex * lineHeight);
            break;
          case 'E':
            ctx.moveTo(currentX + charWidth, y + lineIndex * lineHeight);
            ctx.lineTo(currentX, y + lineIndex * lineHeight);
            ctx.lineTo(currentX, y + charHeight + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + charHeight + lineIndex * lineHeight);
            ctx.moveTo(currentX, y + charHeight / 2 + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth * 0.8, y + charHeight / 2 + lineIndex * lineHeight);
            break;
          case 'F':
            ctx.moveTo(currentX, y + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + lineIndex * lineHeight);
            ctx.moveTo(currentX, y + lineIndex * lineHeight);
            ctx.lineTo(currentX, y + charHeight + lineIndex * lineHeight);
            ctx.moveTo(currentX, y + charHeight * 0.5 + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth * 0.8, y + charHeight * 0.5 + lineIndex * lineHeight);
            break;
          case 'G':
            ctx.arc(currentX + charWidth / 2, y + charHeight / 2 + lineIndex * lineHeight, charWidth / 2, 0.2 * Math.PI, 1.8 * Math.PI);
            ctx.moveTo(currentX + charWidth, y + charHeight * 0.6 + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth * 0.6, y + charHeight * 0.6 + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth * 0.6, y + charHeight * 0.8 + lineIndex * lineHeight);
            break;
          case 'H':
            ctx.moveTo(currentX, y + lineIndex * lineHeight);
            ctx.lineTo(currentX, y + charHeight + lineIndex * lineHeight);
            ctx.moveTo(currentX + charWidth, y + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + charHeight + lineIndex * lineHeight);
            ctx.moveTo(currentX, y + charHeight * 0.5 + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + charHeight * 0.5 + lineIndex * lineHeight);
            break;
          case 'I':
            ctx.moveTo(currentX + charWidth * 0.5, y + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth * 0.5, y + charHeight + lineIndex * lineHeight);
            break;
          case 'J':
            ctx.moveTo(currentX + charWidth * 0.8, y + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth * 0.8, y + charHeight * 0.8 + lineIndex * lineHeight);
            ctx.quadraticCurveTo(currentX + charWidth * 0.8, y + charHeight + lineIndex * lineHeight, currentX + charWidth * 0.4, y + charHeight + lineIndex * lineHeight);
            ctx.quadraticCurveTo(currentX, y + charHeight + lineIndex * lineHeight, currentX, y + charHeight * 0.8 + lineIndex * lineHeight);
            break;
          case 'K':
            ctx.moveTo(currentX, y + lineIndex * lineHeight);
            ctx.lineTo(currentX, y + charHeight + lineIndex * lineHeight);
            ctx.moveTo(currentX, y + charHeight * 0.5 + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + lineIndex * lineHeight);
            ctx.moveTo(currentX, y + charHeight * 0.5 + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + charHeight + lineIndex * lineHeight);
            break;
          case 'L':
            ctx.moveTo(currentX, y + lineIndex * lineHeight);
            ctx.lineTo(currentX, y + charHeight + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + charHeight + lineIndex * lineHeight);
            break;
          case 'M':
            ctx.moveTo(currentX, y + charHeight + lineIndex * lineHeight);
            ctx.lineTo(currentX, y + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth * 0.5, y + charHeight * 0.5 + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + charHeight + lineIndex * lineHeight);
            break;
          case 'N':
            ctx.moveTo(currentX, y + charHeight + lineIndex * lineHeight);
            ctx.lineTo(currentX, y + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + charHeight + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + lineIndex * lineHeight);
            break;
          case 'O':
            ctx.ellipse(currentX + charWidth * 0.5, y + charHeight * 0.5 + lineIndex * lineHeight, charWidth * 0.5, charHeight * 0.5, 0, 0, 2 * Math.PI);
            break;
          case 'P':
            ctx.moveTo(currentX, y + lineIndex * lineHeight);
            ctx.lineTo(currentX, y + charHeight + lineIndex * lineHeight);
            ctx.moveTo(currentX, y + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth * 0.8, y + lineIndex * lineHeight);
            ctx.quadraticCurveTo(currentX + charWidth, y + lineIndex * lineHeight, currentX + charWidth, y + charHeight * 0.3 + lineIndex * lineHeight);
            ctx.quadraticCurveTo(currentX + charWidth, y + charHeight * 0.6 + lineIndex * lineHeight, currentX, y + charHeight * 0.6 + lineIndex * lineHeight);
            break;
          case 'Q':
            ctx.ellipse(currentX + charWidth * 0.5, y + charHeight * 0.45 + lineIndex * lineHeight, charWidth * 0.5, charHeight * 0.45, 0, 0, 2 * Math.PI);
            ctx.moveTo(currentX + charWidth * 0.6, y + charHeight * 0.6 + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + charHeight + lineIndex * lineHeight);
            break;
          case 'R':
            ctx.moveTo(currentX, y + lineIndex * lineHeight);
            ctx.lineTo(currentX, y + charHeight + lineIndex * lineHeight);
            ctx.moveTo(currentX, y + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth * 0.8, y + lineIndex * lineHeight);
            ctx.quadraticCurveTo(currentX + charWidth, y + lineIndex * lineHeight, currentX + charWidth, y + charHeight * 0.3 + lineIndex * lineHeight);
            ctx.quadraticCurveTo(currentX + charWidth, y + charHeight * 0.6 + lineIndex * lineHeight, currentX, y + charHeight * 0.6 + lineIndex * lineHeight);
            ctx.moveTo(currentX + charWidth * 0.4, y + charHeight * 0.6 + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + charHeight + lineIndex * lineHeight);
            break;
          case 'S':
            ctx.moveTo(currentX + charWidth, y + charHeight * 0.2 + lineIndex * lineHeight);
            ctx.quadraticCurveTo(currentX + charWidth, y + lineIndex * lineHeight, currentX + charWidth * 0.5, y + lineIndex * lineHeight);
            ctx.quadraticCurveTo(currentX, y + lineIndex * lineHeight, currentX, y + charHeight * 0.3 + lineIndex * lineHeight);
            ctx.quadraticCurveTo(currentX, y + charHeight * 0.5 + lineIndex * lineHeight, currentX + charWidth, y + charHeight * 0.7 + lineIndex * lineHeight);
            ctx.quadraticCurveTo(currentX + charWidth, y + charHeight + lineIndex * lineHeight, currentX + charWidth * 0.5, y + charHeight + lineIndex * lineHeight);
            ctx.quadraticCurveTo(currentX, y + charHeight + lineIndex * lineHeight, currentX, y + charHeight * 0.8 + lineIndex * lineHeight);
            break;
          case 'T':
            ctx.moveTo(currentX, y + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + lineIndex * lineHeight);
            ctx.moveTo(currentX + charWidth * 0.5, y + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth * 0.5, y + charHeight + lineIndex * lineHeight);
            break;
          case 'U':
            ctx.moveTo(currentX, y + lineIndex * lineHeight);
            ctx.lineTo(currentX, y + charHeight * 0.7 + lineIndex * lineHeight);
            ctx.quadraticCurveTo(currentX, y + charHeight + lineIndex * lineHeight, currentX + charWidth * 0.5, y + charHeight + lineIndex * lineHeight);
            ctx.quadraticCurveTo(currentX + charWidth, y + charHeight + lineIndex * lineHeight, currentX + charWidth, y + charHeight * 0.7 + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + lineIndex * lineHeight);
            break;
          case 'V':
            ctx.moveTo(currentX, y + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth * 0.5, y + charHeight + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + lineIndex * lineHeight);
            break;
          case 'W':
            ctx.moveTo(currentX, y + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth * 0.25, y + charHeight + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth * 0.5, y + charHeight * 0.5 + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth * 0.75, y + charHeight + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + lineIndex * lineHeight);
            break;
          case 'X':
            ctx.moveTo(currentX, y + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + charHeight + lineIndex * lineHeight);
            ctx.moveTo(currentX + charWidth, y + lineIndex * lineHeight);
            ctx.lineTo(currentX, y + charHeight + lineIndex * lineHeight);
            break;
          case 'Y':
            ctx.moveTo(currentX, y + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth * 0.5, y + charHeight * 0.5 + lineIndex * lineHeight);
            ctx.moveTo(currentX + charWidth, y + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth * 0.5, y + charHeight * 0.5 + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth * 0.5, y + charHeight + lineIndex * lineHeight);
            break;
          case 'Z':
            ctx.moveTo(currentX, y + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + lineIndex * lineHeight);
            ctx.lineTo(currentX, y + charHeight + lineIndex * lineHeight);
            ctx.lineTo(currentX + charWidth, y + charHeight + lineIndex * lineHeight);
            break;
          default:
            // For any character not specifically defined, draw a simple rectangle
            ctx.rect(currentX, y + lineIndex * lineHeight, charWidth, charHeight);
        }

        ctx.stroke();
        ctx.fill();

        // Add some "glitch" effect
        if (Math.random() > 0.7) {
          const glitchHeight = Math.random() * fontSize / 2;
          ctx.beginPath();
          ctx.moveTo(currentX, y + lineIndex * lineHeight + glitchHeight);
          ctx.lineTo(currentX + charWidth, y + lineIndex * lineHeight + glitchHeight);
          ctx.strokeStyle = 'white';
          ctx.stroke();
          ctx.strokeStyle = 'black';
        }

        currentX += charWidth + fontSize * 0.1; // Add some spacing between characters
      });
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === 'text') {
      setTextPosition({ x, y });
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode === 'text') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (mode === 'draw') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = drawColor;
    } else if (mode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow-md">
      <div className="mb-4 space-x-2 flex justify-between">
        <div>
          <button onClick={() => setMode('draw')} className={`px-2 py-1 rounded ${mode === 'draw' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            <Edit size={16} /> Draw
          </button>
          <button onClick={() => setMode('text')} className={`px-2 py-1 rounded ${mode === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            <Type size={16} /> Text
          </button>
          <button onClick={() => setMode('erase')} className={`px-2 py-1 rounded ${mode === 'erase' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            <Eraser size={16} /> Erase
          </button>
        </div>
        <div>
          <button onClick={onCancel} className="px-2 py-1 rounded bg-red-500 text-white mr-2">
            <X size={16} /> Cancel
          </button>
          <button onClick={handleSave} className="px-2 py-1 rounded bg-green-500 text-white">
            <Save size={16} /> Save
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="border border-gray-300 rounded-lg max-w-full h-auto mb-4"
        style={{ cursor: mode === 'erase' ? 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABaSURBVDhPY2AYdIARiP///w/nUwsw4JKgGJ+ampoaxEcXICbABmGGkaIZxMYmjs8Qkl2IzxCyXUiMIRS5kBhDKHYhNoOIdiExLiPoccg4cOAgK8hGzaCigQwMAFD5oN4tTqnEAAAAAElFTkSuQmCC) 16 16, auto' : 'auto' }}
      />
      <div className="space-y-4">
        {mode === 'text' && (
          <>
            <div className="flex items-center space-x-2">
              <label className="w-20 text-sm font-medium text-black">Text:</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-grow px-2 py-1 border rounded"
                rows={3}
                placeholder="Enter text (press Enter for new line)"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="w-20 text-sm font-medium text-black">Font:</label>
              <select
                value={selectedFont.name}
                onChange={(e) => setSelectedFont(fonts.find(f => f.name === e.target.value) || fonts[0])}
                className="flex-grow px-2 py-1 border rounded"
              >
                {fonts.map(font => (
                  <option 
                    key={font.name} 
                    value={font.name} 
                    style={{ 
                      fontFamily: font.name === 'BLINKBOLD' 
                        ? 'monospace' 
                        : typeof font.font === 'string' 
                          ? font.font.split(',')[0].trim()
                          : font.font.style.fontFamily 
                    }}
                  >
                    {font.name}
                  </option>
                ))}
              </select>
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
            <div className="flex items-center space-x-2">
              <label className="w-20 text-sm font-medium text-black">Uppercase:</label>
              <input
                type="checkbox"
                checked={isUppercase}
                onChange={(e) => setIsUppercase(e.target.checked)}
              />
            </div>
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
      </div>
    </div>
  );
};

export default ImageEditor;