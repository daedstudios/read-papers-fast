import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const RelevanceSummarySchema = z.object({
  summary: z.string(),
  keywords: z.array(z.string()),
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

    // Read the PDF file as an ArrayBuffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Call Gemini to generate a relevance summary in Markdown bullet points and relevant keywords
    const result = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: RelevanceSummarySchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `“You’re an expert research assistant. Given the abstract and introduction of the uploaded academic paper, provide a clear and concise Relevance Summary to help the reader decide whether this paper is useful for their topic.

Include:
	•	What this paper is about (in simple language, so a 10 year old can understand)
	•	The main problem it addresses
	•	The field and subfield it fits into (e.g., machine learning → NLP → Transformers)
	•	What kind of person should read this paper (e.g., ‘useful for someone working on neural translation models’ or ‘not relevant if you’re focused on hardware optimization’)

Be objective, short (150–200 words), and avoid repeating the abstract.”`,
            },
            {
              type: "file",
              data: buffer,
              mimeType: "application/pdf",
            },
          ],
        },
      ],
      maxTokens: 1500,
    });

    const { summary, keywords } = result.object;
    return NextResponse.json({ summary, keywords });
  } catch (error) {
    console.error("Error generating relevance summary:", error);
    return NextResponse.json(
      { error: "Failed to generate relevance summary" },
      { status: 500 }
    );
  }
};
