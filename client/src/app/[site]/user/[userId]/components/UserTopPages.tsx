import { useParams } from "next/navigation";
import { useGetSite } from "../../../../../api/admin/sites";
import { usePaginatedMetric } from "../../../../../api/analytics/useGetMetric";
import { Card, CardContent, CardLoader } from "../../../../../components/ui/card";
import { truncateString } from "../../../../../lib/utils";
import { StandardSection } from "../../../components/shared/StandardSection/StandardSection";

export function UserTopPages() {
  const { userId } = useParams();

  const { data, isLoading, isFetching, error, refetch } = usePaginatedMetric({
    parameter: "pathname",
    limit: 100,
    page: 1,
  });
  const { data: siteMetadata } = useGetSite();

  const itemsForDisplay = data?.data;

  const ratio = itemsForDisplay?.[0]?.percentage ? 100 / itemsForDisplay[0].percentage : 1;

  //   return (
  //     <Card className="h-[405px]">
  //       <CardContent className="mt-2">
  //         <h2 className="text-lg font-medium">Top Pages</h2>
  //       </CardContent>
  //     </Card>
  //   );

  return (
    <Card className="h-[405px]">
      <CardContent className="mt-2">
        <StandardSection
          filterParameter="pathname"
          title="Pages"
          getValue={e => e.value}
          getKey={e => e.value}
          getLabel={e => truncateString(e.value, 50) || "Other"}
          getLink={e => `https://${siteMetadata?.domain}${e.value}`}
          expanded={false}
          close={close}
          additionalFilters={[{ parameter: "user_id", value: [userId as string], type: "equals" }]}
        />
      </CardContent>
    </Card>
  );
}
