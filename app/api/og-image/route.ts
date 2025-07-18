import { NextRequest, NextResponse } from "next/server";
import { createCanvas } from "canvas";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statement = searchParams.get("statement");
    const verdict = searchParams.get("verdict");
    const confidence = searchParams.get("confidence");

    if (!statement || !verdict || !confidence) {
      return new NextResponse("Missing required parameters", { status: 400 });
    }

  // Create canvas
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new NextResponse("Failed to create canvas context", { status: 500 });
  }

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#1a1a1a");
  gradient.addColorStop(1, "#2d2d2d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add some geometric elements
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  ctx.beginPath();
  ctx.arc(width - 100, 100, 150, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(100, height - 100, 100, 0, Math.PI * 2);
  ctx.fill();

  // Brand text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 48px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Shit-Check", 60, 80);

  // Verdict with color coding
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
  ctx.fillStyle = verdictColor;
  ctx.font = "bold 72px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";

  const verdictText = verdict.toUpperCase().replace(/_/g, " ");
  ctx.fillText(verdictText, width / 2, 200);

  // Confidence score
  ctx.fillStyle = "#ffffff";
  ctx.font = "36px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${confidence}% confidence`, width / 2, 260);

  // Statement (truncated if too long)
  ctx.fillStyle = "#ffffff";
  ctx.font = "32px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";

  const maxWidth = width - 120;
  const words = statement.split(" ");
  let lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  // Limit to 3 lines
  if (lines.length > 3) {
    lines = lines.slice(0, 2);
    lines.push("...");
  }

  const lineHeight = 40;
  const startY = 350;

  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, startY + index * lineHeight);
  });

  // Bottom text
  ctx.fillStyle = "#888888";
  ctx.font = "24px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    "Check the full analysis with peer-reviewed papers",
    width / 2,
    height - 60
  );

  // Convert canvas to buffer
  const buffer = canvas.toBuffer("image/png");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new NextResponse("Failed to generate image", { status: 500 });
  }
}
