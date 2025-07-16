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
      supports: { label: "Supports", color: "bg-green-100 text-green-700" },
      neutral: { label: "Neutral", color: "bg-gray-100 text-gray-800" },
      contradicts: { label: "Contradicts", color: "bg-red-100 text-red-700" },
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

  // Render original paper card
  const renderOriginalPaperCard = (paper: FactCheckResult) => (
    <Card
      key={paper.id}
      className="hover:shadow-lg transition-shadow rounded-sm border-foreground"
    >
      <CardHeader>
        <CardTitle className="text-lg leading-tight">{paper.title}</CardTitle>
        <CardDescription>
          <div className="space-y-3">
            <div>{paper.authors.join(", ")}</div>

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
      <CardContent>
        <div className="space-y-3">
          <div>
            <strong>Abstract:</strong>
            <p className="text-gray-700 mt-1">{paper.summary}</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {paper.links.map((link, linkIndex) => (
              <a
                key={linkIndex}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-3 py-1 rounded text-sm ${
                  link.type === "application/pdf"
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
              >
                {link.type === "application/pdf" ? "📄 PDF" : "🔗 View Paper"}
              </a>
            ))}
          </div>
        </div>
      </CardContent>
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
            <div>
              <strong>Authors:</strong> {paper.authors.join(", ")}
            </div>

            {/* Publication and Citation Cards */}
            <div className="flex gap-3 flex-wrap">
              {paper.cited_by_count && (
                <div className="flex items-center gap-2 px-3 py-2 border border-foreground rounded-sm bg-white">
                  <Asterisk size={16} className="text-foreground" />
                  <span className="text-sm font-medium">
                    {paper.cited_by_count} Citations
                  </span>
                </div>
              )}

              {paper.journal_name && (
                <div className="flex items-center gap-2 px-3 py-2 border border-foreground rounded-sm bg-white">
                  <BookOpen size={16} className="text-foreground" />
                  <span className="text-sm font-medium">
                    {paper.journal_name}
                  </span>
                </div>
              )}

              {paper.publisher && (
                <div className="flex items-center gap-2 px-3 py-2 border border-foreground rounded-sm bg-white">
                  <GraduationCap size={16} className="text-foreground" />
                  <span className="text-sm font-medium">{paper.publisher}</span>
                </div>
              )}

              {paper.published && (
                <div className="flex items-center gap-2 px-3 py-2 border border-foreground rounded-sm bg-white">
                  <span className="text-sm font-medium">
                    Published: {new Date(paper.published).getFullYear()}
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

  return (
    <>
      {/* Floating Analysis Control - Absolute positioned */}
      <div className="fixed top-24 right-4 z-50 w-70 max-w-[90vw]">
        <Card className="shadow-lg border-2 border-blue-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Deep Paper Analysis</CardTitle>
            <CardDescription className="text-sm">
              Analyze papers in batches of {batchSize} to determine if they
              support or contradict your statement. We'll analyze full PDFs when
              available, or use abstracts as a fallback.
              {currentBatch * batchSize < results.length && (
                <div className="mt-2 text-blue-600 font-medium">
                  Ready to analyze papers {currentBatch * batchSize + 1}-
                  {Math.min((currentBatch + 1) * batchSize, results.length)}
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Batch Information */}
              <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded-lg">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Current Batch:</span>
                    <span>
                      {currentBatch + 1} of{" "}
                      {Math.ceil(results.length / batchSize)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Papers:</span>
                    <span>
                      {Math.min(currentBatch * batchSize + 1, results.length)} -{" "}
                      {Math.min((currentBatch + 1) * batchSize, results.length)}{" "}
                      of {results.length}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={onStartAnalysis}
                disabled={
                  analyzing ||
                  results.length === 0 ||
                  currentBatch * batchSize >= results.length
                }
                className="w-full py-2 text-sm"
                size="sm"
              >
                {analyzing
                  ? "Analyzing..."
                  : currentBatch * batchSize >= results.length
                  ? "✅ All Analyzed"
                  : currentBatch === 0
                  ? "🔬 Start Analysis"
                  : `🔬 Next ${Math.min(
                      batchSize,
                      results.length - currentBatch * batchSize
                    )} Papers`}
              </Button>

              {analyzing && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          analysisProgress.total > 0
                            ? (analysisProgress.current /
                                analysisProgress.total) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  {currentlyAnalyzing && (
                    <div className="text-xs text-gray-600 text-center">
                      <span
                        className="font-medium block truncate"
                        title={currentlyAnalyzing}
                      >
                        {currentlyAnalyzing.length > 40
                          ? currentlyAnalyzing.substring(0, 40) + "..."
                          : currentlyAnalyzing}
                      </span>
                    </div>
                  )}
                  <div className="text-xs text-gray-600 text-center">
                    {analysisProgress.current} of {analysisProgress.total}
                  </div>
                </div>
              )}

              {!analyzing && Object.keys(analysisResults).length > 0 && (
                <div className="text-xs text-green-600 text-center font-medium">
                  ✅ {Object.keys(analysisResults).length} analyzed
                  {currentBatch * batchSize < results.length && (
                    <div className="mt-1 text-blue-600">
                      {results.length - Object.keys(analysisResults).length}{" "}
                      remaining
                    </div>
                  )}
                  {Object.values(analysisResults).some((r) =>
                    r.analysisMethod?.includes("abstract")
                  ) && (
                    <div className="mt-1 text-yellow-600">
                      <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1"></span>
                      Some abstract-only
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Papers */}
      <div className="space-y-4 pr-0">
        {results.map((paper) => {
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
