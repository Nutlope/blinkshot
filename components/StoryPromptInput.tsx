import React from 'react';

interface StoryPromptInputProps {
  storyPrompt: string;
  setStoryPrompt: (prompt: string) => void;
  startStory: () => void;
}

const StoryPromptInput: React.FC<StoryPromptInputProps> = ({
  storyPrompt,
  setStoryPrompt,
  startStory,
}) => {
  return (
    <div className="max-w-2xl mx-auto">
      <textarea
        value={storyPrompt}
        onChange={(e) => setStoryPrompt(e.target.value)}
        placeholder="Enter your story prompt here..."
        className="w-full p-4 text-indigo-900 bg-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
        rows={4}
      />
      <button
        onClick={startStory}
        className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 ease-in-out"
      >
        Start Your Story
      </button>
    </div>
  );
};

export default StoryPromptInput;
