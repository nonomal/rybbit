"use client";

import { SessionsList } from "@/components/Sessions/SessionsList";
import {
  ArrowLeft,
  Calendar,
  CalendarCheck,
  Clock,
  Files,
  Globe,
  Laptop,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { DateTime } from "luxon";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useUserInfo } from "../../../../api/analytics/userGetInfo";
import { useGetSessions, useGetUserSessionCount } from "../../../../api/analytics/useGetUserSessions";
import { Avatar, generateName } from "../../../../components/Avatar";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Skeleton } from "../../../../components/ui/skeleton";
import { IdentifiedBadge } from "../../../../components/IdentifiedBadge";
import { useSetPageTitle } from "../../../../hooks/useSetPageTitle";
import { formatDuration } from "../../../../lib/dateTimeUtils";
import { useGetRegionName } from "../../../../lib/geo";
import { getCountryName, getLanguageName } from "../../../../lib/utils";
import { Browser } from "../../components/shared/icons/Browser";
import { CountryFlag } from "../../components/shared/icons/CountryFlag";
import { OperatingSystem } from "../../components/shared/icons/OperatingSystem";
import { MobileSidebar } from "../../components/Sidebar/MobileSidebar";
import { VisitCalendar } from "./components/Calendar";
import { EventIcon, PageviewIcon } from "../../../../components/EventIcons";

const LIMIT = 25;

// Reusable card wrapper for sidebar sections
function SidebarCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-850 p-4 ${className}`}
    >
      {children}
    </div>
  );
}

// Info row component for consistent styling
function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-neutral-50 dark:border-neutral-800 last:border-0">
      <span className="text-neutral-500 dark:text-neutral-400 text-xs flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className="text-neutral-700 dark:text-neutral-200 text-sm">{value}</span>
    </div>
  );
}

// Stat card component
function StatCard({
  icon,
  label,
  value,
  isLoading,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-1">
        <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
          <Skeleton className="w-3 h-3" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-5 w-14" />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1 uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

export default function UserPage() {
  useSetPageTitle("Rybbit · User");

  const router = useRouter();
  const { userId } = useParams();
  const { site } = useParams();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useUserInfo(Number(site), userId as string);

  const { data: sessionCount } = useGetUserSessionCount(userId as string);

  const { data: sessionsData, isLoading: isLoadingSessions } = useGetSessions(userId as string, page, LIMIT + 1);
  const allSessions = sessionsData?.data || [];
  const hasNextPage = allSessions.length > LIMIT;
  const sessions = allSessions.slice(0, LIMIT);
  const hasPrevPage = page > 1;

  const { getRegionName } = useGetRegionName();

  const handleBackClick = () => {
    router.push(`/${site}/users`);
  };

  // Get display name from traits if available, otherwise generate from ID
  const traitsUsername = data?.traits?.username as string | undefined;
  const traitsName = data?.traits?.name as string | undefined;
  const traitsEmail = data?.traits?.email as string | undefined;
  const isIdentified = data?.is_identified ?? false;
  const displayName =
    traitsUsername || traitsName || (isIdentified ? (userId as string) : generateName(userId as string));

  // Filter custom traits (exclude username, name, email)
  const customTraits = data?.traits
    ? Object.entries(data.traits).filter(([key]) => !["username", "name", "email"].includes(key))
    : [];

  return (
    <div className="p-2 md:p-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <MobileSidebar />
        <Button onClick={handleBackClick} className="w-max" variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Button>
      </div>

      {/* Main two-column layout */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left Sidebar */}
        <div className="w-full md:w-[300px] md:shrink-0 space-y-3">
          {/* User Profile Header */}
          <div className="flex flex-col">
            <Avatar size={64} id={userId as string} />
            <div className="mt-3 w-full">
              <div className="font-semibold text-lg flex items-center gap-2">
                {isLoading ? <Skeleton className="h-6 w-32" /> : displayName}
                {!isLoading && isIdentified && <IdentifiedBadge traits={data?.traits} />}
              </div>
              {isLoading ? (
                <div className="flex flex-col items-center gap-1 mt-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ) : (
                <>
                  {traitsEmail && (
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-0.5">{traitsEmail}</p>
                  )}
                  <p className="text-neutral-400 dark:text-neutral-500 text-xs font-mono mt-1 truncate">{userId}</p>
                </>
              )}
            </div>
            {data?.ip && (
              <Badge variant="outline" className="mt-3 text-xs">
                IP: {data.ip}
              </Badge>
            )}
          </div>

          {/* Stats Grid */}
          <SidebarCard>
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={<Files className="w-3 h-3" />}
                label="Sessions"
                value={data?.sessions ?? "—"}
                isLoading={isLoading}
              />
              <StatCard
                icon={<PageviewIcon className="w-3 h-3" />}
                label="Pageviews"
                value={data?.pageviews ?? "—"}
                isLoading={isLoading}
              />
              <StatCard
                icon={<EventIcon className="w-3 h-3" />}
                label="Events"
                value={data?.events ?? "—"}
                isLoading={isLoading}
              />
              <StatCard
                icon={<Clock className="w-3 h-3" />}
                label="Avg Duration"
                value={data?.duration ? formatDuration(data.duration) : "—"}
                isLoading={isLoading}
              />
              <StatCard
                icon={<Calendar className="w-3 h-3" />}
                label="First Seen"
                value={
                  data?.first_seen
                    ? DateTime.fromSQL(data.first_seen, { zone: "utc" }).toLocal().toLocaleString(DateTime.DATE_MED)
                    : "—"
                }
                isLoading={isLoading}
              />
              <StatCard
                icon={<CalendarCheck className="w-3 h-3" />}
                label="Last Seen"
                value={
                  data?.last_seen
                    ? DateTime.fromSQL(data.last_seen, { zone: "utc" }).toLocal().toLocaleString(DateTime.DATE_MED)
                    : "—"
                }
                isLoading={isLoading}
              />
            </div>
          </SidebarCard>

          {/* Location & Device Info */}
          <SidebarCard>
            <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
              Location & Device
            </h3>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <InfoRow
                  icon={<CountryFlag country={data?.country || ""} className="w-3 h-3" />}
                  label="Country"
                  value={data?.country ? getCountryName(data.country) : "—"}
                />
                <InfoRow
                  icon={<Globe className="w-3 h-3" />}
                  label="Region"
                  value={
                    <span className="truncate max-w-[140px] inline-block">
                      {data?.region ? getRegionName(data.region) : "—"}
                      {data?.city && `, ${data.city}`}
                    </span>
                  }
                />
                <InfoRow label="Language" value={data?.language ? getLanguageName(data.language) : "—"} />
                <InfoRow
                  icon={
                    data?.device_type === "Desktop" ? (
                      <Monitor className="w-3 h-3" />
                    ) : data?.device_type === "Mobile" ? (
                      <Smartphone className="w-3 h-3" />
                    ) : data?.device_type === "Tablet" ? (
                      <Tablet className="w-3 h-3" />
                    ) : null
                  }
                  label="Device"
                  value={data?.device_type ?? "—"}
                />
                <InfoRow
                  icon={<Browser browser={data?.browser || "Unknown"} size={12} />}
                  label="Browser"
                  value={
                    data?.browser ? `${data.browser}${data.browser_version ? ` v${data.browser_version}` : ""}` : "—"
                  }
                />
                <InfoRow
                  icon={<OperatingSystem os={data?.operating_system || ""} size={12} />}
                  label="OS"
                  value={
                    data?.operating_system
                      ? `${data.operating_system}${data.operating_system_version ? ` v${data.operating_system_version}` : ""}`
                      : "—"
                  }
                />
                <InfoRow
                  label="Screen"
                  value={data?.screen_width && data?.screen_height ? `${data.screen_width}×${data.screen_height}` : "—"}
                />
              </div>
            )}
          </SidebarCard>

          {/* Activity Calendar */}
          <SidebarCard className="h-[160px]">
            <VisitCalendar sessionCount={sessionCount?.data ?? []} />
          </SidebarCard>

          {/* User Traits (identified users only) */}
          {isIdentified && customTraits.length > 0 && (
            <SidebarCard>
              <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
                User Traits
              </h3>
              <div className="space-y-1">
                {customTraits.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-1 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                  >
                    <span className="text-neutral-500 dark:text-neutral-400 text-xs capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="text-neutral-700 dark:text-neutral-200 text-sm truncate max-w-[160px]">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </SidebarCard>
          )}

          {/* Linked Devices (identified users only) */}
          {isIdentified && data?.linked_devices && data.linked_devices.length > 0 && (
            <SidebarCard>
              <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Laptop className="w-3 h-3" />
                Linked Devices ({data.linked_devices.length})
              </h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {data.linked_devices.map(device => (
                  <div
                    key={device.anonymous_id}
                    className="flex items-center justify-between py-1 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                  >
                    <span className="text-neutral-600 dark:text-neutral-300 font-mono text-xs truncate max-w-[140px]">
                      {device.anonymous_id}
                    </span>
                    <span className="text-neutral-400 dark:text-neutral-500 text-xs">
                      {DateTime.fromISO(device.created_at).toRelative()}
                    </span>
                  </div>
                ))}
              </div>
            </SidebarCard>
          )}
        </div>

        {/* Right Content - Sessions */}
        <div className="flex-1 min-w-0">
          <SessionsList
            sessions={sessions}
            isLoading={isLoadingSessions}
            page={page}
            onPageChange={setPage}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            userId={userId as string}
          />
        </div>
      </div>
    </div>
  );
}
