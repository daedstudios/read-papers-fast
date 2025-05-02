import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/SingletonPrismaClient";

// Define type for acronym info based on the Zod schema
type AcronymType = {
  keyword: string;
  value: string;
  explination: string; // Note: Database field is 'explanation' but API uses 'explination'
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { documentUrl, fileData, fileName, paperSummaryId } = body;

    // Check if paperSummaryId was provided
    if (!paperSummaryId) {
      throw new Error("paperSummaryId is required to update the paper record");
    }

    let pdfSource;

    if (fileData) {
      pdfSource = Buffer.from(fileData, "base64");
    } else if (documentUrl) {
      pdfSource = documentUrl;
    } else {
      throw new Error(
        "No PDF source provided. Please provide either a URL or upload a file."
      );
    }

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
      maxTokens: 60000,
    });

    console.log("Acronyms extracted successfully");

    // Get the parsed acronyms from the result, accessing items array
    const acronyms: AcronymType[] = result.object.items;

    try {
      // First, delete any existing acronyms for this paper to prevent duplicates
      await prisma.acronym.deleteMany({
        where: {
          paperSummaryId: paperSummaryId,
        },
      });

      // Check if we actually have acronyms to add
      if (acronyms && acronyms.length > 0) {
        // Prepare acronym data for database
        const acronymData = acronyms.map((acronym) => ({
          keyword: acronym.keyword,
          value: acronym.value,
          explanation: acronym.explination, // Note: Converting from 'explination' to 'explanation'
          paperSummaryId: paperSummaryId,
        }));

        // Insert acronyms in bulk using createMany
        await prisma.acronym.createMany({
          data: acronymData,
        });
      }

      // Fetch the paper summary with the newly added acronyms
      const updatedPaper = await prisma.paperSummary.findUnique({
        where: {
          id: paperSummaryId,
        },
        include: {
          acronyms: true,
        },
      });

      // Return the extracted acronyms and updated paper
      return NextResponse.json({
        success: true,
        paperSummaryId: paperSummaryId,
        acronyms:
          updatedPaper?.acronyms ||
          acronyms?.map((a) => ({
            ...a,
            explanation: a.explination,
          })) ||
          [],
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      // If DB operation fails, still return the extracted acronyms
      return NextResponse.json({
        success: true,
        paperSummaryId: paperSummaryId,
        acronyms: acronyms || [],
        dbError: "Failed to save acronyms to database",
      });
    }
  } catch (error) {
    console.error("Error processing Vertex API request:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
