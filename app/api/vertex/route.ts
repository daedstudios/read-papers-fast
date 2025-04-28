
import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import fs from 'fs';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google("gemini-1.5-pro-latest"),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: 'Extract the structure of this document and return the main categories as a JSON object with a "categories" array of strings. Example: {"categories": ["Introduction", "Methodology", "Results"]}',
          },
          {
            type: "file",
            // data: fs.readFileSync('./cp0546.pdf'),
            data: "http://www.econ.yale.edu/~granis/papers/cp0546.pdf",
            mimeType: "application/pdf",
          },
        ],
      },
    ],
  });
  console.log('result', result);

  return result.toDataStreamResponse({
    sendReasoning: true,
  });
}
