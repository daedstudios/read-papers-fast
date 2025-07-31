import { useRouter } from "next/navigation";
import posthog from "posthog-js";

// Import search limiter constants
const MAX_FREE_SEARCHES = 2;
const STORAGE_KEY = "search_count";

// Types
export type FactCheckResult = {
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

export type PaperAnalysisResult = {
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

interface FactCheckHandlerParams {
  statement: string;
  isSignedIn: boolean;
  hasPlanBase: boolean;
  isLimitReached: boolean;
  userId?: string; // Add userId parameter
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setResults: (results: FactCheckResult[]) => void;
  setKeywords: (keywords: string[]) => void;
  setAnalysisResults: (results: { [paperId: string]: PaperAnalysisResult }) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setCurrentBatch: (batch: number) => void;
  setFinalVerdict: (verdict: any) => void;
  setGeneratingVerdict: (generating: boolean) => void;
  setSavingToDb: (saving: boolean) => void;
  setShareableId: (id: string | null) => void;
  setDbSaveError: (error: string | null) => void;
  setShowSignUpForm?: (show: boolean) => void;
  setShowCheckoutForm?: (show: boolean) => void;
  increment?: () => void;
  router: ReturnType<typeof useRouter>;
}

interface GenerateFinalVerdictParams {
  statement: string;
  papers: FactCheckResult[];
  analysisResults: { [paperId: string]: PaperAnalysisResult };
  keywords: string[];
  isSignedIn: boolean;
  hasPlanBase: boolean;
  userId?: string; // Add userId parameter
  setGeneratingVerdict: (generating: boolean) => void;
  setFinalVerdict: (verdict: any) => void;
  setError: (error: string | null) => void;
  setSavingToDb: (saving: boolean) => void;
  setShareableId: (id: string | null) => void;
  setDbSaveError: (error: string | null) => void;
  router: ReturnType<typeof useRouter>;
}

export const handleFactCheck = async ({
  statement,
  isSignedIn,
  hasPlanBase,
  isLimitReached,
  userId,
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
  setShowCheckoutForm,
  increment,
  router,
}: FactCheckHandlerParams) => {
  if (!statement.trim()) {
    setError("Please enter a statement to fact-check");
    return;
  }

  // Check if user has reached the search limit (only for non-signed in users)
  if (!isSignedIn && isLimitReached) {
    if (setShowSignUpForm) {
      setShowSignUpForm(true);
    }
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
      body: JSON.stringify({
        statement,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fact-check the statement");
    }

    const data = await response.json();
    setResults(data.papers);
    setKeywords(data.keywords);

    // Increment search count on successful paper search (only for non-signed in users)
    if (!hasPlanBase && increment) {
      increment();
    }

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
      await generateFinalVerdict({
        statement,
        papers: data.papers,
        analysisResults: {},
        keywords: data.keywords,
        isSignedIn,
        hasPlanBase,
        userId,
        setGeneratingVerdict,
        setFinalVerdict,
        setError,
        setSavingToDb,
        setShareableId,
        setDbSaveError,
        router,
      });
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : "An error occurred");
  } finally {
    setLoading(false);
  }
};

export const generateFinalVerdict = async ({
  statement,
  papers,
  analysisResults,
  keywords,
  isSignedIn,
  hasPlanBase,
  userId,
  setGeneratingVerdict,
  setFinalVerdict,
  setError,
  setSavingToDb,
  setShareableId,
  setDbSaveError,
  router,
}: GenerateFinalVerdictParams) => {
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
    await saveToDatabase({
      statement,
      keywords,
      finalVerdict: verdict,
      papers,
      analysisResults,
      isSignedIn,
      hasPlanBase,
      userId,
      setSavingToDb,
      setShareableId,
      setDbSaveError,
      router,
    });
  } catch (error) {
    console.error("Error generating final verdict:", error);
    setError("Failed to generate final verdict");
  } finally {
    setGeneratingVerdict(false);
  }
};

interface SaveToDatabaseParams {
  statement: string;
  keywords: string[];
  finalVerdict: any;
  papers: FactCheckResult[];
  analysisResults: { [paperId: string]: PaperAnalysisResult };
  isSignedIn: boolean;
  hasPlanBase: boolean;
  userId?: string; // Add userId parameter
  setSavingToDb: (saving: boolean) => void;
  setShareableId: (id: string | null) => void;
  setDbSaveError: (error: string | null) => void;
  router: ReturnType<typeof useRouter>;
}

export const saveToDatabase = async ({
  statement,
  keywords,
  finalVerdict,
  papers,
  analysisResults,
  isSignedIn,
  hasPlanBase,
  userId,
  setSavingToDb,
  setShareableId,
  setDbSaveError,
  router,
}: SaveToDatabaseParams) => {
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
        finalVerdict: finalVerdict,
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

   
    // Redirect to shared page after successful save
    // Check if this was exactly the last free search (only for signed users without base plan)
    let shouldShowCheckout = false;
    
    if (isSignedIn && !hasPlanBase && userId && typeof window !== 'undefined') {
      try {
        // Use the user-limit API to check if user has reached limit
        const response = await fetch('/api/fact-check/user-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId })
        });
        
        if (response.ok) {
          const hasSearchesAvailable = await response.json();
          shouldShowCheckout = !hasSearchesAvailable;
        }
      } catch (error) {
        console.error('Error checking user limit:', error);
      }
    }
    
    const redirectUrl = shouldShowCheckout
      ? `/fact-check/shared/${result.shareableId}?checkout=1`
      : `/fact-check/shared/${result.shareableId}`;
    
    router.push(redirectUrl);
  } catch (error) {
    console.error("Error saving to database:", error);
    setDbSaveError("Failed to save data for sharing");
  } finally {
    setSavingToDb(false);
  }
};

// Deep analysis handler
export const handleDeepAnalysis = async (
  paperId: string,
  statement: string,
  papers: FactCheckResult[],
  currentAnalysisResults: { [paperId: string]: PaperAnalysisResult },
  setCurrentAnalysisResults: (results: { [paperId: string]: PaperAnalysisResult }) => void
) => {
  const paper = papers.find((p) => p.id === paperId);
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
        statement: statement,
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
    setCurrentAnalysisResults({
      ...currentAnalysisResults,
      [paperId]: analysisResult,
    });

    console.log("Deep analysis completed for paper:", paperId, analysisResult);
  } catch (error) {
    console.error("Deep analysis error:", error);
    alert(
      `Deep analysis failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
