import { NextRequest, NextResponse } from "next/server";
import { preEvaluateAbstract } from "@/lib/factCheckUtils";

export async function POST(req: NextRequest) {
  const { statement, abstract, title } = await req.json();

  try {
    const result = await preEvaluateAbstract(statement, abstract, title);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to pre-evaluate fact-check", message: String(error) },
      { status: 500 }
    );
  }
}
