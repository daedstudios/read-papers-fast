
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
            text: 'Extract the structure of this document and return the main categories as a JSON object with an array of sections. Each section should have a "title" and a "summary" field. The summary should be a brief 1-2 sentence description of that section. Example: {"sections": [{"title": "Introduction", "summary": "Introduces the main concepts and goals of the paper."}, {"title": "Methodology", "summary": "Describes the research approach and data collection methods."}]}',
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
