import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const SectionSummariesSchema = z.object({
  sections: z.array(
    z.object({
      heading: z.string(),
      summary: z.string(),
    })
  ),
});

export const POST = async (req: Request) => {
  try {
    const formData = await req.formData();
    const file = formData.get("pdf") as File;

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "PDF file not found" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: SectionSummariesSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert research assistant. Read the following academic paper and extract a list of only the main headings. For each, write a short, plain-text summary (2-3 sentences) that captures the key idea or topic of that section. Return ONLY a JSON object with a 'sections' field, which is an array of objects with 'heading' and 'summary' fields. Do not include any extra commentary or formatting outside the JSON object.`,
            },
            {
              type: "file",
              data: buffer,
              mimeType: "application/pdf",
            },
          ],
        },
      ],
      maxTokens: 3000,
    });

    const { sections } = result.object;
    return NextResponse.json({ sections });
  } catch (error) {
    console.error("Error generating section summaries:", error);
    return NextResponse.json(
      { error: "Failed to generate section summaries" },
      { status: 500 }
    );
  }
};
