// pages/index.tsx

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/spinner";
import { Plus, Download } from "lucide-react";
import GithubIcon from "@/components/icons/github-icon";
import XIcon from "@/components/icons/x-icon";
import Logo from "@/components/logo";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type ImageResponse = {
  b64_json: string;
  timings: { inference: number };
};

type ContentBlock =
  | { type: "text"; content: string; generating: boolean }
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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Function to add a new page
  const addNewPage = () => {
    setPages((prevPages) => [...prevPages, { blocks: [] }]);
  };

  // Implement book download functionality
  const downloadBook = async () => {
    try {
      setIsGeneratingPDF(true);
      const pdf = new jsPDF();
      const pageElements = document.getElementsByClassName("book-page");

      for (let i = 0; i < pageElements.length; i++) {
        const pageElement = pageElements[i] as HTMLElement;

        // Scroll to the element to ensure it's in view
        pageElement.scrollIntoView();

        // Wait for any images to load
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Use html2canvas to capture the page
        const canvas = await html2canvas(pageElement, {
          scale: 2,
          useCORS: true,
        });

        const imgData = canvas.toDataURL("image/png");
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save("storybook.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("An error occurred while generating the PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
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
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <>
                <Spinner
                  style={{
                    width: "1rem",
                    height: "1rem",
                    marginRight: "0.5rem",
                  }}
                />
                Generating PDF...
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
              isGeneratingPDF={isGeneratingPDF} // Pass isGeneratingPDF prop
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
  isGeneratingPDF: boolean; // Add isGeneratingPDF prop
};

function Page({
  index,
  page,
  setPageContent,
  userAPIKey,
  iterativeMode,
  isGeneratingPDF,
}: PageProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(page.blocks);

  useEffect(() => {
    setPageContent({ blocks });
  }, [blocks]);

  // Function to add a new block
  const addBlock = (type: "text" | "image") => {
    const newBlock: ContentBlock =
      type === "text"
        ? { type: "text", content: "", generating: false }
        : { type: "image", content: null, generating: false, prompt: "" };
    setBlocks((prevBlocks) => [...prevBlocks, newBlock]);
  };

  // Function to update a text block and trigger auto-generation
  const updateTextBlock = (blockIndex: number, content: string) => {
    setBlocks((prevBlocks) => {
      const newBlocks = [...prevBlocks];
      (
        newBlocks[blockIndex] as {
          type: "text";
          content: string;
          generating: boolean;
        }
      ).content = content;
      return newBlocks;
    });

    // Trigger text auto-generation
    autoGenerateText(blockIndex, content);

    // Trigger image generation based on text
    generateImageForTextBlock(blockIndex, content);
  };

  // Handler for contentEditable div
  const handleTextChange = (
    blockIndex: number,
    event: React.FormEvent<HTMLDivElement>
  ) => {
    const content = event.currentTarget.textContent || "";
    updateTextBlock(blockIndex, content);
  };

  // Debounced function for text auto-generation
  const autoGenerateText = useDebouncedCallback(
    async (blockIndex: number, content: string) => {
      if (content.trim() === "") return;

      // Set generating state to true
      setBlocks((prevBlocks) => {
        const newBlocks = [...prevBlocks];
        newBlocks[blockIndex] = {
          ...newBlocks[blockIndex],
          generating: true,
        };
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
          updatedBlocks[blockIndex] = {
            type: "text",
            content: newText,
            generating: false,
          };
          return updatedBlocks;
        });
      } catch (error) {
        console.error("Error generating text:", error);
        setBlocks((prevBlocks) => {
          const updatedBlocks = [...prevBlocks];
          updatedBlocks[blockIndex] = {
            ...updatedBlocks[blockIndex],
            generating: false,
          };
          return updatedBlocks;
        });
      }
    },
    1000 // Wait 1 second after the user stops typing
  );

  // Debounced function for image generation based on text block
  const generateImageForTextBlock = useDebouncedCallback(
    async (blockIndex: number, content: string) => {
      if (content.trim() === "") return;

      // Find the next image block
      const imageBlockIndex = blocks.findIndex(
        (block, idx) => block.type === "image" && idx > blockIndex
      );

      if (imageBlockIndex !== -1) {
        const imageBlock = blocks[imageBlockIndex];
        if (imageBlock.type !== "image") return;

        // Set generating state to true
        setBlocks((prevBlocks) => {
          const newBlocks = [...prevBlocks];
          newBlocks[imageBlockIndex] = { ...imageBlock, generating: true };
          return newBlocks;
        });

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

          // Update the image block
          setBlocks((prevBlocks) => {
            const updatedBlocks = [...prevBlocks];
            updatedBlocks[imageBlockIndex] = {
              ...imageBlock,
              content: imageData,
              generating: false,
              prompt: content,
            };
            return updatedBlocks;
          });
        } catch (error) {
          console.error("Error generating image:", error);
          setBlocks((prevBlocks) => {
            const updatedBlocks = [...prevBlocks];
            updatedBlocks[imageBlockIndex] = {
              ...updatedBlocks[imageBlockIndex],
              generating: false,
            };
            return updatedBlocks;
          });
        }
      }
    },
    2000 // Wait 2 seconds after the user stops typing
  );

  // Debounced function to generate image for an image block
  const generateImageForBlock = useDebouncedCallback(
    async (blockIndex: number) => {
      const block = blocks[blockIndex];
      if (block.type !== "image") return;

      const prompt = block.prompt.trim();
      if (prompt === "") return;

      // Set generating state to true
      setBlocks((prevBlocks) => {
        const newBlocks = [...prevBlocks];
        newBlocks[blockIndex] = { ...block, generating: true };
        return newBlocks;
      });

      try {
        const imageResponse = await fetch("/api/generateImages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, userAPIKey, iterativeMode }),
        });
        if (!imageResponse.ok) throw new Error("Failed to generate image");
        const imageData = (await imageResponse.json()) as ImageResponse;

        // Update the image block
        setBlocks((prevBlocks) => {
          const updatedBlocks = [...prevBlocks];
          updatedBlocks[blockIndex] = {
            ...block,
            content: imageData,
            generating: false,
          };
          return updatedBlocks;
        });
      } catch (error) {
        console.error("Error generating image:", error);
        setBlocks((prevBlocks) => {
          const updatedBlocks = [...prevBlocks];
          updatedBlocks[blockIndex] = { ...block, generating: false };
          return updatedBlocks;
        });
      }
    },
    2000 // Wait 2 seconds after the user stops typing
  );

  // Function to update the prompt for an image block and generate image
  const updateImagePrompt = (index: number, prompt: string) => {
    setBlocks((prevBlocks) => {
      const newBlocks = [...prevBlocks];
      (newBlocks[index] as { type: "image"; prompt: string }).prompt = prompt;
      return newBlocks;
    });
    // Trigger image generation
    generateImageForBlock(index);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      autoGenerateText.cancel();
      generateImageForTextBlock.cancel();
      generateImageForBlock.cancel();
    };
  }, []);

  return (
    <div
      className="book-page"
      style={{
        border: "1px solid #d1d5db",
        borderRadius: "0.5rem",
        padding: "1rem",
        backgroundColor: "white",
      }}
    >
      {!isGeneratingPDF && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "0.5rem",
          }}
        >
          <Button
            onClick={() => addBlock("text")}
            size="sm"
            style={{ marginRight: "0.5rem" }}
          >
            <Plus
              style={{ width: "1rem", height: "1rem", marginRight: "0.25rem" }}
            />
            Add Text
          </Button>
          <Button onClick={() => addBlock("image")} size="sm">
            <Plus
              style={{ width: "1rem", height: "1rem", marginRight: "0.25rem" }}
            />
            Add Image
          </Button>
        </div>
      )}
      {blocks.map((block, idx) => {
        if (block.type === "text") {
          return (
            <div key={idx} style={{ marginBottom: "1rem" }}>
              <div
                contentEditable={!isGeneratingPDF}
                suppressContentEditableWarning
                style={{
                  width: "100%",
                  minHeight: "100px",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  backgroundColor: "#e5e7eb",
                  padding: "1rem",
                  fontSize: "1rem",
                  color: "#374151",
                  overflowWrap: "break-word",
                  outline: "none",
                  pointerEvents: isGeneratingPDF ? "none" : "auto",
                }}
                onInput={(e) => handleTextChange(idx, e)}
              >
                {block.content}
              </div>
              {block.generating && !isGeneratingPDF && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Spinner
                    style={{
                      width: "1rem",
                      height: "1rem",
                      marginRight: "0.5rem",
                    }}
                  />
                  <span>Generating text...</span>
                </div>
              )}
            </div>
          );
        } else if (block.type === "image") {
          return (
            <div key={idx} style={{ marginBottom: "1rem" }}>
              {!isGeneratingPDF && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <Input
                    value={block.prompt}
                    onChange={(e) => updateImagePrompt(idx, e.target.value)}
                    placeholder="Describe the image..."
                    style={{ flexGrow: 1 }}
                  />
                  {block.generating && (
                    <Spinner
                      style={{
                        width: "1rem",
                        height: "1rem",
                        marginLeft: "0.5rem",
                      }}
                    />
                  )}
                </div>
              )}
              {block.generating && !isGeneratingPDF ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Spinner style={{ width: "2rem", height: "2rem" }} />
                  <p style={{ marginTop: "0.5rem" }}>Generating image...</p>
                </div>
              ) : block.content ? (
                <Image
                  src={`data:image/png;base64,${block.content.b64_json}`}
                  alt=""
                  width={400}
                  height={300}
                  style={{
                    borderRadius: "0.5rem",
                    maxWidth: "100%",
                    height: "auto",
                  }}
                />
              ) : !isGeneratingPDF ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <p style={{ marginTop: "0.5rem", color: "#6b7280" }}>
                    Image will appear here
                  </p>
                </div>
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