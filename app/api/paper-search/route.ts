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

// Schema for generating keywords
const KeywordSchema = z.object({
  keywords: z
    .array(z.string())
    .length(5)
    .describe("5 keywords for the research topic"),
});

export async function POST(req: NextRequest) {
  const { topic } = await req.json();

  if (!topic) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }

  // Prompt to generate keywords from the user's topic
  const prompt = `Based on the following research topic, generate 5 relevant keywords that can be used to search for academic papers.
  
  Topic: "${topic}"
  
  Please provide the keywords in a JSON object.`;

  try {
    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001"),
      schema: KeywordSchema,
      prompt: prompt,
    });

    const keywords = object.keywords;

    // Build the search query for arXiv using the generated keywords
    // Format: (all:keyword1 OR all:keyword2 OR all:keyword3 OR all:keyword4 OR all:keyword5)
    const arxivQuery = keywords
      .map((keyword) => `all:${encodeURIComponent(keyword.trim())}`)
      .join(" OR ");

    // Call arXiv API with the generated keywords
    const arxivApiUrl = `http://export.arxiv.org/api/query?search_query=${arxivQuery}&start=0&max_results=10`;

    console.log("Calling arXiv API with URL:", arxivApiUrl);

    // Fetch papers from arXiv
    const response = await fetch(arxivApiUrl);

    if (!response.ok) {
      throw new Error(`ArXiv API responded with status: ${response.status}`);
    }

    const xmlData = await response.text();
    const result = parser.parse(xmlData);

    // Format the response
    const entries = result.feed.entry || [];
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
