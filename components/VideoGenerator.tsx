import React, { useState } from 'react';
import { Button } from "@/components/ui/button";

type VideoGeneratorProps = {
  prompt: string;
  onVideoGenerated: (videoUrl: string) => void;
};

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ prompt, onVideoGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateVideo = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // This is a placeholder for the actual API call to Runway's Gen-2
      // You'll need to replace this with the actual API integration
      const response = await fetch('/api/generateVideo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate video');
      }

      const data = await response.json();
      onVideoGenerated(data.videoUrl);
    } catch (err) {
      setError('Failed to generate video. Please try again.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <Button onClick={generateVideo} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate Video'}
      </Button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default VideoGenerator;
