import { NextResponse } from "next/server";
import { prisma } from "@/lib/SingletonPrismaClient";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Paper summary ID is required" },
        { status: 400 }
      );
    }

    // Fetch all Grobid content for this paper summary, ordered by order_index
    const grobidContent = await prisma.paperContentGrobid.findMany({
      where: {
        paperSummaryID: id,
      },
      orderBy: {
        order_index: "asc",
      },
    });

     const grobidAbstract = await prisma.paperSummary.findFirst({
       where: {
         paperSummaryID: id,
       },
     });

     const grobidFigures = await prisma.paperFigures.findMany({
       where: {
         paper_summary_id: id,
       },
     });

     const geminiKeywords = await prisma.acronym.findMany({
       where: {
         paperSummaryId: id,
       },
     });

     if (grobidContent.length === 0) {
       return NextResponse.json(
         { error: "No Grobid content found for this paper ID" },
         { status: 404 }
       );
     }

     return NextResponse.json(
       {
         grobidContent,
         grobidAbstract,
         grobidFigures,
         geminiKeywords,
       },
       { status: 200 }
     );
  } catch (error) {
    console.error("Error fetching paper data:", error);
    return NextResponse.json(
      { error: "Failed to fetch paper data" },
      { status: 500 }
    );
  }
}
