import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function TrendingShitcheckCard({ claim }) {
  // 'score' is a percentage (0-100) representing how true the claim is
  const truePercent = claim.score ?? 0;

  function getBarColor(percent) {
    if (percent < 34) return "bg-[#FFBAD8]"; // mostly bullshit
    if (percent < 67) return "bg-[#C5C8FF]"; // mixed
    return "bg-[#AEFFD9]"; // mostly true
  }

  const handleCardClick = () => {
    if (claim.sharedUrl) {
      window.open(claim.sharedUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card
      className={`w-full border-foreground max-w-2xl rounded-sm mx-auto my-2 bg-background transition cursor-pointer hover:shadow-lg  ${
        claim.sharedUrl ? "" : ""
      }`}
      onClick={handleCardClick}
      tabIndex={claim.sharedUrl ? 0 : -1}
      role={claim.sharedUrl ? "link" : undefined}
      aria-label={
        claim.sharedUrl ? `See fact-check for ${claim.claim}` : undefined
      }
    >
      <CardHeader className="flex flex-row justify-between">
        <div className="flex flex-col gap-2">
          <div className="italic text-sm">{claim.author}</div>
          <div className="text-2xl ">“{claim.claim}”</div>
        </div>
        <a
          href={claim.tiktokUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-base underline"
          onClick={(e) => e.stopPropagation()}
        >
          tiktok.com/link
        </a>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="my-2">
          <div className="h-4 border border-foreground relative overflow-hidden">
            <div
              className={`absolute left-0 top-0 h-full ${getBarColor(
                truePercent
              )}`}
              style={{ width: `${truePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span>bullshit</span>
            <span>true</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
