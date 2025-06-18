import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

export const runtime = "nodejs";

const RelevanceSchema = z.object({
  score: z.number().min(0).max(1),
  summary: z.string(),
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  const topic = formData.get("topic");

  if (!file || typeof topic !== "string") {
    return NextResponse.json(
      { error: "Missing file or topic" },
      { status: 400 }
    );
  }

  const arrayBuffer = await (file as Blob).arrayBuffer();

  // Send the PDF file directly to Gemini
  const prompt = `Given the following topic: "${topic}", evaluate how relevant the attached PDF paper is to the topic. Respond with a JSON object with a 'score' (0-1) and a 'summary' (1-2 sentences).`;

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
      maxTokens: 2048,
    });

    return NextResponse.json({ relevance: result.object });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Gemini API error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
