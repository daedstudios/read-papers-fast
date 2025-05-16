"use client";

import { useState, useEffect } from "react";
import SurveyProgressBar from "./progressBar";
import { useAppContext } from "@/components/AppContext";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { RadioGroup } from "@/components/ui/radio-group";
import { RadioGroupItem } from "@/components/ui/radio-group";
import Image from "next/image";
import Link from "next/link";

export default function LoadingSurvey() {
  const [dots, setDots] = useState("");
  const { isLoading, error, result, setIsLoading, setError, setResult } =
    useAppContext();

  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 250); // every 500ms add a dot

    return () => clearInterval(interval);
  }, []);

  const [step, setStep] = useState(1);
  const [surveyData, setSurveyData] = useState({
    reason: "",
    confidence: "",
    field: "",
  });
  const steps = [1, 2, 3, 4];

  const totalSteps = 4;

  const nextStep = () => setStep((prev) => prev + 1);

  useEffect(() => {
    console.log("result:", result);
  }, [result]);

  const handleSubmit = async () => {
    // Only proceed if we have result data with paperSummaryId
    if (!result?.paperSummary?.id) {
      setError("No paper data available");
      return;
    }

    try {
      // Attempt to save survey data but don't block navigation on failure
      const response = await fetch("/api/survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...surveyData,
          paperSummaryId: result.paperSummary.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Survey submission error:", errorData.error);
        // Continue with navigation despite survey save error
      } else {
        const data = await response.json();
        console.log("Survey submitted successfully:", data);
      }
    } catch (err) {
      console.error("Error submitting survey:", err);
      // Don't block navigation on survey submission error
    } finally {
      // Always navigate to the paper page if we have an ID
      router.push(`/paper?id=${result.paperSummary.id}`);
    }
  };
  const [countdown, setCountdown] = useState(120);

  useEffect(() => {
    if (!result?.success && countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, result?.success]);

  return (
    <div>
      <SurveyProgressBar step={step} total={totalSteps} />
      <div className="flex flex-col items-center justify-center h-screen max-h-screen gap-[2rem] px-[1rem]">
        <Image
          src="/LANDING-2.png"
          alt="Background"
          fill
          priority
          className="object-cover fixed  h-full w-full z-[-2] "
        />
        <div className="fixed  bg-black/20 blur-lg z-[-1]" />
        {step === 1 && (
          <>
            <Card className="w-full max-w-[32rem] max-h-screen  bg-background/10 shadow-lg border border-muted backdrop-blur-lg rounded-[2rem]">
              <CardHeader>
                <CardTitle className="text-[2.25rem] font-medium text-foreground">
                  Transcribing{dots}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <label
                  htmlFor="reasonInput"
                  className="text-[1rem] font-medium text-foreground"
                >
                  Why are you here?
                </label>
                <Textarea
                  id="reasonInput"
                  placeholder="e.g. preparing for exams"
                  value={surveyData.reason}
                  onChange={(e) =>
                    setSurveyData({ ...surveyData, reason: e.target.value })
                  }
                  className="min-h-[4rem] placeholder:text-muted-foreground  resize-none border border-muted-foreground"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={nextStep}
                    className="rounded-[2rem] cursor-pointer w-full md:w-auto"
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {step === 2 && (
          <>
            <Card className="w-full max-w-[32rem] bg-background/10 shadow-lg border border-muted backdrop-blur-lg rounded-[2rem]">
              <CardHeader>
                <CardTitle className="text-[2.25rem] font-medium">
                  Almost there{dots}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div>
                  <p className="font-medium text-[1rem] mb-4">
                    How confident are you reading research papers?
                  </p>
                  <RadioGroup
                    value={surveyData.confidence}
                    onValueChange={(value) =>
                      setSurveyData({ ...surveyData, confidence: value })
                    }
                    className="flex flex-row gap-6 mb-4"
                  >
                    {["not at all", "somewhat", "very"].map((option) => (
                      <div key={option} className="flex items-center gap-3">
                        <RadioGroupItem value={option} id={option} />
                        <label
                          htmlFor={option}
                          className="text-[1rem] cursor-pointer"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                  <div className="flex justify-end">
                    <Button
                      onClick={nextStep}
                      className="rounded-[2rem] cursor-pointer w-full md:w-auto"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {step === 3 && (
          <>
            <Card className="w-full max-w-[32rem] bg-background/10 shadow-lg border border-muted backdrop-blur-lg rounded-[2rem]">
              <CardHeader>
                <CardTitle className="text-[2.25rem] font-medium text-foreground">
                  Finishing{dots}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <label
                  htmlFor="reasonInput"
                  className="text-[1rem] font-medium text-foreground"
                >
                  What field are you studying?
                </label>
                <Textarea
                  id="reasonInput"
                  placeholder="e.g. economics"
                  value={surveyData.reason}
                  onChange={(e) =>
                    setSurveyData({ ...surveyData, reason: e.target.value })
                  }
                  className="min-h-[4rem] placeholder:text-muted-foreground  resize-none border border-muted-foreground"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={nextStep}
                    className="rounded-[2rem] cursor-pointer w-full md:w-auto"
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {step === 4 && (
          <Card className="w-full max-w-[32rem] bg-background/10 shadow-lg border border-muted backdrop-blur-lg rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-[2.25rem] font-medium text-foreground">
                {result?.success ? "Paper Ready" : "Thanks for submitting!"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-[1rem] font-medium text-foreground">
                {result?.success
                  ? "Thank you for your patience, you can now view your paper."
                  : `Your research paper will be ready soon. Estimated time: ${countdown}s...`}
              </p>

              <div className="flex justify-end w-full">
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !result?.paperSummary?.id}
                  className="rounded-[2rem] cursor-pointer w-full md:w-auto"
                >
                  {result?.success ? "Open Paper" : "See paper"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        <div className="flex justify-center items-center gap-2 mt-6">
          {steps.map((s) => (
            <span
              key={s}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                step === s ? "bg-black scale-110" : "bg-white opacity-60"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
