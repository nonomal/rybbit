import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { useEffect, useMemo } from "react";
import { GetSessionsResponse } from "../../../../../api/analytics/userSessions";
import { APIResponse } from "../../../../../api/types";
import { authedFetch, getQueryParams } from "../../../../../api/utils";
import { getFilteredFilters, SESSION_PAGE_FILTERS, useStore } from "../../../../../lib/store";
import { useTimelineStore } from "../../timelineStore";
import { calculateWindowSize } from "../../timelineUtils";

export function useTimelineSessions() {
  const { time, site } = useStore();
  const { manualWindowSize, setTimeRange, setWindowSize, setAllSessions, setLoading, setError } = useTimelineStore();

  const filteredFilters = getFilteredFilters(SESSION_PAGE_FILTERS);

  // Fetch all sessions with pagination (up to 5 pages, 50k sessions total)
  const { data, isLoading, isError } = useQuery<APIResponse<GetSessionsResponse> & { hasMoreData?: boolean }>({
    queryKey: ["timeline-sessions", time, site, filteredFilters],
    queryFn: async () => {
      const allSessions = [];
      const maxPages = 5;
      const limit = 10000;
      let reachedMaxPages = false;

      for (let page = 1; page <= maxPages; page++) {
        const requestParams = {
          ...getQueryParams(time),
          filters: filteredFilters,
          page,
          limit,
        };

        const response = await authedFetch<APIResponse<GetSessionsResponse>>(`/sessions/${site}`, requestParams);

        if (response?.data) {
          allSessions.push(...response.data);

          // If we got fewer results than the limit, we've reached the end
          if (response.data.length < limit) {
            break;
          }

          // If we're on the last page and got a full page, there might be more
          if (page === maxPages && response.data.length === limit) {
            reachedMaxPages = true;
          }
        } else {
          break;
        }
      }

      // Return in the same format as the original API response
      return {
        data: allSessions,
        hasMoreData: reachedMaxPages,
      } as APIResponse<GetSessionsResponse> & { hasMoreData: boolean };
    },
    staleTime: Infinity,
  });

  const allSessions = useMemo(() => {
    if (!data?.data) return [];
    return data.data;
  }, [data]);

  // Update store with loading/error state
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    setError(isError);
  }, [isError, setError]);

  // Update store with allSessions
  useEffect(() => {
    if (allSessions.length > 0) {
      setAllSessions(allSessions, data?.hasMoreData || false);
    }
  }, [allSessions, data?.hasMoreData, setAllSessions]);

  // Calculate time range from fetched sessions and initialize timeline
  useEffect(() => {
    if (allSessions.length === 0) return;

    // Find the earliest and latest session times
    let earliest: DateTime | null = null;
    let latest: DateTime | null = null;

    allSessions.forEach(session => {
      const start = DateTime.fromSQL(session.session_start, { zone: "utc" }).toLocal();
      const end = DateTime.fromSQL(session.session_end, { zone: "utc" }).toLocal();

      if (!earliest || start < earliest) {
        earliest = start;
      }
      if (!latest || end > latest) {
        latest = end;
      }
    });

    if (earliest && latest) {
      // Only auto-calculate window size if user hasn't manually set it
      if (manualWindowSize === null) {
        const calculatedWindowSize = calculateWindowSize(earliest, latest);
        setWindowSize(calculatedWindowSize);
      }
      setTimeRange(earliest, latest);
    }
  }, [allSessions, setTimeRange, setWindowSize, manualWindowSize, time]);
}
