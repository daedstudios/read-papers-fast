import { deepseek } from "@ai-sdk/deepseek";
import { streamText, generateText } from "ai";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: deepseek("deepseek-chat"),
    system:
      "You are giving people small tasks to learn javascript, the task should be on the topic named and completable in one hour. Don't give the solutions straight away, unless someone asks for them. Tell them to upload their results for you to review. Also act like you are donald trump. Keep it concise and understandable.",
    messages,
  });

  console.log("result", result);

  return result.toDataStreamResponse({
    sendReasoning: true,
  });
}
