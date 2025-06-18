"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Paperclip, Loader2, X, ArrowUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

const Page = () => {
  const [file, setFile] = useState<File | null>(null);
  const [topic, setTopic] = useState("");
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleRemoveFile = () => setFile(null);

  const handleTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTopic(e.target.value);
  };

  const handleCheckRelevance = async () => {
    if (!file || !topic) return;
    setLoading(true);
    setRelevance(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("topic", topic);

    const res = await fetch("/api/relevance-summary", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log("Received relevance data:", data);
    setRelevance(data.relevance);
    setLoading(false);
  };

  return (
    <>
      <div className="relative w-screen h-screen overflow-hidden items-center">
        <div className="fixed  bg-black/20 blur-lg z-[-1]" />

        <div className="flex flex-col justify-center md:justify-between h-screen mb-[1rem]">
          <div className="flex flex-col mx-auto w-full md:w-[42rem] pt-[6rem] px-[1rem] md:px-0">
            {relevance && (
              <ScrollArea className="h-[calc(100vh-16rem)] px-4 scrollbar-none relative">
                <div className="bg-background/80 backdrop-blur-sm my-[3rem]">
                  <div className="flex items-center mb-[1rem] justify-center w-fit h-[2.25rem] min-h-[2.25rem] border border-[#BEE2B7] bg-[#BEE2B7]/30 rounded-[3rem] px-4">
                    <span className="text-muted-foreground">{file?.name}</span>
                  </div>
                  <div className="flex items-center justify-between mb-4]]">
                    <div className="flex flex-col gap-4">
                      <h2 className="text-[1.5rem] font-medium">
                        Relevance Analysis
                      </h2>
                    </div>

                    <div className="flex items-center">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          relevance.score < 0.4 ? "bg-red-500" : "bg-green-500"
                        } mr-2`}
                      ></div>
                      <span className="text-lg font-medium">
                        {Math.round(relevance.score * 100)}% relevant
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    {relevance.summary}
                  </p>

                  {relevance.relevant_sections &&
                    relevance.relevant_sections.length > 0 && (
                      <div className="space-y-4 mt-10">
                        <h3 className="text-[1.5rem] font-medium">Snippets</h3>
                        <div className="space-y-3">
                          {relevance.relevant_sections.map((section, index) => (
                            <div
                              key={index}
                              className="p-4 bg-background/50 rounded-lg border border-border/50"
                            >
                              {section.section_heading && (
                                <h4 className="text-[1rem] font-medium mb-2 text-muted-foreground">
                                  {section.section_heading}
                                  {section.page && ` (Page ${section.page})`}
                                </h4>
                              )}
                              <p className="text-[1rem]">
                                {section.text_snippet}
                              </p>
                              {!section.section_heading && section.page && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Page {section.page}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
                {/* Fade-out gradient overlay at the bottom */}
                <div
                  className="pointer-events-none absolute bottom-0 left-0 w-full h-24 z-10"
                  style={{
                    background:
                      "linear-gradient(to top, var(--background, #fff) 40%, transparent)",
                  }}
                />
              </ScrollArea>
            )}
          </div>

          <div className="w-full transition-transform duration-700 ease-in-out bg-background/80 backdrop-blur-sm pb-1[rem]">
            {!relevance && (
              <h1 className="text-center max-w-[95%] mx-auto text-[2rem] mb-[2rem] text-foreground">
                Check a paper's relevance in seconds
              </h1>
            )}

            <form
              id="uploadForm"
              className="flex flex-col max-w-[95%] justify-end gap-2 border p-[1rem] mb-[1rem] text-[1rem] rounded-[2rem] bg-transparent mx-auto md:w-[42rem] px-[1rem] md:px-[1rem] "
              onSubmit={(e) => {
                e.preventDefault();
                handleCheckRelevance();
              }}
            >
              <div className="flex flex-col w-full gap-[1rem] items-center">
                <div className="flex md:flex-row flex-col gap-2 w-full">
                  <div className="flex flex-col gap-2 w-full">
                    <Input
                      placeholder="What is your research topic?"
                      className="h-[2.25rem] rounded-[3rem] px-[0.5rem] !border-none focus:!border-none shadow-none bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                      value={topic}
                      onChange={handleTopicChange}
                    />

                    {!file ? (
                      <>
                        <Input
                          className="hidden"
                          id="file-upload"
                          type="file"
                          accept=".pdf"
                          onChange={handleFileUpload}
                        />
                        <label
                          htmlFor="file-upload"
                          className="flex items-center hover:bg-muted justify-center w-[7rem] h-[2.25rem] min-h-[2.25rem] border border-muted-foreground/30 bg-background rounded-[3rem] hover:cursor-pointer"
                        >
                          <Paperclip
                            size={20}
                            className="text-muted-foreground mr-2"
                          />
                          <p className="text-muted-foreground">attach</p>
                        </label>
                      </>
                    ) : (
                      <div className="flex items-center justify-center w-[10rem] h-[2.25rem] min-h-[2.25rem] border border-[#BEE2B7] bg-[#BEE2B7]/30 rounded-[3rem] px-2">
                        <span className="truncate text-muted-foreground mr-2">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="hover:bg-muted rounded-full p-1 ml-1"
                          aria-label="Remove file"
                        >
                          <X
                            size={18}
                            className="text-muted-foreground cursor-pointer"
                          />
                        </button>
                      </div>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className=" text-background bg-foreground h-[2.25rem] rounded-[3rem] w-full md:w-[2.25rem] disabled:bg-foreground hover:disabled:bg-muted hover:cursor-pointer "
                    disabled={!file || !topic || loading}
                  >
                    {loading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <ArrowUp className="w-6 h-6" />
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {!relevance && (
              <div className="md:flex hidden w-full z-4 flex-col text-foreground items-center pb-[6rem] text-[1rem]">
                trusted by students of
                <div className="relative md:w-[42rem] overflow-hidden py-[3rem]">
                  <div className="flex gap-[8rem] opacity-60 animate-marquee whitespace-nowrap">
                    <Image
                      src="/maastricht3.svg"
                      alt="maastricht"
                      width={280}
                      height={36}
                      className="opacity-100"
                    />
                    <Image
                      src="/passau3.svg"
                      alt="passau"
                      width={240}
                      height={36}
                      className="opacity-100"
                    />
                    <Image
                      src="/uci3.svg"
                      alt="uci"
                      width={64}
                      height={36}
                      className="opacity-100"
                    />

                    <Image
                      src="/maastricht3.svg"
                      alt="maastricht"
                      width={280}
                      height={36}
                      className="opacity-100"
                    />
                    <Image
                      src="/passau3.svg"
                      alt="passau"
                      width={240}
                      height={36}
                      className="opacity-100"
                    />
                    <Image
                      src="/uci3.svg"
                      alt="uci"
                      width={64}
                      height={36}
                      className="opacity-100"
                    />
                  </div>

                  <style jsx>{`
                    .animate-marquee {
                      display: inline-flex;
                      animation: scroll-left 25s linear infinite;
                    }

                    @keyframes scroll-left {
                      0% {
                        transform: translateX(0);
                      }
                      100% {
                        transform: translateX(-50%);
                      }
                    }
                  `}</style>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
