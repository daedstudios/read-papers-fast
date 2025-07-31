"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Globe } from "lucide-react";
import VoiceInput from "@/components/VoiceInput";
import LanguageSelector from "@/components/LanguageSelector";

interface FactCheckFormProps {
  onSubmit: (statement: string) => void;
  isLoading?: boolean;
  error?: string | null;
  isSignedIn?: boolean;
  limiterLoading?: boolean;
}

const FactCheckForm = ({
  onSubmit,
  isLoading = false,
  error = null,
  isSignedIn = true,
  limiterLoading = false,
}: FactCheckFormProps) => {
  const [statement, setStatement] = useState("");
  const [progress, setProgress] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  // Combine all busy states for UI feedback
  const isBusy = isLoading;

  // Animate progress bar with a slower timer when busy (takes about 1 minute)
  useEffect(() => {
    if (isBusy) {
      setProgress(0);
      if (progressRef.current) clearInterval(progressRef.current);
      progressRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev < 95) {
            return Math.min(prev + 0.8, 95); // Very slow increment, stops at 95% until actually done
          }
          return prev;
        });
      }, 250); // 300ms interval for slower progression
    } else {
      setProgress(100);
      if (progressRef.current) clearInterval(progressRef.current);
    }
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isBusy]);

  const handleSubmit = () => {
    if (statement.trim()) {
      onSubmit(statement.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setStatement(transcript);
  };

  return (
    <Card className="mb-[1rem] rounded-sm shadow-none w-full border-foreground p-4">
      <div className="space-y-4">
        <div className="flex items-start gap-2">
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="e.g., 'Vitamin D deficiency is linked to increased risk of depression' or 'Climate change is causing more frequent extreme weather events'"
            className="flex-1 focus:outline-none min-h-[160px] resize-y"
            disabled={isBusy}
          />
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex flex-row gap-2 justify-end">
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            disabled={isBusy}
          />
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            disabled={isBusy}
            language={selectedLanguage}
          />
        </div>
        {/* Button or Progress Bar */}
        {isBusy ? (
          <div className="w-full flex flex-col items-center justify-center">
            <div className="w-full bg-white border border-foreground h-12 flex items-center relative overflow-hidden">
              <div
                className="absolute left-0 top-0 inset-0 w-full bg-muted transition-all duration-200"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleSubmit}
            className="w-full h-12 text-[1.5rem] rounded-none border border-foreground bg-foreground text-background flex items-center gap-2 cursor-pointer"
            disabled={isBusy || !statement.trim()}
          >
            fact check
            <Globe style={{ width: "24px", height: "24px" }} />
          </Button>
        )}
      </div>
    </Card>
  );
};

export default FactCheckForm;
