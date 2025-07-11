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
    .describe("List of keywords including author-related terms if author is mentioned"),
  hasAuthorMention: z.boolean().describe("Whether the topic mentions a specific author name"),
  authorName: z.string().optional().describe("The author name mentioned in the topic, if any"),
  topicWithoutAuthor: z.string().describe("The research topic with author name removed, focusing on the subject matter"),
  authorKeywords: z.array(z.string()).optional().describe("Keywords specifically related to the author's research areas, if author is mentioned")
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
You are an expert in OpenAlex API search query generation.

Given a research topic, do the following:

1. **Detect Author Mentions**: Determine if the topic mentions a specific author name (e.g., "Einstein's relativity theory", "papers by Roger Penrose", "Stephen Hawking black holes").
2. **Extract Author Name**: If an author is mentioned, extract their name clearly.
3. **Separate Topic**: Remove the author reference and focus on the core research subject.
4. **Generate Comprehensive Keywords**: 
   - For the research subject: 3-5 most relevant keywords
   - If author mentioned: Add 2-3 author-related keywords (their research areas, famous theories, etc.)
   - Include synonyms, subfields, and related terminology
   - Total: 5-8 keywords that represent both the topic AND the author's research context
5. **Create Query**: Generate a robust OpenAlex API query using Boolean operators for the research topic:
   - Use **AND** to combine key concepts or limit the scope (e.g. "climate change" AND "food security").
   - Use **OR** for related terms or synonyms (e.g. "global warming" OR "climate change").
   - Use **NOT** to explicitly filter out unrelated or unwanted topics.
   - Use parentheses and **double quotation marks** for exact phrases and operator precedence.

Use a maximum of 2 AND clauses to keep queries focused. Avoid wildcard operators.

📌 Examples:
- Input: "Einstein's work on relativity" 
  → hasAuthorMention: true, authorName: "Einstein", topicWithoutAuthor: "relativity theory"
  → keywords: ["relativity theory", "general relativity", "spacetime", "theoretical physics", "Einstein's theories"]
  → authorKeywords: ["Einstein's theories", "theoretical physics", "spacetime"]
  → query: "relativity theory"

- Input: "papers by Roger Penrose on black holes" 
  → hasAuthorMention: true, authorName: "Roger Penrose", topicWithoutAuthor: "black holes"
  → keywords: ["black holes", "singularities", "general relativity", "Penrose diagrams", "mathematical physics"]
  → authorKeywords: ["Penrose diagrams", "mathematical physics", "singularities"]
  → query: "black holes"

- Input: "climate change impacts" 
  → hasAuthorMention: false, topicWithoutAuthor: "climate change impacts"
  → keywords: ["climate change", "global warming", "environmental impact", "sustainability", "carbon emissions"]
  → query: "climate change impacts"

Output format:
{
  "query": "…OpenAlex query string for the research topic…",
  "keywords": ["comprehensive list including both topic and author-related terms"],
  "hasAuthorMention": true/false,
  "authorName": "Author Name" (if mentioned),
  "topicWithoutAuthor": "research topic without author reference",
  "authorKeywords": ["author-specific research terms"] (if author mentioned)
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
    const hasAuthorMention = object.hasAuthorMention;
    const authorName = object.authorName;
    const topicWithoutAuthor = object.topicWithoutAuthor;

    let authorId: string | null = null;
    let authorInfo: any = null;

    // Step 2: If author is mentioned, find the most relevant author
    if (hasAuthorMention && authorName) {
      try {
        console.log(`Finding author: ${authorName} for topic: ${topicWithoutAuthor}`);
        
        // Call the find-author API internally
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
          
        const findAuthorResponse = await fetch(`${baseUrl}/api/find-author`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            authorName: authorName,
            topic: topicWithoutAuthor
          })
        });

        if (findAuthorResponse.ok) {
          const authorResult = await findAuthorResponse.json();
          if (authorResult.success && authorResult.selectedAuthor) {
            authorId = authorResult.selectedAuthor.id;
            authorInfo = authorResult.selectedAuthor;
            console.log(`Found relevant author: ${authorInfo.name} (${authorId})`);
          }
        } else {
          console.warn('Find-author API failed, proceeding without author filter');
        }
      } catch (error) {
        console.error('Error calling find-author API:', error);
        // Continue without author filter if the API call fails
      }
    }

    // Step 3: Build OpenAlex API URL with optional author filter
    let openAlexApiUrl: string;
    
    if (authorId) {
      // Extract just the ID part from the full OpenAlex URL (e.g., "A5014894861" from "https://openalex.org/A5014894861")
      const cleanAuthorId = authorId.replace('https://openalex.org/', '');
      
      // Use the title_and_abstract.search parameter with author filter
      openAlexApiUrl = `https://api.openalex.org/works?filter=title_and_abstract.search:${encodeURIComponent(queryString)},authorships.author.id:${cleanAuthorId}&per_page=100&sort=relevance_score:desc`;
      console.log(`Searching with author filter: ${authorInfo?.name}`);
    } else {
      // Standard search without author filter
      openAlexApiUrl = `https://api.openalex.org/works?search=${encodeURIComponent(
        queryString
      )}&per_page=100&sort=relevance_score:desc&filter=open_access.oa_status:gold`;
    }

    console.log("Calling OpenAlex API with URL:", openAlexApiUrl);

    // Fetch papers from OpenAlex
    let response = await fetch(openAlexApiUrl);
    let data = await response.json();

    // Format the response to match the expected structure
    let results = data.results || [];

    // Fallback: if no results and query contains AND, try with OR instead
    if (results.length === 0 && queryString.includes("AND")) {
      const fallbackQuery = queryString.replace(/AND/g, "OR");
      let fallbackUrl: string;
      
      if (authorId) {
        const cleanAuthorId = authorId.replace('https://openalex.org/', '');
        fallbackUrl = `https://api.openalex.org/works?filter=title_and_abstract.search:${encodeURIComponent(fallbackQuery)},authorships.author.id:${cleanAuthorId}&per_page=100&sort=relevance_score:desc`;
      } else {
        fallbackUrl = `https://api.openalex.org/works?search=${encodeURIComponent(
          fallbackQuery
        )}&per_page=100&sort=relevance_score:desc`;
      }
      
      console.log("Fallback OpenAlex API with URL:", fallbackUrl);
      response = await fetch(fallbackUrl);
      data = await response.json();
      results = data.results || [];
    }

    // If still no results with author filter, try without author as final fallback
    if (results.length === 0 && authorId) {
      console.log("No results with author filter, trying without author...");
      const fallbackUrl = `https://api.openalex.org/works?search=${encodeURIComponent(
        queryString
      )}&per_page=100&sort=relevance_score:desc&filter=open_access.oa_status:gold`;
      
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

    // console.log("Formatted Results:", formattedResults);

    return NextResponse.json({
      query: queryString,
      keywords: keywords,
      totalResults: data.meta?.count || results.length,
      papers: formattedResults,
      authorFilter: authorInfo ? {
        applied: true,
        author: {
          id: authorId,
          name: authorInfo.name,
          hIndex: authorInfo.hIndex,
          worksCount: authorInfo.worksCount,
          citedByCount: authorInfo.citedByCount
        },
        originalTopic: topic,
        topicWithoutAuthor: topicWithoutAuthor
      } : {
        applied: false,
        reason: hasAuthorMention ? "Author mentioned but not found" : "No author mentioned in topic"
      }
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
