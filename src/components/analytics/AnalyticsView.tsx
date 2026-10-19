import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart2,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  PieChart as PieIcon,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  computeAnalyticsMetrics,
  formatMinutesReadable,
  getLast14DaysActivityTrend,
  getLast7DaysFocusRecords,
  getSubjectDistribution,
} from '../../utils/analytics';

export const AnalyticsView: React.FC = () => {
  const { sessions, settings, setActiveTab } = useApp();

  const metrics = computeAnalyticsMetrics(sessions, settings.dailyGoalMinutes);
  const weeklyRecords = getLast7DaysFocusRecords(sessions, settings.dailyGoalMinutes);
  const activityTrend = getLast14DaysActivityTrend(sessions);
  const subjectDistribution = getSubjectDistribution(sessions);

  const hasData = metrics.totalSessions > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Analytics & Insights
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real data-driven productivity metrics, focus stamina trends, and subject distribution.
          </p>
        </div>

        {hasData && metrics.weekChangePercent !== null && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium">
            <span className="text-slate-500 dark:text-slate-400">7-Day Momentum:</span>
            {metrics.weekChangePercent >= 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center font-mono tabular-nums">
                <ArrowUpRight className="w-3.5 h-3.5" />+{metrics.weekChangePercent}% vs prior week
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center font-mono tabular-nums">
                <ArrowDownRight className="w-3.5 h-3.5" />{metrics.weekChangePercent}% vs prior week
              </span>
            )}
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="p-16 text-center rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No focus activity to analyze yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Complete your first 25-minute Pomodoro study block to start generating real weekly charts, distraction metrics, and streak milestones.
          </p>
          <button
            onClick={() => setActiveTab('timer')}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm shadow-purple-900/30 transition-all hover:scale-[1.02]"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Start First Focus Session</span>
          </button>
        </div>
      ) : (
        <>
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Current & Longest Streak */}
            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold">Study Streak</span>
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                {metrics.currentStreak} <span className="text-xs font-normal text-slate-400">days</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                All-time longest: <span className="font-semibold text-slate-700 dark:text-slate-300">{metrics.longestStreak} days</span>
              </div>
            </div>

            {/* Total Focused Time */}
            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold">Total Focused Time</span>
                <Clock className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                {formatMinutesReadable(metrics.totalMinutes)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                {metrics.totalSessions} completed sessions
              </div>
            </div>

            {/* Average Session Duration */}
            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold">Avg Session Length</span>
                <Target className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                {metrics.avgSessionDuration} <span className="text-xs font-normal text-slate-400">min</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                Goal: {settings.focusDurationMinutes} min sprints
              </div>
            </div>

            {/* Distraction Rate */}
            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold">Distractions / Session</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                {metrics.avgDistractionsPerSession}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                {metrics.totalDistractions} total logged
              </div>
            </div>
          </div>

          {/* Charts Row 1: Weekly Focus Minutes + Subject Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Bar Chart (2 columns) */}
            <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Weekly Study Time (Last 7 Days)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Focused study minutes per day. Target: {settings.dailyGoalMinutes}m daily.
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyRecords} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="dayLabel"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-3 bg-slate-900 dark:bg-slate-950 text-white rounded-lg border border-slate-800 shadow-xl text-xs">
                              <p className="font-semibold">{data.dayLabel} ({data.date})</p>
                              <p className="font-mono tabular-nums text-purple-400 mt-1">
                                Study Time: {formatMinutesReadable(data.minutes)}
                              </p>
                              <p className="font-mono tabular-nums text-slate-400 text-[11px]">
                                Sessions: {data.sessionsCount} · Distractions: {data.distractionsCount}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="minutes"
                      fill="#8B5CF6"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subject Distribution Donut Chart (1 column) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Subject Breakdown
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Proportion of focused study time by academic topic.
                </p>
              </div>

              {subjectDistribution.length > 0 ? (
                <>
                  <div className="h-44 w-full my-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={subjectDistribution}
                          dataKey="minutes"
                          nameKey="subject"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                        >
                          {subjectDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload as (typeof subjectDistribution)[0];
                              return (
                                <div className="p-2.5 bg-slate-900 text-white rounded-lg shadow-xl text-xs border border-slate-800">
                                  <p className="font-bold">{d.subject}</p>
                                  <p className="font-mono tabular-nums text-purple-400">
                                    {formatMinutesReadable(d.minutes)} ({d.percentage}%)
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {subjectDistribution.map((item) => (
                      <div
                        key={item.subject}
                        className="flex items-center justify-between text-xs py-1"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                            {item.subject}
                          </span>
                        </div>
                        <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400 text-[11px] shrink-0">
                          {formatMinutesReadable(item.minutes)} ({item.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No subject data available yet.
                </div>
              )}
            </div>
          </div>

          {/* Charts Row 2: 14-Day Activity Trend Area Chart */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  14-Day Consistency Curve
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Long-term trend of daily study duration and stamina.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Study Minutes
                </span>
              </div>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 bg-slate-900 text-white rounded-lg border border-slate-800 shadow-xl text-xs">
                            <p className="font-semibold">{data.fullDate}</p>
                            <p className="font-mono tabular-nums text-purple-400 mt-1">
                              Duration: {formatMinutesReadable(data.minutes)}
                            </p>
                            <p className="font-mono tabular-nums text-slate-400 text-[11px]">
                              Sessions: {data.sessions} · Distractions: {data.distractions}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="#8B5CF6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorMinutes)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
