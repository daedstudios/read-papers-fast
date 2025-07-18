import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/SingletonPrismaClient";
import { auth } from "@clerk/nextjs/server";

// Define type for paper info based on the Zod schema
type PaperInfoType = {
  title: string;
  authors: string[];
  publishedDate?: string;
  abstract?: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    const paperMainStructure = await prisma.paperMainStructure.findUnique({
      where: {
        id: id,
      },
    });
    const pdfSource = paperMainStructure?.pdf_file_path || "";

    console.log("Extracting basic paper information...");

    // Define the schema for paper information
    const PaperInfoSchema = z.object({
      title: z.string(),
      authors: z.array(z.string()).optional().default([]),
      publishedDate: z.string().optional(),
      abstract: z.string().optional(),
    });

    // Extract paper info using generateObject
    const paperInfoResult = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: PaperInfoSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an AI document parser specialized in academic papers. Extract the basic information from this research paper. Return ONLY a JSON object with the following fields: 
              - title: The full title of the paper
              - authors: An array of author names
              - publishedDate: The publication date in ISO format (YYYY-MM-DD) if available
              - abstract: The paper's abstract
              
              Extract this information exactly as it appears in the document.`,
            },
            {
              type: "file",
              data: pdfSource,
              mimeType: "application/pdf",
            },
          ],
        },
      ],
    });

    // Get the parsed paper info from the result
    const paperInfo: PaperInfoType = paperInfoResult.object;

    // Store the paper information in the database
    const paperSummary = await prisma.paperSummary.create({
      data: {
        title: paperInfo.title,
        authors: paperInfo.authors || [],
        publishedDate: paperInfo.publishedDate || null,
        summary: paperInfo.abstract || null,
        paperSummaryID: id,
      },
    });

    console.log(
      "Paper information stored in database with ID:",
      paperSummary.id
    );

    // Return the extracted information and database ID
    return NextResponse.json({
      success: true,
      paperSummaryId: paperSummary.id,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
