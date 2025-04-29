import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { prisma } from "@/lib/SingletonPrismaClient";

export async function GET(request: Request) {
  //   const prisma = new PrismaClient();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Paper summary ID is required" },
        { status: 400 }
      );
    }

    // If ID is provided, fetch specific paper summary
    const paperSummary = await prisma.paperSummary.findUnique({
      where: { id: id },
      include: {
        sections: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!paperSummary) {
      return NextResponse.json(
        { error: "Paper summary not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ paperSummary }, { status: 200 });
  } catch (error) {
    console.error("Error fetching paper summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch paper summary" },
      { status: 500 }
    );
  }
}
