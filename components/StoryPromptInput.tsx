import React from 'react';
import { Button } from '@/components/ui/button';

type StoryPromptInputProps = {
  storyPrompt: string;
  setStoryPrompt: (prompt: string) => void;
  startStory: () => void;
};

const StoryPromptInput: React.FC<StoryPromptInputProps> = ({ storyPrompt, setStoryPrompt, startStory }) => (
  <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>What kind of story would you like to create?</h2>
    <textarea
      value={storyPrompt}
      onChange={(e) => setStoryPrompt(e.target.value)}
      placeholder='E.g., A magical adventure in a world where animals can talk...'
      style={{
        width: '100%',
        maxWidth: '600px',
        height: '150px',
        padding: '0.5rem',
        marginBottom: '1rem',
        borderRadius: '0.375rem',
        border: '1px solid #d1d5db',
      }}
    />
    <Button onClick={startStory}>Start Story</Button>
  </div>
);

export default StoryPromptInput;
