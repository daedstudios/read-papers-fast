import React from "react";

type RelevantSection = {
  section_heading?: string;
  text_snippet: string;
  page?: number;
};

type RelevanceSummary = {
  relevance: "highly relevant" | "somewhat relevant" | "not relevant";
  summary: string;
  relevant_sections: RelevantSection[];
};

function getRelevanceColor(relevance: string) {
  if (relevance === "highly relevant") return "text-green-600";
  if (relevance === "somewhat relevant") return "text-orange-500";
  return "text-red-500";
}

export function RelevanceSummaryCard({ data }: { data: RelevanceSummary }) {
  return (
    <div className="">
      <div className="flex items-center gap-4 mb-2">
        <span className="text-lg">Relevance:</span>
        <span
          className={`text-2xl font-mono capitalize ${getRelevanceColor(
            data.relevance
          )}`}
        >
          {data.relevance}
        </span>
      </div>
      <div className="mb-[1rem] text-gray-700">{data.summary}</div>
      {data.relevant_sections && data.relevant_sections.length > 0 && (
        <div>
          <div className="font-semibold mb-2">Most Relevant Sections:</div>
          <ul className="space-y-4">
            {data.relevant_sections.map((section, idx) => (
              <li key={idx} className="border-l-4 pl-2 border-muted-foreground">
                {section.section_heading && (
                  <div className="font-medium">{section.section_heading}</div>
                )}
                <div className="text-gray-800">{section.text_snippet}</div>
                {section.page !== undefined && (
                  <div className="text-xs text-gray-500">
                    Page {section.page}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
