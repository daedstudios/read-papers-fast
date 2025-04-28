import { NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

export const POST = async (req: Request, res: Response) => {
 try {
  const data = await req.formData();
  const file = data.get("pdf") as File;

  if (!file || typeof file === "string") {
    throw new Error("PDF file not found");
  }

  // Validate file is a PDF
  if (!file.type || file.type !== "application/pdf") {
    throw new Error("Only PDF files are allowed");
  }

  const filePath = file?.name;

  const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    credentials: {
      client_email: process.env.GCP_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GCP_PRIVATE_KEY?.split(String.raw`\n`).join(
        "\n"
      ),
    },
  });
  const bucket = storage.bucket(process.env.GCP_BUCKET_NAME || "");

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Wrap the upload logic in a promise
  await new Promise((resolve, reject) => {
    const blob = bucket.file(`pdfs/${filePath}`);
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: "application/pdf",
      },
    });

    blobStream
      .on("error", (err) => reject(err))
      .on("finish", () => resolve(true));

    blobStream.end(buffer);
  });

  return new NextResponse(JSON.stringify({ 
    success: true, 
    message: "PDF uploaded successfully", 
    fileName: filePath 
  }));
 } catch (error) {
  console.error("PDF upload error:", error);
  return new NextResponse(JSON.stringify({ 
    success: false, 
    error: error instanceof Error ? error.message : "Failed to upload PDF" 
  }), { status: 500 });
 }
};