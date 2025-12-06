import { Filter } from "@rybbit/shared";
import { useQuery } from "@tanstack/react-query";
import { Time } from "../../../components/DateSelector/types";
import { EVENT_FILTERS } from "../../../lib/filterGroups";
import { getFilteredFilters, useStore } from "../../../lib/store";
import { authedFetch, getQueryParams } from "../../utils";

export type OutboundLink = {
  url: string;
  count: number;
  lastClicked: string;
};

export function useGetOutboundLinks() {
  const { site, time, filters } = useStore();

  const timeParams = getQueryParams(time);
  const filteredFilters = getFilteredFilters(EVENT_FILTERS);

  return useQuery({
    queryKey: ["outbound-links", site, timeParams, filteredFilters],
    enabled: !!site,
    queryFn: () => {
      const params = {
        ...timeParams,
        filters: filteredFilters.length > 0 ? filteredFilters : undefined,
      };

      return authedFetch<{ data: OutboundLink[] }>(`/events/outbound/${site}`, params).then(res => res.data);
    },
  });
}

/**
 * Standalone fetch function for outbound links (used for exports)
 */
export async function fetchOutboundLinks(
  site: number | string,
  time: Time,
  filters: Filter[] = []
): Promise<OutboundLink[]> {
  const timeParams = getQueryParams(time);
  const params = {
    ...timeParams,
    filters: filters.length > 0 ? filters : undefined,
  };
  const response = await authedFetch<{ data: OutboundLink[] }>(
    `/events/outbound/${site}`,
    params
  );
  return response.data;
}
