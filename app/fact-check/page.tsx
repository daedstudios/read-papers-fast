"use client";

import React, { useState } from "react";
import FeedbackToast from "@/components/fact-check-components/Feddback";
import { Button } from "@/components/ui/button";

const page = () => {
  const [showFeedback, setShowFeedback] = useState(false);

  const handleFeedbackSubmit = (feedback: {
    type: "positive" | "negative" | null;
    text: string;
    suggestions: string;
  }) => {
    console.log("Feedback received:", feedback);
    // You can add additional handling here if needed
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Fact Check Page</h1>

      <div className="space-y-4">
        <p>This is a demo page showing how the feedback component works.</p>

        <Button
          onClick={() => setShowFeedback(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          Show Feedback Toast
        </Button>
      </div>

      <FeedbackToast
        isVisible={showFeedback}
        onClose={() => setShowFeedback(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
};

export default page;
