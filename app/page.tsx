"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Paperclip,
  Loader2,
  X,
  ArrowUp,
  Link as LinkIcon,
  Search,
  Globe,
  Plus,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Check,
  Asterisk,
  Sparkle,
  Flame,
  BookOpen,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import posthog from "posthog-js";
import { useUser } from "@clerk/nextjs";
import { useAppContext } from "@/components/AppContext";
import RelatedQueries from "@/components/RelatedQueries";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
// This will be the structure for our search results later
type SearchResult = {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  updated: string;
  links: {
    href: string;
    type: string;
    rel: string;
  }[];
  doi?: string;
  primaryCategory?: string;
  categories?: string[];
  relevance_score?: number;
  cited_by_count?: number;
  journal_name?: string;
  publisher?: string;
};

type RecentQuery = {
  id: string;
  query: string;
  createdAt: string;
};

const exampleTopics = [
  "The impact of social media on mental health",
  "Climate change and its effects on global agriculture",
  "The role of artificial intelligence in modern education",
  "The impact of social media on mental health",
];

const placeholders = [
  "e.g., 'Sustainable building materials in tropical climates'",
  "Describe what you're researching",
  "Paste your exposé or research question here",
  "What is your thesis topic?",
];

const Page = () => {
  const [file, setFile] = useState<File | null>(null);
  const [topic, setTopic] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [relevance, setRelevance] = useState<{
    score: number;
    summary: string;
    relevant_sections: Array<{
      section_heading?: string;
      text_snippet: string;
      page?: number;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const BATCH_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [visibleRelevantCount, setVisibleRelevantCount] = useState(BATCH_SIZE);
  const [searchQueryId, setSearchQueryId] = useState<string | null>(null);
  const { isSignedIn, user, isLoaded } = useUser();
  const { setSearchTriggered } = useAppContext();
  const [paperFeedback, setPaperFeedback] = useState<{
    [paperId: string]: "up" | "down" | null;
  }>({});
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [wigglingThumb, setWigglingThumb] = useState<string | null>(null);
  const [preEvaluations, setPreEvaluations] = useState<{
    [paperId: string]: { relevance: string; summary: string };
  }>({});
  const [showOnlyRelevant, setShowOnlyRelevant] = useState(false);
  const [heading, setHeading] = useState(
    "Find relevant papers for your research"
  );
  const [recentQueries, setRecentQueries] = useState<RecentQuery[]>([]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPdfUrl("");
    }
  };

  const handleRemoveFile = () => setFile(null);

  const handleTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTopic(e.target.value);
  };

  const handlePdfUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPdfUrl(e.target.value);
    if (file) setFile(null);
  };

  const toggleInputMode = () => {
    setInputMode(inputMode === "file" ? "url" : "file");
    if (inputMode === "file") {
      setFile(null);
    } else {
      setPdfUrl("");
    }
  };

  const handleCheckRelevance = async () => {
    if ((!file && !pdfUrl) || !topic) return;
    setLoading(true);
    setRetrying(false);
    setRelevance(null);

    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    } else if (pdfUrl) {
      formData.append("pdfUrl", pdfUrl);
    }
    formData.append("topic", topic);

    let attempt = 0;
    let success = false;
    let lastError = null;
    while (attempt < 2 && !success) {
      try {
        const res = await fetch("/api/relevance-summary", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const errorData = await res.json();
          console.error("Error from API:", errorData);
          throw new Error(errorData.error || "Failed to check relevance");
        }
        const data = await res.json();
        setRelevance(data.relevance);
        success = true;
      } catch (error) {
        lastError = error;
        if (attempt === 0) {
          setRetrying(true);
          await new Promise((res) => setTimeout(res, 500));
        }
      }
      attempt++;
    }
    if (!success) {
      alert("Failed to check relevance. Please try again.");
    }
    setRetrying(false);
    setLoading(false);
  };
  const handleSearch = async (overrideTopic?: string) => {
    const searchTopic = overrideTopic || topic;
    if (!searchTopic) return;
    setLoading(true);
    setResults([]);
    setVisibleCount(BATCH_SIZE);
    setVisibleRelevantCount(BATCH_SIZE);
    setCompletedSteps([]);

    // Step 1: Initialize search
    setCurrentStep("Generating your keywords...");

    // Trigger the survey popup after a delay
    setSearchTriggered(true);

    posthog.capture("papaer searched", {
      topic: searchTopic,
    });

    try {
      // Step 2: Save search query to database
      setCompletedSteps(["Generating your keywords..."]);
      setCurrentStep(
        "Generating your search query to search through 200m+ papers..."
      );
      const queryResponse = await fetch("/api/search-query-push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchTopic }),
      });

      if (queryResponse.ok) {
        const queryData = await queryResponse.json();
        setSearchQueryId(queryData.id);
        console.log("Search query saved with ID:", queryData.id);
      } else {
        console.warn("Failed to save search query, but continuing with search");
      }

      // Step 3: Search for papers
      setCompletedSteps([
        "Generating your keywords...",
        "Generating your search query to search through 200m+ papers...",
      ]);
      setCurrentStep("Searching through 200m+ papers...");
      const response = await fetch("/api/paper-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: searchTopic }),
      });

      if (!response.ok) {
        throw new Error("Failed to search for papers");
      }

      const data = await response.json();
      setKeywords(data.keywords);

      // Step 4: Evaluate papers for relevance
      setCompletedSteps([
        "Generating your keywords...",
        "Generating your search query to search through 200m+ papers...",
        "Searching through 200m+ papers...",
      ]);
      setCurrentStep("Evaluating paper relevance based on your topic...");
      const preEvalResults = await Promise.all(
        data.papers.map(async (paper: SearchResult) => {
          const res = await fetch("/api/pre-evaluate-relevance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: paper.title,
              summary: paper.summary,
              topic: searchTopic,
            }),
          });
          const preEval = await res.json();
          return { paperId: paper.id, ...preEval };
        })
      );

      // Step 5: Finalizing results
      setCompletedSteps([
        "Generating your keywords...",
        "Generating your search query to search through 200m+ papers...",
        "Searching through 200m+ papers...",
        "Evaluating paper relevance based on your topic...",
      ]);
      setCurrentStep("Organizing your results...");
      const preEvalMap: {
        [paperId: string]: { relevance: string; summary: string };
      } = {};
      preEvalResults.forEach(({ paperId, relevance, summary }) => {
        preEvalMap[paperId] = { relevance, summary };
      });
      setPreEvaluations(preEvalMap);
      console.log("Pre-evaluation results:", preEvalMap);
      setResults(data.papers);
      console.log("Search results:", data);

      // Mark all steps as completed
      setCompletedSteps([
        "Generating your keywords...",
        "Generating your search query to search through 200m+ papers...",
        "Searching through 200m+ papers...",
        "Evaluating paper relevance based on your topic...",
        "Organizing your results...",
      ]);
      setCurrentStep(null);
    } catch (error) {
      console.error(error);
      alert("Failed to search for papers. Please try again.");
      setCurrentStep(null);
      setCompletedSteps([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecentTopicClick = (topic: string) => {
    setTopic(topic);
    handleSearch(topic);
  };

  const fetchRecentQueries = async () => {
    try {
      const response = await fetch("/api/fetch-recent");
      if (response.ok) {
        const data = await response.json();
        setRecentQueries(data.queries || []);
      } else {
        console.warn("Failed to fetch recent queries");
      }
    } catch (error) {
      console.error("Error fetching recent queries:", error);
    }
  };

  const handleThumbsFeedback = (
    paperId: string,
    feedbackType: "up" | "down"
  ) => {
    // Toggle feedback: if same type is clicked, remove it; otherwise set new type
    const currentFeedback = paperFeedback[paperId];
    const newFeedback = currentFeedback === feedbackType ? null : feedbackType;

    setPaperFeedback((prev) => ({
      ...prev,
      [paperId]: newFeedback,
    }));

    // Trigger wiggle animation
    setWigglingThumb(`${paperId}-${feedbackType}`);
    setTimeout(() => setWigglingThumb(null), 500);

    // PostHog event tracking
    posthog.capture("paper_feedback", {
      paperId,
      feedbackType: newFeedback,
      topic,
      searchQueryId,
      previousFeedback: currentFeedback,
    });
  };

  useEffect(() => {
    posthog.capture("landing_page_view");
    fetchRecentQueries();
  }, []);

  useEffect(() => {
    // Debug auth state for production issues
    console.log("Auth state debug:", {
      isLoaded,
      isSignedIn,
      userId: user?.id,
      timestamp: new Date().toISOString(),
    });
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
    setVisibleRelevantCount(BATCH_SIZE);
  }, [results]);

  useEffect(() => {
    if (!loading) {
      setCurrentStep(null);
      setCompletedSteps([]);
    }
  }, [loading]);

  return (
    <div className="bg-white text-black min-h-screen flex overflow-y-auto flex-col justify-center items-center ">
      {results.length > 0 && <div className="mt-[10rem]" />}
      <main className="flex w-[48rem] max-w-screen flex-col items-center justify-center text-center px-4 mx-auto  lg:mt-[6rem]">
        {results.length > 0 && (
          <div className="text-[2rem] mb-8">
            <h2>Search Results</h2>
          </div>
        )}
        {!results.length && (
          <h2 className="font-playfair text-[2rem] mb-[2rem] mt-[10rem] lg:mt-[0rem]">
            {heading}
          </h2>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="w-full max-w-[48rem] flex flex-col relative h-auto rounded-[1.5rem] text-base border border-muted-foreground/30 p-[0.75rem] shadow-md"
        >
          <div className="relative w-full">
            <textarea
              placeholder={placeholders[placeholderIndex]}
              className="text-[1rem] border-none shadow-none bg-transparent placeholder:text-muted-foreground focus:outline-none focus:ring-0 resize-none w-full min-h-[2.5rem] max-h-[10rem] rounded-md p-2"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={1}
            />
          </div>
          <div className="flex items-end justify-end mt-[0.5rem]">
            <Button
              type="submit"
              className="justify-end items-center rounded-full ml-auto bg-foreground cursor-pointer text-background px-4 border-none shadow-none w-auto placeholder:text-muted-foreground focus:outline-none focus:ring-0"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <span className="text-[1rem]">find papers</span>
                  <Globe size={16} />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Loading Steps */}
        {loading && (
          <div className="w-full max-w-[48rem] mt-6 px-4">
            <div className="relative pl-6">
              {/* Vertical line */}
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-muted-foreground/30" />
              <div className="flex flex-col gap-6">
                {completedSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3 relative">
                    {/* Step icon */}
                    <div className="absolute -left-6 top-1">
                      <Check
                        size={16}
                        className="text-muted-foreground bg-white rounded-full border border-muted-foreground/30"
                      />
                    </div>
                    <span className="text-[1rem] text-left text-muted-foreground">
                      {step}
                    </span>
                  </div>
                ))}
                {currentStep && (
                  <div className="flex items-center gap-3 relative">
                    {/* Current step icon */}
                    <div className="absolute -left-6 top-1">
                      <Loader2
                        size={20}
                        className="animate-spin text-muted-foreground bg-white rounded-full border border-muted-foreground/30"
                      />
                    </div>
                    <span className="text-[1rem] text-left text-foreground">
                      {currentStep}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      {!loading && results.length === 0 && (
        <div className="mt-[4rem] w-full max-w-[48rem] px-[1rem] mx-auto">
          <h3 className="text-[1.25rem] font-medium mb-[1rem]">
            Recent Searches
          </h3>
          <ul>
            {recentQueries.length > 0
              ? recentQueries.map((queryItem) => (
                  <li
                    key={queryItem.id}
                    className="border-b border-muted flex flex-row gap-4 justify-between items-center text-foreground py-[1rem]"
                  >
                    {queryItem.query}
                    <Plus
                      size={24}
                      className="text-foreground cursor-pointer hover:text-foreground/30"
                      onClick={() => handleRecentTopicClick(queryItem.query)}
                    />
                  </li>
                ))
              : exampleTopics.map((topic, idx) => (
                  <li
                    key={idx}
                    className="border-b border-muted flex flex-row gap-4 justify-between items-center text-foreground py-[1rem]"
                  >
                    {topic}
                    <Plus
                      size={24}
                      className="text-foreground cursor-pointer hover:text-foreground/30"
                      onClick={() => handleRecentTopicClick(topic)}
                    />
                  </li>
                ))}
          </ul>
        </div>
      )}
      {/* Results section */}
      {results.length > 0 && (
        <div className="w-full max-w-[48rem] px-4 mt-[2rem] mx-auto items-center justify-center">
          <div className="mb-4 pb-[2rem] mx-auto ">
            <h3 className="text-[1.25rem] mb-[1rem]">Generated Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="bg-[#FED68C]/10 text-[#FFA600] px-3 py-1 rounded-full text-sm border border-muted"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Related Queries Section */}

          {/* <h3 className="text-[1.5rem] my-[2rem]">
            Found {results.length} relevant Papers
          </h3> */}
          <div className="mb-2 text-left text-foreground text-[1.25rem]">
            {/* Searched through {results.length} papers
            {" · "} */}
            Found{" "}
            {
              Object.values(preEvaluations).filter(
                (e) => e.relevance === "relevant"
              ).length
            }{" "}
            relevant papers
          </div>
          <div className="flex flex-col gap-2 my-[2rem] justify-end w-full">
            <div className="flex gap-2 justify-end w-full">
              <Button
                variant={!showOnlyRelevant ? "default" : "outline"}
                onClick={() => setShowOnlyRelevant(false)}
                className="text-[1rem] font-medium rounded-full border-foreground shadow-none cursor-pointer flex items-center gap-2"
              >
                {!showOnlyRelevant && (
                  <Check size={16} className="inline-block" />
                )}
                Show all
              </Button>
              <Button
                variant={showOnlyRelevant ? "default" : "outline"}
                onClick={() => setShowOnlyRelevant(true)}
                className="text-[1rem] font-medium rounded-full border-foreground shadow-none cursor-pointer flex items-center gap-2"
              >
                {showOnlyRelevant && (
                  <Check size={16} className="inline-block" />
                )}
                Relevant
              </Button>
            </div>
          </div>
          <div className="space-y-6 mb-[10rem] mt-[3rem]">
            {results
              .filter((paper) => {
                if (!showOnlyRelevant) return true;
                const preEval = preEvaluations[paper.id];
                return preEval && preEval.relevance === "relevant";
              })
              .slice(0, visibleCount)
              .map((paper) => (
                <div key={paper.id} className="">
                  <h4 className="text-[1.5rem] font-medium mb-2 flex flex-row justify-between items-center gap-[2rem]">
                    {paper.title}
                  </h4>

                  <div className="flex flex-wrap gap-1 mb-2 text-[0.75rem] text-muted-foreground">
                    {paper.authors.map((author, idx) => (
                      <span key={idx}>
                        {author}
                        {idx < paper.authors.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </div>

                  {/* <p className="text-[1rem] text-gray-700 mb-3 line-clamp-3">
                      {paper.summary}
                    </p> */}

                  <div className="flex flex-wrap gap-2 mb-3">
                    {paper.categories?.map((category, idx) => (
                      <span
                        key={idx}
                        className="bg-[#FFBAD8]/10 text-[#FF5BA2] px-2 py-1 rounded-full text-xs border border-muted"
                      >
                        {category}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>
                      Published:{" "}
                      {new Date(paper.published).toLocaleDateString()}
                    </span>
                  </div>

                  <div className=" border-b border-muted-foreground/30 py-[1rem]">
                    {preEvaluations[paper.id] ? (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div
                            className={`text-[1.25rem] font-medium ${
                              preEvaluations[paper.id].relevance === "relevant"
                                ? "text-green-700"
                                : "text-muted-foreground"
                            }`}
                          >
                            {preEvaluations[paper.id].relevance}
                          </div>
                          {/* {paper.relevance_score && (
                            <div className="text-foreground text-[1rem] font-medium">
                              Score: {paper.relevance_score.toFixed(2)}
                            </div>
                          )} */}
                        </div>
                        <div
                          className={`text-[1rem] ${
                            preEvaluations[paper.id].relevance === "relevant"
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {preEvaluations[paper.id].summary}
                        </div>
                        {paper.cited_by_count !== undefined && (
                          <>
                            <div className="flex flex-wrap gap-2 pt-[0.5rem]">
                              <div className="text-blue-900 text-sm px-2 w-fit border border-muted rounded-full flex items-center gap-1 justify-end">
                                <Asterisk size={24} />
                                cited by {paper.cited_by_count} papers
                              </div>
                              {(() => {
                                const year = new Date(
                                  paper.published
                                ).getFullYear();
                                const isNew = year > 2020;
                                const isHot =
                                  isNew && paper.cited_by_count > 50;
                                return (
                                  <>
                                    {isNew && (
                                      <div className=" text-green-700 text-sm px-2 py-1 border border-muted w-fit flex items-center gap-1 rounded-full">
                                        <Sparkle size={16} />
                                        new
                                      </div>
                                    )}
                                    {isHot && (
                                      <div className=" text-[#FFA600] text-sm px-2 py-1 border border-muted w-fit flex items-center gap-1 rounded-full">
                                        <Flame size={16} />
                                        hot
                                      </div>
                                    )}
                                    {paper.journal_name ? (
                                      <div className=" text-sm rounded-full px-2 py-1 text-orange-500 w-fit border border-muted flex items-center gap-2">
                                        <BookOpen size={16} />
                                        {paper.journal_name}
                                      </div>
                                    ) : paper.publisher ? (
                                      <div className="mb-1 text-xs px-2 py-1 border border-muted rounded-full text-foreground w-fit flex items-center gap-1">
                                        <BookOpen size={16} />
                                        Publisher: {paper.publisher}
                                      </div>
                                    ) : null}
                                  </>
                                );
                              })()}
                            </div>
                            <div className="flex gap-2 justify-end mt-[0.5rem]">
                              {paper.links
                                ?.filter(
                                  (link, idx, arr) =>
                                    link.type === "application/pdf" &&
                                    arr.findIndex(
                                      (l) =>
                                        l.type === "application/pdf" &&
                                        l.href === link.href
                                    ) === idx
                                )
                                .map((link, idx) => (
                                  <a
                                    key={idx}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center bg-foreground text-background hover:bg-foreground/80 px-4 py-1 rounded-full border border-foreground"
                                  >
                                    <Paperclip
                                      size={16}
                                      className="mr-2 text-[1rem]"
                                    />
                                    pdf link
                                  </a>
                                ))}
                              {(!paper.links ||
                                !paper.links.some(
                                  (link) => link.type === "application/pdf"
                                )) && (
                                <span className="text-muted-foreground text-xs italic">
                                  No PDF available
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-[1rem]">
                        Analyzing relevance...
                      </div>
                    )}
                    <div className="flex flex-row gap-2 text-[0.75rem] my-[1rem] justify-start text-muted-foreground">
                      helpful?
                      <ThumbsDown
                        size={12}
                        className={`cursor-pointer transition-all mt-1 duration-200 transform hover:scale-120 active:scale-80 ${
                          paperFeedback[paper.id] === "down"
                            ? "text-muted-foreground fill-foreground"
                            : "text-muted-foreground hover:text-muted-foreground"
                        } ${
                          wigglingThumb === `${paper.id}-down` ? "wiggle" : ""
                        }`}
                        onClick={() => handleThumbsFeedback(paper.id, "down")}
                      />
                      <ThumbsUp
                        size={12}
                        className={`cursor-pointer transition-all duration-200 transform hover:scale-120 active:scale-80 ${
                          paperFeedback[paper.id] === "up"
                            ? "text-muted-foreground fill-foreground"
                            : "text-muted-foreground hover:text-muted-foreground"
                        } ${
                          wigglingThumb === `${paper.id}-up` ? "wiggle" : ""
                        }`}
                        onClick={() => handleThumbsFeedback(paper.id, "up")}
                      />
                    </div>
                  </div>
                </div>
              ))}
            <RelatedQueries
              originalQuery={topic}
              onQuerySelect={(newQuery) => {
                setTopic(newQuery);
                handleSearch(newQuery);
              }}
            />
            {results.length > visibleCount && (
              <div className="flex justify-center mt-8">
                {!isLoaded ? (
                  <button
                    className="px-6 py-2 rounded-full bg-foreground/50 text-background cursor-not-allowed"
                    disabled
                  >
                    <Loader2 className="animate-spin" size={16} />
                  </button>
                ) : isSignedIn ? (
                  <button
                    className="px-6 py-2 rounded-full bg-foreground text-background hover:bg-foreground/80 transition cursor-pointer"
                    onClick={() => {
                      posthog.capture("more results loaded", {
                        topic,
                        count: visibleCount + BATCH_SIZE,
                      });
                      setVisibleCount(visibleCount + BATCH_SIZE);
                    }}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Load more results"}
                  </button>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-muted-foreground text-sm">
                      Sign up for free to load more results
                    </p>
                    <div className="flex gap-3">
                      <SignInButton>
                        <Button className="bg-background/30 w-auto px-4 py-2 text-foreground cursor-pointer rounded-full border border-muted/30 hover:bg-background/10 hover:text-background">
                          Log In
                        </Button>
                      </SignInButton>
                      <SignUpButton>
                        <Button
                          className="bg-foreground w-auto px-4 py-2 text-background cursor-pointer rounded-full hover:bg-foreground/80"
                          onClick={() => {
                            posthog.capture("sign_up_clicked", {
                              location: "load_more_results",
                              topic,
                              searchQueryId,
                            });
                          }}
                        >
                          Sign Up
                        </Button>
                      </SignUpButton>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
