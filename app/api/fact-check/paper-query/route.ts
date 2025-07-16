import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

export const runtime = "nodejs";

// Zod schema for structured analysis output
const PaperAnalysisSchema = z.object({
  support_level: z.enum([
    "strongly_supports", 
    "supports", 
    "neutral", 
    "contradicts", 
    "strongly_contradicts", 
    "insufficient_data"
  ]).describe("How this paper relates to the statement"),
  confidence: z.number().min(0).max(100).describe("Confidence in this analysis (0-100%)"),
  summary: z.string().describe("Clear summary of how the paper relates to the statement"),
  relevant_sections: z.array(z.object({
    section_title: z.string().optional().describe("Section title if available"),
    text_snippet: z.string().describe("Exact text from the paper"),
    page_number: z.number().optional().describe("Page number if identifiable"),
    reasoning: z.string().describe("Why this section is relevant to the statement")
  })).describe("Specific sections that support or contradict the statement"),
  key_findings: z.array(z.string()).describe("Main findings relevant to the statement"),
  limitations: z.array(z.string()).describe("Study limitations that might affect conclusions")
});

export async function POST(req: NextRequest) {
  let paperTitle = "Unknown";
  try {
    const body = await req.json();
    const { pdfUrl, statement, paperTitle: title, abstract, authors, journal } = body;
    paperTitle = title || "Unknown";

    if (!statement) {
      return NextResponse.json(
        { error: "Statement is required" },
        { status: 400 }
      );
    }

    if (!pdfUrl && !abstract) {
      return NextResponse.json(
        { error: "Either PDF URL or abstract is required" },
        { status: 400 }
      );
    }

    console.log(`Analyzing paper: ${paperTitle || "Unknown"}`);
    if (pdfUrl) {
      console.log(`PDF URL: ${pdfUrl}`);
    } else {
      console.log(`Using abstract for analysis`);
    }

    // Create the analysis prompt
    const analysisPrompt = `
You are an expert academic researcher and fact-checker. Analyze this research paper to determine whether it supports or contradicts the following statement:

**Statement to fact-check:** "${statement}"

**Paper Title:** ${paperTitle || "Unknown"}
${authors ? `**Authors:** ${Array.isArray(authors) ? authors.join(", ") : authors}` : ""}
${journal ? `**Journal:** ${journal}` : ""}

Your task is to:

1. **Determine Support Level**: Classify how this paper relates to the statement:
   - "strongly_supports": The paper provides strong, direct evidence supporting the statement
   - "supports": The paper provides evidence that generally supports the statement
   - "neutral": The paper is relevant but doesn't clearly support or contradict the statement
   - "contradicts": The paper provides evidence that contradicts the statement
   - "strongly_contradicts": The paper provides strong evidence directly contradicting the statement
   - "insufficient_data": The paper doesn't contain enough relevant information

2. **Extract Relevant Sections**: Find specific sections, quotes, or findings that are most relevant to the statement. Include:
   - Exact text snippets from the paper ${pdfUrl ? "" : "(from the abstract)"}
   - Section titles if available
   - Page numbers if possible
   - Your reasoning for why this section is relevant

3. **Provide Analysis**: Give a clear summary of how the paper relates to the statement

4. **Assess Confidence**: Rate your confidence in this analysis (0-100%)
   ${!pdfUrl ? "Note: This analysis is based only on the abstract, so confidence should reflect this limitation." : ""}

5. **Key Findings**: List the main findings from the paper relevant to the statement

6. **Limitations**: Note any limitations in the study that might affect the conclusions
   ${!pdfUrl ? "Include the limitation that this analysis is based only on the abstract, not the full paper." : ""}

${!pdfUrl ? `**IMPORTANT**: This analysis is based only on the paper's abstract since the full PDF is not accessible. The abstract is:

"${abstract}"

Please provide your analysis based on this abstract alone.` : ""}

Please be thorough but concise. Focus on evidence-based analysis and cite specific parts of the paper${!pdfUrl ? " (abstract)" : ""}.

Respond with a structured analysis that clearly explains whether this paper supports or contradicts the statement.
`;

    let result;
    let analysisMethod = "unknown";
    
    // Only attempt PDF analysis if pdfUrl is provided
    if (pdfUrl) {
      try {
        // First try: Direct URL approach (faster if it works)
        console.log("Attempting direct URL access to Gemini...");
        result = await generateObject({
          model: google('gemini-1.5-flash'),
          schema: PaperAnalysisSchema,
          maxTokens: 8192,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: analysisPrompt,
                },
                {
                  type: 'file',
                  data: pdfUrl, // Pass URL directly to Gemini
                  mimeType: 'application/pdf',
                },
              ],
            },
          ],
        });
        console.log("Direct URL access successful!");
        analysisMethod = "pdf_direct_url";
        
      } catch (directUrlError: any) {
        // If direct URL fails with 403 or similar, try fetching manually
        if (directUrlError?.statusCode === 403 || directUrlError?.message?.includes('403') || directUrlError?.message?.includes('Forbidden')) {
          console.log("Direct URL failed with 403, attempting manual fetch with headers...");
          
          try {
            // Fetch the PDF with headers that mimic a browser
            const pdfResponse = await fetch(pdfUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/pdf,application/octet-stream,*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
              },
            });

            if (!pdfResponse.ok) {
              throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
            }

            // Get PDF as buffer
            const pdfBuffer = await pdfResponse.arrayBuffer();
            const pdfData = new Uint8Array(pdfBuffer);
            
            console.log("Manual fetch successful, sending binary data to Gemini...");
            
            // Call Gemini with the binary PDF data
            result = await generateObject({
              model: google('gemini-1.5-flash'),
              schema: PaperAnalysisSchema,
              maxTokens: 8192,
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: analysisPrompt,
                    },
                    {
                      type: 'file',
                      data: pdfData, // Pass binary data to Gemini
                      mimeType: 'application/pdf',
                    },
                  ],
                },
              ],
            });
            
            console.log("Binary data analysis successful!");
            analysisMethod = "pdf_manual_fetch";
            
          } catch (fetchError) {
            console.error("Manual fetch also failed:", fetchError);
            
            // Fall back to abstract-based analysis if available
            if (abstract) {
              console.log("Falling back to abstract-based analysis...");
              result = await generateObject({
                model: google('gemini-1.5-flash'),
                schema: PaperAnalysisSchema,
                maxTokens: 4096,
                messages: [
                  {
                    role: 'user',
                    content: analysisPrompt,
                  },
                ],
              });
              analysisMethod = "abstract_fallback";
              console.log("Abstract-based analysis successful!");
            } else {
              return NextResponse.json({
                error: "Unable to access PDF and no abstract provided for fallback analysis",
                paperId: paperTitle,
                analysis: null,
                details: {
                  directUrlError: directUrlError.message,
                  fetchError: fetchError instanceof Error ? fetchError.message : String(fetchError)
                }
              });
            }
          }
        } else {
          // Some other error with PDF access, try abstract fallback if available
          if (abstract) {
            console.log("PDF access failed with non-403 error, falling back to abstract...");
            result = await generateObject({
              model: google('gemini-1.5-flash'),
              schema: PaperAnalysisSchema,
              maxTokens: 4096,
              messages: [
                {
                  role: 'user',
                  content: analysisPrompt,
                },
              ],
            });
            analysisMethod = "abstract_fallback";
            console.log("Abstract-based analysis successful!");
          } else {
            // Re-throw the original error if no abstract available
            throw directUrlError;
          }
        }
      }
    } else {
      // No PDF URL provided, use abstract-based analysis
      console.log("No PDF URL provided, using abstract-based analysis...");
      result = await generateObject({
        model: google('gemini-1.5-flash'),
        schema: PaperAnalysisSchema,
        maxTokens: 4096,
        messages: [
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
      });
      analysisMethod = "abstract_only";
      console.log("Abstract-based analysis successful!");
    }

    return NextResponse.json({
      paperId: paperTitle,
      pdfUrl: pdfUrl || null,
      statement: statement,
      analysisMethod: analysisMethod,
      analysis: {
        ...result.object,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("Error analyzing paper:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze paper",
        message: error instanceof Error ? error.message : String(error),
        paperId: paperTitle
      },
      { status: 500 }
    );
  }
}
