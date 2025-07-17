import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const FinalVerdictSchema = z.object({
  final_verdict: z.enum([
    "true",
    "mostly_true",
    "mixed_evidence",
    "mostly_false",
    "false",
    "insufficient_evidence",
  ]),
  confidence_score: z.number().min(0).max(100),
  explanation: z.string(),
  supporting_evidence_count: z.number(),
  contradicting_evidence_count: z.number(),
  neutral_evidence_count: z.number(),
  key_findings: z.array(z.string()),
  limitations: z.array(z.string()),
});

type PreEvaluationResult = {
  verdict: "supports" | "contradicts" | "neutral";
  summary: string;
  snippet: string;
};

type PaperData = {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  cited_by_count?: number;
  journal_name?: string;
  publisher?: string;
  pre_evaluation: PreEvaluationResult;
};

export async function POST(req: NextRequest) {
  const { statement, papers } = await req.json();

  if (!statement || !papers || !Array.isArray(papers)) {
    return NextResponse.json(
      { error: "Missing statement or papers array" },
      { status: 400 }
    );
  }

  // Filter out papers without pre-evaluation
  const papersWithPreEval = papers.filter(
    (paper: PaperData) =>
      paper.pre_evaluation &&
      paper.pre_evaluation.verdict &&
      paper.pre_evaluation.summary
  );

  if (papersWithPreEval.length === 0) {
    return NextResponse.json(
      { error: "No papers with pre-evaluation data found" },
      { status: 400 }
    );
  }

  // Count verdicts (excluding neutral)
  const verdictCounts = {
    supports: papersWithPreEval.filter(
      (p) => p.pre_evaluation.verdict === "supports"
    ).length,
    contradicts: papersWithPreEval.filter(
      (p) => p.pre_evaluation.verdict === "contradicts"
    ).length,
    neutral: papersWithPreEval.filter(
      (p) => p.pre_evaluation.verdict === "neutral"
    ).length,
  };

  // Calculate total relevant papers (excluding neutral)
  const totalRelevantPapers =
    verdictCounts.supports + verdictCounts.contradicts;

  // Create a summary of all pre-evaluations
  const preEvalSummary = papersWithPreEval.map((paper: PaperData) => ({
    title: paper.title,
    authors: paper.authors.join(", "),
    year: new Date(paper.published).getFullYear(),
    citations: paper.cited_by_count || 0,
    journal: paper.journal_name || "Unknown",
    verdict: paper.pre_evaluation.verdict,
    summary: paper.pre_evaluation.summary,
    snippet: paper.pre_evaluation.snippet,
  }));

  const prompt = `
You are an expert scientific fact-checker tasked with providing a final verdict on a statement based on multiple academic paper evaluations.

Your tone should be **clear, direct, and slightly sarcastic**—the kind of response that calmly shuts down nonsense with evidence and a hint of “you should’ve known better.” Keep the writing sharp, readable, and punchy. No slang, no filler. Just facts with a bit of attitude.

**Statement to fact-check:** "${statement}"

**Pre-evaluation Results Summary:**
- Total papers analyzed: ${papersWithPreEval.length}
- Papers supporting the statement: ${verdictCounts.supports}
- Papers contradicting the statement: ${verdictCounts.contradicts}
- Papers with neutral stance: ${
    verdictCounts.neutral
  } (excluded from verdict calculation)
- **Relevant papers for verdict: ${totalRelevantPapers}** (supporting + contradicting only)

**Detailed Paper Evaluations:**
${preEvalSummary
  .map(
    (paper, index) => `
${index + 1}. "${paper.title}" (${paper.authors}, ${paper.year})
   - Citations: ${paper.citations}
   - Journal: ${paper.journal}
   - Pre-evaluation verdict: ${paper.verdict.toUpperCase()}
   - Summary: ${paper.summary}
   - Key snippet: "${paper.snippet}"
`
  )
  .join("\n")}

**Your Task:**
Based on the pre-evaluation results above, provide a final verdict on the statement. **Focus ONLY on supporting vs contradicting evidence - ignore neutral papers in your verdict calculation.**

Consider:
1. The balance of supporting vs contradicting evidence (${
    verdictCounts.supports
  } supporting vs ${verdictCounts.contradicts} contradicting)
2. The quality and credibility of the sources (citation count, journal reputation)
3. The strength and specificity of the evidence provided
4. Whether the evidence is sufficient to make a definitive conclusion

**Note:** Neutral papers (${
    verdictCounts.neutral
  }) are excluded from the verdict calculation as they don't take a clear position.

**Final Verdict Categories:**
- "true": Strong, consistent evidence from multiple high-quality sources supports the statement
- "mostly_true": Most evidence supports the statement, with minor contradictions or limitations
- "mixed_evidence": Evidence is divided, with substantial support and contradiction
- "mostly_false": Most evidence contradicts the statement, with minor supporting evidence
- "false": Strong, consistent evidence from multiple sources contradicts the statement
- "insufficient_evidence": Not enough relevant or reliable evidence to make a determination

**Confidence Score (0-100):**
- 90-100: Very high confidence based on strong, consistent evidence from supporting/contradicting papers
- 70-89: High confidence with some limitations
- 50-69: Moderate confidence with mixed or limited evidence
- 30-49: Low confidence due to insufficient or conflicting evidence
- 0-29: Very low confidence, insufficient evidence

**Base your confidence on the ${totalRelevantPapers} relevant papers (supporting + contradicting), not the total ${
    papersWithPreEval.length
  } papers.**

Respond in this JSON format:
{
  "final_verdict": "true" | "mostly_true" | "mixed_evidence" | "mostly_false" | "false" | "insufficient_evidence",
  "confidence_score": 85,
  "explanation": "Write a clear, punchy 3-4 sentence explanation that combines the verdict with the reasoning. Start with the bottom line, then explain why. Be direct and slightly sarcastic if the claim is nonsense. No academic jargon—just straight talk about what the evidence actually says.\n\nAt the end of your explanation, include a short, readable bullet list of the 2-3 most important key findings from the research., 
  "supporting_evidence_count": 5,
  "contradicting_evidence_count": 2,
  "neutral_evidence_count": 3,
  "key_findings": ["Highlight 2-3 specific findings that matter most. Focus on clarity and punch."],
  "limitations": ["Point out any real weaknesses in the research—small sample sizes, unclear data, outdated studies, etc."]
}
`;

  try {
    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001"),
      schema: FinalVerdictSchema,
      prompt,
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("Error generating final verdict:", error);
    return NextResponse.json(
      { error: "Failed to generate final verdict", message: String(error) },
      { status: 500 }
    );
  }
}
