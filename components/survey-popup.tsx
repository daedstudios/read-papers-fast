"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "./AppContext";

const SurveyPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);
  const { searchTriggered } = useAppContext();

  useEffect(() => {
    // Check if survey has already been shown in this session
    const surveyShown = sessionStorage.getItem("surveyShown");
    if (surveyShown) {
      setHasBeenShown(true);
      return;
    }

    // Only show popup if search has been triggered
    if (!searchTriggered) {
      return;
    }

    // Show popup 10 seconds after search is triggered
    const timer = setTimeout(() => {
      setIsVisible(true);
      setHasBeenShown(true);
      sessionStorage.setItem("surveyShown", "true");
    }, 10000);

    return () => clearTimeout(timer);
  }, [searchTriggered]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleTakeSurvey = () => {
    window.open("https://forms.gle/vTvXQyNiZM6N5vvC7", "_blank");
    setIsVisible(false);
  };

  if (!isVisible || (hasBeenShown && !isVisible)) {
    return null;
  }

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className="p-6 pt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Help us improve!
          </h2>

          <p className="text-gray-600 mb-6 text-center">
            We'd love to hear your feedback about your experience with
            FindPapersFast. Your input helps us make the platform better for
            researchers like you.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleTakeSurvey}
              className="bg-foreground text-background hover:bg-foreground/80 px-6 py-2 rounded-full"
            >
              Take Survey
            </Button>

            <Button
              onClick={handleClose}
              variant="outline"
              className="px-6 py-2 rounded-full border-muted text-muted-foreground hover:bg-muted/10"
            >
              Maybe Later
            </Button>
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            Takes less than 2 minutes
          </p>
        </div>
      </div>
    </div>
  );
};

export default SurveyPopup;
