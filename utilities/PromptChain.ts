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
 * Function to make sequential API calls to process a document
 * First calls base endpoint to create paper record, then uses the ID for vertex endpoints
 * @param documentUrl - URL of document to analyze (optional)
 * @param uploadedFile - File to analyze (optional)
 * @returns Promise with the combined results
 */
export const initiateRequests = async (documentUrl: string | null, uploadedFile: File | null) => {
  if (!documentUrl && !uploadedFile) {
    throw new Error("Please provide a PDF URL or upload a file");
  }

  // Prepare request body
  let requestBody;
  if (uploadedFile) {
    const fileData = await readFileAsBase64(uploadedFile);
    requestBody = JSON.stringify({ fileData, fileName: uploadedFile.name });
  } else {
    requestBody = JSON.stringify({ documentUrl });
  }

  // STEP 1: Call base endpoint to extract basic info and create DB record
  console.log("Step 1: Creating paper record with basic information...");
  const baseResponse = await fetch("/api/base", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: requestBody,
  });

  if (!baseResponse.ok) {
    const errorData = await baseResponse.json();
    throw new Error(
      errorData.message ||
        `Base API responded with status: ${baseResponse.status}`
    );
  }

  const baseData = await baseResponse.json();

  if (!baseData.success || !baseData.paperSummaryId) {
    throw new Error("Failed to create paper record or get paper ID");
  }

  const paperSummaryId = baseData.paperSummaryId;
  console.log(`Paper record created with ID: ${paperSummaryId}`);

  // STEP 2: Call vertex and vertexKeyWords endpoints in parallel with the paper ID
  console.log("Step 2: Extracting sections and keywords...");

  // Add the paper ID to the request body
  const enrichedRequestBody = JSON.stringify({
    ...JSON.parse(requestBody),
    paperSummaryId: paperSummaryId,
  });

  // Start both requests in parallel
  const vertexPromise = fetch("/api/vertex", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: enrichedRequestBody,
  });

  // Call vertex endpoint first
  console.log("Extracting sections...");
  const vertexResponse = await fetch("/api/vertex", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: enrichedRequestBody,
  });

  // Call keywords endpoint after vertex completes
  console.log("Extracting keywords...");
  const keywordsResponse = await fetch("/api/vertexKeyWords", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: enrichedRequestBody,
  });

  // Process vertex response
  let vertexData = null;
  if (vertexResponse.ok) {
    vertexData = await vertexResponse.json();
  } else {
    console.error("Section extraction failed");
    const errorData = await vertexResponse.json().catch(() => ({}));
    console.error(
      errorData.message ||
        `Vertex API responded with status: ${vertexResponse.status}`
    );
  }

  // Process keywords response
  let keywordsData = null;
  if (keywordsResponse.ok) {
    keywordsData = await keywordsResponse.json();
  } else {
    console.error("Keywords extraction failed");
    const errorData = await keywordsResponse.json().catch(() => ({}));
    console.error(
      errorData.message ||
        `Keywords API responded with status: ${keywordsResponse.status}`
    );
  }

  // Combine all results into a single response object
  return {
    // success: true,
    // paperSummaryId: paperSummaryId,
    // paperInfo: baseData.paperInfo || {},
    // sections: vertexData?.paperSummary?.sections || [],
    // keywords: keywordsData?.success ? keywordsData.acronyms : [],
    // hasKeywords: !!keywordsData?.success,
    // hasSections: !!vertexData?.success,
    ...vertexData,
  };
};
