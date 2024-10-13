// pages/index.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/spinner";
import { Plus, Download, Trash2 } from "lucide-react";
import GithubIcon from "@/components/icons/github-icon";
import XIcon from "@/components/icons/x-icon";
import Logo from "@/components/logo";
import { Document, Packer, Paragraph, TextRun, ImageRun } from "docx";
import { saveAs } from "file-saver";

import { Buffer } from 'buffer';
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

export default function Home() {
  const [userAPIKey, setUserAPIKey] = useState("");
  const [iterativeMode, setIterativeMode] = useState(false);
  const [pages, setPages] = useState<PageContent[]>([]);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);

  // Function to add a new page
  const addNewPage = () => {
    setPages((prevPages) => [...prevPages, { blocks: [] }]);
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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "0 1.25rem",
        height: "100%",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: "5rem",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "1.5rem",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
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

      <div style={{ marginTop: "2.5rem" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button onClick={addNewPage}>Add New Page</Button>
          <Button
            onClick={downloadBook}
            style={{ marginLeft: "1rem" }}
            disabled={isGeneratingDocx}
          >
            {isGeneratingDocx ? (
              <>
                <Spinner
                  style={{
                    width: "1rem",
                    height: "1rem",
                    marginRight: "0.5rem",
                  }}
                />
                Generating Document...
              </>
            ) : (
              <>
                <Download
                  style={{
                    width: "1rem",
                    height: "1rem",
                    marginRight: "0.5rem",
                  }}
                />
                Download Book
              </>
            )}
          </Button>
        </div>
        <div
          style={{
            marginTop: "2rem",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "2rem",
          }}
        >
          {pages.map((page, index) => (
            <Page
              key={index}
              index={index}
              page={page}
              setPageContent={(content) => {
                setPages((prevPages) => {
                  const newPages = [...prevPages];
                  newPages[index] = content;
                  return newPages;
                });
              }}
              userAPIKey={userAPIKey}
              iterativeMode={iterativeMode}
              isGeneratingDocx={isGeneratingDocx} // Pass isGeneratingDocx prop
            />
          ))}
        </div>
      </div>

      <footer
        style={{
          marginTop: "4rem",
          paddingBottom: "2.5rem",
          textAlign: "center",
          color: "#d1d5db",
        }}
      >
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

        <div
          style={{
            marginTop: "2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
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
      </footer>
    </div>
  );
}

type PageProps = {
  index: number;
  page: PageContent;
  setPageContent: (content: PageContent) => void;
  userAPIKey: string;
  iterativeMode: boolean;
  isGeneratingDocx: boolean; // Add isGeneratingDocx prop
};

function Page({
  index,
  page,
  setPageContent,
  userAPIKey,
  iterativeMode,
  isGeneratingDocx,
}: PageProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(page.blocks);
  const [imageCount, setImageCount] = useState(1); // New state for image count
  const [selectedText, setSelectedText] = useState<{ blockIndex: number; text: string } | null>(null);

  useEffect(() => {
    setPageContent({ blocks });
  }, [blocks]);

  // Function to handle text selection
  const handleTextSelection = (blockIndex: number) => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      setSelectedText({
        blockIndex,
        text: selection.toString(),
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

  // Replace handleTextChange with this new function
  const handleTextChange = (
    blockIndex: number,
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const content = event.target.value;
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
        body: JSON.stringify({ prompt: context }),
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
          <div style={{ display: "flex", alignItems: "center" }}>
            <label htmlFor="imageCount" style={{ marginRight: "0.5rem" }}>Images per text:</label>
            <Input
              id="imageCount"
              type="number"
              min="1"
              max="5"
              value={imageCount}
              onChange={(e) => setImageCount(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
              style={{ width: "60px", marginRight: "0.5rem" }}
            />
            <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              Generate {imageCount} image{imageCount > 1 ? 's' : ''} for each text block
            </span>
          </div>
        </div>
      )}
      {blocks.map((block, idx) => {
        if (block.type === "text") {
          return (
            <div key={idx} style={{ marginBottom: "1rem", position: "relative" }}>
              <textarea
                value={block.content}
                onChange={(e) => handleTextChange(idx, e)}
                onMouseUp={() => handleTextSelection(idx)}
                disabled={isGeneratingDocx}
                style={{ width: "100%", minHeight: "100px", border: "1px solid #d1d5db", borderRadius: "0.375rem", backgroundColor: "#e5e7eb", padding: "1rem", fontSize: "1rem", color: "#374151", resize: "vertical", outline: "none" }}
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