"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/header";

interface Section {
  id: string;
  title: string;
  summary: string;
  order: number;
  paperSummaryId: string;
}

interface PaperSummary {
  id: string;
  title: string;
  sections: Section[];
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

  return (
    <div className="">
      <Header />
      <div className="flex flex-row justify-between w-full max-w-[88rem] mx-auto">
        <div className="w-[22rem] hidden md:block h-screen sticky top-0 overflow-y-auto px-[1rem] pt-[6rem]">
          {paperSummary.sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="block mb-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {section.title}
            </a>
          ))}
        </div>

        <div className=" w-[42rem] overflow-y-scroll  px-[2rem] pt-[6rem] h-screen">
          {paperSummary.sections.map((section) => (
            <div key={section.id} className="mb-[4rem]">
              <h2
                id={section.id}
                className="text-[1.5rem] font-medium mb-2 text-foreground"
              >
                {section.title}
              </h2>
              <div className="prose max-w-none text-foreground leading-[200%]">
                {section.summary}
              </div>
            </div>
          ))}
        </div>
        <div className="w-[22rem] hidden lg:block h-screen  overflow-y-auto px-[1rem] pt-[6rem]">
          {paperSummary.sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="block mb-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {section.title}
            </a>
          ))}
        </div>
      </div>
    </div>
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
