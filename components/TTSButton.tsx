import React, { useState } from 'react';
import { Button } from "@/components/ui/button";

type TTSButtonProps = {
  text: string;
  language: string;
  availableLanguages?: string[];
};

const TTSButton: React.FC<TTSButtonProps> = ({ 
  text, 
  language, 
  availableLanguages = ['English'] // Default value
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(language);

  const handlePlay = async () => {
    setIsPlaying(true);

    try {
      // First, translate the text if necessary
      let textToSpeak = text;
      if (selectedLanguage !== language) {
        const translateResponse = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, targetLanguage: selectedLanguage }),
        });
        const translateData = await translateResponse.json();
        textToSpeak = translateData.translatedText;
      }

      // Then, generate speech
      const ttsResponse = await fetch('/api/textToSpeech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak, language: selectedLanguage }),
      });

      if (!ttsResponse.ok) throw new Error('Failed to generate speech');

      const audioBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => setIsPlaying(false);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  return (
    <div>
      {availableLanguages.length > 1 && (
        <select 
          value={selectedLanguage} 
          onChange={(e) => setSelectedLanguage(e.target.value)}
          style={{ marginRight: '10px' }}
        >
          {availableLanguages.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      )}
      <Button onClick={handlePlay} disabled={isPlaying}>
        {isPlaying ? 'Playing...' : 'Listen'}
      </Button>
    </div>
  );
};

export default TTSButton;
