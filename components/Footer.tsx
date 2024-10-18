import React from 'react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/spinner';
import { Download } from 'lucide-react';

type FooterProps = {
  downloadBook: (format: "docx" | "pdf" | "epub") => Promise<void>;
  isGeneratingDocx: boolean;
};

const Footer: React.FC<FooterProps> = ({ downloadBook, isGeneratingDocx }) => {
  return (
    <footer className="mt-16 py-8 bg-gray-100 text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-4">
            Download Your Story
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            
          </p>

          {/* <div className="flex space-x-4 mb-8">
            {['DOCX', 'PDF', 'EPUB'].map((format) => (
              <Button 
                key={format}
                onClick={() => downloadBook(format.toLowerCase() as "docx" | "pdf" | "epub")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition duration-300 hover:scale-105"
                disabled={isGeneratingDocx}
              >
                {isGeneratingDocx ? (
                  <>
                    <Spinner className="w-5 h-5 mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Download {format}
                  </>
                )}
              </Button>
            ))}
          </div>

          <p className="text-sm text-gray-600">
            © 2024 StoryForge. All rights reserved.
          </p> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
