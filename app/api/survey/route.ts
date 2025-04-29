import { NextResponse } from "next/server";
import { prisma } from "@/lib/SingletonPrismaClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reason, confidence, field, paperSummaryId } = body;

    if (!reason || !confidence || !field) {
      return NextResponse.json(
        { error: "Missing required survey fields" },
        { status: 400 }
      );
    }

    // Create new survey entry
    const survey = await prisma.survey.create({
      data: {
        reason,
        confidence,
        field,
        paperSummary: paperSummaryId
          ? {
              connect: { id: paperSummaryId },
            }
          : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Survey submitted successfully",
      survey,
    });
  } catch (error) {
    console.error("Survey submission error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit survey" },
      { status: 500 }
    );
  }
}
