// components/PDFUploader.tsx
"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";

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
      <h1 className="text-2xl font-bold mb-4">PDF Document Uploader</h1>
      {message && (
        <p
          className={
            message.includes("Error") ? "text-red-500" : "text-green-500"
          }
        >
          {message}
        </p>
      )}
      <form id="uploadForm" className="my-4">
        <div className="mb-4">
          <label htmlFor="fileInput" className="block mb-2">
            Select PDF file:
          </label>
          <input
            type="file"
            id="fileInput"
            accept="application/pdf"
            onChange={handleFileChange}
            className="border p-2 w-full"
          />
        </div>
        <button
          type="button"
          onClick={uploadPDF}
          disabled={!pdfFile || uploading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
        >
          {uploading ? "Uploading..." : "Upload PDF"}
        </button>
        {pdfFile && <p className="mt-2">Selected file: {pdfFile.name}</p>}
      </form>
    </div>
  );
}
