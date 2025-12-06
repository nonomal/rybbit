import { Filter } from "@rybbit/shared";
import { useQuery } from "@tanstack/react-query";
import { Time } from "../../../components/DateSelector/types";
import { EVENT_FILTERS } from "../../../lib/filterGroups";
import { getFilteredFilters, useStore } from "../../../lib/store";
import { authedFetch, getQueryParams } from "../../utils";

export type EventName = {
  eventName: string;
  count: number;
};

export function useGetEventNames() {
  const { site, time, filters } = useStore();

  const timeParams = getQueryParams(time);
  const filteredFilters = getFilteredFilters(EVENT_FILTERS);

  return useQuery({
    queryKey: ["event-names", site, timeParams, filteredFilters],
    enabled: !!site,
    queryFn: () => {
      const params = {
        ...timeParams,
        filters: filteredFilters.length > 0 ? filteredFilters : undefined,
      };

      return authedFetch<{ data: EventName[] }>(`/events/names/${site}`, params).then(res => res.data);
    },
  });
}

/**
 * Standalone fetch function for event names (used for exports)
 */
export async function fetchEventNames(
  site: number | string,
  time: Time,
  filters: Filter[] = []
): Promise<EventName[]> {
  const timeParams = getQueryParams(time);
  const params = {
    ...timeParams,
    filters: filters.length > 0 ? filters : undefined,
  };
  const response = await authedFetch<{ data: EventName[] }>(
    `/events/names/${site}`,
    params
  );
  return response.data;
}
