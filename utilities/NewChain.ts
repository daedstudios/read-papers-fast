import posthog from "posthog-js";

interface ProcessingResult {
  id: string;
  message: string;
  success: boolean;
}

// Helper function to retry failed requests once
const fetchWithRetry = async (url: string, options: RequestInit, type: string): Promise<any> => {
  try {
    const response = await fetch(url, options);
    return { type, response };
  } catch (error) {
    console.log(`${type} request failed, retrying once...`);
    // Wait a short delay before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Retry the request
    const retryResponse = await fetch(url, options);
    return { type, response: retryResponse };
  }
};

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
    setProgressMessage("Processing document in parallel...");    // Define all the fetch operations
    const processingTasks = [
      // Base API call
      fetchWithRetry("/api/base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: data.id }),
      }, "base"),

      // Keywords extraction
      fetchWithRetry("/api/vertexKeyWords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: data.id }),
      }, "keywords"),

      // Grobid document processing
      fetchWithRetry(
        `https://python-grobid-347071481430.europe-west10.run.app/process/${data.id}`,
        { method: "GET" },
        "grobid"
      ),

      // Image processing
      fetchWithRetry(
        `https://python-grobid-347071481430.europe-west10.run.app/images/${data.id}`,
        { method: "GET" },
        "images"
      ),
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
    });    // Content ordering API call
    try {
      let contentOrderResponse;
      try {
        contentOrderResponse = await fetch("/api/content-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: data.id }),
        });
        
        if (!contentOrderResponse.ok) {
          // If the first attempt fails, retry once
          console.log("Content ordering failed, retrying...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          contentOrderResponse = await fetch("/api/content-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: data.id }),
          });
        }
      } catch (error) {
        // If there's an exception (e.g., network error), retry once
        console.log("Content ordering request failed, retrying...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        contentOrderResponse = await fetch("/api/content-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: data.id }),
        });
      }

      if (!contentOrderResponse.ok) {
        console.error(
          "Content ordering failed after retry:",
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
      let imageMatchResponse;
      try {
        imageMatchResponse = await fetch("/api/image-matching", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: data.id }),
        });
        
        if (!imageMatchResponse.ok) {
          // If the first attempt fails, retry once
          console.log("Image matching failed, retrying...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          imageMatchResponse = await fetch("/api/image-matching", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: data.id }),
          });
        }
      } catch (error) {
        // If there's an exception (e.g., network error), retry once
        console.log("Image matching request failed, retrying...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        imageMatchResponse = await fetch("/api/image-matching", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: data.id }),
        });
      }

      if (!imageMatchResponse.ok) {
        console.error(
          "Image matching failed after retry:",
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
                                        