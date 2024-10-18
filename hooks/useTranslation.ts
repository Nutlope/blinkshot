import { useState, useCallback, useRef } from 'react';
import { createHash } from 'crypto';
import { translateText } from '@/lib/translate';
import { PageContent, LanguageVersion } from '@/types';

export const useTranslation = (initialLanguageVersions: LanguageVersion[], defaultLanguage: string) => {
  const [languageVersions, setLanguageVersions] = useState(initialLanguageVersions);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const contentHashesRef = useRef<{ [key: string]: string }>({});

  const hashContent = (content: string): string => {
    return createHash('md5').update(content).digest('hex');
  };

  const updateContentHash = useCallback((language: string, pageIndex: number, blockIndex: number, content: string) => {
    const key = `${language}-${pageIndex}-${blockIndex}`;
    contentHashesRef.current[key] = hashContent(content);
  }, []);

  const translateContent = useCallback(async (sourceLanguage: string, pageIndex: number, content: PageContent, targetLanguages: string[]) => {
    console.log(`Translating content for page ${pageIndex} from ${sourceLanguage} to ${targetLanguages.join(', ')}`);
    let updatedVersions = [...languageVersions];

    for (const targetLang of targetLanguages) {
      if (targetLang !== sourceLanguage) {
        console.log(`Translating to ${targetLang}`);
        const updatedBlocks = await Promise.all(content.blocks.map(async (block, blockIndex) => {
          if (block.type === 'text') {
            const blockContent = block.content as string;
            const cacheKey = `${sourceLanguage}-${targetLang}-${pageIndex}-${blockIndex}`;
            const contentKey = `${sourceLanguage}-${pageIndex}-${blockIndex}`;
            const currentHash = contentHashesRef.current[contentKey];
            const blockHash = hashContent(blockContent);

            if (currentHash !== blockHash) {
              try {
                console.log(`Translating block ${blockIndex}: "${blockContent.substring(0, 50)}..."`);
                const translatedText = await translateText(blockContent, sourceLanguage, targetLang);
                console.log(`Translated: "${translatedText.substring(0, 50)}..."`);
                contentHashesRef.current[cacheKey] = blockHash;
                return { ...block, content: translatedText };
              } catch (error) {
                console.error('Translation error:', error);
                return block;
              }
            } else {
              console.log(`Block ${blockIndex} unchanged, using cached translation`);
              return block;
            }
          }
          return block;
        }));

        const targetVersionIndex = updatedVersions.findIndex(v => v.language === targetLang);
        if (targetVersionIndex !== -1) {
          updatedVersions[targetVersionIndex].pages[pageIndex] = { ...content, blocks: updatedBlocks };
        } else {
          updatedVersions.push({
            language: targetLang,
            pages: Array(pageIndex).fill(null).concat([{ ...content, blocks: updatedBlocks }]),
          });
        }
      }
    }

    return updatedVersions;
  }, [languageVersions]);

  const translateAllContent = useCallback(async (sourceLanguage: string, targetLanguages: string[]) => {
    console.log(`Starting translation of all content from ${sourceLanguage} to ${targetLanguages.join(', ')}`);
    setIsTranslating(true);
    setTranslationProgress(0);
    
    // Ensure the default language version exists
    let currentVersion = languageVersions.find(v => v.language === defaultLanguage);
    if (!currentVersion) {
      currentVersion = { language: defaultLanguage, pages: [] };
      setLanguageVersions(prev => [...prev, currentVersion!]);
    }
    
    const totalBlocks = currentVersion.pages.reduce((acc, page) => acc + page.blocks.length, 0) * targetLanguages.length;
    let translatedBlocks = 0;
    let updatedVersions = [...languageVersions];

    try {
      for (const targetLang of targetLanguages) {
        if (targetLang !== defaultLanguage) {
          for (let pageIndex = 0; pageIndex < currentVersion.pages.length; pageIndex++) {
            const translatedVersion = await translateContent(defaultLanguage, pageIndex, currentVersion.pages[pageIndex], [targetLang]);
            
            const targetVersionIndex = updatedVersions.findIndex(v => v.language === targetLang);
            if (targetVersionIndex !== -1) {
              updatedVersions[targetVersionIndex] = translatedVersion.find(v => v.language === targetLang) || updatedVersions[targetVersionIndex];
            } else {
              updatedVersions.push(translatedVersion.find(v => v.language === targetLang)!);
            }

            translatedBlocks += currentVersion.pages[pageIndex].blocks.length;
            const progress = (translatedBlocks / totalBlocks) * 100;
            setTranslationProgress(progress);
            console.log(`Translation progress: ${progress.toFixed(2)}%`);
          }
        }
      }

      console.log('Translation completed. Final versions:', updatedVersions);
      setLanguageVersions(updatedVersions);
    } catch (error) {
      console.error('Error during translation:', error);
    } finally {
      setIsTranslating(false);
    }
  }, [languageVersions, translateContent, defaultLanguage]);

  const addNewContent = useCallback((pageIndex: number, newContent: PageContent) => {
    setLanguageVersions(prevVersions => {
      const updatedVersions = [...prevVersions];
      const defaultVersionIndex = updatedVersions.findIndex(v => v.language === defaultLanguage);
      
      if (defaultVersionIndex !== -1) {
        // Add new content to the default language version
        updatedVersions[defaultVersionIndex].pages[pageIndex] = newContent;
      } else {
        // If default language version doesn't exist, create it
        updatedVersions.push({
          language: defaultLanguage,
          pages: [newContent],
        });
      }
      
      return updatedVersions;
    });
  }, [defaultLanguage]);

  return {
    languageVersions,
    setLanguageVersions,
    isTranslating,
    translationProgress,
    translateAllContent,
    updateContentHash,
    addNewContent,
  };
};
