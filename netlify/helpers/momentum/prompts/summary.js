// netlify/helpers/momentum/prompts/summary.js
// Daily summary prompt builders (morning & evening)

import { ATTITUDE_DESCRIPTIONS, formatAttitudes } from '../attitudes.js';
import {
  formatTime,
  formatStreak,
  formatUserProfile,
  formatWorkoutStats,
  formatWeightStats,
  formatTodayWorkouts,
  formatYesterdayWorkouts
} from '../formatters.js';

const MORNING_SYSTEM_PROMPT = `You are a health buddy delivering a morning motivation message.

${ATTITUDE_DESCRIPTIONS}

You will receive:
- User profile (age, sex, height, weight - some fields may be unavailable)
- Yesterday's workout activity (may be unavailable if user hasn't granted workout access)
- Weekly and monthly workout statistics (may be unavailable or partial)
- Current workout streak
- Weight trends for the last 30 days (may be unavailable if user hasn't granted weight access)

Your job is to:
- Greet them for the morning
- Briefly recap yesterday's activity if available (or lack thereof)
- Motivate them for the day ahead
- Reference their streak or overall progress if data is available
- Keep it short and punchy - this is a notification they'll glance at
- If certain data is marked as "Not available" or "No statistics available", simply skip mentioning that aspect - don't call out missing data

Keep responses to 2-3 sentences max. Be conversational and natural.`;

const EVENING_SYSTEM_PROMPT = `You are a health buddy delivering an end-of-day summary message.

${ATTITUDE_DESCRIPTIONS}

You will receive:
- User profile (age, sex, height, weight - some fields may be unavailable)
- Today's workout activity (may be unavailable if user hasn't granted workout access)
- Weekly and monthly workout statistics (may be unavailable or partial)
- Current workout streak
- Weight trends for the last 30 days (may be unavailable if user hasn't granted weight access)

Your job is to:
- Wrap up their day with a summary
- Highlight what they accomplished today if data is available (or call out if they skipped)
- Comment on their streak status
- Set them up for tomorrow
- Keep it short and punchy - this is a notification they'll glance at
- If certain data is marked as "Not available" or "No statistics available", simply skip mentioning that aspect - don't call out missing data

Keep responses to 2-3 sentences max. Be conversational and natural.`;

export function buildMorningSummaryPrompt(data) {
  const { workoutStats, weightStats, userProfile, streak, attitudes } = data;

  const userPrompt = `Attitudes: ${formatAttitudes(attitudes)}

${formatTime(new Date().toISOString(), 'Current time')}

${formatUserProfile(userProfile)}

${formatStreak(streak || 0)}

Yesterday's Activity:
${formatYesterdayWorkouts(workoutStats)}

Overall Stats:
${formatWorkoutStats(workoutStats)}

Weight Trends:
${formatWeightStats(weightStats)}

Generate a morning motivation message.`;

  return { systemPrompt: MORNING_SYSTEM_PROMPT, userPrompt, maxTokens: 150 };
}

export function buildEveningSummaryPrompt(data) {
  const { workoutStats, weightStats, userProfile, streak, attitudes } = data;

  const userPrompt = `Attitudes: ${formatAttitudes(attitudes)}

${formatTime(new Date().toISOString(), 'Current time')}

${formatUserProfile(userProfile)}

${formatStreak(streak || 0)}

Today's Activity:
${formatTodayWorkouts(workoutStats)}

Overall Stats:
${formatWorkoutStats(workoutStats)}

Weight Trends:
${formatWeightStats(weightStats)}

Generate an end-of-day summary message.`;

  return { systemPrompt: EVENING_SYSTEM_PROMPT, userPrompt, maxTokens: 150 };
}
