"use client";

import { useState, useEffect } from "react";
import SurveyProgressBar from "./progressBar";

export default function LoadingSurvey() {
  const [dots, setDots] = useState("");

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

  const totalSteps = 4;

  const nextStep = () => setStep((prev) => prev + 1);

  return (
    <div>
      <div className="fixed top-[1rem] left-[1rem] text-[1.25rem] text-foreground font-medium">
        readpapersfast.ai
      </div>
      <SurveyProgressBar step={step} total={totalSteps} />
      <div className="flex flex-col items-center justify-center h-screen gap-[2rem]">
        {step === 1 && (
          <>
            <div className="flex flex-col items-start  w-[42rem]">
              <h2 className="text-[2.25rem] pb-[2rem]">
                Transcribing jargon{dots}
              </h2>

              <label htmlFor="reasonInput" className="pb-[1rem] pl-2">
                Why are you here?
              </label>

              <input
                id="reasonInput"
                type="text"
                placeholder="e.g., preparing for exams"
                value={surveyData.reason}
                onChange={(e) =>
                  setSurveyData({ ...surveyData, reason: e.target.value })
                }
                className="w-full border p-2 h-[2.25rem] border-muted rounded-[3rem] active:border-none"
              />
            </div>
            <div className="flex flex-col items-end gap-[2rem] justify-end  w-[42rem]">
              <button
                onClick={nextStep}
                className="justify-end bg-foreground text-background rounded-[3rem] h-[2.25rem] px-[2rem] cursor-pointer hover:bg-muted-foreground"
              >
                next
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex flex-col items-start  w-[42rem]">
              <h2 className="text-[2.25rem] pb-[2rem]"> Almost there{dots}</h2>
              <div className="flex flex-col w-full gap-[1rem]">
                <label htmlFor="reasonInput">
                  How confident are you reading research papers?
                </label>
                <div className="flex flex-row gap-[2rem]">
                  {["not at all", "somewhat", "very"].map((option) => (
                    <label
                      key={option}
                      className="flex items-center cursor-pointer"
                    >
                      <input
                        type="radio"
                        value={option}
                        checked={surveyData.confidence === option}
                        onChange={(e) =>
                          setSurveyData({
                            ...surveyData,
                            confidence: e.target.value,
                          })
                        }
                        className="hidden peer"
                      />
                      <span className="w-4 h-4 transition-all duration-200 ease-in-out hover:bg-foreground inline-block mr-2 rounded-full border border-foreground peer-checked:bg-foreground "></span>
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-[2rem] items-end justify-end  w-[42rem]">
              <button
                onClick={nextStep}
                className="justify-end bg-foreground text-background rounded-[3rem] h-[2.25rem] px-[2rem] cursor-pointer hover:bg-muted-foreground"
              >
                next
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex flex-col items-start  w-[42rem]">
              <h2 className="text-[2.25rem] pb-[2rem]"> Finishing{dots}</h2>
              <label htmlFor="reasonInput" className="pb-[1rem]">
                What field are you studying?
              </label>
              <input
                type="text"
                placeholder="e.g., economics"
                value={surveyData.field}
                onChange={(e) =>
                  setSurveyData({ ...surveyData, field: e.target.value })
                }
                className="w-full border p-2 h-[2.25rem] border-muted rounded-[3rem] active:border-none"
              />
              <div className="flex flex-row items-end justify-end  w-[42rem] pt-[1rem]">
                <button
                  onClick={nextStep}
                  className="justify-end bg-foreground text-background rounded-[3rem] h-[2.25rem] px-[2rem] cursor-pointer hover:bg-muted-foreground"
                >
                  finish
                </button>
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="flex flex-col items-start  w-[42rem]">
              <h2 className="text-[2.25rem] pb-[1rem]">
                {" "}
                Thanks for submitting!
              </h2>
              <p className="pb-[1rem] pl-1">
                You’re research paper will ready soon...
              </p>

              <div className="flex flex-row items-end justify-end  w-[42rem] pt-[1rem]">
                <button
                  onClick={() => console.log("Survey Done!", surveyData)}
                  className="justify-end bg-foreground text-background rounded-[3rem] h-[2.25rem] px-[2rem] cursor-pointer hover:bg-muted-foreground"
                >
                  see paper
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
