import React, { useState } from 'react';
import { Plus, Book, Newspaper, Film, Presentation, Youtube, Share2 } from 'lucide-react';

type FABProps = {
  onSelectFormat: (format: string) => void;
};

const FAB: React.FC<FABProps> = ({ onSelectFormat }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleSelectFormat = (format: string) => {
    onSelectFormat(format);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-black rounded-lg shadow-lg p-2 flex flex-col space-y-2 border border-gray-700">
          <button onClick={() => handleSelectFormat('book')} className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-800 rounded text-green-400 transition-colors">
            <Book size={20} />
            <span>Book</span>
          </button>
          <button onClick={() => handleSelectFormat('magazine')} className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-800 rounded text-green-400 transition-colors">
            <Newspaper size={20} />
            <span>Magazine</span>
          </button>
          <button onClick={() => handleSelectFormat('comic')} className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-800 rounded text-green-400 transition-colors">
            <Film size={20} />
            <span>Comic</span>
          </button>
          <button onClick={() => handleSelectFormat('slideshow')} className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-800 rounded text-green-400 transition-colors">
            <Presentation size={20} />
            <span>Slideshow</span>
          </button>
          <button onClick={() => handleSelectFormat('youtube')} className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-800 rounded text-green-400 transition-colors">
            <Youtube size={20} />
            <span>YouTube Thumbnail</span>
          </button>
          <button onClick={() => handleSelectFormat('social')} className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-800 rounded text-green-400 transition-colors">
            <Share2 size={20} />
            <span>Social Media</span>
          </button>
        </div>
      )}
      <button
        onClick={toggleMenu}
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-colors"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default FAB;
