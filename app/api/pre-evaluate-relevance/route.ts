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
- "relevant": The paper's main focus is directly and substantially about the topic. It must be directly citable in the thesis.
- "not relevant": The paper is partially about the topic, or the connection is moderate but not central.
- "definetly not relevant": The paper is only tangentially or superficially related as in it mentions part of the topic, or not about the topic at all.

Be strict. Only assign "relevant" if the paper is a strong match and provides a direct and substantial contribution to the topic.

Examples:
- If the topic is "climate change and agriculture" and the paper is about "climate change with deep learning," mark as not relevant.
- If the topic is "climate change and agriculture" and the paper is about "effects of climate change on crop yields," mark as relevant.


Research topic: "${topic}"
Paper title: "${title}"
Paper abstract: "${summary}"

Respond in this JSON format:
{
  "relevance": "relevant" | "somewhat relevant" | "not relevant",
  "summary": "Short explanation of why it is or is not relevant"
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
