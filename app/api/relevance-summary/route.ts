import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import pdf from "pdf-parse";

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

  // Convert Blob to Buffer
  const arrayBuffer = await (file as Blob).arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Extract text from PDF
  let pdfText = "";
  try {
    const data = await pdf(buffer);
    pdfText = data.text;
  } catch (err) {
    return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
  }

  // Call Gemini using the same pattern as other routes
  const prompt = `Given the following topic: "${topic}" and the following paper text, evaluate how relevant the paper is to the topic. Respond with a JSON object with a 'score' (0-1) and a 'summary' (1-2 sentences):\n\n${pdfText}`;

  try {
    const result = await generateObject({
      model: google("gemini-2.0-flash-001", { structuredOutputs: false }),
      schema: RelevanceSchema,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }],
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
