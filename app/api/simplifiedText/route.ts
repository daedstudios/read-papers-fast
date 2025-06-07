import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { prisma } from "@/lib/SingletonPrismaClient";

const SimplifiedSchema = z.object({
  simplified: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { paragraphText, paragraphId } = body;

    if (!paragraphText || !paragraphId) {
      return NextResponse.json(
        { error: "Missing text or paragraph ID" },
        { status: 400 }
      );
    }

    const result = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: SimplifiedSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an AI document simplifier specialized in academic papers. Simplify the following paragraph for better understanding, while keeping technical accuracy:\n\n${paragraphText}`,
            },
          ],
        },
      ],
    });

    const simplified = result.object.simplified;

    // Update only the section-level simplifiedText field
    await prisma.paperContentGrobid.update({
      where: { id: paragraphId },
      data: { simplifiedText: simplified },
    });

    return NextResponse.json({ simplified });
  } catch (error) {
    console.error("Error simplifying text:", error);
    return NextResponse.json(
      { error: "Failed to simplify text" },
      { status: 500 }
    );
  }
}
