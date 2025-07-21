"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown, X, MessageSquare } from "lucide-react";

interface FeedbackToastProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (feedback: {
    type: "positive" | "negative" | null;
    text: string;
    suggestions: string;
  }) => void;
}

export default function FeedbackToast({
  isVisible,
  onClose,
  onSubmit,
}: FeedbackToastProps) {
  const [feedbackType, setFeedbackType] = useState<
    "positive" | "negative" | null
  >(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Reset state when toast becomes visible
  useEffect(() => {
    if (isVisible) {
      setFeedbackType(null);
      setFeedbackText("");
      setSuggestions("");
      setIsSubmitted(false);
      setIsExpanded(false);
    }
  }, [isVisible]);

  const handleThumbsClick = (type: "positive" | "negative") => {
    setFeedbackType(type);
    setIsExpanded(true);
  };

  const handleSubmit = () => {
    onSubmit({ type: feedbackType, text: feedbackText, suggestions });
    setIsSubmitted(true);

    // Auto close after 2 seconds
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full">
      <Card className="shadow-lg border border-foreground bg-white">
        <CardContent className="p-4">
          {!isSubmitted ? (
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-foreground" />
                  <span className="font-medium text-sm">
                    How was this result?
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <X size={14} />
                </Button>
              </div>

              {/* Thumbs buttons */}
              {!isExpanded && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleThumbsClick("positive")}
                    className={`flex items-center gap-1 h-8 ${
                      feedbackType === "positive"
                        ? "bg-green-50 border-green-300 text-green-700"
                        : "hover:bg-green-50"
                    }`}
                  >
                    <ThumbsUp size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleThumbsClick("negative")}
                    className={`flex items-center gap-1 h-8 ${
                      feedbackType === "negative"
                        ? "bg-red-50 border-red-300 text-red-700"
                        : "hover:bg-red-50"
                    }`}
                  >
                    <ThumbsDown size={14} />
                  </Button>
                </div>
              )}

              {/* Expanded form */}
              {isExpanded && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {feedbackType === "positive"
                        ? "Great!"
                        : "Thanks for letting us know."}
                    </span>
                    {feedbackType === "positive" ? (
                      <ThumbsUp size={14} className="text-green-600" />
                    ) : (
                      <ThumbsDown size={14} className="text-red-600" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700">
                      Your feedback:
                    </label>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Tell us more about your experience..."
                      className="w-full text-xs border border-gray-200 rounded p-2 min-h-[60px] resize-none focus:outline-none focus:border-gray-400"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700">
                      Suggestions for improvement:
                    </label>
                    <textarea
                      value={suggestions}
                      onChange={(e) => setSuggestions(e.target.value)}
                      placeholder="Any suggestions for improvement?"
                      className="w-full text-xs border border-gray-200 rounded p-2 min-h-[60px] resize-none focus:outline-none focus:border-gray-400"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmit}
                      size="sm"
                      className="flex-1 h-8 text-xs bg-foreground text-background hover:bg-gray-800"
                    >
                      Submit Feedback
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Thank you message */
            <div className="text-center py-2">
              <div className="text-green-600 font-medium text-sm mb-1">
                Thank you for your feedback!
              </div>
              <div className="text-xs text-gray-500">
                This helps us improve our results.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
