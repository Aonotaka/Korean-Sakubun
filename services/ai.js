const DEFAULT_PROVIDER = process.env.AI_PROVIDER || 'groq';

function getProvider() {
  const configured = (process.env.AI_PROVIDER || '').toLowerCase();
  if (configured) return configured;
  if (process.env.GROQ_API_KEY) return 'groq';
  if (process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY) return 'gemini';
  return 'openai';
}

function getApiKey(provider) {
  if (provider === 'groq') {
    return process.env.GROQ_API_KEY || '';
  }
  if (provider === 'gemini') {
    return process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  }
  if (provider === 'openai') {
    return process.env.OPENAI_API_KEY || '';
  }
  return '';
}

function getModel(provider) {
  return process.env.AI_MODEL || (provider === 'groq' ? 'llama-3.3-70b-versatile' : provider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini');
}

function parseJsonSafely(raw) {
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (error) {
    try {
      const firstBrace = raw.indexOf('{');
      const lastBrace = raw.lastIndexOf('}');
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
      }
    } catch (parseError) {
      return null;
    }
    return null;
  }
}

function buildChatCompletionBody({ provider, systemPrompt, userPrompt, temperature = 0.2 }) {
  const payload = {
    model: getModel(provider),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    response_format: { type: 'json_object' },
  };

  return payload;
}

async function askAi({ provider = getProvider(), systemPrompt, userPrompt, temperature = 0.2 }) {
  const selectedProvider = provider.toLowerCase();
  const apiKey = getApiKey(selectedProvider);
  if (!apiKey) {
    return null;
  }

  if (selectedProvider === 'gemini') {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${getModel(selectedProvider)}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Gemini request failed:', response.status, errorText);
        return null;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      return parseJsonSafely(text);
    } catch (error) {
      console.warn('Gemini request error:', error.message);
      return null;
    }
  }

  if (selectedProvider === 'openai') {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(buildChatCompletionBody({
          provider: selectedProvider,
          systemPrompt,
          userPrompt,
          temperature,
        })),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('OpenAI request failed:', response.status, errorText);
        return null;
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content || '{}';
      return parseJsonSafely(text);
    } catch (error) {
      console.warn('OpenAI request error:', error.message);
      return null;
    }
  }

  if (selectedProvider === 'groq') {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(buildChatCompletionBody({
          provider: selectedProvider,
          systemPrompt,
          userPrompt,
          temperature,
        })),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Groq request failed:', response.status, errorText);
        return null;
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content || '{}';
      return parseJsonSafely(text);
    } catch (error) {
      console.warn('Groq request error:', error.message);
      return null;
    }
  }

  return null;
}

module.exports = {
  askAi,
  buildChatCompletionBody,
  getProvider,
  getModel,
  DEFAULT_PROVIDER,
};
