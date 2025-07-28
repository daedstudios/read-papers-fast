"use client";

import React from "react";
import { TrendingDown, HelpCircle, TrendingUp } from "lucide-react";

interface PaperFilterBoxesProps {
  supporting: number;
  contradicting: number;
  neutral: number;
  onFilterChange?: (
    filter: "contradicting" | "neutral" | "supporting" | null
  ) => void;
  currentFilter?: "contradicting" | "neutral" | "supporting" | null;
}

const PaperFilterBoxes: React.FC<PaperFilterBoxesProps> = ({
  supporting,
  contradicting,
  neutral,
  onFilterChange,
  currentFilter,
}) => {
  const isActive = (filter: string) => currentFilter === filter;

    return (
      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Filter
        </h3>
        <div className="flex md:flex-row flex-col gap-4 mb-8">
          <div
            className={`bg-[#FFBAD8] p-4 rounded-sm w-full border border-foreground cursor-pointer transition-all duration-200 hover:scale-105 ${
              isActive("contradicting")
                ? "ring-1 ring-foreground"
                : "hover:shadow-md"
            }`}
            onClick={() => {
              if (onFilterChange) {
                onFilterChange(
                  isActive("contradicting") ? null : "contradicting"
                );
              }
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={16} className="text-foreground" />
              <span className="font-semibold text-foreground">
                Contradicting
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {contradicting}
            </div>
            <div className="text-xs text-foreground">papers</div>
          </div>

          <div
            className={`bg-[#C5C8FF] p-4 rounded-sm w-full border border-foreground cursor-pointer transition-all duration-200 hover:scale-105 ${
              isActive("neutral") ? "ring-1 ring-foreground" : "hover:shadow-md"
            }`}
            onClick={() => {
              if (onFilterChange) {
                onFilterChange(isActive("neutral") ? null : "neutral");
              }
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle size={16} className="text-foreground" />
              <span className="font-semibold text-foreground">Neutral</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{neutral}</div>
            <div className="text-xs text-foreground">papers</div>
          </div>

          <div
            className={`bg-[#AEFFD9] p-4 rounded-sm w-full border border-foreground cursor-pointer transition-all duration-200 hover:scale-105 ${
              isActive("supporting")
                ? "ring-1 ring-foreground"
                : "hover:shadow-md"
            }`}
            onClick={() => {
              if (onFilterChange) {
                onFilterChange(isActive("supporting") ? null : "supporting");
              }
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-foreground" />
              <span className="font-semibold text-foreground">Supporting</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {supporting}
            </div>
            <div className="text-xs text-foreground">papers</div>
          </div>
        </div>
      </div>
    );
};

export default PaperFilterBoxes;
