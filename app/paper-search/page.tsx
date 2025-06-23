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
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

// This will be the structure for our search results later
type SearchResult = {
  title: string;
  authors: string[];
  summary: string;
  pdfUrl: string;
  relevance: {
    score: number;
    summary: string;
  };
};

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

  const handleSearch = async () => {
    if (!topic) return;
    setLoading(true);

    try {
      const response = await fetch("/api/paper-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate keywords");
      }

      const data = await response.json();
      console.log("Generated Keywords:", data.keywords);
      // Next, we will use these keywords to call the arXiv API.
    } catch (error) {
      console.error(error);
      // Handle error state for the user
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white text-black min-h-screen flex items-center justify-center flex-col">
      <main className="flex w-[48rem] flex-col items-center justify-center text-center px-4">
        <h2 className="text-[2rem] mb-[2rem]">
          Find relevant papers for your research
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="w-full max-w-[64rem] flex flex-col relative h-auto gap-[1rem] rounded-[1.5rem] text-base border border-muted-foreground/30 p-[1rem]"
        >
          <Input
            placeholder="Enter your research topic in about 30 words..."
            className="border-none shadow-none bg-transparent placeholder:text-muted-foreground focus:outline-none focus:ring-0"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <div className="flex items-end justify-end">
            <Button
              type="submit"
              className="justify-end items-center rounded-full h-[2.25rem] ml-auto bg-foreground cursor-pointer text-background px-4 border-none shadow-none w-auto placeholder:text-muted-foreground focus:outline-none focus:ring-0"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <span className="mr-2">search</span>
                  <Search size={16} />
                </>
              )}
            </Button>
          </div>
        </form>
        <div className="flex gap-2 mt-[1rem] w-full items-start justify-start">
          <Button
            type="button"
            onClick={() => {
              setInputMode("file");
              fileInputRef.current?.click();
            }}
            className={`h-[2.25rem] rounded-[3rem] px-4 ${
              inputMode === "file"
                ? "bg-[#FED68C]/20 text-[#FED68C] hover:bg-[#FED68C]/10 border border-[#FED68C] cursor-pointer"
                : "bg-background hover:bg-[#FED68C]/20 border border-[#FED68C] text-[#FED68C]"
            }`}
          >
            <Paperclip size={16} className="mr-1" />
            Upload PDF
          </Button>
          <Button
            type="button"
            onClick={() => setInputMode("url")}
            className={`h-[2.25rem] rounded-[3rem] px-4 bg-transparent ${
              inputMode === "url"
                ? "bg-[#FFBAD8]/20 text-[#FFBAD8] hover:bg-[#FFBAD8]/10 border border-[#FFBAD8] cursor-pointer"
                : "bg-[#FFBAD8]/20 hover:bg-[#FFBAD8]/10 text-[#FFBAD8] border border-[#FFBAD8] cursor-pointer"
            }`}
          >
            <LinkIcon size={16} className="mr-1" />
            PDF URL
          </Button>
        </div>
        {inputMode === "file" ? (
          !file ? (
            <>
              <Input
                className="hidden"
                id="file-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                ref={fileInputRef}
              />
            </>
          ) : (
            <div className="flex justify-start w-[10rem] h-[2.25rem] min-h-[2.25rem] border border-muted-foreground/30 bg-background rounded-[3rem] px-2">
              <span className="truncate w-full text-muted-foreground mr-2">
                {file.name}
              </span>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="hover:bg-muted rounded-full p-1 ml-1 cursor-pointer"
                aria-label="Remove file"
              >
                <X size={18} className="text-muted-foreground cursor-pointer" />
              </button>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center w-full">
            <Input
              placeholder="https://example.pdf"
              className="h-[2.25rem] rounded-[1rem] px-[0.5rem] shadow-none bg-transparent placeholder:text-muted-foreground focus:outline-none border-none"
              value={pdfUrl}
              onChange={handlePdfUrlChange}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Page;
