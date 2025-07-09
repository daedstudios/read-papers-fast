import { prisma } from "@/lib/SingletonPrismaClient";
// app/api/upload/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";

const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });
};

function getStorage() {
  const { storage } = createSupabaseClient();
  return storage;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const path = `documents/${uuidv4()}.pdf`;

    const storage = getStorage();
    const { data, error } = await storage.from("pdfs").upload(path, file);

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json(
        { error: "File upload failed" },
        { status: 500 }
      );
    }

    const fileUrl = `${process.env
      .NEXT_PUBLIC_SUPABASE_URL!}/storage/v1/object/public/pdfs/${data?.path}`;

    const create = await prisma.paperMainStructure.create({
      data: {
        id: uuidv4(),
        pdf_file_path: fileUrl,
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      id: create.id,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
