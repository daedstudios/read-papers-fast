import React from "react";

type RelevantSection = {
  section_heading?: string;
  text_snippet: string;
  page?: number;
};

type RelevanceSummary = {
  score: number;
  summary: string;
  relevant_sections: RelevantSection[];
};

export function RelevanceSummaryCard({ data }: { data: RelevanceSummary }) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow">
      <div className="flex items-center gap-4 mb-2">
        <span className="font-bold text-lg">Relevance Score:</span>
        <span className="text-2xl font-mono">
          {(data.score * 100).toFixed(1)}%
        </span>
      </div>
      <div className="mb-4 text-gray-700">{data.summary}</div>
      {data.relevant_sections.length > 0 && (
        <div>
          <div className="font-semibold mb-2">Most Relevant Sections:</div>
          <ul className="space-y-2">
            {data.relevant_sections.map((section, idx) => (
              <li key={idx} className="border-l-4 pl-2 border-blue-400">
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
