import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const FactCheckPreEvalSchema = z.object({
  verdict: z.enum(["supports", "contradicts", "neutral"]),
  summary: z.string(),
  snippet: z.string(),
});

export async function POST(req: NextRequest) {
  const { statement, abstract, title } = await req.json();

  if (!statement || !abstract) {
    return NextResponse.json(
      { error: "Missing statement or abstract" },
      { status: 400 }
    );
  }

  const prompt = `
You are an expert scientific fact-checker. Given a user statement and a paper abstract, classify whether the abstract SUPPORTS, CONTRADICTS, or is NEUTRAL regarding the statement. Be strict: only mark as supports or contradicts if the abstract clearly takes a position. Otherwise, mark as neutral.

Statement: "${statement}"
${
  title
    ? `Paper title: "${title}"
`
    : ""
}Abstract: "${abstract}"

Respond in this JSON format:
{
  "verdict": "supports" | "contradicts" | "neutral",
  "summary": "A 1-2 sentence explanation of why the abstract supports, contradicts, or is neutral regarding the statement.",
  "snippet": "The single most relevant sentence or phrase from the abstract that best supports your verdict. This should be a direct quote from the abstract, not a paraphrase. If no clear snippet exists, return an empty string."
}
`;

  try {
    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001"),
      schema: FactCheckPreEvalSchema,
      prompt,
    });

    return NextResponse.json(object);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to pre-evaluate fact-check", message: String(error) },
      { status: 500 }
    );
  }
}
