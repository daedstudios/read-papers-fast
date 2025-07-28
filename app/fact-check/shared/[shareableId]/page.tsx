"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FinalVerdictCard from "@/components/FinalVerdictCard";
import PaperResult from "@/components/find-componenets/PaperResult";
import { ChatDrawer } from "@/components/ChatDrawer";
import FeedbackToast from "@/components/fact-check-components/Feddback";
import FactCheckForm from "@/components/fact-check-components/FactCheckForm";
import SignUpForm from "@/components/fact-check-components/signUpForm";
import { ExternalLink, Share2, ArrowLeft, Globe } from "lucide-react";
import Link from "next/link";
import posthog from "posthog-js";
import {
  FactCheckResult,
  PaperAnalysisResult,
  handleFactCheck as handleFactCheckUtil,
} from "@/utilities/HandleFactCheck";
import { useUser } from "@clerk/nextjs";
import { useSearchLimiter } from "@/hooks/useSearchLimiter";

type SharedFactCheckData = {
  id: string;
  statement: string;
  keywords: string[];
  finalVerdict: any;
  createdAt: string;
  shareableId: string;
  papers: Array<{
    id: string;
    externalId: string;
    title: string;
    authors: string[];
    summary: string;
    published: string;
    doi?: string;
    journalName?: string;
    publisher?: string;
    relevanceScore?: number;
    citedByCount?: number;
    links: any;
    preEvalVerdict?: string;
    preEvalSummary?: string;
    preEvalSnippet?: string;
    analysis?: {
      pdfUrl?: string;
      analysisMethod?: string;
      supportLevel?: string;
      confidence?: number;
      summary?: string;
      relevantSections?: any;
      keyFindings: string[];
      limitations: string[];
      error?: string;
    };
  }>;
};

const SharedFactCheckPage = () => {
  const params = useParams();
  const router = useRouter();
  const shareableId = params.shareableId as string;
  const { isSignedIn, user } = useUser();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [factCheckData, setFactCheckData] =
    useState<SharedFactCheckData | null>(null);
  const [paperFilter, setPaperFilter] = useState<
    "contradicting" | "neutral" | "supporting" | null
  >(null);
  const [showFeedbackToast, setShowFeedbackToast] = useState(false);

  // Sign-up form state
  const [showSignUpForm, setShowSignUpForm] = useState(false);

  // New fact-check functionality
  const [newFactCheckLoading, setNewFactCheckLoading] = useState(false);
  const [newFactCheckError, setNewFactCheckError] = useState<string | null>(
    null
  );
  const [newResults, setNewResults] = useState<FactCheckResult[]>([]);
  const [newKeywords, setNewKeywords] = useState<string[]>([]);
  const [newAnalysisResults, setNewAnalysisResults] = useState<{
    [paperId: string]: PaperAnalysisResult;
  }>({});
  const [newAnalyzing, setNewAnalyzing] = useState(false);
  const [newCurrentBatch, setNewCurrentBatch] = useState(0);
  const [newFinalVerdict, setNewFinalVerdict] = useState<any>(null);
  const [newGeneratingVerdict, setNewGeneratingVerdict] = useState(false);
  const [newSavingToDb, setNewSavingToDb] = useState(false);
  const [newShareableId, setNewShareableId] = useState<string | null>(null);
  const [newDbSaveError, setNewDbSaveError] = useState<string | null>(null);

  // Search limiter for non-signed-in users
  const {
    isLimitReached,
    increment,
    remainingSearches,
    isLoading: limiterLoading,
  } = useSearchLimiter();

  // Close sign-up form if user signs in
  useEffect(() => {
    if (isSignedIn && showSignUpForm) {
      setShowSignUpForm(false);
    }
  }, [isSignedIn, showSignUpForm]);

  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        const response = await fetch(
          `/api/fact-check/db-save?shareableId=${shareableId}`
        );

        if (!response.ok) {
          throw new Error("Failed to load shared fact-check data");
        }

        const result = await response.json();
        setFactCheckData(result.data);
        console.log("Shared Fact-Check Data:", result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (shareableId) {
      fetchSharedData();

      // Show feedback toast 3 seconds after page loads
      const feedbackTimer = setTimeout(() => {
        setShowFeedbackToast(true);
      }, 3000);

      return () => clearTimeout(feedbackTimer);
    }
  }, [shareableId]);

  const handleFilterChange = (
    filter: "contradicting" | "neutral" | "supporting" | null
  ) => {
    setPaperFilter(filter);
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (feedback: {
    type: "positive" | "negative" | null;
    text: string;
    suggestions: string;
    age: string;
    purpose: string;
  }) => {
    try {
      // Send to analytics service
      posthog.capture("fact_check_feedback", {
        feedback_type: feedback.type,
        feedback_text: feedback.text,
        feedback_suggestions: feedback.suggestions,
        feedback_age: feedback.age,
        feedback_purpose: feedback.purpose,
        statement_length: factCheckData?.statement.length || 0,
        papers_count: factCheckData?.papers.length || 0,
        location: "shared_fact_check_page",
        shareable_id: shareableId,
        timestamp: new Date().toISOString(),
      });

      console.log("Feedback submitted successfully:", feedback);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Share link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  // Handle new fact check from shared page
  const handleNewFactCheck = async (statement: string) => {
    await handleFactCheckUtil({
      statement,
      isSignedIn: isSignedIn ?? false,
      isLimitReached,
      setLoading: setNewFactCheckLoading,
      setError: setNewFactCheckError,
      setResults: setNewResults,
      setKeywords: setNewKeywords,
      setAnalysisResults: setNewAnalysisResults,
      setAnalyzing: setNewAnalyzing,
      setCurrentBatch: setNewCurrentBatch,
      setFinalVerdict: setNewFinalVerdict,
      setGeneratingVerdict: setNewGeneratingVerdict,
      setSavingToDb: setNewSavingToDb,
      setShareableId: setNewShareableId,
      setDbSaveError: setNewDbSaveError,
      setShowSignUpForm,
      increment,
      router,
    });
  };

  // Convert database format to component format
  const convertToDisplayFormat = (data: SharedFactCheckData) => {
    const papers: FactCheckResult[] = data.papers.map((paper) => ({
      id: paper.externalId,
      title: paper.title,
      authors: paper.authors,
      summary: paper.summary || "",
      published: paper.published || "",
      doi: paper.doi,
      links: paper.links || [],
      relevance_score: paper.relevanceScore,
      cited_by_count: paper.citedByCount,
      journal_name: paper.journalName,
      publisher: paper.publisher,
      // Add pre_evaluation data if available
      pre_evaluation: paper.preEvalVerdict
        ? {
            verdict: paper.preEvalVerdict as
              | "supports"
              | "contradicts"
              | "neutral"
              | "not_relevant",
            summary: paper.preEvalSummary || "",
            snippet: paper.preEvalSnippet || "",
          }
        : undefined,
    }));

    const analysisResults: { [paperId: string]: PaperAnalysisResult } = {};
    data.papers.forEach((paper) => {
      if (paper.analysis) {
        analysisResults[paper.externalId] = {
          paperId: paper.externalId,
          pdfUrl: paper.analysis.pdfUrl,
          statement: data.statement,
          analysisMethod: paper.analysis.analysisMethod,
          analysis: paper.analysis.supportLevel
            ? {
                support_level: paper.analysis.supportLevel as any,
                confidence: paper.analysis.confidence || 0,
                summary: paper.analysis.summary || "",
                relevant_sections: paper.analysis.relevantSections || [],
                key_findings: paper.analysis.keyFindings || [],
                limitations: paper.analysis.limitations || [],
                timestamp: new Date().toISOString(),
              }
            : null,
          error: paper.analysis.error,
        };
      }
    });

    return { papers, analysisResults };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  if (error || !factCheckData) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Fact-Check Not Found</h1>
          <p className="text-gray-600 mb-4">
            {error || "The shared fact-check data could not be found."}
          </p>
          <Link href="/">
            <Button className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { papers, analysisResults } = convertToDisplayFormat(factCheckData);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center">
      <div className="container w-2xl max-w-[90%] mx-auto">
        {/* Header */}
        <div className="mb-8 mt-[10rem]">
          <div className="flex items-center justify-between mb-4">
            <Link href="/">
              <Button
                variant="outline"
                className="flex items-center gap-2 rounded-none border border-foreground"
              >
                <ArrowLeft size={16} />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>

        {/* New Fact Check Section */}
        <div className="mb-8 border-b border-gray-200 pb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Start a New Fact Check</h2>
            <p className="text-gray-600">
              Have another claim you'd like to verify? Start a new fact-check
              from here.
            </p>
          </div>

          <FactCheckForm
            onSubmit={handleNewFactCheck}
            isLoading={
              newFactCheckLoading || newGeneratingVerdict || newSavingToDb
            }
            error={newFactCheckError}
            isSignedIn={isSignedIn ?? false}
            limiterLoading={limiterLoading}
          />
        </div>

        {/* Final Verdict */}
        {factCheckData.finalVerdict && (
          <div className="mb-8">
            <FinalVerdictCard
              verdict={factCheckData.finalVerdict}
              statement={factCheckData.statement}
              onFilterChange={handleFilterChange}
              currentFilter={paperFilter}
              shareableId={shareableId}
            />
          </div>
        )}

        {/* Papers Display */}
        <div className="space-y-6">
          <div className="space-y-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                Found {papers.length} Relevant Papers
              </h2>
              <ChatDrawer shareableId={shareableId} />
            </div>

            <PaperResult
              results={papers}
              analysisResults={analysisResults}
              paperFilter={paperFilter}
            />
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      <FeedbackToast
        isVisible={showFeedbackToast}
        onClose={() => setShowFeedbackToast(false)}
        onSubmit={handleFeedbackSubmit}
      />

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

export default SharedFactCheckPage;
