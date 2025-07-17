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
  summary: z.string(),
  reasoning: z.string(),
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

  // Count verdicts
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

**Statement to fact-check:** "${statement}"

**Pre-evaluation Results Summary:**
- Total papers analyzed: ${papersWithPreEval.length}
- Papers supporting the statement: ${verdictCounts.supports}
- Papers contradicting the statement: ${verdictCounts.contradicts}
- Papers with neutral stance: ${verdictCounts.neutral}

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
Based on the pre-evaluation results above, provide a final verdict on the statement. Consider:
1. The balance of supporting vs contradicting evidence
2. The quality and credibility of the sources (citation count, journal reputation)
3. The strength and specificity of the evidence provided
4. Whether the evidence is sufficient to make a definitive conclusion

**Final Verdict Categories:**
- "true": Strong, consistent evidence from multiple high-quality sources supports the statement
- "mostly_true": Most evidence supports the statement, with minor contradictions or limitations
- "mixed_evidence": Evidence is divided, with substantial support and contradiction
- "mostly_false": Most evidence contradicts the statement, with minor supporting evidence
- "false": Strong, consistent evidence from multiple sources contradicts the statement
- "insufficient_evidence": Not enough relevant or reliable evidence to make a determination

**Confidence Score (0-100):**
- 90-100: Very high confidence based on strong, consistent evidence
- 70-89: High confidence with some limitations
- 50-69: Moderate confidence with mixed or limited evidence
- 30-49: Low confidence due to insufficient or conflicting evidence
- 0-29: Very low confidence, insufficient evidence

Provide a comprehensive analysis that explains your reasoning and highlights key findings.

Respond in this JSON format:
{
  "final_verdict": "true" | "mostly_true" | "mixed_evidence" | "mostly_false" | "false" | "insufficient_evidence",
  "confidence_score": 85,
  "summary": "A clear, concise summary of the final verdict (2-3 sentences)",
  "reasoning": "Detailed explanation of how you arrived at this verdict, considering the evidence quality and balance",
  "supporting_evidence_count": 5,
  "contradicting_evidence_count": 2,
  "neutral_evidence_count": 3,
  "key_findings": ["Key finding 1", "Key finding 2", "Key finding 3"],
  "limitations": ["Limitation 1", "Limitation 2"]
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
