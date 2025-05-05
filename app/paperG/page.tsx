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
import { Drawer } from "vaul";
import { DrawerHeader } from "@/components/ui/drawer";

gsap.registerPlugin(useGSAP);

interface Section {
  id: string;
  title: string;
  summary: string;
  order: number;
  paperSummaryId: string;
}

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
}

interface GrobidContentResponse {
  grobidContent: GrobidSection[];
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

  useEffect(() => {
    console.log("Grobid Content:", paperSummary);
  }, [paperSummary]);

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
      <div className="fixed top-[1rem] left-[1rem] text-[1.25rem] text-foreground font-medium">
        <Link href="/" passHref>
          <button className="text-[1.25rem] cursor-pointer text-foreground font-medium">
            ReadPapersFast
          </button>
        </Link>
      </div>
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Trigger asChild>
          <div className="fixed bottom-0 h-[4.5rem] left-0 w-full z-50 flex bg-transparent items-center justify-center md:hidden px-[2rem]">
            <Button className="text-foreground  w-full h-[3rem] rounded-[2rem] backdrop-blur-lg text-[1rem] hover:shadow-md cursor-pointer">
              <Image
                src="/LANDING-2.png"
                alt="Background"
                fill
                priority
                className="object-cover fixed top-0  z-[-1] full rounded-[2rem]"
              />
              Table of contents
            </Button>
          </div>
        </Drawer.Trigger>

        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />

        <Drawer.Content className="fixed rounded-[1rem] bottom-0 left-0 w-full h-[70%] bg-background z-50 p-4 overflow-auto">
          <div className="fixed inset-0 z-20 bg-background block md:hidden">
            <ScrollArea className="h-full w-full p-4" ref={menuRef}>
              <div className="bg-background w-full h-full">
                <Image
                  src="/LANDING-2.png"
                  alt="Background"
                  fill
                  priority
                  className="object-cover fixed top-0 rounded-[1rem] full"
                />
                <SidebarHeader className="relative text-[1.5rem] z-100 text-foreground font-medium pb-4">
                  Table of contents
                </SidebarHeader>

                <div className="relative z-10">
                  {paperSummary?.grobidContent?.map((section) => (
                    <SidebarMenuItem
                      key={section.id}
                      className="list-none appearance-none p-[0.5rem]"
                    >
                      <SidebarMenuButton asChild>
                        <a
                          href={`#${section.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            document
                              .getElementById(section.id)
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                            setOpen(false);
                          }}
                        >
                          <span className="text-[1rem] truncate text-ellipsis break-words block">
                            {section.head_n} {section.head}
                          </span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        </Drawer.Content>
      </Drawer.Root>
      <div className="flex flex-row justify-between w-full h-[92vh] mt-[8vh]">
        <ScrollArea
          className="md:w-[22rem] rounded-[1rem] hidden absolute h-0 w-0 top-0 left-0 md:block px-[1rem] md:h-full"
          ref={menuRef}
        >
          <Sidebar className="relative w-full h-full" collapsible="offcanvas">
            <SidebarMenu className="bg-background m-4 w-[18rem] h-full">
              <Image
                src="/LANDING-2.png"
                alt="Background"
                fill
                priority
                className="object-cover fixed top-0 rounded-[1rem] full"
              />
              <SidebarHeader className="text-[1.5rem] font-medium text-foreground z-3 pb-[1rem] relative">
                Table of contents
              </SidebarHeader>

              <div className="relative z-10">
                {paperSummary?.grobidContent?.map((section) => (
                  <SidebarMenuItem key={section.id}>
                    <SidebarMenuButton asChild>
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
                        <span className="text-[1rem] truncate text-ellipsis break-words block">
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

        <ScrollArea className="w-[42rem] mx-[2rem] h-full">
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
                      {Object.entries(para.refs).map(
                        ([refKey, refValue]: [string, any]) => (
                          <li key={refKey}>{refKey}</li>
                        )
                      )}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ))}
        </ScrollArea>
        <ScrollArea
          className="w-[22rem] hidden rounded-[1rem] max-h-[24rem] absolute top-0 left-0 lg:block px-[1rem] md:h-full"
          ref={keyWordRef}
        >
          <Sidebar className="relative w-full ">
            <SidebarMenu className="bg-background h-full  overflow-hidden relative">
              <Image
                src="/LANDING-2.png"
                alt="Background"
                fill
                priority
                className="object-cover fixed top-0 rounded-[1rem] full"
              />
              <SidebarHeader className="text-[1.5rem] font-medium text-foreground z-3 p-[1rem]">
                {" "}
                Keywords
              </SidebarHeader>

              <div className="relative z-10 p-[1rem] space-y-4"></div>
            </SidebarMenu>
          </Sidebar>
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
