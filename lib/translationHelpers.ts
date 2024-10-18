import { PageContent, LanguageVersion } from '@/types';
import { translateText } from './translate';

export const translatePageContent = async (content: PageContent, fromLang: string, toLang: string): Promise<PageContent> => {
  const translatedBlocks = await Promise.all(content.blocks.map(async (block) => {
    if (block.type === 'text') {
      const translatedText = await translateText(block.content as string, fromLang, toLang);
      return { ...block, content: translatedText };
    }
    return block;
  }));

  return { ...content, blocks: translatedBlocks };
};

export const translateAllContent = async (
  sourceLanguage: string,
  targetLanguages: string[],
  currentVersion: LanguageVersion,
  setLanguageVersions: React.Dispatch<React.SetStateAction<LanguageVersion[]>>
) => {
  for (const targetLang of targetLanguages) {
    if (targetLang !== sourceLanguage) {
      const translatedPages = await Promise.all(currentVersion.pages.map(async (page) => {
        return await translatePageContent(page, sourceLanguage, targetLang);
      }));

      setLanguageVersions(prev => {
        const updatedVersions = [...prev];
        const targetVersionIndex = updatedVersions.findIndex(v => v.language === targetLang);
        if (targetVersionIndex !== -1) {
          updatedVersions[targetVersionIndex].pages = translatedPages;
        } else {
          updatedVersions.push({ language: targetLang, pages: translatedPages });
        }
        return updatedVersions;
      });
    }
  }
};

export const updateTranslation = (
  targetLang: string,
  pageIndex: number,
  translatedContent: PageContent,
  setLanguageVersions: React.Dispatch<React.SetStateAction<LanguageVersion[]>>
) => {
  setLanguageVersions((prevVersions) => {
    const updatedVersions = [...prevVersions];
    const targetVersionIndex = updatedVersions.findIndex((v) => v.language === targetLang);
    
    if (targetVersionIndex !== -1) {
      updatedVersions[targetVersionIndex].pages[pageIndex] = translatedContent;
    } else {
      updatedVersions.push({
        language: targetLang,
        pages: Array(pageIndex).fill(null).concat([translatedContent]),
      });
    }

    return updatedVersions;
  });
};
