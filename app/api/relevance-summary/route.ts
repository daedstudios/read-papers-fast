import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

export const runtime = "nodejs";

const RelevanceSchema = z.object({
  score: z.number().min(0).max(1),
  summary: z.string(),
  relevant_sections: z.array(
    z.object({
      section_heading: z.string().optional(),
      text_snippet: z.string(),
      page: z.number().optional(),
    })
  ),
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  const topic = formData.get("topic");
  const pdfUrl = formData.get("pdfUrl");

  if ((!file && !pdfUrl) || typeof topic !== "string") {
    return NextResponse.json(
      { error: "Missing file/URL or topic" },
      { status: 400 }
    );
  }

  let arrayBuffer: ArrayBuffer;

  // Handle PDF from URL if provided
  if (pdfUrl && typeof pdfUrl === "string") {
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch PDF from URL: ${response.statusText}` },
          { status: 400 }
        );
      }
      arrayBuffer = await response.arrayBuffer();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid URL or could not download PDF" },
        { status: 400 }
      );
    }
  } else if (file) {
    // Handle uploaded file
    arrayBuffer = await (file as Blob).arrayBuffer();
  } else {
    return NextResponse.json(
      { error: "No valid PDF source provided" },
      { status: 400 }
    );
  }

  // Send the PDF file directly to Gemini
  const prompt = `Given the following research topic: ”${topic}”, evaluate how relevant the attached PDF paper is to this topic.
In addition to scoring and summarizing the relevance, identify and analyze the most relevant sections or paragraphs within the paper that support your evaluation only if it is relevant to the topic.

Respond strictly in the following JSON format:
{
  "score": 0.01, // a number from 0.01 (not relevant) to 1.00 (highly relevant),
  "summary": "1–2 sentence explanation of the relevance",
  "relevant_sections": [
    {
      "section_heading": "optional heading if available",
      "text_snippet": "relevant paragraph or snippet",
      "page": 3 // if page info is known
    }
  ]
}`;

  try {
    const result = await generateObject({
      model: google("gemini-2.0-flash-001", { structuredOutputs: false }),
      schema: RelevanceSchema,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "file", data: arrayBuffer, mimeType: "application/pdf" },
          ],
        },
      ],
      maxTokens: 10000,
    });
    console.log("API result:", result.object);
    return NextResponse.json({ relevance: result.object });
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      {
        error: "Gemini API error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
