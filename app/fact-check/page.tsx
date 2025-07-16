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
import PaperResult from "@/components/find-componenets/PaperResult";

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

  const handleFactCheck = async () => {
    if (!statement.trim()) {
      setError("Please enter a statement to fact-check");
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setKeywords([]);
    // Reset analysis state
    setAnalysisResults({});
    setAnalyzing(false);
    setCurrentBatch(0);

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

  return (
    <div className="min-h-screen bg-white text-black p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 mt-16">
          <h1 className="text-4xl font-bold mb-4">
            Fact Check with Academic Papers
          </h1>
          <p className="text-gray-600 text-lg">
            Enter a statement to find relevant academic papers for fact-checking
          </p>
        </div>

        {/* Input Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Enter Statement to Fact-Check</CardTitle>
            <CardDescription>
              Provide any claim, statement, or assertion you want to verify with
              academic literature
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="e.g., 'Vitamin D deficiency is linked to increased risk of depression' or 'Climate change is causing more frequent extreme weather events'"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-y"
                disabled={loading}
              />

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <Button
                onClick={handleFactCheck}
                disabled={loading || !statement.trim()}
                className="w-full py-3 text-lg"
              >
                {loading
                  ? "Searching Academic Papers..."
                  : "Fact-Check Statement"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">
              Searching through academic papers...
            </p>
          </div>
        )}

        {/* Keywords Display */}
        {keywords.length > 0 && !loading && (
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
        )}

        {/* Results and Deep Analysis */}
        {results.length > 0 && !loading && (
          <div className="space-y-6">
            {/* Papers Display */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">
                Found {results.length} Relevant Papers
              </h2>

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
