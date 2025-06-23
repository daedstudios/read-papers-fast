import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "_",
});

export async function GET(req: NextRequest) {
  try {
    // Get search query from URL parameters
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("query") || "all:*";
    const start = searchParams.get("start") || "0";
    const maxResults = searchParams.get("max_results") || "10";

    // Construct arXiv API URL
    const arxivUrl = `http://export.arxiv.org/api/query?search_query=${encodeURIComponent(
      query
    )}&start=${start}&max_results=${maxResults}`;

    // Fetch data from arXiv
    const response = await fetch(arxivUrl);

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

    return NextResponse.json({
      totalResults: entries.length,
      papers: formattedResults,
    });
  } catch (error: any) {
    console.error("Error fetching from arXiv:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch papers" },
      { status: 500 }
    );
  }
}
