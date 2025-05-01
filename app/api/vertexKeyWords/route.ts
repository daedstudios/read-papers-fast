import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { documentUrl, fileData, fileName } = body;

    // Determine the source of the PDF
    let pdfSource;

    if (fileData) {
      // Use the uploaded file data (base64 encoded)
      pdfSource = Buffer.from(fileData, "base64");
    } else if (documentUrl) {
      // Use the provided URL
      pdfSource = documentUrl;
    } else {
      throw new Error(
        "No PDF source provided. Please provide either a URL or upload a file."
      );
    }

    console.log("Extracting acronyms and full forms from document...");

    // Define the schema for acronyms
    const AcronymSchema = z.array(
      z.object({
        keyword: z.string(),
        value: z.string(),
        explination: z.string(),
      })
    );

    // Extract acronyms and full forms using generateObject
    const result = await generateObject({
      model: google("gemini-1.5-flash-latest", {
        structuredOutputs: true,
      }),
      schema: AcronymSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an AI document parser specialized in academic papers. Extract ALL acronyms and shortforms from this research paper. Return ONLY a JSON array with objects in the format [{keyword: "acronym", value: "verbatim full form", explination: "short explanation of what this acronym represents"}]. Ensure that the "keyword" contains only the acronym, the "value" contains its exact full form as defined in the paper, and the "explination" provides a concise description of the acronym's significance or context in the paper. Include only acronyms and their corresponding full forms explicitly mentioned in the document.`,
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

    console.log("Acronyms extracted successfully");

    // Return the extracted acronyms
    return NextResponse.json({
      success: true,
      acronyms: result,
    });
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
