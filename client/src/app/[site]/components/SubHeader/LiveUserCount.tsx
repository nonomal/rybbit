import NumberFlow from "@number-flow/react";
import { useGetLiveUserCount } from "../../../../api/analytics/hooks/useGetLiveUserCount";
import { useGetSessions } from "../../../../api/analytics/hooks/useGetUserSessions";
import { Button } from "../../../../components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../../../../components/ui/drawer";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../../components/ui/tooltip";
import { SessionsList } from "../../../../components/Sessions/SessionsList";
import { useState } from "react";

export function LiveUserCount() {
  const { data } = useGetLiveUserCount(5);
  const [page, setPage] = useState(1);

  const { data: sessions, isLoading: isLoadingSessions } = useGetSessions({
    timeOverride: {
      mode: "past-minutes",
      pastMinutesStart: 5,
      pastMinutesEnd: 0,
    },
    page: page,
    limit: 10,
  });

  console.log(sessions);
  return (
    <Drawer>
      <DrawerTrigger>
        <Tooltip>
          <TooltipTrigger>
            <Button className="h-8" variant="ghost">
              <div className="flex items-center gap-1 text-base text-neutral-700 dark:text-neutral-200 cursor-pointer">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                </span>
                <span className="text-sm text-neutral-700 dark:text-neutral-200 ml-1 font-medium">
                  {<NumberFlow respectMotionPreference={false} value={data?.count ?? 0} />}
                </span>
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Users online in past 5 minutes</p>
          </TooltipContent>
        </Tooltip>
      </DrawerTrigger>
      <DrawerContent>
        {/* <DrawerHeader>
          <DrawerTitle>Are you absolutely sure?</DrawerTitle>
          <DrawerDescription>This action cannot be undone.</DrawerDescription>
        </DrawerHeader> */}
        <div className="p-2 md:p-4  overflow-y-auto">
          <SessionsList
            sessions={sessions?.data || []}
            isLoading={isLoadingSessions}
            page={page}
            onPageChange={setPage}
            hasNextPage={sessions?.data?.length === 10}
            hasPrevPage={page > 1}
            pageSize={10}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
