"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Globe } from "lucide-react";

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
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  // Combine all busy states for UI feedback
  const isBusy = isLoading || (!isSignedIn && limiterLoading);

  // Animate progress bar with a fixed timer when busy
  useEffect(() => {
    if (isBusy) {
      setProgress(0);
      if (progressRef.current) clearInterval(progressRef.current);
      progressRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev < 100) {
            return Math.min(prev + 2, 95); // Stop at 95% until actually done
          }
          return prev;
        });
      }, 50);
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

  return (
    <Card className="mb-[1rem] rounded-sm shadow-none w-full border-foreground p-4">
      <div className="space-y-4">
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="e.g., 'Vitamin D deficiency is linked to increased risk of depression' or 'Climate change is causing more frequent extreme weather events'"
          className="w-full focus:outline-none min-h-[160px] resize-y"
          disabled={isBusy}
        />

        {error && <div className="text-red-500 text-sm">{error}</div>}

        {/* Button or Progress Bar */}
        {isBusy ? (
          <div className="w-full flex flex-col items-center justify-center">
            <div className="w-full bg-white border border-foreground h-8 flex items-center relative overflow-hidden">
              <div
                className="absolute left-0 top-0 inset-0 w-full bg-[#C5C8FF] transition-all duration-200"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleSubmit}
            className="w-full py-3 text-[1rem] rounded-none border border-foreground bg-foreground text-background flex items-center gap-2 cursor-pointer"
            disabled={
              isBusy || (!isSignedIn && limiterLoading) || !statement.trim()
            }
          >
            fact check
            <Globe size={16} />
          </Button>
        )}
      </div>
    </Card>
  );
};

export default FactCheckForm;
