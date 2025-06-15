"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function RelevanceSummaryPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
      setSummary(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!pdfFile) return;
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const formData = new FormData();
      formData.append("pdf", pdfFile);
      // Call a new API endpoint to get the relevance summary
      const res = await fetch("/api/relevance-summary", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to get relevance summary");
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full p-[1rem] max-w-[42rem]">
        <Link
          href="/"
          className="inline-flex items-center mb-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span>back to home</span>
        </Link>
        <h1 className="text-3xl mb-2">Relevance Summary</h1>
        <p className="text-muted-foreground mb-6">
          Upload a research paper PDF to see if it's worth diving in.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="mb-4"
          onChange={handleFileChange}
          disabled={loading}
        />
        <Button
          onClick={handleUpload}
          disabled={!pdfFile || loading}
          className="w-full mb-6"
        >
          {loading ? "Analyzing..." : "Get Relevance Summary"}
        </Button>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {summary && (
          <div className="mt-6">
            <p className="mb-4 text-[1rem] whitespace-pre-line text-foreground">
              {summary}
            </p>
            <Button
              className="float-right bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
              onClick={() => {
                /* TODO: route to full upload/reading flow */
              }}
            >
              go deeper
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
