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
  const { activityType, duration, calories, distance, startTime, endTime } = workout;
  const durationMinutes = Math.round(duration / 60);

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  const startFormatted = startDate.toLocaleString('en-US', timeOptions);
  const endFormatted = endDate.toLocaleString('en-US', timeOptions);

  let details = `${activityType} for ${durationMinutes} minutes (started ${startFormatted}, ended ${endFormatted})`;

  if (calories > 0) {
    details += `, burned ${Math.round(calories)} calories`;
  }

  if (distance > 0) {
    details += `, covered ${distance.toFixed(1)} miles`;
  }

  return details;
}

export function formatComparison(workout, stats) {
  const monthlyStats = stats?.monthly?.statsByType?.[workout.activityType];

  if (!monthlyStats) {
    return `This is their first ${workout.activityType} workout in the last 30 days!`;
  }

  const { calories, distance, duration } = workout;
  const durationMinutes = duration / 60;
  const comparisons = [];

  if (monthlyStats.averageCalories > 0 && calories > 0) {
    const calorieDiff = ((calories - monthlyStats.averageCalories) / monthlyStats.averageCalories) * 100;
    if (calorieDiff < -20) {
      comparisons.push(`Calories are ${Math.abs(Math.round(calorieDiff))}% below your average`);
    } else if (calorieDiff > 20) {
      comparisons.push(`Calories are ${Math.round(calorieDiff)}% above your average`);
    }
  }

  if (monthlyStats.averageDistance > 0 && distance > 0) {
    const distanceDiff = ((distance - monthlyStats.averageDistance) / monthlyStats.averageDistance) * 100;
    if (distanceDiff < -20) {
      comparisons.push(`Distance is ${Math.abs(Math.round(distanceDiff))}% below your average`);
    } else if (distanceDiff > 20) {
      comparisons.push(`Distance is ${Math.round(distanceDiff)}% above your average`);
    }
  }

  if (monthlyStats.averageDuration > 0) {
    const durationDiff = ((durationMinutes - monthlyStats.averageDuration) / monthlyStats.averageDuration) * 100;
    if (durationDiff < -20) {
      comparisons.push(`Duration is ${Math.abs(Math.round(durationDiff))}% below your average`);
    } else if (durationDiff > 20) {
      comparisons.push(`Duration is ${Math.round(durationDiff)}% above your average`);
    }
  }

  if (comparisons.length === 0) {
    return `This workout is right around your typical ${workout.activityType} performance.`;
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

    const types = Object.entries(period.statsByType || {})
      .map(([type, data]) => {
        let line = `  - ${type}: ${data.count} workout(s)`;
        if (data.totalCalories > 0) line += `, ${Math.round(data.totalCalories)} cal`;
        if (data.totalDistance > 0) line += `, ${data.totalDistance.toFixed(1)} mi`;
        if (data.totalDuration > 0) line += `, ${Math.round(data.totalDuration / 60)} min`;
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

  const totalCalories = Object.values(today.statsByType || {}).reduce((sum, s) => sum + (s.totalCalories || 0), 0);
  const totalDuration = Object.values(today.statsByType || {}).reduce((sum, s) => sum + (s.totalDuration || 0), 0);

  return `${today.totalWorkouts} workout(s), ${Math.round(totalCalories)} calories burned, ${Math.round(totalDuration / 60)} minutes total`;
}

export function formatYesterdayWorkouts(stats) {
  const yesterday = stats?.today;
  if (!yesterday || yesterday.totalWorkouts === 0) {
    return 'No workouts recorded yesterday - rest day!';
  }

  const totalCalories = Object.values(yesterday.statsByType || {}).reduce((sum, s) => sum + (s.totalCalories || 0), 0);
  const totalDuration = Object.values(yesterday.statsByType || {}).reduce((sum, s) => sum + (s.totalDuration || 0), 0);

  return `${yesterday.totalWorkouts} workout(s), ${Math.round(totalCalories)} calories burned, ${Math.round(totalDuration / 60)} minutes total`;
}
