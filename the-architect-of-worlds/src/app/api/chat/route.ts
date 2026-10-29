import { streamText } from 'ai';
import { openrouter } from '@/lib/openai';
import { SYSTEM_PROMPT, buildContextPrompt } from '@/lib/prompts';
import universeData from '@/data/universe.json';

export async function POST(req: Request) {
  try {
    const { messages, objectId, proceduralData } = await req.json();

    let objectData = null;
    if (objectId) {
      objectData = universeData.objects.find(obj => obj.id === objectId) || proceduralData;
    }

    const contextPrompt = buildContextPrompt(objectData);

    const result = await streamText({
      model: openrouter('openai/gpt-4o-mini'), // OpenRouter standard syntax for model fallback, can be changed based on preference.
      system: `${SYSTEM_PROMPT}\n\n${contextPrompt}`,
      messages,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
