import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

export const runtime = "nodejs";

const RelevanceSchema = z.object({
  score: z.number().min(0).max(1),
  summary: z.string(),
  relevant_sections: z
    .array(
      z.object({
        section_heading: z.string().optional().nullable(),
        text_snippet: z.string(),
        page: z.number().optional().nullable(),
      })
    )
    .optional()
    .default([]),
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
  const prompt = `Given the following research topic: "${topic}", evaluate how relevant the attached PDF paper is to this topic.
In addition to scoring and summarizing the relevance, identify and analyze the most relevant sections or paragraphs within the paper that support your evaluation only if it is relevant to the topic.

Please follow these guidelines strictly:
1. Score the relevance from 0.01 (not relevant) to 1.00 (highly relevant). Do not round up numbers.
2. Provide a 1-2 sentence explanation of the relevance.
3. If the paper is relevant, include sections or snippets that specifically relate to the topic.
4. If section headings or page numbers are not available, you can omit them.
5. Format your response exactly as shown in the JSON template below.

Respond strictly in the following JSON format:
{
  "score": 0.75,
  "summary": "Clear explanation of relevance in 1-2 sentences",
  "relevant_sections": [
    {
      "section_heading": "Introduction",
      "text_snippet": "Exact quote or close paraphrase of relevant text",
      "page": 2
    }
  ]
}

Note: Do not include any explanations outside the JSON structure. The response must be valid JSON that can be parsed programmatically.`;

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
      temperature: 0.2, // Lower temperature for more consistent, structured output
    });

    console.log("API result:", result.object);

    // Additional validation to ensure the response is properly structured
    if (!result.object || !result.object.score || !result.object.summary) {
      throw new Error("Invalid response structure from API");
    }

    return NextResponse.json({ relevance: result.object });
  } catch (error) {
    console.error("Gemini API error:", error);

    // More specific error handling
    let errorMessage = "Unknown error occurred";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for specific error types
      if (
        errorMessage.includes("No object generated") ||
        errorMessage.includes("response did not match")
      ) {
        errorMessage =
          "The AI could not generate a properly structured response. Please try again with a clearer topic or a different PDF.";
        statusCode = 422; // Unprocessable Entity
      }
    }

    return NextResponse.json(
      {
        error: "Gemini API error",
        message: errorMessage,
      },
      { status: statusCode }
    );
  }
}
