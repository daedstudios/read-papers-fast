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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset state when toast becomes visible
  useEffect(() => {
    if (isVisible) {
      setFeedbackType(null);
      setFeedbackText("");
      setSuggestions("");
      setIsSubmitted(false);
      setIsExpanded(false);
      setIsSubmitting(false);
      setSubmitError(null);
    }
  }, [isVisible]);

  const handleThumbsClick = (type: "positive" | "negative") => {
    setFeedbackType(type);
    setIsExpanded(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Call the API to save feedback
      const response = await fetch("/api/fact-check/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: feedbackType,
          text: feedbackText || null,
          suggestions: suggestions || null,
          sessionId: null, // You can pass a session ID if available
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Feedback saved successfully:", result);

        // Call the original onSubmit for any additional handling
        onSubmit({ type: feedbackType, text: feedbackText, suggestions });
        setIsSubmitted(true);

        // Auto close after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const errorData = await response.json();
        console.error("Failed to save feedback:", errorData);
        setSubmitError("Failed to save feedback. Please try again.");
      }
    } catch (error) {
      console.error("Error saving feedback:", error);
      setSubmitError("Network error. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-[300px] w-full">
      <Card className="shadow-lg rounded-sm  border border-foreground bg-white">
        <CardContent className="px-4">
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
                        ? "bg-green-50 border-C5C8FF text-C5C8FF"
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
                        ? "bg-red-50 border-[#FFBAD8] text-[#FFBAD8]"
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
                      <ThumbsUp size={14} className="text-foreground" />
                    ) : (
                      <ThumbsDown size={14} className="text-foreground" />
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

                  {/* <div className="space-y-2">
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
                  </div> */}

                  {submitError && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded border">
                      {submitError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      size="sm"
                      className="flex-1 h-8 text-xs border text-foreground rounded-sm border-foreground bg-[#C5C8FF] hover:bg-white hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Feedback"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Thank you message */
            <div className="text-center py-2">
              <div className="text-[#C] font-medium text-sm mb-1">
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
