import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageContent, LanguageVersion } from '@/types';

interface TranslationManagerProps {
  pages: PageContent[];
  sourceLanguage: string;
  targetLanguages: string[];
  onTranslationComplete: (translations: LanguageVersion[]) => void;
}

const TranslationManager: React.FC<TranslationManagerProps> = ({
  pages,
  sourceLanguage,
  targetLanguages,
  onTranslationComplete,
}) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);

  const translatePages = async () => {
    setIsTranslating(true);
    setProgress(0);

    const translations: LanguageVersion[] = await Promise.all(
      targetLanguages.map(async (targetLanguage) => {
        const translatedPages = await translatePagesForLanguage(pages, sourceLanguage, targetLanguage);
        return { language: targetLanguage, pages: translatedPages };
      })
    );

    setIsTranslating(false);
    onTranslationComplete(translations);
  };

  const translatePagesForLanguage = async (pages: PageContent[], sourceLanguage: string, targetLanguage: string) => {
    const translatedPages: PageContent[] = [];

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const translatedBlocks = await Promise.all(
        page.blocks.map(async (block) => {
          if (block.type === 'text') {
            const response = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: block.content, sourceLanguage, targetLanguage }),
            });
            const { translatedText } = await response.json();
            return { ...block, content: translatedText };
          }
          return block;
        })
      );

      translatedPages.push({ ...page, blocks: translatedBlocks });
      setProgress(((i + 1) / pages.length) * 100);
    }

    return translatedPages;
  };

  return (
    <div className="mt-4">
      <Button onClick={translatePages} disabled={isTranslating}>
        {isTranslating ? 'Translating...' : 'Translate to All Languages'}
      </Button>
      {isTranslating && (
        <div className="mt-2">
          <progress value={progress} max="100" className="w-full" />
          <p>{Math.round(progress)}% complete</p>
        </div>
      )}
    </div>
  );
};

export default TranslationManager;
