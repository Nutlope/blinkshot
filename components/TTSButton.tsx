import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";

interface TTSButtonProps {
  text: string;
  language: string;
}

const TTSButton: React.FC<TTSButtonProps> = ({ text, language }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    speechSynthesisRef.current = window.speechSynthesis;
    return () => {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, []);

  const speakText = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesisRef.current.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const stopSpeaking = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <Button
      onClick={() => isSpeaking ? stopSpeaking() : speakText()}
      size="sm"
      style={{ marginTop: "0.5rem" }}
    >
      {isSpeaking ? "Stop" : "Read Aloud"}
    </Button>
  );
};

export default TTSButton;
