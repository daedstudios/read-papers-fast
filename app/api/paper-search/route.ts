import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

export const runtime = "nodejs";

// Schema for generating keywords
const KeywordSchema = z.object({
  keywords: z
    .array(z.string())
    .length(5)
    .describe("5 keywords for the research topic"),
});

export async function POST(req: NextRequest) {
  const { topic } = await req.json();

  if (!topic) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }

  // Prompt to generate keywords from the user's topic
  const prompt = `Based on the following research topic, generate 5 relevant keywords that can be used to search for academic papers. The goal is to not just find papers that are related to the topic, but to find papers that are actually relevant to the topic. The keywords should be specific and not too broad, as they will be used to search for papers on arXiv.
  
  Topic: "${topic}"
  
  Please provide the keywords in a JSON object.`;

  try {
    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001"),
      schema: KeywordSchema,
      prompt: prompt,
    });

    return NextResponse.json({ keywords: object.keywords });
  } catch (error) {
    console.error("Error generating keywords:", error);
    return NextResponse.json(
      {
        error: "Failed to generate keywords",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
