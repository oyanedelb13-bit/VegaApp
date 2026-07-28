import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const MODELS = {
  complex: process.env.GROQ_MODEL_COMPLEX || 'llama-3.3-70b-versatile',
  fast: process.env.GROQ_MODEL_FAST || 'llama-3.1-8b-instant',
  default: process.env.GROQ_MODEL_DEFAULT || 'llama-3.3-70b-versatile',
};

export async function callGroqWithFallback({ messages, tools, tool_choice = 'auto', temperature = 0.1, max_tokens = 1024, model }) {
  const tryModels = model ? [model, MODELS.fast] : [MODELS.default, MODELS.fast];
  let lastError = null;

  for (const m of tryModels) {
    try {
      return await client.chat.completions.create({
        model: m,
        messages,
        tools,
        tool_choice,
        temperature,
        max_tokens,
      });
    } catch (err) {
      lastError = err;
      if (err.status === 429 || err.status === 503) continue;
      throw err;
    }
  }
  throw lastError || new Error('Groq fallback failed');
}

export async function transcribeAudio(audioBuffer, filename = 'audio.webm') {
  const file = new File([audioBuffer], filename, { type: 'audio/webm' });
  const transcription = await client.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    language: 'es',
    response_format: 'text',
  });
  return typeof transcription === 'string' ? transcription : transcription.text;
}

export { client as groqClient, MODELS };
