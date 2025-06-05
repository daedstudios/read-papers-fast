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
  refs?: Record<string, unknown>; // optional if not always present
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

  useEffect(() => {
    if (paperSummary) {
      const figuresWithImages = paperSummary.grobidFigures
        .filter((figure) => figure.figure_type === "figure" && figure.image_url)
        .map((figure) => {
          // Parse the JSON string into an array of image objects
          const imageData = figure.image_url
            ? JSON.parse(figure.image_url)
            : [];

          return {
            label: figure.label,
            // Extract the actual image URLs from the parsed data
            imageUrls: imageData.map((img: any) => ({
              url: img.image_url,
              width: img.width,
              height: img.height,
              pageNumber: img.page_number,
              ext: img.image_ext,
            })),
            figure_id: figure.figure_id,
            description: figure.description,
          };
        });

      console.log("Figures with images:", figuresWithImages);

      // Now you can access values directly, for example:
      figuresWithImages.forEach((figure, index) => {
        if (figure.imageUrls.length > 0) {
          console.log(`Figure ${index} has URL:`, figure.imageUrls);
          for (const image of figure.imageUrls) {
            console.log(
              `Image URL: ${image.url}, Width: ${image.width}, Height: ${image.height}`
            );
            setImageUrls((prev) => [
              ...prev,
              {
                url: image.url,
                width: image.width,
                height: image.height,
                pageNumber: image.pageNumber,
                ext: image.ext,
                label: figure.label,
                figure_id: figure.figure_id,
                description: figure.description,
              },
            ]);
          }
        }
      });
    }
  }, [paperSummary]);

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
            <SidebarMenu className="bg-background h-full">
              <div className="relative z-10">
                {paperSummary?.grobidContent?.map((section) => (
                  <SidebarMenuItem key={section.id}>
                    <SidebarMenuButton
                      asChild
                      className="hover:bg-[url('/LANDING-2.png')] bg-cover active:bg-[url('/LANDING-2.png')] data-[active=true]:text-background"
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
                        <span className="text-[1rem] truncate text-ellipsis break-words block ">
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

              {paperSummary.grobidAbstract.authors.length > 0 && (
                <div className="mb-4">
                  <p className="text-muted-foreground text-[1rem]"></p>
                </div>
              )}
              <div className="border-b border-border mb-8 pb-2"></div>
            </div>
          )}
          {paperSummary?.grobidContent.map((section) => (
            <div key={section.id} className="mb-[3rem]">
              {/* Section heading */}
              <h2
                id={section.id}
                className="text-[1.5rem] font-medium mb-2 text-foreground break-words"
              >
                {section.head_n} {section.head}
              </h2>

              {/* Paragraphs */}
              {section.para.map((para, index) => (
                <div key={index} className="mb-6">
                  <p className="text-foreground leading-[200%] break-words text-[1rem] mb-2">
                    {para.text}
                  </p>

                  {para.refs && Object.keys(para.refs).length > 0 && (
                    <ul className="pl-4 list-disc text-muted-foreground text-sm">
                      {(() => {
                        const refItems = [];
                        for (const [refKey, refValue] of Object.entries(
                          para.refs
                        )) {
                          if ((refValue as any).type === "figure") {
                            console.log(
                              `"Figure:", ${refKey}, ${(refValue as any).id})`
                            );
                          }
                          refItems.push(
                            <li key={refKey}>
                              {refKey}
                              {(refValue as any).type}
                            </li>
                          );
                          // You can add if-else conditions here
                        }
                        return refItems;
                      })()}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ))}
          {imageUrls.length > 0 && (
            <div className="my-8">
              <h3 className="text-xl font-semibold mb-4">Figures</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {imageUrls.map((image, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 flex flex-col"
                  >
                    <div className="relative w-full h-60">
                      <Image
                        src={image.url}
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
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
        <div className="flex flex-col  h-full border-t lg:p-[1rem] gap-[1rem] lg:border-l">
          {paperSummary?.geminiKeywords && (
            <KeywordAccordion keyword={paperSummary.geminiKeywords} />
          )}
          <ScrollArea className="hidden  w-[22rem] lg:block relative overflow-hidden ">
            <Card className="">
              <CardHeader className="z-5 text-[1rem] font-medium">
                Paper Summary
              </CardHeader>
              <CardContent className="flex flex-col z-10 ">
                <p className="text-[1rem] text-muted-foreground bg-background/70 backdrop-blur-sm  rounded-md inline-block">
                  {paperSummary?.grobidAbstract.summary}
                </p>
              </CardContent>
            </Card>
          </ScrollArea>
          <ScrollArea className=" relative hidden lg:block overflow-hidden ">
            <Card className="">
              <CardHeader className="z-5 text-[1rem] font-medium">
                Authors
              </CardHeader>
              <CardContent className="flex flex-col ">
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
            </Card>
          </ScrollArea>
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
