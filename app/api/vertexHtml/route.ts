import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/SingletonPrismaClient";

// Helper function to extract text content from para JSON
function extractTextFromPara(para: any): string {
  if (!para) return "";

  try {
    const paraContent = typeof para === "string" ? JSON.parse(para) : para;

    if (Array.isArray(paraContent)) {
      // Handle array of objects with text property [{"refs": {}, "text": "...", "order_index": 0}]
      return paraContent
        .map((item) =>
          item && typeof item === "object" && "text" in item ? item.text : ""
        )
        .filter((text) => text)
        .join("\n\n");
    } else if (typeof paraContent === "string") {
      return paraContent;
    } else if (paraContent && typeof paraContent === "object") {
      // Handle single object with text property
      if ("text" in paraContent) {
        return paraContent.text;
      } else {
        return JSON.stringify(paraContent);
      }
    }
  } catch (error) {
    console.error("Error parsing para content:", error);
  }

  return "";
}

// Helper function to fetch the full paper context
async function fetchPaperContext(id: string): Promise<string> {
  try {
    // Fetch all content entries for the paper from PaperContentGrobid table
    const contentEntries = await prisma.paperContentGrobid.findMany({
      where: {
        paperSummaryID: id,
      },
      orderBy: {
        order_index: "asc",
      },
      select: {
        head: true,
        para: true,
      },
    });

    // Create a context string with all paragraphs from the paper
    let context = "PAPER CONTEXT:\n\n";

    if (contentEntries && contentEntries.length > 0) {
      // Extract and combine all headings and paragraphs to create a full context
      contentEntries.forEach((entry) => {
        if (entry.head) {
          context += `## ${entry.head}\n\n`;
        }

        if (entry.para) {
          const paraText = extractTextFromPara(entry.para);
          if (paraText) {
            context += `${paraText}\n\n`;
          }
        }
      });
    }

    return context;
  } catch (error) {
    console.error("Error fetching paper context:", error);
    return "";
  }
}

// Common processing logic for both GET and POST methods
async function processVertexHtml(id: string) {
  console.log(`Fetching PaperContentGrobid entries for paperSummaryID: ${id}`);

  // Fetch all content entries for the given paper ID, ordered by index
  const contentEntries = await prisma.paperContentGrobid.findMany({
    where: {
      paperSummaryID: id,
    },
    orderBy: {
      order_index: "asc",
    },
  });

  if (!contentEntries || contentEntries.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: "No content entries found for the given ID",
      },
      { status: 404 }
    );
  }

  console.log(`Found ${contentEntries.length} content entries to process`);

  // Get the full paper context for better AI understanding
  const paperContext = await fetchPaperContext(id);
  console.log("Fetched paper context for AI processing");

  // Process each entry in sequence to simplify text
  const results = await Promise.all(
    contentEntries.map(async (entry, index) => {
      try {
        // Skip entries without content
        if (!entry.para && !entry.head) {
          console.log(
            `Skipping entry ${index} with ID ${entry.id} due to missing content`
          );
          return {
            id: entry.id,
            status: "skipped",
            reason: "No content to simplify",
          };
        }

        // Prepare the content to send to the model
        let contentToSimplify = "";

        if (entry.head) {
          contentToSimplify += `Heading: ${entry.head}\n\n`;
        }

        if (entry.para) {
          contentToSimplify += extractTextFromPara(entry.para);
        }

        if (!contentToSimplify.trim()) {
          console.log(
            `Skipping entry ${index} with ID ${entry.id} due to empty content after parsing`
          );
          return {
            id: entry.id,
            status: "skipped",
            reason: "Empty content after parsing",
          };
        }

        console.log(
          `Processing entry ${index + 1}/${contentEntries.length}, ID: ${
            entry.id
          }`
        );

        // Generate simplified HTML content using AI model with paper context
        const simplifiedResponse = await generateText({
          model: google("gemini-1.5-flash-latest"),
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `You are an expert at simplifying academic and technical text for wider audiences.

For context, here is the full text of the academic paper to help you understand any terms or concepts:
${paperContext}

Please rewrite the following academic text section in a simpler, more accessible HTML format:
1. Use clear, concise language at approximately a high school reading level
2. Maintain all important information and concepts
3. Break up complex sentences
4. Define technical terms inline (using the paper context to understand terminology)
5. Use appropriate HTML formatting:
   - Use <h2>, <h3>, etc. for headings
   - Use <p> for paragraphs
   - Use <ul> and <li> for lists when appropriate
   - Use <strong> for emphasis of important terms
   - Use <em> for defining terms
   - Use <a> tags for any references (if applicable)
   - Include appropriate spacing and structure
6. output the content Wrapped in <div> tags no additional parent HTML tags
Original text:
${contentToSimplify}`,
                },
              ],
            },
          ],
          maxTokens: 12000,
        });

        // Also generate a simplified heading if the entry has a heading
        let simplifiedHeading = null;
        if (entry.head) {
          const headingResponse = await generateText({
            model: google("gemini-1.5-flash-latest"),
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Using the full text of this academic paper as context:
${paperContext}

Simplify this academic heading into a clear, concise heading that maintains the same meaning but is easier to understand:

"${entry.head}"

Return only the simplified heading text, nothing else.`,
                  },
                ],
              },
            ],
            maxTokens: 1000,
          });

          simplifiedHeading = headingResponse.text.trim();
        } // Update the database with the simplified text
        await prisma.paperContentGrobid.update({
          where: {
            id: entry.id,
          },
          data: {
            simplifiedText: simplifiedResponse.text.trim(),
            simplifiedHead: simplifiedHeading,
          },
        });

        return {
          id: entry.id,
          status: "success",
          headingLength: simplifiedHeading ? simplifiedHeading.length : 0,
          contentLength: simplifiedResponse.text.length,
        };
      } catch (entryError) {
        console.error(
          `Error processing entry ${index} with ID ${entry.id}:`,
          entryError
        );
        return {
          id: entry.id,
          status: "error",
          error:
            entryError instanceof Error
              ? entryError.message
              : String(entryError),
        };
      }
    })
  );

  // Count the successful and failed entries
  const successful = results.filter((r) => r.status === "success").length;
  const failed = results.filter((r) => r.status === "error").length;
  const skipped = results.filter((r) => r.status === "skipped").length;

  return NextResponse.json({
    success: true,
    message: `Processed ${contentEntries.length} entries: ${successful} successful, ${failed} failed, ${skipped} skipped`,
    paperSummaryID: id,
    results,
  });
}

// GET endpoint for backward compatibility
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameter: id",
        },
        { status: 400 }
      );
    }

    return await processVertexHtml(id);
  } catch (error) {
    console.error("Error in vertexHtml GET route:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST endpoint for new implementation
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body.id;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameter: id in request body",
        },
        { status: 400 }
      );
    }

    return await processVertexHtml(id);
  } catch (error) {
    console.error("Error in vertexHtml POST route:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
