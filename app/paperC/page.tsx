"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import React from "react";
import SidebarNav from "@/components/SidebarNav";
import References, {
  ReferenceType,
} from "@/components/PaperComponents/References";
import BiblStructure, {
  BiblographyEntry,
} from "@/components/PaperComponents/BiblStructure";
import PaperNotes, { Note } from "@/components/PaperComponents/PaperNotes";

gsap.registerPlugin(useGSAP);

type Keyword = {
  id: string;
  keyword: string;
  value: string;
  explanation: string;
};

interface GrobidParagraph {
  order_index: number;
  text: string;
  refs?: Record<string, ReferenceType>;
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
  references: BiblographyEntry[];
  paperNotes: Note[];
  pdfURL: { pdf_file_path: string } | null;
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

  const [imageUrls, setImageUrls] = useState<ImageUrl[] | []>([]);
<<<<<<< akshat/posthog-search
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
=======
>>>>>>> main

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

  return (
    <>
      <div className="flex flex-row  w-full h-[92vh] mt-[8vh]">
<<<<<<< akshat/posthog-search
        {" "}
        <SidebarNav
          sections={paperSummary?.grobidContent || []}
          activeSectionId={activeSectionId || undefined}
          onSectionClick={() => {}}
          id={id || ""}
        />
=======
        <SidebarNav id={id || ""} />
>>>>>>> main
        <ScrollArea className="w-full border-t p-[1rem] h-full">
          <div className="flex flex-row justify-between">
            {paperSummary?.grobidAbstract.publishedDate && (
              <span className="text-muted-foreground text-[1rem] mt-[1.5rem]">
                {" "}
                {new Date(
                  paperSummary.grobidAbstract.publishedDate
                ).toLocaleDateString()}
              </span>
            )}
          </div>
          {paperSummary?.pdfURL?.pdf_file_path && (
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                onClick={() =>
                  window.open(paperSummary.pdfURL?.pdf_file_path, "_blank")
                }
                className="flex items-center gap-2"
              >
                Open PDF
              </Button>
            </div>
          )}
          {paperSummary?.grobidAbstract && (
            <div className="mb-10 ">
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
              </div>

              {/* Section content */}
              {section.para.map((para, index) => (
                <div key={index} className="mb-6">
                  <p className="text-foreground leading-[200%] break-words text-[1rem] mb-2">
                    {para.text}
                  </p>

                  {para.refs && Object.entries(para.refs).length > 0 && (
                    <div className="mt-2">
                      {Object.entries(para.refs).map(([key, ref]) => (
                        <References key={key} {...ref} />
                      ))}
                    </div>
                  )}
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
          )}{" "}
          <BiblStructure id={id || ""} />
          <PaperNotes id={id || ""} />
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
