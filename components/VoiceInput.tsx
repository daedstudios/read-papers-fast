"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
  language?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  disabled = false,
  language = "en-US",
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = language;

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = "";
          let interimTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            onTranscript(finalTranscript);
            stopListening();
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setError(`Voice input error: ${event.error}`);
          stopListening();
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      } else {
        setIsSupported(false);
        setError("Voice input is not supported in this browser");
      }
    }
  }, [onTranscript]);

  const startListening = () => {
    if (!isSupported || disabled) return;

    try {
      setError(null);
      setIsListening(true);
      recognitionRef.current?.start();
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      setError("Failed to start voice input");
      setIsListening(false);
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
      setIsListening(false);
    } catch (err) {
      console.error("Error stopping speech recognition:", err);
    }
  };

  if (!isSupported) {
    return (
      <div className="text-sm text-muted-foreground">
        Voice input is not supported in this browser
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        className="flex items-center gap-2 border-foreground font-medium text-[1rem] rounded-none py-3 cursor-pointer"
      >
        {isListening ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Listening...
          </>
        ) : (
          <>
            <Mic className="h-4 w-4 font-medium" />
            Voice Input
          </>
        )}
      </Button>

      {/* {isListening && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          Speak now...
        </div>
      )} */}

      {error && <div className="text-sm text-red-500">{error}</div>}
    </div>
  );
};

export default VoiceInput;
