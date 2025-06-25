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

    const paperNotes = await prisma.paperNotes.findMany({
      where: {
        paper_summary_id: id,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    return NextResponse.json(
      {
        paperNotes,
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
