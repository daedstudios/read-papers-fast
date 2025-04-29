"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

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
      <div className="fixed top-[1rem] left-[1rem] text-[1.25rem] text-foreground font-medium">
        readpapersfast.ai
      </div>
      <div className="flex flex-row w-full">
        <div className="sticky w-[22rem] pt-[6rem] px-[1rem]">
          {/* <h1 className="text-[1.5rem] font-regular mb-6">
          {paperSummary.title}
        </h1> */}
          {paperSummary.sections.map((section) => (
            <div key={section.id} className="mb-[0.5rem]">
              <h2 className="text-[1rem] font-regular mb-2 text-muted-foreground hover:text-foreground cursor-pointer">
                {section.title}
              </h2>
              {/* <div className="prose max-w-none">{section.content}</div> */}
            </div>
          ))}
        </div>
        <div className="justify-center pt-[6rem] h-screen w-[42rem] overflow-y-auto scroll-auto">
          Human development is now seen as the main goal of human activities,
          instead of just focusing on economic growth. This idea comes from
          earlier concepts like the “basic needs” approach by organizations like
          the ILO and the World Bank, and Amartya Sen’s idea of “capabilities.”
          In simple terms, human development means giving people more choices so
          they can live longer, healthier, and more fulfilling lives. However,
          the idea of “enlarging people’s choices” is very broad. To study the
          relationship between human development (HD) and economic growth (EG)
          more clearly, we need to focus on a narrower definition. For this
          paper, we define human development mainly by the health and education
          of a country’s people — even though this is a very simplified view.
          There is a strong connection between economic growth and human
          development. Economic growth can lead to improvements in human
          development, and human development can also support economic growth.
          Human development is now seen as the main goal of human activities,
          instead of just focusing on economic growth. This idea comes from
          earlier concepts like the “basic needs” approach by organizations like
          the ILO and the World Bank, and Amartya Sen’s idea of “capabilities.”
          In simple terms, human development means giving people more choices so
          they can live longer, healthier, and more fulfilling lives. However,
          the idea of “enlarging people’s choices” is very broad. To study the
          relationship between human development (HD) and economic growth (EG)
          more clearly, we need to focus on a narrower definition. For this
          paper, we define human development mainly by the health and education
          of a country’s people — even though this is a very simplified view.
          There is a strong connection between economic growth and human
          development. Economic growth can lead to improvements in human
          development, and human development can also support economic growth.
          Human development is now seen as the main goal of human activities,
          instead of just focusing on economic growth. This idea comes from
          earlier concepts like the “basic needs” approach by organizations like
          the ILO and the World Bank, and Amartya Sen’s idea of “capabilities.”
          In simple terms, human development means giving people more choices so
          they can live longer, healthier, and more fulfilling lives. However,
          the idea of “enlarging people’s choices” is very broad. To study the
          relationship between human development (HD) and economic growth (EG)
          more clearly, we need to focus on a narrower definition. For this
          paper, we define human development mainly by the health and education
          of a country’s people — even though this is a very simplified view.
          There is a strong connection between economic growth and human
          development. Economic growth can lead to improvements in human
          development, and human development can also support economic growth.
        </div>
        <div className=" w-[22rem] sticky pt-[6rem] px-[1rem]">card</div>
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
