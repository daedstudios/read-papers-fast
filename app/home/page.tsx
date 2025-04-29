// components/PDFUploader.tsx
"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Plus } from "lucide-react";
import Image from "next/image";

export default function PDFUploader() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    error,
    setData,
    data,
    setMessages,
    setInput,
    stop,
    status,
  } = useChat({
    api: "/api/vertex",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      // Only accept PDF files
      if (selectedFile.type === "application/pdf") {
        setPdfFile(selectedFile);
        setMessage("");
      } else {
        setPdfFile(null);
        setMessage("Please select a PDF file only");
      }
    }
  };

  const uploadPDF = async () => {
    if (!pdfFile) {
      setMessage("Please select a PDF file to upload");
      return;
    }

    setUploading(true);
    setMessage("Uploading...");

    // Prepare FormData
    const formData = new FormData();

    // Append the PDF file to the FormData object
    formData.append("pdf", pdfFile);

    // Setup the fetch request options
    const requestOptions: RequestInit = {
      method: "POST",
      body: formData,
    };

    // Send the request to your API endpoint
    try {
      const response = await fetch("/api/pdf-upload", requestOptions);
      if (!response.ok) throw new Error("Failed to upload");
      const data = await response.json();
      setMessage("Upload successful!");
      console.log("Upload successful:", data);
    } catch (error) {
      setMessage("Error uploading PDF");
      console.error("Error uploading PDF:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="pdf-container">
      <div className="p-[1rem] text-[1.25rem] text-foreground font-medium">
        readpapersfast.ai
      </div>

      <div className="flex flex-col justify-center pt-[16rem] mx-auto md:w-[42rem] px-[1rem] md:px-0">
        <h1 className="justify-center text-[2.25rem] font-medium mb-[2rem]">
          Read research papers 10x faster
        </h1>
        {message && (
          <p
            className={
              message.includes("Error") ? "text-red-500" : "text-green-500"
            }
          >
            {message}
          </p>
        )}
        <form id="uploadForm" className="flex flex-wrap justify-end gap-2">
          <input
            type="file"
            id="fileInput"
            accept="application/pdf"
            onChange={handleFileChange}
            className="border h-[2.25rem] px-[1rem] w-full rounded-[3rem] text-white"
          />

          <div className="flex flex-row w-[2.25rem] h-[2.25rem] border  rounded-[3rem] text-foreground items-center text-center">
            <Plus
              size={24}
              className="justify-center mx-auto hover:cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={uploadPDF}
            disabled={!pdfFile || uploading}
            className="bg-blue-500 text-background  px-[4rem] h-[2.25rem] rounded-[3rem] disabled:bg-foreground hover:disabled:bg-muted-foreground hover:cursor-pointer"
          >
            {uploading ? "Uploading..." : "upload"}
          </button>
          {pdfFile && <p className="mt-2">Selected file: {pdfFile.name}</p>}
        </form>
      </div>
      <div className="flex w-full flex-col items-center pt-[6rem] text-[1rem]">
        trusted by students of
        <div className="flex flex-row gap-12 pt-[1rem]">
          <Image
            src="/maastricht.svg"
            alt="maastricht"
            width={280}
            height={36}
            className="opacity-40"
          ></Image>
          {/* <Image
            src="/passau.svg"
            alt="maastricht"
            width={240}
            height={36}
            className="opacity-40"
          ></Image>
          <Image
            src="/uci.svg"
            alt="maastricht"
            width={64}
            height={36}
            className="opacity-40"
          ></Image> */}
        </div>
      </div>
    </div>
  );
}
