import type { ChatMessage, FileData, GroundingSource } from '../types.ts';

interface StreamChunk {
    text: string;
    sources: GroundingSource[] | null;
}

export async function* streamChat(
    prompt: string, 
    file: FileData | null, 
    history: ChatMessage[], 
    useGoogleSearch: boolean
): AsyncGenerator<StreamChunk> {
    
    // Call our own backend proxy instead of the Google API directly
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt,
            file,
            history,
            useGoogleSearch,
        }),
    });

    if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred while fetching the stream.' }));
        throw new Error(`API request failed: ${errorData.error || response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // Read and process the streaming response from the backend
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            // Process any remaining data in the buffer
            if (buffer.trim()) {
                try {
                    yield JSON.parse(buffer);
                } catch (e) {
                    console.error('Error parsing final chunk:', buffer, e);
                }
            }
            break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        
        // The last item might be a partial line, so keep it in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.trim()) {
                try {
                    yield JSON.parse(line);
                } catch (e) {
                    console.error('Error parsing stream line:', line, e);
                }
            }
        }
    }
}