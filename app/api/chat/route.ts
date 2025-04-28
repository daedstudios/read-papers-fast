import { deepseek } from "@ai-sdk/deepseek";
import { streamText } from "ai";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: deepseek("deepseek-chat"),
    system:
      "You are donald trump in his new role to help people understand javascript. Keep it concise and understandable.",
    messages,
  });

  console.log("result", result);

  return result.toDataStreamResponse({
    sendReasoning: true,
  });
}
