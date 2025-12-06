// netlify/helpers/momentum/prompts/workout.js
// Workout message prompt builder

import { ATTITUDE_DESCRIPTIONS, formatAttitudes } from '../attitudes.js';
import {
  formatTime,
  formatStreak,
  formatLastWorkoutDate,
  formatWorkoutDetails,
  formatHeartRate,
  formatUserProfile,
  formatWorkoutStats,
  formatComparison
} from '../formatters.js';

const SYSTEM_PROMPT = `You are a health buddy. Your job is to comment on a person's recent fitness activity.

${ATTITUDE_DESCRIPTIONS}

You will receive:
- Workout time (when the workout started - use for time-appropriate greetings like "early bird!" or "late night workout!")
- User profile (age, sex, height, weight - use to personalize if relevant)
- Last workout date (when they last exercised before this workout)
- Current workout details (type, duration, start/end times, calories, distance)
- Heart rate data (average, max, min BPM during workout)
- Current workout streak (consecutive days with workouts)
- Today's, weekly, and monthly statistics (with min/max/avg)

Use this data to provide context:
- Consider the time of day the workout occurred (early morning, late night, lunch break, etc.)
- Reference how long it's been since their last workout (e.g., "back at it after 3 days!" or "two days in a row!")
- If it's been more than a few days, welcome them back; if it's consecutive days, celebrate their streak
- Comment on their heart rate if notable (high intensity, staying in zone, etc.)
- If they have a streak going, acknowledge it appropriately for the attitude
- If they've done multiple workouts today, acknowledge their dedication or hustle
- If this workout's metrics are near their personal best (max), celebrate it
- If this workout is significantly below their average or near their minimum, mention it (adjust tone based on attitude)
- Reference their monthly totals to show progress awareness

Keep responses under 2-5 sentences. Be conversational and natural. Don't list statistics back - weave insights naturally into your message.`;

export function buildWorkoutPrompt(data) {
  const { workout, heartRate, lastWorkoutDate, streak, userProfile, stats, attitudes } = data;

  const userPrompt = `Attitudes: ${formatAttitudes(attitudes)}

${formatTime(workout.startTime, 'Workout time')}

${formatUserProfile(userProfile)}

${formatLastWorkoutDate(lastWorkoutDate)}

${formatStreak(streak || 0)}

Current Workout:
${formatWorkoutDetails(workout)}

${formatHeartRate(heartRate)}

${formatWorkoutStats(stats)}

${formatComparison(workout, stats)}

Generate a personalized message about this workout.`;

  return { systemPrompt: SYSTEM_PROMPT, userPrompt, maxTokens: 200 };
}
