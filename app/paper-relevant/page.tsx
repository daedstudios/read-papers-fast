"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Paperclip,
  Loader2,
  X,
  ArrowUp,
  Link as LinkIcon,
  FileText,
  FileStack,
  BookMarked,
  Link2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import posthog from "posthog-js";
import { RelevanceSummaryCard } from "@/components/RelevanceSummaryCard";

// Type for parsed .bib entries
type BibEntry = {
  id: string;
  title: string;
  authors?: string;
  journal?: string;
  year?: string;
  url?: string;
  doi?: string;
  abstract?: string;
};

const Page = () => {
  const [file, setFile] = useState<File | null>(null);
  const [topic, setTopic] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [inputMode, setInputMode] = useState<"file" | "url" | "bib">("file");
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
  const bibFileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [bibEntries, setBibEntries] = useState<BibEntry[]>([]);
  const [bulkResults, setBulkResults] = useState<any[]>([]);

  // Parse .bib file content
  const parseBibFile = (content: string): BibEntry[] => {
    const entries: BibEntry[] = [];
    console.log("Starting to parse .bib content");

    // More robust regex to handle different .bib formats
    const entryRegex = /@(\w+)\{([^,]+),([\s\S]*?)\n\}/g;
    let match;

    while ((match = entryRegex.exec(content)) !== null) {
      const entryType = match[1];
      const entryId = match[2];
      const entryContent = match[3];

      console.log("Found entry:", {
        entryType,
        entryId,
        contentLength: entryContent.length,
      });

      // Extract fields from the entry content - handle both single and multi-line fields
      const titleMatch = entryContent.match(
        /title\s*=\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/i
      );
      const authorsMatch = entryContent.match(
        /author\s*=\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/i
      );
      const journalMatch = entryContent.match(
        /journal\s*=\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/i
      );
      const yearMatch = entryContent.match(/year\s*=\s*\{([^}]+)\}/i);
      const urlMatch = entryContent.match(/url\s*=\s*\{([^}]+)\}/i);
      const doiMatch = entryContent.match(/doi\s*=\s*\{([^}]+)\}/i);
      const abstractMatch = entryContent.match(
        /abstract\s*=\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/i
      );

      if (titleMatch) {
        const title = titleMatch[1].replace(/[{}]/g, "").trim();
        console.log("Extracted title:", title);

        entries.push({
          id: entryId,
          title: title,
          authors: authorsMatch
            ? authorsMatch[1].replace(/[{}]/g, "").trim()
            : undefined,
          journal: journalMatch
            ? journalMatch[1].replace(/[{}]/g, "").trim()
            : undefined,
          year: yearMatch
            ? yearMatch[1].replace(/[{}]/g, "").trim()
            : undefined,
          url: urlMatch ? urlMatch[1].replace(/[{}]/g, "").trim() : undefined,
          doi: doiMatch ? doiMatch[1].replace(/[{}]/g, "").trim() : undefined,
          abstract: abstractMatch
            ? abstractMatch[1].replace(/[{}]/g, "").trim()
            : undefined,
        });
      } else {
        console.log("No title found for entry:", entryId);
      }
    }

    console.log("Total entries parsed:", entries.length);
    return entries;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    console.log("File upload triggered:", {
      inputMode,
      selectedFiles: selected,
    });

    if (inputMode === "bib") {
      // Handle .bib file
      const bibFile = selected[0];
      console.log("Processing .bib file:", bibFile);

      if (bibFile && bibFile.name.endsWith(".bib")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          console.log("File read successfully");
          const content = event.target?.result as string;
          console.log("File content length:", content.length);
          console.log("First 500 chars:", content.substring(0, 500));

          const entries = parseBibFile(content);
          console.log("Parsed entries:", entries.length, entries);

          setBibEntries(entries);
          setFiles([bibFile]);
        };
        reader.onerror = (error) => {
          console.error("Error reading file:", error);
        };
        reader.readAsText(bibFile);
      } else {
        console.log("File is not a .bib file or no file selected");
      }
    } else {
      // Handle PDF files
      console.log("Processing PDF files");
      setFiles(selected);
      setBibEntries([]);
    }
    setPdfUrl("");
  };

  const handleRemoveFile = () => setFile(null);

  const handleTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTopic(e.target.value);
  };

  const handlePdfUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPdfUrl(e.target.value);
    if (file) setFile(null);
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

        // Track successful relevance summary generation
        posthog.capture("pdf_uploaded", {
          topic: topic,
          source_type: file ? "file" : "url",
          file_name: file?.name,
          url: pdfUrl || undefined,
          relevance_score: data.relevance.score,
        });
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

  const handleBulkCheckRelevance = async () => {
    if (inputMode === "bib") {
      if (bibEntries.length === 0 || !topic) return;
      setLoading(true);
      setBulkResults([]);
      const results: any[] = [];

      await Promise.all(
        bibEntries.map(async (entry) => {
          try {
            // For .bib entries, we'll evaluate based on title and abstract
            const res = await fetch("/api/pre-evaluate-relevance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: entry.title,
                summary: entry.abstract || "",
                topic: topic,
              }),
            });
            const data = await res.json();
            results.push({ entry, relevance: data });
          } catch (e) {
            results.push({ entry, relevance: null, error: true });
          }
        })
      );
      setBulkResults(results);
      setLoading(false);
    } else {
      // Handle PDF files as before
      if (files.length === 0 || !topic) return;
      setLoading(true);
      setBulkResults([]);
      const results: any[] = [];
      await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("topic", topic);
          try {
            const res = await fetch("/api/relevance-summary", {
              method: "POST",
              body: formData,
            });
            const data = await res.json();
            results.push({ file, relevance: data.relevance });
          } catch (e) {
            results.push({ file, relevance: null, error: true });
          }
        })
      );
      setBulkResults(results);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white text-black min-h-screen flex overflow-y-auto flex-col justify-center items-center ">
      <main className="flex w-[48rem] max-w-screen flex-col items-center justify-center text-center px-4 mx-auto">
        {/* Only show heading if there are no results */}
        {bulkResults.length === 0 ? (
          <h2 className="font-playfair text-[2rem] mb-[2rem] mt-[3rem] lg:mt-[3rem]">
            Check papers relevance in seconds
          </h2>
        ) : (
          <div className="mt-[9rem] mb-[2rem] flex flex-col items-center">
            <h3 className="text-[1.75rem] ">Relevance Results</h3>
            {/* Relevant papers count */}
            <div className="text-center text-muted-foreground text-[1.1rem] mt-2">
              {inputMode === "bib"
                ? `Found ${
                    bulkResults.filter(
                      (r) => r.relevance && r.relevance.relevance === "relevant"
                    ).length
                  } relevant papers`
                : `Found ${
                    bulkResults.filter((r) => r.relevance).length
                  } relevant papers`}
            </div>
          </div>
        )}
        <form
          id="uploadForm"
          className="w-full max-w-[48rem] flex flex-col relative h-auto rounded-[1.5rem] text-base border border-muted-foreground/30 p-[0.75rem] shadow-md"
          onSubmit={(e) => {
            e.preventDefault();
            handleBulkCheckRelevance();
          }}
        >
          <div className="flex flex-col w-full gap-[1rem] items-center mb-[-1rem]">
            <div className="flex md:flex-row flex-col gap-2 w-full">
              <div className="flex flex-col gap-2 w-full">
                <Input
                  placeholder="What is your research topic?"
                  className="h-[2.25rem] rounded-[3rem] px-[0.5rem]  !border-none focus:!border-none shadow-none bg-transparent placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                  value={topic}
                  onChange={handleTopicChange}
                />
                {/* Always render both file inputs, but keep them hidden */}
                <input
                  type="file"
                  multiple
                  accept="application/pdf"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
                <input
                  type="file"
                  accept=".bib"
                  ref={bibFileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />

                {/* Input mode selection buttons */}
                <div className="flex flex-wrap gap-2 w-full justify-start">
                  <Button
                    type="button"
                    onClick={() => {
                      setInputMode("file");
                      setTimeout(() => fileInputRef.current?.click(), 0);
                    }}
                    className={`rounded-full border-muted-foreground/30 px-4 ${
                      inputMode === "file"
                        ? "bg-transparent text-[#D793FF] border-muted-foreground/30 hover:border-muted-foreground/30 shadow-none hover:bg-transparent cursor-pointer hover:text-[#D793FF] focus-visible:border-muted-foreground/30"
                        : "bg-white text-[#D793FF] border-muted-foreground/30 hover:border-muted-foreground/30 shadow-none hover:bg-transparent cursor-pointer hover:text-[#D793FF] focus-visible:border-muted-foreground/30"
                    }`}
                  >
                    <FileStack className="w-4 h-4 mr-2" />
                    Upload PDF(s)
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setInputMode("bib");
                      setTimeout(() => bibFileInputRef.current?.click(), 0);
                    }}
                    className={`rounded-full border-muted-foreground/30 px-4 ${
                      inputMode === "bib"
                        ? "bg-transparent text-[#ffb01f] border-muted-foreground/30 hover:border-muted-foreground/30 shadow-none hover:bg-transparent cursor-pointer hover:text-[#ffb01f] focus-visible:border-muted-foreground/30"
                        : "bg-white text-[#ffb01f] border-muted-foreground/30 hover:border-muted-foreground/30 shadow-none hover:bg-transparent cursor-pointer hover:text-[#ffb01f] focus-visible:border-muted-foreground/30"
                    }`}
                  >
                    <BookMarked className="w-4 h-4 mr-2" />
                    Upload .bib file
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setInputMode("url")}
                    className={`rounded-full border-muted-foreground/30 px-4 ${
                      inputMode === "url"
                        ? "bg-transparent text-[#0FD7FF] border-muted-foreground/30 hover:border-muted-foreground/30 shadow-none hover:bg-transparent cursor-pointer hover:text-[#0FD7FF] focus-visible:border-muted-foreground/30"
                        : "bg-white text-[#0FD7FF] border-muted-foreground/30 hover:border-muted-foreground/30 shadow-none hover:bg-transparent cursor-pointer hover:text-[#0FD7FF] focus-visible:border-muted-foreground/30"
                    }`}
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Paste PDF URL
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                className="text-background bg-foreground h-[2.25rem] rounded-[3rem] w-full md:w-[2.25rem] disabled:bg-foreground hover:disabled:bg-muted hover:cursor-pointer"
                disabled={
                  (inputMode === "file" && files.length === 0) ||
                  (inputMode === "bib" && bibEntries.length === 0) ||
                  (inputMode === "url" && !pdfUrl) ||
                  !topic ||
                  loading
                }
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    {retrying && (
                      <span className="text-[1rem]">Retrying...</span>
                    )}
                  </span>
                ) : (
                  <ArrowUp className="w-6 h-6" />
                )}
              </Button>
            </div>
            {/* PDF input */}
            {inputMode === "file" && (
              <div className="flex gap-2 w-full">
                {/* PDF file input is always present, just hidden */}
              </div>
            )}
            {/* .bib input */}
            {inputMode === "bib" && (
              <div className="flex gap-2 w-full">
                {/* .bib file input is always present, just hidden */}
              </div>
            )}
            {/* URL input */}
            {inputMode === "url" && (
              <div className="flex items-center justify-center w-full">
                <Input
                  placeholder="https://example.pdf"
                  className="h-[2.25rem] rounded-[1rem] px-[0.5rem] shadow-none bg-transparent placeholder:text-muted-foreground focus:outline-none border-none"
                  value={pdfUrl}
                  onChange={handlePdfUrlChange}
                />
              </div>
            )}
          </div>
        </form>

        {/* Debug info */}
        <div className="mt-2 text-xs text-muted-foreground">
          Current mode: {inputMode} | Files: {files.length} | Bib entries:{" "}
          {bibEntries.length}
        </div>

        {files.length > 0 && inputMode === "file" && (
          <div className="my-[2rem] text-sm text-foreground text-start">
            <div className="mb-[1rem]">Selected files:</div>
            <ul className="text-start flex flex-wrap gap-2">
              {files.map((file, idx) => (
                <li
                  key={idx}
                  className="px-2 py-1 bg-[#FED68C]/10 rounded-[3rem] text-xs text-[#ffb01f] border border-muted"
                >
                  {file.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {bibEntries.length > 0 && inputMode === "bib" && (
          <div className="my-[2rem] text-sm text-foreground text-start">
            <div className="mb-[1rem]">
              Papers from .bib file ({bibEntries.length}):
            </div>
            <ul className="text-start flex flex-wrap gap-2">
              {bibEntries.slice(0, 5).map((entry, idx) => (
                <li
                  key={idx}
                  className="px-2 py-1 bg-[#FED68C]/10 rounded-[3rem] text-xs text-[#ffb01f] border border-muted"
                >
                  {entry.title.length > 30
                    ? entry.title.substring(0, 30) + "..."
                    : entry.title}
                </li>
              ))}
              {bibEntries.length > 5 && (
                <li className="px-2 py-1 bg-muted/10 rounded-[3rem] text-xs text-muted-foreground border border-muted">
                  +{bibEntries.length - 5} more
                </li>
              )}
            </ul>
          </div>
        )}

        {bulkResults.length > 0 && (
          <div className="w-full max-w-[48rem] mt-[2rem] mx-auto items-center justify-center">
            <div className="mb-[6rem] mt-[3rem] flex flex-col gap-4 items-start text-start">
              {bulkResults.map((result, idx) => (
                <div key={idx} className="border-b border-muted  py-[1rem]">
                  {/* Year above the main title for .bib entries */}
                  {inputMode === "bib" && result.entry.year && (
                    <div className="text-xs text-gray-400 mb-1">
                      Published in {result.entry.year}
                    </div>
                  )}
                  {/* Main title */}
                  <div className="text-[1.25rem] font-medium mb-2 flex flex-row justify-between items-center gap-[2rem]">
                    {inputMode === "bib"
                      ? result.entry.title
                      : result.relevance?.title || result.file.name}
                  </div>
                  {result.relevance ? (
                    inputMode === "bib" ? (
                      <div className="flex flex-col gap-2">
                        <div
                          className={`text-[1.25rem] font-medium ${
                            result.relevance.relevance === "relevant"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {result.relevance.relevance === "relevant"
                            ? "Relevant"
                            : "Not Relevant"}
                        </div>
                        <div className="text-muted-foreground text-[1rem]">
                          {result.relevance.summary}
                        </div>
                      </div>
                    ) : (
                      <RelevanceSummaryCard data={result.relevance} />
                    )
                  ) : (
                    <div className="text-red-500">
                      Failed to evaluate relevance.
                    </div>
                  )}
                  {/* Bib metadata display - always show for .bib entries, styled nicely */}
                  {inputMode === "bib" && (
                    <div className="mb-3 flex flex-col gap-4 items-start text-[0.97rem] text-muted-foreground">
                      {result.entry.authors && (
                        <span className=" text-foreground py-1">
                          {result.entry.authors.replace(/ and /g, ", ")}
                        </span>
                      )}
                      {result.entry.journal && (
                        <span className="italic text-gray-500">
                          published in {result.entry.journal}
                        </span>
                      )}

                      {(result.entry.url || result.entry.doi) && (
                        <a
                          href={
                            result.entry.url ||
                            `https://doi.org/${result.entry.doi}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <button className="flex flex-row gap-2 py-1 items-center  text-foreground cursor-pointer hover:text-muted-foreground transition font-medium">
                            <Paperclip className="w-4 h-4" />
                            PDF
                          </button>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Page;
