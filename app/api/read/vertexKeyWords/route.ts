import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/SingletonPrismaClient";

type AcronymType = {
  keyword: string;
  value: string;
  explanation: string;
};

export async function POST(req: Request) {
  const body = await req.json();
  const { id } = body;

  const paperMainStructure = await prisma.paperMainStructure.findUnique({
    where: {
      id: id,
    },
  });
  const pdfSource = paperMainStructure?.pdf_file_path || "";

  console.log("Extracting acronyms and full forms from document...");

  // Updated schema to match the actual response format with items array
  const AcronymSchema = z.object({
    items: z.array(
      z.object({
        keyword: z.string(),
        value: z.string(),
        explanation: z.string(),
      })
    ),
  });

  const result = await generateObject({
    model: google("gemini-2.0-flash-001", {
      structuredOutputs: false,
    }),
    schema: AcronymSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are an AI assistant trained to extract terms, jargon, and acronyms from academic or scientific text.

Your task:
	•	Identify and list all relevant keywords, acronyms, and jargon in the provided text and make sure to include all the terms which are hard to understand for the reader.
	•	For each item, provide:
	•	"keyword": The term exactly as written in the text
	•	"value": The full form or meaning of the term (if applicable)
	•	"explanation": A simple explanation in layman's terms based on the provided text, including a brief real-life example

IMPORTANT:
	•	If a field is unknown or not applicable, return it as an empty string ("")
	•	Output valid JSON only — no comments, notes, or extra text
	•	Match this format exactly:
  {
  "items": [
    { "keyword": "AI", "value": "Artificial Intelligence", "explanation": "A computer system that can do things like learn, reason, or make decisions. For example, AI helps voice assistants like Siri understand speech." },
    { "keyword": "XYZ", "value": "", "explanation": "" }
  ]
}`,
          },
          {
            type: "file",
            data: pdfSource,
            mimeType: "application/pdf",
          },
        ],
      },
    ],
    maxTokens: 8000,
  });

  console.log("Acronyms extracted successfully");

  const acronyms: AcronymType[] = result.object.items;

  const acronymData = acronyms.map((acronym) => ({
    keyword: typeof acronym.keyword === "string" ? acronym.keyword : "",
    value: typeof acronym.value === "string" ? acronym.value : "",
    explanation:
      typeof acronym.explanation === "string" ? acronym.explanation : "",
    paperSummaryId: id,
  }));

  // Insert acronyms in bulk using createMany
  await prisma.acronym.createMany({
    data: acronymData,
  });

  return NextResponse.json({
    success: true,
    paperSummaryId: id,
    paperMainStructureId: id || null,
    acronyms: acronyms || [],
  });
}
