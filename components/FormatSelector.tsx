import React from 'react';

type FormatSelectorProps = {
  activePreview: string;
  setActivePreview: (format: string) => void;
};

const FormatSelector: React.FC<FormatSelectorProps> = ({ activePreview, setActivePreview }) => {
  return (
    <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
      <label htmlFor='previewFormat' style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>
        Select Preview Format:
      </label>
      <select
        id='previewFormat'
        value={activePreview}
        onChange={(e) => setActivePreview(e.target.value)}
        style={{
          padding: '0.5rem',
          borderRadius: '0.25rem',
          border: '1px solid #d1d5db',
        }}
      >
        <option value='book'>Book</option>
        <option value='editablebook'>Editable Book</option>
        <option value='magazine'>Magazine</option>
        <option value='comic'>Comic</option>
        <option value='slideshow'>Slideshow</option>
        {/* Add more options as needed */}
      </select>
    </div>
  );
};

export default FormatSelector;
