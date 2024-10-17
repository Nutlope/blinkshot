import React from 'react';

type LanguageSelectorProps = {
  languages: string[];
  activeLanguage: string;
  setActiveLanguage: (language: string) => void;
  addLanguage: (language: string) => void;
  removeLanguage: (language: string) => void;
};

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  languages,
  activeLanguage,
  setActiveLanguage,
  addLanguage,
  removeLanguage,
}) => (
  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
    <select
      value={activeLanguage}
      onChange={(e) => setActiveLanguage(e.target.value)}
      style={{ marginRight: '1rem' }}
    >
      {languages.map((lang) => (
        <option key={lang} value={lang}>
          {lang}
        </option>
      ))}
    </select>
    <input
      type='text'
      placeholder='Add new language'
      onKeyPress={(e) => {
        if (e.key === 'Enter') {
          addLanguage(e.currentTarget.value);
          e.currentTarget.value = '';
        }
      }}
    />
    <button onClick={() => removeLanguage(activeLanguage)} disabled={languages.length === 1}>
      Remove Language
    </button>
  </div>
);

export default LanguageSelector;
