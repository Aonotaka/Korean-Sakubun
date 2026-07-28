require('dotenv').config();

const express = require('express');
const path = require('path');
const { askAi, getProvider } = require('./services/ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/generate-question', async (req, res) => {
  const { level = 'beginner', style = 'short' } = req.body;
  const provider = getProvider();

  if (!process.env.GOOGLE_AI_API_KEY && !process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    return res.json({
      prompt: '明日、友達とカフェに行きます。',
      answer: '내일 친구랑 카페에 가요.',
      hint: '「友達と」は 친구랑、「カフェ」は 카페',
    });
  }

  try {
    const result = await askAi({
      provider,
      systemPrompt:
        'You are a Korean language teaching assistant. Create one short Japanese sentence for learners and provide a natural Korean translation and a helpful hint.',
      userPrompt: `Create one ${style} Japanese sentence for a ${level} Korean learner. Return JSON with fields prompt, answer, hint.`,
      temperature: 0.7,
    });

    if (result) {
      return res.json(result);
    }

    return res.json({
      prompt: '明日、友達とカフェに行きます。',
      answer: '내일 친구랑 카페에 가요.',
      hint: '「友達と」は 친구랑、「カフェ」は 카페',
    });
  } catch (error) {
    console.error(`${provider} generation failed:`, error.message);
    res.status(500).json({ error: 'Failed to generate question' });
  }
});

app.post('/api/score-answer', async (req, res) => {
  const { prompt, modelAnswer, userAnswer, level = 'beginner' } = req.body;
  const provider = getProvider();

  if (!process.env.GOOGLE_AI_API_KEY && !process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    return res.json({
      status: '惜しい',
      score: 74,
      feedback: '自然な表現に近づいています。分かち書きと助詞を確認してください。',
      explanation: 'この文では、助詞や語尾の選び方がポイントです。',
      correctedText: modelAnswer,
      alternatives: ['自然な韓国語ならこの形が近いです', '別解: もう少し柔らかい表現も可能です'],
    });
  }

  try {
    const result = await askAi({
      provider,
      systemPrompt:
        'You are a kind Korean teacher for Japanese speakers. Evaluate the learner answer, keeping spacing flexibility in mind. Return JSON with status, score, feedback, explanation, correctedText, alternatives.',
      userPrompt: `Prompt: ${prompt}\nModel answer: ${modelAnswer}\nUser answer: ${userAnswer}\nLevel: ${level}`,
      temperature: 0.5,
    });

    if (result) {
      return res.json(result);
    }

    return res.json({
      status: '惜しい',
      score: 74,
      feedback: '自然な表現に近づいています。分かち書きと助詞を確認してください。',
      explanation: 'この文では、助詞や語尾の選び方がポイントです。',
      correctedText: modelAnswer,
      alternatives: ['自然な韓国語ならこの形が近いです', '別解: もう少し柔らかい表現も可能です'],
    });
  } catch (error) {
    console.error(`${provider} scoring failed:`, error.message);
    res.status(500).json({ error: 'Failed to score answer' });
  }
});

app.listen(PORT, () => {
  console.log(`Korean-Sakubun server running on http://localhost:${PORT}`);
});
