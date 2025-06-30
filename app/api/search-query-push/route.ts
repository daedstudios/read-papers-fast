import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/SingletonPrismaClient";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    // Validate that query is provided
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 }
      );
    }

    // Save the search query to the database
    const searchQuery = await prisma.searchQuery.create({
      data: {
        query: query.trim(),
      },
    });

    // Return the created search query with its ID
    return NextResponse.json({
      success: true,
      id: searchQuery.id,
      query: searchQuery.query,
      createdAt: searchQuery.createdAt,
    });
  } catch (error) {
    console.error("Error saving search query:", error);
    return NextResponse.json(
      { error: "Failed to save search query" },
      { status: 500 }
    );
  }
}