"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Search,
  Globe,
  CheckCircle,
  ArrowUp,
  ArrowUpRight,
  ArrowUpLeft,
  ArrowDownRight,
  ArrowDownLeft,
  Share2,
  ArrowUpFromLine,
  TextSearch,
  Gavel,
} from "lucide-react";
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
import posthog from "posthog-js";

// Types for our fact-check results
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

const FactCheckPage = () => {
  const [statement, setStatement] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FactCheckResult[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  const handleFactCheck = async () => {
    if (!statement.trim()) {
      setError("Please enter a statement to fact-check");
      return;
    }

    // PostHog event tracking for fact-check search
    posthog.capture("fact_check_search", {
      statement_length: statement.length,
      statement_words: statement.split(" ").length,
      location: "fact_check_page",
      timestamp: new Date().toISOString(),
    });

    setLoading(true);
    setError(null);
    setResults([]);
    setKeywords([]);
    // Reset analysis state
    setAnalysisResults({});
    setAnalyzing(false);
    setCurrentBatch(0);
    // Reset final verdict
    setFinalVerdict(null);
    // Reset database save state
    setSavingToDb(false);
    setShareableId(null);
    setDbSaveError(null);

    try {
      const response = await fetch("/api/fact-check/open-alex", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ statement }),
      });

      if (!response.ok) {
        throw new Error("Failed to fact-check statement");
      }

      const data = await response.json();
      setResults(data.papers);
      setKeywords(data.keywords);

      // PostHog event tracking for successful search results
      posthog.capture("fact_check_results", {
        papers_found: data.papers.length,
        keywords_count: data.keywords.length,
        statement_length: statement.length,
        statement_words: statement.split(" ").length,
        location: "fact_check_page",
        timestamp: new Date().toISOString(),
      });

      // Automatically generate final verdict
      if (data.papers && data.papers.length > 0) {
        generateFinalVerdict(data.papers);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Get PDF links from papers
  const getPdfLinks = (paper: FactCheckResult): string[] => {
    return paper.links
      .filter((link) => link.type === "application/pdf" && link.href)
      .map((link) => link.href);
  };

  const handleDeepAnalysis = async () => {
    setAnalyzing(true);

    // PostHog event tracking for deep analysis start
    posthog.capture("fact_check_deep_analysis_started", {
      papers_count: results.length,
      batch_number: currentBatch + 1,
      batch_size: BATCH_SIZE,
      statement_length: statement.length,
      location: "fact_check_page",
      timestamp: new Date().toISOString(),
    });

    // Calculate which papers to analyze in this batch
    const startIndex = currentBatch * BATCH_SIZE;
    const endIndex = Math.min(startIndex + BATCH_SIZE, results.length);
    const papersToAnalyze = results.slice(startIndex, endIndex);

    console.log(
      `Analyzing batch ${currentBatch + 1}: papers ${
        startIndex + 1
      }-${endIndex} of ${results.length}`
    );

    // Set progress for current batch
    setAnalysisProgress({
      current: startIndex,
      total: results.length,
    });

    let currentIndex = startIndex;

    for (const paper of papersToAnalyze) {
      const pdfLinks = getPdfLinks(paper);
      setCurrentlyAnalyzing(paper.title);
      currentIndex++;
      setAnalysisProgress({
        current: currentIndex,
        total: results.length,
      });

      let analysisSuccess = false;

      // First, try PDF analysis if PDFs are available
      if (pdfLinks.length > 0) {
        for (const pdfUrl of pdfLinks) {
          try {
            console.log(
              `Analyzing paper ${currentIndex}/${results.length}: ${paper.title} (PDF)`
            );

            const response = await fetch("/api/fact-check/paper-query", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                pdfUrl: pdfUrl,
                statement: statement,
                paperTitle: paper.title,
                abstract: paper.summary,
                authors: paper.authors,
                journal: paper.journal_name,
              }),
            });

            const result = await response.json();

            setAnalysisResults((prev) => ({
              ...prev,
              [paper.id]: result,
            }));

            analysisSuccess = true;
            break; // Successfully analyzed, no need to try other PDF links
          } catch (error) {
            console.error(`Error analyzing ${paper.title} with PDF:`, error);
            // Continue to next PDF link
          }
        }
      }

      // If PDF analysis failed or no PDFs available, try abstract-based analysis
      if (!analysisSuccess && paper.summary) {
        try {
          console.log(
            `Analyzing paper ${currentIndex}/${results.length}: ${paper.title} (Abstract)`
          );

          const response = await fetch("/api/fact-check/paper-query", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              statement: statement,
              paperTitle: paper.title,
              abstract: paper.summary,
              authors: paper.authors,
              journal: paper.journal_name,
            }),
          });

          const result = await response.json();

          setAnalysisResults((prev) => ({
            ...prev,
            [paper.id]: result,
          }));

          analysisSuccess = true;
        } catch (error) {
          console.error(`Error analyzing ${paper.title} with abstract:`, error);
        }
      }

      if (!analysisSuccess) {
        // Neither PDF nor abstract analysis worked
        setAnalysisResults((prev) => ({
          ...prev,
          [paper.id]: {
            paperId: paper.title,
            pdfUrl: null,
            statement: statement,
            analysis: null,
            error: "Unable to analyze paper - no accessible PDF or abstract",
          },
        }));
      }

      // Add a small delay between requests to be respectful to APIs
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Update batch counter
    setCurrentBatch((prev) => prev + 1);
    setCurrentlyAnalyzing(null);
    setAnalyzing(false);
  };

  const generateFinalVerdict = async (papers: FactCheckResult[]) => {
    if (papers.length === 0) return;

    setGeneratingVerdict(true);
    try {
      const response = await fetch("/api/fact-check/final-verdict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          statement,
          papers: papers,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate final verdict");
      }

      const verdict = await response.json();
      setFinalVerdict(verdict);

      // PostHog event tracking for final verdict generation
      posthog.capture("fact_check_verdict_generated", {
        verdict_type: verdict.verdict,
        confidence_score: verdict.confidence_score,
        papers_analyzed: papers.length,
        statement_length: statement.length,
        location: "fact_check_page",
        timestamp: new Date().toISOString(),
      });

      // Automatically save to database after final verdict is generated
      await saveToDatabase(papers, verdict);
    } catch (error) {
      console.error("Error generating final verdict:", error);
      setError("Failed to generate final verdict");
    } finally {
      setGeneratingVerdict(false);
    }
  };

  const saveToDatabase = async (papers: FactCheckResult[], verdict: any) => {
    setSavingToDb(true);
    setDbSaveError(null);

    try {
      const response = await fetch("/api/fact-check/db-save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          statement,
          keywords,
          finalVerdict: verdict,
          papers: papers,
          analysisResults: analysisResults,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save to database");
      }

      const result = await response.json();
      setShareableId(result.shareableId);
      console.log("Data saved to database successfully:", result);

      // PostHog event tracking for successful database save
      posthog.capture("fact_check_saved", {
        shareable_id: result.shareableId,
        papers_count: papers.length,
        has_analysis: Object.keys(analysisResults).length > 0,
        statement_length: statement.length,
        location: "fact_check_page",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error saving to database:", error);
      setDbSaveError("Failed to save data for sharing");
    } finally {
      setSavingToDb(false);
    }
  };

  // Progress bar state
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  // Animate progress bar with a fixed timer when loading
  useEffect(() => {
    if (loading) {
      setProgress(0);
      if (progressRef.current) clearInterval(progressRef.current);
      progressRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev < 100) return prev + 0.2;
          return 100;
        });
      }, 50);
    } else {
      setProgress(100);
      if (progressRef.current) clearInterval(progressRef.current);
    }
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [loading]);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center">
      <div className="container w-2xl max-w-[90%] mx-auto ">
        <div className="text-center mb-8 mt-[10rem] mx-auto">
          <h1 className="text-[2.5rem] mb-4 ">Is this true?</h1>
        </div>

        {/* Input Form */}
        <Card className="mb-[1rem] rounded-sm shadow-none w-full border-foreground p-4">
          {/* <CardHeader>
            <CardTitle>Enter Statement to Fact-Check</CardTitle>
            <CardDescription>
              Provide any claim, statement, or assertion you want to verify with
              academic literature
            </CardDescription>
          </CardHeader> */}

          <div className="space-y-4">
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="e.g., 'Vitamin D deficiency is linked to increased risk of depression' or 'Climate change is causing more frequent extreme weather events'"
              className="w-full focus:outline-none  min-h-[160px] resize-y"
              disabled={loading}
            />

            {error && <div className="text-red-500 text-sm">{error}</div>}

            {/* Button or Progress Bar */}
            {loading ? (
              <div className="w-full flex flex-col items-center justify-center">
                <div className="w-full bg-white border border-foreground h-8 flex items-center relative overflow-hidden">
                  <div
                    className="absolute left-0 top-0 inset-0 w-full bg-[#C5C8FF] transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleFactCheck}
                className="w-full py-3 text-[1rem] rounded-none border border-foreground bg-foreground text-background flex items-center gap-2 cursor-pointer"
              >
                fact check
                <Globe size={16} />
              </Button>
            )}
          </div>
        </Card>
        <div className="mb-[3rem] text-[1rem] mx-auto w-full text-center text-foreground ">
          Fact-check viral claims using 200m+ peer-reviewed papers.
        </div>

        {/* Three-Step Process */}
        {results.length === 0 && (
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
                    Upload a post, paste a quote, or just type out the thing
                    that made your brain twitch.
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
                    Let us search through over 200m+ papers to find real
                    evidence backing or debunking the claim.
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
        )}

        {/* Loading State */}

        {/* Keywords Display */}
        {/* {keywords.length > 0 && !loading && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Search Keywords</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )} */}

        {/* Results and Deep Analysis */}
        {results.length > 0 && !loading && (
          <div className="space-y-6">
            {/* Final Verdict Loading State */}
            {generatingVerdict && (
              <div className="text-center py-8 mb-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
                <p className="text-foreground">Generating final verdict...</p>
              </div>
            )}

            {/* Final Verdict Display */}
            {finalVerdict && (
              <div className="mb-8">
                <FinalVerdictCard
                  verdict={finalVerdict}
                  statement={statement}
                  onFilterChange={handleFilterChange}
                  currentFilter={paperFilter}
                  shareableId={shareableId}
                />

                {dbSaveError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-sm">
                    <span className="text-red-700">⚠ {dbSaveError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Papers Display */}
            <div className="space-y-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                  Found {results.length} Relevant Papers
                </h2>
                {(shareableId || (results.length > 0 && finalVerdict)) && (
                  <ChatDrawer
                    shareableId={shareableId || undefined}
                    directData={{
                      statement,
                      keywords,
                      finalVerdict,
                      papersCount: results.length,
                      papers: results.map((paper) => ({
                        title: paper.title,
                        authors: paper.authors,
                        summary: paper.summary,
                        published: paper.published,
                        journalName: paper.journal_name,
                        relevanceScore: paper.relevance_score,
                        citedByCount: paper.cited_by_count,
                        analysis: analysisResults[paper.id]
                          ? {
                              supportLevel:
                                analysisResults[paper.id].analysis
                                  ?.support_level,
                              confidence:
                                analysisResults[paper.id].analysis?.confidence,
                              summary:
                                analysisResults[paper.id].analysis?.summary,
                              keyFindings:
                                analysisResults[paper.id].analysis
                                  ?.key_findings || [],
                              limitations:
                                analysisResults[paper.id].analysis
                                  ?.limitations || [],
                            }
                          : null,
                      })),
                    }}
                    triggerText="Ask Questions"
                    variant="outline"
                  />
                )}
              </div>

              <PaperResult
                results={results}
                statement={statement}
                analysisResults={analysisResults}
                analyzing={analyzing}
                currentlyAnalyzing={currentlyAnalyzing}
                analysisProgress={analysisProgress}
                currentBatch={currentBatch}
                batchSize={BATCH_SIZE}
                onStartAnalysis={handleDeepAnalysis}
                paperFilter={paperFilter}
              />
            </div>
          </div>
        )}

        {/* No Results */}
        {results.length === 0 && !loading && keywords.length > 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600">
                No relevant papers found for your statement. Try rephrasing or
                using different terms.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FactCheckPage;
