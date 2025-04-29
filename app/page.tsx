"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/components/AppContext";
import Image from "next/image";
import { Plus } from "lucide-react";

const Page = () => {
  const { isLoading, error, result, setIsLoading, setError, setResult } =
    useAppContext();
  const [documentUrl, setDocumentUrl] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Function to read file as base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          // Remove data URL prefix if present
          const base64String = reader.result.includes("base64,")
            ? reader.result.split("base64,")[1]
            : reader.result;
          resolve(base64String);
        } else {
          reject(new Error("Failed to read file as base64"));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const handleVertexCall = async () => {
    setIsLoading(true);
    setError(null);

    // Check if we have either a URL or a file
    if (!documentUrl && !uploadedFile) {
      setError("Please provide a PDF URL or upload a file");
      setIsLoading(false);
      return;
    }

    try {
      let response;

      if (uploadedFile) {
        // Convert file to base64
        const fileData = await readFileAsBase64(uploadedFile);

        // Call the Vertex API directly with the file data
        response = await fetch("/api/vertex", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileData: fileData,
            fileName: uploadedFile.name,
          }),
        });
      } else {
        // Use URL directly
        response = await fetch("/api/vertex", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentUrl,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `API responded with status: ${response.status}`
        );
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error calling Vertex API:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pdf-container">
      <div className="p-[1rem] text-[1.25rem] text-foreground font-medium">
        readpapersfast.ai
      </div>

      <div className="flex flex-col justify-center pt-[16rem] mx-auto md:w-[42rem] px-[1rem] md:px-0">
        <h1 className="justify-center text-[2.25rem] font-medium mb-[2rem]">
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
        <form id="uploadForm" className="flex flex-wrap justify-end gap-2">
          <input
            type="text"
            value={documentUrl}
            onChange={(e) => {
              setDocumentUrl(e.target.value);
              setUploadedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            placeholder="https://example.com/document.pdf"
            className="border h-[2.25rem] px-[1rem] w-full rounded-[3rem]"
          />

          <input
            type="file"
            ref={fileInputRef}
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex items-center justify-center w-[2.25rem] h-[2.25rem] border rounded-[3rem] hover:cursor-pointer"
          >
            <Plus size={24} />
          </label>

          <Button
            type="button"
            onClick={handleVertexCall}
            disabled={isLoading || (!documentUrl && !uploadedFile)}
            className="bg-blue-500 text-background  px-[4rem] h-[2.25rem] rounded-[3rem] disabled:bg-foreground hover:disabled:bg-muted-foreground hover:cursor-pointer"
          >
            {isLoading ? "Uploading..." : "upload"}
          </Button>
          {uploadedFile && (
            <p className="mt-2">Selected file: {uploadedFile.name}</p>
          )}
        </form>
      </div>
      <div className="flex w-full flex-col items-center pt-[6rem] text-[1rem]">
        trusted by students of
        <div className="flex flex-row gap-12 pt-[1rem]">
          <Image
            src="/maastricht.svg"
            alt="maastricht"
            width={280}
            height={36}
            className="opacity-40"
          ></Image>
          {/* <Image
            src="/passau.svg"
            alt="maastricht"
            width={240}
            height={36}
            className="opacity-40"
          ></Image>
          <Image
            src="/uci.svg"
            alt="maastricht"
            width={64}
            height={36}
            className="opacity-40"
          ></Image> */}
        </div>
      </div>
    </div>
  );
};

export default Page;
