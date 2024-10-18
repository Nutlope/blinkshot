// pages/index.tsx

"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StoryPromptInput from '@/components/StoryPromptInput';
import LanguageSelector from '@/components/LanguageSelector';
import EditingPanel from '@/components/EditingPanel';
import FormatSelector from '@/components/FormatSelector';
import FinalBookPreview from '@/components/FinalBookPreview';
import dynamic from 'next/dynamic';
import ComicPreview from '@/components/ComicPreview';
import SlideshowPreview from '@/components/SlideshowPreview';
import { LanguageVersion, PageContent, ComicPage, Page } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import EditableBookPreview from '@/components/EditableBookPreview';
import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import Image from 'next/image';
import TranslationManager from '@/components/TranslationManager';
import PreviewSelector from '@/components/PreviewSelector';
import { translatePageContent, translateAllContent, updateTranslation } from '@/lib/translationHelpers';
import debounce from 'lodash/debounce';
import { Button } from "@/components/ui/button";
import TranslationProgressIndicator from '@/components/TranslationProgressIndicator';

// Use dynamic import for MagazinePreview
const MagazinePreview = dynamic(() => import('@/components/MagazinePreview'), { ssr: false });

// Add this function above where it's used
function determineSize(block: BlockType): SizeType {
  // Implement your size determination logic here
  return { width: 100, height: 200 }; // Example return value
}

type SizeType = {
  width: number;
  height: number;
};

export default function Home() {
  const [userAPIKey, setUserAPIKey] = useState('');
  const [iterativeMode, setIterativeMode] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [storyPrompt, setStoryPrompt] = useState('');
  const [hasStartedStory, setHasStartedStory] = useState(false);
  const [imageCount, setImageCount] = useState(1);
  const [languages, setLanguages] = useState<string[]>(['English']);
  const [activeLanguage, setActiveLanguage] = useState<string>('English');
  const [languageVersions, setLanguageVersions] = useState<LanguageVersion[]>([
    { language: 'English', pages: [] },
  ]);
  const [activePreview, setActivePreview] = useState<string>('book');
  const [targetLanguages, setTargetLanguages] = useState<string[]>(['English']);
  const availableLanguages = [
    'English',
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Russian',
    'Chinese (Simplified)',
    'Japanese',
    'Korean',
    'Arabic',
    'Hindi',
    'Dutch',
    'Swedish',
    'Polish',
    'Turkish',
    'Greek',
    'Hebrew',
    'Thai',
    'Vietnamese'
  ];
  const [pendingTranslations, setPendingTranslations] = useState<{[key: string]: boolean}>({});
  const translationCache = useRef<{[key: string]: {[key: string]: string}}>({});
  const [translationProgress, setTranslationProgress] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const addLanguage = (language: string) => {
    if (!languages.includes(language)) {
      setLanguages([...languages, language]);
      setLanguageVersions([...languageVersions, { language, pages: [] }]);
    }
  };

  const removeLanguage = (language: string) => {
    if (languages.length > 1) {
      setLanguages(languages.filter((l) => l !== language));
      setLanguageVersions(languageVersions.filter((v) => v.language !== language));
      if (activeLanguage === language) {
        setActiveLanguage(languages[0]);
      }
    }
  };

  const addNewPage = () => {
    setLanguageVersions((prevVersions) =>
      prevVersions.map((version) => ({
        ...version,
        pages: [
          ...version.pages,
          { blocks: [{ type: 'text', content: '', generating: false, context: storyPrompt }] },
        ],
      }))
    );
  };

  const startStory = () => {
    if (storyPrompt.trim() === '') {
      alert('Please enter an initial story prompt.');
      return;
    }
    setHasStartedStory(true);
    addNewPage();
  };

  const debouncedTranslate = useCallback(
    debounce((language: string, pageIndex: number, content: PageContent) => {
      translateContent(language, pageIndex, content);
    }, 1000),
    []
  );

  const updatePageContent = async (language: string, pageIndex: number, newContent: PageContent) => {
    setLanguageVersions((prevVersions) => {
      const updatedVersions = [...prevVersions];
      const versionIndex = updatedVersions.findIndex((v) => v.language === language);
      
      if (versionIndex !== -1) {
        updatedVersions[versionIndex].pages[pageIndex] = newContent;
      }

      return updatedVersions;
    });

    // Queue translation for other languages
    targetLanguages.forEach(targetLang => {
      if (targetLang !== language) {
        setPendingTranslations(prev => ({...prev, [`${pageIndex}-${targetLang}`]: true}));
        debouncedTranslate(language, pageIndex, newContent);
      }
    });
  };

  const translateContent = async (sourceLanguage: string, pageIndex: number, content: PageContent) => {
    for (const targetLang of targetLanguages) {
      if (targetLang !== sourceLanguage) {
        const cacheKey = `${sourceLanguage}-${targetLang}-${pageIndex}`;
        const cachedTranslation = translationCache.current[cacheKey];

        if (cachedTranslation) {
          updateTranslation(targetLang, pageIndex, cachedTranslation, setLanguageVersions);
        } else {
          try {
            const translatedContent = await translatePageContent(content, sourceLanguage, targetLang);
            translationCache.current[cacheKey] = translatedContent;
            updateTranslation(targetLang, pageIndex, translatedContent, setLanguageVersions);
          } catch (error) {
            console.error('Translation error:', error);
          }
        }

        setPendingTranslations(prev => ({...prev, [`${pageIndex}-${targetLang}`]: false}));
      }
    }
  };

  const handleTranslateAllContent = async () => {
    setIsTranslating(true);
    setTranslationProgress(0);
    const sourceLanguage = 'English'; // Assuming English is the source language
    const currentVersion = languageVersions.find(v => v.language === sourceLanguage);
    
    if (!currentVersion) {
      console.error('Source language version not found');
      setIsTranslating(false);
      return;
    }

    const totalPages = currentVersion.pages.length * (targetLanguages.length - 1);
    let translatedPages = 0;

    for (const targetLang of targetLanguages) {
      if (targetLang !== sourceLanguage) {
        for (let i = 0; i < currentVersion.pages.length; i++) {
          const translatedContent = await translatePageContent(currentVersion.pages[i], sourceLanguage, targetLang);
          updateTranslation(targetLang, i, translatedContent, setLanguageVersions);
          translatedPages++;
          setTranslationProgress((translatedPages / totalPages) * 100);
        }
      }
    }

    setIsTranslating(false);
  };

  // Function to download the book (implementation can be added)
  const downloadBook = async (format: 'docx' | 'pdf' | 'epub') => {
    try {
      setIsGeneratingDocx(true);
  
      // Get the pages for the active language
      const currentVersion = languageVersions.find((v) => v.language === activeLanguage);
      const pages = currentVersion ? currentVersion.pages : [];
  
      if (format === 'docx') {
        await downloadDOCX(pages);
      } else if (format === 'pdf') {
        const pdf = generatePDF(pages);
        pdf.save(`storybook_${activeLanguage}.pdf`);
      } else if (format === 'epub') {
        await downloadEPUB(pages);
      }
    } catch (error) {
      console.error(`Error generating ${format.toUpperCase()}:`, error);
      alert(
        `An error occurred while generating the ${format.toUpperCase()} document. Please try again.`
      );
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  const downloadDOCX = async (pages: PageContent[]) => {
    try {
      setIsGeneratingDocx(true);
  
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: `Storybook ${activeLanguage}`, bold: true, size: 24 })],
              alignment: AlignmentType.CENTER,
            }),
          ],
        }],
      });
  
      for (const page of pages) {
        const pageChildren = [];
  
        for (const block of page.blocks) {
          if (block.type === 'text') {
            pageChildren.push(
              new Paragraph({
                children: [new TextRun(stripHtmlTags(block.content))],
              }),
            );
          } else if (block.type === 'image' && block.content) {
            try {
              const base64Data = block.content.b64_json;
              if (base64Data) {
                const imageBuffer = Buffer.from(base64Data, 'base64');
                pageChildren.push(
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: imageBuffer,
                        transformation: {
                          width: 500,
                          height: 300,
                        },
                      }),
                    ],
                  }),
                );
              } else {
                console.warn('Image data is missing for an image block');
                pageChildren.push(
                  new Paragraph({
                    children: [new TextRun('[Image placeholder]')],
                  }),
                );
              }
            } catch (imageError) {
              console.error('Error adding image:', imageError);
              pageChildren.push(
                new Paragraph({
                  children: [new TextRun('Error: Unable to add image')],
                }),
              );
            }
          }
        }
  
        doc.addSection({
          properties: {},
          children: pageChildren,
        });
      }
  
      const buffer = await Packer.toBlob(doc);
      saveAs(buffer, `storybook_${activeLanguage}.docx`);
    } catch (error) {
      console.error('Error generating DOCX:', error);
      alert('Failed to generate DOCX. Please try again.');
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  // Helper function to generate the PDF document
  const generatePDF = (pages: PageContent[]) => {
    const pdf = new jsPDF();

    pages.forEach((page, pageIndex) => {
      if (pageIndex > 0) {
        pdf.addPage();
      }
      let yOffset = 20;

      page.blocks.forEach((block) => {
        if (block.type === 'text') {
          const text = stripHtmlTags(block.content);
          pdf.setFontSize(12);
          const splitText = pdf.splitTextToSize(text, 170);
          pdf.text(splitText, 20, yOffset);
          yOffset += splitText.length * 7;
        } else if (block.type === 'image' && block.content) {
          try {
            pdf.addImage(
              `data:image/png;base64,${block.content.b64_json}`,
              'PNG',
              20,
              yOffset,
              170,
              100
            );
            yOffset += 110;
          } catch (error) {
            console.error('Error adding image to PDF:', error);
          }
        }

        if (yOffset > 280) {
          pdf.addPage();
          yOffset = 20;
        }
      });
    });

    return pdf;
  };

  // Helper function to generate the EPUB document
  const downloadEPUB = async (pages: PageContent[]) => {
    try {
      const response = await fetch('/api/generate-epub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pages,
          title: `Storybook ${activeLanguage}`,
          language: activeLanguage,
        }),
      });
  
      if (!response.ok) {
        console.error('Error generating EPUB:', response.statusText);
        throw new Error('Failed to generate EPUB');
      }
  
      const blob = await response.blob();
      saveAs(blob, `storybook_${activeLanguage}.epub`);
    } catch (error) {
      console.error('Error downloading EPUB:', error);
      alert('Failed to download EPUB. Please try again.');
    }
  };

  // Helper function to strip HTML tags
  const stripHtmlTags = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Function to convert pages to comic format
  const convertToComicFormat = (pages: PageContent[]): ComicPage[] => {
    return pages.map((page) => ({
      panels: page.blocks.map((block) => ({
        type: block.type as 'image' | 'text',
        content:
          block.type === 'image' && block.content
            ? `data:image/png;base64,${block.content.b64_json}`
            : block.type === 'text'
            ? block.content
            : '',
        size: Math.random() > 0.7 ? 'large' : 'medium', // Randomly assign sizes for variety
        speechBubble: block.type === 'text' && Math.random() > 0.5, // Randomly make some text blocks speech bubbles
      })),
    }));
  };

  const handleTranslationComplete = (translations: LanguageVersion[]) => {
    setLanguageVersions((prevVersions) => {
      const updatedVersions = [...prevVersions];
      translations.forEach((translation) => {
        const existingIndex = updatedVersions.findIndex((v) => v.language === translation.language);
        if (existingIndex !== -1) {
          updatedVersions[existingIndex] = translation;
        } else {
          updatedVersions.push(translation);
        }
      });
      return updatedVersions;
    });
  };

  const handleShowTranslationOptions = () => {
    setShowLanguageSelector(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-blue-200">
      <Header userAPIKey={userAPIKey} setUserAPIKey={setUserAPIKey} />

      {!hasStartedStory ? (
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-indigo-900 mb-4">
              Transform Your Ideas into Captivating Stories
            </h1>
            <p className="text-xl text-indigo-700 mb-8">
              Harness the power of AI to create, edit, and publish your stories in minutes, not months!
            </p>
            <StoryPromptInput
              storyPrompt={storyPrompt}
              setStoryPrompt={setStoryPrompt}
              startStory={startStory}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <FeatureCard
              icon="🚀"
              title="10x Faster Creation"
              description="Generate complete, high-quality stories in minutes with our advanced AI technology"
            />
            <FeatureCard
              icon="🌍"
              title="Global Reach"
              description="Instantly translate your stories into multiple languages, expanding your audience worldwide"
            />
            <FeatureCard
              icon="📚"
              title="Multi-Format Export"
              description="Publish your stories as books, comics, magazines, or slideshows with a single click"
            />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
            <h2 className="text-3xl font-bold text-center text-indigo-900 mb-8">
              Your Journey to Bestseller Status
            </h2>
            <div className="flex flex-col md:flex-row justify-between items-center">
              <StepCard
                number="1"
                title="Spark Your Imagination"
                description="Enter a brief prompt or idea to kickstart your story"
              />
              <StepCard
                number="2"
                title="AI-Powered Creation"
                description="Watch as our AI crafts a unique, engaging narrative based on your input"
              />
              <StepCard
                number="3"
                title="Polish and Publish"
                description="Refine your story with our intuitive editor and export in your preferred format"
              />
            </div>
          </div>

          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-indigo-900 mb-4">
              Join Thousands of Satisfied Storytellers
            </h2>
            <div className="flex flex-wrap justify-center gap-8">
              <Testimonial
                quote="This tool has revolutionized my writing process. I've published three books in the time it used to take me to write one!"
                author="Sarah J., Bestselling Author"
              />
              <Testimonial
                quote="The multi-language support helped me reach readers in 5 new countries. My audience has grown exponentially!"
                author="Michael L., International Content Creator"
              />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-indigo-900 mb-4">
              Ready to Write Your Masterpiece?
            </h2>
            <p className="text-xl text-indigo-700 mb-8">
              Join today and turn your ideas into captivating stories in minutes!
            </p>
            <button
              onClick={() => document.querySelector('textarea')?.focus()}
              className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-full text-xl hover:bg-indigo-700 transition duration-300 ease-in-out transform hover:scale-105"
            >
              Start Writing Now
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="container mx-auto px-4 py-8">
            <Button
              onClick={handleShowTranslationOptions}
              className="mb-4 bg-indigo-600 text-white"
            >
              Translate to Other Languages
            </Button>
            
            {showLanguageSelector && (
              <LanguageSelector
                availableLanguages={availableLanguages}
                targetLanguages={targetLanguages}
                setTargetLanguages={setTargetLanguages}
              />
            )}
            
            {showLanguageSelector && (
              <Button
                onClick={handleTranslateAllContent}
                className="mb-4 bg-indigo-600 text-white"
              >
                Start Translation
              </Button>
            )}
            
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Editing Panel */}
              <div className="lg:w-1/2">
                <EditingPanel
                  languageVersions={languageVersions}
                  activeLanguage={activeLanguage}
                  addNewPage={addNewPage}
                  imageCount={imageCount}
                  setImageCount={setImageCount}
                  updatePageContent={updatePageContent}
                  setLanguageVersions={setLanguageVersions}
                  userAPIKey={userAPIKey}
                  iterativeMode={iterativeMode}
                  isGeneratingDocx={isGeneratingDocx}
                  storyPrompt={storyPrompt}
                />
              </div>

              {/* Preview Panel */}
              <div className="lg:w-1/2">
                <PreviewSelector
                  activePreview={activePreview}
                  setActivePreview={setActivePreview}
                  activeLanguage={activeLanguage}
                  setActiveLanguage={setActiveLanguage}
                  availableLanguages={targetLanguages}
                />
                {activePreview === 'book' && (
                  <FinalBookPreview
                    pages={languageVersions.find((v) => v.language === activeLanguage)?.pages || []}
                    language={activeLanguage}
                  />
                )}
                {activePreview === 'magazine' && (
                  <MagazinePreview
                    pages={languageVersions.find((v) => v.language === activeLanguage)?.pages || []}
                    language={activeLanguage}
                    updatePageContent={(pageIndex, newPage) => 
                      updatePageContent(activeLanguage, pageIndex, newPage as PageContent)
                    }
                  />
                )}
                {activePreview === 'comic' && (
                  <ComicPreview
                    pages={convertToComicFormat(languageVersions.find((v) => v.language === activeLanguage)?.pages || [])}
                  />
                )}
                {activePreview === 'editablebook' && (
                  <EditableBookPreview
                    pages={languageVersions.find((v) => v.language === activeLanguage)?.pages || []}
                    language={activeLanguage}
                    updatePageContent={(pageIndex, newPage) => 
                      updatePageContent(activeLanguage, pageIndex, newPage as PageContent)
                    }
                    availableLanguages={availableLanguages}
                  />
                )}
                {activePreview === 'slideshow' && (
                  <SlideshowPreview
                    pages={languageVersions.find((v) => v.language === activeLanguage)?.pages || []}
                  />
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <Footer downloadBook={downloadBook} isGeneratingDocx={isGeneratingDocx} />
      <TranslationProgressIndicator progress={translationProgress} isTranslating={isTranslating} />
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-indigo-900 mb-2">{title}</h3>
      <p className="text-indigo-700">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }) {
  return (
    <div className="flex flex-col items-center mb-8 md:mb-0">
      <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-indigo-900 mb-2">{title}</h3>
      <p className="text-indigo-700 text-center">{description}</p>
    </div>
  );
}

function Testimonial({ quote, author }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
      <p className="text-indigo-700 italic mb-4">"{quote}"</p>
      <p className="text-indigo-900 font-semibold">{author}</p>
    </div>
  );
}
