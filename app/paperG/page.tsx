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

interface PaperSummary {
  id: string;
  title: string;
  sections: Section[];
  acronyms: Acronyms[];
}

// Loading component for Suspense fallback
const PaperLoading = () => <div>Loading paper data...</div>;

// Main component that uses useSearchParams
function PaperContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [paperSummary, setPaperSummary] = useState<PaperSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const keyWordRef = useRef<HTMLDivElement>(null);

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
        setPaperSummary(data.paperSummary);
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!paperSummary) return <div>No paper summary found</div>;

  return (
    <>
      <div className="fixed top-[1rem] left-[1rem] text-[1.25rem] text-foreground font-medium">
        <Link href="/" passHref>
          <button className="text-[1.25rem] cursor-pointer text-foreground font-medium">
            ReadPapersFast
          </button>
        </Link>
        <Button
          onClick={() => {
            gsap.to(menuRef.current, {
              duration: 0.5,
              height: "30rem",
              width: "30rem",
              ease: "power2.inOut",
            });
          }}
        >
          key
        </Button>
      </div>
      <div className="flex flex-row justify-between w-full h-[90vh] mt-[10vh]">
        <ScrollArea
          className="md:w-[22rem] absolute h-0 w-0 top-0 left-0 md:block px-[1rem] md:h-full"
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
              <SidebarHeader className="text-[1.5rem] font-medium text-foreground z-3 pb-[1rem]">
                {" "}
                Table of contents
              </SidebarHeader>
              {paperSummary.sections.map((section) => (
                <SidebarMenuItem key={section.id}>
                  <SidebarMenuButton asChild>
                    <a
                      href={`#${section.id}`}
                      // className="block mb-2 text-sm text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(section.id)?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                    >
                      <span className="text-[1rem] truncate text-ellipsis break-words ">
                        {section.title}
                      </span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </Sidebar>
        </ScrollArea>
        <ScrollArea className="w-[42rem]  mx-[2rem] h-full">
          <h1 className="text-[2.25rem] max-w-[40rem] font-medium pb-[3rem]">
            {paperSummary.title}
          </h1>
          {paperSummary.sections.map((section) => (
            <div key={section.id} className="mb-[4rem] max-w-[40rem] mx-auto">
              <h2
                id={section.id}
                className="text-[1.5rem] font-medium mb-2 text-foreground break-words"
              >
                {section.title}
              </h2>
              <div className="prose max-w-full text-foreground leading-[200%] break-words">
                {section.summary}
              </div>
            </div>
          ))}
        </ScrollArea>
        <ScrollArea
          className="lg:w-[28rem] px-[1rem] w-0  h-0 fixed top-0 right-0  lg:h-full"
          ref={keyWordRef}
        >
          <Sidebar className="relative lg:w-[28rem] px-[1rem]">
            <SidebarMenu className="bg-background h-full rounded-[1rem] overflow-hidden relative">
              <Image
                src="/LANDING-2.png"
                alt="Background"
                fill
                priority
                className="object-cover absolute inset-0 z-0"
              />
              <SidebarHeader className="text-[1.5rem] font-medium text-foreground z-3 p-[1rem]">
                {" "}
                Keywords
              </SidebarHeader>

              <div className="relative z-10 p-[1rem] space-y-4">
                {paperSummary?.acronyms?.map((acronym) => (
                  <div
                    key={acronym.keyword}
                    className="rounded-xl bg-muted/60 backdrop-blur-sm p-4 shadow-sm border border-border"
                  >
                    <p className="text-[1rem] font-medium text-muted-foreground">
                      {acronym.keyword}
                    </p>
                    <p className="text-[1.25rem] font-medium text-foreground">
                      {acronym.value}
                    </p>
                    <p className="text-[1rem] text-muted-foreground mt-1">
                      {acronym.explanation}
                    </p>
                  </div>
                ))}
              </div>
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
