import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const MODELS = {
  complex: process.env.GROQ_MODEL_COMPLEX || 'llama-3.3-70b-versatile',
  fast: process.env.GROQ_MODEL_FAST || 'llama-3.1-8b-instant',
  default: process.env.GROQ_MODEL_DEFAULT || 'llama-3.3-70b-versatile',
  vision: 'llama-3.2-90b-vision-preview',
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
      if (err.status === 429 || err.status === 503 || err.status === 400) continue;
      throw err;
    }
  }
  throw lastError || new Error('Groq fallback failed');
}

export async function analyzeImage(base64Image, userMessage = '') {
  const prompt = userMessage || `Analiza esta imagen. Si es una lista de productos con precios, devuelven un JSON asi:
{"productos": [{"nombre": "Lechuga", "emoji": "🥬", "precio": 1500, "unidad": "kg"}]}

Si es un pedido escrito a mano, devuelven un JSON asi:
{"pedido": [{"producto": "Zanahoria", "cantidad": 10}, {"producto": "Tomate", "cantidad": 5}]}

Si no es ninguna de las dos, responde con texto normal explicando que viste.

Solo devuelve el JSON, sin explicaciones adicionales.`;

  const response = await client.chat.completions.create({
    model: MODELS.vision,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64Image}` }
          }
        ]
      }
    ],
    temperature: 0.1,
    max_tokens: 1024,
  });

  return response.choices[0].message.content;
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
