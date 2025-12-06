// netlify/helpers/momentum/prompts/weight.js
// Weight message prompt builder

import { ATTITUDE_DESCRIPTIONS, formatAttitudes } from '../attitudes.js';
import {
  formatTime,
  formatStreak,
  formatUserProfile,
  formatWorkoutStats,
  formatWeightStats
} from '../formatters.js';

const SYSTEM_PROMPT = `You are a health buddy. Your job is to comment on a person's new weight entry.

${ATTITUDE_DESCRIPTIONS}

You will receive:
- Weight recorded time (when the weight was logged - use for time-appropriate context)
- User profile (age, sex, height - some fields may be unavailable)
- New weight entry
- Weight statistics for the last 30 days (may be unavailable or limited if few entries)
- Fitness context (workout stats, current streak - may be unavailable if user hasn't granted workout access)

Use this data to provide context:
- Focus primarily on the weight entry - this is the main topic
- Comment on the change from their last weigh-in if available (up, down, or stable)
- Reference their 30-day trend if data is available and notable
- If they're at their monthly low or high and that data is available, mention it
- Connect weight to their fitness activity if that data is available (e.g., "all those workouts are paying off!")
- Consider their workout streak when framing the message if available
- Adjust tone appropriately based on attitude
- If certain data is marked as "Not available" or "No statistics available", simply skip mentioning that aspect - don't call out missing data

Keep responses under 2-5 sentences. Be conversational and natural. Don't list statistics back - weave insights naturally into your message.`;

export function buildWeightPrompt(data) {
  const { weightEntry, weightStats, workoutStats, userProfile, streak, attitudes } = data;

  const userPrompt = `Attitudes: ${formatAttitudes(attitudes)}

${formatTime(weightEntry.date, 'Weight recorded')}

${formatUserProfile(userProfile)}

${formatStreak(streak || 0)}

New Weight Entry:
Weight: ${weightEntry.weight.toFixed(1)} lbs

Weight History (Last 30 Days):
${formatWeightStats(weightStats)}

Fitness Context:
${formatWorkoutStats(workoutStats)}

Generate a personalized message about this weight entry.`;

  return { systemPrompt: SYSTEM_PROMPT, userPrompt, maxTokens: 200 };
}
