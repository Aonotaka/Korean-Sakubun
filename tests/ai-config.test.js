const assert = require('assert');
const { getModel } = require('../services/ai');
const {
  buildQuestionGenerationPrompts,
  buildReplyGenerationPrompts,
  buildScoringPrompts,
  buildReplyScoringPrompts,
  getFallbackReplyPrompt,
} = require('../server');
const { getSessionQuestionCount } = require('../services/session');

const originalAiModel = process.env.AI_MODEL;

try {
  delete process.env.AI_MODEL;

  assert.strictEqual(getModel('groq'), 'llama-3.3-70b-versatile', 'groq default model should use 70B');
  assert.strictEqual(getModel('openai'), 'gpt-4o-mini', 'openai default model should stay unchanged');

  process.env.AI_MODEL = 'custom-model-name';
  assert.strictEqual(getModel('groq'), 'custom-model-name', 'AI_MODEL override should win');

  const questionPrompts = buildQuestionGenerationPrompts('beginner', 'short');
  assert.ok(questionPrompts.systemPrompt.includes('Return valid JSON only with the fields prompt, answer, and hint.'), 'question prompt should demand JSON only');
  assert.ok(questionPrompts.systemPrompt.includes('The hint must be in Japanese'), 'question prompt should keep the hint language rule');

  const scoringPrompts = buildScoringPrompts({
    prompt: '私は毎日勉強します。',
    modelAnswer: '저는 매일 공부해요.',
    userAnswer: '저는 매일 공부합니다.',
    level: 'beginner',
  });

  assert.ok(scoringPrompts.systemPrompt.includes('Return valid JSON only.'), 'scoring prompt should demand JSON only');
  assert.ok(scoringPrompts.systemPrompt.includes('feedback and explanation must be written in Japanese.'), 'scoring prompt should keep Japanese output rule');
  assert.ok(scoringPrompts.systemPrompt.includes('Examples:'), 'scoring prompt should include few-shot examples');
  assert.ok(scoringPrompts.userPrompt.includes('User answer:'), 'scoring prompt should include the user answer');

  const replyGenerationPrompts = buildReplyGenerationPrompts('beginner');
  assert.ok(replyGenerationPrompts.systemPrompt.includes('friend message'), 'reply generation should mention friend messages');
  assert.ok(replyGenerationPrompts.systemPrompt.includes('followUp'), 'reply generation should require follow-up text');

  const chainedReplyPrompts = buildReplyGenerationPrompts('beginner', '친구: 다음에 또 보자!');
  assert.ok(chainedReplyPrompts.systemPrompt.includes('Continue naturally from this previous message'), 'reply generation should accept previous follow-up text');

  const replyScoringPrompts = buildReplyScoringPrompts({
    prompt: '友達からのメッセージ',
    situation: '친구: 오늘 저녁 시간 있어?',
    modelAnswer: '네, 가능해요.',
    userAnswer: '네, 괜찮아요.',
    level: 'beginner',
  });
  assert.ok(replyScoringPrompts.systemPrompt.includes('conversation coach'), 'reply scoring should target conversation replies');
  assert.ok(replyScoringPrompts.systemPrompt.includes('followUp'), 'reply scoring should ask for follow-up text');

  const fallbackReply = getFallbackReplyPrompt('beginner');
  assert.ok(fallbackReply.situation, 'fallback reply should contain a situation');
  assert.ok(fallbackReply.followUp, 'fallback reply should contain a follow-up message');

  assert.strictEqual(getSessionQuestionCount(5, 'translation'), 5, 'translation sessions should keep the requested count');
  assert.strictEqual(getSessionQuestionCount(5, 'reply'), 10, 'reply sessions should be longer');
  assert.strictEqual(getSessionQuestionCount(3, 'reply'), 8, 'reply sessions should have a minimum length');

  console.log('ai config tests passed');
} finally {
  if (typeof originalAiModel === 'undefined') {
    delete process.env.AI_MODEL;
  } else {
    process.env.AI_MODEL = originalAiModel;
  }
}