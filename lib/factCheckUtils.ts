import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const FactCheckPreEvalSchema = z.object({
  verdict: z.enum(["supports", "contradicts", "neutral", "not_relevant"]),

  summary: z.string(),
  snippet: z.string(),
});

export async function preEvaluateAbstract(
  statement: string,
  abstract: string,
  title?: string,
  detectedLanguage?: string
) {
  if (!statement || !abstract) {
    throw new Error("Missing statement or abstract");
  }

  // Step 1: Detect language using Gemini (only if not provided)
  let language = detectedLanguage || "EN";

  const prompt = `
IMPORTANT: Respond in ${language}. Do NOT use any other language.

You are an expert scientific fact-checker. Given a user statement and a paper abstract, classify whether the abstract SUPPORTS, CONTRADICTS, is NEUTRAL, or is NOT RELEVANT regarding the statement. Be strict: only mark as supports or contradicts if the abstract clearly takes a position. Mark as neutral if the abstract discusses the topic but does not support or contradict the statement. If the abstract does NOT discuss the statement or topic at all, respond with 'not_relevant' for the verdict.

Statement: "${statement}"
${
  title
    ? `Paper title: "${title}"
`
    : ""
}
Abstract: "${abstract}"

IMPORTANT: Repeat: Your entire response (including explanations, summaries, and all output) must be in ${language}. Do NOT use English unless the statement is in English.

Example:
Statement: "氣候變遷是人為造成的"
Response: "證據顯示氣候變遷主要是由人類活動造成的。..."

Respond in this JSON format:
{

  "verdict": "supports" | "contradicts" | "neutral" | "not_relevant",
  "summary": "A 1-2 sentence explanation of why the abstract supports, contradicts, is neutral, or is not relevant regarding the statement. Do NOT start with phrases like 'The abstract' or 'This paper'; instead, directly state the key finding or reasoning. If the abstract contains any numbers, statistics, or quantitative results that relate to the statement, mention them specifically in your explanation.",

  "snippet": "The single most relevant sentence or phrase from the abstract that best supports your verdict. This should be a direct quote from the abstract, not a paraphrase. If no clear snippet exists, return an empty string."
}
`;

  try {
    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001"),
      schema: FactCheckPreEvalSchema,
      prompt,
    });

    return object;
  } catch (error) {
    throw new Error(`Failed to pre-evaluate fact-check: ${error}`);
  }
}

// Helper function to detect the language of a statement
export async function detectLanguage(statement: string): Promise<string> {
  const detectLanguagePrompt = `Detect the language of the following statement and return only the language name (e.g., English, Chinese, German, French):\n\nStatement: "${statement}"`;

  try {
    const { object: langObj } = await generateObject({
      model: google("gemini-1.5-flash"),
      schema: z.object({ language: z.string() }),
      prompt: detectLanguagePrompt,
    });
    return langObj.language || "the same language as the statement";
  } catch (e) {
    console.log("Language detection fallback used");
    return "the same language as the statement";
  }
}

// Utility functions for fact-check data handling

export const getShareableUrl = (
  shareableId: string,
  baseUrl?: string
): string => {
  const base =
    baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/fact-check/shared/${shareableId}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
    return false;
  }
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getSupportLevelColor = (supportLevel: string): string => {
  switch (supportLevel) {
    case "strongly_supports":
      return "bg-green-100 text-green-800";
    case "supports":
      return "bg-green-50 text-green-700";
    case "neutral":
      return "bg-gray-100 text-gray-800";
    case "contradicts":
      return "bg-red-50 text-red-700";
    case "strongly_contradicts":
      return "bg-red-100 text-red-800";
    case "insufficient_data":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getSupportLevelText = (supportLevel: string): string => {
  switch (supportLevel) {
    case "strongly_supports":
      return "Strongly Supports";
    case "supports":
      return "Supports";
    case "neutral":
      return "Neutral";
    case "contradicts":
      return "Contradicts";
    case "strongly_contradicts":
      return "Strongly Contradicts";
    case "insufficient_data":
      return "Insufficient Data";
    default:
      return "Unknown";
  }
};
