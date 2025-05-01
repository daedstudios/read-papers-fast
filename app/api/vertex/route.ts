import { generateText, generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/SingletonPrismaClient";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { documentUrl, fileData, fileName, paperSummaryId } = body;

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

    // Step 1: Extract just the titles from the PDF using generateObject
    console.log("Step 1: Extracting titles from document...");

    // Define the schema for titles
    const TitlesSchema = z.object({
      titles: z.array(z.string()),
    });

    const titlesResult = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: TitlesSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: 'You are an AI document parser. Extract ONLY the MAJOR section titles from this academic paper. Ignore any sub-section titles or minor headings. Return them as a JSON object in the format: {"titles": ["Introduction", "Methodology", "Results", "Discussion", "Conclusion", ...]}. Include only the main sections of the document, typically found at the top level of the document structure.',
            },
            {
              type: "file",
              data: pdfSource,
              mimeType: "application/pdf",
            },
          ],
        },
      ],
      maxTokens: 10000,
    });

    console.log("Titles extracted:", titlesResult);

    const titles = titlesResult.object.titles as string[];

    if (!titles || titles?.length === 0) {
      throw new Error("Failed to extract section titles from the document");
    }

    // Step 2: For each title, make a separate request to get the content
    console.log(`Step 2: Extracting content for ${titles.length} sections...`);
    const sections = [];

    for (let i = 0; i < titles.length; i++) {
      const title = titles[i];
      console.log(`Processing section ${i + 1}/${titles.length}: "${title}"`);

      const contentResult = await generateText({
        model: google("gemini-2.0-flash-001"),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an AI document parser. Extract the FULL VERBATIM content for the section titled "${title}" from this academic paper. Do NOT summarize or modify the text. Return ONLY the raw text content without any additional commentary. If this exact section title doesn't exist, find the closest matching section.`,
              },
              {
                type: "file",
                data: pdfSource,
                mimeType: "application/pdf",
              },
            ],
          },
        ],
        maxTokens: 90000,
      });

      sections.push({
        title: title,
        content: contentResult.text.trim(),
      });

      // Short delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Create the final structured JSON
    const finalResult = { sections: sections };
    const finalResultText = JSON.stringify(finalResult);

    console.log(
      "Final combined result prepared with sections:",
      sections.length
    );

    // Store the result in the database
    try {
      const paperSummary = await prisma.paperSummary.update({
        where: {
          id: paperSummaryId,
        },
        data: {
          sections: {
            create: parseAndPrepareSections(finalResultText),
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
      return NextResponse.json({
        success: true,
        answer: finalResultText,
        paperSummary: paperSummary,
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      // If DB operation fails, still return the AI response
      return NextResponse.json({
        success: true,
        answer: finalResultText,
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
  content: string;
}

function parseAndPrepareSections(jsonText: string) {
  try {
    // Remove the markdown formatting if present (```json and ````)
    const cleanedJsonText = jsonText.replace(/```json|```/g, "").trim();

    // Parse the JSON response
    const parsedData = JSON.parse(cleanedJsonText);

    // Check if sections array exists
    if (parsedData.sections && Array.isArray(parsedData.sections)) {
      // Map sections to the format expected by Prisma, converting 'content' to 'summary' for database
      return parsedData.sections.map((section: Section, index: number) => ({
        title: section.title,
        summary: section.content, // Store content as summary in the database
        order: index,
      }));
    } else {
      // Fallback if the expected structure is not found
      return [
        {
          title: "Document Content",
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
        title: "Raw Document Content",
        summary: jsonText,
        order: 0,
      },
    ];
  }
}
