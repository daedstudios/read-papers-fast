"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

const UITestPage = () => {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">PDF Analysis</h1>
        <Link href="/summaries" className="text-blue-600 hover:underline">
          View All Summaries
        </Link>
      </div>

      <Card className="p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Option 1: Enter PDF URL
          </h2>
          <input
            type="text"
            value={documentUrl}
            onChange={(e) => {
              setDocumentUrl(e.target.value);
              setUploadedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="w-full border rounded p-3"
            placeholder="https://example.com/document.pdf"
          />
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Option 2: Upload PDF File
          </h2>
          <input
            type="file"
            ref={fileInputRef}
            accept="application/pdf"
            onChange={handleFileChange}
            className="w-full border rounded p-2"
          />
          {uploadedFile && (
            <p className="mt-2 text-sm text-green-600">
              Selected file: {uploadedFile.name}
            </p>
          )}
        </div>

        <Button
          onClick={handleVertexCall}
          disabled={isLoading || (!documentUrl && !uploadedFile)}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3"
        >
          {isLoading ? "Analyzing PDF..." : "Analyze PDF"}
        </Button>
      </Card>

      {isLoading && (
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <p className="text-blue-600">
            Processing the PDF document with Vertex AI...
          </p>
        </Card>
      )}

      {error && (
        <Card className="p-4 mb-6 bg-red-50 border-red-200">
          <p className="text-red-600">Error: {error}</p>
        </Card>
      )}

      {result && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>

          {result.paperSummary && (
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-bold mb-2">
                {result.paperSummary.title || "PDF Analysis"}
              </h3>

              <div className="space-y-4">
                {result.paperSummary.sections.map((section: any) => (
                  <div
                    key={section.id}
                    className="border-t pt-4 first:border-t-0 first:pt-0"
                  >
                    <h4 className="font-semibold text-md">{section.title}</h4>
                    <p className="mt-1 text-gray-700">{section.summary}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <details>
            <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium mb-2">
              View Raw Response
            </summary>
            <Card className="p-4">
              <ScrollArea className="h-[400px]">
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </ScrollArea>
            </Card>
          </details>
        </div>
      )}
    </div>
  );
};

export default UITestPage;
