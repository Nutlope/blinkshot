import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Page from './Page';
import { LanguageVersion, PageContent } from '@/types';
import { PlusCircle, Image as ImageIcon, Sparkles, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

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
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow-xl"
  >
    <div className="mb-8 text-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Craft Your Narrative</h2>
      <p className="text-gray-600">Shape your ideas into a compelling story</p>
    </div>

    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
      <Button 
        onClick={addNewPage}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105 flex items-center"
      >
        <PlusCircle className="w-5 h-5 mr-2" />
        Add New Page
      </Button>
      <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-md">
        <ImageIcon className="w-5 h-5 text-blue-600 mr-2" />
        <label htmlFor='imageCount' className="text-gray-700 font-semibold mr-2">
          Images per section:
        </label>
        <Input
          id='imageCount'
          type='number'
          min='1'
          max='5'
          value={imageCount}
          onChange={(e) => setImageCount(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
          className="w-16 text-center text-gray-800 bg-gray-100 border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md"
        />
      </div>
    </div>

    <div className="space-y-6">
      {languageVersions.find((v) => v.language === activeLanguage)?.pages.map((page, index) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="bg-white rounded-lg shadow-lg p-6 transition duration-300 ease-in-out transform hover:shadow-xl"
        >
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <BookOpen className="w-6 h-6 mr-2 text-blue-600" />
            Page {index + 1}
          </h3>
          <Page
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
        </motion.div>
      ))}
    </div>

    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mt-8 text-center"
    >
      <p className="text-gray-600 font-semibold flex items-center justify-center">
        <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
        Tip: Use vivid descriptions to bring your narrative to life!
      </p>
    </motion.div>
  </motion.div>
);

export default EditingPanel;
