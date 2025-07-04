import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

export const runtime = "nodejs";

const RelevanceSchema = z.object({
  score: z.number().min(0).max(1),
  title: z.string(),
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

  const prompt = `You are given a research thesis topic: "${topic}" and a PDF paper. Your task is to critically evaluate whether this paper is genuinely relevant to the thesis — meaning it should provide material the user would directly cite in their writing.

First, extract the title of the paper from the PDF content. Look for the main title, usually found in the first few pages or in headers.

Strict Relevance Criteria:
- A paper is relevant **only** if it offers **specific arguments, data, case studies, or theoretical frameworks** that directly support or inform the thesis topic.
- Mere keyword overlaps, vague mentions, or being in a related field is **not enough**.
- Your goal is to help the user eliminate noise and keep only **truly useful** papers.

Examples of relevance:
- The paper presents empirical findings or models that support the thesis argument.
- The paper discusses core theories, controversies, or frameworks that the thesis builds on.

Examples of non-relevance:
- The paper briefly mentions the topic without contributing meaningful content.
- It is about a similar field but answers a different research question.

Instructions:
1. **Title**: Extract the main title of the paper from the PDF content.
2. **Score**: Provide a decimal score between 0.01 and 1.00. Use the full range:
   - 0.01–0.30 = Not relevant (cannot be cited)
   - 0.31–0.70 = Weak or indirect relevance (likely not worth citing)
   - 0.71–0.90 = Strong relevance (useful background or supportive content)
   - 0.91–1.00 = Direct match (definitely cite this)

3. **Summary**: In 1–2 sentences, clearly explain *why* the paper is or is not relevant. Be direct. No hedging.

Before assigning a score:
- Ask: Would this paper be cited in the thesis?
- If no, score must be < 0.40.
- If yes, ask: Does it contain specific data, case studies, or theoretical framing that supports the topic?
    - If weakly: 0.40–0.70
    - If strong but not central: 0.71–0.90
    - If directly on-point: 0.91–1.00


Respond strictly in the following JSON format:

{
  "score": 0.00,
  "title": "Extracted paper title here",
  "summary": "Your 1–2 sentence explanation here.",
  "relevant_sections": [
    {
      "section_heading": "Optional heading",
      "text_snippet": "Relevant snippet of text here.",
      "page": 2
    }
  ]
}

Here is an example of a relevant paper with the user input topic of "Climate change and its effects on global agriculture":
{
 "score": 0.95,
  "title": "The Historical Impact of Anthropogenic Climate Change on Global Agricultural Productivity",
  "summary": "This paper is highly relevant to the topic of climate change and its effects on global agriculture. It provides a robust econometric model of weather effects on global agricultural total factor productivity (TFP) and combine this model with counterfactual climate scenarios to evaluate impacts of past climate trends on TFP. Our baseline model indicates that anthropogenic climate change has reduced global agricultural TFP by about 21% since 1961, a slowdown that is equivalent to losing the last 9 years of productivity growth. The effect is substantially more severe (a reduction of ~30-33%) in warmer regions such as Africa and Latin America and the Caribbean. We also find that global agriculture has grown more vulnerable to ongoing climate change.",
  "relevant_sections": [
    { "heading": "Introduction", "text": "..." },
    { "heading": "Results", "text": "..." }
  ]
}

Here is an example of a NOT relevant paper with the user input topic of "Climate change and its effects on global agriculture":
{
  "score": 0.04,
  "title": "Agricultural Economics and Innovation in the Inca Empire",
  "summary": "This paper discusses agricultural innovations in the Inca Empire, focusing on terrace farming. While it touches on sustainable practices, it does not directly address the effects of modern climate change on global agriculture, making it tangentially relevant but not citable for the specified thesis.",
  "relevant_sections": []
}

Return ONLY the JSON. Do not explain your reasoning outside of it.`;

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
