// netlify/functions/momentum_summary.js
// Generates morning/evening summary messages for Momentum app

import { createHandler, buildMorningSummaryPrompt, buildEveningSummaryPrompt, callOpenAI } from '../helpers/momentum/index.js';

const VALID_TYPES = ['morning', 'evening'];

export const handler = createHandler({
  validate: (data) => {
    if (!data.type || !VALID_TYPES.includes(data.type)) {
      return 'Missing or invalid field: type (must be "morning" or "evening")';
    }
    return null;
  },
  process: async (data) => {
    const promptBuilder = data.type === 'morning' ? buildMorningSummaryPrompt : buildEveningSummaryPrompt;
    const { systemPrompt, userPrompt, maxTokens } = promptBuilder(data);
    const message = await callOpenAI(systemPrompt, userPrompt, maxTokens);
    return { message };
  }
});
