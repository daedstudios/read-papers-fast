"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Paperclip, Loader2, X, ArrowUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const Page = () => {
  const [file, setFile] = useState<File | null>(null);
  const [topic, setTopic] = useState("");
  const [relevance, setRelevance] = useState<{
    score: number;
    summary: string;
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
    setRelevance(data.relevance);
    setLoading(false);
  };

  return (
    <>
      <div className="relative w-screen h-full md:h-screen overflow-hidden items-center">
        <div className="fixed  bg-black/20 blur-lg z-[-1]" />

        <div className="flex flex-col justify-center max-h-screen scroll-none pt-[14rem] mx-auto md:w-[42rem] px-[1rem] md:px-0">
          <h1 className=" text-center text-[2rem]  my-[2rem] text-foreground">
            Check a paper's relevance in seconds
          </h1>

          <form
            id="uploadForm"
            className="flex flex-col justify-end gap-2 border p-[1rem] text-[1rem] rounded-[2rem] bg-transparent "
            onSubmit={(e) => {
              e.preventDefault();
              handleCheckRelevance();
            }}
          >
            <div className="flex flex-col w-full  gap-[1rem] items-center">
              <div className="flex md:flex-row flex-col gap-2 w-full ">
                <div className="flex flex-col gap-2 w-full ">
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
                    <div className="flex items-center justify-center w-[10rem] h-[2.25rem] min-h-[2.25rem] border border-muted-foreground bg-background rounded-[3rem] px-2">
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
              {/* <p className="w-full mx-auto text-center text-muted-foreground px-1">
                <Link
                  href="/paperG?id=8915e476-ea87-4540-b7bb-ac766e61a0fe"
                  className="px-1 text-[#BEE2B7] font-medium underline"
                >
                  See example
                </Link>
              </p> */}
            </div>
          </form>
        </div>

        <div className="md:flex hidden w-full z-4 flex-col text-foreground items-center pt-[6rem] text-[1rem]">
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
      </div>
    </>
  );
};

export default Page;
