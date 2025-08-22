// This file is a serverless function that acts as a secure proxy.
// It's intended to be deployed in a server environment (e.g., Vercel, Netlify).
import { GoogleGenAI, Content } from "@google/genai";
import { ChatMessage, FileData, ChatRole, GroundingSource } from '../types.ts';

// Helper to build the conversation history in the format expected by the Gemini API
function buildHistory(history: ChatMessage[]): Content[] {
    return history.map((msg: ChatMessage) => ({
        role: msg.role === ChatRole.User ? 'user' : 'model',
        parts: msg.parts.map(part => {
             if (part.fileData) {
                return {
                    inlineData: {
                        mimeType: part.fileData.mimeType,
                        data: part.fileData.data,
                    },
                };
            }
            return { text: part.text || '' };
        }),
    }));
}

// The main handler for the serverless function.
// It uses the standard Request and Response API.
export default async function handler(req: Request): Promise<Response> {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  // Ensure the API key is configured on the server
  if (!process.env.API_KEY) {
    return new Response(JSON.stringify({ error: 'API_KEY environment variable not set on server.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  
  try {
    // Parse the request body from the frontend
    const { prompt, file, history, useGoogleSearch } = await req.json();
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Format the previous conversation history
    const contents = buildHistory(history);

    // Add the new user message (prompt and any file) to the contents
    const userParts = [];
    if (file) {
      userParts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
    }
    userParts.push({ text: prompt });
    contents.push({ role: 'user', parts: userParts });

    // Call the Gemini API with the conversation contents and configuration
    const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            tools: useGoogleSearch ? [{ googleSearch: {} }] : undefined,
        },
    });

    // Create a new readable stream to pipe the Gemini response back to the client
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of responseStream) {
          let groundingSources: GroundingSource[] = [];
          const metadata = chunk.candidates?.[0]?.groundingMetadata;

          // Extract grounding sources if they exist
          if (metadata?.groundingChunks) {
              groundingSources = metadata.groundingChunks
                  .map((c: any) => ({ uri: c.web?.uri, title: c.web?.title }))
                  .filter((s: any): s is GroundingSource => s.uri && s.title);
          }
          
          const responseChunk = {
            text: chunk.text,
            sources: groundingSources.length > 0 ? groundingSources : null,
          };
          
          // Stream the data as newline-delimited JSON
          controller.enqueue(encoder.encode(JSON.stringify(responseChunk) + '\n'));
        }
        controller.close();
      }
    });

    // Return the stream as the response
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'no-cache',
      }
    });

  } catch (error: any) {
    console.error('Error in API route:', error);
    const errorMessage = error.message || 'An internal server error occurred.';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}