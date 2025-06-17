import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/SingletonPrismaClient";

interface GrobidFigureWithImages {
  id: string;
  xml_id: string | null;
  figure_number: string | null;
  label: string | null;
  title: string | null;
  description: string | null;
  order_index: number | null;
  html_content: string | null;
  images: {
    id: string;
    image_url: string | null;
    page_number: number | null;
    head: string | null;
    description: string | null;
  }[];
  ai_matched: boolean;
}

// Define schema for AI-generated figure match info
interface FigureMatchInfo {
  grobid_figure_id: string;
  paper_figure_ids: string[];
  confidence_score: number;
  matching_reason: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    console.log("Request body:", body);

    const paperMainStructure = await prisma.paperMainStructure.findUnique({
      where: { id },
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

    // Get GrobidFigureData for this paper
    const grobidFigureData = await prisma.grobidFigureData.findMany({
      where: {
        paper_summary_id: id,
      },
      select: {
        id: true,
        xml_id: true,
        figure_number: true,
        label: true,
        title: true,
        description: true,
        graphic_coords: true,
        graphic_type: true,
        has_graphic: true,
        order_index: true,
        html_content: true,
      },
      orderBy: {
        order_index: "asc",
      },
    });

    if (grobidFigureData.length === 0) {
      return NextResponse.json(
        { error: "No Grobid figure data found for this paper" },
        { status: 404 }
      );
    }

    // Get PaperFigures for this paper
    const paperFigures = await prisma.paperFigures.findMany({
      where: {
        paper_summary_id: id,
      },
      select: {
        id: true,
        figure_id: true,
        label: true,
        head: true,
        description: true,
        page_number: true,
        image_url: true,
        extracted_image_path: true,
      },
      orderBy: {
        page_number: "asc",
      },
    });

    console.log(
      `Found ${grobidFigureData.length} grobid figures and ${paperFigures.length} paper figures.`
    ); // Prepare image files to send to Gemini - we'll skip them for now as they're causing issues
    // The error shows that the extracted_image_path contains file paths that aren't base64 encoded
    console.log(
      "Image files found:",
      paperFigures.filter((fig) => fig.extracted_image_path).length
    );

    // For now, we'll rely only on the PDF and metadata for matching
    const imageFiles: any[] = []; // Empty array instead of trying to include images

    // Define the Zod schema for figure matching
    const FigureMatchSchema = z.object({
      grobid_figure_id: z.string(),
      paper_figure_ids: z.array(z.string()),
      confidence_score: z.number().min(0).max(1),
      matching_reason: z.string(),
    });

    // Use Gemini to match figures with images
    let figureMatches: FigureMatchInfo[] = [];
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        // Create content array with text and all files
        const contentArray = [
          {
            type: "text" as const,
            text: `You are an AI document analyzer specialized in matching figure references in academic papers with their corresponding images. Your task is to analyze the PDF and match the structured figure data with the extracted images.

INPUT DATA:
1. Grobid Figure Data (structured figure references from the document):
${JSON.stringify(grobidFigureData, null, 2)}

2. Paper Figures (extracted images metadata from the PDF):
${JSON.stringify(
  paperFigures.map((fig) => ({
    id: fig.id,
    figure_id: fig.figure_id,
    label: fig.label,
    head: fig.head,
    description: fig.description,
    page_number: fig.page_number,
    // We're not including the actual image paths or URLs in the analysis
  })),
  null,
  2
)}

MATCHING TASK:
- For each Grobid Figure entry, identify which Paper Figure(s) correspond to it
- Use contextual clues from the PDF to make accurate matches
- Consider labels, titles, descriptions, page proximity, and logical placement in the document
- A Grobid Figure might match multiple Paper Figures (e.g., multi-part figures)
- Each Paper Figure should only be matched once if possible

OUTPUT FORMAT:
For each match, provide:
- grobid_figure_id: The ID of the Grobid Figure entry
- paper_figure_ids: Array of IDs of matching Paper Figure entries
- confidence_score: A number between 0-1 indicating match confidence
- matching_reason: Brief explanation of why this match was made

EXAMPLE OUTPUT:
[
  {
    "grobid_figure_id": "abc123",
    "paper_figure_ids": ["xyz789"],
    "confidence_score": 0.95,
    "matching_reason": "Exact match of labels 'Figure 1' and same page location"
  },
  {
    "grobid_figure_id": "def456",
    "paper_figure_ids": ["uvw987", "rst654"],
    "confidence_score": 0.85,
    "matching_reason": "Multi-part Figure 2 matching two extracted images on the same page"
  }
]

Analyze the PDF and metadata provided and give the best possible matches based on textual and contextual information.`,
          },
          {
            type: "file" as const,
            data: pdfSource,
            mimeType: "application/pdf",
          },
          // Removed ...imageFiles due to base64 encoding issues
        ];

        const matchResult = await generateObject({
          model: google("gemini-2.0-flash-001", {
            structuredOutputs: false,
          }),
          schema: z.array(FigureMatchSchema),
          messages: [
            {
              role: "user",
              content: contentArray,
            },
          ],
          maxTokens: 12000,
        });

        // Get the parsed matches from the result and ensure it's an array
        figureMatches = Array.isArray(matchResult.object)
          ? matchResult.object
          : [matchResult.object];

        console.log("AI-generated figure matches:", figureMatches);

        // Check if we have matches for all grobid figures
        const matchedGrobidIds = new Set(
          figureMatches.map((match) => match.grobid_figure_id)
        );
        const hasAllMatches = grobidFigureData.every((figure) =>
          matchedGrobidIds.has(figure.id)
        );

        if (!hasAllMatches) {
          console.log(
            `Attempt ${
              retryCount + 1
            }: Not all Grobid figures were matched, retrying...`
          );
          retryCount++;
        } else {
          // All figures were matched, break the retry loop
          break;
        }
      } catch (error) {
        console.error(`Attempt ${retryCount + 1} failed:`, error);
        retryCount++;

        // If this was the last retry, throw the error
        if (retryCount >= maxRetries) {
          throw error;
        }
      }
    }

    if (figureMatches.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate figure matches after multiple attempts" },
        { status: 500 }
      );
    }

    // Create a mapping of image links to GrobidFigureData based on AI matches
    const figuresWithImages: GrobidFigureWithImages[] = [];
    const usedImageIds = new Set<string>(); // Track used image IDs to avoid duplicates

    // Map AI matches to our structure
    for (const grobidFigure of grobidFigureData) {
      const aiMatch = figureMatches.find(
        (match) => match.grobid_figure_id === grobidFigure.id
      );

      if (aiMatch) {
        // Get matching images based on AI suggestion
        const matchingImages = paperFigures
          .filter((paperFigure) => {
            // Only include if AI matched it and it hasn't been used yet
            if (
              !aiMatch.paper_figure_ids.includes(paperFigure.id) ||
              usedImageIds.has(paperFigure.id)
            ) {
              return false;
            }

            // Mark this image as used
            usedImageIds.add(paperFigure.id);
            return true;
          })
          .map((paperFigure) => ({
            id: paperFigure.id,
            image_url: paperFigure.image_url,
            page_number: paperFigure.page_number,
            head: paperFigure.head,
            description: paperFigure.description,
          }));

        figuresWithImages.push({
          ...grobidFigure,
          images: matchingImages,
          ai_matched: true,
        });
      } else {
        // No AI match, use fallback matching logic
        const matchingImages = paperFigures
          .filter((paperFigure) => {
            // Don't use already used images
            if (usedImageIds.has(paperFigure.id)) {
              return false;
            }

            // Use the existing matching logic from before
            if (
              grobidFigure.xml_id &&
              paperFigure.figure_id &&
              grobidFigure.xml_id === paperFigure.figure_id
            ) {
              return true;
            }

            if (
              grobidFigure.label &&
              paperFigure.label &&
              grobidFigure.label.trim() === paperFigure.label.trim()
            ) {
              return true;
            }

            if (
              grobidFigure.title &&
              paperFigure.head &&
              grobidFigure.title.trim() === paperFigure.head.trim()
            ) {
              return true;
            }

            if (
              grobidFigure.description &&
              paperFigure.description &&
              (grobidFigure.description.includes(paperFigure.description) ||
                paperFigure.description.includes(grobidFigure.description))
            ) {
              return true;
            }

            return false;
          })
          .map((paperFigure) => {
            // Mark this image as used
            usedImageIds.add(paperFigure.id);

            return {
              id: paperFigure.id,
              image_url: paperFigure.image_url,
              page_number: paperFigure.page_number,
              head: paperFigure.head,
              description: paperFigure.description,
            };
          });

        figuresWithImages.push({
          ...grobidFigure,
          images: matchingImages,
          ai_matched: false,
        });
      }
    }

    // Update the GrobidFigureData table with image links
    const updatePromises = figuresWithImages.map(async (figure) => {
      if (figure.images.length > 0) {
        // Get the first image URL (if there are multiple, we'll use the first one)
        const primaryImageUrl = figure.images[0]?.image_url || null;

        // Keep the existing HTML content for reference
        const htmlContent = figure.html_content || "";

        return prisma.grobidFigureData.update({
          where: { id: figure.id },
          data: {
            // Store the image URL directly in the image_url field
            image_url: primaryImageUrl,
            // Keep the existing HTML content unchanged
            html_content: htmlContent,
            updated_at: new Date(),
          },
        });
      }
      return null;
    });

    const updateResults = await Promise.all(updatePromises);
    const successfulUpdates = updateResults.filter(Boolean).length;

    console.log(
      `Updated ${successfulUpdates} GrobidFigureData entries with image references`
    );

    return NextResponse.json({
      success: true,
      message: `Successfully matched and updated ${successfulUpdates} Grobid figures with their corresponding images`,
      figures: figuresWithImages,
      aiMatches: figureMatches,
      totalFigures: figuresWithImages.length,
      totalImages: usedImageIds.size,
      updatedFigures: successfulUpdates,
      unmappedImages: paperFigures.length - usedImageIds.size,
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
