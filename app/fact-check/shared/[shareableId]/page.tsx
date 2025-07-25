"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
import { ExternalLink, Share2, ArrowLeft, Globe } from "lucide-react";
import Link from "next/link";
import posthog from "posthog-js";

// Types (same as in the main fact-check page)
type FactCheckResult = {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  doi?: string;
  links: {
    href: string;
    type: string;
    rel: string;
  }[];
  relevance_score?: number;
  cited_by_count?: number;
  journal_name?: string;
  publisher?: string;
  pre_evaluation?: {
    verdict: "supports" | "contradicts" | "neutral" | "not_relevant";
    summary: string;
    snippet: string;
  };
};

type PaperAnalysisResult = {
  paperId: string;
  pdfUrl?: string | null;
  statement: string;
  analysisMethod?: string;
  analysis: {
    support_level:
      | "strongly_supports"
      | "supports"
      | "neutral"
      | "contradicts"
      | "strongly_contradicts"
      | "insufficient_data";
    confidence: number;
    summary: string;
    relevant_sections: Array<{
      section_title?: string;
      text_snippet: string;
      page_number?: number;
      reasoning: string;
    }>;
    key_findings: string[];
    limitations: string[];
    timestamp: string;
  } | null;
  error?: string;
};

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
  const shareableId = params.shareableId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [factCheckData, setFactCheckData] =
    useState<SharedFactCheckData | null>(null);
  const [paperFilter, setPaperFilter] = useState<
    "contradicting" | "neutral" | "supporting" | null
  >(null);
  const [showFeedbackToast, setShowFeedbackToast] = useState(false);
  const [currentAnalysisResults, setCurrentAnalysisResults] = useState<{
    [paperId: string]: PaperAnalysisResult;
  }>({});

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

        // Initialize analysis results from the shared data
        const { papers: convertedPapers, analysisResults: convertedAnalysis } =
          convertToDisplayFormat(result.data);
        setCurrentAnalysisResults(convertedAnalysis);

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

  // Handle deep analysis for a specific paper
  const handleDeepAnalysis = async (paperId: string) => {
    if (!factCheckData) return;

    const paper = factCheckData.papers.find((p) => p.externalId === paperId);
    if (!paper) return;

    // Find PDF link
    const pdfLink = paper.links?.find(
      (link: any) => link.type === "application/pdf"
    );
    if (!pdfLink) {
      alert("No PDF available for this paper");
      return;
    }

    try {
      const response = await fetch("/api/fact-check/deep-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          statement: factCheckData.statement,
          pdfUrl: pdfLink.href,
          title: paper.title,
          paperId: paperId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const analysisResult = await response.json();

      // Update the analysis results state
      setCurrentAnalysisResults((prev) => ({
        ...prev,
        [paperId]: analysisResult,
      }));

      console.log(
        "Deep analysis completed for paper:",
        paperId,
        analysisResult
      );
    } catch (error) {
      console.error("Deep analysis error:", error);
      alert(
        `Deep analysis failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
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

  // Merge the existing analysis results with the current ones (prioritize current)
  const mergedAnalysisResults = {
    ...analysisResults,
    ...currentAnalysisResults,
  };

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
              analysisResults={mergedAnalysisResults}
              paperFilter={paperFilter}
              statement={factCheckData.statement}
              onDeepAnalysis={handleDeepAnalysis}
            />

            {/* Debug info */}
            <div className="mt-4 p-4 bg-gray-100 text-sm">
              <strong>Debug Info:</strong>
              <div>Statement: {factCheckData.statement ? "✓" : "✗"}</div>
              <div>Papers count: {papers.length}</div>
              <div>
                Papers with PDF:{" "}
                {
                  papers.filter((p) =>
                    p.links.find((l) => l.type === "application/pdf")
                  ).length
                }
              </div>
              <div>
                Papers with pre_evaluation:{" "}
                {papers.filter((p) => p.pre_evaluation).length}
              </div>
              <div>
                Papers not "not_relevant":{" "}
                {
                  papers.filter(
                    (p) => p.pre_evaluation?.verdict !== "not_relevant"
                  ).length
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      <FeedbackToast
        isVisible={showFeedbackToast}
        onClose={() => setShowFeedbackToast(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
};

export default SharedFactCheckPage;
