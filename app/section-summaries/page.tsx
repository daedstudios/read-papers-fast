"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

interface SectionSummary {
  heading: string;
  summary: string;
}

export default function SectionSummariesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [sections, setSections] = useState<SectionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setSections([]);
    const fetchSectionSummaries = async () => {
      try {
        const formData = new FormData();
        formData.append("pdf", file);
        const res = await fetch("/api/section-summaries", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Failed to get section summaries");
        const data = await res.json();
        setSections(data.sections || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchSectionSummaries();
  }, [file]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full  max-w-[42rem] my-[6rem]">
        <Link
          href="/relevance-summary"
          className="inline-flex items-center mb-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span>back</span>
        </Link>
        <h1 className="text-[2rem] mb-[3rem]">Topics from PDF</h1>
        {!file && (
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="mb-4"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                  setSections([]);
                  setError(null);
                }
              }}
              disabled={loading}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full"
            >
              Upload PDF
            </Button>
          </div>
        )}
        {loading && <div className="mb-4">Extracting section summaries...</div>}
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {sections.length > 0 && (
          <Accordion type="single" className="space-y-4">
            {sections.map((section, idx) => (
              <AccordionItem
                key={idx}
                value={`section-${idx}`}
                className="border rounded-xl"
              >
                <AccordionTrigger className="w-full flex justify-between items-center p-[1rem] text-lg cursor-pointer font-medium">
                  {section.heading}
                </AccordionTrigger>
                <AccordionContent className="px-[1rem] pb-4">
                  <div className="mb-2 text-[1rem] text-foreground">
                    {section.summary}
                  </div>
                  <Button
                    size="sm"
                    className=" bg-primary float-right text-primary-foreground hover:bg-primary/90 rounded-full my-[1rem]"
                  >
                    dive in
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
