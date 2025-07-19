import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { prisma } from "@/lib/SingletonPrismaClient";

export async function POST(req: NextRequest) {
  try {
    const { messages, shareableId, directData }: { 
      messages: Array<{ role: "user" | "assistant" | "system"; content: string }>; 
      shareableId?: string;
      directData?: any;
    } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Missing messages" },
        { status: 400 }
      );
    }

    let contextData;

    // If shareableId is provided, fetch from database
    if (shareableId) {
      const factCheckSession = await prisma.factCheckSession.findUnique({
        where: { shareableId },
        include: {
          papers: {
            include: {
              analysis: true,
            },
          },
        },
      });

      if (!factCheckSession) {
        return NextResponse.json(
          { error: "Fact-check session not found" },
          { status: 404 }
        );
      }

      // Prepare context from the fact-check session
      contextData = {
        statement: factCheckSession.statement,
        keywords: factCheckSession.keywords,
        finalVerdict: factCheckSession.finalVerdict,
        papersCount: factCheckSession.papers.length,
        papers: factCheckSession.papers.map(paper => ({
          title: paper.title,
          authors: paper.authors,
          summary: paper.summary,
          published: paper.published,
          journalName: paper.journalName,
          relevanceScore: paper.relevanceScore,
          citedByCount: paper.citedByCount,
          analysis: paper.analysis ? {
            supportLevel: paper.analysis.supportLevel,
            confidence: paper.analysis.confidence,
            summary: paper.analysis.summary,
            keyFindings: paper.analysis.keyFindings,
            limitations: paper.analysis.limitations,
          } : null,
        })),
      };
    } else if (directData) {
      // Use directly passed data
      contextData = directData;
    } else {
      return NextResponse.json(
        { error: "Either shareableId or directData must be provided" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert research assistant specializing in scientific fact-checking and academic paper analysis. You have access to a comprehensive fact-check session with the following context:

**Original Statement Being Fact-Checked:** "${contextData.statement}"

**Keywords:** ${contextData.keywords.join(", ")}

**Final Verdict:** ${contextData.finalVerdict || "Not yet determined"}

**Available Research Papers (${contextData.papersCount} total):**
${contextData.papers.map((paper: any, index: number) => `
${index + 1}. "${paper.title}"
   - Authors: ${paper.authors.join(", ")}
   - Published: ${paper.published}
   - Journal: ${paper.journalName || "Unknown"}
   - Citations: ${paper.citedByCount || "Unknown"}
   - Relevance Score: ${paper.relevanceScore || "Unknown"}
   ${paper.summary ? `- Summary: ${paper.summary}` : ""}
   ${paper.analysis ? `
   - Analysis Results:
     * Support Level: ${paper.analysis.supportLevel}
     * Confidence: ${paper.analysis.confidence}%
     * Summary: ${paper.analysis.summary}
     * Key Findings: ${paper.analysis.keyFindings.join("; ")}
     * Limitations: ${paper.analysis.limitations.join("; ")}` : ""}
`).join("\n")}

**Your Role:**
- Answer questions about this fact-check session with clarity and precision
- Provide insights based on the available research papers and analysis
- Explain complex scientific concepts in accessible language
- Reference specific papers and findings when relevant
- Maintain objectivity and acknowledge limitations in the data
- Be helpful but direct, with a slight edge when addressing misconceptions

**Guidelines:**
- Always ground your responses in the available data
- Reference specific papers by title when making claims
- Acknowledge when information is limited or unavailable
- Provide balanced perspectives when evidence is mixed
- Use a clear, professional tone with a hint of personality`;

    const result = streamText({
      model: google("gemini-2.0-flash-001"),
      system: systemPrompt,
      messages,
      maxTokens: 1000,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in chat interface:", error);
    return NextResponse.json(
      { error: "Failed to process chat request", message: String(error) },
      { status: 500 }
    );
  }
}
