import { NextResponse } from "next/server";
import { prisma } from "@/lib/SingletonPrismaClient";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const existing = await prisma.waitlistSignup.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Already on the list" },
        { status: 200 }
      );
    }

    await prisma.waitlistSignup.create({
      data: { email },
    });

    return NextResponse.json(
      { message: "Signed up successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Prisma error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
