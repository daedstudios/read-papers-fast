import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { XMLParser } from "fast-xml-parser";

export const runtime = "nodejs";

// Initialize XML parser
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "_",
});

// Schema for generating an arXiv query string and keywords
const QuerySchema = z.object({
  query: z.string().describe("arXiv API query string for the research topic"),
  keywords: z
    .array(z.string())
    .describe("List of keywords used to generate the query"),
});

export async function POST(req: NextRequest) {
  const { topic } = await req.json();

  if (!topic) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }

  // Prompt to generate a smart arXiv query string and keywords
  const prompt = `
You are an expert in arXiv API search queries. Given the following research topic, generate:
1. The 3-5 most relevant keywords for searching arXiv.
2. A robust arXiv API search query string using those keywords, combining them with OR or AND, and parentheses as appropriate for the topic, but do not over-complicate. Use only the 'all:' field for each keyword or phrase.

IMPORTANT: Use AND operator when two subjects are combined in a topic (e.g. "machine learning and agriculture", "climate change and LLMs" etc). Use a maximum of 1 AND operator in the query string.

Respond strictly in this JSON format:
{
  "query": "...arxiv query string...",
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

    // Use the generated query string directly in the arXiv API call
    const arxivApiUrl = `http://export.arxiv.org/api/query?search_query=${encodeURIComponent(
      queryString
    )}&start=0&max_results=500`;

    console.log("Calling arXiv API with URL:", arxivApiUrl);

    // Fetch papers from arXiv
    let response = await fetch(arxivApiUrl);
    let xmlData = await response.text();
    let result = parser.parse(xmlData);

    // Format the response
    let entries = result.feed.entry || [];

    // Fallback: if no results and query contains AND, try with OR instead
    if (entries.length === 0 && queryString.includes("AND")) {
      const fallbackQuery = queryString.replace(/AND/g, "OR");
      const fallbackUrl = `http://export.arxiv.org/api/query?search_query=${encodeURIComponent(
        fallbackQuery
      )}&start=0&max_results=100`;
      console.log("Fallback arXiv API with URL:", fallbackUrl);
      response = await fetch(fallbackUrl);
      xmlData = await response.text();
      result = parser.parse(xmlData);
      entries = result.feed.entry || [];
    }

    const formattedResults = Array.isArray(entries)
      ? entries.map((entry: any) => ({
          id: entry.id,
          title: entry.title,
          summary: entry.summary,
          published: entry.published,
          updated: entry.updated,
          authors: Array.isArray(entry.author)
            ? entry.author.map((author: any) => author.name)
            : [entry.author?.name],
          doi: entry.doi,
          primaryCategory: entry["_primary-category"],
          categories: Array.isArray(entry.category)
            ? entry.category.map((cat: any) => cat._term)
            : [entry.category?._term],
          links: Array.isArray(entry.link)
            ? entry.link.map((link: any) => ({
                href: link._href,
                type: link._type,
                rel: link._rel,
              }))
            : [entry.link].map((link: any) => ({
                href: link._href,
                type: link._type,
                rel: link._rel,
              })),
        }))
      : [];

    console.log("Formatted Results:", formattedResults);

    return NextResponse.json({
      query: queryString,
      keywords: keywords,
      totalResults: entries.length,
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
