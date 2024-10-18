import React from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

interface PreviewSelectorProps {
  activePreview: string;
  setActivePreview: (preview: string) => void;
  activeLanguage: string;
  setActiveLanguage: (language: string) => void;
  availableLanguages: string[];
}

const PreviewSelector: React.FC<PreviewSelectorProps> = ({
  activePreview,
  setActivePreview,
  activeLanguage,
  setActiveLanguage,
  availableLanguages,
}) => {
  const previewOptions = [
    { value: 'book', label: 'Book' },
    { value: 'magazine', label: 'Magazine' },
    { value: 'comic', label: 'Comic' },
    { value: 'editablebook', label: 'Editable Book' },
    { value: 'slideshow', label: 'Slideshow' },
  ];

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 bg-white p-4 rounded-lg shadow-md">
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-0">
        {previewOptions.map((option) => (
          <Button
            key={option.value}
            onClick={() => setActivePreview(option.value)}
            variant={activePreview === option.value ? 'default' : 'outline'}
            className="transition-all duration-200 ease-in-out"
          >
            {option.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center">
        <label htmlFor="language-select" className="mr-2 text-gray-700">
          Preview Language:
        </label>
        <select
          id="language-select"
          value={activeLanguage}
          onChange={(e) => setActiveLanguage(e.target.value)}
          className="form-select mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {availableLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default PreviewSelector;
