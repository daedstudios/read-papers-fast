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
  const prompt = `You are given a research thesis topic: "${topic}" and a PDF paper. Your task is to critically and strictly evaluate whether this paper is genuinely relevant to the thesis — meaning it should be useful as a direct source or citation for the user writing on this topic.

Relevance Criteria:
- A paper is only relevant if it provides arguments, data, insights, or theoretical frameworks that directly support or contribute to the thesis topic.
- Merely mentioning the topic or adjacent keywords is NOT sufficient.
- Being "somewhat related" is NOT enough for a high score.
- You are helping the user narrow down truly useful papers — not just thematically adjacent ones.

Instructions:
1. **Score**: Provide a decimal score from 0.01 to 1.00. Use the full range. Be extremely strict:
   - 0.01–0.30 = Not relevant
   - 0.31–0.70 = Weak/partial relevance (likely not useful)
   - 0.71–0.90 = Strong relevance (contains useful material, might be cited)
   - 0.91–1.00 = Directly usable for the thesis (should definitely be cited)

   NEVER assign above 0.80 unless the paper **specifically contributes** to answering or supporting the thesis.

2. **Summary**: In 1–2 sentences, clearly explain why the paper is or isn’t useful for the topic. Be direct — don't hedge.

3. **Relevant Sections**:
   - Only include this if score ≥ 0.40.
   - Extract only paragraphs that are genuinely useful for the thesis. Not vague mentions.
   - Include heading (if available), quote/paraphrase, and page.

Do NOT round up scores or include filler content. If in doubt, rate lower.

Respond strictly in the following JSON format:
{
  "score": 0.00,
  "summary": "Your 1–2 sentence explanation here.",
  "relevant_sections": [
    {
      "section_heading": "Optional heading",
      "text_snippet": "Relevant snippet of text here.",
      "page": 2
    }
  ]
}

Your response must ONLY contain the JSON object. No explanations or formatting outside of it.`;

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
      maxTokens: 100000,
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
