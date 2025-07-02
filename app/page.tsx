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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RelevanceSummaryCard } from "@/components/RelevanceSummaryCard";
import posthog from "posthog-js";
import { useUser } from "@clerk/nextjs";
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
  const [evaluatedResults, setEvaluatedResults] = useState<{
    [paperId: string]: {
      loading: boolean;
      relevance: any | null;
    };
  }>({});
  const BATCH_SIZE = 5;
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [searchQueryId, setSearchQueryId] = useState<string | null>(null);
  const { isSignedIn, user, isLoaded } = useUser();
  const [paperFeedback, setPaperFeedback] = useState<{
    [paperId: string]: "up" | "down" | null;
  }>({});
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [wigglingThumb, setWigglingThumb] = useState<string | null>(null);

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

    posthog.capture("papaer searched", {
      topic: searchTopic,
    });

    try {
      // First, save the search query to the database
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
      setResults(data.papers);
      console.log("Search results:", data);
    } catch (error) {
      console.error(error);
      alert("Failed to search for papers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecentTopicClick = (topic: string) => {
    setTopic(topic);
    handleSearch(topic);
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
    if (!results.length || !topic) return;
    let cancelled = false;

    // Only evaluate up to visibleCount
    const toEvaluate = results
      .slice(0, visibleCount)
      .filter((paper) => !evaluatedResults[paper.id]);

    if (toEvaluate.length === 0) return;

    async function evaluateBatch() {
      for (const paper of toEvaluate) {
        setEvaluatedResults((prev) => ({
          ...prev,
          [paper.id]: { loading: true, relevance: null },
        }));
        const pdfLink = paper.links.find(
          (link) => link.type === "application/pdf"
        )?.href;
        let relevance = null;
        if (pdfLink) {
          const formData = new FormData();
          formData.append("pdfUrl", pdfLink);
          formData.append("topic", topic);
          try {
            const res = await fetch("/api/relevance-summary", {
              method: "POST",
              body: formData,
            });
            const data = await res.json();
            relevance = data.relevance;
          } catch (e) {
            relevance = {
              score: 0,
              summary: "Failed to evaluate.",
              relevant_sections: [],
            };
          }
        } else {
          relevance = {
            score: 0,
            summary: "No PDF link.",
            relevant_sections: [],
          };
        }
        if (!cancelled) {
          setEvaluatedResults((prev) => ({
            ...prev,
            [paper.id]: { loading: false, relevance },
          }));
        }
      }
    }

    evaluateBatch();
    return () => {
      cancelled = true;
    };
  }, [results, topic, visibleCount]);

  useEffect(() => {
    posthog.capture("landing_page_view");
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

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
          <h2 className="text-[2rem] mb-[2rem] mt-[10rem] lg:mt-[0rem]">
            Find relevant papers for your research
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
      </main>
      {results.length === 0 && (
        <div className="mt-[4rem] w-full max-w-[48rem] px-[1rem] mx-auto">
          <h3 className="text-[1.25rem] font-medium mb-[1rem]">
            Recent Searches
          </h3>
          <ul>
            {exampleTopics.map((topic, idx) => (
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
        <div className="w-full max-w-[48rem] px-4 mt-[4rem] mx-auto">
          <div className="mb-4  pb-[2rem]">
            <h3 className="text-[1rem] mb-[1rem] font-medium">
              Generated Keywords
            </h3>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="bg-[#FED68C]/20 text-[#FED68C] px-3 py-1 rounded-full text-sm border border-[#FED68C]"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* <h3 className="text-[1.5rem] my-[2rem]">
            Found {results.length} relevant Papers
          </h3> */}

          <div className="space-y-6 mb-[10rem] mt-[3rem]">
            {results.slice(0, visibleCount).map((paper) => (
              <div key={paper.id} className="">
                <h4 className="text-[1.5rem] font-medium mb-2 flex flex-row justify-between items-center gap-[2rem]">
                  {paper.title}
                </h4>

                <div className="flex flex-wrap gap-1 mb-2 text-sm text-gray-600">
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
                      className="bg-[#FFBAD8]/20 text-[#FFBAD8] px-2 py-0.5 rounded-full text-xs border border-[#FFBAD8]"
                    >
                      {category}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>
                    Published: {new Date(paper.published).toLocaleDateString()}
                  </span>

                  <div className="flex gap-2">
                    {paper.links?.map((link, idx) => {
                      if (link.type === "application/pdf") {
                        return (
                          <a
                            key={idx}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center bg-foreground text-background hover:bg-foreground/80 px-4 py-2 rounded-full border border-foreground"
                          >
                            <Paperclip size={16} className="mr-1 text-[1rem]" />
                            PDF
                          </a>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>

                <div className=" border-b border-muted-foreground/30 py-[1rem]">
                  <div className="flex flex-row gap-6  mb-[1rem] justify-start">
                    <ThumbsDown
                      size={20}
                      className={`cursor-pointer transition-all mt-1 duration-200 transform hover:scale-120 active:scale-80 ${
                        paperFeedback[paper.id] === "down"
                          ? "text-foreground fill-foreground"
                          : "text-foreground hover:text-muted-foreground"
                      } ${
                        wigglingThumb === `${paper.id}-down` ? "wiggle" : ""
                      }`}
                      onClick={() => handleThumbsFeedback(paper.id, "down")}
                    />

                    <ThumbsUp
                      size={20}
                      className={`cursor-pointer transition-all duration-200 transform hover:scale-120 active:scale-80 ${
                        paperFeedback[paper.id] === "up"
                          ? "text-foreground fill-foreground"
                          : "text-foreground hover:text-muted-foreground"
                      } ${wigglingThumb === `${paper.id}-up` ? "wiggle" : ""}`}
                      onClick={() => handleThumbsFeedback(paper.id, "up")}
                    />
                  </div>
                  {evaluatedResults[paper.id]?.loading ? (
                    <div className=" rounded-[1rem] bg-white">
                      <span className="text-[1rem] font-medium flex items-center justify-between gap-2">
                        Relevance Score:
                        <Loader2
                          className="animate-spin text-gray-400"
                          size={28}
                        />
                      </span>
                    </div>
                  ) : evaluatedResults[paper.id]?.relevance ? (
                    <RelevanceSummaryCard
                      data={evaluatedResults[paper.id].relevance}
                    />
                  ) : null}
                </div>
              </div>
            ))}
            {results.length > visibleCount && (
              <div className="flex justify-center mt-8">
                {isSignedIn ? (
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
                      Sign in to load more results
                    </p>
                    <div className="flex gap-3">
                      <SignInButton>
                        <Button className="bg-background/30 w-auto px-4 py-2 text-foreground cursor-pointer rounded-full border border-muted/30 hover:bg-background/10 hover:text-background">
                          Log In
                        </Button>
                      </SignInButton>
                      <SignUpButton>
                        <Button className="bg-foreground w-auto px-4 py-2 text-background cursor-pointer rounded-full hover:bg-foreground/80">
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
