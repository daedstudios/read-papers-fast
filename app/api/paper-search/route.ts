import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

export const runtime = "nodejs";

// Schema for generating an OpenAlex query string and keywords
const QuerySchema = z.object({
  query: z.string().describe("OpenAlex API search query string for the research topic"),
  keywords: z
    .array(z.string())
    .describe("List of keywords used to generate the query"),
});

// Function to reconstruct abstract from inverted index
function reconstructAbstract(abstractInvertedIndex: any): string {
  if (!abstractInvertedIndex || typeof abstractInvertedIndex !== 'object') {
    return "No abstract available";
  }

  const words: { [position: number]: string } = {};
  
  // Reconstruct the abstract from the inverted index
  for (const [word, positions] of Object.entries(abstractInvertedIndex)) {
    if (Array.isArray(positions)) {
      positions.forEach((pos: number) => {
        words[pos] = word;
      });
    }
  }

  // Sort by position and join
  const sortedPositions = Object.keys(words).map(Number).sort((a, b) => a - b);
  const reconstructed = sortedPositions.map(pos => words[pos]).join(' ');
  
  return reconstructed || "Abstract available but could not be reconstructed";
}

export async function POST(req: NextRequest) {
  const { topic } = await req.json();

  if (!topic) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }

  // Prompt to generate a smart OpenAlex query string and keywords
  const prompt = `
You are an expert in OpenAlex API search queries. Given the following research topic, generate:
1. The 3-5 most relevant keywords for searching OpenAlex.
2. A robust OpenAlex API search query string using those keywords, combining them with OR, AND, and NOT operators as appropriate. You can use parentheses for grouping and quotes for exact phrases.

IMPORTANT: Use AND operator when two subjects are combined in a topic (e.g. "machine learning and agriculture", "climate change and LLMs" etc). Use a maximum of 1 AND operator in the query string.

Examples of valid OpenAlex queries:
- machine learning AND agriculture
- "climate change" OR "global warming"
- (deep learning OR neural networks) AND computer vision
- artificial intelligence NOT "artificial general intelligence"

Respond strictly in this JSON format:
{
  "query": "...openalex query string...",
  "keywords": ["keyword1", "keyword2", ...]
}

Research topic: "${topic}"
`;

  try {
    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001"),
      schema: QuerySchema,
      prompt: prompt,
    });

    const queryString = object.query;
    const keywords = object.keywords;

    // Use the generated query string directly in the OpenAlex API call
    const openAlexApiUrl = `https://api.openalex.org/works?search=${encodeURIComponent(
      queryString
    )}&per_page=100&sort=relevance_score:desc`;

    console.log("Calling OpenAlex API with URL:", openAlexApiUrl);

    // Fetch papers from OpenAlex
    let response = await fetch(openAlexApiUrl);
    let data = await response.json();

    // Format the response to match the expected structure
    let results = data.results || [];

    // Fallback: if no results and query contains AND, try with OR instead
    if (results.length === 0 && queryString.includes("AND")) {
      const fallbackQuery = queryString.replace(/AND/g, "OR");
      const fallbackUrl = `https://api.openalex.org/works?search=${encodeURIComponent(
        fallbackQuery
      )}&per_page=100&sort=relevance_score:desc`;
      console.log("Fallback OpenAlex API with URL:", fallbackUrl);
      response = await fetch(fallbackUrl);
      data = await response.json();
      results = data.results || [];
    }

    const formattedResults = results.map((work: any) => ({
      id: work.id,
      title: work.title || work.display_name,
      summary: work.abstract || 
        (work.abstract_inverted_index ? reconstructAbstract(work.abstract_inverted_index) : "No abstract available"),
      published: work.publication_date,
      updated: work.publication_date,
      authors: work.authorships?.map((authorship: any) => 
        authorship.author?.display_name
      ).filter(Boolean) || [],
      doi: work.doi,
      primaryCategory: work.primary_topic?.display_name || work.type,
      categories: work.topics?.map((topic: any) => topic.display_name) || [],
      links: [
        {
          href: work.primary_location?.landing_page_url || work.id,
          type: "text/html",
          rel: "alternate",
        },
        ...(work.primary_location?.pdf_url ? [{
          href: work.primary_location.pdf_url,
          type: "application/pdf",
          rel: "alternate",
        }] : []),
        ...(work.open_access?.oa_url ? [{
          href: work.open_access.oa_url,
          type: "application/pdf",
          rel: "alternate",
        }] : []),
      ],
      relevance_score: work.relevance_score,
      publication_year: work.publication_year,
      open_access: work.open_access,
      cited_by_count: work.cited_by_count,
    }));

    console.log("Formatted Results:", formattedResults);

    return NextResponse.json({
      query: queryString,
      keywords: keywords,
      totalResults: data.meta?.count || results.length,
      papers: formattedResults,
    });
  } catch (error) {
    console.error("Error in paper-search:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve papers",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
