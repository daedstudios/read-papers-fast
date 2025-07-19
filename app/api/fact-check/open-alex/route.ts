import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { preEvaluateAbstract } from "@/lib/factCheckUtils";

export const runtime = "nodejs";

// Schema for fact-check keyword generation
const FactCheckQuerySchema = z.object({
  query: z
    .string()
    .describe("OpenAlex API search query string for the fact-check statement"),
  keywords: z
    .array(z.string())
    .describe(
      "List of keywords extracted from the statement for academic paper search"
    ),
  researchAreas: z
    .array(z.string())
    .describe("Specific research areas or fields relevant to the statement"),
  searchTerms: z
    .array(z.string())
    .describe("Alternative search terms and synonyms to broaden the search"),
});

// Function to reconstruct abstract from inverted index
function reconstructAbstract(abstractInvertedIndex: any): string {
  if (!abstractInvertedIndex || typeof abstractInvertedIndex !== "object") {
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
  const sortedPositions = Object.keys(words)
    .map(Number)
    .sort((a, b) => a - b);
  const reconstructed = sortedPositions.map((pos) => words[pos]).join(" ");

  return reconstructed || "Abstract available but could not be reconstructed";
}

export async function POST(req: NextRequest) {
  const { statement } = await req.json();

  if (!statement) {
    return NextResponse.json(
      { error: "Statement is required" },
      { status: 400 }
    );
  }

  // Prompt to generate keywords and search terms for fact-checking
  const prompt = `
You are an expert in academic research and fact-checking. Given a statement that needs to be fact-checked, generate appropriate search terms and keywords to find relevant academic papers.

Your task is to:

1. **Extract Core Concepts**: Identify the main claims, topics, and concepts in the statement
2. **Generate Keywords**: Create 5-8 specific keywords that would help find academic papers related to this statement
3. **Identify Research Areas**: Determine which academic fields or research areas would study this topic
4. **Create Search Terms**: Generate alternative terms, synonyms, and related phrases that researchers might use

**Guidelines:**
- Focus on academic and scientific terminology
- Include both broad and specific terms
- Consider medical, scientific, or technical terminology if relevant
- Think about how researchers would describe this topic in papers
- Include methodological terms if applicable (e.g., "meta-analysis", "randomized controlled trial", "longitudinal study")

**Examples:**

Statement: "Vitamin D deficiency is linked to increased risk of depression"
→ keywords: ["vitamin D deficiency", "depression", "mental health", "mood disorders", "vitamin D supplementation"]
→ researchAreas: ["nutrition", "psychiatry", "endocrinology", "mental health", "preventive medicine"]
→ searchTerms: ["25-hydroxyvitamin D", "seasonal affective disorder", "major depressive disorder", "micronutrient deficiency", "vitamin D3"]

Statement: "Climate change is causing more frequent extreme weather events"
→ keywords: ["climate change", "extreme weather", "global warming", "weather patterns", "climate variability"]
→ researchAreas: ["climatology", "meteorology", "environmental science", "atmospheric science"]
→ searchTerms: ["anthropogenic climate change", "extreme precipitation", "heat waves", "temperature anomalies", "climate attribution"]

Statement: "Social media use increases anxiety in teenagers"
→ keywords: ["social media", "anxiety", "teenagers", "adolescents", "mental health"]
→ researchAreas: ["psychology", "digital health", "adolescent development", "social psychology"]
→ searchTerms: ["social networking sites", "screen time", "digital media", "generalized anxiety disorder", "adolescent mental health"]

Create a comprehensive search strategy for: "${statement}"

Output format:
{
  "query": "primary search query for OpenAlex",
  "keywords": ["list of 5-8 main keywords"],
  "researchAreas": ["relevant academic fields"],
  "searchTerms": ["alternative and technical terms"]
}
`;

  try {
    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001"),
      schema: FactCheckQuerySchema,
      prompt: prompt,
    });

    const queryString = object.query;
    const keywords = object.keywords;
    const researchAreas = object.researchAreas;
    const searchTerms = object.searchTerms;

    // Step 2: Generate optimized OpenAlex search query using AI
    const queryOptimizationPrompt = `
You are an expert in OpenAlex API search optimization. Your task is to create the most effective search query using Boolean operators (AND, OR, NOT) and proper syntax.

Given these keywords and search terms, create an optimized OpenAlex search query that will find the most relevant academic papers:

**Original Statement:** "${statement}"
**Keywords:** ${JSON.stringify(keywords)}
**Research Areas:** ${JSON.stringify(researchAreas)}
**Search Terms:** ${JSON.stringify(searchTerms)}

**OpenAlex Search Rules:**
1. Use AND to combine essential concepts that must appear together
2. Use OR to group synonyms and alternative terms
3. Use "exact phrases" in quotes for specific terminology
4. Use parentheses for proper grouping and precedence
5. Avoid too many OR terms (max 6-8 per group)
6. Focus on the most important 2-3 core concepts with AND
7. Group related synonyms with OR within parentheses

**Examples of good queries:**
- ("vitamin D deficiency" OR "25-hydroxyvitamin D") AND (depression OR "mood disorders" OR "mental health")
- ("climate change" OR "global warming") AND ("extreme weather" OR "weather patterns" OR "climate variability")
- ("social media" OR "social networking") AND (anxiety OR "mental health") AND (teenagers OR adolescents)

**Guidelines:**
- Start with the most specific terms
- Use exact phrases for technical terminology
- Group synonyms logically with OR
- Connect main concepts with AND
- Keep the query focused (2-3 main concept groups max)
- Prioritize terms that researchers would actually use in papers

Create the optimal search query for OpenAlex that will find the most relevant academic papers for fact-checking this statement.

Return only the search query string, nothing else.`;

    const queryOptimization = await generateObject({
      model: google("gemini-2.0-flash-001"),
      schema: z.object({
        optimizedQuery: z
          .string()
          .describe(
            "The optimized OpenAlex search query using Boolean operators"
          ),
      }),
      prompt: queryOptimizationPrompt,
    });

    const finalQuery = queryOptimization.object.optimizedQuery;

    // Build OpenAlex API URL
    const openAlexApiUrl = `https://api.openalex.org/works?search=${encodeURIComponent(
      finalQuery
    )}&per_page=100&sort=relevance_score:desc&filter=open_access.oa_status:gold`;

    console.log("Optimized query:", finalQuery);
    console.log("Fact-checking with OpenAlex API:", openAlexApiUrl);

    // Fetch papers from OpenAlex
    let response = await fetch(openAlexApiUrl);
    let data = await response.json();
    let results = data.results || [];

    // Fallback: if no results with optimized query, try simpler approaches
    if (results.length === 0) {
      console.log(
        "No results with optimized query, trying keyword OR fallback..."
      );
      const keywordQuery = keywords.slice(0, 5).join(" OR ");
      const fallbackUrl = `https://api.openalex.org/works?search=${encodeURIComponent(
        keywordQuery
      )}&per_page=50&sort=relevance_score:desc`;

      console.log("Fallback search with keywords OR:", fallbackUrl);
      response = await fetch(fallbackUrl);
      data = await response.json();
      results = data.results || [];
    }

    // Second fallback: try focused AND search
    if (results.length === 0) {
      console.log("Still no results, trying focused AND search...");
      const focusedQuery = keywords.slice(0, 3).join(" AND ");
      const secondFallbackUrl = `https://api.openalex.org/works?search=${encodeURIComponent(
        focusedQuery
      )}&per_page=50&sort=relevance_score:desc`;

      console.log("Fallback search with focused keywords:", secondFallbackUrl);
      response = await fetch(secondFallbackUrl);
      data = await response.json();
      results = data.results || [];
    }

    // Third fallback: try just the original simple query
    if (results.length === 0) {
      console.log("Final fallback with original query:", queryString);
      const simpleUrl = `https://api.openalex.org/works?search=${encodeURIComponent(
        queryString
      )}&per_page=50&sort=relevance_score:desc`;

      response = await fetch(simpleUrl);
      data = await response.json();
      results = data.results || [];
    }

    // Format the response
    const formattedResults = results.map((work: any) => ({
      id: work.id,
      title: work.title || work.display_name,
      summary:
        work.abstract ||
        (work.abstract_inverted_index
          ? reconstructAbstract(work.abstract_inverted_index)
          : "No abstract available"),
      published: work.publication_date,
      authors:
        work.authorships
          ?.map((authorship: any) => authorship.author?.display_name)
          .filter(Boolean) || [],
      doi: work.doi,
      primaryCategory: work.primary_topic?.display_name || work.type,
      categories: work.topics?.map((topic: any) => topic.display_name) || [],
      links: [
        {
          href: work.primary_location?.landing_page_url || work.id,
          type: "text/html",
          rel: "alternate",
        },
        ...(work.primary_location?.pdf_url
          ? [
              {
                href: work.primary_location.pdf_url,
                type: "application/pdf",
                rel: "alternate",
              },
            ]
          : []),
        ...(work.open_access?.oa_url
          ? [
              {
                href: work.open_access.oa_url,
                type: "application/pdf",
                rel: "alternate",
              },
            ]
          : []),
      ],
      relevance_score: work.relevance_score,
      publication_year: work.publication_year,
      open_access: work.open_access,
      cited_by_count: work.cited_by_count,
      host_venue: work.host_venue,
      journal_name: work.primary_location?.source?.display_name,
      publisher: work.primary_location?.source?.host_organization_name,
      referenced_works: work.referenced_works || [],
      referenced_works_count: work.referenced_works_count || 0,
      related_works: work.related_works || [],
    }));

    // Pre-evaluate each paper's abstract using the shared utility
    async function preEvaluatePaper(paper: any): Promise<any> {
      if (!paper.summary || paper.summary === "No abstract available") {
        // console.log(`[PreEval] Skipping paper (no abstract): ${paper.title}`);
        return { verdict: "neutral", summary: "No abstract available." };
      }
      try {
        const result = await preEvaluateAbstract(
          statement,
          paper.summary,
          paper.title
        );
        // console.log(`[PreEval] Success:`, result);
        return result;
      } catch (e) {
        console.error(`[PreEval] Exception:`, e);
        return { verdict: "neutral", summary: "Pre-evaluation error." };
      }
    }

    // Limit concurrency to 5 at a time
    async function mapWithConcurrencyLimit<T, R>(
      arr: T[],
      fn: (item: T, idx: number, arr: T[]) => Promise<R>,
      limit = 5
    ): Promise<R[]> {
      const ret: R[] = [];
      let i = 0;
      async function next() {
        if (i >= arr.length) return;
        const idx = i++;
        ret[idx] = await fn(arr[idx], idx, arr);
        return next();
      }
      await Promise.all(Array(Math.min(limit, arr.length)).fill(0).map(next));
      return ret;
    }

    const preEvaluations = await mapWithConcurrencyLimit<any, any>(
      formattedResults,
      preEvaluatePaper,
      5
    );

    // Attach pre-evaluation to each paper
    const papersWithPreEval = formattedResults.map((paper: any, i: number) => ({
      ...paper,
      pre_evaluation: preEvaluations[i],
    }));

    return NextResponse.json({
      statement: statement,
      originalQuery: queryString,
      optimizedQuery: finalQuery,
      keywords: keywords,
      searchTerms: searchTerms,
      researchAreas: researchAreas,
      totalResults: data.meta?.count || results.length,
      papers: papersWithPreEval,
    });
  } catch (error) {
    console.error("Error in fact-check:", error);
    return NextResponse.json(
      {
        error: "Failed to fact-check statement",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
