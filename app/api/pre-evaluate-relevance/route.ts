import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const PreEvalSchema = z.object({
  relevance: z.enum(["relevant", "somewhat relevant", "not relevant"]),
  summary: z.string(),
});

export async function POST(req: NextRequest) {
  const { title, summary, topic } = await req.json();

  if (!title || !summary || !topic) {
    return NextResponse.json(
      { error: "Missing title, summary, or topic" },
      { status: 400 }
    );
  }

  const prompt = `
Given the following research topic and paper, classify the paper's relevance to the topic based on its title and abstract only.

Assign one of these categories:
- "relevant": The paper’s *core focus* is directly about the topic. It provides *central, citable arguments or findings* that clearly support a thesis on this topic. Do not mark a paper as "relevant" unless it would likely appear in the bibliography of a well-written thesis on this exact topic.
- "not relevant": The paper is partially or loosely connected to the topic, but the connection is not strong enough to cite in a focused thesis.
- "definitely not relevant": The paper is tangential, unrelated, or only shares keywords without meaningful thematic or analytical overlap.

Be strict. Only assign "relevant" if the paper makes a *clear, substantial contribution* to the topic.

Examples:
- If the topic is "climate change and agriculture" and the paper is about "climate change with deep learning," mark as not relevant.
- If the topic is "climate change and agriculture" and the paper is about "effects of climate change on crop yields," mark as relevant.

Research topic: "${topic}"
Paper title: "${title}"
Paper abstract: "${summary}"

Respond in this JSON format:
{
  "relevance": "relevant" | "not relevant" | "definitely not relevant",
  "summary": "In 1–2 sentences, clearly explain *why* the paper is or is not relevant. Be direct. Do not hedge. Only mark as relevant if it would *absolutely* be cited in a well-written thesis."
}
`;

  try {
    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001"),
      schema: PreEvalSchema,
      prompt,
    });

    return NextResponse.json(object);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to pre-evaluate relevance", message: String(error) },
      { status: 500 }
    );
  }
}
