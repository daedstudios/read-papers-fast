import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

export const runtime = "nodejs";

// Schema for deep PDF analysis
const DeepAnalysisSchema = z.object({
  support_level: z.enum([
    "strongly_supports",
    "supports", 
    "neutral",
    "contradicts",
    "strongly_contradicts",
    "insufficient_data"
  ]),
  confidence: z.number().min(0).max(1).describe("Confidence level from 0 to 1"),
  summary: z.string().describe("Detailed summary of the analysis"),
  relevant_sections: z.array(z.object({
    section_title: z.string().optional().describe("Title of the relevant section"),
    text_snippet: z.string().describe("Relevant text snippet from the PDF"),
    page_number: z.number().optional().describe("Page number where the snippet was found"),
    reasoning: z.string().describe("Why this section is relevant to the statement")
  })).describe("Array of relevant sections from the PDF"),
  key_findings: z.array(z.string()).describe("Key findings from the paper related to the statement"),
  limitations: z.array(z.string()).describe("Limitations mentioned in the paper that might affect the conclusion")
});

// Function to perform deep analysis with Gemini using PDF URL directly
async function analyzeWithGemini(statement: string, pdfUrl: string, title?: string): Promise<any> {
  try {
    const { object } = await generateObject({
      model: google("gemini-1.5-flash"),
      schema: DeepAnalysisSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an expert scientific fact-checker analyzing a complete research paper. Your task is to thoroughly evaluate whether the paper's content supports, contradicts, or is neutral regarding a given statement.

Statement to fact-check: "${statement}"
${title ? `Paper title: "${title}"` : ""}

Instructions:
1. Carefully read through the entire paper content from the PDF
2. Identify all sections relevant to the statement (introduction, methodology, results, discussion, conclusion)
3. Extract specific evidence, data, statistics, and findings that relate to the statement
4. Assess the strength of support or contradiction based on the evidence quality
5. Consider the paper's methodology, sample size, statistical significance, and limitations
6. Provide specific quotes and reasoning for your assessment

Respond with a detailed analysis including:
- Your overall verdict on support level (strongly_supports, supports, neutral, contradicts, strongly_contradicts, insufficient_data)
- Confidence score (0-1) based on evidence strength
- Comprehensive summary of findings
- Specific relevant sections with exact quotes and page numbers if available
- Key findings that support your verdict
- Any limitations that might affect the conclusion`
            },
            {
              type: 'file',
              data: pdfUrl,
              mimeType: 'application/pdf',
            },
          ],
        },
      ],
      maxTokens: 4000,
    });

    return object;
  } catch (error) {
    console.error('Error analyzing with Gemini:', error);
    throw new Error(`Analysis failed: ${error}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { statement, pdfUrl, title, paperId } = body;

    if (!statement || !pdfUrl) {
      return NextResponse.json(
        { error: "Missing required fields: statement and pdfUrl" },
        { status: 400 }
      );
    }

    console.log(`Starting deep analysis for paper: ${paperId}`);
    console.log(`PDF URL: ${pdfUrl}`);

    // Perform deep analysis with Gemini using PDF URL directly
    let analysis;
    try {
      analysis = await analyzeWithGemini(statement, pdfUrl, title);
      console.log(`Analysis completed for paper ${paperId}`);
    } catch (error) {
      console.error(`Gemini analysis failed for paper ${paperId}:`, error);
      return NextResponse.json(
        { 
          error: "Analysis failed",
          details: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 500 }
      );
    }

    // Return the analysis result
    return NextResponse.json({
      paperId,
      statement,
      pdfUrl,
      analysisMethod: "pdf_direct_analysis",
      analysis: {
        ...analysis,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Deep check API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}