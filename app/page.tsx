// pages/index.tsx

"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/spinner";
import { Plus, Download, Trash2, Bold, Italic, Underline } from "lucide-react";
import GithubIcon from "@/components/icons/github-icon";
import XIcon from "@/components/icons/x-icon";
import Logo from "@/components/logo";
import { Document, Packer, Paragraph, TextRun, ImageRun } from "docx";
import { saveAs } from "file-saver";
import { Buffer } from 'buffer';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import TTSButton from '@/components/TTSButton';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

type ImageResponse = {
  b64_json: string;
  timings: { inference: number };
};

type ContentBlock =
  | { type: "text"; content: string; generating: boolean; context?: string }
  | {
      type: "image";
      content: ImageResponse | null;
      generating: boolean;
      prompt: string;
    };

type PageContent = {
  blocks: ContentBlock[];
};

type PageProps = {
  index: number;
  page: PageContent;
  setPageContent: (content: PageContent) => void;
  userAPIKey: string;
  iterativeMode: boolean;
  isGeneratingDocx: boolean;
  storyPrompt: string;
  imageCount: number;
  onDeletePage: () => void;
};

type LanguageVersion = {
  language: string;
  pages: PageContent[];
};

export default function Home() {
  const [userAPIKey, setUserAPIKey] = useState("");
  const [iterativeMode, setIterativeMode] = useState(false);
  const [pages, setPages] = useState<PageContent[]>([]);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [storyPrompt, setStoryPrompt] = useState("");
  const [hasStartedStory, setHasStartedStory] = useState(false);
  const [imageCount, setImageCount] = useState(1);
  const [finalPreview, setFinalPreview] = useState<PageContent[]>([]);
  const [languages, setLanguages] = useState<string[]>(["English"]);
  const [activeLanguage, setActiveLanguage] = useState<string>("English");
  const [languageVersions, setLanguageVersions] = useState<LanguageVersion[]>([
    { language: "English", pages: [] }
  ]);

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
      setLanguages(languages.filter(l => l !== language));
      setLanguageVersions(languageVersions.filter(v => v.language !== language));
      if (activeLanguage === language) {
        setActiveLanguage(languages[0]);
      }
    }
  };

  const addNewPage = () => {
    setLanguageVersions(prevVersions => 
      prevVersions.map(version => ({
        ...version,
        pages: [
          ...version.pages,
          { blocks: [{ type: "text", content: "", generating: false, context: storyPrompt }] }
        ]
      }))
    );
  };

  // Implement book download functionality
  const downloadBook = async () => {
    try {
      setIsGeneratingDocx(true);

      const doc = new Document({
        sections: [{
          properties: {},
          children: [],
        }],
      });

      for (const page of pages) {
        for (const block of page.blocks) {
          if (block.type === "text") {
            doc.addParagraph(new Paragraph({
              children: [new TextRun(block.content)],
            }));
          } else if (block.type === "image" && block.content) {
            try {
              const imageBuffer = Buffer.from(block.content.b64_json, "base64");
              const image = new ImageRun({
                data: imageBuffer,
                transformation: {
                  width: 500,
                  height: 300,
                },
              });
              doc.addParagraph(new Paragraph({
                children: [image],
              }));
            } catch (imageError) {
              console.error("Error adding image:", imageError);
            }
          }
        }
        // Add a page break after each page, except the last one
        if (page !== pages[pages.length - 1]) {
          doc.addParagraph(new Paragraph({ pageBreakBefore: true }));
        }
      }

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "storybook.docx");
    } catch (error) {
      console.error("Error generating DOCX:", error);
      alert("An error occurred while generating the document. Please try again.");
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  const startStory = () => {
    if (storyPrompt.trim() === "") {
      alert("Please enter an initial story prompt.");
      return;
    }
    setHasStartedStory(true);
    addNewPage();
  };

  const updatePageContent = (language: string, pageIndex: number, newContent: PageContent) => {
    setLanguageVersions(prevVersions => 
      prevVersions.map(version => 
        version.language === language
          ? {
              ...version,
              pages: version.pages.map((page, index) => 
                index === pageIndex ? newContent : page
              )
            }
          : version
      )
    );
    updateFinalPreview(language, pageIndex, newContent);
  };

  const applyFormatting = (pageIndex: number, blockIndex: number, format: 'bold' | 'italic' | 'underline') => {
    setPages((prevPages) => {
      const newPages = [...prevPages];
      const block = newPages[pageIndex].blocks[blockIndex];
      if (block.type === 'text') {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const selectedText = range.toString();
          const formattedText = `<${format}>${selectedText}</${format}>`;
          block.content = block.content.replace(selectedText, formattedText);
        }
      }
      return newPages;
    });
  };

  // Function to convert Quill content to HTML
  const convertDeltaToHtml = (content: string) => {
    // This is a simple conversion. You might need a more robust solution depending on your Quill configuration
    return content.replace(/\n/g, '<br>');
  };

  // Function to update final preview
  const updateFinalPreview = (language: string, pageIndex: number, newContent: PageContent) => {
    setLanguageVersions(prevVersions => 
      prevVersions.map(version => 
        version.language === language
          ? {
              ...version,
              pages: version.pages.map((page, index) => 
                index === pageIndex
                  ? {
                      blocks: page.blocks.map(block => 
                        block.type === 'text'
                          ? { ...block, content: convertDeltaToHtml(block.content) }
                          : block
                      )
                    }
                  : page
              )
            }
          : version
      )
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header style={{ display: "flex", justifyContent: "center", paddingTop: "5rem" }}>
        <div style={{ position: "absolute", top: "1.5rem", left: "50%", transform: "translateX(-50%)" }}>
          <a href="https://www.dub.sh/together-ai" target="_blank">
            <Logo />
          </a>
        </div>
        <div>
          <label style={{ fontSize: "0.75rem", color: "#e5e7eb" }}>
            [Optional] Add your{" "}
            <a
              href="https://api.together.xyz/settings/api-keys"
              target="_blank"
              style={{
                textDecoration: "underline",
                textUnderlineOffset: "0.25rem",
                transition: "color 0.2s",
                color: "inherit",
              }}
            >
              Together API Key
            </a>
          </label>
          <Input
            placeholder="API Key"
            type="password"
            value={userAPIKey}
            style={{
              marginTop: "0.25rem",
              backgroundColor: "#9ca3af",
              color: "#e5e7eb",
              placeholderColor: "#d1d5db",
            }}
            onChange={(e) => setUserAPIKey(e.target.value)}
          />
        </div>
      </header>

      {!hasStartedStory ? (
        <div style={{ marginTop: "2.5rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>What kind of story would you like to create?</h2>
          <textarea
            value={storyPrompt}
            onChange={(e) => setStoryPrompt(e.target.value)}
            placeholder="E.g., A magical adventure in a world where animals can talk..."
            style={{
              width: "100%",
              maxWidth: "600px",
              height: "150px",
              padding: "0.5rem",
              marginBottom: "1rem",
              borderRadius: "0.375rem",
              border: "1px solid #d1d5db",
            }}
          />
          <Button onClick={startStory}>Start Story</Button>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <select 
              value={activeLanguage} 
              onChange={(e) => setActiveLanguage(e.target.value)}
              style={{ marginRight: "1rem" }}
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <input 
              type="text" 
              placeholder="Add new language"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addLanguage(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
            <button onClick={() => removeLanguage(activeLanguage)} disabled={languages.length === 1}>
              Remove Language
            </button>
          </div>

          <div style={{ display: "flex", height: "calc(100vh - 150px)", overflow: "hidden" }}>
            {/* Editing Panel */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem", borderRight: "1px solid #d1d5db", backgroundColor: "#f9fafb" }}>
              <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", alignItems: "center" }}>
                  <Button onClick={addNewPage}>Add New Page</Button>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <label htmlFor="imageCount" style={{ marginRight: "0.5rem", color: "#4b5563" }}>Images per text:</label>
                    <Input
                      id="imageCount"
                      type="number"
                      min="1"
                      max="5"
                      value={imageCount}
                      onChange={(e) => setImageCount(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                      style={{ width: "60px", marginRight: "0.5rem" }}
                    />
                  </div>
                </div>
                {languageVersions.find(v => v.language === activeLanguage)?.pages.map((page, index) => (
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
                      setLanguageVersions(prevVersions => 
                        prevVersions.map(version => ({
                          ...version,
                          pages: version.pages.filter((_, i) => i !== index)
                        }))
                      );
                    }}
                    language={activeLanguage}
                  />
                ))}
              </div>
            </div>

            {/* Book Preview */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem", backgroundColor: "#f3f4f6" }}>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#1f2937", textAlign: "center" }}>Book Preview ({activeLanguage})</h2>
              <div style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#fff", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", borderRadius: "0.5rem", overflow: "hidden" }}>
                {languageVersions.find(v => v.language === activeLanguage)?.pages.map((page, pageIndex) => (
                  <div key={pageIndex} style={{ padding: "2rem", borderBottom: pageIndex < page.blocks.length - 1 ? "1px solid #e5e7eb" : "none" }}>
                    <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#4b5563", textAlign: "center" }}>Page {pageIndex + 1}</h3>
                    {page.blocks.map((block, blockIndex) => (
                      <div key={blockIndex} style={{ marginBottom: "1rem" }}>
                        {block.type === "text" ? (
                          <ReactQuill
                            value={block.content}
                            onChange={(content) => {
                              const newPage = {...page};
                              newPage.blocks[blockIndex].content = content;
                              updatePageContent(activeLanguage, pageIndex, newPage);
                            }}
                            modules={{
                              toolbar: [
                                ['bold', 'italic', 'underline'],
                                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                ['clean']
                              ]
                            }}
                            style={{ 
                              height: "auto", 
                              marginBottom: "1rem",
                              color: "#374151",
                              fontSize: "1rem",
                            }}
                          />
                        ) : block.type === "image" && block.content ? (
                          <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem", marginBottom: "1rem" }}>
                            <Image
                              src={`data:image/png;base64,${block.content.b64_json}`}
                              alt=""
                              width={300}
                              height={225}
                              style={{ borderRadius: "0.25rem", maxWidth: "100%", height: "auto", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" }}
                            />
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Final Preview */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem", backgroundColor: "#e5e7eb" }}>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#1f2937", textAlign: "center" }}>Final Preview ({activeLanguage})</h2>
              <div style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#fff", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", borderRadius: "0.5rem", overflow: "hidden" }}>
                {languageVersions.find(v => v.language === activeLanguage)?.pages.map((page, pageIndex) => (
                  <div key={pageIndex} style={{ padding: "2rem", borderBottom: pageIndex < page.blocks.length - 1 ? "1px solid #e5e7eb" : "none" }}>
                    <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#4b5563", textAlign: "center" }}>Page {pageIndex + 1}</h3>
                    {page.blocks.map((block, blockIndex) => (
                      <div key={blockIndex} style={{ marginBottom: "1rem" }}>
                        {block.type === "text" ? (
                          <div>
                            <div dangerouslySetInnerHTML={{ __html: block.content }} style={{ 
                              lineHeight: "1.6", 
                              color: "#374151",
                              fontSize: "1rem",
                            }} />
                            <TTSButton text={block.content} language={activeLanguage} />
                          </div>
                        ) : block.type === "image" && block.content ? (
                          <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem", marginBottom: "1rem" }}>
                            <Image
                              src={`data:image/png;base64,${block.content.b64_json}`}
                              alt=""
                              width={300}
                              height={225}
                              style={{ borderRadius: "0.25rem", maxWidth: "100%", height: "auto", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" }}
                            />
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <footer style={{ marginTop: "4rem", paddingBottom: "2.5rem", textAlign: "center", color: "#d1d5db" }}>
        <p>
          Powered by{" "}
          <a
            href="https://www.dub.sh/together-ai"
            target="_blank"
            style={{
              textDecoration: "underline",
              textUnderlineOffset: "0.25rem",
              transition: "color 0.2s",
              color: "inherit",
            }}
          >
            Together.ai
          </a>{" "}
          &{" "}
          <a
            href="https://dub.sh/together-flux"
            target="_blank"
            style={{
              textDecoration: "underline",
              textUnderlineOffset: "0.25rem",
              transition: "color 0.2s",
              color: "inherit",
            }}
          >
            Flux
          </a>
        </p>

        <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <p style={{ display: "none" }}>
            100% free and{" "}
            <a
              href="https://github.com/Nutlope/blinkshot"
              target="_blank"
              style={{
                textDecoration: "underline",
                textUnderlineOffset: "0.25rem",
                transition: "color 0.2s",
                color: "inherit",
              }}
            >
              open source
            </a>
          </p>

          <div style={{ display: "flex", gap: "1.5rem" }}>
            <a href="https://github.com/Nutlope/blinkshot" target="_blank">
              <Button
                variant="outline"
                size="sm"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <GithubIcon style={{ width: "1rem", height: "1rem" }} />
                GitHub
              </Button>
            </a>
            <a href="https://x.com/nutlope" target="_blank">
              <Button
                variant="outline"
                size="sm"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <XIcon style={{ width: "1rem", height: "1rem" }} />
                Twitter
              </Button>
            </a>
          </div>
        </div>
        <Button
          onClick={downloadBook}
          style={{ marginTop: "1rem" }}
          disabled={isGeneratingDocx}
        >
          {isGeneratingDocx ? (
            <>
              <Spinner style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }} />
              Generating Document...
            </>
          ) : (
            <>
              <Download style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }} />
              Download Book
            </>
          )}
        </Button>
      </footer>
    </div>
  );
}

// Update the Page component to include a delete button for the entire page
function Page({
  index,
  page,
  setPageContent,
  userAPIKey,
  iterativeMode,
  isGeneratingDocx,
  storyPrompt,
  imageCount,
  onDeletePage,
}: PageProps & { imageCount: number; onDeletePage: () => void }) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(page.blocks);
  const [selectedText, setSelectedText] = useState<{ blockIndex: number; text: string } | null>(null);

  useEffect(() => {
    setPageContent({ blocks });
  }, [blocks]);

  // Function to handle text selection
  const handleTextSelection = (blockIndex: number, e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    if (selectedText) {
      setSelectedText({
        blockIndex,
        text: selectedText,
      });
    }
  };

  // Function to add a new block
  const addBlock = (type: "text" | "image", afterIndex?: number) => {
    const newBlock: ContentBlock =
      type === "text"
        ? { type: "text", content: "", generating: false, context: selectedText?.text || "" }
        : { type: "image", content: null, generating: false, prompt: "" };
    
    setBlocks((prevBlocks) => {
      const newBlocks = [...prevBlocks];
      let insertIndex = afterIndex !== undefined ? afterIndex + 1 : newBlocks.length;
      
      // If adding a text block, find the last image block after the current index
      if (type === "text") {
        const lastImageIndex = newBlocks.slice(insertIndex).findIndex(
          (block) => block.type !== "image"
        );
        if (lastImageIndex !== -1) {
          insertIndex += lastImageIndex;
        } else {
          insertIndex = newBlocks.length;
        }
      }
      
      newBlocks.splice(insertIndex, 0, newBlock);

      if (type === "text" && selectedText) {
        // Automatically generate text for the new block using the selected text as context
        setTimeout(() => generateTextWithContext(insertIndex, selectedText.text), 0);
      }

      return newBlocks;
    });
  };

  // Function to update a text block and trigger auto-generation
  const updateTextBlock = (blockIndex: number, content: string) => {
    setBlocks((prevBlocks) => {
      const newBlocks = [...prevBlocks];
      if (newBlocks[blockIndex].type === "text") {
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

  const handleTextChange = (blockIndex: number, content: string) => {
    updateTextBlock(blockIndex, content);
  };

  // Debounced function for text auto-generation
  const autoGenerateText = useDebouncedCallback(
    async (blockIndex: number, content: string) => {
      if (content.trim() === "") return;

      // Set generating state to true
      setBlocks((prevBlocks) => {
        const newBlocks = [...prevBlocks];
        if (newBlocks[blockIndex].type === "text") {
          newBlocks[blockIndex] = {
            ...newBlocks[blockIndex],
            generating: true,
          };
        }
        return newBlocks;
      });

      try {
        const response = await fetch("/api/generateText", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: content }),
        });
        if (!response.ok) throw new Error("Failed to generate text");
        const data = await response.json();
        const newText = content + " " + data.text;

        // Update the text block
        setBlocks((prevBlocks) => {
          const updatedBlocks = [...prevBlocks];
          if (updatedBlocks[blockIndex].type === "text") {
            updatedBlocks[blockIndex] = {
              ...updatedBlocks[blockIndex],
              content: newText,
              generating: false,
            };
          }
          return updatedBlocks;
        });

        // Automatically trigger image generation with the new text
        generateImageForTextBlock(blockIndex, newText);
      } catch (error) {
        console.error("Error generating text:", error);
        setBlocks((prevBlocks) => {
          const updatedBlocks = [...prevBlocks];
          if (updatedBlocks[blockIndex].type === "text") {
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

  // Modified function to generate multiple images
  const generateImageForTextBlock = useDebouncedCallback(
    async (blockIndex: number, content: string) => {
      if (content.trim() === "") return;

      // Create a local copy of imageCount to ensure consistency
      const imagesToGenerate = imageCount;

      // Find the index of the first image block after the text block
      const firstImageIndex = blocks.findIndex((block, index) => index > blockIndex && block.type === "image");

      // Calculate how many new images we need to generate
      const existingImages = firstImageIndex !== -1 ? blocks.slice(firstImageIndex).filter(block => block.type === "image").length : 0;
      const newImagesToGenerate = Math.max(0, imagesToGenerate - existingImages);

      // Generate new image blocks
      for (let i = 0; i < newImagesToGenerate; i++) {
        const newImageBlock: ContentBlock = {
          type: "image",
          content: null,
          generating: true,
          prompt: content
        };

        setBlocks((prevBlocks) => [
          ...prevBlocks.slice(0, firstImageIndex !== -1 ? firstImageIndex + existingImages + i : blockIndex + 1 + i),
          newImageBlock,
          ...prevBlocks.slice(firstImageIndex !== -1 ? firstImageIndex + existingImages + i : blockIndex + 1 + i)
        ]);

        try {
          const imageResponse = await fetch("/api/generateImages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: content,
              userAPIKey,
              iterativeMode,
            }),
          });
          if (!imageResponse.ok) throw new Error("Failed to generate image");
          const imageData = (await imageResponse.json()) as ImageResponse;

          setBlocks((prevBlocks) => {
            const updatedBlocks = [...prevBlocks];
            const currentImageIndex = firstImageIndex !== -1 ? firstImageIndex + existingImages + i : blockIndex + 1 + i;
            if (updatedBlocks[currentImageIndex] && updatedBlocks[currentImageIndex].type === "image") {
              updatedBlocks[currentImageIndex] = {
                ...updatedBlocks[currentImageIndex],
                content: imageData,
                generating: false,
              };
            }
            return updatedBlocks;
          });
        } catch (error) {
          console.error("Error generating image:", error);
          setBlocks((prevBlocks) => {
            const updatedBlocks = [...prevBlocks];
            const currentImageIndex = firstImageIndex !== -1 ? firstImageIndex + existingImages + i : blockIndex + 1 + i;
            if (updatedBlocks[currentImageIndex] && updatedBlocks[currentImageIndex].type === "image") {
              updatedBlocks[currentImageIndex] = {
                ...updatedBlocks[currentImageIndex],
                generating: false,
              };
            }
            return updatedBlocks;
          });
        }
      }

      // Remove excess image blocks if imageCount has decreased
      if (existingImages > imagesToGenerate) {
        setBlocks((prevBlocks) => {
          const newBlocks = [...prevBlocks];
          newBlocks.splice(firstImageIndex + imagesToGenerate, existingImages - imagesToGenerate);
          return newBlocks;
        });
      }
    },
    2000
  );

  // New function to delete a block
  const deleteBlock = (blockIndex: number) => {
    setBlocks((prevBlocks) => prevBlocks.filter((_, index) => index !== blockIndex));
  };

  // New function to generate text with context
  const generateTextWithContext = async (blockIndex: number, context: string) => {
    setBlocks((prevBlocks) => {
      const newBlocks = [...prevBlocks];
      if (newBlocks[blockIndex].type === "text") {
        newBlocks[blockIndex] = {
          ...newBlocks[blockIndex],
          generating: true,
        };
      }
      return newBlocks;
    });

    try {
      const response = await fetch("/api/generateText", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: context, 
          storyPrompt: storyPrompt,
          previousContent: blocks.slice(0, blockIndex)
            .filter(block => block.type === "text")
            .map(block => block.content.replace(/<[^>]*>/g, '')) // Strip HTML tags
            .join("\n")
        }),
      });
      if (!response.ok) throw new Error("Failed to generate text");
      const data = await response.json();

      setBlocks((prevBlocks) => {
        const newBlocks = [...prevBlocks];
        if (newBlocks[blockIndex].type === "text") {
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
      console.error("Error generating text:", error);
      setBlocks((prevBlocks) => {
        const newBlocks = [...prevBlocks];
        if (newBlocks[blockIndex].type === "text") {
          newBlocks[blockIndex] = {
            ...newBlocks[blockIndex],
            generating: false,
          };
        }
        return newBlocks;
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      autoGenerateText.cancel();
      generateImageForTextBlock.cancel();
    };
  }, []);

  return (
    <div className="book-page" style={{ border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "1rem", backgroundColor: "white" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <h3>Page {index + 1}</h3>
        <Button onClick={onDeletePage} size="sm" variant="destructive">
          <Trash2 style={{ width: "1rem", height: "1rem", marginRight: "0.25rem" }} />
          Delete Page
        </Button>
      </div>
      {!isGeneratingDocx && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", alignItems: "center" }}>
          <div>
            <Button onClick={() => addBlock("text")} size="sm" style={{ marginRight: "0.5rem" }}>
              <Plus style={{ width: "1rem", height: "1rem", marginRight: "0.25rem" }} />
              Add Text
            </Button>
            <Button onClick={() => addBlock("image")} size="sm">
              <Plus style={{ width: "1rem", height: "1rem", marginRight: "0.25rem" }} />
              Add Image
            </Button>
          </div>
        </div>
      )}
      {blocks.map((block, idx) => {
        if (block.type === "text") {
          return (
            <div key={idx} style={{ marginBottom: "1rem", position: "relative" }}>
              <textarea
                value={block.content}
                onChange={(e) => handleTextChange(idx, e.target.value)}
                onMouseUp={(e) => handleTextSelection(idx, e)}
                disabled={isGeneratingDocx}
                style={{ 
                  width: "100%",
                  minHeight: "100px",
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.25rem",
                  resize: "vertical"
                }}
              />
              {!isGeneratingDocx && (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
                  <Button
                    onClick={() => deleteBlock(idx)}
                    size="sm"
                    variant="destructive"
                  >
                    <Trash2 style={{ width: "1rem", height: "1rem", marginRight: "0.25rem" }} />
                    Delete
                  </Button>
                  <Button
                    onClick={() => addBlock("text", idx)}
                    size="sm"
                    disabled={!selectedText || selectedText.blockIndex !== idx}
                  >
                    <Plus style={{ width: "1rem", height: "1rem", marginRight: "0.25rem" }} />
                    Continue Story
                  </Button>
                </div>
              )}
              {block.generating && !isGeneratingDocx && (
                <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center" }}>
                  <Spinner style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }} />
                  <span>Generating text...</span>
                </div>
              )}
              {block.context && (
                <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.5rem" }}>
                  Context: {block.context}
                </div>
              )}
            </div>
          );
        } else if (block.type === "image") {
          return (
            <div key={idx} style={{ marginBottom: "1rem", position: "relative" }}>
              {block.generating ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
                  <Spinner />
                  <span style={{ marginLeft: "0.5rem" }}>Generating image...</span>
                </div>
              ) : block.content ? (
                <>
                  <Image
                    src={`data:image/png;base64,${block.content.b64_json}`}
                    alt=""
                    width={400}
                    height={300}
                    style={{ borderRadius: "0.5rem", maxWidth: "100%", height: "auto" }}
                  />
                  {!isGeneratingDocx && (
                    <Button
                      onClick={() => deleteBlock(idx)}
                      size="sm"
                      variant="destructive"
                      style={{ position: "absolute", top: "0.5rem", right: "0.5rem" }}
                    >
                      <Trash2 style={{ width: "1rem", height: "1rem" }} />
                    </Button>
                  )}
                </>
              ) : null}
            </div>
          );
        } else {
          return null;
        }
      })}
    </div>
  );
}