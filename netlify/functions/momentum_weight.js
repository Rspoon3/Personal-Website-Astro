// netlify/functions/momentum_weight.js
// Generates personalized weight entry messages for Momentum app

import { createHandler, buildWeightPrompt, callOpenAI } from '../helpers/momentum/index.js';

export const handler = createHandler({
  validate: (data) => {
    if (!data.weightEntry) return 'Missing required field: weightEntry';
    return null;
  },
  process: async (data) => {
    const { systemPrompt, userPrompt, maxTokens } = buildWeightPrompt(data);
    const message = await callOpenAI(systemPrompt, userPrompt, maxTokens);
    return { message };
  }
});
