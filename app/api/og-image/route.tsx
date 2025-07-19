import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statement = searchParams.get("statement");
  const verdict = searchParams.get("verdict");
  const confidence = searchParams.get("confidence");

  if (!statement || !verdict || !confidence) {
    return new Response("Missing required parameters", { status: 400 });
  }

  const getVerdictColor = (verdictType: string) => {
    switch (verdictType) {
      case "true":
      case "mostly_true":
        return "#AEFFD9"; // Green
      case "mixed_evidence":
        return "#C5C8FF"; // Purple
      case "mostly_false":
      case "false":
        return "#FFBAD8"; // Pink
      default:
        return "#C5C8FF"; // Purple for insufficient_evidence
    }
  };

  const verdictColor = getVerdictColor(verdict);
  const verdictText = verdict.toUpperCase().replace(/_/g, " ");

  // Truncate statement if too long
  const truncatedStatement =
    statement.length > 80 ? statement.substring(0, 80) + "..." : statement;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1a1a",
          backgroundImage: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
          position: "relative",
          padding: "40px",
        }}
      >
        {/* Background elements */}
        <div
          style={{
            position: "absolute",
            top: "50px",
            right: "50px",
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "50px",
            left: "50px",
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
          }}
        />

        {/* Brand */}
        <div
          style={{
            position: "absolute",
            top: "40px",
            left: "40px",
            fontSize: "48px",
            fontWeight: "bold",
            color: "#ffffff",
          }}
        >
          Shit-Check
        </div>

        {/* Verdict */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: "bold",
            color: verdictColor,
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          {verdictText}
        </div>

        {/* Confidence */}
        <div
          style={{
            fontSize: "36px",
            color: "#ffffff",
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          {confidence}% confidence
        </div>

        {/* Statement */}
        <div
          style={{
            fontSize: "32px",
            color: "#ffffff",
            textAlign: "center",
            maxWidth: "1000px",
            lineHeight: "1.4",
            marginBottom: "40px",
          }}
        >
          "{truncatedStatement}"
        </div>

        {/* Bottom text */}
        <div
          style={{
            fontSize: "24px",
            color: "#888888",
            textAlign: "center",
            position: "absolute",
            bottom: "40px",
          }}
        >
          Check the full analysis with peer-reviewed papers
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
