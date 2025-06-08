"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/components/AppContext";
import Image from "next/image";
import { Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { initiateRequests } from "@/utilities/PromptChain";
import Link from "next/link";

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
  const handleFileUpload = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (uploadedFile) {
        // Handle file upload
        const formData = new FormData();
        formData.append("file", uploadedFile);

        const response = await fetch("/api/upload_id", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();

        const response2 = await fetch("/api/base", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: data?.id }),
        });

        const response3 = await fetch("/api/vertexKeyWords", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: data.id }),
        });

        const pythonResponse = await fetch(
          `https://python-grobid-347071481430.europe-west10.run.app/process/${data.id}`,
          { method: "GET" }
        );

        if (!response.ok) {
          throw new Error(data.error || "Failed to upload file");
        }

        router.push(`/paperG?id=${data.id}`);

        console.log("File uploaded successfully:", data);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      setError(error.message || "Error uploading file");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="relative w-screen h-full md:h-screen overflow-hidden items-center">
        <Image
          src="/LANDING-2.png"
          alt="Background"
          fill
          priority
          className="object-cover  z-[-2] "
        />
        <div className="fixed  bg-black/20 blur-lg z-[-1]" />

        <div className="flex flex-col justify-center max-h-screen md:pt-[14rem] pt-[12rem] mx-auto md:w-[42rem] px-[1rem] md:px-0">
          <h1 className=" text-center text-[2.25rem] font-medium my-[2rem] text-foreground">
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
            className="flex flex-col md:flex-row justify-end gap-2 border border-muted backdrop-blur-lg p-[1rem]  rounded-[2rem] bg-background/10 shadow shadow-foreground/30"
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
                    className="h-[2.25rem] px-[1rem]  rounded-[3rem] border-muted/30 bg-background"
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
                    className="flex items-center hover:bg-muted justify-center w-[2.25rem] h-[2.25rem] min-w-[2.25rem] min-h-[2.25rem] border border-muted bg-background rounded-[3rem] hover:cursor-pointer"
                  >
                    <Plus size={24} className="text-foreground" />
                  </label>
                </div>
                <Button
                  type="button"
                  onClick={handleFileUpload}
                  disabled={isLoading || (!documentUrl && !uploadedFile)}
                  className=" text-background bg-foreground h-[2.25rem] rounded-[3rem] w-full md:w-[6rem] disabled:bg-foreground hover:disabled:bg-muted hover:cursor-pointer "
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    "upload"
                  )}
                </Button>
              </div>
              <p className="w-full mx-auto text-center text-foreground px-1">
                Paste a link or upload a PDF directly.
                <Link
                  href="/paperG?id=83c1028f-8982-4f0d-a2fb-e5d71c1d7c91"
                  className="px-1 font-medium underline"
                >
                  See example
                </Link>
              </p>
            </div>
          </form>

          <div className="bg-background rounded-[2rem] py-[0.25rem] my-[1rem] mx-auto px-4 text-foreground border">
            {" "}
            {uploadedFile?.name}{" "}
          </div>
        </div>

        <div className="flex w-full z-4 flex-col text-foreground opacity-60 items-center pt-[6rem] text-[1rem]">
          trusted by students of
          <div className="relative md:w-[42rem] overflow-hidden py-[3rem]">
            <div className="flex gap-[8rem] animate-marquee whitespace-nowrap">
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
