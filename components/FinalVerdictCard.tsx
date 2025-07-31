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
  Share,
} from "lucide-react";
import { useState } from "react";
import posthog from "posthog-js";

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
  shareableId?: string | null;
}

const FinalVerdictCard = ({
  verdict,
  statement,
  onFilterChange,
  currentFilter,
  shareableId,
}: FinalVerdictCardProps) => {
  const [copied, setCopied] = useState(false);

  const getVerdictConfig = (verdictType: string) => {
    const configs = {
      true: {
        label: "TRUE",
        color: "bg-green-100 text-green-800 border-green-300",
        icon: CheckCircle,
        bgColor: "bg-green-50",
        sliderPosition: 95,
        sliderColor: "bg-[#50C477]",
      },
      mostly_true: {
        label: "MOSTLY TRUE",
        color: "bg-green-100 text-green-700 border-green-300",
        icon: CheckCircle,
        bgColor: "bg-green-50",
        sliderPosition: 75,
        sliderColor: "bg-[#50C477]",
      },
      mixed_evidence: {
        label: "MIXED EVIDENCE",
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: AlertTriangle,
        bgColor: "bg-yellow-50",
        sliderPosition: 50,
        sliderColor: "bg-[#FFE17D]",
      },
      mostly_false: {
        label: "MOSTLY FALSE",
        color: "bg-red-100 text-red-700 border-red-300",
        icon: XCircle,
        bgColor: "bg-red-50",
        sliderPosition: 25,
        sliderColor: "bg-[#FF834A]",
      },
      false: {
        label: "FALSE",
        color: "bg-red-100 text-red-800 border-red-300",
        icon: XCircle,
        bgColor: "bg-red-50",
        sliderPosition: 5,
        sliderColor: "bg-[#FF834A]",
      },
      insufficient_evidence: {
        label: "INSUFFICIENT EVIDENCE",
        color: "bg-gray-100 text-gray-800 border-gray-300",
        icon: HelpCircle,
        bgColor: "bg-gray-50",
        sliderPosition: 50,
        sliderColor: "bg-gray-300",
      },
    };

    return (
      configs[verdictType as keyof typeof configs] ||
      configs.insufficient_evidence
    );
  };

  const config = getVerdictConfig(verdict.final_verdict);

  const handleShare = async () => {
    try {
      let urlToCopy;
      if (shareableId) {
        // Use the shareable URL if available
        urlToCopy = `${window.location.origin}/fact-check/shared/${shareableId}`;
      } else {
        // Fallback to current URL if no shareableId
        urlToCopy = window.location.href;
      }

      // Create a custom share message
      const shareMessage = `Shit-Check evidence shows the statement "${statement}" Is: ${config.label}\nCheck out the full analysis with peer-reviewed papers:\n${urlToCopy}`;

      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // PostHog event tracking for share link copied
      posthog.capture("fact_check_shared", {
        verdict_type: verdict.final_verdict,
        confidence_score: verdict.confidence_score,
        has_shareable_id: !!shareableId,
        shareable_id: shareableId,
        statement_length: statement.length,
        statement_words: statement.split(" ").length,
        location: "final_verdict_card",
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const IconComponent = config.icon;

  // Helper to determine if a card is active
  const isActive = (filter: string) => currentFilter === filter;

  return (
    <Card
      className={` hover:shadow-lg transition-all duration-300 border-foreground rounded-sm relative`}
    >
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-[1.5rem] font-bold text-foreground">
            Final Verdict
          </CardTitle>
          <button
            onClick={handleShare}
            className="p-2  border bg-background border-foreground hover:bg-muted transition-colors flex items-center gap-2 cursor-pointer"
            title="Copy share link"
          >
            <span className="text-[1rem] text-foreground font-bold">
              {copied ? "Copied!" : "Share"}
            </span>
            <Share size={16} className="text-foreground" />
          </button>
        </div>
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
              className="absolute top-0 h-[3rem] w-[4px] bg-black z-0"
              style={{ left: `calc(${config.sliderPosition}% - 1px)` }}
            ></div>
          </div>
          <div className=" flex items-center justify-between mt-2">
            <span className="text-sm font-bold text-foreground z-0">
              BULLSHIT
            </span>
            <span className="text-sm font-bold text-foreground z-0">TRUE</span>
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
      </CardContent>
    </Card>
  );
};

export default FinalVerdictCard;
