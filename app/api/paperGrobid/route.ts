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

    const pdfURL = await prisma.paperMainStructure.findFirst({
      where: {
        id: id,
      },
      select: {
        pdf_file_path: true,
      },
    });

    // Fetch all Grobid content for this paper summary, ordered by order_index
    const grobidContent = await prisma.paperContentGrobid.findMany({
      where: {
        paperSummaryID: id,
      },
      select: {
        id: true,
        head: true,
        head_n: true,
        para: true,
        order_index: true,
        simplifiedText: true,
        geminiOrder: true,
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

    const references = await prisma.reference.findMany({
      where: {
        paper_summary_id: id,
      },
      include: {
        authors: {
          orderBy: {
            position: "asc",
          },
        },
      },
      orderBy: {
        created_at: "asc",
      },
    });

    const paperNotes = await prisma.paperNotes.findMany({
      where: {
        paper_summary_id: id,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    const grobidFiguresData = await prisma.grobidFigureData.findMany({
      where: {
        paper_summary_id: id,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    return NextResponse.json(
      {
        grobidContent,
        grobidAbstract,
        grobidFigures,
        geminiKeywords,
        references,
        paperNotes,
        grobidFiguresData,
        pdfURL,
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
