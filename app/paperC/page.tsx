"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/header";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { set } from "zod";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Drawer,
  DrawerTrigger,
  DrawerOverlay,
  DrawerContent,
} from "@/components/ui/drawer";
import { DrawerHeader } from "@/components/ui/drawer";
import { Card, CardContent } from "@/components/ui/card";
import { CardHeader } from "@/components/ui/card";
import KeywordAccordion from "@/components/KeywordsAccordion";
import PhoneDrawer from "@/components/PhoneDrawer";
import { ChevronDown, ChevronUp, Loader2, ArrowLeft } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import React from "react";
import SidebarNav from "@/components/SidebarNav";

gsap.registerPlugin(useGSAP);

interface Section {
  id: string;
  title: string;
  summary: string;
  order: number;
  paperSummaryId: string;
}

type Keyword = {
  id: string;
  keyword: string;
  value: string;
  explanation: string;
};

interface Acronyms {
  keyword: string;
  value: string;
  explanation: string;
}
interface GrobidParagraph {
  order_index: number;
  text: string;
  refs?: Record<string, unknown>;
  simplifiedText?: string;
}

interface GrobidSection {
  id: string;
  created_at: string; // ISO date
  head: string; // e.g. "Introduction"
  head_n: string; // e.g. "1."
  order_index: number;
  paperSummaryID: string;
  paper_id: string;
  para: GrobidParagraph[];
  summary: string;
  simplifiedText?: string; // Add simplifiedText to the interface
  geminiOrder: string | null; // Added to match Section interface
}

interface GrobidFigure {
  id: string;
  figure_id: string;
  figure_type: string;
  head: string;
  label: string;
  description: string;
  coords: string;
  graphic_coords: string;
  graphic_type: string;
  page_number: number;
  paper_summary_id: string;
  created_at: string;
  updated_at: string;
  source_file: string;
  extracted_image_path: string | null;
  image_url: string;
}

interface GrobidAbstract {
  text: string;
  authors: string[];
  title: string;
  publishedDate: string;
  summary: string;
  url: string;
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface GrobidContentResponse {
  grobidContent: GrobidSection[];
  grobidFigures: GrobidFigure[];
  grobidAbstract: GrobidAbstract;
  geminiKeywords: Keyword[];
}

interface ImageUrl {
  url: string;
  width: number;
  height: number;
  pageNumber: number;
  ext: string;
  label?: string;
  figure_id?: string;
  description?: string;
}

// Loading component for Suspense fallback
const PaperLoading = () => <div>Loading paper data...</div>;

function PaperContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [paperSummary, setPaperSummary] =
    useState<GrobidContentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const keyWordRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const [imageUrls, setImageUrls] = useState<ImageUrl[] | []>([]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [authorsOpen, setAuthorsOpen] = useState(false);
  const [loadingPara, setLoadingPara] = useState<string | null>(null);
  const [showSimplified, setShowSimplified] = useState<Record<string, boolean>>(
    {}
  );
  const [showParaSimplified, setShowParaSimplified] = useState<
    Record<string, boolean>
  >({});
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showPaper, setShowPaper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function renderWithGlossaryAndLinks(text: string, keywords: Keyword[]) {
    // Sort keywords by length (desc) to avoid partial matches
    const sortedKeywords = [...keywords].sort(
      (a, b) => b.keyword.length - a.keyword.length
    );

    // Build a regex for all keywords and Figure/Table
    const keywordPattern = sortedKeywords
      .map((kw) => kw.keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    const pattern = new RegExp(`(Figure|Table|${keywordPattern})`, "gi");

    const parts = [];
    let lastIndex = 0;
    let match;
    let idx = 0;

    while ((match = pattern.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      if (before) parts.push(before);

      const matched = match[0];
      if (matched === "Figure" || matched === "Table") {
        parts.push(
          <span
            key={`figtable-${idx}`}
            className="text-blue-600 underline cursor-pointer"
            onClick={() => {
              document
                .getElementById("figures-section")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            {matched}
          </span>
        );
      } else {
        // Find the keyword object (case-insensitive)
        const kwObj = sortedKeywords.find(
          (kw) => kw.keyword.toLowerCase() === matched.toLowerCase()
        );
        if (kwObj) {
          parts.push(
            <Popover key={`kw-${idx}`}>
              <PopoverTrigger asChild>
                <span className="relative text-foreground p-1 font-medium rounded-sm border-muted-foreground/30 border transition duration-200 cursor-pointer hover:bg-muted-foreground/30">
                  {matched}
                </span>
              </PopoverTrigger>
              <PopoverContent className="w-64 bg-background border border-border rounded-[1rem] shadow-lg p-[1rem] text-[1rem]">
                <span className="block text-[1rem] text-primary font-bold mb-1">
                  {kwObj.keyword}
                </span>
                <span className="block text-[1rem] text-primary font-bold mb-1">
                  {kwObj.value}
                </span>
                <span className="block text-[1rem] text-muted-foreground">
                  {kwObj.explanation}
                </span>
              </PopoverContent>
            </Popover>
          );
        } else {
          parts.push(matched);
        }
      }
      lastIndex = pattern.lastIndex;
      idx++;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts;
  }

  useEffect(() => {
    console.log("imageUrls", imageUrls);
  }, [imageUrls.length]);

  useEffect(() => {
    async function fetchPaperSummary() {
      if (!id) {
        setError("Paper ID is required");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/paperGrobid?id=${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch paper summary");
        }

        const data = await response.json();
        console.log("Paper summary data:", data);
        setPaperSummary(data);
      } catch (err) {
        console.error("Error fetching paper summary:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchPaperSummary();
  }, [id]);

  // Fetch relevance summary as soon as file is selected
  useEffect(() => {
    if (!pdfFile) return;
    setSummaryLoading(true);
    setSummaryError(null);
    setSummary(null);
    const fetchSummary = async () => {
      try {
        const formData = new FormData();
        formData.append("pdf", pdfFile);
        const res = await fetch("/api/relevance-summary", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Failed to get relevance summary");
        const data = await res.json();
        setSummary(data.summary);
      } catch (err) {
        setSummaryError("Failed to load relevance summary");
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchSummary();
  }, [pdfFile]);

  const handleReadFast = async (sectionId: string, paraText: string) => {
    setLoadingPara(`${sectionId}-${paraText}`);
    const res = await fetch("/api/simplifiedText", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paragraphText: paraText,
        paragraphId: sectionId,
      }),
    });
    const { simplified } = await res.json();
    setPaperSummary((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        grobidContent: prev.grobidContent.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                para: s.para.map((p) =>
                  p.text === paraText ? { ...p, simplifiedText: simplified } : p
                ),
              }
            : s
        ),
      };
    });
    setShowSimplified((prev) => ({
      ...prev,
      [`${sectionId}-${paraText}`]: true,
    }));
    setLoadingPara(null);
  };

  // Scrollspy effect
  useEffect(() => {
    if (!paperSummary?.grobidContent) return;
    const sectionIds = paperSummary.grobidContent.map((s) => s.id);
    const sectionElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (sectionElements.length === 0) return;

    const observer = new window.IntersectionObserver(
      (entries) => {
        // Find the entry that is most in view
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveSectionId(visible[0].target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    sectionElements.forEach((el) => observer.observe(el!));
    return () => observer.disconnect();
  }, [paperSummary]);

  return (
    <>
      <div className="flex flex-row  w-full h-[92vh] mt-[8vh]">
        <ScrollArea className="hidden  md:flex h-full w-full max-w-[22rem] border-t lg:p-[1rem] md:border-r ">
          <SidebarNav
            sections={paperSummary?.grobidContent || []}
            activeSectionId={activeSectionId || undefined}
            onSectionClick={() => {}}
          />
        </ScrollArea>
        <ScrollArea className="w-full border-t p-[1rem] h-full">
          <div className="flex flex-row justify-between">
            {(() => {
              const allText =
                paperSummary?.grobidContent
                  .flatMap((section) => section.para.map((p) => p.text))
                  .join(" ") || "";

              const wordCount = allText.split(/\s+/).filter(Boolean).length;
              const readingTime = Math.ceil(wordCount / 175);

              return (
                <p className="text-[1rem] text-muted-foreground mb-2">
                  Estimated reading time: {readingTime} min
                </p>
              );
            })()}
            {paperSummary?.grobidAbstract.publishedDate && (
              <span className="text-muted-foreground text-[1rem]">
                {" "}
                {new Date(
                  paperSummary.grobidAbstract.publishedDate
                ).toLocaleDateString()}
              </span>
            )}
          </div>
          {paperSummary?.grobidAbstract && (
            <div className="mb-10">
              <h1 className="text-4xl font-medium mb-4">
                {paperSummary.grobidAbstract.title}
              </h1>

              <div className="border-b border-border mb-8 pb-2"></div>
            </div>
          )}
          {paperSummary?.grobidContent.map((section) => (
            <div key={section.id} className="mb-[3rem]">
              {/* Section heading with toggle button */}
              <div className="flex items-center justify-between mb-2">
                <h2
                  id={section.id}
                  className="text-[1.5rem] font-medium text-foreground break-words"
                >
                  {section.head_n} {section.head}
                </h2>
                <Button
                  size="sm"
                  className="cursor-pointer"
                  disabled={loadingPara === section.id}
                  onClick={async () => {
                    if (!section.simplifiedText) {
                      setLoadingPara(section.id);
                      const sectionText = section.para
                        .map((p) => p.text)
                        .join(" ");
                      // Call the API to simplify the section
                      const res = await fetch("/api/simplifiedText", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          sectionText,
                          sectionId: section.id,
                        }),
                      });
                      const { simplified } = await res.json();
                      setPaperSummary((prev) => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          grobidContent: prev.grobidContent.map((s) =>
                            s.id === section.id
                              ? { ...s, simplifiedText: simplified }
                              : s
                          ),
                        };
                      });
                      setLoadingPara(null);
                    }
                    setShowSimplified((prev) => ({
                      ...prev,
                      [section.id]: !prev[section.id],
                    }));
                  }}
                >
                  {loadingPara === section.id ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : section.simplifiedText && showSimplified[section.id] ? (
                    "Show Original"
                  ) : (
                    "Read Fast"
                  )}
                </Button>
              </div>
              {/* Section content */}
              {section.para.map((para, index) => (
                <div key={index} className="mb-6">
                  <p className="text-foreground leading-[200%] break-words text-[1rem] mb-2">
                    {renderWithGlossaryAndLinks(
                      para.text,
                      paperSummary.geminiKeywords
                    )}
                  </p>
                </div>
              ))}
            </div>
          ))}
          {(paperSummary?.grobidFigures?.length ?? 0) > 0 && (
            <div id="figures-section" className="my-8">
              <h3 className="text-[1.5rem] font-medium mb-4">Figures</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paperSummary?.grobidFigures.map((image, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 flex flex-col"
                  >
                    <div className="relative w-full h-60">
                      <Image
                        src={image.image_url}
                        alt={image.label || `Figure ${index + 1}`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                    {image.description && (
                      <p className="mt-2 text-center text-sm text-muted-foreground">
                        {image.description}
                      </p>
                    )}
                    {image.head && (
                      <p className="mt-2 text-center text-sm text-muted-foreground">
                        {image.head}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
        <div className=" hidden lg:flex h-full w-full lg:max-w-[22rem] border-t lg:p-[1rem] lg:border-l items-center justify-center">
          <div className="text-[1.5rem] font-medium text-muted-foreground opacity-20 select-none">
            ReadPapersFast
          </div>
        </div>
      </div>
    </>
  );
}

// Wrapper page component with Suspense boundary
export default function PaperPage() {
  return (
    <Suspense fallback={<PaperLoading />}>
      <PaperContent />
    </Suspense>
  );
}
