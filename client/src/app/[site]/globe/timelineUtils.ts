import { DateTime } from "luxon";
import { GetSessionsResponse } from "../../../api/analytics/userSessions";

/**
 * Calculate the appropriate window size in minutes based on the total time range
 */
export function calculateWindowSize(startTime: DateTime, endTime: DateTime): number {
  const diffInMinutes = endTime.diff(startTime, "minutes").minutes;

  if (diffInMinutes <= 4320) {
    // 3 days or less: 3 hour windows
    return 60;
  } else if (diffInMinutes <= 10080) {
    // 1 week or less: 3 hour windows
    return 180;
  } else if (diffInMinutes <= 43200) {
    // 30 days or less: 6 hour windows
    return 360;
  } else {
    // More than 30 days: 1 day windows
    return 1440;
  }
}

/**
 * Available window size options for the dropdown
 */
export const WINDOW_SIZE_OPTIONS = [
  { value: 1, label: "1 minute" },
  { value: 5, label: "5 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 180, label: "3 hours" },
  { value: 360, label: "6 hours" },
  { value: 720, label: "12 hours" },
  { value: 1440, label: "1 day" },
  { value: 4320, label: "3 days" },
];

/**
 * Generate time windows for the timeline scrubber
 */
export function generateTimeWindows(startTime: DateTime, endTime: DateTime, windowSize: number): DateTime[] {
  const windows: DateTime[] = [];
  let currentTime = startTime;

  while (currentTime <= endTime) {
    windows.push(currentTime);
    currentTime = currentTime.plus({ minutes: windowSize });
  }

  return windows;
}

/**
 * Check if a session overlaps with a given time window
 */
export function sessionOverlapsWindow(
  session: GetSessionsResponse[number],
  windowStart: DateTime,
  windowEnd: DateTime
): boolean {
  const sessionStart = DateTime.fromSQL(session.session_start, { zone: "utc" }).toLocal();
  const sessionEnd = DateTime.fromSQL(session.session_end, { zone: "utc" }).toLocal();

  // Session overlaps if:
  // - It starts before the window ends AND
  // - It ends after the window starts
  return sessionStart < windowEnd && sessionEnd > windowStart;
}

/**
 * Filter sessions that are active during a specific time window
 */
export function getActiveSessions(
  sessions: GetSessionsResponse,
  windowStart: DateTime,
  windowSize: number
): GetSessionsResponse {
  const windowEnd = windowStart.plus({ minutes: windowSize });

  return sessions.filter(session => sessionOverlapsWindow(session, windowStart, windowEnd));
}

/**
 * Optimized function to count sessions per time window
 * Uses parsing once + sorting + binary search for significant speedup
 */
export function getSessionCountsPerWindow(
  sessions: GetSessionsResponse,
  timeWindows: DateTime[],
  windowSize: number
): number[] {
  // Parse all session times once upfront
  const parsedSessions = sessions.map(session => ({
    start: DateTime.fromSQL(session.session_start, { zone: "utc" }).toLocal(),
    end: DateTime.fromSQL(session.session_end, { zone: "utc" }).toLocal(),
  }));

  // Sort sessions by start time for efficient searching
  parsedSessions.sort((a, b) => a.start.toMillis() - b.start.toMillis());

  // Binary search to find first session that could overlap with a window
  const findFirstOverlapping = (windowStart: DateTime): number => {
    let left = 0;
    let right = parsedSessions.length;

    // Find first session where session.end > windowStart
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (parsedSessions[mid].end <= windowStart) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    return left;
  };

  // Count sessions for each window
  const counts = timeWindows.map(windowStart => {
    const windowEnd = windowStart.plus({ minutes: windowSize });
    let count = 0;

    // Start from first potentially overlapping session
    const startIdx = findFirstOverlapping(windowStart);

    // Count until sessions can no longer overlap
    for (let i = startIdx; i < parsedSessions.length; i++) {
      const session = parsedSessions[i];

      // If session starts after window ends, no more sessions can overlap
      if (session.start >= windowEnd) {
        break;
      }

      // Session overlaps if it starts before window ends AND ends after window starts
      if (session.start < windowEnd && session.end > windowStart) {
        count++;
      }
    }

    return count;
  });

  return counts;
}

/**
 * Format time for display in the timeline
 */
export function formatTimelineTime(time: DateTime, windowSize: number): string {
  if (windowSize < 60) {
    // Less than 1 hour: show time
    return time.toFormat("HH:mm");
  } else if (windowSize < 1440) {
    // Less than 1 day: show date and time
    return time.toFormat("MMM d, HH:mm");
  } else {
    // 1 day or more: show date only
    return time.toFormat("MMM d");
  }
}
