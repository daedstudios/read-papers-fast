import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/SingletonPrismaClient";

export async function GET(request: NextRequest) {
  try {
    // Fetch the 5 most recent search queries
    const recentQueries = await prisma.searchQuery.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        query: true,
        createdAt: true
      }
    });

    // Return the recent search queries
    return NextResponse.json({
      success: true,
      queries: recentQueries,
    });
  } catch (error) {
    console.error("Error fetching recent search queries:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent search queries" },
      { status: 500 }
    );
  }
}