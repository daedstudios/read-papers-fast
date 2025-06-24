import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

function getScoreColor(score: number) {
  if (score < 0.4) return "text-red-500";
  if (score < 0.7) return "text-orange-500";
  return "text-green-600";
}

export function RelevanceSummaryCard({ data }: { data: RelevanceSummary }) {
  if (data.score === 0) return null;

  return (
    <div className="">
      <div className="flex items-center gap-4 mb-2">
        <span
          className={`text-[1.25rem] font-medium  ${getScoreColor(data.score)}`}
        >
          Relevance: {(data.score * 100).toFixed(1)}%
        </span>
      </div>
      <div className="mb-[1rem] text-gray-700">{data.summary}</div>
      {data.relevant_sections.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-[1rem] font-medium cursor-pointer">
              see relevant sections
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-4">
                {data.relevant_sections.map((section, idx) => (
                  <li key={idx} className="border-l-4 pl-2 border-muted">
                    {section.section_heading && (
                      <div className="font-medium">
                        {section.section_heading}
                      </div>
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
