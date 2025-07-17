"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Asterisk,
  BookOpen,
  GraduationCap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Types for paper analysis
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
    verdict: "supports" | "contradicts" | "neutral";
    summary: string;
    snippet: string;
  };
};

interface PaperResultProps {
  results: FactCheckResult[];
  statement: string;
  analysisResults: { [paperId: string]: PaperAnalysisResult };
  analyzing: boolean;
  currentlyAnalyzing: string | null;
  analysisProgress: { current: number; total: number };
  currentBatch: number;
  batchSize: number;
  onStartAnalysis: () => void;
  paperFilter?: "contradicting" | "neutral" | "supporting" | null;
}

const PaperResult = ({
  results,
  statement,
  analysisResults,
  analyzing,
  currentlyAnalyzing,
  analysisProgress,
  currentBatch,
  batchSize,
  onStartAnalysis,
  paperFilter,
}: PaperResultProps) => {
  const [expandedCards, setExpandedCards] = useState<{
    [paperId: string]: boolean;
  }>({});

  const toggleCardExpansion = (paperId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [paperId]: !prev[paperId],
    }));
  };
  const getAnalysisMethodBadge = (method?: string) => {
    if (!method) return null;

    const methodLabels: { [key: string]: { label: string; color: string } } = {
      pdf_direct_url: {
        label: "Full PDF",
        color: "bg-green-100 text-green-800",
      },
      pdf_manual_fetch: {
        label: "Full PDF",
        color: "bg-green-100 text-green-800",
      },
      abstract_fallback: {
        label: "Abstract Only",
        color: "bg-yellow-100 text-yellow-800",
      },
      abstract_only: {
        label: "Abstract Only",
        color: "bg-yellow-100 text-yellow-800",
      },
    };

    const config = methodLabels[method] || {
      label: "Unknown",
      color: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge variant="outline" className={`${config.color} rounded-none`}>
        {config.label}
      </Badge>
    );
  };

  const getSupportBadge = (supportLevel: string) => {
    const badges: { [key: string]: { label: string; color: string } } = {
      strongly_supports: {
        label: "Strongly Supports",
        color: "bg-green-100 text-green-800",
      },
      supports: { label: "Supports", color: "bg-green-100 text-foreground" },
      neutral: { label: "Neutral", color: "bg-gray-100 text-gray-800" },
      contradicts: { label: "Contradicts", color: "bg-red-100 text-" },
      strongly_contradicts: {
        label: "Strongly Contradicts",
        color: "bg-red-100 text-red-800",
      },
      insufficient_data: {
        label: "Insufficient Data",
        color: "bg-yellow-100 text-yellow-800",
      },
    };

    const config = badges[supportLevel] || {
      label: "Unknown",
      color: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge variant="outline" className={`${config.color} rounded-none`}>
        {config.label}
      </Badge>
    );
  };

  const formatStructuredAnalysis = (analysis: any, paperId: string) => {
    const isExpanded = expandedCards[paperId];

    return (
      <div className="space-y-4">
        <div>
          <p className="text-gray-700">{analysis.summary}</p>
        </div>

        {analysis.relevant_sections.length > 0 && (
          <div className="">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleCardExpansion(paperId)}
              className="flex justify-between items-center gap-2 mb-3 w-full border border-foreground rounded-none py-5 cursor-pointer"
            >
              {isExpanded ? (
                <>
                  Hide Details
                  <ChevronUp size={16} />
                </>
              ) : (
                <>
                  Show Details ({analysis.relevant_sections.length} sections)
                  <ChevronDown size={16} />
                </>
              )}
            </Button>

            {isExpanded && (
              <div className="space-y-3 mt-2">
                {analysis.relevant_sections.map(
                  (section: any, index: number) => (
                    <div
                      key={index}
                      className="bg-muted p-4 rounded-sm shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        {section.section_title && (
                          <div className="font-semibold text-foreground text-base">
                            {section.section_title}
                          </div>
                        )}
                      </div>
                      <blockquote className="text-muted-foreground italic mb-3 leading-relaxed border-l-2 border-gray-300 pl-3">
                        "{section.text_snippet}"
                      </blockquote>
                      {section.page_number && (
                        <div className="text-sm text-muted-foreground rounded">
                          Page {section.page_number}
                        </div>
                      )}
                      <div className="text-sm text-foreground pt-2 rounded">
                        {section.reasoning}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Helper for pre-evaluation badge
  const getPreEvalBadge = (verdict: string) => {
    const map: Record<string, { label: string; color: string }> = {
      supports: { label: "Supports", color: "bg-[#AEFFD9] text-foreground" },
      contradicts: {
        label: "Contradicts",
        color: "bg-[#FFBAD8] text-foreground",
      },
      neutral: { label: "Neutral", color: "bg-[#C5C8FF] text-foreground" },
    };
    const config = map[verdict] || map["neutral"];
    return (
      <span
        className={`inline-block px-3 py-1 rounded-none font-medium text-sm border border-foreground ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  // Render original paper card
  const renderOriginalPaperCard = (paper: any) => (
    <Card
      key={paper.id}
      className="hover:shadow-lg transition-shadow rounded-sm border-foreground"
    >
      <CardHeader>
        <CardTitle className="text-lg leading-tight">{paper.title}</CardTitle>
        <CardDescription>
          <div className="space-y-3">
            <div>{paper.authors.join(", ")}</div>

            {/* Pre-evaluation verdict, summary, and snippet */}
            {paper.pre_evaluation && (
              <div className="flex flex-col gap-2 my-2">
                <div className="flex items-center gap-2">
                  {getPreEvalBadge(paper.pre_evaluation.verdict)}
                </div>
                <div className="text-sm text-foreground">
                  {paper.pre_evaluation.summary}
                </div>
                <div className="text-xs text-muted-foreground italic border-l-2 border-gray-300 pl-2">
                  {paper.pre_evaluation.snippet &&
                  paper.pre_evaluation.snippet.trim() !== ""
                    ? `"${paper.pre_evaluation.snippet}"`
                    : (paper.summary?.slice(0, 200) || "") +
                      (paper.summary && paper.summary.length > 200
                        ? "..."
                        : "")}
                </div>
              </div>
            )}

            {/* Publication and Citation Cards */}
            <div className="flex gap-3 flex-wrap">
              {paper.cited_by_count && (
                <div className="flex items-center gap-2 px-3 py-2 border border-foreground  bg-white">
                  <Asterisk size={24} className="text-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {paper.cited_by_count} Citations
                  </span>
                </div>
              )}

              {paper.journal_name && (
                <div className="flex items-center gap-2 px-3 py-2 border border-foreground  bg-white">
                  <BookOpen size={16} className="text-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {paper.journal_name}
                  </span>
                </div>
              )}

              {paper.publisher && (
                <div className="flex items-center gap-2 px-3 py-2 border border-foreground  bg-white">
                  <GraduationCap size={16} className="text-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {paper.publisher}
                  </span>
                </div>
              )}

              {paper.published && (
                <div className="flex items-center gap-2 px-3 py-2 border border-foreground  bg-white">
                  <span className="text-sm font-medium text-foreground">
                    {new Date(paper.published).getFullYear()}
                  </span>
                </div>
              )}
            </div>

            {/* {paper.relevance_score && (
              <div className="text-sm">
                <strong>Relevance:</strong>{" "}
                {(paper.relevance_score * 100).toFixed(1)}%
              </div>
            )} */}
          </div>
        </CardDescription>
      </CardHeader>

      <div className="space-y-0 px-6">
        <div className="flex gap-2 flex-wrap">
          {/* Show only one PDF link */}
          {(() => {
            const pdfLink = paper.links.find(
              (link: any) => link.type === "application/pdf"
            );

            return (
              <>
                {pdfLink && (
                  <a
                    href={pdfLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 w-full border border-foreground rounded-none text-sm text-center"
                  >
                    View PDF
                  </a>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </Card>
  );

  // Render analysis result card
  const renderAnalysisCard = (
    paper: FactCheckResult,
    analysis: PaperAnalysisResult
  ) => (
    <Card key={paper.id} className=" border-foreground rounded-sm">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-[1.25rem] leading-tight flex-1">
            {paper.title}
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            {analysis.analysisMethod &&
              getAnalysisMethodBadge(analysis.analysisMethod)}
            {analysis.analysis &&
              getSupportBadge(analysis.analysis.support_level)}
          </div>
        </div>
        <CardDescription>
          <div className="space-y-3">
            <div>{paper.authors.join(", ")}</div>

            {/* Publication and Citation Cards */}
            <div className="flex gap-3 flex-wrap">
              {paper.cited_by_count && (
                <div className="flex items-center gap-2 px-3 py-2 border border-foreground bg-white">
                  <Asterisk size={16} className="text-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {paper.cited_by_count} Citations
                  </span>
                </div>
              )}

              {paper.journal_name && (
                <div className="flex items-center gap-2 px-3 py-2 border border-foreground bg-white">
                  <BookOpen size={16} className="text-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {paper.journal_name}
                  </span>
                </div>
              )}

              {paper.publisher && (
                <div className="flex items-center gap-2 px-3 py-2 border border-foreground bg-white">
                  <GraduationCap size={16} className="text-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {paper.publisher}
                  </span>
                </div>
              )}

              {paper.published && (
                <div className="flex items-center gap-2 px-3 py-2 border border-foreground bg-white">
                  <span className="text-sm font-medium text-foreground">
                    {new Date(paper.published).getFullYear()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent>
        {analysis.error ? (
          <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
            <strong>Analysis Error:</strong>
            <div className="mt-1">{analysis.error}</div>
            {analysis.error.includes("Unable to analyze paper") && (
              <div className="mt-2 text-sm text-red-700">
                This paper could not be analyzed because neither the PDF nor
                abstract was accessible.
              </div>
            )}
          </div>
        ) : analysis.analysis ? (
          <div className="space-y-4">
            <div>
              <div className="">
                {formatStructuredAnalysis(analysis.analysis, paper.id)}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>
                Analyzed:{" "}
                {new Date(analysis.analysis.timestamp).toLocaleString()}
              </span>
              {analysis.analysisMethod?.includes("abstract") && (
                <span className="text-yellow-600 font-medium">
                  ⚠ Based on abstract only
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-gray-500">No analysis available</div>
        )}
      </CardContent>
    </Card>
  );

  // Filter results based on paperFilter
  console.log("PaperFilter:", paperFilter);
  console.log("Total results:", results.length);
  console.log(
    "Results with pre_evaluation:",
    results.filter((p) => p.pre_evaluation).length
  );

  const filteredResults = paperFilter
    ? results.filter((paper) => {
        const verdict = paper.pre_evaluation?.verdict;
        console.log(`Paper ${paper.title}: verdict = ${verdict}`);
        if (paperFilter === "contradicting") return verdict === "contradicts";
        if (paperFilter === "supporting") return verdict === "supports";
        if (paperFilter === "neutral") return verdict === "neutral";
        return true;
      })
    : results;

  console.log("Filtered results:", filteredResults.length);

  return (
    <>
      {/* Paper Cards */}
      <div className="space-y-6">
        {filteredResults.map((paper) => {
          const analysis = analysisResults[paper.id];

          // If analysis is available, show analysis card, otherwise show original paper card
          if (analysis) {
            return renderAnalysisCard(paper, analysis);
          } else {
            return renderOriginalPaperCard(paper);
          }
        })}
      </div>
    </>
  );
};

export default PaperResult;
