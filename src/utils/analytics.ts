import { DailyFocusRecord, FocusSession, SubjectFocusStat, Task } from '../types';
import { getSubjectColor } from './storage';

/**
 * Format date as YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format minutes into readable "1h 45m" or "45m"
 */
export function formatMinutesReadable(minutes: number): string {
  if (minutes <= 0) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

/**
 * Filter sessions that were completed focus sessions (excluding incomplete and breaks)
 */
export function getCompletedFocusSessions(sessions: FocusSession[]): FocusSession[] {
  return sessions.filter((s) => s.completed && s.mode === 'focus');
}

/**
 * Calculate total focus minutes for today
 */
export function getTodayFocusMinutes(sessions: FocusSession[]): number {
  const todayKey = formatDateKey(new Date());
  return getCompletedFocusSessions(sessions)
    .filter((s) => formatDateKey(new Date(s.startTime)) === todayKey)
    .reduce((acc, curr) => acc + curr.durationMinutes, 0);
}

/**
 * Count completed focus sessions today
 */
export function getTodayCompletedSessionCount(sessions: FocusSession[]): number {
  const todayKey = formatDateKey(new Date());
  return getCompletedFocusSessions(sessions).filter(
    (s) => formatDateKey(new Date(s.startTime)) === todayKey
  ).length;
}

/**
 * Calculate consecutive active study days streak
 */
export function calculateStudyStreak(sessions: FocusSession[]): { currentStreak: number; longestStreak: number } {
  const focusSessions = getCompletedFocusSessions(sessions);
  if (focusSessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Set of dates with at least one completed focus session
  const activeDates = new Set<string>();
  focusSessions.forEach((s) => {
    activeDates.add(formatDateKey(new Date(s.startTime)));
  });

  const sortedDates = Array.from(activeDates).sort();
  if (sortedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Calculate longest streak across all history
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const curDate = new Date(dateStr + 'T00:00:00');
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak += 1;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDate = curDate;
  }

  // Calculate current streak (must include today or yesterday)
  const today = new Date();
  const todayKey = formatDateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  let currentStreak = 0;
  if (activeDates.has(todayKey) || activeDates.has(yesterdayKey)) {
    let checkDate = activeDates.has(todayKey) ? today : yesterday;
    while (activeDates.has(formatDateKey(checkDate))) {
      currentStreak += 1;
      checkDate = new Date(checkDate);
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
}

/**
 * Generate weekly focus time chart records for the last 7 days
 */
export function getLast7DaysFocusRecords(
  sessions: FocusSession[],
  dailyGoalMinutes: number
): DailyFocusRecord[] {
  const records: DailyFocusRecord[] = [];
  const focusSessions = getCompletedFocusSessions(sessions);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = formatDateKey(d);
    const dayLabel = i === 0 ? 'Today' : dayNames[d.getDay()];

    const daySessions = focusSessions.filter((s) => formatDateKey(new Date(s.startTime)) === dateKey);
    const minutes = daySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    const distractionsCount = daySessions.reduce((acc, curr) => acc + (curr.distractions?.length || 0), 0);

    records.push({
      date: dateKey,
      dayLabel,
      minutes,
      sessionsCount: daySessions.length,
      distractionsCount,
      goalMet: minutes >= dailyGoalMinutes,
    });
  }

  return records;
}

/**
 * Generate 14-day study activity trend
 */
export function getLast14DaysActivityTrend(sessions: FocusSession[]) {
  const result = [];
  const focusSessions = getCompletedFocusSessions(sessions);

  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = formatDateKey(d);
    const daySessions = focusSessions.filter((s) => formatDateKey(new Date(s.startTime)) === dateKey);
    const minutes = daySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    const distractions = daySessions.reduce((acc, curr) => acc + (curr.distractions?.length || 0), 0);

    result.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      fullDate: dateKey,
      minutes,
      sessions: daySessions.length,
      distractions,
    });
  }

  return result;
}

/**
 * Calculate subject-wise study distribution
 */
export function getSubjectDistribution(sessions: FocusSession[]): SubjectFocusStat[] {
  const focusSessions = getCompletedFocusSessions(sessions);
  if (focusSessions.length === 0) return [];

  const subjectMap = new Map<string, { minutes: number; sessionsCount: number }>();
  let totalMinutes = 0;

  focusSessions.forEach((s) => {
    const subj = s.subject || 'General Study';
    const curr = subjectMap.get(subj) || { minutes: 0, sessionsCount: 0 };
    curr.minutes += s.durationMinutes;
    curr.sessionsCount += 1;
    subjectMap.set(subj, curr);
    totalMinutes += s.durationMinutes;
  });

  const stats: SubjectFocusStat[] = [];
  subjectMap.forEach((val, subject) => {
    stats.push({
      subject,
      minutes: val.minutes,
      sessionsCount: val.sessionsCount,
      percentage: totalMinutes > 0 ? Math.round((val.minutes / totalMinutes) * 100) : 0,
      color: getSubjectColor(subject),
    });
  });

  return stats.sort((a, b) => b.minutes - a.minutes);
}

/**
 * Compute key aggregate analytics metrics
 */
export function computeAnalyticsMetrics(sessions: FocusSession[], dailyGoalMinutes: number) {
  const focusSessions = getCompletedFocusSessions(sessions);
  const totalSessions = focusSessions.length;
  const totalMinutes = focusSessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const totalDistractions = focusSessions.reduce((acc, curr) => acc + (curr.distractions?.length || 0), 0);

  const avgSessionDuration = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
  const avgDistractionsPerSession =
    totalSessions > 0 ? Number((totalDistractions / totalSessions).toFixed(1)) : 0;

  // Streak
  const { currentStreak, longestStreak } = calculateStudyStreak(sessions);

  // Goal completion rate over past 30 days
  let goalDaysMet = 0;
  let activeOrPastDays = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = formatDateKey(d);
    const dayMinutes = focusSessions
      .filter((s) => formatDateKey(new Date(s.startTime)) === dateKey)
      .reduce((acc, curr) => acc + curr.durationMinutes, 0);

    if (dayMinutes > 0) {
      activeOrPastDays++;
      if (dayMinutes >= dailyGoalMinutes) {
        goalDaysMet++;
      }
    }
  }

  const goalCompletionRate = activeOrPastDays > 0 ? Math.round((goalDaysMet / activeOrPastDays) * 100) : 0;

  // Week-over-week comparison (this 7 days vs previous 7 days)
  let thisWeekMinutes = 0;
  let lastWeekMinutes = 0;
  const now = new Date();

  focusSessions.forEach((s) => {
    const sessionDate = new Date(s.startTime);
    const diffDays = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays >= 0 && diffDays < 7) {
      thisWeekMinutes += s.durationMinutes;
    } else if (diffDays >= 7 && diffDays < 14) {
      lastWeekMinutes += s.durationMinutes;
    }
  });

  let weekChangePercent: number | null = null;
  if (lastWeekMinutes > 0) {
    weekChangePercent = Math.round(((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100);
  }

  return {
    totalSessions,
    totalMinutes,
    totalDistractions,
    avgSessionDuration,
    avgDistractionsPerSession,
    currentStreak,
    longestStreak,
    goalCompletionRate,
    thisWeekMinutes,
    lastWeekMinutes,
    weekChangePercent,
  };
}

/**
 * Generate genuine motivational insights derived strictly from user's data
 */
export function generateRealInsights(
  sessions: FocusSession[],
  tasks: Task[],
  dailyGoalMinutes: number
): string[] {
  const focusSessions = getCompletedFocusSessions(sessions);
  const insights: string[] = [];

  const todayKey = formatDateKey(new Date());
  const todaySessions = focusSessions.filter((s) => formatDateKey(new Date(s.startTime)) === todayKey);
  const todayMinutes = todaySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const todayDistractions = todaySessions.reduce((acc, curr) => acc + (curr.distractions?.length || 0), 0);

  const { currentStreak } = calculateStudyStreak(sessions);

  // 1. Streak insight
  if (currentStreak >= 3) {
    insights.push(`🔥 Incredible momentum! You're on a ${currentStreak}-day focused study streak.`);
  } else if (currentStreak > 0) {
    insights.push(`✨ You have an active ${currentStreak}-day streak. Keep it going today!`);
  } else {
    insights.push(`🌱 Start a focus session today to kick off a new study streak.`);
  }

  // 2. Daily Goal insight
  if (todayMinutes >= dailyGoalMinutes) {
    insights.push(`🎯 Daily target reached! You've logged ${todayMinutes}m of focused study today.`);
  } else if (todayMinutes > 0) {
    const remaining = dailyGoalMinutes - todayMinutes;
    insights.push(`⚡ ${remaining}m left to crush your daily target of ${dailyGoalMinutes}m.`);
  }

  // 3. Distraction quality insight
  if (todaySessions.length >= 2 && todayDistractions === 0) {
    insights.push(`🛡️ Deep flow state unlocked! Zero distractions logged across today's sessions.`);
  } else if (todayDistractions > 0 && todaySessions.length > 0) {
    insights.push(`💡 ${todayDistractions} distraction${todayDistractions > 1 ? 's' : ''} noted today. Reviewing them builds self-awareness.`);
  }

  // 4. Subject focus insight
  const subjects = getSubjectDistribution(sessions);
  if (subjects.length > 0) {
    const topSubject = subjects[0];
    insights.push(`📚 ${topSubject.subject} is your top priority subject with ${formatMinutesReadable(topSubject.minutes)} logged.`);
  }

  // 5. Tasks insight
  const pendingHigh = tasks.filter((t) => !t.completed && t.priority === 'high');
  if (pendingHigh.length > 0) {
    insights.push(`📌 You have ${pendingHigh.length} high-priority task${pendingHigh.length > 1 ? 's' : ''} awaiting focused time.`);
  }

  return insights.slice(0, 3);
}
