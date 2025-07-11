import { NextRequest, NextResponse } from "next/server";
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

type OpenAlexAuthor = {
  id: string;
  display_name: string;
  display_name_alternatives: string[];
  relevance_score: number;
  works_count: number;
  cited_by_count: number;
  summary_stats: {
    h_index: number;
    i10_index: number;
    "2yr_mean_citedness": number;
  };
  affiliations: Array<{
    institution: {
      id: string;
      display_name: string;
      country_code: string;
      type: string;
    };
    years: number[];
  }>;
  last_known_institutions: Array<{
    id: string;
    display_name: string;
    country_code: string;
  }>;
  topics: Array<{
    id: string;
    display_name: string;
    count: number;
    subfield: {
      display_name: string;
    };
    field: {
      display_name: string;
    };
    domain: {
      display_name: string;
    };
  }>;
};

type OpenAlexResponse = {
  meta: {
    count: number;
    db_response_time_ms: number;
    page: number;
    per_page: number;
  };
  results: OpenAlexAuthor[];
};

export async function POST(request: NextRequest) {
  try {
    const { authorName, topic } = await request.json();

    if (!authorName || !topic) {
      return NextResponse.json(
        { error: "Author name and topic are required" },
        { status: 400 }
      );
    }

    // Step 1: Search for authors using OpenAlex API
    const openAlexUrl = `https://api.openalex.org/authors?search=${encodeURIComponent(authorName)}`;
    
    const openAlexResponse = await fetch(openAlexUrl);
    if (!openAlexResponse.ok) {
      throw new Error(`OpenAlex API error: ${openAlexResponse.status}`);
    }

    const authorData: OpenAlexResponse = await openAlexResponse.json();

    if (!authorData.results || authorData.results.length === 0) {
      return NextResponse.json(
        { error: "No authors found with that name" },
        { status: 404 }
      );
    }

    // Step 2: Filter and prepare author data for Gemini analysis
    // Filter for active, impactful researchers and take up to 10 for better analysis
    const filteredAuthors = authorData.results
      .filter(author => 
        author.works_count > 10 && // Has substantial publication record
        author.summary_stats.h_index > 5 && // Has decent academic impact
        author.topics.length > 0 // Has research topics data
      )
      .slice(0, 10); // Take up to 10 quality candidates instead of arbitrary 5

    // If filtering removes too many authors, fall back to top authors by relevance
    const authorsToAnalyze = filteredAuthors.length >= 3 ? filteredAuthors : authorData.results.slice(0, 8);

    const authorsForAnalysis = authorsToAnalyze.map((author) => ({
      id: author.id,
      name: author.display_name,
      alternativeNames: author.display_name_alternatives,
      openalexRelevanceScore: author.relevance_score, // Include OpenAlex's own relevance scoring
      worksCount: author.works_count,
      citedByCount: author.cited_by_count,
      hIndex: author.summary_stats.h_index,
      i10Index: author.summary_stats.i10_index,
      recentCitedness: author.summary_stats["2yr_mean_citedness"],
      currentInstitutions: author.last_known_institutions.map(inst => inst.display_name),
      researchTopics: author.topics.slice(0, 8).map(topic => ({ // Increased from 10 to 8 to save tokens while keeping good coverage
        name: topic.display_name,
        count: topic.count,
        field: topic.field.display_name,
        domain: topic.domain.display_name
      })),
      // Simplified affiliation history to save tokens
      recentAffiliations: author.affiliations
        .filter(aff => aff.years.some(year => year >= 2020)) // Only recent affiliations
        .slice(0, 3)
        .map(aff => ({
          institution: aff.institution.display_name,
          country: aff.institution.country_code,
          recentYears: aff.years.filter(year => year >= 2020)
        }))
    }));

    // Step 3: Use Gemini to analyze and find the most relevant author
    const analysisSchema = z.object({
      mostRelevantAuthorId: z.string(),
      authorName: z.string(),
      topicRelevanceScore: z.number().min(1).max(10).describe("How relevant this author is to the research topic on a scale of 1-10"),
      reasoning: z.string(),
      keyTopics: z.array(z.string()),
      alternativeAuthors: z.array(z.object({
        id: z.string(),
        name: z.string(),
        reason: z.string()
      }))
    });

    const prompt = `
You are an academic research assistant. I need to find the most relevant author for a specific research topic from a list of candidates.

Research Topic: "${topic}"

Candidate Authors (filtered for quality and relevance):
${JSON.stringify(authorsForAnalysis, null, 2)}

Please analyze each author and determine which one is most relevant to the research topic. Consider:

1. **Topic Alignment**: How well their research topics align with "${topic}"
2. **OpenAlex Relevance**: Their openalexRelevanceScore (higher = more relevant to search)
3. **Academic Impact**: Citation count, h-index, and recent research activity
4. **Research Depth**: Count of papers in related topics and field expertise
5. **Current Activity**: Recent citedness and active institutional affiliations

IMPORTANT: 
- OpenAlex has already ranked these authors by relevance to the search term "${authorName}"
- Use this as a starting point but prioritize topic relevance to "${topic}" over name matching
- For topicRelevanceScore: Rate 1-10 how well THIS AUTHOR'S RESEARCH matches the topic "${topic}" (NOT their OpenAlex relevance score)
  - 1-3: Minimal relevance to the topic
  - 4-6: Some relevance, overlapping fields
  - 7-8: Strong relevance, clear topic alignment
  - 9-10: Perfect match, core expertise in this exact topic

Select the most relevant author and provide detailed analysis.`;

    const result = await generateObject({
      model: google('gemini-1.5-flash'),
      prompt: prompt,
      schema: analysisSchema,
    });

    const analysisResult = result.object;

    // Step 4: Get full details of the selected author
    const selectedAuthor = authorData.results.find(
      author => author.id === analysisResult.mostRelevantAuthorId
    );

    if (!selectedAuthor) {
      throw new Error("Selected author not found in original results");
    }

    return NextResponse.json({
      success: true,
      selectedAuthor: {
        id: selectedAuthor.id,
        name: selectedAuthor.display_name,
        alternativeNames: selectedAuthor.display_name_alternatives,
        openalexRelevanceScore: selectedAuthor.relevance_score,
        worksCount: selectedAuthor.works_count,
        citedByCount: selectedAuthor.cited_by_count,
        hIndex: selectedAuthor.summary_stats.h_index,
        currentInstitutions: selectedAuthor.last_known_institutions,
        topResearchTopics: selectedAuthor.topics.slice(0, 5)
      },
      analysis: analysisResult,
      totalCandidates: authorData.results.length,
      filteredCandidates: authorsToAnalyze.length,
      searchMetadata: {
        searchTerm: authorName,
        topic: topic,
        topicRelevanceScore: analysisResult.topicRelevanceScore,
        responseTime: authorData.meta.db_response_time_ms
      }
    });

  } catch (error) {
    console.error("Error in find-author API:", error);
    return NextResponse.json(
      { 
        error: "Failed to find relevant author",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
