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
      model: google("gemini-1.5-flash-latest", {
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
    });

    console.log("Titles extracted, processing response...");

    // Get titles directly from the object
    // Check if titlesResult is defined and has the expected structure
    let titles: string[] = [];

    if (
      titlesResult &&
      typeof titlesResult.object === "object" &&
      "titles" in titlesResult.object &&
      Array.isArray(titlesResult.object.titles)
    ) {
      titles = titlesResult.object.titles;
    } else {
      console.warn("Unexpected titles result format:", titlesResult);

      // Fallback: Try to extract titles from the full response
      const fullResponse = JSON.stringify(titlesResult);
      try {
        // Try to find a titles array in the response
        const match = fullResponse.match(
          /"titles":\s*(\[(?:"[^"]*"(?:,\s*"[^"]*")*)\])/
        );
        if (match && match[1]) {
          const extractedTitles = JSON.parse(match[1]);
          if (Array.isArray(extractedTitles) && extractedTitles.length > 0) {
            console.log(
              "Extracted titles using fallback method:",
              extractedTitles
            );
            titles = extractedTitles;
          }
        }
      } catch (e) {
        console.error("Error in fallback titles extraction:", e);
      }

      // If still no titles, use a hardcoded fallback
      if (titles.length === 0) {
        titles = [
          "Abstract",
          "Introduction",
          "Methodology",
          "Results",
          "Discussion",
          "Conclusion",
        ];
        console.log("Using default fallback titles:", titles);
      }
    }

    if (titles.length === 0) {
      throw new Error("Failed to extract section titles from the document");
    }

    // Step 2: For each title, make requests in parallel to get the content
    console.log(
      `Step 2: Extracting content for ${titles.length} sections in parallel...`
    );

    // Create an array of promises for each section content request
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    // Determine if this is a production environment
    const isProduction = process.env.NODE_ENV === "production";
    const delayTime = isProduction ? 1000 : 300;

    const contentPromises = titles.map(async (title, index) => {
      // Add a delay between requests - 1000ms per index in production, 300ms in dev
      await delay(delayTime * index);

      console.log(
        `Initiating request for section ${index + 1}/${
          titles.length
        }: "${title}" after ${delayTime * index}ms delay`
      );

      const contentResult = await generateText({
        model: google("gemini-1.5-flash-latest"),
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
        maxTokens: 15000,
      });

      return {
        title: title,
        content: contentResult.text.trim(),
      };
    });

    // Wait for all content extraction promises to resolve
    const sections = await Promise.all(contentPromises);

    console.log(
      `All ${sections.length} section contents extracted successfully`
    );

    // Create the final structured JSON
    const finalResult = { sections: sections };
    const finalResultText = JSON.stringify(finalResult);

    console.log(
      "Final combined result prepared with sections:",
      sections.length
    );

    // Store the result in the database
    try {
      // Handle paperSummaryId if provided (for update flow)
      if (paperSummaryId) {
        // First delete any existing sections for this paper
        await prisma.section.deleteMany({
          where: {
            paperSummaryId: paperSummaryId,
          },
        });

        // Add the new sections to the paper
        const sectionData = parseAndPrepareSections(finalResultText);

        await prisma.section.createMany({
          data: sectionData.map((section: any) => ({
            ...section,
            paperSummaryId: paperSummaryId,
          })),
        });

        // Get the updated paper with sections
        const updatedPaperSummary = await prisma.paperSummary.findUnique({
          where: {
            id: paperSummaryId,
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
          paperSummary: updatedPaperSummary,
        });
      } else {
        // Create new paper summary (original flow)
        const paperSummary = await prisma.paperSummary.create({
          data: {
            title: pdfTitle,
            url: documentUrl || null,
            fileName: pdfFileName,
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

        // Return both the AI response and the saved database record
        return NextResponse.json({
          success: true,
          answer: finalResultText,
          paperSummary: paperSummary,
        });
      }
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
      console.warn("Unexpected AI response format, using fallback structure");
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
