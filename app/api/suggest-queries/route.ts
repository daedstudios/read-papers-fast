import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

export const runtime = "nodejs";

// Schema for generating suggested queries
const SuggestedQueriesSchema = z.object({
  suggestedQueries: z.array(z.object({
    query: z.string().describe("A related research query"),
    reasoning: z.string().describe("Brief explanation of why this query is related"),
    category: z.string().describe("Category or field this query belongs to")
  })).describe("Array of 5-8 related research queries")
});

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Generate suggested queries using Gemini AI
    const prompt = `
You are an expert research assistant. Given a research query, generate 5 related research queries that researchers might be interested in exploring.

Original Query: "${query}"

Generate related queries that:
1. **Expand the scope**: Broader aspects of the same topic
2. **Narrow the focus**: More specific aspects or applications
3. **Adjacent fields**: Related disciplines or methodologies
4. **Comparative studies**: Comparison with other approaches/theories
5. **Practical applications**: Real-world implementations or case studies
6. **Temporal aspects**: Historical development or future trends
7. **Methodological variations**: Different research approaches to the same topic

Make sure the queries are:
- Academically relevant and searchable
- Diverse in scope and perspective
- Clear and specific enough to yield good search results
- Between 5-15 words each
- Different from but related to the original query

Examples:
Original: "Climate change impacts on agriculture"
Suggested:
- "Sustainable farming practices for climate resilience"
- "Economic effects of climate change on food security"
- "Adaptation strategies for agricultural systems in warming climates"
- "Carbon sequestration in agricultural soils"
- "Impact of extreme weather events on crop yields"
- "Technology solutions for climate-smart agriculture"

Generate suggestions for: "${query}"
`;

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001"),
      schema: SuggestedQueriesSchema,
      prompt: prompt,
    });

    return NextResponse.json({
      originalQuery: query,
      suggestions: object.suggestedQueries
    });

  } catch (error) {
    console.error("Error generating suggested queries:", error);
    return NextResponse.json(
      {
        error: "Failed to generate suggested queries",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
