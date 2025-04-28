import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { documentUrl, fileData, fileName } = body;

    // Determine the source of the PDF
    let pdfSource;
    let pdfTitle = "AI Document Analysis";
    let pdfFileName = null;

    if (fileData) {
      // Use the uploaded file data (base64 encoded)
      pdfSource = Buffer.from(fileData, "base64");
      pdfFileName = fileName || "uploaded-document.pdf";
      pdfTitle = pdfFileName;
    } else if (documentUrl) {
      // Use the provided URL
      pdfSource = documentUrl;
    } else {
      throw new Error(
        "No PDF source provided. Please provide either a URL or upload a file."
      );
    }

    const result = await generateText({
      model: google("gemini-1.5-flash"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: 'Extract the structure of this document and return the main categories as a JSON object with an array of sections. Each section should have a "title" and a "summary" field. The summary should be a brief 1-2 sentence description of that section. Example: {"sections": [{"title": "Introduction", "summary": "Introduces the main concepts and goals of the paper."}, {"title": "Methodology", "summary": "Describes the research approach and data collection methods."}]}',
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

    console.log("AI response:", result.text);

    // Create a structured response with sections
    try {
      // Store the result in the database
      const paperSummary = await prisma.paperSummary.create({
        data: {
          title: pdfTitle,
          url: documentUrl || null,
          fileName: pdfFileName,
          sections: {
            create: parseAndPrepareSections(result.text),
          },
        },
        include: {
          sections: {
            orderBy: {
              order: "asc",
            },
          },
        },
      });

      // Return both the AI response and the saved database record
      return NextResponse.json({
        success: true,
        answer: result.text,
        paperSummary: paperSummary,
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      // If DB operation fails, still return the AI response
      return NextResponse.json({
        success: true,
        answer: result.text,
        dbError: "Failed to save to database",
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

// Define an interface for the section structure
interface Section {
  title: string;
  summary: string;
}

function parseAndPrepareSections(jsonText: string) {
  try {
    // Remove the markdown formatting if present (```json and ````)
    const cleanedJsonText = jsonText.replace(/```json|```/g, "").trim();

    // Parse the JSON response
    const parsedData = JSON.parse(cleanedJsonText);

    // Check if sections array exists
    if (parsedData.sections && Array.isArray(parsedData.sections)) {
      // Map sections to the format expected by Prisma
      return parsedData.sections.map((section: Section, index: number) => ({
        title: section.title,
        summary: section.summary,
        order: index,
      }));
    } else {
      // Fallback if the expected structure is not found
      console.warn("Unexpected AI response format, using fallback structure");
      return [
        {
          title: "Document Summary",
          summary: jsonText,
          order: 0,
        },
      ];
    }
  } catch (error) {
    console.error("Error parsing AI response:", error);
    // If parsing fails, use the raw text
    return [
      {
        title: "Raw Document Analysis",
        summary: jsonText,
        order: 0,
      },
    ];
  }
}
