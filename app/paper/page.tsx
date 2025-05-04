"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/header";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
  authors: string[];
  publishedDate: string;
  summary: string;
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

  useEffect(() => {
    async function fetchPaperSummary() {
      if (!id) {
        setError("Paper ID is required");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/paper-summary?id=${id}`);
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

  function formatHumanDate(dateStr: string): string {
    const [year, month, day] = dateStr.split("-");

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    if (month === "00" || !month) return year;
    const monthIndex = parseInt(month, 10) - 1;

    if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return year;

    return `${monthNames[monthIndex]} ${year}`;
  }

  return (
    <>
      <div className="fixed top-[1rem] left-[1rem] text-[1.25rem] text-foreground font-medium">
        <Link href="/" passHref>
          <button className="text-[1.25rem] cursor-pointer text-foreground font-medium">
            ReadPapersFast
          </button>
        </Link>
      </div>
      <div className="flex flex-row justify-between w-full h-[90vh] mt-[10vh]">
        <div className="flex flex-col w-[22rem] gap-[1rem] h-full">
          <ScrollArea className="w-[22rem] hidden md:block px-[1rem]  rounded-[1rem]">
            <Sidebar className="relative w-full h-full  ">
              <SidebarMenu className="bg-background m-4 w-[18rem] h-full">
                <Image
                  src="/LANDING-2.png"
                  alt="Background"
                  fill
                  priority
                  className="object-cover fixed top-0 full"
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
          <ScrollArea className="m-[1rem] relative  overflow-hidden rounded-[1rem]">
            <Card className="">
              <Image
                src="/LANDING-2.png"
                alt="Background"
                fill
                priority
                className="object-cover rounded-[1rem]"
              />
              <CardHeader className="z-5 text-[1.5rem] font-medium">
                Authors
              </CardHeader>
              <CardContent className="flex flex-col z-10 space-y-2">
                {paperSummary.authors?.map((author, index) => (
                  <p
                    key={index}
                    className="text-[1rem] text-foreground bg-background/70 backdrop-blur-sm px-3 py-1 rounded-md inline-block"
                  >
                    {author}
                  </p>
                ))}
              </CardContent>
            </Card>
          </ScrollArea>
        </div>
        <ScrollArea className="w-[42rem]  mx-[2rem] h-full ">
          <p className="text-[1rem] z-10 text-foreground font-medium">
            Publishing Date: {formatHumanDate(paperSummary.publishedDate)}
          </p>
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
        <div className="flex flex-col w-[28rem] justify-between gap-[1rem] h-full">
          <ScrollArea className="m-[1rem] relative overflow-hidden rounded-[1rem]">
            <Card className="">
              <Image
                src="/LANDING-2.png"
                alt="Background"
                fill
                priority
                className="object-cover rounded-[1rem]"
              />
              <CardHeader className="z-5 text-[1.5rem] font-medium">
                Paper Summary
              </CardHeader>
              <CardContent className="flex flex-col z-10 space-y-2">
                <p className="text-[1rem] text-foreground bg-background/70 backdrop-blur-sm px-3 py-1 rounded-md inline-block">
                  {paperSummary.summary}
                </p>
              </CardContent>
            </Card>
          </ScrollArea>
          <ScrollArea className="w-[28rem] hidden max-h-[24rem] px-[1rem] lg:block h-full rounded-[1rem] mb-[1rem]">
            <Sidebar className="relative w-full h-full ">
              <Image
                src="/LANDING-2.png"
                alt="Background"
                fill
                priority
                className="object-cover rounded-[1rem] z-3"
              />
              <SidebarMenu className="bg-background h-full rounded-[1rem] overflow-hidden relative">
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
