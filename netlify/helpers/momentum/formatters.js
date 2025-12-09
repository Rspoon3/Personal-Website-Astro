// netlify/helpers/momentum/formatters.js
// Formatting utilities for Momentum prompts

export function formatTime(dateString, label = 'Time') {
  const date = new Date(dateString);
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  return `${label}: ${date.toLocaleString('en-US', options)}`;
}

export function formatStreak(streak) {
  if (streak === 0) {
    return 'Workout streak: Starting fresh (no consecutive days yet)';
  } else if (streak === 1) {
    return 'Workout streak: 1 day';
  }
  return `Workout streak: ${streak} consecutive days`;
}

export function formatLastWorkoutDate(lastWorkoutDate) {
  if (!lastWorkoutDate) {
    return 'Last workout: This is their first recorded workout!';
  }
  return formatTime(lastWorkoutDate, 'Last workout');
}

export function formatWorkoutDetails(workout) {
  if (!workout) return 'No workout data available';

  const { activityType, duration, calories, distance, startTime, endTime } = workout;
  const durationMinutes = Math.round((duration || 0) / 60);

  const startDate = startTime ? new Date(startTime) : null;
  const endDate = endTime ? new Date(endTime) : null;
  const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

  let details = `${activityType || 'Workout'} for ${durationMinutes} minutes`;

  if (startDate && endDate) {
    const startFormatted = startDate.toLocaleString('en-US', timeOptions);
    const endFormatted = endDate.toLocaleString('en-US', timeOptions);
    details += ` (started ${startFormatted}, ended ${endFormatted})`;
  }

  // Only include calories if data is available (user granted access)
  if (calories != null && calories > 0) {
    details += `, burned ${Math.round(calories)} calories`;
  }

  // Only include distance if data is available
  if (distance != null && distance > 0) {
    details += `, covered ${distance.toFixed(1)} miles`;
  }

  return details;
}

export function formatComparison(workout, stats) {
  if (!workout) return 'No comparison data available';

  const activityType = workout.activityType || 'workout';
  const monthlyStats = stats?.monthly?.statsByType?.[activityType];

  if (!monthlyStats) {
    return `This is their first ${activityType} workout in the last 30 days!`;
  }

  const { calories, distance, duration } = workout;
  const durationMinutes = (duration || 0) / 60;
  const comparisons = [];

  // Only compare calories if both current and historical data available
  if (monthlyStats.averageCalories > 0 && calories != null && calories > 0) {
    const calorieDiff = ((calories - monthlyStats.averageCalories) / monthlyStats.averageCalories) * 100;
    if (calorieDiff < -20) {
      comparisons.push(`Calories are ${Math.abs(Math.round(calorieDiff))}% below your average`);
    } else if (calorieDiff > 20) {
      comparisons.push(`Calories are ${Math.round(calorieDiff)}% above your average`);
    }
  }

  // Only compare distance if both current and historical data available
  if (monthlyStats.averageDistance > 0 && distance != null && distance > 0) {
    const distanceDiff = ((distance - monthlyStats.averageDistance) / monthlyStats.averageDistance) * 100;
    if (distanceDiff < -20) {
      comparisons.push(`Distance is ${Math.abs(Math.round(distanceDiff))}% below your average`);
    } else if (distanceDiff > 20) {
      comparisons.push(`Distance is ${Math.round(distanceDiff)}% above your average`);
    }
  }

  // Duration comparison (always available from workout)
  if (monthlyStats.averageDuration > 0 && durationMinutes > 0) {
    const durationDiff = ((durationMinutes - monthlyStats.averageDuration) / monthlyStats.averageDuration) * 100;
    if (durationDiff < -20) {
      comparisons.push(`Duration is ${Math.abs(Math.round(durationDiff))}% below your average`);
    } else if (durationDiff > 20) {
      comparisons.push(`Duration is ${Math.round(durationDiff)}% above your average`);
    }
  }

  if (comparisons.length === 0) {
    return `This workout is right around your typical ${activityType} performance.`;
  }

  return 'Comparison to your averages: ' + comparisons.join('. ') + '.';
}

export function formatHeartRate(heartRate) {
  if (!heartRate || (!heartRate.avg && !heartRate.max && !heartRate.min)) {
    return 'Heart rate data: Not available';
  }

  const parts = [];
  if (heartRate.avg) parts.push(`Average: ${heartRate.avg} BPM`);
  if (heartRate.max) parts.push(`Max: ${heartRate.max} BPM`);
  if (heartRate.min) parts.push(`Min: ${heartRate.min} BPM`);

  return 'Heart rate: ' + parts.join(', ');
}

export function formatUserProfile(profile) {
  const parts = [];
  if (profile.age) parts.push(`Age: ${profile.age}`);
  if (profile.sex) parts.push(`Sex: ${profile.sex}`);
  if (profile.height) parts.push(`Height: ${Math.floor(profile.height / 12)}' ${profile.height % 12}"`);
  if (profile.weight) parts.push(`Weight: ${Math.round(profile.weight)} lbs`);

  return 'User Profile:\n' + parts.join('\n');
}

export function formatWorkoutStats(stats) {
  if (!stats) return 'No workout statistics available';

  const formatPeriod = (period, label) => {
    if (!period || period.totalWorkouts === 0) {
      return `${label}: No workouts`;
    }

    const statsByType = period.statsByType || {};
    if (Object.keys(statsByType).length === 0) {
      return `${label}: ${period.totalWorkouts} workout(s)`;
    }

    const types = Object.entries(statsByType)
      .map(([type, data]) => {
        let line = `  - ${type}: ${data.count || 0} workout(s)`;
        // Only include calories if data is available (user granted access)
        if (data.totalCalories != null && data.totalCalories > 0) {
          line += `, ${Math.round(data.totalCalories)} cal`;
        }
        // Only include distance if data is available
        if (data.totalDistance != null && data.totalDistance > 0) {
          line += `, ${data.totalDistance.toFixed(1)} mi`;
        }
        // Duration is always available
        if (data.totalDuration != null && data.totalDuration > 0) {
          line += `, ${Math.round(data.totalDuration / 60)} min`;
        }
        return line;
      })
      .join('\n');

    return `${label}: ${period.totalWorkouts} total workout(s)\n${types}`;
  };

  return [
    formatPeriod(stats.today, 'Today'),
    formatPeriod(stats.weekly, 'This Week'),
    formatPeriod(stats.monthly, 'This Month')
  ].join('\n\n');
}

export function formatWeightStats(weightStats) {
  if (!weightStats) return 'No weight statistics available';

  const parts = [];
  if (weightStats.currentWeight) parts.push(`Current: ${weightStats.currentWeight.toFixed(1)} lbs`);
  if (weightStats.changeFromPrevious !== undefined) {
    const dir = weightStats.changeFromPrevious > 0 ? '+' : '';
    parts.push(`Change from last: ${dir}${weightStats.changeFromPrevious.toFixed(1)} lbs`);
  }
  if (weightStats.changeFromMonthAgo !== undefined) {
    const dir = weightStats.changeFromMonthAgo > 0 ? '+' : '';
    parts.push(`Change from 30 days ago: ${dir}${weightStats.changeFromMonthAgo.toFixed(1)} lbs`);
  }
  if (weightStats.min && weightStats.max) {
    parts.push(`30-day range: ${weightStats.min.toFixed(1)} - ${weightStats.max.toFixed(1)} lbs`);
  }
  if (weightStats.average) parts.push(`30-day average: ${weightStats.average.toFixed(1)} lbs`);
  if (weightStats.entryCount) parts.push(`Total entries: ${weightStats.entryCount}`);

  return 'Weight Stats (Last 30 Days):\n' + parts.join('\n');
}

export function formatTodayWorkouts(stats) {
  const today = stats?.today;
  if (!today || today.totalWorkouts === 0) {
    return 'No workouts recorded today yet';
  }

  const statsByType = today.statsByType || {};
  const totalCalories = Object.values(statsByType).reduce((sum, s) => sum + (s.totalCalories || 0), 0);
  const totalDuration = Object.values(statsByType).reduce((sum, s) => sum + (s.totalDuration || 0), 0);

  let summary = `${today.totalWorkouts} workout(s)`;

  // Only include calories if data is available
  if (totalCalories > 0) {
    summary += `, ${Math.round(totalCalories)} calories burned`;
  }

  summary += `, ${Math.round(totalDuration / 60)} minutes total`;

  return summary;
}

export function formatYesterdayWorkouts(stats) {
  const yesterday = stats?.yesterday || stats?.today; // fallback to today for backwards compatibility
  if (!yesterday || yesterday.totalWorkouts === 0) {
    return 'No workouts recorded yesterday - rest day!';
  }

  const statsByType = yesterday.statsByType || {};
  const totalCalories = Object.values(statsByType).reduce((sum, s) => sum + (s.totalCalories || 0), 0);
  const totalDuration = Object.values(statsByType).reduce((sum, s) => sum + (s.totalDuration || 0), 0);

  let summary = `${yesterday.totalWorkouts} workout(s)`;

  // Only include calories if data is available
  if (totalCalories > 0) {
    summary += `, ${Math.round(totalCalories)} calories burned`;
  }

  summary += `, ${Math.round(totalDuration / 60)} minutes total`;

  return summary;
}

export function formatStepStats(stepStats) {
  if (!stepStats) return 'Step data: Not available';

  const parts = [];
  if (stepStats.totalSteps != null) parts.push(`Today's total steps: ${stepStats.totalSteps.toLocaleString()}`);
  if (stepStats.maxHourlySteps != null) parts.push(`Max hourly steps: ${stepStats.maxHourlySteps.toLocaleString()}`);
  if (stepStats.minHourlySteps != null) parts.push(`Min hourly steps: ${stepStats.minHourlySteps.toLocaleString()}`);
  if (stepStats.averageHourlySteps != null) parts.push(`Average hourly steps: ${stepStats.averageHourlySteps.toLocaleString()}`);

  if (parts.length === 0) return 'Step data: Not available';

  return parts.join('\n');
}
