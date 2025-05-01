"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/components/AppContext";
import Image from "next/image";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { initiateRequests } from "@/utilities/PromptChain";

const Page = () => {
  const { isLoading, error, result, setIsLoading, setError, setResult } =
    useAppContext();
  const [documentUrl, setDocumentUrl] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setUploadedFile(file);
        setDocumentUrl("");
      } else {
        setError("Only PDF files are allowed");
      }
    }
  };

  const handleVertexCall = async () => {
    setIsLoading(true);
    setError(null);

    // Start both requests in parallel before navigation using the utility function
    const requestsPromise = initiateRequests(documentUrl || null, uploadedFile);

    // Navigate to the results page
    router.push("/survey");

    // The requests will continue in the background
    try {
      const combinedData = await requestsPromise;
      setResult(combinedData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pdf-container max-h-screen  bg-cover bg-center">
      <Image
        src="/LANDING-2.png"
        alt="Background"
        fill
        priority
        className="object-cover z-[-1]  "
      />
      <div className="fixed inset-0 bg-black/20 blur-lg z-[-1]" />

      <div className="p-[1rem] text-[1.25rem] text-foreground font-medium">
        ReadPapersFast
      </div>

      <div className="flex flex-col justify-center pt-[16rem] mx-auto md:w-[42rem] px-[1rem] md:px-0">
        <h1 className="justify-center text-center text-[2.25rem] font-medium mb-[2rem] text-foreground">
          Read research papers 10x faster
        </h1>
        {error && (
          <p
            className={
              error.includes("Error") ? "text-red-500" : "text-green-500"
            }
          >
            {error}
          </p>
        )}
        <form
          id="uploadForm"
          className="flex flex-col md:flex-row justify-end gap-2 border border-muted/30 p-[1rem] rounded-[2rem] bg-background/30 shadow shadow-background/30"
        >
          <div className="flex flex-row gap-2 w-full">
            <Input
              type="text"
              value={documentUrl}
              onChange={(e) => {
                setDocumentUrl(e.target.value);
                setUploadedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              placeholder="https://example.com/document.pdf"
              className="h-[2.25rem] px-[1rem] w-full rounded-[3rem] border-muted/30 bg-background"
            />

            <Input
              type="file"
              ref={fileInputRef}
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center hover:bg-muted justify-center w-[2.25rem] h-[2.25rem] min-w-[2.25rem] min-h-[2.25rem] border border-muted/30 bg-background rounded-[3rem] hover:cursor-pointer"
            >
              <Plus size={24} className="text-foreground" />
            </label>
          </div>
          <Button
            type="button"
            onClick={handleVertexCall}
            disabled={isLoading || (!documentUrl && !uploadedFile)}
            className=" text-background bg-foreground px-[4rem] h-[2.25rem] rounded-[3rem] disabled:bg-foreground hover:disabled:bg-muted hover:cursor-pointer "
          >
            {isLoading ? "Uploading..." : "upload"}
          </Button>
        </form>
        <p className="w-full mx-auto text-center text-foreground px-1 mt-[1rem]">
          {uploadedFile?.name || "Paste a link or upload a PDF directly"}
        </p>
      </div>
      <div className="flex w-full flex-col text-background items-center pt-[6rem] text-[1rem]">
        trusted by students of
        <div className="relative md:w-[42rem] overflow-hidden py-[3rem]">
          <div className="flex gap-[8rem] animate-marquee whitespace-nowrap">
            <Image
              src="/maastricht2.svg"
              alt="maastricht"
              width={280}
              height={36}
              className="opacity-80"
            />
            <Image
              src="/passau2.svg"
              alt="passau"
              width={240}
              height={36}
              className="opacity-80"
            />
            <Image
              src="/uci2.svg"
              alt="uci"
              width={64}
              height={36}
              className="opacity-80"
            />

            <Image
              src="/maastricht2.svg"
              alt="maastricht"
              width={280}
              height={36}
              className="opacity-80"
            />
            <Image
              src="/passau2.svg"
              alt="passau"
              width={240}
              height={36}
              className="opacity-80"
            />
            <Image
              src="/uci2.svg"
              alt="uci"
              width={64}
              height={36}
              className="opacity-80"
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
  );
};

export default Page;
