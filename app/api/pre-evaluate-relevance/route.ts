import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const PreEvalSchema = z.object({
  relevant: z.boolean(),
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
Given the following research topic and paper, decide if the paper is DIRECTLY and SUBSTANTIALLY about the topic, based on its title and abstract only. 
Only mark as relevant if the paper's main focus is clearly and strongly related to the topic. 
If the connection is weak, tangential, or only briefly mentioned, mark as not relevant.

DO NOT MARK A PAPER AS RELEVANT IF IT IS ONLY ABOUT THE TOPIC IN A SUPERFICIAL WAY.

Examples:
- If the topic is "climate change and agriculture" and the paper is about "climate change with deep learning," mark as not relevant.
- If the topic is "climate change and agriculture" and the paper is about "effects of climate change on crop yields," mark as relevant.

Research topic: "${topic}"
Paper title: "${title}"
Paper abstract: "${summary}"

Respond in this JSON format:
{
  "relevant": true, // or false
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
