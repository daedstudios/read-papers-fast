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
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import React from "react";

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

// Main component that uses useSearchParams
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


  function renderWithGlossary(text: string, keywords: Keyword[]) {
    if (!keywords || keywords.length === 0) return text;

    const sortedKeywords = [...keywords].sort(
      (a, b) => b.keyword.length - a.keyword.length
    );

    const pattern = new RegExp(
      `\\b(${sortedKeywords.map((kw) => kw.keyword).join("|")})\\b`,
      "gi"
    );

    const parts = [];
    let lastIndex = 0;
    let match;
    let idx = 0;

    while ((match = pattern.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      if (before) parts.push(before);

      const keyword = match[0];
      const kwObj = sortedKeywords.find(
        (kw) => kw.keyword.toLowerCase() === keyword.toLowerCase()
      );

      if (kwObj) {
        const KeywordPopover = () => {
          const [open, setOpen] = React.useState(false);

          return (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <span
                  className="relative text-foreground p-1 font-medium rounded-sm border-muted-foreground/30 border transition duration-200 cursor-pointer hover:bg-muted-foreground/30"
                  onMouseEnter={() => setOpen(true)}
                  onMouseLeave={() => setOpen(false)}
                >
                  {keyword}
                </span>
              </PopoverTrigger>
              <PopoverContent
                className="w-64 bg-background border border-border rounded-[1rem] shadow-lg p-[1rem] text-[1rem]"
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
              >
                <span className="block text-[1rem] text-primary font-bold mb-1">
                  {kwObj.keyword}
                </span>
                <span className="block text-[1rem] text-muted-foreground">
                  {kwObj.explanation}
                </span>
              </PopoverContent>
            </Popover>
          );
        };

        parts.push(<KeywordPopover key={idx} />);
      } else {
        parts.push(keyword);
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
      {paperSummary && <PhoneDrawer paperSummary={paperSummary} />}

      <div className="flex flex-row justify-between w-full h-[92vh] mt-[8vh]">
        <ScrollArea
          className="md:w-[22rem] border-r hidden border-t md:block p-[1rem] md:h-full"
          ref={menuRef}
        >
          <Sidebar
            className="relative w-[20rem] h-full"
            collapsible="offcanvas"
          >
            <SidebarMenu className="bg-background h-full text-muted-foreground">
              <div className="relative z-10">
                {paperSummary?.grobidContent?.map((section) => (
                  <SidebarMenuItem
                    key={section.id}
                    className={
                      activeSectionId === section.id
                        ? "text-foreground pl-2 transition-all duration-200"
                        : ""
                    }
                  >
                    <SidebarMenuButton
                      asChild
                      className="hover:bg-transparent hover:ml-2 hover:transition-all hover:duration-100 active:bg-transparent data-[active=true]:text-foreground"
                    >
                      <a
                        href={`#${section.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(section.id)?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }}
                      >
                        <span className="text-[1rem]  block text-wrap">
                          {section.head_n} {section.head}
                        </span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </div>
            </SidebarMenu>
          </Sidebar>
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
              {section.simplifiedText && showSimplified[section.id] ? (
                <div className="bg-muted/60 p-4 rounded-lg leading-[200%]">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Simplified Version
                  </h3>
                  {renderWithGlossary(
                    section.simplifiedText,
                    paperSummary.geminiKeywords
                  )}
                </div>
              ) : (
                section.para.map((para, index) => (
                  <div key={index} className="mb-6">
                    <p className="text-foreground leading-[200%] break-words text-[1rem] mb-2">
                      {renderWithGlossary(
                        para.text,
                        paperSummary.geminiKeywords
                      )}
                    </p>
                  </div>
                ))
              )}
            </div>
          ))}
          {(paperSummary?.grobidFigures?.length ?? 0) > 0 && (
            <div className="my-8">
              <h3 className="text-xl font-semibold mb-4">Figures</h3>
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
        <ScrollArea className="flex flex-col h-full border-t lg:p-[1rem] gap-[1rem] lg:border-l">
          <Card className=" w-[22rem] hidden lg:block shadow-none">
            <CardHeader
              className="z-5 text-[1rem] font-medium flex justify-between items-center cursor-pointer"
              onClick={() => setSummaryOpen((prev) => !prev)}
            >
              <span>Paper Summary</span>
              {summaryOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </CardHeader>

            {summaryOpen && (
              <CardContent className="text-[1rem] pt-[1rem] text-muted-foreground ">
                {paperSummary?.grobidAbstract.summary}
              </CardContent>
            )}
          </Card>

          <Card className="my-[1rem] w-[22rem] hidden lg:block shadow-none">
            <CardHeader
              className="z-5 text-[1rem] font-medium flex justify-between items-center cursor-pointer"
              onClick={() => setAuthorsOpen((prev) => !prev)}
            >
              <span>Authors</span>
              {authorsOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </CardHeader>
            {authorsOpen && (
              <CardContent className="flex flex-col pt-[1rem]">
                {paperSummary?.grobidAbstract?.authors?.map((author, index) => (
                  <a
                    key={index}
                    href={`https://www.google.com/search?q=${encodeURIComponent(
                      author
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[1rem] text-foreground py-1 bg-background/70 backdrop-blur-sm rounded-md inline-block hover:underline"
                  >
                    {author}
                  </a>
                ))}
              </CardContent>
            )}
          </Card>
          {paperSummary?.geminiKeywords && (
            <KeywordAccordion keyword={paperSummary.geminiKeywords} />
          )}
        </ScrollArea>
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
