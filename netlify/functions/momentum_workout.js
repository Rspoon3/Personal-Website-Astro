// netlify/functions/momentum_workout.js
// Generates personalized workout messages for Momentum app

import { createHandler, buildWorkoutPrompt, callOpenAI } from '../helpers/momentum/index.js';

export const handler = createHandler({
  validate: (data) => {
    if (!data.workout) return 'Missing required field: workout';
    return null;
  },
  process: async (data) => {
    const { systemPrompt, userPrompt, maxTokens } = buildWorkoutPrompt(data);
    const message = await callOpenAI(systemPrompt, userPrompt, maxTokens);
    return { message };
  }
});
