import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface LanguageSelectorProps {
  availableLanguages: string[];
  targetLanguages: string[];
  setTargetLanguages: (languages: string[]) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  availableLanguages,
  targetLanguages,
  setTargetLanguages,
}) => {
  const handleLanguageToggle = (language: string) => {
    if (targetLanguages.includes(language)) {
      setTargetLanguages(targetLanguages.filter(lang => lang !== language));
    } else {
      setTargetLanguages([...targetLanguages, language]);
    }
  };

  return (
    <div className="mb-4 p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2 text-gray-800">Target Languages</h3>
      <div className="flex flex-wrap gap-4">
        {availableLanguages.map((lang) => (
          <label key={lang} className="flex items-center space-x-2 cursor-pointer">
            <Checkbox
              checked={targetLanguages.includes(lang)}
              onCheckedChange={() => handleLanguageToggle(lang)}
            />
            <span className="text-gray-700">{lang}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
