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

    const grobidContent = await prisma.paperContentGrobid.findMany({
      where: {
        paperSummaryID: id,
      },
      select: {
        id: true,
        head: true,
        head_n: true,
        order_index: true,
        geminiOrder: true,
      },
      orderBy: {
        order_index: "asc",
      },
    });

    return NextResponse.json(
      {
        grobidContent,
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
