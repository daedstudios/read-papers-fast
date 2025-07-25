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
  Flame, // Add Flame icon for hot badge
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
    verdict: "supports" | "contradicts" | "neutral" | "not_relevant";
    summary: string;
    snippet: string;
  };
};

interface PaperResultProps {
  results: FactCheckResult[];
  analysisResults: { [paperId: string]: PaperAnalysisResult };
  paperFilter?: "contradicting" | "neutral" | "supporting" | null;
  statement?: string;
  onDeepAnalysis?: (paperId: string) => void;
}

const PaperResult = ({
  results,
  analysisResults,
  paperFilter,
  statement,
  onDeepAnalysis,
}: PaperResultProps) => {
  const [expandedCards, setExpandedCards] = useState<{
    [paperId: string]: boolean;
  }>({});
  const [deepAnalysisLoading, setDeepAnalysisLoading] = useState<{
    [paperId: string]: boolean;
  }>({});

  const toggleCardExpansion = (paperId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [paperId]: !prev[paperId],
    }));
  };

  const handleDeepAnalysis = async (paperId: string) => {
    if (!statement || !onDeepAnalysis) return;

    setDeepAnalysisLoading((prev) => ({
      ...prev,
      [paperId]: true,
    }));

    try {
      await onDeepAnalysis(paperId);
    } finally {
      setDeepAnalysisLoading((prev) => ({
        ...prev,
        [paperId]: false,
      }));
    }
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
      pdf_direct_analysis: {
        label: "Deep Analysis",
        color: "bg-blue-100 text-blue-800",
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
  const renderOriginalPaperCard = (paper: any) => {
    // Determine if paper is new (published within last 2 years) and highly cited
    let isHot = false;
    if (paper.published && paper.cited_by_count !== undefined) {
      const publishedYear = new Date(paper.published).getFullYear();
      const currentYear = new Date().getFullYear();
      isHot = publishedYear >= currentYear - 4 && paper.cited_by_count > 30;
    }
    return (
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

              {/* Deep Analysis Results */}
              {analysisResults[paper.id]?.analysis && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-foreground">
                      Deep Analysis:
                    </span>
                    {getSupportBadge(
                      analysisResults[paper.id].analysis!.support_level
                    )}
                    {getAnalysisMethodBadge(
                      analysisResults[paper.id].analysisMethod
                    )}
                  </div>
                  {formatStructuredAnalysis(
                    analysisResults[paper.id].analysis!,
                    paper.id
                  )}
                </div>
              )}

              {/* Publication and Citation Cards */}
              <div className="flex gap-3 flex-wrap">
                {paper.cited_by_count && (
                  <div className="flex items-center gap-2 px-3 py-2 border border-foreground bg-white relative">
                    <Asterisk size={16} className="text-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {paper.cited_by_count} Citations
                    </span>
                  
                  </div>
                )}
  {isHot && (
                      <span
                        className="flex items-center gap-1 px-3 py-2 border border-[#FFA600] text-[#FFA600] rounded-none text-sm font-medium bg-white"
                        style={{ fontWeight: 500 }}
                      >
                        <Flame size={16} /> hot
                      </span>
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

        <div className="space-y-0 px-6 pb-6">
          <div className="flex gap-2 flex-wrap">
            {/* Show only one PDF link */}
            {(() => {
              const pdfLink = paper.links.find(
                (link: any) => link.type === "application/pdf"
              );

              // Debug logging
              console.log(`Paper ${paper.id}:`, {
                hasStatement: !!statement,
                hasOnDeepAnalysis: !!onDeepAnalysis,
                hasPdfLink: !!pdfLink,
                preEvalVerdict: paper.pre_evaluation?.verdict,
                shouldShowButton:
                  statement &&
                  onDeepAnalysis &&
                  pdfLink &&
                  paper.pre_evaluation?.verdict !== "not_relevant",
              });

              return (
                <>
                  {pdfLink && (
                    <a
                      href={pdfLink.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 flex-1 border border-foreground rounded-none text-sm text-center"
                    >
                      View PDF
                    </a>
                  )}

                  {/* Deep Analysis Button - only show for papers that are not "not_relevant" and have PDF */}
                  {statement &&
                    onDeepAnalysis &&
                    pdfLink &&
                    paper.pre_evaluation?.verdict !== "not_relevant" && (
                      <Button
                        onClick={() => handleDeepAnalysis(paper.id)}
                        disabled={
                          deepAnalysisLoading[paper.id] ||
                          !!analysisResults[paper.id]?.analysis
                        }
                        variant="outline"
                        className="px-3 py-2 flex-1 border border-foreground rounded-none text-sm bg-blue-50 hover:bg-blue-100"
                      >
                        {deepAnalysisLoading[paper.id]
                          ? "Analyzing..."
                          : analysisResults[paper.id]?.analysis
                          ? "Analysis Complete"
                          : "🔍 Deep Search"}
                      </Button>
                    )}
                </>
              );
            })()}
          </div>
        </div>
      </Card>
    );
  };

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
        if (verdict === "not_relevant") return false;
        if (paperFilter === "contradicting") return verdict === "contradicts";
        if (paperFilter === "supporting") return verdict === "supports";
        if (paperFilter === "neutral") return verdict === "neutral";
        return true;
      })
    : results.filter(
        (paper) => paper.pre_evaluation?.verdict !== "not_relevant"
      );

  console.log("Filtered results:", filteredResults.length);

  return (
    <>
      {/* Paper Cards */}
      <div className="space-y-6">
        {filteredResults.map((paper) => {
          const analysis = analysisResults[paper.id];

          return renderOriginalPaperCard(paper);
        })}
      </div>
    </>
  );
};

export default PaperResult;
