import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Page from './Page';
import { LanguageVersion, PageContent } from '@/types';

type EditingPanelProps = {
  languageVersions: LanguageVersion[];
  activeLanguage: string;
  addNewPage: () => void;
  imageCount: number;
  setImageCount: (count: number) => void;
  updatePageContent: (language: string, pageIndex: number, newContent: PageContent) => void;
  setLanguageVersions: React.Dispatch<React.SetStateAction<LanguageVersion[]>>;
  userAPIKey: string;
  iterativeMode: boolean;
  isGeneratingDocx: boolean;
  storyPrompt: string;
};

const EditingPanel: React.FC<EditingPanelProps> = ({
  languageVersions,
  activeLanguage,
  addNewPage,
  imageCount,
  setImageCount,
  updatePageContent,
  setLanguageVersions,
  userAPIKey,
  iterativeMode,
  isGeneratingDocx,
  storyPrompt,
}) => (
  <div style={{ maxWidth: '600px', margin: '0 auto' }}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        alignItems: 'center',
      }}
    >
      <Button onClick={addNewPage}>Add New Page</Button>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <label htmlFor='imageCount' style={{ marginRight: '0.5rem', color: '#4b5563' }}>
          Images per text:
        </label>
        <Input
          id='imageCount'
          type='number'
          min='1'
          max='5'
          value={imageCount}
          onChange={(e) => setImageCount(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
          style={{ width: '60px', marginRight: '0.5rem' }}
        />
      </div>
    </div>
    {languageVersions.find((v) => v.language === activeLanguage)?.pages.map((page, index) => (
      <Page
        key={index}
        index={index}
        page={page}
        setPageContent={(content) => updatePageContent(activeLanguage, index, content)}
        userAPIKey={userAPIKey}
        iterativeMode={iterativeMode}
        isGeneratingDocx={isGeneratingDocx}
        storyPrompt={storyPrompt}
        imageCount={imageCount}
        onDeletePage={() => {
          setLanguageVersions((prevVersions) =>
            prevVersions.map((version) => ({
              ...version,
              pages: version.pages.filter((_, i) => i !== index),
            }))
          );
        }}
        onAddVideo={(videoUrl) => {
          console.log('Video functionality is currently disabled');
        }}
      />
    ))}
  </div>
);

export default EditingPanel;
