import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/SingletonPrismaClient";


type AcronymType = {
  keyword: string;
  value: string;
  explination: string;
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
        explination: z.string(),
      })
    ),
  });

  // Extract acronyms and full forms using generateObject
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
            text: `You are an AI document parser specialized in academic papers. Extract ALL acronyms and shortforms from this research paper. Return ONLY a JSON object with the following structure:
              {
                "items": [
                  {"keyword": "acronym", "value": "verbatim full form", "explination": "short explanation"},
                  {"keyword": "another acronym", "value": "its full form", "explination": "explanation"}
                ]
              }
              
              Ensure that the "keyword" contains only the acronym, the "value" contains its exact full form as defined in the paper, and the "explination" provides a detailed description of what the acronym represents in the paper's context.`,
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

  // Get the parsed acronyms from the result, accessing items array
  const acronyms: AcronymType[] = result.object.items;

  const acronymData = acronyms.map((acronym) => ({
    keyword: acronym.keyword,
    value: acronym.value,
    explanation: acronym.explination,
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
