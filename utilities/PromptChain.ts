// PromptChain.ts - Utility for handling API requests to AI services

/**
 * Function to read file as base64
 * @param file - File to convert to base64 string
 * @returns Promise with base64 string
 */
export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        // Remove data URL prefix if present
        const base64String = reader.result.includes("base64,")
          ? reader.result.split("base64,")[1]
          : reader.result;
        resolve(base64String);
      } else {
        reject(new Error("Failed to read file as base64"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

/**
 * Function to start both requests in parallel and return a promise with combined results
 * @param documentUrl - URL of document to analyze (optional)
 * @param uploadedFile - File to analyze (optional)
 * @returns Promise with the combined results
 */
export const initiateRequests = async (
  documentUrl: string | null,
  uploadedFile: File | null
) => {
  if (!documentUrl && !uploadedFile) {
    throw new Error("Please provide a PDF URL or upload a file");
  }

  let requestBody;
  if (uploadedFile) {
    const fileData = await readFileAsBase64(uploadedFile);
    requestBody = JSON.stringify({ fileData, fileName: uploadedFile.name });
  } else {
    requestBody = JSON.stringify({ documentUrl });
  }

  // Start both requests in parallel
  const vertexPromise = fetch("/api/vertex", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: requestBody,
  });

  const keywordsPromise = fetch("/api/vertexKeyWords", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: requestBody,
  });

  // Wait for both requests to complete
  const [vertexResponse, keywordsResponse] = await Promise.all([
    vertexPromise,
    keywordsPromise,
  ]);

  // Process vertex response
  if (!vertexResponse.ok) {
    const errorData = await vertexResponse.json();
    throw new Error(
      errorData.message ||
        `Vertex API responded with status: ${vertexResponse.status}`
    );
  }
  const vertexData = await vertexResponse.json();

  // Process keywords response
  let keywordsData = null;
  if (keywordsResponse.ok) {
    keywordsData = await keywordsResponse.json();
  } else {
    console.error("Keywords extraction failed, continuing without keywords");
  }

  // Combine both results
  console.log("keywordsData:", keywordsData);
  return {
    ...vertexData,
    keywords: keywordsData?.success ? keywordsData.acronyms : [],
  };
};
