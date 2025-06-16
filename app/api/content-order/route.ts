import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/SingletonPrismaClient";
import { auth } from "@clerk/nextjs/server";

// Define type for paper info based on the Zod schema
type orderInfoSchema = {
  id: string;
  head?: string;
  head_n?: string | null; // Update to allow null values
  order_index?: number;
  gemini_index?: string; // Changed to string since index can be like "1.1.2"
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    console.log("request body:", body);

    const paperMainStructure = await prisma.paperMainStructure.findUnique({
      where: {
        id: id,
      },
    });

    if (!paperMainStructure) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const pdfSource = paperMainStructure?.pdf_file_path || "";

    if (!pdfSource) {
      return NextResponse.json(
        { error: "PDF source not found for this paper" },
        { status: 400 }
      );
    }

    console.log("arranging order of content.");

    const grobidContent = await prisma.paperContentGrobid.findMany({
      where: {
        paperSummaryID: id,
      },
      select: {
        id: true,
        head: true,
        head_n: true,
        order_index: true,
      },
      orderBy: {
        order_index: "asc",
      },
    });

    if (grobidContent.length === 0) {
      return NextResponse.json(
        { error: "No Grobid content found for this paper" },
        { status: 404 }
      );
    }
    const OrderInfoSchema = z.object({
      id: z.string(),
      head: z.string().optional(),
      head_n: z.string().nullable().optional(), // Allow null values for head_n
      order_index: z.number().optional(),
      gemini_index: z.string().optional(), // Changed to string for "1.1.2" format
    }); // Extract paper info using generateObject
    let orderInfo: orderInfoSchema[] = [];
    try {
      const paperInfoResult = await generateObject({
        model: google("gemini-2.0-flash-001", {
          structuredOutputs: false,
        }),
        schema: z.array(OrderInfoSchema), // Changed to expect an array
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an AI document parser. Your task is to generate a clean, hierarchical section index called "gemini_index" for each heading block in an academic PDF.

              Input data includes:
              - The original PDF (for layout/context)
              - A list of section blocks, each with:
                - "id": unique identifier
                - "head": text heading (may include numbering like I., A., 1.2.3, etc.)
                - "head_n": optional raw numbering from GROBID
                - "order_index": visual or extracted order in the PDF
                          
              Your output should assign a consistent numeric section index to each block using only numbers:
              - Use decimal hierarchy (e.g. "1", "1.1", "1.1.1", "2", "2.3.4")
              - Do not use Roman numerals, alphabetic labels (A, B, a), or appendix labels (like A.1)
              - Normalize all styles (e.g., "I.", "II.", "A.1.1") into pure numeric forms based on logical structure
              - Use order_index to help infer nesting and sequencing when heading structure is ambiguous
                          
              Examples of desired output:
              [
                { "id": "abc123", "head": "I. Introduction", "head_n": null, "order_index": 0, "gemini_index": "1" },
                { "id": "abc124", "head": "a) Background", "head_n": null, "order_index": 1, "gemini_index": "1.1" },
                { "id": "abc125", "head": "b) Goals of the Study", "head_n": null, "order_index": 2, "gemini_index": "1.2" },
                { "id": "abc126", "head": "II. Methodology", "head_n": null, "order_index": 3, "gemini_index": "2" },
                { "id": "abc127", "head": "A.1. Dataset Description", "head_n": "A.1", "order_index": 4, "gemini_index": "3.1" },
                { "id": "abc128", "head": "A.1.1. Cleaning", "head_n": "A.1.1", "order_index": 5, "gemini_index": "3.1.1" }
              ]
                          
              Now return an array of objects for the given data ${JSON.stringify(
                grobidContent
              )}. Each object should include:
              - "id" (from input)
              - "head" (the section heading text same)
              - "head_n" (the original numbering from GROBID, if available)
              - "order_index" (the visual order in the PDF)
              - "gemini_index" (a normalized numeric section index)
                          
              Ensure consistency, logical hierarchy, and numbering clarity across all entries.`,
              },
              {
                type: "file",
                data: pdfSource,
                mimeType: "application/pdf",
              },
            ],
          },
        ],
        maxTokens: 8000, // Adjust as needed for larger documents
      });

      // Get the parsed paper info from the result and ensure it's an array
      orderInfo = Array.isArray(paperInfoResult.object)
        ? paperInfoResult.object
        : [paperInfoResult.object];
    } catch (error) {
      console.error("Error generating gemini indices:", error);

      // If we can extract the text from the error, try to parse it manually
      if (error instanceof Error && "text" in error) {
        try {
          const textContent = (error as any).text;
          if (typeof textContent === "string") {
            const parsedJson = JSON.parse(textContent);
            if (Array.isArray(parsedJson)) {
              // Keep null values as they are - our schema now supports them
              orderInfo = parsedJson.map((item) => ({
                ...item,
                // Ensure gemini_index is present, even if empty
                gemini_index: item.gemini_index || "",
              }));
              console.log(
                "Recovered order info from error response:",
                orderInfo.length
              );
            }
          }
        } catch (parseError) {
          console.error("Failed to parse fallback text content:", parseError);
        }
      }

      // If we still don't have order info, throw the original error
      if (orderInfo.length === 0) {
        throw error;
      }
    }

    console.log("Generated gemini indices:", orderInfo);

    // Update each content item with its gemini_index
    const updatePromises = orderInfo.map(async (item) => {
      if (item.id) {
        return prisma.paperContentGrobid.update({
          where: { id: item.id },
          data: {
            geminiOrder: item.gemini_index || null, // Handle undefined values gracefully
          },
        });
      }
      return null;
    }); // Wait for all updates to complete
    const updateResults = await Promise.all(updatePromises);
    const successfulUpdates = updateResults.filter(Boolean).length;

    console.log(
      `Updated ${successfulUpdates} content items with gemini indices`
    );

    // Return success response with count of updated items
    return NextResponse.json({
      success: true,
      message: `Updated ${successfulUpdates} content sections with gemini indices`,
      updatedSections: successfulUpdates,
      totalSections: orderInfo.length,
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
