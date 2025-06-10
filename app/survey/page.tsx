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
import { ArrowRight } from "lucide-react";

export default function LoadingSurvey() {
  const [dots, setDots] = useState("");
  const {
    isLoading,
    error,
    result,
    setIsLoading,
    setError,
    setResult,
    progressMessage,
  } = useAppContext();

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
    foundOut: "",
    avgReadTime: "",
  });
  const steps = [1, 2, 3, 4, 5, 6, 7];

  const totalSteps = 7;

  const nextStep = () => setStep((prev) => prev + 1);

  useEffect(() => {
    console.log("result:", result);
  }, [result]);

  const handleSubmit = async () => {
    // Only proceed if we have result data with paperSummaryId
    if (!result?.id) {
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
          paperSummaryId: result.id,
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
      router.push(`/paperG?id=${result.id}`);
    }
  };
  const [countdown, setCountdown] = useState(40);

  useEffect(() => {
    if (!result?.success && countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, result?.success]);

  return (
    <div>
      <SurveyProgressBar loading={isLoading} />
      <div className="flex flex-col items-center justify-center h-screen max-h-screen gap-[2rem] px-[1rem]">
        {step === 1 && (
          <div className="flex flex-col items-center justify-center gap-[1rem]">
            <p className="text-[1.5rem] max-w-[24rem] text-center font-medium text-foreground/70 pb-[1rem]">
              {progressMessage
                ? `${progressMessage.replace(/\.*$/, "")}${dots}`
                : null}
            </p>
            <h1 className="text-[2.25rem] max-w-[24rem] text-center font-medium text-foreground">
              While we wait, help us make this 10x better
            </h1>
            <p className="text-[1rem] max-w-[24rem] text-center font-medium text-foreground/70 pb-[1rem]">
              Only takes as 2 min, we promise!
            </p>

            <Button
              onClick={nextStep}
              className="rounded-[2rem] w-[2rem] h-[2rem] cursor-pointer "
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
        {step === 2 && (
          <>
            <Card className="w-full max-w-[32rem] border shadow-none rounded-[1.5rem] bg-background">
              <CardHeader>
                <CardTitle className="text-[1.5rem] font-medium text-foreground">
                  {progressMessage
                    ? `${progressMessage.replace(/\.*$/, "")}${dots}`
                    : null}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <label
                  htmlFor="reasonInput"
                  className="text-[1rem] font-medium text-foreground"
                >
                  What is challenging about reading research papers?
                </label>
                <Textarea
                  id="reasonInput"
                  placeholder="e.g. the language, the structure, the content, etc."
                  value={surveyData.reason}
                  onChange={(e) =>
                    setSurveyData({ ...surveyData, reason: e.target.value })
                  }
                  className="min-h-[4rem] placeholder:text-muted-foreground  resize-none border border-muted"
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
        {step === 3 && (
          <>
            <Card className="w-full max-w-[32rem] border shadow-none rounded-[1.5rem] bg-background">
              <CardHeader>
                <CardTitle className="text-[1.5rem] font-medium">
                  {progressMessage
                    ? `${progressMessage.replace(/\.*$/, "")}${dots}`
                    : null}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div>
                  <p className="text-[1rem] mb-4 font-medium text-foreground">
                    How well do you understand the paper you uploaded?
                  </p>
                  <RadioGroup
                    value={surveyData.confidence}
                    onValueChange={(value) =>
                      setSurveyData({ ...surveyData, confidence: value })
                    }
                    className="flex flex-col gap-2 mb-4"
                  >
                    {["not at all", "somewhat", "very", "completely"].map(
                      (option) => (
                        <div key={option} className="flex items-center gap-3">
                          <RadioGroupItem value={option} id={option} />
                          <label
                            htmlFor={option}
                            className="text-[1rem] text-muted-foreground cursor-pointer"
                          >
                            {option}
                          </label>
                        </div>
                      )
                    )}
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
        {step === 4 && (
          <>
            <Card className="w-full max-w-[32rem] border shadow-none rounded-[1.5rem] bg-background">
              <CardHeader>
                <CardTitle className="text-[1.5rem] font-medium text-foreground">
                  {progressMessage
                    ? `${progressMessage.replace(/\.*$/, "")}${dots}`
                    : null}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <label
                  htmlFor="reasonInput"
                  className="text-[1rem] font-medium text-foreground"
                >
                  What field are you studying?
                </label>
                <RadioGroup
                  value={surveyData.confidence}
                  onValueChange={(value) =>
                    setSurveyData({ ...surveyData, confidence: value })
                  }
                  className="flex flex-col gap-2 mb-4"
                >
                  {[
                    "science (physics, chemistry, biology, etc.)",
                    "business (economics, finance, etc.)",
                    "social sciences (psychology, sociology, etc.)",
                    "law",
                  ].map((option) => (
                    <div key={option} className="flex items-center gap-3">
                      <RadioGroupItem value={option} id={option} />
                      <label
                        htmlFor={option}
                        className="text-[1rem] text-muted-foreground cursor-pointer"
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
              </CardContent>
            </Card>
          </>
        )}
        {step === 5 && (
          <>
            <Card className="w-full max-w-[32rem] border shadow-none rounded-[1.5rem] bg-background">
              <CardHeader>
                <CardTitle className="text-[1.5rem] font-medium text-foreground">
                  {progressMessage
                    ? `${progressMessage.replace(/\.*$/, "")}${dots}`
                    : null}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-[1rem] font-medium text-foreground">
                  How did you find out about ReadPapersFast?
                </p>
                <Textarea
                  id="foundOutInput"
                  placeholder="e.g. Twitter, Google, a friend, etc."
                  value={surveyData.foundOut}
                  onChange={(e) =>
                    setSurveyData({ ...surveyData, foundOut: e.target.value })
                  }
                  className="min-h-[3rem] placeholder:text-muted-foreground resize-none border border-muted"
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
        {step === 6 && (
          <>
            <Card className="w-full max-w-[32rem] border shadow-none rounded-[1.5rem] bg-background">
              <CardHeader>
                <CardTitle className="text-[1.5rem] font-medium text-foreground">
                  {progressMessage
                    ? `${progressMessage.replace(/\.*$/, "")}${dots}`
                    : null}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <p className="text-[1rem] font-medium text-foreground">
                  How long on average do you spend reading a paper?
                </p>
                <RadioGroup
                  value={surveyData.avgReadTime}
                  onValueChange={(value) =>
                    setSurveyData({ ...surveyData, avgReadTime: value })
                  }
                  className="flex flex-col gap-2 mb-4"
                >
                  {[
                    "Less than 30 minutes",
                    "30-60 minutes",
                    "1-2 hours",
                    "More than 2 hours",
                  ].map((option) => (
                    <div key={option} className="flex items-center gap-3">
                      <RadioGroupItem value={option} id={option} />
                      <label
                        htmlFor={option}
                        className="text-[1rem] text-muted-foreground cursor-pointer"
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
              </CardContent>
            </Card>
          </>
        )}
        {step === 7 && (
          <Card className="w-full max-w-[32rem] border shadow-none rounded-[1.5rem] bg-background">
            <CardHeader>
              <CardTitle className="text-[1.5rem] font-medium text-foreground">
                {progressMessage
                  ? `${progressMessage.replace(/\.*$/, "")}${dots}`
                  : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-[1rem] text-muted-foreground">
                {result?.success
                  ? "Thank you for your patience, you can now view your paper."
                  : `Thank you for being here, your research paper will be ready soon.`}
              </p>

              <div className="flex justify-end w-full">
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !result?.id}
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
                step === s ? "bg-foreground scale-110" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
