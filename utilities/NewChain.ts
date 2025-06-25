import posthog from "posthog-js";

interface ProcessingResult {
  id: string;
  message: string;
  success: boolean;
}

export const processUploadedFile = async (
  uploadedFile: File,
  setProgressMessage: (message: string) => void,
  setResult: (
    result: ProcessingResult | ((prev: any) => ProcessingResult)
  ) => void
): Promise<ProcessingResult> => {
  try {
    // Handle file upload
    const formData = new FormData();
    formData.append("file", uploadedFile);

    setProgressMessage("Uploading file...");
    const response = await fetch("/api/upload_id", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();

    // Track PDF upload event with PostHog
    posthog.capture("pdf_uploaded", {
      file_name: uploadedFile.name,
      paper_id: data.id,
    });

    console.log("Response from /api/upload_id:", data);
    setProgressMessage("Processing document...");

    setResult({
      id: data.id,
      message: "File uploaded successfully. Processing document...",
      success: false,
    });

    // Run all processing tasks in parallel
    setProgressMessage("Processing document in parallel...");

    // Define all the fetch operations
    const processingTasks = [
      // Base API call
      fetch("/api/base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: data.id }),
      }).then((res) => ({ type: "base", response: res })),

      // Keywords extraction
      fetch("/api/vertexKeyWords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: data.id }),
      }).then((res) => ({ type: "keywords", response: res })),

      // Grobid document processing
      fetch(
        `https://python-grobid-347071481430.europe-west10.run.app/process/${data.id}`,
        {
          method: "GET",
        }
      ).then((res) => ({ type: "grobid", response: res })),

      // Image processing
      fetch(
        `https://python-grobid-347071481430.europe-west10.run.app/images/${data.id}`,
        {
          method: "GET",
        }
      ).then((res) => ({ type: "images", response: res })),
    ];

    // Execute all tasks in parallel and wait for all to complete
    const results = await Promise.allSettled(processingTasks);

    // Log results
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        console.log(
          `${result.value.type} processing completed:`,
          result.value.response
        );
      } else {
        console.error(
          `${result.reason.type || "Unknown"} processing failed:`,
          result.reason
        );
      }
    });

    // Content ordering API call
    try {
      const contentOrderResponse = await fetch("/api/content-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: data.id }),
      });

      if (!contentOrderResponse.ok) {
        console.error(
          "Content ordering failed:",
          await contentOrderResponse.text()
        );
      } else {
        const contentOrderData = await contentOrderResponse.json();
        console.log("Content ordering completed:", contentOrderData);
      }
    } catch (contentOrderError) {
      console.error("Content ordering error:", contentOrderError);
      // Continue processing even if content ordering fails
    }

    // Call image-match API
    try {
      setProgressMessage("Matching images...");
      const imageMatchResponse = await fetch("/api/image-matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: data.id }),
      });

      if (!imageMatchResponse.ok) {
        console.error(
          "Image matching failed:",
          await imageMatchResponse.text()
        );
      } else {
        const imageMatchData = await imageMatchResponse.json();
        console.log("Image matching completed:", imageMatchData);
      }
    } catch (imageMatchError) {
      console.error("Image matching error:", imageMatchError);
      // Continue processing even if image matching fails
    }

    // Check if the initial upload was successful
    if (!response.ok) {
      throw new Error(data.error || "Failed to upload file");
    }

    // Final success message with success field set to true
    const finalResult = {
      id: data.id,
      message: "Analysis complete!",
      success: true,
    };

    setResult(() => finalResult);

    // Track successful analysis completion
    posthog.capture("paper_analysis_completed", {
      paper_id: data.id,
      success: true,
    });

    setProgressMessage("Analysis complete!");
    console.log("Document processing completed:", data);

    return finalResult;
  } catch (error: any) {
    console.error("Upload error:", error);

    // Track error with PostHog
    posthog.capture("paper_processing_error", {
      error_message: error.message || "Unknown error",
    });

    throw error; // Re-throw the error to be handled by the caller
  }
};
