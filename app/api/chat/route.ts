import { streamText } from "ai";
import { xai } from "@ai-sdk/xai";
import type { NextRequest } from "next/server";

interface FileMetadata {
  name: string;
  size: number;
  type: string;
  content?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, fileContext, requestProcessing } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Messages are required", { status: 400 });
    }

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return new Response("XAI_API_KEY is not configured", { status: 500 });
    }

    // Build system prompt with file context if available
    let systemPrompt = `You are a Guardian Bank Assistant. You help with:
- Account and transaction review
- Document and statement analysis
- Customer support workflow guidance
- Secure banking operations assistance
- Data quality checks and structured report summaries

Be professional, precise, and helpful. When analyzing data or files, provide clear insights and actionable recommendations.`;

    if (fileContext) {
      systemPrompt += `\n\nThe user has uploaded files. Here is the context:\n${fileContext}`;
    }

    // If processing is requested, add additional instruction
    if (requestProcessing) {
      systemPrompt += `\n\nIMPORTANT: The user is asking you to process files. After providing analysis, format your response with a section like:

PROCESSED_DATA_JSON:
{
  "format": "csv|json|text",
  "data": [your processed data here],
  "filename": "suggested_filename"
}

This allows the user to download the processed results in their desired format.`;
    }

    const result = streamText({
      model: xai("grok-3"),
      messages,
      system: systemPrompt,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response("Failed to generate response", { status: 500 });
  }
}
