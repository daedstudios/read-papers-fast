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

    if (!body.sectionText || !body.sectionId) {
      return NextResponse.json(
        { error: "Missing sectionText or sectionId" },
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
              text: `You are an AI document simplifier specialized in academic papers. Simplify the following section for better understanding, while keeping technical accuracy:\n\n${body.sectionText}`,
            },
          ],
        },
      ],
    });

    const simplified = result.object.simplified;

    await prisma.paperContentGrobid.update({
      where: { id: body.sectionId },
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
