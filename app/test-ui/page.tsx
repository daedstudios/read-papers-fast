"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/components/AppContext";
import Image from "next/image";
import { Plus, Loader2, X, ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { initiateRequests } from "@/utilities/PromptChain";
import { processUploadedFile } from "@/utilities/NewChain";
import Link from "next/link";
import { set } from "zod";
import posthog from "posthog-js";

const Page = () => {
  const {
    isLoading,
    error,
    result,
    setIsLoading,
    setError,
    setResult,
    setProgressMessage,
  } = useAppContext();
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
  const handleFileUpload = async () => {
    setIsLoading(true);
    setError(null);

    // router.push("/recent");

    try {
      if (uploadedFile) {
        await processUploadedFile(uploadedFile, setProgressMessage, setResult);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      setError(error.message || "Error uploading file");
      setProgressMessage("Error uploading file");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="relative w-screen h-full md:h-screen overflow-hidden items-center">
        <div className="fixed  bg-black/20 blur-lg z-[-1]" />

        <div className="flex flex-col justify-center max-h-screen scroll-none pt-[14rem] mx-auto md:w-[42rem] px-[1rem] md:px-0">
          <h1 className=" text-center text-[2rem]  my-[2rem] text-foreground">
            What paper do you want to read?
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
            className="flex flex-col md:flex-row justify-end gap-2 border p-[1rem] shadow-sm rounded-[2rem] bg-transparent "
          >
            <div className="flex flex-col w-full gap-[1rem] items-center">
              <div className="flex md:flex-row flex-col gap-2 w-full">
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
                    className="h-[2.25rem] px-[1rem]  rounded-[3rem] border-muted-foreground/10 shadow-none bg-background placeholder:text-muted-foreground"
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
                    className="flex items-center hover:bg-muted justify-center w-[2.25rem] h-[2.25rem] min-w-[2.25rem] min-h-[2.25rem] border border-muted-foreground/30 bg-background rounded-[3rem] hover:cursor-pointer"
                  >
                    <Plus size={20} className="text-foreground" />
                  </label>
                </div>
                <Button
                  type="button"
                  onClick={handleFileUpload}
                  disabled={isLoading || (!documentUrl && !uploadedFile)}
                  className=" text-background bg-foreground h-[2.25rem] rounded-[3rem] w-full md:w-[2.25rem] disabled:bg-foreground hover:disabled:bg-muted hover:cursor-pointer "
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <ArrowUp className="w-6 h-6" />
                  )}
                </Button>
              </div>
              <p className="w-full mx-auto text-center text-muted-foreground px-1">
                Paste a link or upload a PDF directly.
                <Link
                  href="/recent"
                  className="px-1 font-medium underline text-foreground"
                  target="_blank"
                >
                  See Recent
                </Link>
              </p>
            </div>
          </form>
          {uploadedFile && (
            <div className="bg-background rounded-[2rem] py-[0.25rem] my-[1rem] mx-auto px-4 text-foreground hover:bg-muted border flex items-center gap-2">
              <span>{uploadedFile.name}</span>
              <button
                type="button"
                onClick={() => {
                  setUploadedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="ml-2 text-lg font-bold text-muted-foreground cursor-pointer hover:text-foreground focus:outline-none"
                aria-label="Remove uploaded file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Page;
