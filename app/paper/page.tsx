"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Section {
  id: string;
  title: string;
  content: string;
  order: number;
  paperSummaryId: string;
}

interface PaperSummary {
  id: string;
  title: string;
  sections: Section[];
}

export default function PaperPage() {
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{paperSummary.title}</h1>

      {paperSummary.sections.map((section) => (
        <div key={section.id} className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
          <div className="prose max-w-none">{section.content}</div>
        </div>
      ))}
    </div>
  );
}
