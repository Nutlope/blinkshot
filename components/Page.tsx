import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, RefreshCw, Upload } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import Spinner from '@/components/spinner';
import ProgressIndicator from '@/components/ui/ProgressIndicator';
import { ContentBlock, PageProps, ImageResponse } from '@/types';

const Page: React.FC<PageProps> = ({
  index,
  page,
  setPageContent,
  userAPIKey,
  iterativeMode,
  isGeneratingDocx,
  storyPrompt,
  imageCount,
  onDeletePage,
  onAddVideo,
}) => {
  const [blocks, setBlocks] = useState<ContentBlock[]>(page.blocks);
  const [selectedText, setSelectedText] = useState<{ blockIndex: number; text: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    setPageContent({ blocks });
  }, [blocks]);

  // Function to handle text selection
  const handleTextSelection = (
    blockIndex: number,
    e: React.MouseEvent<HTMLTextAreaElement>
  ) => {
    const textarea = e.currentTarget;
    const selectedTextContent = textarea.value.substring(
      textarea.selectionStart,
      textarea.selectionEnd
    );
    if (selectedTextContent) {
      setSelectedText({
        blockIndex,
        text: selectedTextContent,
      });
    }
  };

  // **Function to update a text block**
  const updateTextBlock = (blockIndex: number, content: string) => {
    setBlocks((prevBlocks) => {
      const newBlocks = [...prevBlocks];
      if (newBlocks[blockIndex].type === 'text') {
        newBlocks[blockIndex] = {
          ...newBlocks[blockIndex],
          content: content,
        };
      }
      return newBlocks;
    });

    // Trigger text auto-generation
    autoGenerateText(blockIndex, content);

    // Trigger image generation based on text
    generateImageForTextBlock(blockIndex, content);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modified function to handle image upload with progress
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadstart = () => setUploadProgress(0);
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress((e.loaded / e.total) * 100);
        }
      };
      reader.onloadend = () => {
        setUploadProgress(null);
        const base64String = reader.result as string;
        addBlock('image', undefined, base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Modified addBlock function to handle uploaded images
  const addBlock = (type: 'text' | 'image', afterIndex?: number, uploadedImage?: string) => {
    const newBlock: ContentBlock =
      type === 'text'
        ? { type: 'text', content: '', generating: false, context: selectedText?.text || '' }
        : { 
            type: 'image', 
            content: uploadedImage 
              ? { b64_json: uploadedImage.split(',')[1] } 
              : null, 
            generating: !uploadedImage, 
            prompt: '' 
          };

    setBlocks((prevBlocks) => {
      const newBlocks = [...prevBlocks];
      let insertIndex = afterIndex !== undefined ? afterIndex + 1 : newBlocks.length;
      newBlocks.splice(insertIndex, 0, newBlock);

      if (
        type === 'text' &&
        selectedText &&
        selectedText.blockIndex === afterIndex &&
        selectedText.text
      ) {
        setTimeout(() => generateTextWithContext(insertIndex, selectedText.text), 0);
      } else if (type === 'image' && !uploadedImage) {
        generateImageForTextBlock(insertIndex - 1, newBlocks[insertIndex - 1].content as string);
      }

      return newBlocks;
    });
  };

  // Function to generate text with context
  const generateTextWithContext = async (blockIndex: number, context: string) => {
    setBlocks((prevBlocks) => {
      const newBlocks = [...prevBlocks];
      if (newBlocks[blockIndex].type === 'text') {
        newBlocks[blockIndex] = {
          ...newBlocks[blockIndex],
          generating: true,
        };
      }
      return newBlocks;
    });

    try {
      const response = await fetch('/api/generateText', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: context,
          storyPrompt: storyPrompt,
          previousContent: blocks
            .slice(0, blockIndex)
            .filter((block) => block.type === 'text')
            .map((block) => block.content)
            .join('\n'),
        }),
      });
      if (!response.ok) throw new Error('Failed to generate text');
      const data = await response.json();

      setBlocks((prevBlocks) => {
        const newBlocks = [...prevBlocks];
        if (newBlocks[blockIndex].type === 'text') {
          newBlocks[blockIndex] = {
            ...newBlocks[blockIndex],
            content: data.text,
            generating: false,
            context: context,
          };
        }
        return newBlocks;
      });

      // Generate image for the new text
      generateImageForTextBlock(blockIndex, data.text);
    } catch (error) {
      console.error('Error generating text:', error);
      setBlocks((prevBlocks) => {
        const newBlocks = [...prevBlocks];
        if (newBlocks[blockIndex].type === 'text') {
          newBlocks[blockIndex] = {
            ...newBlocks[blockIndex],
            generating: false,
          };
        }
        return newBlocks;
      });
    }
  };

  // Debounced function for text auto-generation
  const autoGenerateText = useDebouncedCallback(
    async (blockIndex: number, content: string) => {
      if (content.trim() === '') return;

      // Set generating state to true
      setBlocks((prevBlocks) => {
        const newBlocks = [...prevBlocks];
        if (newBlocks[blockIndex].type === 'text') {
          newBlocks[blockIndex] = {
            ...newBlocks[blockIndex],
            generating: true,
          };
        }
        return newBlocks;
      });

      try {
        const response = await fetch('/api/generateText', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: content, storyPrompt }),
        });
        if (!response.ok) throw new Error('Failed to generate text');
        const data = await response.json();
        const newText = content + ' ' + data.text;

        // Update the text block
        setBlocks((prevBlocks) => {
          const updatedBlocks = [...prevBlocks];
          if (updatedBlocks[blockIndex].type === 'text') {
            updatedBlocks[blockIndex] = {
              ...updatedBlocks[blockIndex],
              content: newText,
              generating: false,
            };
          }
          return updatedBlocks;
        });
      } catch (error) {
        console.error('Error generating text:', error);
        setBlocks((prevBlocks) => {
          const updatedBlocks = [...prevBlocks];
          if (updatedBlocks[blockIndex].type === 'text') {
            updatedBlocks[blockIndex] = {
              ...updatedBlocks[blockIndex],
              generating: false,
            };
          }
          return updatedBlocks;
        });
      }
    },
    1000
  );

  // Debounced function to generate images
  const generateImageForTextBlock = useDebouncedCallback(
    async (blockIndex: number, content: string) => {
      if (content.trim() === '') return;

      // Create a local copy of imageCount
      const imagesToGenerate = imageCount;

      // Generate new image blocks
      for (let i = 0; i < imagesToGenerate; i++) {
        const newImageBlock: ContentBlock = {
          type: 'image',
          content: null,
          generating: true,
          prompt: content,
        };

        setBlocks((prevBlocks) => {
          const newBlocks = [...prevBlocks];
          newBlocks.splice(blockIndex + 1 + i, 0, newImageBlock);
          return newBlocks;
        });

        try {
          const imageResponse = await fetch('/api/generateImages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: content,
              userAPIKey,
              iterativeMode,
            }),
          });
          if (!imageResponse.ok) throw new Error('Failed to generate image');
          const imageData = (await imageResponse.json()) as ImageResponse;

          setBlocks((prevBlocks) => {
            const updatedBlocks = [...prevBlocks];
            const imageBlockIndex = blockIndex + 1 + i;
            if (
              updatedBlocks[imageBlockIndex] &&
              updatedBlocks[imageBlockIndex].type === 'image'
            ) {
              updatedBlocks[imageBlockIndex] = {
                ...updatedBlocks[imageBlockIndex],
                content: imageData,
                generating: false,
              };
            }
            return updatedBlocks;
          });
        } catch (error) {
          console.error('Error generating image:', error);
          setBlocks((prevBlocks) => {
            const updatedBlocks = [...prevBlocks];
            const imageBlockIndex = blockIndex + 1 + i;
            if (
              updatedBlocks[imageBlockIndex] &&
              updatedBlocks[imageBlockIndex].type === 'image'
            ) {
              updatedBlocks[imageBlockIndex] = {
                ...updatedBlocks[imageBlockIndex],
                generating: false,
              };
            }
            return updatedBlocks;
          });
        }
      }
    },
    2000
  );

  // Function to delete a block
  const deleteBlock = (blockIndex: number) => {
    setBlocks((prevBlocks) => prevBlocks.filter((_, index) => index !== blockIndex));
  };

  // Function to reset the page
  const resetPage = () => {
    const resetBlocks: ContentBlock[] = [
      {
        type: 'text',
        content: '',
        generating: false,
        context: '',
      },
    ];

    setBlocks(resetBlocks);
    setPageContent({ blocks: resetBlocks });
    setSelectedText(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      autoGenerateText.cancel();
      generateImageForTextBlock.cancel();
    };
  }, []);

  return (
    <div
      className="book-page"
      style={{
        border: '1px solid #d1d5db',
        borderRadius: '0.5rem',
        padding: '1rem',
        backgroundColor: 'white',
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <h3>Page {index + 1}</h3>
        <Button onClick={onDeletePage} size="sm" variant="destructive">
          <Trash2 style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
          Delete Page
        </Button>
      </div>
      {!isGeneratingDocx && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.5rem',
            alignItems: 'center',
          }}
        >
          <div>
            <Button onClick={() => addBlock('text')} size="sm" style={{ marginRight: '0.5rem' }}>
              <Plus style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
              Add Text
            </Button>
            <Button onClick={() => addBlock('image')} size="sm" style={{ marginRight: '0.5rem' }}>
              <Plus style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
              Generate Image
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} size="sm">
              <Upload style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
              Upload Image
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleImageUpload}
              accept="image/*"
            />
          </div>
          {uploadProgress !== null && (
            <div className="mt-2">
              <ProgressIndicator progress={uploadProgress} />
            </div>
          )}
        </div>
      )}
      {blocks.map((block, idx) => {
        if (block.type === 'text') {
          return (
            <div key={idx} style={{ marginBottom: '1rem', position: 'relative' }}>
              <textarea
                value={block.content}
                onChange={(e) => updateTextBlock(idx, e.target.value)}
                onMouseUp={(e) => handleTextSelection(idx, e)}
                disabled={isGeneratingDocx}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  resize: 'vertical',
                }}
              />
              {!isGeneratingDocx && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '0.5rem',
                  }}
                >
                  <Button onClick={() => deleteBlock(idx)} size="sm" variant="destructive">
                    <Trash2 style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
                    Delete
                  </Button>
                  <div>
                    <Button
                      onClick={resetPage}
                      size="sm"
                      variant="outline"
                      style={{ marginRight: '0.5rem' }}
                    >
                      <RefreshCw style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
                      Reset Page
                    </Button>
                    <Button
                      onClick={() => addBlock('text', idx)}
                      size="sm"
                      disabled={!selectedText || selectedText.blockIndex !== idx}
                    >
                      <Plus style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
                      Continue Story
                    </Button>
                  </div>
                </div>
              )}
              {block.generating && !isGeneratingDocx && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem',
                    borderRadius: '0.25rem',
                  }}
                >
                  <Spinner
                    style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      marginRight: '0.5rem',
                      color: '#4B5563',
                    }}
                  />
                  <span style={{ color: '#4B5563' }}>Generating text...</span>
                </div>
              )}
              {block.context && (
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  Context: {block.context}
                </div>
              )}
            </div>
          );
        } else if (block.type === 'image') {
          return (
            <div key={idx} style={{ marginBottom: '1rem', position: 'relative' }}>
              {block.generating ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '300px',
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '0.5rem',
                  }}
                >
                  <Spinner style={{ width: '2rem', height: '2rem', color: '#4B5563' }} />
                  <span style={{ marginLeft: '0.5rem', color: '#4B5563' }}>Generating image...</span>
                </div>
              ) : block.content ? (
                <>
                  <Image
                    src={`data:image/png;base64,${block.content.b64_json}`}
                    alt=""
                    width={400}
                    height={300}
                    style={{ borderRadius: '0.5rem', maxWidth: '100%', height: 'auto' }}
                  />
                  {!isGeneratingDocx && (
                    <Button
                      onClick={() => deleteBlock(idx)}
                      size="sm"
                      variant="destructive"
                      style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}
                    >
                      <Trash2 style={{ width: '1rem', height: '1rem' }} />
                    </Button>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', color: '#4B5563' }}>Image not available</div>
              )}
            </div>
          );
        } else {
          return null;
        }
      })}
    </div>
  );
};

export default Page;
