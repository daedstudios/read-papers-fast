"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

type FinalVerdictData = {
  final_verdict:
    | "true"
    | "mostly_true"
    | "mixed_evidence"
    | "mostly_false"
    | "false"
    | "insufficient_evidence";
  confidence_score: number;
  explanation: string;
  supporting_evidence_count: number;
  contradicting_evidence_count: number;
  neutral_evidence_count: number;
  key_findings: string[];
  limitations: string[];
};

interface FinalVerdictCardProps {
  verdict: FinalVerdictData;
  statement: string;
  onFilterChange?: (
    filter: "contradicting" | "neutral" | "supporting" | null
  ) => void;
  currentFilter?: "contradicting" | "neutral" | "supporting" | null;
}

const FinalVerdictCard = ({
  verdict,
  statement,
  onFilterChange,
  currentFilter,
}: FinalVerdictCardProps) => {
  const getVerdictConfig = (verdictType: string) => {
    const configs = {
      true: {
        label: "TRUE",
        color: "bg-green-100 text-green-800 border-green-300",
        icon: CheckCircle,
        bgColor: "bg-green-50",
        sliderPosition: 95,
        sliderColor: "bg-[#AEFFD9]",
      },
      mostly_true: {
        label: "MOSTLY TRUE",
        color: "bg-green-100 text-green-700 border-green-300",
        icon: CheckCircle,
        bgColor: "bg-green-50",
        sliderPosition: 80,
        sliderColor: "bg-[#AEFFD9]",
      },
      mixed_evidence: {
        label: "MIXED EVIDENCE",
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: AlertTriangle,
        bgColor: "bg-yellow-50",
        sliderPosition: 50,
        sliderColor: "bg-[#C5C8FF]",
      },
      mostly_false: {
        label: "MOSTLY FALSE",
        color: "bg-red-100 text-red-700 border-red-300",
        icon: XCircle,
        bgColor: "bg-red-50",
        sliderPosition: 25,
        sliderColor: "bg-[#FFBAD8]",
      },
      false: {
        label: "FALSE",
        color: "bg-red-100 text-red-800 border-red-300",
        icon: XCircle,
        bgColor: "bg-red-50",
        sliderPosition: 5,
        sliderColor: "bg-[#FFBAD8]",
      },
      insufficient_evidence: {
        label: "INSUFFICIENT EVIDENCE",
        color: "bg-gray-100 text-gray-800 border-gray-300",
        icon: HelpCircle,
        bgColor: "bg-gray-50",
        sliderPosition: 50,
        sliderColor: "bg-[#C5C8FF]",
      },
    };
    return (
      configs[verdictType as keyof typeof configs] ||
      configs.insufficient_evidence
    );
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const config = getVerdictConfig(verdict.final_verdict);
  const IconComponent = config.icon;

  // Helper to determine if a card is active
  const isActive = (filter: string) => currentFilter === filter;

  return (
    <Card
      className={` hover:shadow-lg transition-all duration-300 border-foreground rounded-sm`}
    >
      <CardHeader className="pb-4">
        <CardTitle className="text-[1.5rem] font-bold text-foreground">
          Final Verdict
        </CardTitle>

        {/* <Badge
            className={`${config.color} text-sm font-bold px-3 py-1 rounded-none border`}
          >
            <IconComponent size={16} className="mr-1" />
            {config.label}
          </Badge> */}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Statement */}

        <div className="mb-4">
          <div className="relative h-4 bg-background  overflow-hidden border-1 border-foreground">
            <div
              className={`absolute top-0 left-0 h-full ${config.sliderColor} transition-all duration-1000 ease-out`}
              style={{ width: `${config.sliderPosition}%` }}
            ></div>
            {/* Black marker line */}
            <div
              className="absolute top-0 h-[3rem] w-[4px] bg-black z-20"
              style={{ left: `calc(${config.sliderPosition}% - 1px)` }}
            ></div>
          </div>
          <div className=" flex items-center justify-between mt-2">
            <span className="text-sm font-bold text-foreground z-10">
              BULLSHIT
            </span>
            <span className="text-sm font-bold text-foreground z-10">TRUE</span>
          </div>
        </div>
        <p className="text-foreground text-[1.5rem] italic">"{statement}"</p>

        {/* Score Bar */}

        {/* Explanation */}
        <div>
          <p className="text-foreground text-[1rem] leading-relaxed">
            {verdict.explanation}
          </p>
        </div>

        {/* Evidence Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`bg-[#FFBAD8] p-4 rounded-sm border border-foreground cursor-pointer transition-all duration-200 hover:scale-105 ${
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
              {verdict.contradicting_evidence_count}
            </div>
            <div className="text-xs text-foreground">papers</div>
          </div>
          <div
            className={`bg-[#C5C8FF] p-4 rounded-sm border border-foreground cursor-pointer transition-all duration-200 hover:scale-105 ${
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
            <div className="text-2xl font-bold text-foreground ">
              {verdict.neutral_evidence_count}
            </div>
            <div className="text-xs text-foreground">papers</div>
          </div>
          <div
            className={`bg-[#AEFFD9] p-4 rounded-sm border border-foreground cursor-pointer transition-all duration-200 hover:scale-105 ${
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
              {verdict.supporting_evidence_count}
            </div>
            <div className="text-xs text-foreground">papers</div>
          </div>
        </div>
        {/* Show All button if a filter is active */}
        {/* {currentFilter && onFilterChange && (
          <div className="mt-2 text-center">
            <button
              className="underline text-foreground text-sm hover:text-blue-700"
              onClick={() => onFilterChange(null)}
            >
              Show All Papers
            </button>
          </div>
        )} */}

        {/* Key Findings */}
        {verdict.key_findings.length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Key Findings:
            </h3>
            <ul className="list-disc list-inside space-y-1 text-[1rem] text-foreground">
              {verdict.key_findings.map((finding, index) => (
                <li key={index}>{finding}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Limitations */}
        {/* {verdict.limitations.length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground mb-2">Limitations:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {verdict.limitations.map((limitation, index) => (
                <li key={index}>{limitation}</li>
              ))}
            </ul>
          </div>
        )} */}
      </CardContent>
    </Card>
  );
};

export default FinalVerdictCard;
