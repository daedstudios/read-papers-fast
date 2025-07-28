"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowUpFromLine, TextSearch, Gavel } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PaperResult from "@/components/find-componenets/PaperResult";
import FinalVerdictCard from "@/components/FinalVerdictCard";
import { ChatDrawer } from "@/components/ChatDrawer";
import { getShareableUrl, copyToClipboard } from "@/lib/factCheckUtils";
import { useSearchLimiter } from "@/hooks/useSearchLimiter";
import SignUpForm from "@/components/fact-check-components/signUpForm";
import FactCheckForm from "@/components/fact-check-components/FactCheckForm";
import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";
import TrendingShitcheckCard from "@/components/TrendingShitcheckCard";
import { trendingClaims } from "@/data/trendingClaims";
import {
  handleFactCheck as handleFactCheckUtil,
  generateFinalVerdict,
  handleDeepAnalysis,
  type FactCheckResult,
  type PaperAnalysisResult,
} from "@/utilities/HandleFactCheck";

const FactCheckPage = () => {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FactCheckResult[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Search limiter hook - only use if user is not signed in
  const {
    isLimitReached,
    increment,
    remainingSearches,
    isLoading: limiterLoading,
  } = useSearchLimiter();

  // Sign-up form state
  const [showSignUpForm, setShowSignUpForm] = useState(false);

  // Close sign-up form if user signs in
  useEffect(() => {
    if (isSignedIn && showSignUpForm) {
      setShowSignUpForm(false);
    }
  }, [isSignedIn, showSignUpForm]);

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{
    [paperId: string]: PaperAnalysisResult;
  }>({});
  const [currentlyAnalyzing, setCurrentlyAnalyzing] = useState<string | null>(
    null
  );
  const [analysisProgress, setAnalysisProgress] = useState({
    current: 0,
    total: 0,
  });
  const [currentBatch, setCurrentBatch] = useState(0);
  const BATCH_SIZE = 10;

  // Final verdict state
  const [finalVerdict, setFinalVerdict] = useState<any>(null);
  const [generatingVerdict, setGeneratingVerdict] = useState(false);
  const [paperFilter, setPaperFilter] = useState<
    "contradicting" | "neutral" | "supporting" | null
  >(null);

  // Database save state
  const [savingToDb, setSavingToDb] = useState(false);
  const [shareableId, setShareableId] = useState<string | null>(null);
  const [dbSaveError, setDbSaveError] = useState<string | null>(null);

  // Debug function to log filter changes
  const handleFilterChange = (
    filter: "contradicting" | "neutral" | "supporting" | null
  ) => {
    console.log("Filter changed to:", filter);
    setPaperFilter(filter);
  };

  // Handle fact check using the utility function
  const handleFactCheck = async (statement: string) => {
    await handleFactCheckUtil({
      statement,
      isSignedIn: isSignedIn ?? false,
      isLimitReached,
      setLoading,
      setError,
      setResults,
      setKeywords,
      setAnalysisResults,
      setAnalyzing,
      setCurrentBatch,
      setFinalVerdict,
      setGeneratingVerdict,
      setSavingToDb,
      setShareableId,
      setDbSaveError,
      setShowSignUpForm,
      increment,
      router,
    });
  };

  // Combine all busy states for UI feedback
  const isBusy = loading || generatingVerdict || savingToDb;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center">
      <div className="container w-2xl max-w-[90%] mx-auto ">
        <div className="text-center mb-8 mt-[10rem] mx-auto">
          <h1 className="text-[2.5rem] mb-4 ">Check your claim</h1>
        </div>

        <FactCheckForm
          onSubmit={handleFactCheck}
          isLoading={isBusy}
          error={error}
          isSignedIn={isSignedIn ?? false}
          limiterLoading={limiterLoading}
        />
        <div className="mb-[3rem] text-sm mx-auto w-full text-center text-muted-foreground ">
          Fact-check against research from{" "}
          <a
            href="https://openalex.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground underline"
          >
            openalex.org
          </a>
          , with peer-reviewed research from reputable journals and
          institutions. Each source is fully cited with metadata.
        </div>

        {/* Three-Step Process */}
        <div className="flex flex-wrap gap-4 justify-start mb-8">
          {/* Step 1 */}

          <div className="flex-1 min-w-[280px] md:max-w-[350px] bg-[#C5C8FF] p-6 rounded-sm border border-foreground">
            <div className="flex flex-col items-start gap-3">
              <div className="bg-[#C5C8FF] rounded-sm">
                <ArrowUpFromLine size={24} className="text-foreground" />
              </div>
              <div>
                <h3 className="text-[1.5rem] font-medium text-foreground mb-2">
                  Step 1
                </h3>
                <p className="text-foreground text-sm">
                  Upload a post, paste a quote, or just type out the thing that
                  made your brain twitch.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex-1 min-w-[280px] md:max-w-[350px] bg-[#AEFFD9] p-6 rounded-sm border border-foreground">
            <div className="flex flex-col items-start gap-3">
              <div className="bg-[#AEFFD9]  rounded-sm">
                <div className="relative">
                  <TextSearch size={24} className="text-foreground" />
                </div>
              </div>
              <div>
                <h3 className="text-[1.5rem] font-medium text-foreground mb-2">
                  Step 2
                </h3>
                <p className="text-foreground text-sm">
                  Let us search through over 200m+ papers to find real evidence
                  backing or debunking the claim.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex-1 min-w-[280px] w-full bg-[#FFBAD8] p-6 rounded-sm border border-foreground">
            <div className="flex flex-col items-start gap-3">
              <div className="bg-[#FFBAD8] rounded-sm">
                <Gavel size={24} className="text-foreground" />
              </div>
              <div>
                <h3 className="text-[1.5rem] font-medium text-foreground mb-2">
                  Step 3
                </h3>
                <p className="text-foreground text-sm">
                  Get a science-backed verdict and share it where the nonsense
                  started.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col w-full mt-[3rem] mb-[3rem]">
          <h1 className="text-[1.5rem] font-medium text-foreground mb-4">
            Trending claims
          </h1>
          {trendingClaims.map((claim) => (
            <TrendingShitcheckCard key={claim.id} claim={claim} />
          ))}
        </div>
      </div>

      {/* Sign-up form modal */}
      {showSignUpForm && (
        <SignUpForm
          onClose={() => setShowSignUpForm(false)}
          onSuccess={() => {
            setShowSignUpForm(false);
            // You could also reset the search limiter here if needed
            // or handle the successful authentication
          }}
          remainingSearches={remainingSearches}
        />
      )}
    </div>
  );
};

export default FactCheckPage;
